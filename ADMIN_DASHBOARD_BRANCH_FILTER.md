# Admin Dashboard - Branch Filter Enhancement

## Tổng quan
Đã thêm filter `branchId` vào **TẤT CẢ** các API trong module admin-dashboard để hỗ trợ xem thống kê theo từng chi nhánh cụ thể.

## APIs đã cập nhật

### 1. ✅ getOverview (Đã có sẵn branchId)
**Endpoint:** `GET /api/admin/dashboard/overview?branchId=1`

**Chức năng:** Lọc orders và revenue theo branch thông qua shipments

### 2. ✅ getRevenueAnalytics (Đã có sẵn branchId)
**Endpoint:** `GET /api/admin/dashboard/revenue?branchId=1&period=month`

**Chức năng:** Lọc revenue analytics theo branch

### 3. ✅ getTopProducts (Đã có sẵn branchId)
**Endpoint:** `GET /api/admin/dashboard/top-products?branchId=1&limit=10`

**Chức năng:** Lọc top products theo branch inventory

### 4. ✅ getOrdersStatistics (Đã có sẵn branchId)
**Endpoint:** `GET /api/admin/dashboard/orders-stats?branchId=1&period=week`

**Chức năng:** Lọc order statistics theo branch

### 5. ✅ getCustomersStatistics (MỚI THÊM branchId)
**Endpoint:** `GET /api/admin/dashboard/customers-stats?branchId=1`

**Thay đổi:**
```javascript
// Controller
const { period, startDate, endDate, limit, branchId } = req.query;

// Service
const buildOrderWhere = (baseWhere) => {
  if (branchId) {
    return {
      ...baseWhere,
      shipments: {
        some: { branch_id: Number(branchId) }
      }
    };
  }
  return baseWhere;
};
```

**Logic:**
- New customers: Không filter (hiển thị all branches)
- Top customers: Filter theo orders có shipment từ branch đó
- Retention rate: Tính dựa trên orders đã filtered

### 6. ✅ getInventoryStatistics (Đã có sẵn branchId)
**Endpoint:** `GET /api/admin/dashboard/inventory-stats?branchId=1`

**Chức năng:** Lọc inventory theo branch_id trong branchinventory

### 7. ✅ getBranchesPerformance (Không cần branchId - so sánh tất cả branches)
**Endpoint:** `GET /api/admin/dashboard/branches-performance?period=month`

**Lý do:** API này để so sánh performance của TẤT CẢ branches

### 8. ✅ getPromotionsStatistics (MỚI THÊM branchId)
**Endpoint:** `GET /api/admin/dashboard/promotions-stats?branchId=1`

**Thay đổi:**
```javascript
// Controller
const { period, startDate, endDate, branchId } = req.query;

// Service - Filter voucher orders by branch
const buildOrderWhere = (baseWhere) => {
  if (branchId) {
    return {
      ...baseWhere,
      shipments: {
        some: { branch_id: Number(branchId) }
      }
    };
  }
  return baseWhere;
};
```

**Logic:**
- Total vouchers & flashsales: Không filter (show all)
- Voucher orders: Filter theo branch
- Top vouchers: Dựa trên orders đã filtered

### 9. ✅ getReviewsStatistics (MỚI THÊM branchId)
**Endpoint:** `GET /api/admin/dashboard/reviews-stats?branchId=1&productId=5`

**Thay đổi:**
```javascript
// Controller
const { period, startDate, endDate, productId, branchId } = req.query;

// Service - Filter reviews by products in branch
if (branchId) {
  const branchProducts = await prisma.branchinventory.findMany({
    where: { branch_id: Number(branchId) },
    select: { product_id: true }
  });
  
  const productIds = branchProducts.map(bp => bp.product_id);
  where.product_id = { in: productIds };
}
```

**Logic:**
- Lấy danh sách products có trong branch inventory
- Filter reviews chỉ của những products đó
- Nếu branch không có product nào → return empty result

### 10. ✅ getRecentActivities (Đã có sẵn branchId)
**Endpoint:** `GET /api/admin/dashboard/recent-activities?branchId=1&limit=20`

**Chức năng:** Lọc recent activities theo branch

## Cách sử dụng

### Xem thống kê toàn hệ thống (All branches)
```bash
GET /api/admin/dashboard/overview
GET /api/admin/dashboard/revenue?period=month
GET /api/admin/dashboard/customers-stats
```

