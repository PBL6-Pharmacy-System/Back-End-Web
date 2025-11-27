/**
 * 🧪 COMPREHENSIVE API TEST SCRIPT (Node.js Version)
 * Test tất cả API endpoints trong hệ thống
 * 
 * Cách sử dụng:
 * node scripts/test-all-get-apis.js
 */

const BASE_URL = 'http://localhost:3000/api';
const dates = 'startDate=2025-01-01&endDate=2025-12-31';

let token = null;
let passed = 0;
let failed = 0;
let skipped = 0;
const results = [];

// Login credentials
const ADMIN_CREDENTIALS = {
    username: 'hien12345',
    password: 'hien12345'
};

// ========================================
// VALID TEST IDs (based on actual database)
// ========================================
const TEST_IDS = {
    user: 8,           // User từ ID 8 trở đi tồn tại
    customer: 3,       // Customer từ ID 3 trở đi tồn tại
    customerWithAddress: 3, // Customer 3-6 có address
    order: 9,          // Order từ ID 9 trở đi tồn tại
    transfer: 2,       // Transfer từ ID 2 trở đi tồn tại
    shipment: 1,       // Chỉ có 1 shipment ID 1
    voucher: 'WELCOME2024', // Voucher code tồn tại
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
    admin: 1,
    staff: 1,
    productUnit: 1
};

