const { query } = require("../../config/db");

function buildPaperFilters({ filter, topic_id: topicId }) {
  const whereClauses = [];
  const params = [];

  if (filter === "recent") {
    whereClauses.push(
      "COALESCE(published_date, created_at) >= NOW() - INTERVAL '7 days'"
    );
  }

  if (filter === "2days") {
    whereClauses.push(
      "COALESCE(published_date, created_at) >= NOW() - INTERVAL '2 days'"
    );
  }

  if (topicId) {
    params.push(topicId);
    whereClauses.push(`topic_id = $${params.length}`);
  }

  return {
    params,
    whereSql: whereClauses.length > 0
      ? `WHERE ${whereClauses.join(" AND ")}`
      : "",
  };
}

async function getPapers({ page, limit, filter, topic_id: topicId }) {
  const offset = (page - 1) * limit;
  const { whereSql, params } = buildPaperFilters({
    filter,
    topic_id: topicId,
  });

  const listParams = [...params, limit, offset];
  const limitParamIndex = params.length + 1;
  const offsetParamIndex = params.length + 2;

  const result = await query(
    `SELECT id, arxiv_id, title, abstract, summary, authors,
            published_date, pdf_url, created_at, topic_id
     FROM papers
     ${whereSql}
     ORDER BY COALESCE(published_date, created_at) DESC, id DESC
     LIMIT $${limitParamIndex} OFFSET $${offsetParamIndex}`,
    listParams
  );

  const countResult = await query(
    `SELECT COUNT(*)::int AS total
     FROM papers
     ${whereSql}`,
    params
  );

  return {
    papers: result.rows,
    total: countResult.rows[0]?.total || 0,
  };
}

async function getPaperById(id) {
  const result = await query(
    `SELECT id, arxiv_id, title, abstract, summary, authors,
            published_date, pdf_url, created_at, topic_id
     FROM papers
     WHERE id = $1
     LIMIT 1`,
    [id]
  );

  return result.rows[0] || null;
}

async function searchPapers({ q, page, limit }) {
  const offset = (page - 1) * limit;
  const keyword = `%${q}%`;

  const result = await query(
    `SELECT id, arxiv_id, title, abstract, summary, authors,
            published_date, pdf_url, created_at, topic_id
     FROM papers
     WHERE title ILIKE $1
        OR abstract ILIKE $1
        OR authors ILIKE $1
     ORDER BY COALESCE(published_date, created_at) DESC, id DESC
     LIMIT $2 OFFSET $3`,
    [keyword, limit, offset]
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
               published_date, pdf_url, created_at, topic_id`,
    [summary, id]
  );

  return result.rows[0] || null;
}


module.exports = {
  getPapers,
  getPaperById,
  searchPapers,
  updatePaperSummary,
};


