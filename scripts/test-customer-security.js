/**
 * 🔒 CUSTOMER SECURITY TEST SCRIPT
 * Test TẤT CẢ API endpoints với tài khoản Customer để phát hiện lỗ hổng bảo mật
 * 
 * Mục đích:
 * - Kiểm tra xem Customer có thể truy cập API admin/staff không (phải bị chặn)
 * - Kiểm tra xem Customer có thể truy cập dữ liệu của customer khác không
 * - Phát hiện các lỗ hổng authorization/authentication
 * 
 * Cách sử dụng:
 * node scripts/test-customer-security.js
 */

import * as readline from 'readline';

const BASE_URL = 'http://localhost:3000/api';
const dates = 'startDate=2025-01-01&endDate=2025-12-31';

let token = null;
let currentUser = null;
let passed = 0;
let failed = 0;
const results = [];
const securityIssues = [];

// Customer phone number for OTP login
const CUSTOMER_PHONE = '0321321321'; // Thay đổi số điện thoại của customer ở đây

// ========================================
// TEST IDs - Dùng để test
// ========================================
const TEST_IDS = {
    // IDs của chính customer đang test
    ownCustomerId: null, // Sẽ được set sau khi login

    // IDs của USER KHÁC (để test xem có truy cập được không)
    otherCustomerId: 5,
    otherUserId: 10,

    // Resource IDs
    order: 9,
    orderOfOtherCustomer: 1, // Order của customer khác
    product: 1,
    category: 1,
    supplier: 1,
    branch: 1,
    branchInventory: 1,
    productBatch: 1,
    stockTake: 1,
    transfer: 2,
    shipment: 1,
    voucher: 'WELCOME2024',
    review: 1,
    notification: 1,
    prescription: 1,
    city: 1,
    payment: 1,
    shippingAddress: 1,
    flashsale: 1,
    admin: 1,
    staff: 8,
    productUnit: 1
};

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * Đọc input từ console
 */
function askQuestion(question) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            rl.close();
            resolve(answer.trim());
        });
    });
}

/**
 * Step 1: Request OTP
 */
async function requestOTP(phone) {
    try {
        console.log(`📱 Đang gửi OTP đến số ${phone}...`);
        const response = await fetch(`${BASE_URL}/auth/otp/request`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone })
        });
        const data = await response.json();

        if (response.ok && data.success) {
            console.log('✅ OTP đã được gửi thành công!');
            if (data.data?.otp) {
                // Development mode - OTP được trả về trong response
                console.log(`🔑 OTP (dev mode): ${data.data.otp}`);
            }
            return true;
        } else {
            console.error('❌ Gửi OTP thất bại:', data.error || data.message);
            return false;
        }
    } catch (error) {
        console.error('❌ Lỗi khi gửi OTP:', error.message);
        return false;
    }
}

/**
 * Step 2: Login with OTP
 */
