/**
 * Script test API response của /products
 * Kiểm tra xem total_stock có được trả về đúng không
 * 
 * Usage:
 *   node scripts/test-products-api-response.js
 */

import fetch from 'node-fetch';

const API_BASE_URL = 'http://localhost:3000/api';
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

async function testProductsAPI() {
  log(COLORS.cyan, '\n📦 TEST 1: API /products (không auth)\n');

  try {
    const response = await fetch(`${API_BASE_URL}/products?page=1&limit=5`);
    const data = await response.json();

    if (data.success && data.data?.products) {
      const products = data.data.products;
      
      log(COLORS.green, `✅ Lấy được ${products.length} sản phẩm`);
      
      products.forEach((product, index) => {
        const hasStock = 'stock' in product;
        const hasTotalStock = 'total_stock' in product;
        const hasInStock = 'in_stock' in product;

        log(COLORS.bright, `\n${index + 1}. ${product.name} (ID: ${product.id})`);
        log(COLORS.reset, `   stock: ${hasStock ? product.stock : 'N/A'} ${hasStock ? '✅' : '❌'}`);
        log(COLORS.reset, `   total_stock: ${hasTotalStock ? product.total_stock : 'N/A'} ${hasTotalStock ? '✅' : '❌'}`);
        log(COLORS.reset, `   in_stock: ${hasInStock ? product.in_stock : 'N/A'} ${hasInStock ? '✅' : '❌'}`);

        // Kiểm tra consistency
        if (hasStock && hasTotalStock && product.stock !== product.total_stock) {
          log(COLORS.red, `   ⚠️  WARNING: stock !== total_stock (${product.stock} !== ${product.total_stock})`);
        }
      });

      // Phân tích
      const withStock = products.filter(p => (p.total_stock || p.stock || 0) > 0).length;
      const zeroStock = products.filter(p => (p.total_stock || p.stock || 0) === 0).length;

      log(COLORS.bright, '\n📊 PHÂN TÍCH:');
      log(COLORS.green, `   Có tồn kho: ${withStock}`);
      log(COLORS.red, `   Tồn kho = 0: ${zeroStock}`);
    } else {
      log(COLORS.red, '❌ API response không hợp lệ');
      console.log(JSON.stringify(data, null, 2));
    }
  } catch (error) {
    log(COLORS.red, '❌ Error:', error.message);
  }
}

async function testProductDetailAPI() {
  log(COLORS.cyan, '\n📦 TEST 2: API /products/:id (chi tiết sản phẩm)\n');

  try {
    // Lấy sản phẩm đầu tiên
    const listResponse = await fetch(`${API_BASE_URL}/products?page=1&limit=1`);
    const listData = await listResponse.json();
    
    if (!listData.success || !listData.data?.products?.[0]) {
      log(COLORS.red, '❌ Không lấy được sản phẩm nào');
      return;
    }

    const productId = listData.data.products[0].id;
    
    // Lấy chi tiết
    const detailResponse = await fetch(`${API_BASE_URL}/products/${productId}`);
    const detailData = await detailResponse.json();

    if (detailData.success && detailData.data) {
      const product = detailData.data;
      
      log(COLORS.green, `✅ Chi tiết sản phẩm: ${product.name} (ID: ${product.id})`);
      log(COLORS.bright, '\nCác field tồn kho:');
      log(COLORS.reset, `   stock: ${'stock' in product ? product.stock : 'N/A'} ${'stock' in product ? '✅' : '❌'}`);
      log(COLORS.reset, `   total_stock: ${'total_stock' in product ? product.total_stock : 'N/A'} ${'total_stock' in product ? '✅' : '❌'}`);
      log(COLORS.reset, `   in_stock: ${'in_stock' in product ? product.in_stock : 'N/A'} ${'in_stock' in product ? '✅' : '❌'}`);

      // Hiển thị chi tiết branch inventory
      if (product.branchinventory && Array.isArray(product.branchinventory)) {
        log(COLORS.bright, '\nTồn kho theo chi nhánh:');
        const totalFromBranches = product.branchinventory.reduce((sum, inv) => sum + (inv.stock || 0), 0);
        
        product.branchinventory.forEach(inv => {
          log(COLORS.reset, `   ${inv.branches?.name || `Branch #${inv.branch_id}`}: ${inv.stock}`);
        });
        
        log(COLORS.bright, `\nTổng tính từ branches: ${totalFromBranches}`);
        
        // Verify
        const reportedTotal = product.total_stock || product.stock || 0;
        if (totalFromBranches === reportedTotal) {
          log(COLORS.green, `✅ Khớp với total_stock: ${reportedTotal}`);
        } else {
          log(COLORS.red, `❌ KHÔNG khớp! total_stock: ${reportedTotal}, tính được: ${totalFromBranches}`);
        }
      }
    } else {
      log(COLORS.red, '❌ Không lấy được chi tiết sản phẩm');
      console.log(JSON.stringify(detailData, null, 2));
    }
  } catch (error) {
    log(COLORS.red, '❌ Error:', error.message);
  }
}

async function main() {
  log(COLORS.bright, '\n╔════════════════════════════════════════╗');
  log(COLORS.bright, '║   PRODUCTS API RESPONSE TEST SCRIPT   ║');
  log(COLORS.bright, '╚════════════════════════════════════════╝');

  await testProductsAPI();
  await testProductDetailAPI();

  log(COLORS.bright, '\n╔════════════════════════════════════════╗');
  log(COLORS.bright, '║              TEST COMPLETED            ║');
  log(COLORS.bright, '╚════════════════════════════════════════╝\n');
}

main();
