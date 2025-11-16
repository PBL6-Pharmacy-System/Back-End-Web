# Shipping Addresses API Documentation

## ✅ Module hoàn thành

Shipping Addresses Module đã được implement thành công với các tính năng:

- ✅ Quản lý địa chỉ giao hàng (CRUD)
- ✅ Set địa chỉ mặc định
- ✅ Auto set default cho địa chỉ đầu tiên
- ✅ Validate địa chỉ đang sử dụng trong đơn hàng
- ✅ Phân quyền theo role (Admin/Staff/Customer)

## 📂 Cấu trúc files

```
src/modules/order-management/shipping-addresses/
├── shippingAddressService.js      # Business logic
├── shippingAddressController.js   # HTTP request handlers
└── shippingAddressRoutes.js       # Route definitions
```

## 🔐 Authentication

Tất cả endpoints đều yêu cầu authentication token trong header:

```
Authorization: Bearer <access_token>
```

## 📋 API Endpoints

### 1. Get Customer's Addresses

**Endpoint:** `GET /api/customers/:customerId/shipping-addresses`

**Access:** Admin, Staff, or the Customer

**Example Request:**
```bash
GET /api/customers/5/shipping-addresses
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "customer_id": 5,
      "address_line": "123 Nguyễn Văn Linh",
      "city": "TP.HCM",
      "state": "Quận 7",
      "postal_code": "70000",
      "country": "Vietnam",
      "is_default": true,
      "created_at": "2025-01-15T10:00:00Z",
      "updated_at": "2025-01-15T10:00:00Z"
    },
    {
      "id": 2,
      "customer_id": 5,
      "address_line": "456 Lê Văn Việt",
      "city": "TP.HCM",
      "state": "Quận 9",
      "postal_code": "70000",
      "country": "Vietnam",
      "is_default": false,
      "created_at": "2025-01-16T14:00:00Z",
      "updated_at": "2025-01-16T14:00:00Z"
    }
  ]
}
```

**Notes:**
- Addresses are sorted with default address first
- Then sorted by created_at descending

---

### 2. Get Default Address

**Endpoint:** `GET /api/customers/:customerId/shipping-addresses/default`

**Access:** Admin, Staff, or the Customer

**Example Request:**
```bash
GET /api/customers/5/shipping-addresses/default
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "customer_id": 5,
    "address_line": "123 Nguyễn Văn Linh",
    "city": "TP.HCM",
    "state": "Quận 7",
    "postal_code": "70000",
    "country": "Vietnam",
    "is_default": true,
    "created_at": "2025-01-15T10:00:00Z",
    "updated_at": "2025-01-15T10:00:00Z"
  }
}
```

---

### 3. Get Address by ID

**Endpoint:** `GET /api/shipping-addresses/:id`

**Access:** Admin, Staff, or Address owner

**Example Request:**
```bash
GET /api/shipping-addresses/1
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "customer_id": 5,
    "address_line": "123 Nguyễn Văn Linh",
    "city": "TP.HCM",
    "state": "Quận 7",
    "postal_code": "70000",
    "country": "Vietnam",
    "is_default": true,
    "created_at": "2025-01-15T10:00:00Z",
    "updated_at": "2025-01-15T10:00:00Z",
    "customers": {
      "id": 5,
      "full_name": "Nguyen Van A",
      "phone": "0901234567",
      "email": "nguyenvana@email.com"
    }
  }
}
```

---

### 4. Create New Address

**Endpoint:** `POST /api/customers/:customerId/shipping-addresses`

**Access:** Admin, Staff, or the Customer

**Request Body:**
```json
{
  "address_line": "789 Trần Hưng Đạo",
  "city": "Hà Nội",
  "state": "Hoàn Kiếm",
  "postal_code": "10000",
  "country": "Vietnam",
  "is_default": false
}
```

**Required Fields:**
- `address_line` (string)
- `city` (string)

**Optional Fields:**
- `state` (string)
- `postal_code` (string)
- `country` (string) - Default: "Vietnam"
- `is_default` (boolean) - Default: false

