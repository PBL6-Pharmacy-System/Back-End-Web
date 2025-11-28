/**
 * 🧪 STAFF API TEST SCRIPT (Node.js Version)
 * Test tất cả API endpoints mà STAFF có quyền truy cập
 * 
 * Cách sử dụng:
 * node scripts/test-staff-apis.js
 */

const BASE_URL = 'http://localhost:3000/api';
const dates = 'startDate=2025-01-01&endDate=2025-12-31';

let token = null;
let passed = 0;
let failed = 0;
let skipped = 0;
const results = [];

// Staff credentials
const STAFF_CREDENTIALS = {
    username: 'staffhung',
    password: 'staffhung'
};

// ========================================
// VALID TEST IDs (based on actual database)
// ========================================
const TEST_IDS = {
    user: 8,
    customer: 3,
    customerWithAddress: 3,
    order: 9,
    transfer: 2,
    shipment: 1,
    voucher: 'WELCOME2024',
    product: 1,
    category: 1,
    supplier: 1,
    branch: 1,
    branchInventory: 1,
    productBatch: 1,
    stockTake: 1,
    review: 1,
    notification: 1,
    prescription: 1,
    city: 1,
    payment: 1,
    shippingAddress: 1,
    flashsale: 1,
    productUnit: 1
};

async function login() {
    try {
        const response = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(STAFF_CREDENTIALS)
        });
        const data = await response.json();
        if (data.data?.token) {
            token = data.data.token;
            console.log('✅ Staff login successful!');
            console.log(`   Role: ${data.data.user?.role_name || 'staff'}\n`);
            return true;
        } else {
            console.error('❌ Login failed:', data.error || data.message || 'Unknown error');
            return false;
        }
    } catch (error) {
        console.error('❌ Login error:', error.message);
        return false;
    }
}

async function testAPI(category, name, method, url, body = null, expectedStatus = 200) {
    try {
        const options = {
            method,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        };
        if (body && (method === 'POST' || method === 'PUT')) {
            options.body = JSON.stringify(body);
        }

        const response = await fetch(BASE_URL + url, options);
        const data = await response.json().catch(() => ({}));

        const success = response.status === expectedStatus || (response.ok && data.success !== false);

        if (success) {
            passed++;
            console.log(`✅ [${category}] ${name}: ${response.status}`);
        } else {
            failed++;
            console.error(`❌ [${category}] ${name}: ${response.status}`, data.error || data.message || '');
        }

        results.push({ category, name, method, url, status: response.status, success, data });

        await new Promise(r => setTimeout(r, 100));
        return { success, data, status: response.status };
    } catch (error) {
        failed++;
        console.error(`❌ [${category}] ${name}: Network Error -`, error.message);
        results.push({ category, name, method, url, status: 0, success: false, error: error.message });
        return { success: false, error };
    }
}

// Test API mà staff KHÔNG có quyền (expected 403)
async function testForbiddenAPI(category, name, method, url) {
    try {
        const options = {
            method,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        };

        const response = await fetch(BASE_URL + url, options);
        const data = await response.json().catch(() => ({}));

        // Expect 403 Forbidden
        const success = response.status === 403;

        if (success) {
            passed++;
            console.log(`✅ [${category}] ${name}: 403 (Correctly Forbidden)`);
        } else {
            failed++;
            console.error(`❌ [${category}] ${name}: Expected 403, got ${response.status}`);
        }

        results.push({ category, name, method, url, status: response.status, success, expected: 403 });

        await new Promise(r => setTimeout(r, 100));
        return { success, data, status: response.status };
    } catch (error) {
        failed++;
        console.error(`❌ [${category}] ${name}: Network Error -`, error.message);
        results.push({ category, name, method, url, status: 0, success: false, error: error.message });
        return { success: false, error };
    }
}

