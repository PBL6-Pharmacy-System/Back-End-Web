# PHÂN TÍCH API CATEGORIES & PRODUCTS

## 📋 TỔNG QUAN CẤU TRÚC

### Category APIs (7 endpoints)

```
PUBLIC:
GET  /api/categories              - Lấy danh sách categories (phân trang, filter)
GET  /api/categories/tree         - Lấy cây phân cấp category (cho menu)
GET  /api/categories/:id          - Lấy chi tiết 1 category
GET  /api/categories/:id/stats    - Thống kê category (products, inventory)

ADMIN:
POST   /api/categories            - Tạo category mới
PUT    /api/categories/:id        - Cập nhật category
DELETE /api/categories/:id        - Xóa category
```

### Product APIs (6 endpoints)

```
PUBLIC:
GET  /api/products                       - Lấy danh sách products (có filter categoryId)
GET  /api/products/search?q=keyword      - Tìm kiếm products
GET  /api/products/category/:categoryName - Lấy products theo TÊN category
GET  /api/products/best-sellers          - Top bán chạy
GET  /api/products/:id                   - Chi tiết 1 product
GET  /api/products/:id/stats             - Thống kê product

ADMIN:
POST   /api/products                     - Tạo product
PUT    /api/products/:id                 - Cập nhật product
DELETE /api/products/:id                 - Xóa product
```

---

## 🔍 PHÂN TÍCH CHI TIẾT LOGIC

### 1. `/api/products?categoryId=X` (getAllProducts)

**Logic:**

```javascript
// File: productService.getAllProducts()
if (categoryId) {
  const categoryIds = await getAllCategoryIds(categoryId);
  // VD: categoryId=128 → [128, 132, 133, ..., 159, 1-127]
  where.category_id = { in: categoryIds };
}
```

**Giải thích:**

- ✅ **HIERARCHICAL QUERY**: Query products từ category + TẤT CẢ subcategories
- ✅ Hàm `getAllCategoryIds()` duyệt đệ quy tìm tất cả children
- ✅ Ví dụ: `categoryId=128` (TPCN) → trả về 373 products từ 62 categories con
- ✅ Hỗ trợ filter thêm: search, supplierId, minPrice, maxPrice
- ✅ Có pagination: page, limit

**Use case:**

- Frontend/App query: `GET /api/products?categoryId=128&page=1&limit=20`
- Trả về: 20 products đầu tiên thuộc "Thực phẩm chức năng" và tất cả subcategories

---

### 2. `/api/products/category/:categoryName` (getProductsByCategory)

**Logic:**

```javascript
// File: productService.getProductsByCategory()
const category = await prisma.categories.findFirst({
  where: { name: { equals: categoryName, mode: "insensitive" } },
});
const where = { category_id: category.id }; // ❌ CHỈ query category.id
```

**Giải thích:**

- ❌ **FLAT QUERY**: CHỈ query products thuộc chính xác category đó
- ❌ KHÔNG query subcategories (khác với getAllProducts)
- ❌ Query bằng TÊN category (không phải ID)
- ✅ Có pagination

**Vấn đề:**

```
VD: /api/products/category/Thực phẩm chức năng
→ Chỉ trả về products có category_id = 128
→ KHÔNG trả về products từ "Vitamin & Khoáng chất" (132), "Sinh lý" (133), etc.

So sánh:
- /api/products?categoryId=128        → 373 products ✅
- /api/products/category/Thực phẩm... → 0 products ❌
```

---

### 3. `/api/categories/tree` (getCategoryTree)

**Logic:**

```javascript
// File: categoryService.getCategoryTree()
// 1. Lấy tất cả categories với products
const allCategories = await prisma.categories.findMany({
  select: { id, name, parent_id, products: { select: { id } } }
});

// 2. Build map và đếm products đệ quy
const getProductCountRecursive = (categoryId, categoryMap) => {
  let count = category.directProductCount;
  category.children.forEach(childId => {
    count += getProductCountRecursive(childId, categoryMap); // Đệ quy
  });
  return count;
};

// 3. Build tree structure (nested)
tree = [
  { id: 128, name: 'TPCN', product_count: 373, children: [
    { id: 132, name: 'Vitamin', product_count: 90, children: [...] }
  ]}
]
```

