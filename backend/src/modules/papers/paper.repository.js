const { query, transaction } = require("../../config/db");

function buildPaperFilters({ filter, topic_id: topicId }) {
  const whereClauses = [];
  const params = [];

  if (filter === "recent") {
    whereClauses.push(
      "COALESCE(p.published_date, p.created_at) >= NOW() - INTERVAL '7 days'"
    );
  }

  if (filter === "2days") {
    whereClauses.push(
      "COALESCE(p.published_date, p.created_at) >= NOW() - INTERVAL '2 days'"
    );
  }

  if (topicId) {
    params.push(topicId);
    whereClauses.push(`p.topic_id = $${params.length}`);
  }

  return {
    params,
    whereSql: whereClauses.length > 0
      ? `WHERE ${whereClauses.join(" AND ")}`
      : "",
  };
}

function buildReadStatusSql(userId, params) {
  if (!userId) {
    return {
      joinSql: "",
      selectSql: "FALSE AS is_read, FALSE AS is_new",
    };
  }

  params.push(userId);
  const userParamIndex = params.length;

  return {
    joinSql: `LEFT JOIN user_paper_interactions upi
       ON upi.paper_id = p.id
      AND upi.user_id = $${userParamIndex}`,
    selectSql: `COALESCE(upi.is_read, FALSE) AS is_read,
            (
              p.created_at >= NOW() - INTERVAL '24 hours'
              AND COALESCE(upi.is_read, FALSE) = FALSE
            ) AS is_new`,
  };
}

async function getPapers({ page, limit, filter, topic_id: topicId, userId }) {
  const offset = (page - 1) * limit;
  const { whereSql, params } = buildPaperFilters({
    filter,
    topic_id: topicId,
  });
  const countParams = [...params];
  const { joinSql, selectSql } = buildReadStatusSql(userId, params);

  const listParams = [...params, limit, offset];
  const limitParamIndex = params.length + 1;
  const offsetParamIndex = params.length + 2;

  const result = await query(
    `SELECT p.id, p.arxiv_id, p.title, p.abstract, p.summary, p.authors,
            p.published_date, p.pdf_url, p.avg_rating, p.created_at, p.topic_id,
            ${selectSql}
     FROM papers p
     ${joinSql}
     ${whereSql}
     ORDER BY COALESCE(p.published_date, p.created_at) DESC, p.id DESC
     LIMIT $${limitParamIndex} OFFSET $${offsetParamIndex}`,
    listParams
  );

  const countResult = await query(
    `SELECT COUNT(*)::int AS total
     FROM papers p
     ${whereSql}`,
    countParams
  );

  return {
    papers: result.rows,
    total: countResult.rows[0]?.total || 0,
  };
}

async function getPaperById(id) {
  const result = await query(
    `SELECT id, arxiv_id, title, abstract, summary, authors,
            published_date, pdf_url, avg_rating, created_at, topic_id
     FROM papers
     WHERE id = $1
     LIMIT 1`,
    [id]
  );

  return result.rows[0] || null;
}

async function searchPapers({ q, page, limit, userId }) {
  const offset = (page - 1) * limit;
  const keyword = `%${q}%`;
  const params = [keyword];
  const { joinSql, selectSql } = buildReadStatusSql(userId, params);
  const limitParamIndex = params.length + 1;
  const offsetParamIndex = params.length + 2;

  const result = await query(
    `SELECT p.id, p.arxiv_id, p.title, p.abstract, p.summary, p.authors,
            p.published_date, p.pdf_url, p.avg_rating, p.created_at, p.topic_id,
            ${selectSql}
     FROM papers p
     ${joinSql}
     WHERE p.title ILIKE $1
        OR p.abstract ILIKE $1
        OR p.authors ILIKE $1
     ORDER BY COALESCE(p.published_date, p.created_at) DESC, p.id DESC
     LIMIT $${limitParamIndex} OFFSET $${offsetParamIndex}`,
    [...params, limit, offset]
  );

  const countResult = await query(
    `SELECT COUNT(*)::int AS total
     FROM papers
     WHERE title ILIKE $1
        OR abstract ILIKE $1
        OR authors ILIKE $1`,
    [keyword]
  );

  return {
    papers: result.rows,
    total: countResult.rows[0]?.total || 0,
  };
}

async function updatePaperSummary(id, summary) {
  const result = await query(
    `UPDATE papers
     SET summary = $1
     WHERE id = $2
     RETURNING id, arxiv_id, title, abstract, summary, authors,
               published_date, pdf_url, avg_rating, created_at, topic_id`,
    [summary, id]
  );

  return result.rows[0] || null;
}

async function getRelatedPapersFromTable(paperId, limit) {
  const result = await query(
    `WITH related_ids AS (
       SELECT related_paper_id AS id
       FROM related_papers
       WHERE paper_id = $1
       UNION
       SELECT paper_id AS id
       FROM related_papers
       WHERE related_paper_id = $1
     )
     SELECT p.id, p.arxiv_id, p.title, p.abstract, p.summary, p.authors,
            p.published_date, p.pdf_url, p.avg_rating, p.created_at, p.topic_id
     FROM related_ids r
     JOIN papers p ON p.id = r.id
     WHERE p.id <> $1
     ORDER BY COALESCE(p.published_date, p.created_at) DESC, p.id DESC
     LIMIT $2`,
    [paperId, limit]
  );

  return result.rows;
}

