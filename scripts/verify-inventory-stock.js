/**
 * Script kiểm tra và verify tồn kho sản phẩm
 * 
 * Mục đích:
 * 1. Kiểm tra total_stock từ branchinventory
 * 2. Phát hiện sản phẩm có tồn kho = 0
 * 3. Phát hiện inconsistency giữa branchinventory và productBatch
 * 4. Export báo cáo chi tiết
 * 
 * Usage:
 *   node scripts/verify-inventory-stock.js
 *   node scripts/verify-inventory-stock.js --fix  # Auto-fix inconsistencies
 */

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(color, ...args) {
  console.log(color, ...args, COLORS.reset);
}

// Kiểm tra tồn kho từ branchinventory
async function verifyBranchInventory() {
  log(COLORS.cyan, '\n📦 BƯỚC 1: Kiểm tra tồn kho từ branchinventory...\n');

  const products = await prisma.products.findMany({
    select: {
      id: true,
      name: true,
      branchinventory: {
        select: {
          branch_id: true,
          stock: true,
          min_stock: true,
          max_stock: true,
          branches: {
            select: { name: true }
          }
        }
      }
    }
  });

  const report = {
    totalProducts: products.length,
    productsWithStock: 0,
    productsWithZeroStock: 0,
    productsLowStock: 0,
    productsList: []
  };

  products.forEach(product => {
    const totalStock = product.branchinventory.reduce((sum, inv) => sum + (inv.stock || 0), 0);
    const hasLowStock = product.branchinventory.some(inv => 
      inv.min_stock && inv.stock <= inv.min_stock
    );

    const productInfo = {
      id: product.id,
      name: product.name,
      total_stock: totalStock,
      branches: product.branchinventory.map(inv => ({
        branch_name: inv.branches.name,
        stock: inv.stock,
        min_stock: inv.min_stock,
        max_stock: inv.max_stock,
        is_low: inv.min_stock && inv.stock <= inv.min_stock
      }))
    };

    if (totalStock > 0) {
      report.productsWithStock++;
    } else {
      report.productsWithZeroStock++;
    }

    if (hasLowStock) {
      report.productsLowStock++;
    }

    report.productsList.push(productInfo);
  });

  // Hiển thị tổng quan
  log(COLORS.bright, '📊 TỔNG QUAN:');
  log(COLORS.blue, `   Tổng số sản phẩm: ${report.totalProducts}`);
  log(COLORS.green, `   ✅ Có tồn kho: ${report.productsWithStock}`);
  log(COLORS.red, `   ❌ Tồn kho = 0: ${report.productsWithZeroStock}`);
  log(COLORS.yellow, `   ⚠️  Low stock: ${report.productsLowStock}`);

  return report;
}

// Kiểm tra consistency giữa branchinventory và productBatch
async function verifyConsistency() {
  log(COLORS.cyan, '\n🔍 BƯỚC 2: Kiểm tra consistency với productBatch...\n');

  const inventoryRecords = await prisma.branchinventory.findMany({
    include: {
      products: { select: { name: true } },
      branches: { select: { name: true } }
    }
  });

  const inconsistencies = [];
  let checked = 0;

  for (const inv of inventoryRecords) {
    checked++;
    if (checked % 100 === 0) {
      process.stdout.write(`\r   Đã kiểm tra: ${checked}/${inventoryRecords.length}`);
    }

    try {
      // Tính tổng từ productBatch
      const batchTotal = await prisma.productBatch.aggregate({
        where: {
          branch_id: inv.branch_id,
          product_id: inv.product_id,
          status: { in: ['active', 'expired'] } // Không tính disposed
        },
        _sum: { quantity: true }
      });

      const batchStock = batchTotal._sum.quantity || 0;
      const inventoryStock = inv.stock || 0;

      if (batchStock !== inventoryStock) {
        inconsistencies.push({
          product_id: inv.product_id,
          product_name: inv.products.name,
          branch_id: inv.branch_id,
          branch_name: inv.branches.name,
          branchinventory_stock: inventoryStock,
          productBatch_total: batchStock,
          difference: inventoryStock - batchStock
        });
      }
    } catch (error) {
      log(COLORS.red, `\n❌ Error checking product ${inv.product_id} at branch ${inv.branch_id}: ${error.message}`);
    }
  }
  
  console.log(''); // New line after progress

  if (inconsistencies.length > 0) {
    log(COLORS.red, `❌ Tìm thấy ${inconsistencies.length} inconsistencies:\n`);
    inconsistencies.slice(0, 10).forEach(item => {
      log(COLORS.yellow, `   [${item.product_name}] @ ${item.branch_name}`);
      log(COLORS.reset, `      branchinventory: ${item.branchinventory_stock}`);
      log(COLORS.reset, `      productBatch: ${item.productBatch_total}`);
      log(COLORS.reset, `      difference: ${item.difference}\n`);
    });
    if (inconsistencies.length > 10) {
      log(COLORS.yellow, `   ... và ${inconsistencies.length - 10} inconsistencies khác`);
    }
  } else {
    log(COLORS.green, '✅ Tất cả dữ liệu đều consistent!');
  }

  return inconsistencies;
}

