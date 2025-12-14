// Test Voucher APIs
const BASE_URL = 'http://localhost:3000/api';

// Test với token customer (lấy từ login)
const CUSTOMER_TOKEN = 'YOUR_CUSTOMER_TOKEN_HERE';

async function testVoucherAPIs() {
  console.log('🧪 Testing Voucher APIs\n');

  // 1. Test GET /vouchers - Lấy vouchers của customer hiện tại
  console.log('1️⃣ Testing GET /vouchers (Customer Vouchers)');
  try {
    const response1 = await fetch(`${BASE_URL}/vouchers?page=1&limit=10`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CUSTOMER_TOKEN}`
      }
    });
    const data1 = await response1.json();
    console.log('   Status:', response1.status);
    console.log('   Response:', JSON.stringify(data1, null, 2));
    console.log('   ✅ Success\n');
  } catch (error) {
    console.error('   ❌ Error:', error.message, '\n');
  }

  // 2. Test GET /vouchers/check/:code - Check voucher bằng code
  console.log('2️⃣ Testing GET /vouchers/check/:code');
  const testCode = 'SUMMER2024'; // Thay bằng code thực tế
  try {
    const response2 = await fetch(`${BASE_URL}/vouchers/check/${testCode}?orderAmount=500000`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CUSTOMER_TOKEN}`
      }
    });
    const data2 = await response2.json();
    console.log('   Status:', response2.status);
    console.log('   Response:', JSON.stringify(data2, null, 2));
    console.log('   ✅ Success\n');
  } catch (error) {
    console.error('   ❌ Error:', error.message, '\n');
  }

  // 3. Test GET /vouchers/:id - Check voucher bằng ID
  console.log('3️⃣ Testing GET /vouchers/:id');
  const testId = 1; // Thay bằng ID thực tế
  try {
    const response3 = await fetch(`${BASE_URL}/vouchers/${testId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CUSTOMER_TOKEN}`
      }
    });
    const data3 = await response3.json();
    console.log('   Status:', response3.status);
    console.log('   Response:', JSON.stringify(data3, null, 2));
    console.log('   ✅ Success\n');
  } catch (error) {
    console.error('   ❌ Error:', error.message, '\n');
  }

  // 4. Test GET /vouchers/available - Lấy vouchers đang active
  console.log('4️⃣ Testing GET /vouchers/available');
  try {
    const response4 = await fetch(`${BASE_URL}/vouchers/available?page=1&limit=10`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CUSTOMER_TOKEN}`
      }
    });
    const data4 = await response4.json();
    console.log('   Status:', response4.status);
    console.log('   Response:', JSON.stringify(data4, null, 2));
    console.log('   ✅ Success\n');
  } catch (error) {
    console.error('   ❌ Error:', error.message, '\n');
  }
}

// Run tests
testVoucherAPIs().catch(console.error);
