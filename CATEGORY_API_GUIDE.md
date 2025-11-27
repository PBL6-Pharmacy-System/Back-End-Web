# 📚 CATEGORY API - HƯỚNG DẪN CHO FRONTEND/APP

## 🎯 Luồng hoạt động

```
App khởi động
    ↓
Gọi GET /api/categories/tree
    ↓
Lưu category tree vào state/cache
    ↓
Hiển thị menu categories
    ↓
User click vào category
    ↓
Lấy categoryId từ tree
    ↓
Gọi GET /api/products?categoryId={id}
    ↓
Hiển thị danh sách products
```

---

## 📡 API Endpoints

### 1️⃣ GET `/api/categories/tree` - **Lấy cây phân cấp categories**

**Mục đích:** Lấy toàn bộ categories dạng nested tree để hiển thị menu

**Request:**

```http
GET http://localhost:3000/api/categories/tree
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": 157,
      "name": "Thực phẩm chức năng",
      "description": "Các sản phẩm bổ sung dinh dưỡng",
      "parent_id": null,
      "product_count": 509,
      "children": [
        {
          "id": 162,
          "name": "Vitamin & Khoáng chất",
          "description": null,
          "parent_id": 157,
          "product_count": 419,
          "children": [
            {
              "id": 14,
              "name": "Vitamin tổng hợp",
              "description": null,
              "parent_id": 162,
              "product_count": 13,
              "children": []
            },
            ...
          ]
        },
        ...
      ]
    },
    ...
  ]
}
```

**Cách sử dụng trong Flutter:**

```dart
// 1. Tạo model
class Category {
  final int id;
  final String name;
  final String? description;
  final int? parentId;
  final int productCount;
  final List<Category> children;

  Category.fromJson(Map<String, dynamic> json)
      : id = json['id'],
        name = json['name'],
        description = json['description'],
        parentId = json['parent_id'],
        productCount = json['product_count'],
        children = (json['children'] as List)
            .map((c) => Category.fromJson(c))
            .toList();
}

// 2. Gọi API khi app khởi động
Future<List<Category>> fetchCategoryTree() async {
  final response = await http.get(
    Uri.parse('http://localhost:3000/api/categories/tree')
  );

  if (response.statusCode == 200) {
    final data = jsonDecode(response.body);
    return (data['data'] as List)
        .map((json) => Category.fromJson(json))
        .toList();
  }
  throw Exception('Failed to load categories');
}

// 3. Lưu vào state management (Provider/Riverpod/Bloc)
final categoryProvider = FutureProvider<List<Category>>((ref) async {
  return await fetchCategoryTree();
});

// 4. Hiển thị menu
Widget buildCategoryMenu(List<Category> categories) {
  return ListView.builder(
    itemCount: categories.length,
    itemBuilder: (context, index) {
      final category = categories[index];
      return ExpansionTile(
        title: Text('${category.name} (${category.productCount})'),
        children: category.children.map((sub) {
          return ExpansionTile(
            title: Text('${sub.name} (${sub.productCount})'),
            children: sub.children.map((item) {
              return ListTile(
                title: Text('${item.name} (${item.productCount})'),
                onTap: () {
                  // Khi user click → gọi API products với categoryId
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => ProductListPage(categoryId: item.id),
                    ),
                  );
                },
              );
            }).toList(),
          );
        }).toList(),
      );
    },
  );
}
```

---

### 2️⃣ GET `/api/products?categoryId={id}` - **Lấy products theo category**

**Request:**

```http
GET http://localhost:3000/api/products?categoryId=157&page=1&limit=20
```

**Response:**

```json
{
  "success": true,
  "data": {
    "products": [...],
    "pagination": {
      "total": 509,
      "page": 1,
      "limit": 20,
      "totalPages": 26
    }
  }
}
```

**Cách sử dụng trong Flutter:**

```dart
// ProductListPage
class ProductListPage extends StatelessWidget {
  final int categoryId;

  const ProductListPage({required this.categoryId});

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<ProductResponse>(
      future: fetchProducts(categoryId),
      builder: (context, snapshot) {
        if (snapshot.hasData) {
          return ListView.builder(
            itemCount: snapshot.data!.products.length,
            itemBuilder: (context, index) {
              final product = snapshot.data!.products[index];
              return ProductCard(product: product);
            },
          );
        }
        return CircularProgressIndicator();
      },
    );
  }

  Future<ProductResponse> fetchProducts(int categoryId) async {
    final response = await http.get(
      Uri.parse('http://localhost:3000/api/products?categoryId=$categoryId&limit=20')
    );
    // Parse response...
  }
}
```

---

### 3️⃣ GET `/api/categories` - **Lấy tất cả categories (flat list)**

**Request:**

```http
GET http://localhost:3000/api/categories?limit=200
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Máy massage",
      "description": null,
      "parent_id": 189,
      ...
    },
    ...
  ],
  "pagination": {
    "total": 189,
    "page": 1,
    "limit": 200,
    "totalPages": 1
  }
}
```

**Khi nào dùng:** Khi cần danh sách phẳng (không cần tree) để search, filter, v.v.

---

## 🎨 UI Examples

### Example 1: Drawer Menu với Category Tree

