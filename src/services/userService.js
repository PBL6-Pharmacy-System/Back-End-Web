import sql from '../config/db.js';

export const getAllUsers = async () => {
  return await sql`SELECT * FROM users`;
};

export const getUserById = async (id) => {
  const user = await sql`SELECT * FROM users WHERE id = ${id}`;
  return user[0];
};

export const createUser = async (data) => {
  const { name, email, password, phone, role_id, address } = data;
  const user = await sql`
    INSERT INTO users (name, email, password, phone, role_id, address)
    VALUES (${name}, ${email}, ${password}, ${phone}, ${role_id}, ${address})
    RETURNING *
  `;
  return user[0];
};

export const updateUser = async (id, data) => {
  const { name, email, password, phone, role_id, address } = data;
  const user = await sql`
    UPDATE users
    SET name = ${name}, email = ${email}, password = ${password}, phone = ${phone}, role_id = ${role_id}, address = ${address}
    WHERE id = ${id}
    RETURNING *
  `;
  return user[0];
};

export const deleteUser = async (id) => {
  const user = await sql`DELETE FROM users WHERE id = ${id} RETURNING *`;
  return user[0];
};