async function loginWithOTP(phone, otp) {
    try {
        console.log('🔐 Đang đăng nhập với OTP...');
        const response = await fetch(`${BASE_URL}/auth/customer/login-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone, otp })
        });
        const data = await response.json();

        if (data.data?.token) {
            token = data.data.token;
            currentUser = data.data.user || data.data.customer || {};

            // Lấy customer_id từ nhiều nguồn có thể
            TEST_IDS.ownCustomerId = currentUser.customer_id || currentUser.customers?.id || currentUser.id || data.data.customer_id;

            console.log('✅ Đăng nhập Customer thành công!');
            console.log(`   Phone: ${phone}`);
            console.log(`   Role: ${currentUser.role_name || currentUser.roles?.role_name || 'customer'}`);
            console.log(`   Customer ID: ${TEST_IDS.ownCustomerId || 'N/A'}`);
            console.log(`   User ID: ${currentUser.id || currentUser.user_id || 'N/A'}`);

            // Gọi /auth/me để lấy thông tin đầy đủ
            await fetchCurrentUserInfo();

            return true;
        } else {
            console.error('❌ Đăng nhập thất bại:', data.error || data.message);
            return false;
        }
    } catch (error) {
        console.error('❌ Lỗi khi đăng nhập:', error.message);
        return false;
    }
}

/**
 * Fetch thông tin user đầy đủ từ /auth/me
 */
async function fetchCurrentUserInfo() {
    try {
        const response = await fetch(`${BASE_URL}/auth/me`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        const data = await response.json();

        if (data.success && data.data) {
            const user = data.data;
            currentUser = {
                ...currentUser,
                ...user,
                role_name: user.roles?.role_name || user.role_name || 'customer'
            };

            // Cập nhật customer_id nếu chưa có
            if (!TEST_IDS.ownCustomerId && user.customers?.id) {
                TEST_IDS.ownCustomerId = user.customers.id;
            }

            console.log(`   📋 Thông tin từ /auth/me:`);
            console.log(`      - Full name: ${user.full_name || 'Chưa cập nhật'}`);
            console.log(`      - Role: ${currentUser.role_name}`);
            console.log(`      - Customer ID: ${TEST_IDS.ownCustomerId || user.customers?.id || 'N/A'}\n`);
        }
    } catch (error) {
        console.log('⚠️ Không thể lấy thông tin từ /auth/me:', error.message);
    }
}

/**
 * Full login flow with OTP
 */
async function login() {
    // Hỏi số điện thoại
    let phone = await askQuestion(`📱 Nhập số điện thoại customer (Enter để dùng ${CUSTOMER_PHONE}): `);
    if (!phone) phone = CUSTOMER_PHONE;

    // Bước 1: Request OTP
    const otpSent = await requestOTP(phone);
    if (!otpSent) return false;

    // Bước 2: Nhập OTP
    const otp = await askQuestion('🔑 Nhập mã OTP: ');
    if (!otp) {
        console.error('❌ Bạn chưa nhập OTP!');
        return false;
    }

    // Bước 3: Login với OTP
    return await loginWithOTP(phone, otp);
}

/**
 * Test API mà Customer CÓ QUYỀN truy cập
 */
async function testAllowedAPI(category, name, method, url, body = null) {
    return await testAPI(category, name, method, url, body, 'ALLOWED', [200, 201]);
}

/**
 * Test API PUBLIC (không cần auth) - cho phép cả 200 và 403 nếu có vấn đề khác
 */
async function testPublicAPI(category, name, method, url, body = null) {
    return await testAPI(category, name, method, url, body, 'PUBLIC', [200, 201]);
}

/**
 * Test API mà Customer KHÔNG CÓ QUYỀN truy cập
 * Expect: 401 (Unauthorized) hoặc 403 (Forbidden)
 */
async function testForbiddenAPI(category, name, method, url, body = null) {
    return await testAPI(category, name, method, url, body, 'FORBIDDEN', [401, 403]);
}

/**
 * Test API truy cập dữ liệu của NGƯỜI KHÁC
 * Expect: 403 (Forbidden) hoặc 404 (Not Found - ẩn dữ liệu)
 */
async function testOtherUserDataAPI(category, name, method, url, body = null) {
    return await testAPI(category, name, method, url, body, 'OTHER_USER', [403, 404]);
}

/**
 * Core test function
 */
async function testAPI(category, name, method, url, body, expectType, expectedStatuses) {
    try {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        // Chỉ thêm Authorization header nếu có token và không phải PUBLIC API
        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }

        if (body && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
            options.body = JSON.stringify(body);
        }

        const response = await fetch(BASE_URL + url, options);
        const data = await response.json().catch(() => ({}));

        let success = false;
        let icon = '';
        let securityStatus = '';

        if (expectType === 'ALLOWED' || expectType === 'PUBLIC') {
            // API được phép - expect 200/201
            success = expectedStatuses.includes(response.status);
            icon = success ? '✅' : '❌';
            securityStatus = success ? 'OK' : `UNEXPECTED (${data.error || data.message || 'No message'})`;
        } else if (expectType === 'FORBIDDEN') {
            // API bị cấm - expect 401/403
            if (expectedStatuses.includes(response.status)) {
                success = true;
                icon = '🔒';
                securityStatus = 'BLOCKED';
            } else if (response.status === 200 || response.status === 201) {
                // 🚨 LỖ HỔNG BẢO MẬT! Customer truy cập được API admin/staff
                success = false;
                icon = '🚨';
                securityStatus = 'VULNERABILITY';
                securityIssues.push({
                    type: 'UNAUTHORIZED_ACCESS',
                    severity: 'CRITICAL',
                    category,
                    name,
                    method,
                    url,
                    status: response.status,
                    message: `Customer có thể truy cập API ${method} ${url} (chỉ dành cho admin/staff)`
                });
            } else {
                // Các status khác (400, 404, 500) - không phải lỗ hổng nhưng cần chú ý
                success = true; // Coi như passed vì không phải vulnerability
                icon = '⚠️';
                securityStatus = `OTHER (${response.status})`;
            }
        } else if (expectType === 'OTHER_USER') {
            // Truy cập dữ liệu người khác - expect 403/404
            if (expectedStatuses.includes(response.status)) {
                success = true;
                icon = '🔒';
                securityStatus = 'BLOCKED';
            } else if (response.status === 200) {
                // 🚨 LỖ HỔNG! Customer xem được dữ liệu của người khác
                success = false;
                icon = '🚨';
                securityStatus = 'VULNERABILITY';
                securityIssues.push({
                    type: 'DATA_EXPOSURE',
                    severity: 'HIGH',
                    category,
                    name,
                    method,
                    url,
                    status: response.status,
                    message: `Customer có thể xem dữ liệu của người khác qua ${method} ${url}`
                });
            } else {
                // Các status khác - không phải lỗ hổng
                success = true;
                icon = '⚠️';
                securityStatus = `OTHER (${response.status})`;
            }
        }

        if (success) {
            passed++;
        } else {
            failed++;
        }

        const statusText = `${response.status} [${securityStatus}]`;
        console.log(`${icon} [${category}] ${name}: ${statusText}`);

        results.push({
            category,
            name,
            method,
            url,
            expectType,
            expectedStatuses,
            actualStatus: response.status,
            success,
            securityStatus,
            data
        });

        await new Promise(r => setTimeout(r, 100));
        return { success, data, status: response.status, securityStatus };
    } catch (error) {
        failed++;
        console.error(`❌ [${category}] ${name}: Network Error - ${error.message}`);
        results.push({
            category,
            name,
            method,
            url,
            expectType,
            success: false,
            error: error.message
        });
        return { success: false, error };
    }
}

// ========================================
// MAIN TEST FUNCTION
// ========================================

async function runSecurityTests() {
    console.log('🔒 ========================================');
    console.log('🔒 CUSTOMER SECURITY TEST');
    console.log('🔒 Kiểm tra lỗ hổng bảo mật với tài khoản Customer');
    console.log('🔒 ========================================\n');

    // Login với OTP
    console.log('🔐 Đăng nhập Customer bằng OTP...\n');
    const loggedIn = await login();
    if (!loggedIn) {
        console.error('❌ Không thể đăng nhập. Dừng test.');
        process.exit(1);
    }

    // ========================================
    // SECTION 1: APIs CUSTOMER ĐƯỢC PHÉP (expect 200)
    // ========================================
    console.log('\n' + '='.repeat(60));
    console.log('📗 SECTION 1: APIs CUSTOMER ĐƯỢC PHÉP TRUY CẬP');
    console.log('='.repeat(60));

    // Auth
    console.log('\n🔐 AUTH APIs');
    await testAllowedAPI('AUTH', 'Get Current User', 'GET', '/auth/me');

    // Products (Public)
    console.log('\n📦 PRODUCT APIs (Public)');
    await testPublicAPI('PRODUCTS', 'Get All Products', 'GET', '/products');
    await testPublicAPI('PRODUCTS', 'Search Products', 'GET', '/products/search?q=thuốc');
    await testPublicAPI('PRODUCTS', 'Get Best Sellers', 'GET', '/products/best-sellers');
    await testPublicAPI('PRODUCTS', 'Get Product By ID', 'GET', `/products/${TEST_IDS.product}`);

    // Categories (Public)
    console.log('\n📂 CATEGORY APIs (Public)');
    await testPublicAPI('CATEGORIES', 'Get All Categories', 'GET', '/categories');
    await testPublicAPI('CATEGORIES', 'Get Category Tree', 'GET', '/categories/tree');
    await testPublicAPI('CATEGORIES', 'Get Category By ID', 'GET', `/categories/${TEST_IDS.category}`);

    // Suppliers (Public)
    await testPublicAPI('SUPPLIERS', 'Get All Suppliers', 'GET', '/suppliers');

    // Product Units (Public)
    await testPublicAPI('PRODUCT_UNITS', 'Get All Units', 'GET', '/productunits');

    // Branches (Public)
    console.log('\n🏪 BRANCH APIs (Public)');
    await testPublicAPI('BRANCHES', 'Get All Branches', 'GET', '/branches');
    await testPublicAPI('BRANCHES', 'Get Branch By ID', 'GET', `/branches/${TEST_IDS.branch}`);

    // Reviews (Public)
    console.log('\n⭐ REVIEW APIs (Public)');
    await testPublicAPI('REVIEWS', 'Get All Reviews', 'GET', '/reviews');
    await testPublicAPI('REVIEWS', 'Get Product Reviews', 'GET', `/products/${TEST_IDS.product}/reviews`);

    // Promotions (Public)
    console.log('\n🎁 PROMOTION APIs (Public)');
    await testPublicAPI('FLASHSALES', 'Get Active Flashsale', 'GET', '/flashsales/active');
    await testPublicAPI('VOUCHERS', 'Get Available Vouchers', 'GET', '/vouchers/available');

    // Cities (Public) - Đường dẫn đúng theo app.js
    console.log('\n📍 LOCATION APIs (Public)');
    await testPublicAPI('CITIES', 'Get All Cities', 'GET', '/cities');
    await testPublicAPI('CITIES', 'Search Cities', 'GET', '/cities/search?q=Hà Nội');

    // Shipping (Public) - Đường dẫn đúng: /shipping/...
    console.log('\n🚚 SHIPPING APIs (Public)');
    await testPublicAPI('SHIPPING', 'Get Shipping Zones', 'GET', '/shipping/zones');
    await testPublicAPI('SHIPPING', 'Calculate Fee', 'GET', '/shipping/calculate?distance=10');

    // Customer's OWN data
    console.log('\n👤 CUSTOMER OWN DATA APIs');
    if (TEST_IDS.ownCustomerId) {
        await testAllowedAPI('OWN_DATA', 'Get Own Orders', 'GET', `/customers/${TEST_IDS.ownCustomerId}/orders`);
        await testAllowedAPI('OWN_DATA', 'Get Own Addresses', 'GET', `/customers/${TEST_IDS.ownCustomerId}/shipping-addresses`);
        await testAllowedAPI('OWN_DATA', 'Get Own Reviews', 'GET', `/customers/${TEST_IDS.ownCustomerId}/reviews`);
        await testAllowedAPI('OWN_DATA', 'Get Own Stats', 'GET', `/customers/${TEST_IDS.ownCustomerId}/stats`);
    } else {
        console.log('⚠️ Không có Customer ID, bỏ qua test OWN_DATA');
    }

    // Notifications (Own)
    await testAllowedAPI('NOTIFICATIONS', 'Get Own Notifications', 'GET', '/notifications');

    // ========================================
    // SECTION 2: APIs ADMIN/STAFF ONLY (expect 403)
    // ========================================
    console.log('\n' + '='.repeat(60));
    console.log('📕 SECTION 2: APIs CHỈ DÀNH CHO ADMIN/STAFF (expect 403)');
    console.log('='.repeat(60));

    // User Management
    console.log('\n👥 USER MANAGEMENT APIs (Admin Only)');
    await testForbiddenAPI('USERS', 'Get All Users', 'GET', '/users');
    await testForbiddenAPI('USERS', 'Get User By ID', 'GET', `/users/${TEST_IDS.otherUserId}`);
    await testForbiddenAPI('USERS', 'Create User', 'POST', '/users', { username: 'test', password: 'test', role_id: 1 });
    await testForbiddenAPI('USERS', 'Update User', 'PUT', `/users/${TEST_IDS.otherUserId}`, { full_name: 'Hacked' });
    await testForbiddenAPI('USERS', 'Delete User', 'DELETE', `/users/${TEST_IDS.otherUserId}`);

    // Customer Management (Admin)
    console.log('\n👥 CUSTOMER MANAGEMENT APIs (Admin Only)');
    await testForbiddenAPI('CUSTOMERS', 'Get All Customers', 'GET', '/customers');
    await testForbiddenAPI('CUSTOMERS', 'Create Customer', 'POST', '/customers', { full_name: 'Hacker' });
    await testForbiddenAPI('CUSTOMERS', 'Delete Customer', 'DELETE', `/customers/${TEST_IDS.otherCustomerId}`);

    // Staff Management (Admin)
    console.log('\n👔 STAFF MANAGEMENT APIs (Admin Only)');
    await testForbiddenAPI('STAFF', 'Get All Staff', 'GET', '/staff');
    await testForbiddenAPI('STAFF', 'Get Staff By ID', 'GET', `/staff/${TEST_IDS.staff}`);
    await testForbiddenAPI('STAFF', 'Create Staff', 'POST', '/staff', { username: 'hacker', password: '123456', branch_id: 1 });
    await testForbiddenAPI('STAFF', 'Update Staff', 'PUT', `/staff/${TEST_IDS.staff}`, { full_name: 'Hacked' });
    await testForbiddenAPI('STAFF', 'Delete Staff', 'DELETE', `/staff/${TEST_IDS.staff}`);

    // Admin Management (Admin)
    console.log('\n👑 ADMIN MANAGEMENT APIs (Admin Only)');
    await testForbiddenAPI('ADMINS', 'Get All Admins', 'GET', '/admins');
    await testForbiddenAPI('ADMINS', 'Get Admin By ID', 'GET', `/admins/${TEST_IDS.admin}`);
    await testForbiddenAPI('ADMINS', 'Create Admin', 'POST', '/admins', { username: 'hacker', password: '123456' });
    await testForbiddenAPI('ADMINS', 'Delete Admin', 'DELETE', `/admins/${TEST_IDS.admin}`);

    // Order Management (Admin/Staff)
    console.log('\n🛒 ORDER MANAGEMENT APIs (Admin/Staff Only)');
    await testForbiddenAPI('ORDERS', 'Get All Orders', 'GET', '/orders');
    await testForbiddenAPI('ORDERS', 'Get Order Statistics', 'GET', '/orders/statistics?' + dates);
    await testForbiddenAPI('ORDERS', 'Update Order Status', 'PUT', `/orders/${TEST_IDS.order}/status`, { status: 'cancelled' });
    await testForbiddenAPI('ORDERS', 'Update Order Note', 'PUT', `/orders/${TEST_IDS.order}/note`, { note: 'Hacked' });
    await testForbiddenAPI('ORDERS', 'Cancel Order (Admin)', 'POST', `/orders/${TEST_IDS.order}/cancel`, { reason: 'Test' });

    // Payment Management
    console.log('\n💳 PAYMENT APIs (Admin/Staff Only)');
    await testForbiddenAPI('PAYMENTS', 'Get Payment Statistics', 'GET', '/payments/statistics?' + dates);
    await testForbiddenAPI('PAYMENTS', 'Update Payment Status', 'PUT', `/payments/${TEST_IDS.payment}/status`, { status: 'completed' });

    // Shipment Management
    console.log('\n🚚 SHIPMENT MANAGEMENT APIs (Admin/Staff Only)');
    await testForbiddenAPI('SHIPMENTS', 'Get All Shipments', 'GET', '/shipments');
    await testForbiddenAPI('SHIPMENTS', 'Get Shipment Statistics', 'GET', '/shipments/statistics');
    await testForbiddenAPI('SHIPMENTS', 'Create Shipment', 'POST', '/shipments', { order_id: 1 });
    await testForbiddenAPI('SHIPMENTS', 'Update Shipment Status', 'PUT', `/shipments/${TEST_IDS.shipment}/status`, { status: 'delivered' });

    // Inventory Management
    console.log('\n📦 INVENTORY MANAGEMENT APIs (Admin/Staff Only)');
    await testForbiddenAPI('INVENTORY', 'Get All Branch Inventory', 'GET', '/branch-inventory');
    await testForbiddenAPI('INVENTORY', 'Get Low Stock', 'GET', '/branch-inventory/alerts/low-stock');
    await testForbiddenAPI('INVENTORY', 'Create Branch Inventory', 'POST', '/branch-inventory', { branch_id: 1, product_id: 1 });

    // Product Batches
    console.log('\n📦 PRODUCT BATCH APIs (Admin/Staff Only)');
    await testForbiddenAPI('BATCHES', 'Get All Batches', 'GET', '/product-batches');
    await testForbiddenAPI('BATCHES', 'Get Expiring Soon', 'GET', '/product-batches/expiring-soon');
    await testForbiddenAPI('BATCHES', 'Create Batch', 'POST', '/product-batches', { batch_number: 'TEST', product_id: 1 });

    // Inventory Transfers
    console.log('\n🔄 INVENTORY TRANSFER APIs (Admin/Staff Only)');
    await testForbiddenAPI('TRANSFERS', 'Get All Transfers', 'GET', '/inventory-transfers');
    await testForbiddenAPI('TRANSFERS', 'Get Transfer By ID', 'GET', `/inventory-transfers/${TEST_IDS.transfer}`);
    await testForbiddenAPI('TRANSFERS', 'Create Transfer', 'POST', '/inventory-transfers', { from_branch_id: 1, to_branch_id: 2 });

    // Stock Takes
    console.log('\n📋 STOCK TAKE APIs (Admin/Staff Only)');
    await testForbiddenAPI('STOCK_TAKES', 'Get All Stock Takes', 'GET', '/stock-takes');
    await testForbiddenAPI('STOCK_TAKES', 'Create Stock Take', 'POST', '/stock-takes', { branch_id: 1 });

    // Product Management (Admin)
    console.log('\n📦 PRODUCT MANAGEMENT APIs (Admin Only)');
    await testForbiddenAPI('PRODUCTS_ADMIN', 'Create Product', 'POST', '/products', { name: 'Hacked Product', price: 1000 });
    await testForbiddenAPI('PRODUCTS_ADMIN', 'Update Product', 'PUT', `/products/${TEST_IDS.product}`, { name: 'Hacked' });
    await testForbiddenAPI('PRODUCTS_ADMIN', 'Delete Product', 'DELETE', `/products/${TEST_IDS.product}`);

    // Category Management (Admin)
    console.log('\n📂 CATEGORY MANAGEMENT APIs (Admin Only)');
    await testForbiddenAPI('CATEGORIES_ADMIN', 'Create Category', 'POST', '/categories', { name: 'Hacked Category' });
    await testForbiddenAPI('CATEGORIES_ADMIN', 'Update Category', 'PUT', `/categories/${TEST_IDS.category}`, { name: 'Hacked' });
    await testForbiddenAPI('CATEGORIES_ADMIN', 'Delete Category', 'DELETE', `/categories/${TEST_IDS.category}`);

    // Supplier Management (Admin)
    console.log('\n🏭 SUPPLIER MANAGEMENT APIs (Admin Only)');
    await testForbiddenAPI('SUPPLIERS_ADMIN', 'Create Supplier', 'POST', '/suppliers', { name: 'Hacked Supplier' });
    await testForbiddenAPI('SUPPLIERS_ADMIN', 'Update Supplier', 'PUT', `/suppliers/${TEST_IDS.supplier}`, { name: 'Hacked' });
    await testForbiddenAPI('SUPPLIERS_ADMIN', 'Delete Supplier', 'DELETE', `/suppliers/${TEST_IDS.supplier}`);

    // Branch Management (Admin)
    console.log('\n🏪 BRANCH MANAGEMENT APIs (Admin Only)');
    await testForbiddenAPI('BRANCHES_ADMIN', 'Create Branch', 'POST', '/branches', { name: 'Hacked Branch' });
    await testForbiddenAPI('BRANCHES_ADMIN', 'Update Branch', 'PUT', `/branches/${TEST_IDS.branch}`, { name: 'Hacked' });
    await testForbiddenAPI('BRANCHES_ADMIN', 'Delete Branch', 'DELETE', `/branches/${TEST_IDS.branch}`);

    // Voucher Management (Admin)
    console.log('\n🎫 VOUCHER MANAGEMENT APIs (Admin Only)');
    await testForbiddenAPI('VOUCHERS_ADMIN', 'Get All Vouchers', 'GET', '/vouchers');
    await testForbiddenAPI('VOUCHERS_ADMIN', 'Create Voucher', 'POST', '/vouchers', { code: 'HACKED', discount: 100 });
    await testForbiddenAPI('VOUCHERS_ADMIN', 'Update Voucher', 'PUT', `/vouchers/${TEST_IDS.flashsale}`, { discount: 100 });
    await testForbiddenAPI('VOUCHERS_ADMIN', 'Delete Voucher', 'DELETE', `/vouchers/${TEST_IDS.flashsale}`);

    // Flashsale Management (Admin)
    console.log('\n⚡ FLASHSALE MANAGEMENT APIs (Admin Only)');
    await testForbiddenAPI('FLASHSALES_ADMIN', 'Get All Flashsales', 'GET', '/flashsales');
    await testForbiddenAPI('FLASHSALES_ADMIN', 'Create Flashsale', 'POST', '/flashsales', { name: 'Hacked Sale' });

    // Prescription Management (Admin/Staff)
    console.log('\n💊 PRESCRIPTION APIs (Admin/Staff Only)');
    await testForbiddenAPI('PRESCRIPTIONS', 'Get All Prescriptions', 'GET', '/prescriptions');
    await testForbiddenAPI('PRESCRIPTIONS', 'Get Prescription Statistics', 'GET', '/prescriptions/statistics?' + dates);

    // Statistics (Admin)
    console.log('\n📊 STATISTICS APIs (Admin Only)');
    await testForbiddenAPI('STATISTICS', 'Business Dashboard', 'GET', '/statistics/business/dashboard?' + dates);
    await testForbiddenAPI('STATISTICS', 'Revenue By Period', 'GET', '/statistics/business/revenue?' + dates);
    await testForbiddenAPI('STATISTICS', 'Best Selling Products', 'GET', '/statistics/business/best-selling?' + dates);
    await testForbiddenAPI('STATISTICS', 'Top Customers', 'GET', '/statistics/business/top-customers?' + dates);
    await testForbiddenAPI('STATISTICS', 'Inventory Overview', 'GET', '/statistics/inventory/overview');
    await testForbiddenAPI('STATISTICS', 'Low Stock Stats', 'GET', '/statistics/inventory/low-stock');

    // Admin Dashboard
    console.log('\n🎛️ ADMIN DASHBOARD APIs (Admin Only)');
    await testForbiddenAPI('DASHBOARD', 'Overview', 'GET', '/admin/dashboard/overview?' + dates);
    await testForbiddenAPI('DASHBOARD', 'Revenue Analytics', 'GET', '/admin/dashboard/revenue?' + dates);
    await testForbiddenAPI('DASHBOARD', 'Top Products', 'GET', '/admin/dashboard/top-products?' + dates);
    await testForbiddenAPI('DASHBOARD', 'Orders Stats', 'GET', '/admin/dashboard/orders-stats?' + dates);
    await testForbiddenAPI('DASHBOARD', 'Customers Stats', 'GET', '/admin/dashboard/customers-stats?' + dates);
    await testForbiddenAPI('DASHBOARD', 'Inventory Stats', 'GET', '/admin/dashboard/inventory-stats');

    // ========================================
    // SECTION 3: TRUY CẬP DỮ LIỆU NGƯỜI KHÁC (expect 403/404)
    // ========================================
    console.log('\n' + '='.repeat(60));
    console.log('📙 SECTION 3: TRUY CẬP DỮ LIỆU CỦA NGƯỜI KHÁC (expect 403/404)');
    console.log('='.repeat(60));

    console.log('\n👤 OTHER CUSTOMER DATA');
    await testOtherUserDataAPI('OTHER_DATA', 'Get Other Customer Info', 'GET', `/customers/${TEST_IDS.otherCustomerId}`);
    await testOtherUserDataAPI('OTHER_DATA', 'Get Other Customer Orders', 'GET', `/customers/${TEST_IDS.otherCustomerId}/orders`);
    await testOtherUserDataAPI('OTHER_DATA', 'Get Other Customer Addresses', 'GET', `/customers/${TEST_IDS.otherCustomerId}/shipping-addresses`);
    await testOtherUserDataAPI('OTHER_DATA', 'Get Other Customer Stats', 'GET', `/customers/${TEST_IDS.otherCustomerId}/stats`);
    await testOtherUserDataAPI('OTHER_DATA', 'Get Other Customer Prescriptions', 'GET', `/customers/${TEST_IDS.otherCustomerId}/prescriptions`);

    // Try to modify other customer's data
    console.log('\n✏️ MODIFY OTHER CUSTOMER DATA');
    await testOtherUserDataAPI('MODIFY_OTHER', 'Update Other Customer', 'PUT', `/customers/${TEST_IDS.otherCustomerId}`, { full_name: 'Hacked' });
    await testOtherUserDataAPI('MODIFY_OTHER', 'Delete Other Customer Address', 'DELETE', `/shipping-addresses/${TEST_IDS.shippingAddress}`);

    // Try to access other customer's order
    console.log('\n📦 OTHER CUSTOMER ORDERS');
    await testOtherUserDataAPI('OTHER_ORDER', 'Get Other Customer Order', 'GET', `/orders/${TEST_IDS.orderOfOtherCustomer}`);
    await testOtherUserDataAPI('OTHER_ORDER', 'Cancel Other Order', 'POST', `/orders/${TEST_IDS.orderOfOtherCustomer}/cancel`);

    // ========================================
    // SECTION 4: PRIVILEGE ESCALATION TESTS
    // ========================================
    console.log('\n' + '='.repeat(60));
    console.log('📛 SECTION 4: PRIVILEGE ESCALATION TESTS');
    console.log('='.repeat(60));

    console.log('\n🔓 Trying to escalate privileges...');

    // Try to change own role (dùng user_id nếu có)
    const userId = currentUser?.id || currentUser?.user_id;
    if (userId) {
        await testForbiddenAPI('ESCALATION', 'Change Own Role to Admin', 'PUT', `/users/${userId}`, { role_id: 1 });
    } else {
        console.log('⚠️ Không có User ID, bỏ qua test Change Own Role');
    }

    // Try to create admin account
    await testForbiddenAPI('ESCALATION', 'Create Admin Account', 'POST', '/admins', {
        username: 'hacker_admin',
        password: 'hacker123',
        email: 'hacker@evil.com'
    });

    // Try to create staff account
    await testForbiddenAPI('ESCALATION', 'Create Staff Account', 'POST', '/staff', {
        username: 'hacker_staff',
        password: 'hacker123',
        branch_id: 1
    });

    // ========================================
    // SUMMARY
    // ========================================
    console.log('\n' + '='.repeat(60));
    console.log('🏁 SECURITY TEST SUMMARY');
    console.log('='.repeat(60));

    console.log(`\n✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📊 Total: ${passed + failed}`);
    console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

    // Security Issues Summary
    if (securityIssues.length > 0) {
        console.log('\n' + '🚨'.repeat(30));
        console.log('🚨 CRITICAL: SECURITY VULNERABILITIES FOUND!');
        console.log('🚨'.repeat(30));

        securityIssues.forEach((issue, index) => {
            console.log(`\n${index + 1}. [${issue.severity}] ${issue.type}`);
            console.log(`   Category: ${issue.category}`);
            console.log(`   API: ${issue.method} ${issue.url}`);
            console.log(`   Status: ${issue.status}`);
            console.log(`   Issue: ${issue.message}`);
        });

        console.log('\n⚠️ RECOMMENDED ACTIONS:');
        console.log('1. Review và thêm middleware authorization cho các API bị lỗ hổng');
        console.log('2. Kiểm tra lại logic ownership validation');
        console.log('3. Đảm bảo tất cả sensitive APIs đều có proper authentication/authorization');
    } else {
        console.log('\n✅ GREAT! No security vulnerabilities detected.');
        console.log('All APIs are properly protected against unauthorized access.');
    }

    // Results by category
    console.log('\n📋 Results by Category:');
    const categories = [...new Set(results.map(r => r.category))];
    categories.forEach(cat => {
        const catResults = results.filter(r => r.category === cat);
        const catPassed = catResults.filter(r => r.success).length;
        const catTotal = catResults.length;
        const status = catPassed === catTotal ? '✅' : catPassed > 0 ? '⚠️' : '❌';
        console.log(`  ${status} ${cat}: ${catPassed}/${catTotal}`);
    });

    // Show failed tests that are NOT vulnerabilities (cần chú ý)
    const unexpectedTests = results.filter(r => !r.success && r.securityStatus && !r.securityStatus.includes('VULNERABILITY'));
    if (unexpectedTests.length > 0) {
        console.log('\n⚠️ Tests with unexpected results (not vulnerabilities, but need attention):');
        unexpectedTests.forEach(test => {
            console.log(`  - [${test.category}] ${test.name}: ${test.actualStatus} - ${test.securityStatus}`);
        });
    }

    console.log('\n✨ Security test completed!');

    // Exit with error code if vulnerabilities found
    if (securityIssues.length > 0) {
        process.exit(1);
    }
}

// Run tests
runSecurityTests().catch(console.error);