**Giải thích:**

- ✅ Trả về cây phân cấp 3 level (Main → Sub → Items)
- ✅ `product_count` được tính đệ quy (bao gồm children)
- ✅ Phù hợp cho Flutter/Frontend render menu
- ✅ Option: `onlyActiveProducts=true` để chỉ đếm products active

**Use case:**

```dart
// Flutter: Load menu khi app khởi động
final response = await http.get('/api/categories/tree');
final tree = CategoryTree.fromJson(response.data);

// Hiển thị Drawer menu
Drawer(
  child: ListView(
    children: tree.map((main) =>
      ExpansionTile(
        title: Text('${main.name} (${main.product_count})'),
        children: main.children.map((sub) => ListTile(...))
      )
    )
  )
)
```

---

## ⚠️ VẤN ĐỀ VÀ KIẾN NGHỊ

### 🔴 CRITICAL: API THỪA/DƯ THỪA

#### 1. `GET /api/products/category/:categoryName` - **NÊN XÓA**

**Lý do:**

- ❌ Chức năng bị **DUPLICATE** với `/api/products?categoryId=X`
- ❌ Query bằng TÊN thay vì ID (không chuẩn RESTful)
- ❌ KHÔNG hỗ trợ hierarchical query (kém hơn getAllProducts)
- ❌ Tên category có thể trùng lặp → lỗi logic
- ❌ Frontend phải encode URL với tiếng Việt có dấu

**So sánh:**

```
❌ BAD:  GET /api/products/category/Thực phẩm chức năng
         → Phức tạp, không hierarchical, dễ lỗi

✅ GOOD: GET /api/products?categoryId=128
         → Đơn giản, hierarchical, chuẩn RESTful
```

**Kiến nghị:**

```javascript
// XÓA route này trong productRoutes.js:
router.get('/products/category/:categoryName', productController.getProductsByCategory);

// XÓA luôn trong productController.js và productService.js
export const getProductsByCategory = async (categoryName, ...) => {...}
```

---

### 🟡 CẦN CHỈNH SỬA

#### 1. `/api/categories?parentId=X` - Thiếu logic hierarchical

**Hiện tại:**

```javascript
// categoryService.getAllCategories()
const where = {
  AND: [
    parentId ? { parent_id: parentId } : {}, // ❌ Chỉ query direct children
    search ? { name: { contains: search } } : {},
  ],
};
```

**Vấn đề:**

- Query `/api/categories?parentId=128` chỉ trả về subcategories (132-140)
- KHÔNG trả về items (1-127)

**Giải pháp:**

```javascript
// KHÔNG CẦN SỬA - Giữ nguyên flat query
// Lý do:
// - /categories?parentId=X → Lấy direct children (đúng nghĩa)
// - /categories/tree → Đã có hierarchical query rồi
```

---

#### 2. `/api/products?categoryId=X` - Cần thêm option

**Hiện tại:**

```javascript
// LUÔN query hierarchical (bao gồm children)
if (categoryId) {
  const categoryIds = await getAllCategoryIds(categoryId);
  where.category_id = { in: categoryIds };
}
```

**Kiến nghị:** Thêm option `includeSubcategories`

```javascript
if (categoryId) {
  if (includeSubcategories === "false") {
    // Chỉ query category này (flat)
    where.category_id = Number(categoryId);
  } else {
    // Mặc định: query cả children (hierarchical)
    const categoryIds = await getAllCategoryIds(categoryId);
    where.category_id = { in: categoryIds };
  }
}
```

**Use case:**

```
GET /api/products?categoryId=128                             → 373 products (hierarchical)
GET /api/products?categoryId=128&includeSubcategories=false  → 0 products (flat)
```

---

### ✅ API ĐÃ TỐT - GIỮ NGUYÊN

#### 1. `GET /api/categories/tree` ⭐⭐⭐⭐⭐

- Perfect cho Flutter menu
- Product count đệ quy chính xác
- Response structure tốt

