import 'dotenv/config';

console.log('🔥 INDEX.JS LOADED');
console.log('DB_URL:', process.env.DATABASE_URL ? 'OK' : 'MISSING');

import app from './src/app.js';
import prisma from './src/config/db.js';

// auto-run job
import './src/jobs/flashsaleJob.js';

// import trực tiếp từng job
import { startCartCleanupJob } from './src/jobs/cartCleanupJob.js';
import { startPaymentExpirationJob } from './src/jobs/paymentExpirationJob.js';
import { startReservationCleanupJob } from './src/jobs/reservationCleanupJob.js';

const PORT = process.env.PORT || 8080;

app.listen(PORT, '0.0.0.0', async () => {
  console.log(`🚀 Server running on port ${PORT}`);

  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Database connected');
  } catch (e) {
    console.error('❌ Database error:', e);
  }

  startPaymentExpirationJob();
  startReservationCleanupJob();
  startCartCleanupJob();
});