**Example Request:**
```bash
POST /api/customers/5/shipping-addresses
Content-Type: application/json

{
  "address_line": "789 Trần Hưng Đạo",
  "city": "Hà Nội",
  "state": "Hoàn Kiếm",
  "postal_code": "10000"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 3,
    "customer_id": 5,
    "address_line": "789 Trần Hưng Đạo",
    "city": "Hà Nội",
    "state": "Hoàn Kiếm",
    "postal_code": "10000",
    "country": "Vietnam",
    "is_default": false,
    "created_at": "2025-01-16T15:30:00Z",
    "updated_at": "2025-01-16T15:30:00Z"
  },
  "message": "Thêm địa chỉ giao hàng thành công"
}
```

**Business Logic:**
- ✅ If `is_default: true`, automatically unsets other default addresses
- ✅ If this is the **first address**, automatically sets as default
- ✅ Validates required fields (address_line, city)

---

### 5. Update Address

**Endpoint:** `PUT /api/shipping-addresses/:id`

**Access:** Admin, Staff, or Address owner

**Request Body:**
```json
{
  "address_line": "789 Trần Hưng Đạo (updated)",
  "city": "Hà Nội",
  "state": "Ba Đình",
  "postal_code": "10001",
  "country": "Vietnam",
  "is_default": true
}
```

**All Fields Optional** - Only send fields you want to update

**Example Request:**
```bash
PUT /api/shipping-addresses/3
Content-Type: application/json

{
  "state": "Ba Đình",
  "is_default": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 3,
    "customer_id": 5,
    "address_line": "789 Trần Hưng Đạo",
    "city": "Hà Nội",
    "state": "Ba Đình",
    "postal_code": "10000",
    "country": "Vietnam",
    "is_default": true,
    "created_at": "2025-01-16T15:30:00Z",
    "updated_at": "2025-01-16T16:00:00Z"
  },
  "message": "Cập nhật địa chỉ giao hàng thành công"
}
```

**Business Logic:**
- ✅ If setting `is_default: true`, automatically unsets other defaults
- ✅ Only updates fields that are provided

---

### 6. Set Default Address

**Endpoint:** `PUT /api/shipping-addresses/:id/set-default`

**Access:** Admin, Staff, or Address owner

**Request Body:**
```json
{
  "customerId": 5
}
```

**Example Request:**
```bash
PUT /api/shipping-addresses/2/set-default
Content-Type: application/json

{
  "customerId": 5
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "customer_id": 5,
    "address_line": "456 Lê Văn Việt",
    "city": "TP.HCM",
    "state": "Quận 9",
    "postal_code": "70000",
    "country": "Vietnam",
    "is_default": true,
    "created_at": "2025-01-16T14:00:00Z",
    "updated_at": "2025-01-16T16:30:00Z"
  },
  "message": "Đã đặt làm địa chỉ mặc định"
}
```

**Business Logic:**
- ✅ Verifies address belongs to customer
- ✅ Uses transaction to ensure atomic operation
- ✅ Unsets current default, sets new default
- ✅ Returns early if already default

---

### 7. Delete Address

**Endpoint:** `DELETE /api/shipping-addresses/:id`

**Access:** Admin, Staff, or Address owner

**Example Request:**
```bash
DELETE /api/shipping-addresses/3
```

**Response:**
```json
{
  "success": true,
  "message": "Xóa địa chỉ giao hàng thành công"
}
```

**Business Logic:**
- ❌ **Cannot delete** if address is used in active orders (pending, confirmed, processing, shipping)
- ✅ If deleted address was default, automatically sets another address as default
- ✅ Chooses the most recent address as new default

**Error Response (if used in active orders):**
```json
{
  "success": false,
  "error": "Không thể xóa địa chỉ đang được sử dụng trong đơn hàng"
}
```

---

## 🔄 Address Lifecycle

```
Create Address
    ↓
[First Address?] → YES → Auto set is_default: true
    ↓ NO
    ↓
[is_default: true?] → YES → Unset other defaults
    ↓ NO
    ↓
Address Created

Update Address
    ↓
[Set is_default: true?] → YES → Unset other defaults
    ↓
Address Updated

Delete Address
    ↓
[Used in active orders?] → YES → Error: Cannot delete
    ↓ NO
    ↓
[Was default?] → YES → Set next address as default
    ↓
Address Deleted
```

---

