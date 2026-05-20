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

async function updateUser(id, { username, email }) {
  const result = await query(
    `UPDATE users
     SET full_name = $1, email = $2
     WHERE id = $3
     RETURNING id, email, full_name, created_at`,
    [username, email, id]
  );

  return result.rows[0] || null;
}

async function updatePassword(id, hashedPassword) {
  const result = await query(
    `UPDATE users
     SET hashed_password = $1
     WHERE id = $2
     RETURNING id, email, full_name, created_at`,
    [hashedPassword, id]
  );

  return result.rows[0] || null;
}

module.exports = {
  findUserByEmail,
  findUserById,
  createUser,
  updateUser,
  updatePassword,
};
