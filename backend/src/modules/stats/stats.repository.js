const { query } = require("../../config/db");

async function getTopicTrends(limit) {
  const result = await query(
    `SELECT
       t.id,
       t.name,
       COALESCE(t.trending, 0)::int AS trending,
       COUNT(p.id)::int AS paper_count,
       COUNT(p.id) FILTER (
         WHERE COALESCE(p.published_date, p.created_at) >= NOW() - INTERVAL '7 days'
       )::int AS recent_paper_count
     FROM topics t
     LEFT JOIN papers p ON p.topic_id = t.id
     GROUP BY t.id, t.name, t.trending
     ORDER BY
       COALESCE(t.trending, 0) DESC,
       recent_paper_count DESC,
       paper_count DESC,
       t.id ASC
     LIMIT $1`,
    [limit]
  );

  return result.rows;
}

module.exports = {
  getTopicTrends,
};
