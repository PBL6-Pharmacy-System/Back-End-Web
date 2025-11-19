# 🚀 RATE LIMITING & REFRESH TOKEN - HƯỚNG DẪN

## 📋 MỤC LỤC

1. [Rate Limiting](#rate-limiting)
2. [Refresh Token](#refresh-token)
3. [Cài đặt](#cài-đặt)
4. [Sử dụng](#sử-dụng)
5. [Testing](#testing)

---

## 🔒 RATE LIMITING

### Tại sao cần Rate Limiting?

- Bảo vệ API khỏi spam và DDoS attacks
- Ngăn chặn brute force attacks
- Đảm bảo fair usage cho tất cả users
- Tối ưu hiệu năng server

### Các loại Rate Limiters

#### 1. **apiLimiter** - Global API Limiter

```javascript
Giới hạn: 100 requests / 15 phút
Áp dụng: Tất cả /api/* endpoints
```

#### 2. **authLimiter** - Authentication Limiter

```javascript
Giới hạn: 5 requests / 15 phút
Áp dụng: /api/auth/register, /api/auth/login
Không đếm: Successful requests
```

#### 3. **writeLimiter** - Write Operations Limiter

```javascript
Giới hạn: 30 requests / 15 phút
Áp dụng: POST, PUT, DELETE, PATCH operations
```

#### 4. **passwordLimiter** - Password Change Limiter

```javascript
Giới hạn: 3 requests / 1 giờ
Áp dụng: /api/auth/change-password
```

#### 5. **cartLimiter** - Cart Operations Limiter

```javascript
Giới hạn: 50 requests / 15 phút
Áp dụng: Cart add/remove operations
```

#### 6. **searchLimiter** - Search Limiter

```javascript
Giới hạn: 60 requests / 1 phút
Áp dụng: Search endpoints
```

### Response Headers

Khi bị rate limit, response sẽ có headers:

```
RateLimit-Limit: 100
RateLimit-Remaining: 45
RateLimit-Reset: 1699123456
```

### Response khi vượt limit:

```json
{
  "success": false,
  "error": "Quá nhiều request từ IP này, vui lòng thử lại sau 15 phút"
}
```

Status Code: `429 Too Many Requests`

---

## 🔄 REFRESH TOKEN

### Tại sao cần Refresh Token?

- **Access Token** ngắn hạn (15 phút) → Bảo mật cao hơn
- **Refresh Token** dài hạn (7 ngày) → UX tốt hơn
- Tránh phải login lại liên tục
- Dễ revoke access khi cần

### Flow hoạt động:

```
1. Login → Nhận Access Token (15m) + Refresh Token (7d)
2. Dùng Access Token để gọi API
3. Access Token hết hạn → Gọi /refresh-token
4. Nhận Access Token mới
5. Tiếp tục sử dụng
```

### Token Expiration:

- **Access Token**: 15 phút
- **Refresh Token**: 7 ngày

---

## 🛠️ CÀI ĐẶT

### 1. Environment Variables

Thêm vào file `.env`:

```env
# JWT Secrets
JWT_SECRET="your-access-token-secret-at-least-32-chars"
JWT_REFRESH_SECRET="your-refresh-token-secret-different-from-above"

# Token Expiration
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"
```

**⚠️ QUAN TRỌNG:**

- `JWT_SECRET` và `JWT_REFRESH_SECRET` phải KHÁC NHAU
- Mỗi secret phải dài ít nhất 32 ký tự
- Sử dụng random string generator

### 2. Dependencies

```bash
npm install express-rate-limit
```

Đã cài đặt: ✅

---

## 📖 SỬ DỤNG

### 1. Login/Register - Nhận Tokens

#### Request:

```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "john_doe",
  "password": "password123"
}
```

#### Response:

```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "username": "john_doe",
      "email": "john@example.com",
      "role_id": 3
    },
    "token": "eyJhbGc...access_token",
    "refreshToken": "eyJhbGc...refresh_token"
  }
}
```

**💾 Lưu trữ tokens:**

- Access Token: Memory hoặc sessionStorage
- Refresh Token: httpOnly cookie (recommended) hoặc localStorage

### 2. Sử dụng Access Token

```http
GET /api/auth/me
Authorization: Bearer eyJhbGc...access_token
```

### 3. Refresh Token khi Access Token hết hạn

#### Request:

```http
POST /api/auth/refresh-token
Content-Type: application/json

{
  "refreshToken": "eyJhbGc...refresh_token"
}
```

#### Response thành công:

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGc...new_access_token"
  }
}
```

#### Response thất bại:

```json
{
  "success": false,
  "error": "Refresh token không hợp lệ hoặc đã hết hạn",
  "status": 401
}
```

→ Yêu cầu user login lại

---

## 🧪 TESTING

### Test Rate Limiting

#### Test 1: Normal Request

```bash
curl http://localhost:3000/api/products
# Response: 200 OK
# Headers: RateLimit-Limit, RateLimit-Remaining
```

#### Test 2: Exceed Rate Limit

```bash
# Send 101 requests trong 15 phút
for i in {1..101}; do curl http://localhost:3000/api/products; done

# Request 101: 429 Too Many Requests
# Response: "Quá nhiều request từ IP này..."
```

#### Test 3: Auth Rate Limit

```bash
# Send 6 login requests trong 15 phút
for i in {1..6}; do
  curl -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"test","password":"test"}'
done

# Request 6: 429 Too Many Requests
```

### Test Refresh Token Flow

#### Step 1: Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123456"
  }'
```

Lưu lại `token` và `refreshToken` từ response.

#### Step 2: Use Access Token

```bash
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

#### Step 3: Wait 15 minutes (hoặc sử dụng expired token)

#### Step 4: Refresh Token

```bash
curl -X POST http://localhost:3000/api/auth/refresh-token \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "<REFRESH_TOKEN>"
  }'
```

#### Step 5: Use New Access Token

```bash
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer <NEW_ACCESS_TOKEN>"
```

---

## 🔐 BEST PRACTICES

### Client-side Implementation

```javascript
// JavaScript/TypeScript Example

class AuthService {
  constructor() {
    this.accessToken = null;
    this.refreshToken = null;
  }

  async login(username, password) {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (data.success) {
      this.accessToken = data.data.token;
      this.refreshToken = data.data.refreshToken;

      // Store refresh token securely
      localStorage.setItem("refreshToken", this.refreshToken);
    }

    return data;
  }

  async apiCall(url, options = {}) {
    // Add access token to request
    options.headers = {
      ...options.headers,
      Authorization: `Bearer ${this.accessToken}`,
    };

    let response = await fetch(url, options);

    // If 401, try to refresh token
    if (response.status === 401) {
      const refreshed = await this.refreshAccessToken();

      if (refreshed) {
        // Retry with new token
        options.headers["Authorization"] = `Bearer ${this.accessToken}`;
        response = await fetch(url, options);
      } else {
        // Redirect to login
        window.location.href = "/login";
      }
    }

    return response.json();
  }

  async refreshAccessToken() {
    try {
      const response = await fetch("/api/auth/refresh-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          refreshToken: this.refreshToken,
        }),
      });

      const data = await response.json();

      if (data.success) {
        this.accessToken = data.data.token;
        return true;
      }

      return false;
    } catch (error) {
      return false;
    }
  }
}

