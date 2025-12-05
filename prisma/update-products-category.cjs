// Script cập nhật category_id cho bảng products
// Chạy: node prisma/update-products-category.cjs

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Bắt đầu cập nhật category_id cho products...\n');

    try {
        // Bước 1: Đọc file clean_products.json
        const productsFilePath = path.join(__dirname, '..', 'crawl', 'clean_products.json');
        console.log(`📂 Đang đọc file: ${productsFilePath}`);

        const productsData = JSON.parse(fs.readFileSync(productsFilePath, 'utf8'));
        console.log(`✅ Đã đọc ${productsData.length} products từ file\n`);

        // Bước 2: Lấy tất cả categories từ database
        console.log('📊 Đang lấy danh sách categories từ database...');
        const categories = await prisma.categories.findMany();
        console.log(`✅ Tìm thấy ${categories.length} categories trong database\n`);

        // Bước 3: Tạo map từ tên category -> id
        const categoryNameToId = {};
        categories.forEach(cat => {
            // Normalize tên category (lowercase, trim)
            const normalizedName = cat.name.toLowerCase().trim();
            categoryNameToId[normalizedName] = cat.id;
        });

        console.log('📋 Một số category mappings:');
        Object.entries(categoryNameToId).slice(0, 10).forEach(([name, id]) => {
            console.log(`   "${name}" -> ${id}`);
        });
        console.log('   ...\n');

        // Bước 4: Tạo map từ SKU -> category name từ file products
        const skuToCategoryName = {};
        productsData.forEach(product => {
            if (product.sku && product.category && product.category.length > 0) {
                // Lấy category cuối cùng trong mảng (thường là category cụ thể nhất)
                const categoryName = product.category[product.category.length - 1];
                skuToCategoryName[product.sku] = categoryName;
            }
        });

        console.log(`📋 Đã tạo mapping cho ${Object.keys(skuToCategoryName).length} SKUs\n`);

        // Bước 5: Lấy tất cả products từ database
        console.log('📊 Đang lấy danh sách products từ database...');
        const dbProducts = await prisma.products.findMany({
            select: {
                id: true,
                name: true,
                category_id: true
            }
        });
        console.log(`✅ Tìm thấy ${dbProducts.length} products trong database\n`);

        // Bước 6: Cập nhật category_id cho từng product
        console.log('🔄 Đang cập nhật category_id cho products...\n');

        let updatedCount = 0;
        let notFoundCount = 0;
        let skippedCount = 0;
        const notFoundCategories = new Set();

        for (const product of productsData) {
            if (!product.sku || !product.category || product.category.length === 0) {
                skippedCount++;
                continue;
            }

            // Lấy category cuối cùng (cụ thể nhất)
            const categoryName = product.category[product.category.length - 1];
            const normalizedCategoryName = categoryName.toLowerCase().trim();

            // Tìm category_id
            let categoryId = categoryNameToId[normalizedCategoryName];

            // Nếu không tìm thấy, thử tìm category cha
            if (!categoryId && product.category.length > 1) {
                for (let i = product.category.length - 2; i >= 0; i--) {
                    const parentName = product.category[i].toLowerCase().trim();
                    if (categoryNameToId[parentName]) {
                        categoryId = categoryNameToId[parentName];
                        break;
                    }
                }
            }

            if (!categoryId) {
                notFoundCategories.add(categoryName);
                notFoundCount++;
                continue;
            }

            // Cập nhật product trong database (tìm theo name vì có thể không có SKU trong DB)
            try {
                const result = await prisma.products.updateMany({
                    where: {
                        name: product.name
                    },
                    data: {
                        category_id: categoryId
                    }
                });

                if (result.count > 0) {
                    updatedCount += result.count;
                }
            } catch (err) {
                // Bỏ qua lỗi
            }
        }

        console.log('\n📊 KẾT QUẢ:');
        console.log(`   ✅ Đã cập nhật: ${updatedCount} products`);
        console.log(`   ⚠️ Không tìm thấy category: ${notFoundCount} products`);
        console.log(`   ⏭️ Bỏ qua (thiếu dữ liệu): ${skippedCount} products`);

        if (notFoundCategories.size > 0) {
            console.log('\n⚠️ Các category không tìm thấy trong database:');
            Array.from(notFoundCategories).slice(0, 20).forEach(name => {
                console.log(`   - "${name}"`);
            });
            if (notFoundCategories.size > 20) {
                console.log(`   ... và ${notFoundCategories.size - 20} category khác`);
            }
        }

        // Bước 7: Verify kết quả
        console.log('\n📊 Kiểm tra kết quả:');
        const productsWithCategory = await prisma.products.count({
            where: { category_id: { not: null } }
        });
        const productsWithoutCategory = await prisma.products.count({
            where: { category_id: null }
        });

        console.log(`   - Products có category_id: ${productsWithCategory}`);
        console.log(`   - Products không có category_id: ${productsWithoutCategory}`);

        // Hiển thị một số products mẫu
        console.log('\n📋 Một số products mẫu sau khi cập nhật:');
        const samples = await prisma.products.findMany({
            take: 10,
            where: { category_id: { not: null } },
            select: {
                id: true,
                name: true,
                category_id: true,
                categories: {
                    select: { name: true }
                }
            }
        });

        samples.forEach(p => {
            const catName = p.categories?.name || 'N/A';
            console.log(`   ID: ${p.id} | Category: ${p.category_id} (${catName}) | ${p.name.substring(0, 50)}...`);
        });

        console.log('\n🎉 HOÀN THÀNH!');

    } catch (error) {
        console.error('❌ Lỗi:', error.message);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    });
