const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkProducts() {
  try {
    const products = await prisma.products.findMany({
      take: 10,
      select: {
        id: true,
        name: true,
        image_url: true,
        images: true
      }
    });

    console.log('=== KẾT QUẢ KIỂM TRA 10 SẢN PHẨM ===\n');
    
    products.forEach((p, idx) => {
      console.log(`${idx + 1}. ${p.name}`);
      console.log(`   - ID: ${p.id}`);
      console.log(`   - image_url: ${p.image_url || 'NULL'}`);
      console.log(`   - images: ${p.images ? JSON.stringify(p.images) : 'NULL'}`);
      console.log('');
    });

    // Thống kê
    const countImageUrl = products.filter(p => p.image_url).length;
    const countImages = products.filter(p => p.images && (Array.isArray(p.images) ? p.images.length > 0 : true)).length;
    const countNoImage = products.filter(p => !p.image_url && !p.images).length;

    console.log('=== THỐNG KÊ ===');
    console.log(`Có image_url: ${countImageUrl}/${products.length}`);
    console.log(`Có images: ${countImages}/${products.length}`);
    console.log(`Không có ảnh: ${countNoImage}/${products.length}`);

  } catch (error) {
    console.error('Lỗi:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkProducts();
