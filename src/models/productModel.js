const pool = require('../config/db');

const Product = {
  async getAll() {
    const result = await pool.query('SELECT * FROM products');
    return result.rows;
  },
  async getById(id) {
    const result = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
    return result.rows[0];
  },
  async create(data) {
    const { name, description, price, manufacturer, category } = data;
    const result = await pool.query(
      'INSERT INTO products (name, description, price, manufacturer, category) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, description, price, manufacturer, category]
    );
    return result.rows[0];
  },
  async update(id, data) {
    const { name, description, price, manufacturer, category } = data;
    const result = await pool.query(
      'UPDATE products SET name=$1, description=$2, price=$3, manufacturer=$4, category=$5 WHERE id=$6 RETURNING *',
      [name, description, price, manufacturer, category, id]
    );
    return result.rows[0];
  },
  async delete(id) {
    await pool.query('DELETE FROM products WHERE id = $1', [id]);
    return true;
  }
};

module.exports = Product;