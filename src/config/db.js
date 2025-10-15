import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Test connection
prisma.$connect()
  .then(() => {
    console.log('✅ Database connected successfully');
  })
  .catch((err) => {
    console.error('❌ Database connection failed:', err);
  });

export default prisma;
