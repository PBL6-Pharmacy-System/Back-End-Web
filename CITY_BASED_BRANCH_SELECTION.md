# City-Based Branch Selection System

## Overview
Hệ thống chọn chi nhánh dựa trên thành phố để tối ưu hóa việc giao hàng và quản lý kho hàng.

## Database Changes

### 1. Bảng `branches`
Đã thêm các trường mới:
- `city` (VARCHAR(100), nullable): Thành phố của chi nhánh
- Index: `idx_branches_city` để tối ưu truy vấn theo thành phố

```sql
ALTER TABLE branches ADD COLUMN city VARCHAR(100);
CREATE INDEX idx_branches_city ON branches(city);
```

### 2. Bảng `customers`
Đã thêm các trường mới:
- `city` (VARCHAR(100), nullable): Thành phố của khách hàng
- Index: `idx_customers_city` để tối ưu truy vấn theo thành phố

```sql
ALTER TABLE customers ADD COLUMN city VARCHAR(100);
CREATE INDEX idx_customers_city ON customers(city);
```

### 3. Bảng `shippingaddresses`
Đã có sẵn trường `city` - được sử dụng ưu tiên khi có địa chỉ giao hàng cụ thể.

## Logic chọn chi nhánh

### Quy trình
1. **Xác định thành phố khách hàng** (theo thứ tự ưu tiên):
   - Từ `shippingaddresses.city` nếu có shipping address ID cụ thể
   - Từ `shippingaddresses.city` (địa chỉ mới nhất)
   - Từ `customers.city` (thông tin profile khách hàng)
   - Null nếu không có thông tin

2. **Tìm chi nhánh tối ưu**:
   - **Ưu tiên 1**: Tìm chi nhánh CÙNG THÀNH PHỐ có đủ hàng cho TẤT CẢ sản phẩm
   - **Ưu tiên 2**: Tìm chi nhánh KHÁC THÀNH PHỐ có đủ hàng cho TẤT CẢ sản phẩm
   - **Fallback**: Phân bổ từng sản phẩm vào các chi nhánh khác nhau (cùng city ưu tiên)

3. **So sánh thành phố**:
   - Chuẩn hóa: lowercase, bỏ dấu, trim whitespace
   - VD: "Hồ Chí Minh", "ho chi minh", "HO CHI MINH" → đều được coi là giống nhau

## Functions

### `normalizeCity(city)`
Chuẩn hóa tên thành phố để so sánh.

```javascript
normalizeCity("Hà Nội") // "ha noi"
normalizeCity("Hồ Chí Minh") // "ho chi minh"
```

### `findNearestBranchWithStock(productId, requiredQuantity, customerCity)`
Tìm chi nhánh gần nhất có đủ hàng cho 1 sản phẩm.

**Parameters:**
- `productId` (number): ID sản phẩm
- `requiredQuantity` (number): Số lượng cần (đơn vị cơ bản)
- `customerCity` (string, optional): Thành phố khách hàng

**Returns:**
```javascript
{
  branch: {...},        // Thông tin chi nhánh
  inventory: {...},     // Thông tin inventory
  sameCity: true/false  // Có cùng thành phố không
}
```

### `findOptimalBranchesForOrder(orderItems, customerCity)`
Tìm chi nhánh tối ưu cho cả đơn hàng.

**Parameters:**
- `orderItems` (Array): Mảng các item `{productId, quantity, conversionFactor}`
- `customerCity` (string, optional): Thành phố khách hàng

**Returns:**
```javascript
{
  strategy: 'single_branch' | 'multiple_branches',
  branches: [
    {
      branch: {...},
      items: [...],
      sameCity: true/false
    }
  ]
}
```

### `getCustomerCity(customerId, shippingAddressId)`
Lấy thành phố của khách hàng.

**Parameters:**
- `customerId` (number): ID khách hàng
- `shippingAddressId` (number, optional): ID địa chỉ giao hàng

**Returns:** `string` - Tên thành phố hoặc `null`

## Usage Examples

### 1. Trong Checkout Process
```javascript
import { findOptimalBranchesForOrder, getCustomerCity } from '../../../utils/branchSelection.js';

// Get customer city
const customerCity = await getCustomerCity(customerId, shippingAddressId);

// Prepare order items
const orderItems = cart.orderitems.map(item => ({
  productId: item.product_id,
  quantity: item.quantity,
  conversionFactor: Number(item.productunits.conversion_factor)
}));

// Find optimal branch allocation
const branchAllocation = await findOptimalBranchesForOrder(orderItems, customerCity);

// Use the primary branch
const branchId = branchAllocation.branches[0].branch.id;
```

### 2. Trong Cart Service
```javascript
import { findNearestBranchWithStock } from '../../../utils/branchSelection.js';

// Find branch for a specific product
const result = await findNearestBranchWithStock(
  productId,
  requiredQuantity,
  customerCity
);

if (result && result.sameCity) {
  console.log('Found in same city!');
}
```

## Benefits

1. **Tối ưu chi phí giao hàng**: Ưu tiên chi nhánh cùng thành phố
2. **Đơn giản hơn**: Không cần coordinates/GPS, chỉ cần tên thành phố
3. **Phù hợp Việt Nam**: Logistics thường tính theo thành phố
4. **Dễ nhập liệu**: Khách hàng và admin dễ nhập thành phố hơn coordinates
5. **Performance tốt**: Index trên city field giúp query nhanh

## Migration Guide

### Cho Admin
1. Cập nhật thông tin `city` cho tất cả chi nhánh trong hệ thống
2. Khuyến khích khách hàng cập nhật thành phố trong profile
3. Đảm bảo các địa chỉ giao hàng mới đều có thông tin `city`

### Cho Khách hàng
1. Cập nhật thành phố trong profile (nếu chưa có)
2. Khi tạo địa chỉ giao hàng mới, nhập đầy đủ thông tin city
3. Hệ thống sẽ tự động chọn chi nhánh gần nhất dựa trên thông tin này

## Future Enhancements

1. **Multiple branches per order**: Hỗ trợ split order từ nhiều chi nhánh
2. **Smart fallback**: Nếu cùng city hết hàng, tự động chọn city lân cận
3. **Priority rules**: Admin có thể set priority cho các chi nhánh
4. **City aliases**: Hỗ trợ các tên gọi khác nhau của cùng 1 thành phố
5. **District level**: Mở rộng để hỗ trợ cả quận/huyện nếu cần

## Notes

- Hệ thống hiện tại giữ nguyên các trường `latitude`, `longitude` (nếu có) để tương thích ngược
- Migration không xóa dữ liệu cũ, chỉ thêm trường mới
- Logic mới ưu tiên sử dụng `city`, không dùng coordinates nữa
- Tất cả comparisons đều case-insensitive và bỏ dấu tiếng Việt
