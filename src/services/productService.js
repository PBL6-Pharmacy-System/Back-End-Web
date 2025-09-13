import sql from '../config/db.js';

export const getAllProducts = async () => {
  return await sql`SELECT * FROM products`;
};

export const getProductById = async (id) => {
  const product = await sql`SELECT * FROM products WHERE id = ${id}`;
  return product[0];
};

export const createProduct = async (data) => {
  const { name, description, price, manufacturer, category } = data;
  const product = await sql`
    INSERT INTO products (name, description, price, manufacturer, category)
    VALUES (${name}, ${description}, ${price}, ${manufacturer}, ${category})
    RETURNING *
  `;
  return product[0];
};

export const updateProduct = async (id, data) => {
  const { name, description, price, manufacturer, category } = data;
  const product = await sql`
    UPDATE products
    SET name = ${name}, description = ${description}, price = ${price}, manufacturer = ${manufacturer}, category = ${category}
    WHERE id = ${id}
    RETURNING *
  `;
  return product[0];
};

export const deleteProduct = async (id) => {
  const product = await sql`DELETE FROM products WHERE id = ${id} RETURNING *`;
  return product[0];
};