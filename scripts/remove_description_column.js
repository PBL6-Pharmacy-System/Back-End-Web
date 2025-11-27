import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

console.log('🗑️  Xóa cột description khỏi bảng categories...\n');

try {
  // Sử dụng raw SQL để drop column
  await prisma.$executeRaw`ALTER TABLE categories DROP COLUMN IF EXISTS description CASCADE`;
  
  console.log('✅ Đã xóa cột description thành công!');
  
  // Verify
  const sampleCategory = await prisma.categories.findFirst();
  console.log('\n📋 Sample category sau khi xóa description:');
  console.log(JSON.stringify(sampleCategory, null, 2));
  
} catch (error) {
  console.error('❌ Lỗi:', error);
} finally {
  await prisma.$disconnect();
}