#### 2. `GET /api/products?categoryId=X` ⭐⭐⭐⭐

- Hierarchical query thông minh
- Hỗ trợ đầy đủ filters
- Pagination chuẩn

#### 3. `GET /api/categories/:id/stats` ⭐⭐⭐⭐

- Thống kê chi tiết (products, inventory, value)
- Bao gồm children
- Hữu ích cho admin

---

## 📱 HƯỚNG DẪN CHO FRONTEND/FLUTTER

### Quy trình chuẩn:

#### Bước 1: Load category tree khi app khởi động

```dart
Future<List<Category>> loadCategoryTree() async {
  final response = await http.get('/api/categories/tree');
  return (response.data['data'] as List)
    .map((json) => Category.fromJson(json))
    .toList();
}

// Cache vào SharedPreferences
await prefs.setString('category_tree', jsonEncode(tree));
```

#### Bước 2: Hiển thị menu từ tree

```dart
// User click "Thực phẩm chức năng" → categoryId = 128
Widget buildCategoryMenu(List<Category> tree) {
  return ListView.builder(
    itemCount: tree.length,
    itemBuilder: (context, index) {
      final main = tree[index];
      return ExpansionTile(
        title: Text('${main.name} (${main.productCount} SP)'),
        children: main.children.map((sub) =>
          ListTile(
            title: Text('${sub.name} (${sub.productCount} SP)'),
            onTap: () => navigateToProducts(sub.id), // ← Dùng ID
          )
        ).toList(),
      );
    }
  );
}
```

#### Bước 3: Query products khi user click

```dart
Future<ProductList> getProductsByCategory(int categoryId, {int page = 1}) async {
  // ✅ ĐÚNG: Dùng categoryId (hierarchical query)
  final response = await http.get(
    '/api/products?categoryId=$categoryId&page=$page&limit=20'
  );
  return ProductList.fromJson(response.data);
}

// ❌ SAI: Đừng dùng categoryName
// final response = await http.get('/api/products/category/$categoryName');
```

---

## 🎯 CHECKLIST IMPLEMENTATION

### Frontend/Flutter cần làm:

- [ ] Load `/api/categories/tree` khi app start
- [ ] Cache tree vào local storage (SharedPreferences/localStorage)
- [ ] Build menu từ tree (nested structure)
- [ ] Khi user click category → lấy `categoryId` (number)
- [ ] Query products: `GET /api/products?categoryId={id}&page=1`
- [ ] Hiển thị số lượng products: Lấy từ `product_count` trong tree

### Backend cần làm:

- [x] Xóa field `description` khỏi database ✅
- [x] Update Prisma schema ✅
- [x] Xóa `description` khỏi tất cả APIs ✅
- [ ] **XÓA API thừa:** `GET /api/products/category/:categoryName`
- [ ] **(Optional)** Thêm param `includeSubcategories` vào `/api/products`
- [ ] Generate Prisma client mới
- [ ] Test lại tất cả APIs

---

## 📊 SUMMARY CUỐI CÙNG

| API Endpoint                       | Status       | Action     | Reason                         |
| ---------------------------------- | ------------ | ---------- | ------------------------------ |
| `GET /api/categories/tree`         | ✅ Perfect   | Giữ nguyên | Core API cho menu              |
| `GET /api/products?categoryId=X`   | ✅ Good      | Giữ nguyên | Hierarchical query             |
| `GET /api/products/category/:name` | ❌ Duplicate | **XÓA**    | Thừa, dùng categoryId thay thế |
| `GET /api/categories?parentId=X`   | ✅ OK        | Giữ nguyên | Flat query đúng nghĩa          |
| `GET /api/categories/:id/stats`    | ✅ Good      | Giữ nguyên | Admin cần                      |

**Tổng kết:**

- **7 category APIs** - Tất cả hợp lý ✅
- **6 product APIs** - 1 API thừa cần xóa ❌
- **Cần xóa:** `getProductsByCategory(categoryName)`
- **Lý do:** Duplicate với `getAllProducts(categoryId)` nhưng kém hơn