async function getRelatedPapersByTopic(topicId, excludedPaperIds, limit) {
  if (!topicId || limit <= 0) {
    return [];
  }

  const result = await query(
    `SELECT id, arxiv_id, title, abstract, summary, authors,
            published_date, pdf_url, avg_rating, created_at, topic_id
     FROM papers
     WHERE topic_id = $1
       AND NOT (id = ANY($2::int[]))
     ORDER BY COALESCE(published_date, created_at) DESC, id DESC
     LIMIT $3`,
    [topicId, excludedPaperIds, limit]
  );

  return result.rows;
}

async function getMatchingPapers(paperId, limit) {
  const result = await query(
    `WITH match_rows AS (
       SELECT matching_paper_id AS paper_id,
              similarity_score,
              match_type,
              created_at AS match_created_at
       FROM matching_papers
       WHERE paper_id = $1
       UNION ALL
       SELECT paper_id AS paper_id,
              similarity_score,
              match_type,
              created_at AS match_created_at
       FROM matching_papers
       WHERE matching_paper_id = $1
     ),
     deduped_matches AS (
       SELECT DISTINCT ON (paper_id)
              paper_id,
              similarity_score,
              match_type,
              match_created_at
       FROM match_rows
       WHERE paper_id <> $1
       ORDER BY paper_id, similarity_score DESC, match_created_at DESC
     )
     SELECT p.id, p.arxiv_id, p.title, p.abstract, p.summary, p.authors,
            p.published_date, p.pdf_url, p.avg_rating, p.created_at, p.topic_id,
            dm.similarity_score, dm.match_type, dm.match_created_at
     FROM deduped_matches dm
     JOIN papers p ON p.id = dm.paper_id
     ORDER BY dm.similarity_score DESC,
              COALESCE(p.published_date, p.created_at) DESC,
              p.id DESC
     LIMIT $2`,
    [paperId, limit]
  );

  return result.rows;
}

async function markPaperAsRead(userId, paperId) {
  const result = await query(
    `INSERT INTO user_paper_interactions (
       user_id,
       paper_id,
       is_read,
       created_at,
       updated_at
     )
     VALUES ($1, $2, TRUE, NOW(), NOW())
     ON CONFLICT (user_id, paper_id)
     DO UPDATE SET
       is_read = TRUE,
       updated_at = NOW()
     RETURNING user_id, paper_id, is_read, updated_at`,
    [userId, paperId]
  );

  return result.rows[0] || null;
}

async function upsertPaperRating(userId, paperId, rating) {
  return transaction(async (client) => {
    const ratingResult = await client.query(
      `INSERT INTO user_paper_interactions (
         user_id,
         paper_id,
         is_read,
         rating,
         created_at,
         updated_at
       )
       VALUES ($1, $2, TRUE, $3, NOW(), NOW())
       ON CONFLICT (user_id, paper_id)
       DO UPDATE SET
         rating = EXCLUDED.rating,
         is_read = TRUE,
         updated_at = NOW()
       RETURNING rating`,
      [userId, paperId, rating]
    );

    const avgResult = await client.query(
      `SELECT ROUND(AVG(rating)::numeric, 1)::float AS avg_rating,
              COUNT(rating)::int AS rating_count
       FROM user_paper_interactions
       WHERE paper_id = $1
         AND rating IS NOT NULL`,
      [paperId]
    );
    const avgRating = avgResult.rows[0]?.avg_rating || 0;
    const ratingCount = avgResult.rows[0]?.rating_count || 0;

    await client.query(
      `UPDATE papers
       SET avg_rating = $1
       WHERE id = $2`,
      [avgRating, paperId]
    );

    return {
      rating: ratingResult.rows[0].rating,
      avg_rating: avgRating,
      rating_count: ratingCount,
    };
  });
}

async function getUserPaperRating(userId, paperId) {
  const result = await query(
    `SELECT upi.rating,
            p.avg_rating,
            (
              SELECT COUNT(*)::int
              FROM user_paper_interactions
              WHERE paper_id = $2
                AND rating IS NOT NULL
            ) AS rating_count
     FROM papers p
     LEFT JOIN user_paper_interactions upi
       ON upi.paper_id = p.id
      AND upi.user_id = $1
     WHERE p.id = $2
     LIMIT 1`,
    [userId, paperId]
  );

  return result.rows[0] || null;
}


module.exports = {
  getPapers,
  getPaperById,
  searchPapers,
  updatePaperSummary,
  getRelatedPapersFromTable,
  getRelatedPapersByTopic,
  getMatchingPapers,
  markPaperAsRead,
  upsertPaperRating,
  getUserPaperRating,
};


