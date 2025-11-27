# 📍 GraphHopper API Integration Guide

## Tổng quan

Hệ thống đã tích hợp **GraphHopper API** để:
- 🗺️ **Geocoding**: Chuyển đổi địa chỉ thành tọa độ GPS
- 📍 **Reverse Geocoding**: Chuyển đổi tọa độ GPS thành địa chỉ
- 🚗 **Routing**: Tính khoảng cách và thời gian di chuyển thực tế theo đường đi

## Cấu hình

### 1. Đăng ký API Key (Miễn phí)

1. Truy cập: https://www.graphhopper.com/dashboard/#/register
2. Đăng ký tài khoản miễn phí
3. Lấy API Key từ Dashboard

### 2. Thêm vào file `.env`

```env
GRAPHHOPPER_API_KEY="your-api-key-here"
```

### 3. Giới hạn Free Tier

- **500 requests/ngày** (đủ cho development và small production)
- Hỗ trợ: Geocoding, Routing, Matrix API
- Nếu cần nhiều hơn: https://www.graphhopper.com/pricing/

---

## API Endpoints

### 1. Geocode Address
Chuyển đổi địa chỉ thành tọa độ GPS.

```http
POST /api/shipping/geocode
Content-Type: application/json

{
  "address": "123 Nguyễn Huệ, Quận 1, TP.HCM, Vietnam"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "latitude": 10.7731,
    "longitude": 106.7030,
    "displayName": "123 Nguyễn Huệ",
    "city": "Hồ Chí Minh",
    "state": "Hồ Chí Minh",
    "country": "Vietnam",
    "street": "Nguyễn Huệ",
    "housenumber": "123",
    "postcode": "700000"
  }
}
```

### 2. Reverse Geocode
Lấy địa chỉ từ tọa độ GPS.

```http
POST /api/shipping/reverse-geocode
Content-Type: application/json

{
  "latitude": 10.7731,
  "longitude": 106.7030
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "formattedAddress": "123 Nguyễn Huệ, Quận 1, Hồ Chí Minh, Vietnam",
    "displayName": "Nguyễn Huệ",
    "city": "Hồ Chí Minh",
    "state": "Hồ Chí Minh",
    "country": "Vietnam",
    "street": "Nguyễn Huệ"
  }
}
```

### 3. Calculate Distance
Tính khoảng cách và thời gian di chuyển giữa 2 điểm.

```http
POST /api/shipping/distance
Content-Type: application/json

{
  "fromLat": 10.7731,
  "fromLng": 106.7030,
  "toLat": 10.8231,
  "toLng": 106.6297
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "distanceKm": 8.5,
    "distanceText": "8.5 km",
    "timeMinutes": 25,
    "timeText": "25 phút",
    "calculationSource": "graphhopper"
  }
}
```

### 4. Estimate Shipping (với GraphHopper)
Ước tính phí ship sử dụng khoảng cách thực tế.

```http
POST /api/shipping/estimate-by-coordinates
Content-Type: application/json

{
  "latitude": 10.7731,
  "longitude": 106.7030,
  "orderTotal": 500000
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "location": {
      "latitude": 10.7731,
      "longitude": 106.7030,
      "address": "123 Nguyễn Huệ, Quận 1, Hồ Chí Minh",
      "city": "Hồ Chí Minh"
    },
    "nearestBranch": {
      "id": 1,
      "name": "Chi nhánh Quận 1",
      "address": "456 Lê Lợi, Quận 1",
      "city": "Hồ Chí Minh",
      "distance": "3.2 km",
      "estimatedTime": "12 phút"
    },
    "shipping": {
      "fee": 15000,
      "originalFee": 15000,
      "estimatedDays": 1,
      "zoneName": "Nội thành",
      "freeShipping": false
    },
    "calculationSource": "graphhopper"
  }
}
```

---

## Sử dụng trong Code

### Import utilities

```javascript
import {
  calculateRealDistance,
  calculateDistancesToMany,
  findNearest,
  geocodeAddress,
  reverseGeocode
} from '../utils/distanceCalculator.js';
```

### Ví dụ 1: Geocode địa chỉ

```javascript
const result = await geocodeAddress('123 Nguyễn Huệ, Quận 1, TP.HCM');
if (result) {
  console.log(`Latitude: ${result.lat}, Longitude: ${result.lng}`);
}
```

### Ví dụ 2: Tính khoảng cách thực tế

```javascript
const distance = await calculateRealDistance(
  10.7731, 106.7030,  // From
  10.8231, 106.6297   // To
);

console.log(`Distance: ${distance.distanceKm} km`);
console.log(`Time: ${distance.timeText}`);
console.log(`Source: ${distance.source}`); // 'graphhopper' hoặc 'haversine'
```

### Ví dụ 3: Tìm chi nhánh gần nhất

```javascript
const branches = [
  { id: 1, name: 'Branch A', latitude: 10.78, longitude: 106.70 },
  { id: 2, name: 'Branch B', latitude: 10.82, longitude: 106.63 }
];

const nearest = await findNearest(
  { latitude: 10.77, longitude: 106.70 },
  branches,
  true // useGraphHopper
);

console.log(`Nearest: ${nearest.name} - ${nearest.distanceText}`);
```

---

## Fallback Mechanism

Nếu GraphHopper API không khả dụng (thiếu API key, hết quota, lỗi mạng), hệ thống sẽ tự động **fallback về công thức Haversine**:

- **Haversine**: Tính khoảng cách đường chim bay
- **Road Factor**: Nhân hệ số 1.3 để ước tính đường đi thực tế
- **Response** sẽ có `calculationSource: 'haversine'` thay vì `'graphhopper'`

---

## Caching

Hệ thống tự động cache kết quả để giảm số lần gọi API:

- **Geocode cache**: 1 giờ
- **Route cache**: 1 giờ

Để xóa cache:
```javascript
import graphHopperService from '../utils/graphHopperService.js';
graphHopperService.clearCache();
```

---

## Kiểm tra API Status

```javascript
import graphHopperService from '../utils/graphHopperService.js';

const status = graphHopperService.getApiStatus();
console.log(status);
// {
//   hasApiKey: true,
//   geocodeCacheSize: 10,
//   routeCacheSize: 25
// }
```

---

## Lưu ý

1. **Tọa độ Việt Nam**: 
   - Latitude: 8.5 - 23.5
   - Longitude: 102 - 110

2. **Địa chỉ nên bao gồm**: Số nhà, đường, quận/huyện, thành phố, "Vietnam"

3. **Free tier limits**: 500 requests/ngày, nên sử dụng cache hiệu quả

4. **Production**: Cân nhắc upgrade plan nếu traffic cao

---

*Tài liệu cập nhật: November 2025*
