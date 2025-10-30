import 'dotenv/config';
import express from 'express';
import './src/jobs/flashsaleJob.js';

import branchInventoryRoutes from './src/routes/branchInventoryRoutes.js';
import branchRoutes from './src/routes/branchRoutes.js';
import cartRoutes from './src/routes/cartRoutes.js';
import categoryRoutes from './src/routes/categoryRoutes.js';
import customerRoutes from './src/routes/customerRoutes.js';
import notificationRoutes from './src/routes/notificationRoutes.js';
import reviewRoutes from './src/routes/reviewRoutes.js';
// import orderRoutes from './src/routes/orderRoutes.js';
import flashsaleRoutes from './src/routes/flashsaleRoutes.js';
import productRoutes from './src/routes/productRoutes.js';
import productUnitRoutes from './src/routes/productUnitRoutes.js';
import supplierRoutes from './src/routes/supplierRoutes.js';
import userRoutes from './src/routes/userRoutes.js';
import voucherRoutes from './src/routes/voucherRoutes.js';

const app = express();
app.use(express.json());

app.use('/api', productRoutes);
app.use('/api', userRoutes);
// app.use('/api', orderRoutes);
app.use('/api', categoryRoutes);
app.use('/api', supplierRoutes);
app.use('/api', voucherRoutes);
app.use('/api', notificationRoutes);
app.use('/api', customerRoutes);
app.use('/api', reviewRoutes);
app.use('/api', branchRoutes);
app.use('/api', branchInventoryRoutes);
app.use('/api', productUnitRoutes);
app.use('/api', cartRoutes);
app.use('/api', flashsaleRoutes);
app.get('/', (req, res) => {
  res.send('API is running!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
