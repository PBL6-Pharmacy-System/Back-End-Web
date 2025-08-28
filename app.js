require("dotenv").config();
const express = require("express");
const cors = require("cors");
const db = require("./src/config/db");
const userRoutes = require("./src/routes/userRoutes");
const productRoutes = require('./src/routes/productRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Route test
app.get("/", (req, res) => {
  res.send("🚀 Backend running with dotenv + nodemon");
});

app.use("/api", userRoutes);
app.use('/api', productRoutes);

// Server listen
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});

app.get("/testdb", async (req, res) => {
  try {
    const result = await db.query("SELECT NOW()");
    res.json({ server_time: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).send("DB query failed");
  }
});
