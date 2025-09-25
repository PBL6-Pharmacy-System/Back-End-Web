import 'dotenv/config';
import express from 'express';
import productRoutes from './src/routes/productRoutes.js';
import userRoutes from './src/routes/userRoutes.js';
import orderRoutes from './src/routes/orderRoutes.js';

const app = express();
app.use(express.json());
app.use('/api', productRoutes);
app.use('/api', userRoutes);
app.use('/api', orderRoutes);
// app.use('/api', productRoutes);
app.get('/', (req, res) => {
  res.send('API is running!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
