const { query } = require("../../config/db");

function buildHistoryFilters({ userId, search }) {
  const params = [userId];
  const whereClauses = [
    "upi.user_id = $1",
    "upi.is_read = TRUE",
  ];

  if (search) {
    params.push(`%${search}%`);
    whereClauses.push(
      `(p.title ILIKE $${params.length}
        OR p.abstract ILIKE $${params.length}
        OR p.authors ILIKE $${params.length})`
    );
  }

  return {
    params,
    whereSql: `WHERE ${whereClauses.join(" AND ")}`,
  };
}

async function getHistory({ userId, page, limit, search }) {
  const offset = (page - 1) * limit;
  const { params, whereSql } = buildHistoryFilters({ userId, search });
  const listParams = [...params, limit, offset];
  const limitParamIndex = params.length + 1;
  const offsetParamIndex = params.length + 2;

  const result = await query(
    `SELECT p.id, p.arxiv_id, p.title, p.abstract, p.summary, p.authors,
            p.published_date, p.pdf_url, p.avg_rating, p.created_at, p.topic_id,
            COALESCE(upi.updated_at, upi.created_at) AS read_at
     FROM user_paper_interactions upi
     JOIN papers p ON p.id = upi.paper_id
     ${whereSql}
     ORDER BY COALESCE(upi.updated_at, upi.created_at) DESC, p.id DESC
     LIMIT $${limitParamIndex} OFFSET $${offsetParamIndex}`,
    listParams
  );

  const countResult = await query(
    `SELECT COUNT(*)::int AS total
     FROM user_paper_interactions upi
     JOIN papers p ON p.id = upi.paper_id
     ${whereSql}`,
    params
  );

  return {
    papers: result.rows,
    total: countResult.rows[0]?.total || 0,
  };
}

async function removeHistoryItem(userId, paperId) {
  const result = await query(
    `UPDATE user_paper_interactions
     SET is_read = FALSE,
         updated_at = NOW()
     WHERE user_id = $1
       AND paper_id = $2
       AND is_read = TRUE
     RETURNING paper_id, is_read`,
    [userId, paperId]
  );

  return result.rows[0] || null;
}

async function clearHistory(userId) {
  const result = await query(
    `UPDATE user_paper_interactions
     SET is_read = FALSE,
         updated_at = NOW()
     WHERE user_id = $1
       AND is_read = TRUE
     RETURNING paper_id`,
    [userId]
  );

  return result.rowCount;
}

module.exports = {
  getHistory,
  removeHistoryItem,
  clearHistory,
};
