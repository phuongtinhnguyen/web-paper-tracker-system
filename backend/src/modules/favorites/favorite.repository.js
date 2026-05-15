const { query } = require("../../config/db");

async function findPaperById(paperId) {
  const result = await query("SELECT id FROM papers WHERE id = $1", [paperId]);
  return result.rows[0] || null;
}

async function addFavorite(userId, paperId) {
  await query(
    `INSERT INTO favorites (user_id, paper_id, added_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (user_id, paper_id) DO NOTHING`,
    [userId, paperId]
  );
}

async function removeFavorite(userId, paperId) {
  await query(
    `DELETE FROM favorites
     WHERE user_id = $1 AND paper_id = $2`,
    [userId, paperId]
  );
}

async function getFavorites({ userId, page, limit }) {
  const offset = (page - 1) * limit;

  const result = await query(
    `SELECT p.id, p.arxiv_id, p.title, p.abstract, p.summary, p.authors,
            p.published_date, p.pdf_url, p.topic_id, f.added_at AS favorited_at
     FROM favorites f
     JOIN papers p ON p.id = f.paper_id
     WHERE f.user_id = $1
     ORDER BY f.added_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );

  const countResult = await query(
    `SELECT COUNT(*)::int AS total
     FROM favorites
     WHERE user_id = $1`,
    [userId]
  );

  return {
    papers: result.rows,
    total: countResult.rows[0]?.total || 0,
  };
}

module.exports = {
  findPaperById,
  addFavorite,
  removeFavorite,
  getFavorites,
};
