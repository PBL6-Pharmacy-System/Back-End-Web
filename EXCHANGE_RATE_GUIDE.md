# 💱 TỶ GIÁ REALTIME - USD/VND EXCHANGE RATE

## ✨ TÍNH NĂNG MỚI

PayPal Payment Gateway giờ đây **tự động lấy tỷ giá USD/VND thời gian thực** từ API thay vì dùng tỷ giá cố định!

---

## 🔧 CÁCH HOẠT ĐỘNG

### 1. API Exchange Rate

Sử dụng **ExchangeRate-API** (miễn phí, không cần đăng ký):
- **URL:** https://open.er-api.com/v6/latest/USD
- **Cập nhật:** Mỗi ngày
- **Độ trễ:** < 1 giây
- **Free tier:** Unlimited requests

### 2. Cơ chế Cache

Để tối ưu hiệu suất và giảm số lần gọi API:
- **Cache duration:** 1 giờ (3600 giây)
- **Auto refresh:** Tự động làm mới khi cache hết hạn
- **Fallback:** Dùng tỷ giá 25,000 VND nếu API lỗi

### 3. Backup APIs

Hệ thống có 3 nguồn tỷ giá backup:

1. **Primary:** ExchangeRate-API (open.er-api.com)
2. **Backup 1:** Fixer.io (cần API key - optional)
3. **Backup 2:** CurrencyAPI (cdn.jsdelivr.net)
4. **Fallback:** 25,000 VND (fixed rate)

---

## 📡 API ENDPOINTS

### 1. Xem tỷ giá hiện tại

```http
GET /api/payments/paypal/exchange-rate
```

**Response:**
```json
{
  "success": true,
  "data": {
    "rate": 25345.5,
    "currency": "USD to VND",
    "lastUpdated": "2024-11-28T14:30:00.000Z",
    "cacheAge": "1200 seconds",
    "isExpired": false
  }
}
```

### 2. Làm mới tỷ giá (Admin/Staff only)

```http
POST /api/payments/paypal/refresh-rate
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Đã làm mới tỷ giá",
  "data": {
    "rate": 25360.0,
    "timestamp": "2024-11-28T15:00:00.000Z"
  }
}
```

---

## 🧪 TEST TỶ GIÁ REALTIME

### Bước 1: Khởi động server
```bash
npm start
```

### Bước 2: Kiểm tra tỷ giá hiện tại
```bash
curl http://localhost:3000/api/payments/paypal/exchange-rate
```

Kết quả sẽ hiển thị:
```
✅ Live exchange rate: 1 USD = 25345.5 VND
```

### Bước 3: Tạo thanh toán
Khi tạo PayPal payment, log sẽ hiển thị:
```
📡 Fetching live exchange rate from API...
✅ Live exchange rate: 1 USD = 25345.5 VND
💱 Converting: 500000 VND = 19.72 USD (rate: 25345.5)
```

### Bước 4: Test cache
```bash
# Gọi lần 1 - fetch từ API
curl http://localhost:3000/api/payments/paypal/exchange-rate

# Gọi lần 2 ngay sau đó - dùng cache
curl http://localhost:3000/api/payments/paypal/exchange-rate
# Log: 📊 Using cached exchange rate: 25345.5
```

### Bước 5: Force refresh (Admin)
```bash
curl -X POST http://localhost:3000/api/payments/paypal/refresh-rate \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

---

## 🔧 CẤU HÌNH NÂNG CAO

### 1. Thêm Fixer.io API (Optional)

Nếu muốn dùng Fixer.io làm backup:

1. Đăng ký miễn phí tại: https://fixer.io/
2. Lấy API key
3. Thêm vào `.env`:

```env
FIXER_API_KEY=your_fixer_api_key_here
```

### 2. Điều chỉnh Cache Duration

Trong `exchangeRateService.js`, thay đổi:

```javascript
const CACHE_DURATION = 3600000; // 1 hour (default)

