const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixProductImages() {
  try {
    console.log('🔍 Kiểm tra sản phẩm không có ảnh...\n');

    // Lấy tất cả sản phẩm
    const allProducts = await prisma.products.findMany({
      select: {
        id: true,
        name: true,
        image_url: true,
        images: true
      }
    });

    console.log(`📊 Tổng số sản phẩm: ${allProducts.length}\n`);

    // Phân loại
    const noImageUrl = allProducts.filter(p => !p.image_url);
    const noImages = allProducts.filter(p => !p.images || (Array.isArray(p.images) && p.images.length === 0));
    const noAnyImage = allProducts.filter(p => !p.image_url && (!p.images || (Array.isArray(p.images) && p.images.length === 0)));
    const hasImages = allProducts.filter(p => p.images && Array.isArray(p.images) && p.images.length > 0);

    console.log('=== THỐNG KÊ ===');
    console.log(`Không có image_url: ${noImageUrl.length}`);
    console.log(`Không có images (hoặc rỗng): ${noImages.length}`);
    console.log(`Không có ảnh gì cả: ${noAnyImage.length}`);
    console.log(`Có images array: ${hasImages.length}\n`);

    // Fix: Đồng bộ image_url từ images array
    console.log('🔧 Bắt đầu fix: Đồng bộ image_url từ images[0]...\n');

    let fixed = 0;
    for (const product of hasImages) {
      if (!product.image_url && product.images.length > 0) {
        const firstImage = product.images[0];
        await prisma.products.update({
          where: { id: product.id },
          data: { image_url: firstImage }
        });
        console.log(`✅ Fixed ID ${product.id}: ${product.name.substring(0, 50)}...`);
        fixed++;
      }
    }

    console.log(`\n🎉 Đã fix ${fixed} sản phẩm!`);

    // Kiểm tra lại sau khi fix
    const recheckNoImage = await prisma.products.findMany({
      where: {
        AND: [
          {
            OR: [
              { image_url: null },
              { image_url: '' }
            ]
          },
          {
            OR: [
              { images: null },
              { images: { equals: [] } }
            ]
          }
        ]
      },
      select: {
        id: true,
        name: true
      },
      take: 10
    });

    if (recheckNoImage.length > 0) {
      console.log(`\n⚠️ Vẫn còn ${recheckNoImage.length} sản phẩm không có ảnh:`);
      recheckNoImage.forEach(p => {
        console.log(`   - ID ${p.id}: ${p.name}`);
      });
    } else {
      console.log('\n✅ Tất cả sản phẩm đã có ảnh!');
    }

  } catch (error) {
    console.error('❌ Lỗi:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixProductImages();