async function login() {
    try {
        const response = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(ADMIN_CREDENTIALS)
        });
        const data = await response.json();
        if (data.data?.token) {
            token = data.data.token;
            console.log('✅ Login successful!\n');
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

        await new Promise(r => setTimeout(r, 100)); // Tăng delay để tránh rate limit
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
    console.log('🚀 TESTING ALL SYSTEM APIs');
    console.log('🚀 ========================================\n');

    // Login first
    console.log('🔐 Logging in...');
    const loggedIn = await login();
    if (!loggedIn) {
        console.error('❌ Cannot proceed without authentication');
        process.exit(1);
    }

    // ========================================
    // 1. AUTH APIs
    // ========================================
    console.log('\n🔐 AUTH APIs');
    await testAPI('AUTH', 'Get Current User', 'GET', '/auth/me');

    // ========================================
    // 2. USER MANAGEMENT APIs
    // ========================================
    console.log('\n👥 USER MANAGEMENT APIs');

    // Users
    await testAPI('USERS', 'Get All Users', 'GET', '/users');
    await testAPI('USERS', 'Get User By ID', 'GET', `/users/${TEST_IDS.user}`);

    // Customers
    await testAPI('CUSTOMERS', 'Get All Customers', 'GET', '/customers');
    await testAPI('CUSTOMERS', 'Get Customer By ID', 'GET', `/customers/${TEST_IDS.customer}`);
    await testAPI('CUSTOMERS', 'Get Customer Stats', 'GET', `/customers/${TEST_IDS.customer}/stats`);
    await testAPI('CUSTOMERS', 'Get Customer Reviews', 'GET', `/customers/${TEST_IDS.customer}/reviews`);

    // Staff
    await testAPI('STAFF', 'Get All Staff', 'GET', '/staff');
    await testAPI('STAFF', 'Get Staff By ID', 'GET', `/staff/${TEST_IDS.staff}`);
    await testAPI('STAFF', 'Get Staff By Branch', 'GET', `/staff?branchId=${TEST_IDS.branch}`);

    // Admins
    await testAPI('ADMINS', 'Get All Admins', 'GET', '/admins');
    await testAPI('ADMINS', 'Get Admin By ID', 'GET', `/admins/${TEST_IDS.admin}`);

    // ========================================
    // 3. PRODUCT MANAGEMENT APIs
    // ========================================
    console.log('\n📦 PRODUCT MANAGEMENT APIs');

    // Products
    await testAPI('PRODUCTS', 'Get All Products', 'GET', '/products');
    await testAPI('PRODUCTS', 'Search Products', 'GET', '/products/search?q=thuốc');
    await testAPI('PRODUCTS', 'Get Best Sellers', 'GET', '/products/best-sellers');
    await testAPI('PRODUCTS', 'Get Product By ID', 'GET', `/products/${TEST_IDS.product}`);
    await testAPI('PRODUCTS', 'Get Product Stats', 'GET', `/products/${TEST_IDS.product}/stats`);

    // Categories
    await testAPI('CATEGORIES', 'Get All Categories', 'GET', '/categories');
    await testAPI('CATEGORIES', 'Get Category Tree', 'GET', '/categories/tree');
    await testAPI('CATEGORIES', 'Get Category By ID', 'GET', `/categories/${TEST_IDS.category}`);
    await testAPI('CATEGORIES', 'Get Category Stats', 'GET', `/categories/${TEST_IDS.category}/stats`);

    // Suppliers
    await testAPI('SUPPLIERS', 'Get All Suppliers', 'GET', '/suppliers');
    await testAPI('SUPPLIERS', 'Get Supplier By ID', 'GET', `/suppliers/${TEST_IDS.supplier}`);

    // Product Units
    await testAPI('PRODUCT_UNITS', 'Get All Product Units', 'GET', '/productunits');
    await testAPI('PRODUCT_UNITS', 'Get Product Unit By ID', 'GET', `/productunits/${TEST_IDS.productUnit}`);
    await testAPI('PRODUCT_UNITS', 'Get Units By Product', 'GET', `/product-units/product/${TEST_IDS.product}`);

    // ========================================
    // 4. INVENTORY MANAGEMENT APIs
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
    await testAPI('BRANCH_INV', 'Get Branch Inventory Details', 'GET', `/branches/${TEST_IDS.branch}/inventory/${TEST_IDS.product}`);
    await testAPI('BRANCH_INV', 'Get Expiring Soon Batches', 'GET', `/branches/${TEST_IDS.branch}/inventory/alerts/expiring-soon`);
    await testAPI('BRANCH_INV', 'Get Branch Low Stock', 'GET', `/branches/${TEST_IDS.branch}/inventory/alerts/low-stock`);

    // Product Batches
    await testAPI('BATCHES', 'Get All Product Batches', 'GET', '/product-batches');
    await testAPI('BATCHES', 'Get Batches Expiring Soon', 'GET', '/product-batches/expiring-soon');
    await testAPI('BATCHES', 'Get Product Batch By ID', 'GET', `/product-batches/${TEST_IDS.productBatch}`);
    await testAPI('BATCHES', 'Get Available Batches FEFO', 'GET', `/product-batches/fefo/${TEST_IDS.branch}/${TEST_IDS.product}`);
    await testAPI('BATCHES', 'Get Batch Summary', 'GET', `/product-batches/summary/${TEST_IDS.branch}/${TEST_IDS.product}`);
    await testAPI('BATCHES', 'Validate Stock Consistency', 'GET', `/product-batches/validate/${TEST_IDS.branch}/${TEST_IDS.product}`);
    await testAPI('BATCHES', 'Generate Batch Number', 'GET', `/product-batches/generate-number/${TEST_IDS.branch}/${TEST_IDS.product}`);

    // Inventory Transfers
    await testAPI('TRANSFERS', 'Get All Transfers', 'GET', '/inventory-transfers');
    await testAPI('TRANSFERS', 'Get Transfer By ID', 'GET', `/inventory-transfers/${TEST_IDS.transfer}`);

    // Stock Takes
    await testAPI('STOCK_TAKE', 'Get All Stock Takes', 'GET', '/stock-takes');
    await testAPI('STOCK_TAKE', 'Get Stock Take By ID', 'GET', `/stock-takes/${TEST_IDS.stockTake}`);
    await testAPI('STOCK_TAKE', 'Get Stock Take Items', 'GET', `/stock-takes/${TEST_IDS.stockTake}/items`);

    // Stock Operations (Documentation)
    await testAPI('STOCK_OPS', 'Get Stock Operations Info', 'GET', '/stock-operations');

    // ========================================
    // 5. ORDER MANAGEMENT APIs
    // ========================================
    console.log('\n🛒 ORDER MANAGEMENT APIs');

    // Orders
    await testAPI('ORDERS', 'Get All Orders', 'GET', '/orders');
    await testAPI('ORDERS', 'Get Order Statistics', 'GET', '/orders/statistics?' + dates);
    await testAPI('ORDERS', 'Get Order By ID', 'GET', `/orders/${TEST_IDS.order}`);
    await testAPI('ORDERS', 'Get Customer Orders', 'GET', `/customers/${TEST_IDS.customer}/orders`);

    // Payments
    await testAPI('PAYMENTS', 'Get Payment Statistics', 'GET', '/payments/statistics?' + dates);
    await testAPI('PAYMENTS', 'Get Payment By ID', 'GET', `/payments/${TEST_IDS.payment}`);

    // ========================================
    // 6. SHIPPING MANAGEMENT APIs
    // ========================================
    console.log('\n🚚 SHIPPING MANAGEMENT APIs');

    // Shipments
    await testAPI('SHIPMENTS', 'Get All Shipments', 'GET', '/shipments');
    await testAPI('SHIPMENTS', 'Get Shipment Statistics', 'GET', '/shipments/statistics');
    await testAPI('SHIPMENTS', 'Get Shipment By ID', 'GET', `/shipments/${TEST_IDS.shipment}`);
    await testAPI('SHIPMENTS', 'Get Order Shipments', 'GET', `/orders/${TEST_IDS.order}/shipments`);

    // Shipping Fees
    await testAPI('SHIPPING_FEES', 'Get Shipping Zones', 'GET', '/shipping/zones');
    await testAPI('SHIPPING_FEES', 'Calculate Fee', 'GET', '/shipping/calculate?distance=10');

    // Shipping Addresses
    await testAPI('ADDRESSES', 'Get Customer Addresses', 'GET', `/customers/${TEST_IDS.customerWithAddress}/shipping-addresses`);
    await testAPI('ADDRESSES', 'Get Default Address', 'GET', `/customers/${TEST_IDS.customerWithAddress}/shipping-addresses/default`);
    await testAPI('ADDRESSES', 'Get Address By ID', 'GET', `/shipping-addresses/${TEST_IDS.shippingAddress}`);

    // ========================================
    // 7. PROMOTION MANAGEMENT APIs
    // ========================================
    console.log('\n🎁 PROMOTION MANAGEMENT APIs');

    // Flash Sales
    await testAPI('FLASHSALES', 'Get Active Flashsale', 'GET', '/flashsales/active');
    await testAPI('FLASHSALES', 'Get All Flashsales (Admin)', 'GET', '/flashsales');

    // Vouchers
    await testAPI('VOUCHERS', 'Get Available Vouchers', 'GET', '/vouchers/available');
    await testAPI('VOUCHERS', 'Get All Vouchers (Admin)', 'GET', '/vouchers');
    await testAPI('VOUCHERS', 'Get Voucher By ID', 'GET', `/vouchers/${TEST_IDS.flashsale}`);
    await testAPI('VOUCHERS', 'Check Voucher Code', 'GET', `/vouchers/check/${TEST_IDS.voucher}`);

    // ========================================
    // 8. REVIEW MANAGEMENT APIs
    // ========================================
    console.log('\n⭐ REVIEW MANAGEMENT APIs');

    await testAPI('REVIEWS', 'Get All Reviews', 'GET', '/reviews');
    await testAPI('REVIEWS', 'Get Review By ID', 'GET', `/reviews/${TEST_IDS.review}`);
    await testAPI('REVIEWS', 'Get Product Reviews', 'GET', `/products/${TEST_IDS.product}/reviews`);
    await testAPI('REVIEWS', 'Get Product Rating Stats', 'GET', `/products/${TEST_IDS.product}/rating-stats`);

    // ========================================
    // 9. NOTIFICATION MANAGEMENT APIs
    // ========================================
    console.log('\n🔔 NOTIFICATION MANAGEMENT APIs');

    await testAPI('NOTIFICATIONS', 'Get All Notifications', 'GET', '/notifications');
    await testAPI('NOTIFICATIONS', 'Get Notification By ID', 'GET', `/notifications/${TEST_IDS.notification}`);

    // ========================================
    // 10. PRESCRIPTION (MEDICAL) APIs
    // ========================================
    console.log('\n💊 PRESCRIPTION APIs');

    await testAPI('PRESCRIPTIONS', 'Get All Prescriptions', 'GET', '/prescriptions');
    await testAPI('PRESCRIPTIONS', 'Get Prescription Statistics', 'GET', '/prescriptions/statistics?' + dates);
    await testAPI('PRESCRIPTIONS', 'Get Prescription By ID', 'GET', `/prescriptions/${TEST_IDS.prescription}`);
    await testAPI('PRESCRIPTIONS', 'Get Customer Prescriptions', 'GET', `/customers/${TEST_IDS.customer}/prescriptions`);

    // ========================================
    // 11. LOCATION APIs
    // ========================================
    console.log('\n📍 LOCATION APIs');

    await testAPI('CITIES', 'Get All Cities', 'GET', '/cities');
    await testAPI('CITIES', 'Search Cities', 'GET', '/cities/search?q=Hà Nội');
    await testAPI('CITIES', 'Get City By ID', 'GET', `/cities/${TEST_IDS.city}`);

    // ========================================
    // 12. STATISTICS APIs
    // ========================================
    console.log('\n📈 STATISTICS APIs');

    // Business Statistics
    await testAPI('BIZ_STATS', 'Dashboard Overview', 'GET', '/statistics/business/dashboard?' + dates);
    await testAPI('BIZ_STATS', 'Revenue By Period', 'GET', '/statistics/business/revenue?' + dates);
    await testAPI('BIZ_STATS', 'Orders By Status', 'GET', '/statistics/business/orders-by-status?' + dates);
    await testAPI('BIZ_STATS', 'Best Selling Products', 'GET', '/statistics/business/best-selling?' + dates);
    await testAPI('BIZ_STATS', 'Top Customers', 'GET', '/statistics/business/top-customers?' + dates);
    await testAPI('BIZ_STATS', 'Voucher Performance', 'GET', '/statistics/business/voucher-performance?' + dates);
    await testAPI('BIZ_STATS', 'Flashsale Performance', 'GET', '/statistics/business/flashsale-performance?' + dates);
    await testAPI('BIZ_STATS', 'Conversion Rate', 'GET', '/statistics/business/conversion-rate?' + dates);
    await testAPI('BIZ_STATS', 'Average Order Value', 'GET', '/statistics/business/average-order-value?' + dates);
    await testAPI('BIZ_STATS', 'Revenue By Payment Method', 'GET', '/statistics/business/payment-methods?' + dates);

    // Inventory Statistics
    await testAPI('INV_STATS', 'Inventory Overview', 'GET', '/statistics/inventory/overview');
    await testAPI('INV_STATS', 'Inventory By Branch', 'GET', `/statistics/inventory/branch/${TEST_IDS.branch}`);
    await testAPI('INV_STATS', 'Low Stock Products', 'GET', '/statistics/inventory/low-stock');
    await testAPI('INV_STATS', 'Overstock Products', 'GET', '/statistics/inventory/overstock');
    await testAPI('INV_STATS', 'Inventory Movements', 'GET', '/statistics/inventory/movements?' + dates);
    await testAPI('INV_STATS', 'Top Imported Products', 'GET', '/statistics/inventory/top-imported?' + dates);
    await testAPI('INV_STATS', 'Top Exported Products', 'GET', '/statistics/inventory/top-exported?' + dates);
    await testAPI('INV_STATS', 'Inventory By Category', 'GET', '/statistics/inventory/by-category');

    // ========================================
    // 13. ADMIN DASHBOARD APIs
    // ========================================
    console.log('\n🎛️ ADMIN DASHBOARD APIs');

    const dashboardBase = '/admin/dashboard';
    await testAPI('DASHBOARD', 'Overview', 'GET', dashboardBase + '/overview?' + dates);
    await testAPI('DASHBOARD', 'Revenue Analytics', 'GET', dashboardBase + '/revenue?' + dates);
    await testAPI('DASHBOARD', 'Top Products', 'GET', dashboardBase + '/top-products?' + dates);
    await testAPI('DASHBOARD', 'Orders Stats', 'GET', dashboardBase + '/orders-stats?' + dates);
    await testAPI('DASHBOARD', 'Customers Stats', 'GET', dashboardBase + '/customers-stats?' + dates);
    await testAPI('DASHBOARD', 'Inventory Stats', 'GET', dashboardBase + '/inventory-stats');
    await testAPI('DASHBOARD', 'Branches Performance', 'GET', dashboardBase + '/branches-performance?' + dates);
    await testAPI('DASHBOARD', 'Promotions Stats', 'GET', dashboardBase + '/promotions-stats?' + dates);
    await testAPI('DASHBOARD', 'Reviews Stats', 'GET', dashboardBase + '/reviews-stats?limit=10');
    await testAPI('DASHBOARD', 'Recent Activities', 'GET', dashboardBase + '/recent-activities?limit=10');

    // ========================================
    // SUMMARY
    // ========================================
    console.log('\n🏁 ========================================');
    console.log('🏁 TEST SUMMARY');
    console.log('🏁 ========================================');
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⏭️ Skipped: ${skipped}`);
    console.log(`📊 Total: ${passed + failed + skipped}`);
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

    console.log('\n✨ Test completed!');
}

// Run tests
runAllTests().catch(console.error);