## ⚠️ Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": "Địa chỉ và thành phố là bắt buộc"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "error": "Địa chỉ không thuộc về khách hàng này"
}
```

### 404 Not Found - Customer
```json
{
  "success": false,
  "error": "Không tìm thấy khách hàng"
}
```

### 404 Not Found - Address
```json
{
  "success": false,
  "error": "Không tìm thấy địa chỉ"
}
```

### 404 Not Found - Default Address
```json
{
  "success": false,
  "error": "Không tìm thấy địa chỉ mặc định"
}
```

---

## 🧪 Testing với Postman/cURL

### 1. Get all addresses of a customer
```bash
curl -X GET "http://localhost:3000/api/customers/5/shipping-addresses" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 2. Create new address
```bash
curl -X POST http://localhost:3000/api/customers/5/shipping-addresses \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "address_line": "123 Main Street",
    "city": "TP.HCM",
    "state": "Quận 1",
    "postal_code": "70000"
  }'
```

### 3. Update address
```bash
curl -X PUT http://localhost:3000/api/shipping-addresses/1 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "state": "Quận 7",
    "is_default": true
  }'
```

### 4. Set default address
```bash
curl -X PUT http://localhost:3000/api/shipping-addresses/2/set-default \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": 5
  }'
```

### 5. Delete address
```bash
curl -X DELETE http://localhost:3000/api/shipping-addresses/3 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 6. Get default address
```bash
curl -X GET "http://localhost:3000/api/customers/5/shipping-addresses/default" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## 📊 Database Table

```sql
-- shippingaddresses table structure
CREATE TABLE shippingaddresses (
  id              SERIAL PRIMARY KEY,
  customer_id     INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  address_line    TEXT NOT NULL,
  city            VARCHAR(100),
  state           VARCHAR(100),
  postal_code     VARCHAR(20),
  country         VARCHAR(100) DEFAULT 'Vietnam',
  is_default      BOOLEAN DEFAULT false,
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);
```

---

## 🎯 Integration with Checkout Flow

### Typical Checkout Flow:

1. **Customer adds products to cart**
   - `POST /api/cart/:customerId/add`

2. **Customer selects shipping address**
   - `GET /api/customers/:customerId/shipping-addresses` (Get all)
   - Or use default: `GET /api/customers/:customerId/shipping-addresses/default`

3. **Customer creates order**
   - `POST /api/cart/:customerId/checkout`
   - Include `shipping_address_id` in request

4. **Order is created with shipping address**
   - Address linked via `orders.shipping_address_id`

---

## 💡 Best Practices

### 1. Default Address Management
- ✅ Always ensure at least one default address
- ✅ First address is automatically default
- ✅ Deleting default address auto-assigns new default

### 2. Validation
- ✅ Required fields: `address_line`, `city`
- ✅ Cannot delete if used in active orders
- ✅ Verify customer ownership before operations

### 3. User Experience
- ✅ Display default address prominently
- ✅ Allow quick switching of default
- ✅ Provide clear feedback on delete restrictions

### 4. Security
- ✅ Verify user has permission to access/modify address
- ✅ Check address belongs to customer
- ✅ Use authentication tokens

---

## 🐛 Common Issues

### Issue: "Cannot delete address"
**Cause:** Address is used in active orders
**Solution:** Wait until orders are completed/cancelled, or keep the address

### Issue: "No default address found"
**Cause:** Customer has no addresses
**Solution:** Create first address (auto-set as default)

### Issue: Multiple default addresses
**Cause:** Database inconsistency
**Solution:** Use `set-default` endpoint to fix

---

## 📋 API Endpoints Summary

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/customers/:customerId/shipping-addresses` | Admin, Staff, Owner | Get all addresses |
| GET | `/customers/:customerId/shipping-addresses/default` | Admin, Staff, Owner | Get default address |
| GET | `/shipping-addresses/:id` | Admin, Staff, Owner | Get address by ID |
| POST | `/customers/:customerId/shipping-addresses` | Admin, Staff, Owner | Create address |
| PUT | `/shipping-addresses/:id` | Admin, Staff, Owner | Update address |
| PUT | `/shipping-addresses/:id/set-default` | Admin, Staff, Owner | Set as default |
| DELETE | `/shipping-addresses/:id` | Admin, Staff, Owner | Delete address |

---

**Created:** 2025-01-16
**Version:** 1.0.0
**Status:** ✅ Production Ready

---

## ⏭️ Next Module

**Payments Module (COD)** - Implementing payment processing with Cash on Delivery support
