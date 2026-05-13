const { query } = require("../../config/db");

async function findUserByEmail(email) {
  const result = await query(
    `SELECT id, email, hashed_password, full_name, created_at
     FROM users
     WHERE email = $1
     LIMIT 1`,
    [email]
  );

  return result.rows[0] || null;
}

async function findUserById(id) {
  const result = await query(
    `SELECT id, email, full_name, created_at
     FROM users
     WHERE id = $1
     LIMIT 1`,
    [id]
  );

  return result.rows[0] || null;
}

async function createUser({ email, hashedPassword, username }) {
  const result = await query(
    `INSERT INTO users (email, hashed_password, full_name)
     VALUES ($1, $2, $3)
     RETURNING id, email, full_name, created_at`,
    [email, hashedPassword, username]
  );

  return result.rows[0];
}

module.exports = {
  findUserByEmail,
  findUserById,
  createUser,
};