// Có thể thay đổi:
// 30 phút:  1800000
// 2 giờ:    7200000
// 6 giờ:    21600000
// 12 giờ:   43200000
// 24 giờ:   86400000
```

### 3. Thay đổi Fallback Rate

Trong `exchangeRateService.js`:

```javascript
const fallbackRate = 25000; // Thay đổi theo ý muốn
```

---

## 📊 SO SÁNH TỶ GIÁ

### Trước đây (Fixed Rate):
```javascript
exchangeRate: 25000  // Cố định, không thay đổi
```

Vấn đề:
- ❌ Không chính xác theo thời gian thực
- ❌ Khách hàng có thể bị thiệt khi tỷ giá thay đổi
- ❌ Cần update code thủ công

### Bây giờ (Live Rate):
```javascript
const rate = await getUSDtoVNDRate(); // Tự động lấy từ API
```

Ưu điểm:
- ✅ Tỷ giá chính xác realtime
- ✅ Tự động cập nhật hàng ngày
- ✅ Có cache để tối ưu hiệu suất
- ✅ Fallback khi API lỗi
- ✅ Backup từ nhiều nguồn

---

## 🎯 USE CASES

### Case 1: Khách hàng thanh toán

```
1. Customer tạo order: 500,000 VND
2. System fetch tỷ giá: 1 USD = 25,345.5 VND
3. Convert: 500,000 / 25,345.5 = 19.72 USD
4. PayPal charge: $19.72
```

### Case 2: Admin xem báo cáo

```bash
GET /api/payments/paypal/exchange-rate
```

Kết quả:
```json
{
  "rate": 25345.5,
  "lastUpdated": "2024-11-28T14:30:00Z",
  "cacheAge": "1800 seconds"
}
```

### Case 3: Tỷ giá thay đổi đột ngột

```
- Cache cũ (1h trước): 1 USD = 25,000 VND
- Tỷ giá mới: 1 USD = 25,500 VND
- System tự động refresh sau 1h
- Thanh toán tiếp theo dùng tỷ giá mới
```

---

## 🚨 TROUBLESHOOTING

### Lỗi: "Error fetching exchange rate"

**Nguyên nhân:**
- API ExchangeRate-API bị down
- Network timeout
- Firewall block

**Giải pháp:**
1. System tự động dùng fallback rate (25,000 VND)
2. Check logs để xem lỗi cụ thể
3. Test API thủ công:
   ```bash
   curl https://open.er-api.com/v6/latest/USD
   ```

### Lỗi: "Rate is null or undefined"

**Nguyên nhân:**
- API response không đúng format
- Network error

**Giải pháp:**
- System tự động dùng fallback
- Check logs: `⚠️  Using fallback rate: 1 USD = 25000 VND`

### Cache không expire

**Kiểm tra:**
```bash
GET /api/payments/paypal/exchange-rate
# Xem field "cacheAge" và "isExpired"
```

**Force clear:**
```bash
POST /api/payments/paypal/refresh-rate
# (Cần admin token)
```

---

## 📈 MONITORING

### Server Logs

Khi hệ thống hoạt động, logs sẽ hiển thị:

```
📡 Fetching live exchange rate from API...
✅ Live exchange rate: 1 USD = 25345.5 VND

# Lần gọi tiếp theo (trong 1h):
📊 Using cached exchange rate: 25345.5

# Nếu API lỗi:
⚠️  Error fetching exchange rate: timeout
⚠️  Using fallback rate: 1 USD = 25000 VND
```

### API Response Time

ExchangeRate-API thường response < 500ms:
```
Fetch time: ~300-500ms (first call)
Cache time:  ~1-5ms (subsequent calls)
```

---

## 💡 BEST PRACTICES

### 1. Monitor Exchange Rate Daily
```bash
# Setup cron job để log tỷ giá mỗi ngày
0 9 * * * curl http://localhost:3000/api/payments/paypal/exchange-rate >> exchange_rate.log
```

### 2. Alert khi tỷ giá thay đổi đột ngột
```javascript
// Trong exchangeRateService.js, thêm alert nếu rate thay đổi > 2%
if (Math.abs(newRate - oldRate) / oldRate > 0.02) {
  console.warn('⚠️  Exchange rate changed more than 2%!');
  // Send email/SMS alert
}
```

### 3. Backup tỷ giá vào Database
```javascript
// Lưu history tỷ giá để phân tích
await prisma.exchange_rate_history.create({
  data: {
    rate: rate,
    source: 'ExchangeRate-API',
    created_at: new Date()
  }
});
```

---

## 🌐 PRODUCTION CHECKLIST

Trước khi deploy lên production:

- [ ] Test API ExchangeRate-API từ server production
- [ ] Verify firewall không block API calls
- [ ] Test fallback rate khi API down
- [ ] Monitor API response time (< 1s)
- [ ] Setup alerts cho API failures
- [ ] Log exchange rate history
- [ ] Test với nhiều amounts khác nhau
- [ ] Verify conversion accuracy (VND → USD → VND)

---

## 📚 THAM KHẢO

### ExchangeRate-API Documentation
- **Docs:** https://www.exchangerate-api.com/docs/overview
- **Free tier:** Unlimited requests
- **Update frequency:** Daily
- **Supported currencies:** 160+

### Alternative APIs (if needed)
1. **Fixer.io:** https://fixer.io/documentation
2. **CurrencyAPI:** https://github.com/fawazahmed0/currency-api
3. **Open Exchange Rates:** https://openexchangerates.org/

---

## 🎉 TÓM TẮT

### Đã thêm:
✅ Tỷ giá realtime từ ExchangeRate-API  
✅ Cache 1 giờ để tối ưu performance  
✅ Fallback rate khi API lỗi  
✅ Backup từ nhiều nguồn  
✅ API để xem/refresh tỷ giá  
✅ Logs chi tiết  
✅ Error handling  

### Files đã tạo/sửa:
- ✅ `exchangeRateService.js` (NEW)
- ✅ `paypalUtils.js` (UPDATED - async functions)
- ✅ `paypalService.js` (UPDATED - await conversion)
- ✅ `paypalController.js` (UPDATED - new endpoints)
- ✅ `paypalRoutes.js` (UPDATED - new routes)

### Ready to use!
Khởi động server và test ngay:
```bash
npm start
curl http://localhost:3000/api/payments/paypal/exchange-rate
```

**Happy Trading! 💱**