### Xem thống kê theo chi nhánh cụ thể
```bash
GET /api/admin/dashboard/overview?branchId=1
GET /api/admin/dashboard/revenue?branchId=1&period=month
GET /api/admin/dashboard/customers-stats?branchId=2
GET /api/admin/dashboard/promotions-stats?branchId=1
GET /api/admin/dashboard/reviews-stats?branchId=3
```

### Kết hợp nhiều filters
```bash
# Top products của branch 1, period 7 ngày, limit 5
GET /api/admin/dashboard/top-products?branchId=1&period=week&limit=5

# Reviews của product 10 trong branch 2
GET /api/admin/dashboard/reviews-stats?branchId=2&productId=10

# Revenue comparison của branch 1 trong tháng này vs tháng trước
GET /api/admin/dashboard/revenue?branchId=1&period=month&comparison=true
```

## Response Format

Khi có filter branchId, response sẽ có thêm field `filteredByBranch`:

```json
{
  "success": true,
  "data": {
    "totalReviews": 45,
    "averageRating": "4.5",
    "ratingDistribution": {...},
    "filteredByBranch": 1  // ← Thông báo đã filter theo branch
  }
}
```

## Logic Filter theo Branch

### Method 1: Filter qua Orders → Shipments
Áp dụng cho:
- Overview
- Revenue Analytics
- Orders Statistics
- Customers Statistics
- Promotions Statistics
- Recent Activities

```javascript
const orderWhere = {
  shipments: {
    some: { branch_id: Number(branchId) }
  }
};
```

### Method 2: Filter qua Branch Inventory
Áp dụng cho:
- Top Products
- Inventory Statistics

```javascript
const where = {
  branch_id: Number(branchId)
};
```

### Method 3: Filter qua Products in Branch
Áp dụng cho:
- Reviews Statistics

```javascript
// Get products in branch first
const branchProducts = await prisma.branchinventory.findMany({
  where: { branch_id: Number(branchId) },
  select: { product_id: true }
});

// Then filter reviews
where.product_id = { in: productIds };
```

## Bảng tổng hợp

| API | branchId Support | Filter Method | Notes |
|-----|-----------------|---------------|-------|
| getOverview | ✅ | Orders → Shipments | Revenue & orders filtered |
| getRevenueAnalytics | ✅ | Orders → Shipments | Full analytics filtered |
| getTopProducts | ✅ | Branch Inventory | Top products in branch |
| getOrdersStatistics | ✅ | Orders → Shipments | Order stats filtered |
| getCustomersStatistics | ✅ NEW | Orders → Shipments | Top customers by branch |
| getInventoryStatistics | ✅ | Branch Inventory | Direct branch filter |
| getBranchesPerformance | ❌ | N/A | Compare ALL branches |
| getPromotionsStatistics | ✅ NEW | Orders → Shipments | Voucher usage by branch |
| getReviewsStatistics | ✅ NEW | Products in Branch | Reviews of branch products |
| getRecentActivities | ✅ | Orders → Shipments | Activities filtered |

## Testing

```bash
# 1. Test overview with branch filter
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:3000/api/admin/dashboard/overview?branchId=1"

# 2. Test customers stats with branch filter
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:3000/api/admin/dashboard/customers-stats?branchId=1&limit=5"

# 3. Test promotions stats with branch filter
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:3000/api/admin/dashboard/promotions-stats?branchId=2&period=month"

# 4. Test reviews stats with branch filter
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:3000/api/admin/dashboard/reviews-stats?branchId=1"
```

## Migration Notes

### Breaking Changes
❌ Không có breaking changes - tất cả parameters đều optional

### Backward Compatibility
✅ Hoàn toàn backward compatible:
- Không truyền branchId → Hiển thị data của all branches (như cũ)
- Có truyền branchId → Filter theo branch đó

## Future Enhancements

1. **Multi-branch filter:** Support filter multiple branches
   ```
   ?branchIds=1,2,3
   ```

2. **Branch comparison:** So sánh 2 branches
   ```
   ?branchId=1&compareBranchId=2
   ```

3. **Branch hierarchy:** Support parent/child branches
   ```
   ?branchId=1&includeChildren=true
   ```

4. **Branch groups:** Filter theo nhóm branches (region, city)
   ```
   ?branchGroup=north&branchRegion=hanoi
   ```