// Usage
const auth = new AuthService();
await auth.login("username", "password");
const userData = await auth.apiCall("/api/auth/me");
```

---

## 🐛 TROUBLESHOOTING

### Lỗi: "Quá nhiều request..."

**Nguyên nhân:** Vượt rate limit
**Giải pháp:** Đợi thời gian reset hoặc optimize số lượng requests

### Lỗi: "Refresh token không hợp lệ"

**Nguyên nhân:** Token hết hạn hoặc bị sửa đổi
**Giải pháp:** Yêu cầu user login lại

### Lỗi: "JWT_REFRESH_SECRET is not defined"

**Nguyên nhân:** Chưa set biến môi trường
**Giải pháp:** Thêm `JWT_REFRESH_SECRET` vào file `.env`

---

## 📊 MONITORING

### Log Rate Limit Events

```javascript
// Thêm vào rate limiter config:
handler: (req, res) => {
  console.log(`Rate limit exceeded for IP: ${req.ip}`);
  res.status(429).json({
    success: false,
    error: "Too many requests",
  });
};
```

### Track Token Usage

```javascript
// Log refresh token usage
console.log(`Refresh token used by user: ${userId}`);
```

---

## 🎯 SUMMARY

✅ **Đã implement:**

- 6 loại rate limiters cho các use cases khác nhau
- Refresh token mechanism với access token ngắn hạn
- Proper error handling và responses
- Security headers

✅ **Security improvements:**

- Ngăn chặn brute force attacks
- Giảm thiểu token theft risk
- Fair usage enforcement
- Better session management

✅ **UX improvements:**

- Không cần login lại liên tục
- Seamless token refresh
- Clear error messages
