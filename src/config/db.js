const { Pool } = require("pg");

const pool = new Pool({
  user: "postgres",         // Thay bằng user của bạn
  host: "localhost",        // Hoặc IP server
  database: "PharmacySystemDB", // Thay bằng tên database của bạn
  password: "soulof28dec",      // Thay bằng mật khẩu của bạn
  port: 5432,               // Cổng mặc định của PostgreSQL
});

module.exports = pool;