```dart
Drawer(
  child: ListView(
    children: [
      DrawerHeader(child: Text('Categories')),
      ...categoryTree.map((main) => ExpansionTile(
        leading: Icon(Icons.category),
        title: Text(main.name),
        subtitle: Text('${main.productCount} products'),
        children: main.children.map((sub) => ExpansionTile(
          title: Text(sub.name),
          leading: SizedBox(width: 16),
          children: sub.children.map((item) => ListTile(
            title: Text(item.name),
            trailing: Text('${item.productCount}'),
            onTap: () => navigateToProducts(item.id),
          )).toList(),
        )).toList(),
      )).toList(),
    ],
  ),
)
```

### Example 2: Horizontal Category Chips

```dart
SingleChildScrollView(
  scrollDirection: Axis.horizontal,
  child: Row(
    children: categoryTree.map((category) =>
      Padding(
        padding: EdgeInsets.all(8),
        child: ChoiceChip(
          label: Text(category.name),
          selected: selectedCategoryId == category.id,
          onSelected: (_) {
            setState(() => selectedCategoryId = category.id);
            fetchProducts(category.id);
          },
        ),
      ),
    ).toList(),
  ),
)
```

### Example 3: Grid View Categories

```dart
GridView.builder(
  gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
    crossAxisCount: 2,
    childAspectRatio: 1.5,
  ),
  itemCount: categoryTree.length,
  itemBuilder: (context, index) {
    final category = categoryTree[index];
    return Card(
      child: InkWell(
        onTap: () => navigateToCategory(category.id),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.category, size: 48),
            Text(category.name, style: TextStyle(fontWeight: FontWeight.bold)),
            Text('${category.productCount} sản phẩm'),
          ],
        ),
      ),
    );
  },
)
```

---

## 🚀 Best Practices

### 1. Cache Category Tree

```dart
// Lưu vào local storage để không phải gọi API mỗi lần mở app
class CategoryService {
  static const String CACHE_KEY = 'category_tree';
  static const Duration CACHE_DURATION = Duration(days: 1);

  Future<List<Category>> getCategoryTree() async {
    // Kiểm tra cache
    final cached = await getCachedCategories();
    if (cached != null) return cached;

    // Fetch từ API
    final categories = await fetchCategoryTree();

    // Lưu cache
    await saveCache(categories);

    return categories;
  }
}
```

### 2. Lazy Loading cho Products

```dart
// Chỉ load products khi user scroll đến cuối list
class ProductListPage extends StatefulWidget {
  @override
  _ProductListPageState createState() => _ProductListPageState();
}

class _ProductListPageState extends State<ProductListPage> {
  int currentPage = 1;
  List<Product> products = [];
  bool isLoading = false;

  @override
  void initState() {
    super.initState();
    fetchProducts();
  }

  Future<void> fetchProducts() async {
    if (isLoading) return;
    setState(() => isLoading = true);

    final newProducts = await api.getProducts(
      categoryId: widget.categoryId,
      page: currentPage,
      limit: 20,
    );

    setState(() {
      products.addAll(newProducts);
      currentPage++;
      isLoading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      itemCount: products.length + 1,
      itemBuilder: (context, index) {
        if (index == products.length) {
          return isLoading
            ? CircularProgressIndicator()
            : SizedBox.shrink();
        }
        return ProductCard(product: products[index]);
      },
      onScrollEnd: () => fetchProducts(), // Load more
    );
  }
}
```

### 3. Search trong Categories

```dart
TextField(
  decoration: InputDecoration(
    hintText: 'Tìm danh mục...',
    prefixIcon: Icon(Icons.search),
  ),
  onChanged: (query) {
    final filtered = categoryTree
        .where((c) => c.name.toLowerCase().contains(query.toLowerCase()))
        .toList();
    setState(() => filteredCategories = filtered);
  },
)
```

---

## 📊 Data Flow Summary

```
1. App Start
   └─ GET /api/categories/tree
   └─ Save to cache
   └─ Display category menu

2. User clicks "Thực phẩm chức năng" (ID: 157)
   └─ GET /api/products?categoryId=157
   └─ Returns 509 products (from ALL subcategories)

3. User clicks "Vitamin & Khoáng chất" (ID: 162)
   └─ GET /api/products?categoryId=162
   └─ Returns 419 products (from item categories)

4. User clicks "Vitamin tổng hợp" (ID: 14)
   └─ GET /api/products?categoryId=14
   └─ Returns 13 products (only from this category)
```

---

## ✅ Checklist cho Frontend Developer

- [ ] Tạo Category model với children list
- [ ] Gọi API `/categories/tree` khi app khởi động
- [ ] Cache category tree trong local storage
- [ ] Hiển thị category menu (Drawer/AppBar/Grid)
- [ ] Implement navigation khi user click category
- [ ] Gọi `/products?categoryId=X` với ID từ category tree
- [ ] Implement pagination cho product list
- [ ] Thêm loading state và error handling
- [ ] Test với các level categories khác nhau (main/sub/item)

---

## 🐛 Troubleshooting

**Q: API trả về empty array?**

- Kiểm tra server đang chạy: `http://localhost:3000`
- Kiểm tra database có categories chưa
- Check console log server có error không

**Q: Products không hiển thị khi click category?**

- Verify categoryId có đúng không (console.log)
- Check response từ API `/products?categoryId=X`
- Đảm bảo category có products (xem `product_count`)

**Q: Category tree quá lớn, load lâu?**

- Implement caching với SharedPreferences/Hive
- Chỉ fetch khi cache hết hạn (1 ngày)
- Consider lazy loading subcategories

---

**💡 TIP:** Dùng Thunder Client hoặc Postman để test API trước khi code UI!