async function runAllTests() {
    console.log('🚀 ========================================');
    console.log('🚀 TESTING APIs WITH STAFF ACCOUNT');
    console.log('🚀 ========================================\n');

    // Login first
    console.log('🔐 Logging in as Staff...');
    const loggedIn = await login();
    if (!loggedIn) {
        console.error('❌ Cannot proceed without authentication');
        process.exit(1);
    }

    // ========================================
    // 1. AUTH APIs (Staff có quyền)
    // ========================================
    console.log('\n🔐 AUTH APIs');
    await testAPI('AUTH', 'Get Current User', 'GET', '/auth/me');

    // ========================================
    // 2. PRODUCT APIs (Public/Staff có quyền đọc)
    // ========================================
    console.log('\n📦 PRODUCT APIs (Read Access)');
    await testAPI('PRODUCTS', 'Get All Products', 'GET', '/products');
    await testAPI('PRODUCTS', 'Search Products', 'GET', '/products/search?q=thuốc');
    await testAPI('PRODUCTS', 'Get Best Sellers', 'GET', '/products/best-sellers');
    await testAPI('PRODUCTS', 'Get Product By ID', 'GET', `/products/${TEST_IDS.product}`);

    // Categories
    await testAPI('CATEGORIES', 'Get All Categories', 'GET', '/categories');
    await testAPI('CATEGORIES', 'Get Category Tree', 'GET', '/categories/tree');
    await testAPI('CATEGORIES', 'Get Category By ID', 'GET', `/categories/${TEST_IDS.category}`);

    // Suppliers
    await testAPI('SUPPLIERS', 'Get All Suppliers', 'GET', '/suppliers');
    await testAPI('SUPPLIERS', 'Get Supplier By ID', 'GET', `/suppliers/${TEST_IDS.supplier}`);

    // Product Units
    await testAPI('PRODUCT_UNITS', 'Get All Product Units', 'GET', '/productunits');

    // ========================================
    // 3. ORDER MANAGEMENT APIs (Staff có quyền)
    // ========================================
    console.log('\n🛒 ORDER MANAGEMENT APIs');
    await testAPI('ORDERS', 'Get All Orders', 'GET', '/orders');
    await testAPI('ORDERS', 'Get Order By ID', 'GET', `/orders/${TEST_IDS.order}`);
    await testAPI('ORDERS', 'Get Customer Orders', 'GET', `/customers/${TEST_IDS.customer}/orders`);

    // ========================================
    // 4. PAYMENT APIs (Staff có quyền)
    // ========================================
    console.log('\n💳 PAYMENT APIs');
    // Payment Statistics chỉ dành cho Admin
    await testAPI('PAYMENTS', 'Get Payment By ID', 'GET', `/payments/${TEST_IDS.payment}`);

    // ========================================
    // 5. SHIPPING MANAGEMENT APIs (Staff có quyền)
    // ========================================
    console.log('\n🚚 SHIPPING MANAGEMENT APIs');
    await testAPI('SHIPMENTS', 'Get All Shipments', 'GET', '/shipments');
    // Shipment Statistics chỉ dành cho Admin
    await testAPI('SHIPMENTS', 'Get Shipment By ID', 'GET', `/shipments/${TEST_IDS.shipment}`);
    await testAPI('SHIPMENTS', 'Get Order Shipments', 'GET', `/orders/${TEST_IDS.order}/shipments`);

    // Shipping Fees (Public)
    await testAPI('SHIPPING_FEES', 'Get Shipping Zones', 'GET', '/shipping/zones');
    await testAPI('SHIPPING_FEES', 'Calculate Fee', 'GET', '/shipping/calculate?distance=10');

    // ========================================
    // 6. INVENTORY MANAGEMENT APIs (Staff có quyền)
    // ========================================
    console.log('\n📊 INVENTORY MANAGEMENT APIs');

    // Branches
    await testAPI('BRANCHES', 'Get All Branches', 'GET', '/branches');
    await testAPI('BRANCHES', 'Get Branch By ID', 'GET', `/branches/${TEST_IDS.branch}`);

    // Branch Inventory
    await testAPI('BRANCH_INV', 'Get All Branch Inventory', 'GET', '/branch-inventory');
    await testAPI('BRANCH_INV', 'Get Branch Inventory By ID', 'GET', `/branch-inventory/${TEST_IDS.branchInventory}`);
    await testAPI('BRANCH_INV', 'Get Low Stock Items', 'GET', '/branch-inventory/alerts/low-stock');
    await testAPI('BRANCH_INV', 'Get Branch Inventory By Branch', 'GET', `/branches/${TEST_IDS.branch}/inventory`);

    // Product Batches
    await testAPI('BATCHES', 'Get All Product Batches', 'GET', '/product-batches');
    await testAPI('BATCHES', 'Get Batches Expiring Soon', 'GET', '/product-batches/expiring-soon');
    await testAPI('BATCHES', 'Get Product Batch By ID', 'GET', `/product-batches/${TEST_IDS.productBatch}`);

    // Inventory Transfers
    await testAPI('TRANSFERS', 'Get All Transfers', 'GET', '/inventory-transfers');
    await testAPI('TRANSFERS', 'Get Transfer By ID', 'GET', `/inventory-transfers/${TEST_IDS.transfer}`);

    // Stock Takes
    await testAPI('STOCK_TAKE', 'Get All Stock Takes', 'GET', '/stock-takes');
    await testAPI('STOCK_TAKE', 'Get Stock Take By ID', 'GET', `/stock-takes/${TEST_IDS.stockTake}`);

    // ========================================
    // 7. INVENTORY STATISTICS (Staff có quyền)
    // ========================================
    console.log('\n📈 INVENTORY STATISTICS APIs');
    await testAPI('INV_STATS', 'Inventory Overview', 'GET', '/statistics/inventory/overview');
    await testAPI('INV_STATS', 'Inventory By Branch', 'GET', `/statistics/inventory/branch/${TEST_IDS.branch}`);
    await testAPI('INV_STATS', 'Low Stock Products', 'GET', '/statistics/inventory/low-stock');
    await testAPI('INV_STATS', 'Overstock Products', 'GET', '/statistics/inventory/overstock');
    await testAPI('INV_STATS', 'Inventory Movements', 'GET', '/statistics/inventory/movements?' + dates);
    await testAPI('INV_STATS', 'Top Imported Products', 'GET', '/statistics/inventory/top-imported?' + dates);
    await testAPI('INV_STATS', 'Top Exported Products', 'GET', '/statistics/inventory/top-exported?' + dates);
    await testAPI('INV_STATS', 'Inventory By Category', 'GET', '/statistics/inventory/by-category');

    // ========================================
    // 8. PRESCRIPTION APIs (Staff có quyền)
    // ========================================
    console.log('\n💊 PRESCRIPTION APIs');
    await testAPI('PRESCRIPTIONS', 'Get All Prescriptions', 'GET', '/prescriptions');
    await testAPI('PRESCRIPTIONS', 'Get Prescription By ID', 'GET', `/prescriptions/${TEST_IDS.prescription}`);

    // ========================================
    // 9. PROMOTION APIs (Public/Read)
    // ========================================
    console.log('\n🎁 PROMOTION APIs');
    await testAPI('FLASHSALES', 'Get Active Flashsale', 'GET', '/flashsales/active');
    await testAPI('VOUCHERS', 'Get Available Vouchers', 'GET', '/vouchers/available');
    // Bỏ test Check Voucher Code vì voucher đã hết hạn - không phải lỗi quyền

    // ========================================
    // 10. REVIEW APIs (Public/Read)
    // ========================================
    console.log('\n⭐ REVIEW APIs');
    await testAPI('REVIEWS', 'Get All Reviews', 'GET', '/reviews');
    await testAPI('REVIEWS', 'Get Review By ID', 'GET', `/reviews/${TEST_IDS.review}`);
    await testAPI('REVIEWS', 'Get Product Reviews', 'GET', `/products/${TEST_IDS.product}/reviews`);

    // ========================================
    // 11. LOCATION APIs (Public)
    // ========================================
    console.log('\n📍 LOCATION APIs');
    await testAPI('CITIES', 'Get All Cities', 'GET', '/cities');
    await testAPI('CITIES', 'Search Cities', 'GET', '/cities/search?q=Hà Nội');

    // ========================================
    // 12. NOTIFICATION APIs
    // ========================================
    console.log('\n🔔 NOTIFICATION APIs');
    await testAPI('NOTIFICATIONS', 'Get All Notifications', 'GET', '/notifications');

    // ========================================
    // ❌ FORBIDDEN APIs (Staff KHÔNG có quyền - expect 403)
    // ========================================
    console.log('\n🚫 TESTING FORBIDDEN APIs (Expected 403)');

    // Admin Dashboard - Staff không có quyền
    await testForbiddenAPI('FORBIDDEN', 'Admin Dashboard Overview', 'GET', '/admin/dashboard/overview?' + dates);
    await testForbiddenAPI('FORBIDDEN', 'Admin Revenue Analytics', 'GET', '/admin/dashboard/revenue?' + dates);

    // Business Statistics - Admin only
    await testForbiddenAPI('FORBIDDEN', 'Business Dashboard', 'GET', '/statistics/business/dashboard?' + dates);
    await testForbiddenAPI('FORBIDDEN', 'Business Revenue', 'GET', '/statistics/business/revenue?' + dates);
    await testForbiddenAPI('FORBIDDEN', 'Best Selling Stats', 'GET', '/statistics/business/best-selling?' + dates);

    // Order Statistics - Admin only  
    await testForbiddenAPI('FORBIDDEN', 'Order Statistics', 'GET', '/orders/statistics?' + dates);

    // Payment & Shipment Statistics - Admin only
    await testForbiddenAPI('FORBIDDEN', 'Payment Statistics', 'GET', '/payments/statistics?' + dates);
    await testForbiddenAPI('FORBIDDEN', 'Shipment Statistics', 'GET', '/shipments/statistics');

    // User Management - Admin only
    await testForbiddenAPI('FORBIDDEN', 'Get All Users', 'GET', '/users');
    await testForbiddenAPI('FORBIDDEN', 'Get All Staff', 'GET', '/staff');
    await testForbiddenAPI('FORBIDDEN', 'Get All Admins', 'GET', '/admins');

    // ========================================
    // SUMMARY
    // ========================================
    console.log('\n🏁 ========================================');
    console.log('🏁 STAFF TEST SUMMARY');
    console.log('🏁 ========================================');
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📊 Total: ${passed + failed}`);
    console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

    // Group results by category
    console.log('\n📋 Results by Category:');
    const categories = [...new Set(results.map(r => r.category))];
    categories.forEach(cat => {
        const catResults = results.filter(r => r.category === cat);
        const catPassed = catResults.filter(r => r.success).length;
        const catTotal = catResults.length;
        const status = catPassed === catTotal ? '✅' : catPassed > 0 ? '⚠️' : '❌';
        console.log(`  ${status} ${cat}: ${catPassed}/${catTotal}`);
    });

    // Show failed APIs
    const failedAPIs = results.filter(r => !r.success);
    if (failedAPIs.length > 0) {
        console.log('\n❌ Failed APIs:');
        failedAPIs.forEach(api => {
            console.log(`  - [${api.category}] ${api.name}: ${api.status} - ${api.url}`);
        });
    }

    console.log('\n✨ Staff test completed!');
}

// Run tests
runAllTests().catch(console.error);
