import axios from 'axios';

/**
 * Exchange Rate Service
 * Lấy tỷ giá USD/VND thời gian thực
 */

// Cache tỷ giá để giảm số lần gọi API
let cachedRate = null;
let lastFetchTime = null;
const CACHE_DURATION = 3600000; // 1 hour (3600000 ms)

/**
 * Lấy tỷ giá USD sang VND từ ExchangeRate-API
 * API miễn phí: https://www.exchangerate-api.com/
 */
export const getUSDtoVNDRate = async () => {
  try {
    // Kiểm tra cache
    const now = Date.now();
    if (cachedRate && lastFetchTime && (now - lastFetchTime) < CACHE_DURATION) {
      console.log('📊 Using cached exchange rate:', cachedRate);
      return cachedRate;
    }

    // Gọi API lấy tỷ giá mới
    console.log('📡 Fetching live exchange rate from API...');
    
    const response = await axios.get('https://open.er-api.com/v6/latest/USD', {
      timeout: 5000
    });

    if (response.data && response.data.rates && response.data.rates.VND) {
      const rate = response.data.rates.VND;
      
      // Lưu vào cache
      cachedRate = rate;
      lastFetchTime = now;
      
      console.log(`✅ Live exchange rate: 1 USD = ${rate} VND`);
      return rate;
    } else {
      throw new Error('Invalid API response');
    }
  } catch (error) {
    console.error('⚠️  Error fetching exchange rate:', error.message);
    
    // Fallback: Sử dụng tỷ giá mặc định nếu API lỗi
    const fallbackRate = 25000;
    console.log(`⚠️  Using fallback rate: 1 USD = ${fallbackRate} VND`);
    return fallbackRate;
  }
};

/**
 * Lấy tỷ giá từ nhiều nguồn (backup)
 * Dùng khi API chính bị lỗi
 */
export const getExchangeRateWithFallback = async () => {
  // Thử API chính
  try {
    return await getUSDtoVNDRate();
  } catch (error) {
    console.error('Primary API failed, trying backup...');
  }

  // Thử API backup 1: Fixer.io (cần API key nhưng có free tier)
  try {
    const fixerKey = process.env.FIXER_API_KEY;
    if (fixerKey) {
      const response = await axios.get(
        `http://data.fixer.io/api/latest?access_key=${fixerKey}&symbols=VND&base=USD`,
        { timeout: 5000 }
      );
      if (response.data && response.data.rates && response.data.rates.VND) {
        return response.data.rates.VND;
      }
    }
  } catch (error) {
    console.error('Backup API 1 failed:', error.message);
  }

  // Thử API backup 2: CurrencyAPI (miễn phí)
  try {
    const response = await axios.get(
      'https://cdn.jsdelivr.net/gh/fawazahmed0/currency-api@1/latest/currencies/usd/vnd.json',
      { timeout: 5000 }
    );
    if (response.data && response.data.vnd) {
      return response.data.vnd;
    }
  } catch (error) {
    console.error('Backup API 2 failed:', error.message);
  }

  // Fallback cuối cùng: Tỷ giá cố định
  console.warn('⚠️  All exchange rate APIs failed. Using fallback rate.');
  return 25000;
};

/**
 * Clear cache (để test hoặc force refresh)
 */
export const clearExchangeRateCache = () => {
  cachedRate = null;
  lastFetchTime = null;
  console.log('🗑️  Exchange rate cache cleared');
};

/**
 * Lấy thông tin cache hiện tại
 */
export const getCacheInfo = () => {
  return {
    cachedRate,
    lastFetchTime: lastFetchTime ? new Date(lastFetchTime).toISOString() : null,
    cacheAge: lastFetchTime ? Date.now() - lastFetchTime : null,
    isExpired: lastFetchTime ? (Date.now() - lastFetchTime) >= CACHE_DURATION : true
  };
};