// Export sản phẩm có tồn kho = 0
async function exportZeroStockProducts(report) {
  log(COLORS.cyan, '\n📝 BƯỚC 3: Export danh sách sản phẩm tồn kho = 0...\n');

  const zeroStockProducts = report.productsList.filter(p => p.total_stock === 0);

  if (zeroStockProducts.length > 0) {
    console.log('\n=== SẢN PHẨM TỒN KHO = 0 ===\n');
    zeroStockProducts.forEach(product => {
      console.log(`ID: ${product.id}`);
      console.log(`Tên: ${product.name}`);
      console.log(`Chi nhánh:`);
      product.branches.forEach(b => {
        console.log(`  - ${b.branch_name}: ${b.stock} (min: ${b.min_stock})`);
      });
      console.log('---\n');
    });
  }

  return zeroStockProducts;
}

// Fix inconsistencies (nếu có flag --fix)
async function fixInconsistencies(inconsistencies) {
  log(COLORS.cyan, '\n🔧 BƯỚC 4: Sửa inconsistencies...\n');

  let fixed = 0;

  for (const item of inconsistencies) {
    try {
      // Update branchinventory.stock = SUM(productBatch.quantity)
      await prisma.branchinventory.update({
        where: {
          branch_id_product_id: {
            branch_id: item.branch_id,
            product_id: item.product_id
          }
        },
        data: {
          stock: item.productBatch_total,
          last_updated: new Date()
        }
      });

      log(COLORS.green, `✅ Fixed: [${item.product_name}] @ ${item.branch_name}`);
      log(COLORS.reset, `   ${item.branchinventory_stock} → ${item.productBatch_total}`);
      fixed++;
    } catch (error) {
      log(COLORS.red, `❌ Error fixing [${item.product_name}]: ${error.message}`);
    }
  }

  log(COLORS.green, `\n✅ Đã sửa ${fixed}/${inconsistencies.length} inconsistencies`);
}

// Main function
async function main() {
  const shouldFix = process.argv.includes('--fix');

  log(COLORS.bright, '\n╔════════════════════════════════════════╗');
  log(COLORS.bright, '║  INVENTORY STOCK VERIFICATION SCRIPT  ║');
  log(COLORS.bright, '╚════════════════════════════════════════╝\n');

  try {
    // Step 1: Verify branch inventory
    const report = await verifyBranchInventory();

    // Step 2: Check consistency
    const inconsistencies = await verifyConsistency();

    // Step 3: Export zero stock products
    await exportZeroStockProducts(report);

    // Step 4: Fix inconsistencies (if --fix flag)
    if (shouldFix && inconsistencies.length > 0) {
      await fixInconsistencies(inconsistencies);
    } else if (inconsistencies.length > 0) {
      log(COLORS.yellow, '\n💡 Tip: Chạy với flag --fix để tự động sửa inconsistencies:');
      log(COLORS.reset, '   node scripts/verify-inventory-stock.js --fix\n');
    }

    // Summary
    log(COLORS.bright, '\n╔════════════════════════════════════════╗');
    log(COLORS.bright, '║            SUMMARY REPORT              ║');
    log(COLORS.bright, '╚════════════════════════════════════════╝\n');
    log(COLORS.blue, `Total Products: ${report.totalProducts}`);
    log(COLORS.green, `With Stock: ${report.productsWithStock}`);
    log(COLORS.red, `Zero Stock: ${report.productsWithZeroStock}`);
    log(COLORS.yellow, `Low Stock: ${report.productsLowStock}`);
    log(COLORS.red, `Inconsistencies: ${inconsistencies.length}`);
    
    if (shouldFix && inconsistencies.length > 0) {
      log(COLORS.green, '\n✅ Đã sửa tất cả inconsistencies!');
    }

  } catch (error) {
    log(COLORS.red, '\n❌ Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
