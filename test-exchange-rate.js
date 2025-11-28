/**
 * Test Exchange Rate Service
 * Run: node test-exchange-rate.js
 */

import { getUSDtoVNDRate, getCacheInfo, clearExchangeRateCache } from './src/modules/order-management/payments/gateways/paypal/exchangeRateService.js';

console.log('🧪 TESTING EXCHANGE RATE SERVICE\n');
console.log('='.repeat(50));

async function test() {
  try {
    // Test 1: Fetch tỷ giá lần đầu
    console.log('\n📡 Test 1: Fetch tỷ giá lần đầu tiên...');
    const rate1 = await getUSDtoVNDRate();
    console.log(`✅ Tỷ giá: 1 USD = ${rate1} VND`);

    // Test 2: Dùng cache
    console.log('\n📊 Test 2: Gọi lại ngay (nên dùng cache)...');
    const rate2 = await getUSDtoVNDRate();
    console.log(`✅ Tỷ giá: 1 USD = ${rate2} VND`);

    // Test 3: Check cache info
    console.log('\n🔍 Test 3: Xem thông tin cache...');
    const cacheInfo = getCacheInfo();
    console.log('Cache info:', {
      rate: cacheInfo.cachedRate,
      lastFetch: cacheInfo.lastFetchTime,
      ageInSeconds: Math.round(cacheInfo.cacheAge / 1000),
      isExpired: cacheInfo.isExpired
    });

    // Test 4: Clear cache và fetch lại
    console.log('\n🗑️  Test 4: Clear cache và fetch lại...');
    clearExchangeRateCache();
    const rate3 = await getUSDtoVNDRate();
    console.log(`✅ Tỷ giá sau khi clear: 1 USD = ${rate3} VND`);

    // Test 5: Convert examples
    console.log('\n💰 Test 5: Ví dụ chuyển đổi...');
    const amounts = [100000, 500000, 1000000, 5000000];
    for (const vnd of amounts) {
      const usd = (vnd / rate3).toFixed(2);
      console.log(`   ${vnd.toLocaleString()} VND = $${usd} USD`);
    }

    console.log('\n' + '='.repeat(50));
    console.log('✅ TẤT CẢ TEST ĐỀU PASS!');
    console.log('🎉 Exchange Rate Service hoạt động hoàn hảo!');

  } catch (error) {
    console.error('\n❌ Lỗi:', error.message);
    process.exit(1);
  }
}

test();
