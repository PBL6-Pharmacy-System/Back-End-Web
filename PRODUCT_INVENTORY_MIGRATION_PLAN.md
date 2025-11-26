# KẾ HOẠCH CHUYỂN ĐỔI QUẢN LÝ SỐ LƯỢNG SẢN PHẨM
## PRODUCT INVENTORY MIGRATION PLAN

---

##  MỤC LỤC

1. [Tổng quan hiện trạng](#1-tổng-quan-hiện-trạng)
2. [Phân tích vấn đề](#2-phân-tích-vấn-đề)
3. [Kiến trúc mục tiêu](#3-kiến-trúc-mục-tiêu)
4. [Các rủi ro và Edge Cases](#4-các-rủi-ro-và-edge-cases)
5. [Chiến lược Migration](#5-chiến-lược-migration)
6. [Kế hoạch thực hiện chi tiết](#6-kế-hoạch-thực-hiện-chi-tiết)
7. [Rollback Strategy](#7-rollback-strategy)
8. [Testing Plan](#8-testing-plan)
9. [Monitoring & Validation](#9-monitoring--validation)

---

## 1. TỔNG QUAN HIỆN TRẠNG

### 1.1. Dữ liệu hiện tại

**Database Schema - Bảng products:**
- Có trường quantity (không tồn tại trong schema Prisma hiện tại - đã bị loại bỏ)
- Dữ liệu crawl từ web: ~1000+ sản phẩm
- Chỉ có thông tin cơ bản: name, price, description, category, supplier, images
- **KHÔNG CÓ** thông tin về:
  - Chi nhánh/kho nào đang lưu trữ
  - Số lô (batch) sản xuất
  - Ngày sản xuất/hết hạn
  - Giá nhập/giá bán theo lô
  - Lịch sử xuất nhập kho

**Dữ liệu mẫu từ crawl:**
`json
{
  "name": "Máy xung điện trị liệu Omron HV-F013",
  "price": 960000,
  "unit": "Hộp",
  "manufacturer": "OMRON HEALTHCARE",
  "category": ["Thiết bị y tế"],
  "image": "..."
}
`

### 1.2. Infrastructure đã có

** Schema Database hoàn chỉnh:**

`prisma
// Chi nhánh/Kho
model branches {
  id         Int     @id @default(autoincrement())
  name       String
  address    String
  phone      String?
  city_id    Int?
  is_active  Boolean @default(true)
}

// Tồn kho theo chi nhánh
model branchinventory {
  id              Int      @id @default(autoincrement())
  branch_id       Int
  product_id      Int
  stock           Int      @default(0)
  min_stock       Int?
  max_stock       Int?
  reorder_point   Int?
  reorder_quantity Int?
  last_stock_take DateTime?
  
  @@unique([branch_id, product_id])
}

// Quản lý theo lô
model productBatch {
  id               Int      @id @default(autoincrement())
  product_id       Int
  branch_id        Int
  batch_number     String
  manufacture_date DateTime?
  expiry_date      DateTime?
  quantity         Int      @default(0)
  cost_price       Decimal?
  selling_price    Decimal?
  supplier_id      Int?
  status           String   @default("active")
  
  @@unique([batch_number, product_id, branch_id])
}

// Nhật ký xuất nhập kho
model inventoryLog {
  id           Int      @id @default(autoincrement())
  branch_id    Int
  product_id   Int
  batch_id     Int?
  quantity     Int
  type         String   // IMPORT, EXPORT, TRANSFER, ADJUST, DAMAGE
  reference_id Int?
  reference_type String?
  note         String?
  created_by   Int?
  date         DateTime @default(now())
}
`

** Services đã implement:**
- ranchInventoryService.js - Quản lý tồn kho chi nhánh
- productBatchService.js - Quản lý lô hàng
- inventoryTransferService.js - Chuyển kho
- stockTakeService.js - Kiểm kê kho

---

## 2. PHÂN TÍCH VẤN ĐỀ

### 2.1. Vấn đề dữ liệu

####  **CRITICAL: Thiếu thông tin bắt buộc**

| Thông tin cần thiết | Trạng thái | Giải pháp |
|---------------------|------------|-----------|
| Chi nhánh/kho lưu trữ |  Không có | Tạo chi nhánh mặc định |
| Số lô (batch) |  Không có | Generate batch tự động |
| Ngày sản xuất/hết hạn |  Không có | Ước tính/Để null |
| Giá nhập |  Không có | Tính từ giá bán |
| Số lượng ban đầu |  Không rõ | Cần quyết định business |

####  **HIGH RISK: Vấn đề dữ liệu không nhất quán**

`javascript
// Sản phẩm có "quantity" trong crawl data nhưng schema không có
// Có thể gây lỗi khi query
const product = {
  price: 960000,
  quantity: 100 //  Trường này KHÔNG TỒN TẠI trong schema
}
`

### 2.2. Vấn đề Business Logic

#### **Câu hỏi cần trả lời:**

1. **Số lượng ban đầu cho mỗi sản phẩm?**
   - Option A: Set tất cả = 0 (an toàn nhất)
   - Option B: Random trong khoảng hợp lý (50-200)
   - Option C: Import từ file Excel/CSV do business cung cấp
   - **KHUYẾN NGHỊ:** Option A + Manual import sau

2. **Chi nhánh nào sẽ lưu trữ?**
   - Option A: Tạo 1 chi nhánh mặc định "Kho Trung Tâm"
   - Option B: Phân bổ đều cho nhiều chi nhánh
   - **KHUYẾN NGHỊ:** Option A

3. **Thông tin lô hàng?**
   - Batch number: Auto-generate (format: BATCH-YYYYMMDD-XXXXX)
   - Ngày sản xuất: 30 ngày trước ngày migration
   - Ngày hết hạn: 
     - Dược phẩm: +24 tháng
     - Thiết bị y tế: +36 tháng
     - Mỹ phẩm: +24 tháng

4. **Giá nhập (cost_price)?**
   - Formula: cost_price = selling_price * 0.7 (markup 30%)

### 2.3. Vấn đề kỹ thuật

#### **Database Constraints**

`sql
-- Constraint có thể gây lỗi
ALTER TABLE branchinventory 
ADD CONSTRAINT unique_branch_product 
UNIQUE(branch_id, product_id);

-- Risk: Nếu insert trùng sẽ fail
-- Solution: Use UPSERT (ON CONFLICT UPDATE)
`

#### **Foreign Key Dependencies**

`
products (id)
    
branchinventory (product_id, branch_id)
    
productBatch (branch_id, product_id)
    
inventoryLog (batch_id)
`

**Risk:** Insert sai thứ tự  Lỗi foreign key

---

## 3. KIẾN TRÚC MỤC TIÊU

### 3.1. Data Flow sau Migration

`

  PRODUCTS TABLE (Crawled Data)                      
  - Thông tin sản phẩm cơ bản                        
  - KHÔNG lưu quantity                                

                   
                   

  BRANCHES TABLE                                      
  - Kho Trung Tâm (Main Warehouse)                   
  - Kho Chi Nhánh 1, 2, 3...                         

                   
                   

  BRANCHINVENTORY TABLE                               
  - Tồn kho tổng theo chi nhánh                       
  - stock, min_stock, max_stock                       
  - reorder_point, reorder_quantity                   

                   
                   

  PRODUCTBATCH TABLE                                  
  - Quản lý theo lô cụ thể                            
  - batch_number, manufacture_date, expiry_date       
  - quantity, cost_price, selling_price               

                   
                   

  INVENTORYLOG TABLE                                  
  - Lịch sử mọi giao dịch                             
  - IMPORT (nhập kho ban đầu)                         
  - EXPORT (xuất bán)                                 
  - ADJUST (điều chỉnh)                               

`

### 3.2. API Endpoints cần update

#### **Hiện tại (Sai):**
`javascript
//  Query trực tiếp từ products - KHÔNG CÓ quantity
GET /api/products/:id
Response: {
  id: 1,
  name: "Product A",
  price: 100000
  // quantity: ???  KHÔNG TỒN TẠI
}
`

#### **Sau Migration (Đúng):**
`javascript
//  Query inventory từ branchinventory
GET /api/products/:id?branch_id=1
Response: {
  id: 1,
  name: "Product A",
  price: 100000,
  inventory: {
    total_stock: 150,
    available_branches: [
      { branch_id: 1, branch_name: "Kho TT", stock: 100 },
      { branch_id: 2, branch_name: "Chi nhánh 1", stock: 50 }
    ]
  }
}

//  Query tổng kho toàn hệ thống
GET /api/inventory/products/:id/total-stock
Response: {
  product_id: 1,
  total_stock: 150,
  branch_count: 2,
  low_stock_branches: [],
  batches: [
    {
      batch_number: "BATCH-20250101-00001",
      quantity: 100,
      expiry_date: "2027-01-01"
    }
  ]
}
`

---

## 4. CÁC RỦI RO VÀ EDGE CASES

### 4.1. Rủi ro Dữ liệu

####  **CRITICAL RISKS**

| # | Rủi ro | Impact | Probability | Mitigation |
|---|--------|--------|-------------|------------|
| 1 | **Data Loss**: Mất dữ liệu khi migration |  Cao |  Trung bình | Full backup trước khi chạy |
| 2 | **Duplicate Records**: Insert trùng dữ liệu |  Cao |  Thấp | UPSERT + transaction |
| 3 | **Foreign Key Violation**: Sai thứ tự insert |  Cao |  Trung bình | Insert theo DAG dependencies |
| 4 | **Transaction Timeout**: Query quá lâu |  Trung bình |  Trung bình | Batch processing 100 records/batch |
| 5 | **Constraint Violation**: Vi phạm unique constraint |  Cao |  Thấp | Check exist before insert |

####  **MEDIUM RISKS**

| # | Rủi ro | Impact | Mitigation |
|---|--------|--------|------------|
| 6 | **Inconsistent State**: Một số bảng có dữ liệu, một số không |  Trung bình | Atomic transaction |
| 7 | **Performance Degradation**: DB chậm trong quá trình migration |  Trung bình | Run off-peak hours |
| 8 | **API Downtime**: Users không truy cập được |  Trung bình | Maintenance window |

### 4.2. Edge Cases cần xử lý

#### **Case 1: Sản phẩm không có category**
`javascript
// Input
const product = {
  name: "Product X",
  category_id: null //  NULL
}

// Solution
const defaultCategory = await prisma.categories.findFirst({
  where: { name: "Chưa phân loại" }
});
product.category_id = defaultCategory.id;
`

#### **Case 2: Supplier không tồn tại**
`javascript
// Input: manufacturer = "ABC Company"
// DB: Không có supplier "ABC Company"

// Solution: Create supplier on-the-fly
const supplier = await prisma.suppliers.upsert({
  where: { name: product.manufacturer },
  create: {
    name: product.manufacturer || "Unknown Supplier",
    contact_info: {}
  },
  update: {}
});
`

#### **Case 3: Price = 0 hoặc NULL**
`javascript
// Input
const product = {
  price: 0 //  Không hợp lệ
}

// Solution: Skip hoặc set giá mặc định
if (!product.price || product.price <= 0) {
  console.warn(Invalid price for product: );
  product.price = 10000; // Default min price
}
`

#### **Case 4: Duplicate product name**
`javascript
// Input: 2 products cùng tên nhưng khác nhau
// Product 1: "Panadol 500mg"
// Product 2: "Panadol 500mg" (from different supplier)

// Solution: Check by SKU or name+manufacturer
const existingProduct = await prisma.products.findFirst({
  where: {
    AND: [
      { name: product.name },
      { manufacturer: product.manufacturer }
    ]
  }
});

if (existingProduct) {
  // Update existing instead of create new
}
`

#### **Case 5: Batch number collision**
`javascript
// Generate unique batch number
function generateBatchNumber(productId, branchId) {
  const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  return BATCH----;
}
`

#### **Case 6: Expiry date trong quá khứ**
`javascript
// Nếu calculate expiry date < now
const expiryDate = new Date();
expiryDate.setMonth(expiryDate.getMonth() + 24);

if (expiryDate < new Date()) {
  // Don't create this batch or set status = 'expired'
  batch.status = 'expired';
}
`

### 4.3. Vấn đề bảo mật

####  **Security Concerns**

1. **SQL Injection trong migration script**
   `javascript
   //  BAD
   await prisma.(INSERT INTO branches (name) VALUES (''));
   
   //  GOOD
   await prisma.branches.create({
     data: { name: name }
   });
   `

2. **Access Control**
   `javascript
   // Chỉ admin mới được chạy migration
   if (user.role !== 'SUPER_ADMIN') {
     throw new Error('Unauthorized');
   }
   `

3. **Audit Log**
   `javascript
   // Log mọi thay đổi
   await prisma.logs.create({
     data: {
       user_id: currentUser.id,
       action: 'MIGRATION_RUN',
       details: JSON.stringify({
         products_migrated: count,
         timestamp: new Date()
       })
     }
   });
   `

4. **Data Encryption**
   - Backup database phải được encrypt
   - Sensitive data (cost_price) cần encrypt at rest

---

## 5. CHIẾN LƯỢC MIGRATION

### 5.1. Phương pháp: **Phased Migration** (Migration theo giai đoạn)

`
Phase 1: PREPARATION
 Backup database
 Create default branch
 Validate existing data
 Generate migration script

Phase 2: DRY RUN
 Run on TEST database
 Validate results
 Check performance
 Fix issues

Phase 3: PRODUCTION RUN
 Maintenance mode ON
 Run migration script
 Validate data integrity
 Smoke test APIs

Phase 4: POST-MIGRATION
 Monitor system
 Update documentation
 Train staff
 Cleanup old data
`

### 5.2. Migration Script Structure

`javascript
// scripts/migrate-products-to-inventory.js

const migrationSteps = [
  {
    name: 'Step 1: Backup Database',
    fn: async () => { /* ... */ },
    rollback: async () => { /* ... */ }
  },
  {
    name: 'Step 2: Create Default Branch',
    fn: async () => { /* ... */ },
    rollback: async () => { /* ... */ }
  },
  {
    name: 'Step 3: Migrate Products to BranchInventory',
    fn: async () => { /* ... */ },
    rollback: async () => { /* ... */ }
  },
  {
    name: 'Step 4: Create Product Batches',
    fn: async () => { /* ... */ },
    rollback: async () => { /* ... */ }
  },
  {
    name: 'Step 5: Create Initial Inventory Logs',
    fn: async () => { /* ... */ },
    rollback: async () => { /* ... */ }
  }
];

async function runMigration() {
  for (const step of migrationSteps) {
    try {
      console.log(Running: );
      await step.fn();
      console.log(  completed);
    } catch (error) {
      console.error(  failed:, error);
      await rollbackMigration(step);
      throw error;
    }
  }
}
`

---

## 6. KẾ HOẠCH THỰC HIỆN CHI TIẾT

### 6.1. Pre-Migration Checklist

- [ ] **Backup Database**
  `ash
  pg_dump -h host -U user -d database > backup_.sql
  `

- [ ] **Check Disk Space**
  `sql
  SELECT pg_size_pretty(pg_database_size('your_database'));
  -- Need at least 2x current size
  `

- [ ] **Verify Schema**
  `ash
  npx prisma db pull
  npx prisma generate
  `

- [ ] **Create Default Branch**
  `javascript
  const defaultBranch = await prisma.branches.create({
    data: {
      name: "Kho Trung Tâm",
      address: "Số 1 Đường ABC, Quận 1, TP.HCM",
      phone: "0283xxxxxxx",
      is_active: true,
      city_id: 1 // Assume HCM city
    }
  });
  `

- [ ] **Create Default Category**
  `javascript
  const defaultCategory = await prisma.categories.create({
    data: {
      name: "Chưa phân loại",
      description: "Sản phẩm chưa được phân loại"
    }
  });
  `

### 6.2. Migration Steps

#### **STEP 1: Chuẩn bị dữ liệu (Preparation)**

**File:** scripts/migrate-products-to-inventory.js

`javascript
import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

// Config
const CONFIG = {
  DEFAULT_BRANCH_NAME: "Kho Trung Tâm",
  DEFAULT_INITIAL_STOCK: 0, // Safe default
  BATCH_SIZE: 100,
  DEFAULT_SHELF_LIFE_MONTHS: {
    'Dược phẩm': 24,
    'Thiết bị y tế': 36,
    'Mỹ phẩm': 24,
    'Thực phẩm chức năng': 24,
    'default': 24
  },
  COST_MARGIN: 0.7 // cost = price * 0.7
};

// Step 1: Validate and prepare
async function step1_preparation() {
  console.log(' Step 1: Preparation...');
  
  // 1.1 Check if branch exists
  let defaultBranch = await prisma.branches.findFirst({
    where: { name: CONFIG.DEFAULT_BRANCH_NAME }
  });
  
  if (!defaultBranch) {
    console.log('Creating default branch...');
    defaultBranch = await prisma.branches.create({
      data: {
        name: CONFIG.DEFAULT_BRANCH_NAME,
        address: "Kho trung tâm (Migration)",
        phone: "0000000000",
        is_active: true
      }
    });
  }
  
  console.log( Default branch:  (ID: ));
  
  // 1.2 Get all products
  const products = await prisma.products.findMany({
    include: {
      categories: true,
      suppliers: true
    }
  });
  
  console.log( Found  products to migrate);
  
  // 1.3 Validate data
  const invalidProducts = products.filter(p => !p.price || p.price <= 0);
  if (invalidProducts.length > 0) {
    console.warn(   products have invalid price);
    // Log to file
    fs.writeFileSync(
      'migration-invalid-products.json',
      JSON.stringify(invalidProducts, null, 2)
    );
  }
  
  return { defaultBranch, products };
}
`

#### **STEP 2: Migration chính (Main Migration)**

`javascript
async function step2_migrateInventory(defaultBranch, products) {
  console.log('\n Step 2: Migrating to BranchInventory...');
  
  const results = {
    success: 0,
    failed: 0,
    skipped: 0,
    errors: []
  };
  
  // Process in batches
  for (let i = 0; i < products.length; i += CONFIG.BATCH_SIZE) {
    const batch = products.slice(i, i + CONFIG.BATCH_SIZE);
    
    console.log(Processing batch /...);
    
    await prisma.(async (tx) => {
      for (const product of batch) {
        try {
          // Skip if invalid
          if (!product.price || product.price <= 0) {
            results.skipped++;
            continue;
          }
          
          // 2.1 Create/Update BranchInventory
          const inventory = await tx.branchinventory.upsert({
            where: {
              branch_id_product_id: {
                branch_id: defaultBranch.id,
                product_id: product.id
              }
            },
            create: {
              branch_id: defaultBranch.id,
              product_id: product.id,
              stock: CONFIG.DEFAULT_INITIAL_STOCK,
              min_stock: 10, // Business rule
              max_stock: 1000, // Business rule
              reorder_point: 20,
              reorder_quantity: 100,
              last_updated: new Date()
            },
            update: {
              last_updated: new Date()
            }
          });
          
          // 2.2 Create ProductBatch
          const batchNumber = generateBatchNumber(product.id, defaultBranch.id);
          const manufactureDate = new Date();
          manufactureDate.setDate(manufactureDate.getDate() - 30); // 30 days ago
          
          const categoryName = product.categories?.name || 'default';
          const shelfLifeMonths = CONFIG.DEFAULT_SHELF_LIFE_MONTHS[categoryName] || CONFIG.DEFAULT_SHELF_LIFE_MONTHS.default;
          
          const expiryDate = new Date(manufactureDate);
          expiryDate.setMonth(expiryDate.getMonth() + shelfLifeMonths);
          
          const costPrice = product.price * CONFIG.COST_MARGIN;
          
          const batch = await tx.productBatch.create({
            data: {
              product_id: product.id,
              branch_id: defaultBranch.id,
              batch_number: batchNumber,
              manufacture_date: manufactureDate,
              expiry_date: expiryDate,
              quantity: CONFIG.DEFAULT_INITIAL_STOCK,
              cost_price: costPrice,
              selling_price: product.price,
              supplier_id: product.supplier_id,
              status: expiryDate < new Date() ? 'expired' : 'active',
              note: 'Initial migration batch'
            }
          });
          
          // 2.3 Create Inventory Log
          if (CONFIG.DEFAULT_INITIAL_STOCK > 0) {
            await tx.inventoryLog.create({
              data: {
                branch_id: defaultBranch.id,
                product_id: product.id,
                batch_id: batch.id,
                quantity: CONFIG.DEFAULT_INITIAL_STOCK,
                type: 'IMPORT',
                reference_type: 'migration',
                reference_id: null,
                note: 'Initial inventory migration',
                date: new Date()
              }
            });
          }
          
          results.success++;
          
        } catch (error) {
          results.failed++;
          results.errors.push({
            product_id: product.id,
            product_name: product.name,
            error: error.message
          });
          console.error(   Failed to migrate product : );
        }
      }
    }, {
      timeout: 60000 // 60 seconds per batch
    });
  }
  
  console.log('\n Migration Results:');
  console.log(   Success: );
  console.log(   Failed: );
  console.log(   Skipped: );
  
  if (results.errors.length > 0) {
    fs.writeFileSync(
      'migration-errors.json',
      JSON.stringify(results.errors, null, 2)
    );
    console.log('\n  Errors logged to: migration-errors.json');
  }
  
  return results;
}

// Helper function
function generateBatchNumber(productId, branchId) {
  const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  return BATCH--P-B-;
}
`

#### **STEP 3: Validation**

`javascript
async function step3_validation() {
  console.log('\n Step 3: Validation...');
  
  // 3.1 Check data integrity
  const stats = await prisma.([
    prisma.products.count(),
    prisma.branchinventory.count(),
    prisma.productBatch.count(),
    prisma.inventoryLog.count()
  ]);
  
  console.log('Database Statistics:');
  console.log(  Products: );
  console.log(  Branch Inventories: );
  console.log(  Product Batches: );
  console.log(  Inventory Logs: );
  
  // 3.2 Check for orphan records
  const orphanBatches = await prisma.productBatch.findMany({
    where: {
      products: null
    }
  });
  
  if (orphanBatches.length > 0) {
    console.error(   Found  orphan batches!);
  } else {
    console.log('   No orphan records');
  }
  
  // 3.3 Check stock consistency
  const inconsistent = await prisma.
    SELECT 
      bi.id,
      bi.product_id,
      bi.stock as inventory_stock,
      COALESCE(SUM(pb.quantity), 0) as batch_total
    FROM branchinventory bi
    LEFT JOIN productBatch pb ON pb.branch_id = bi.branch_id 
                              AND pb.product_id = bi.product_id
                              AND pb.status = 'active'
    GROUP BY bi.id, bi.product_id, bi.stock
    HAVING bi.stock != COALESCE(SUM(pb.quantity), 0)
  ;
  
  if (inconsistent.length > 0) {
    console.error(   Found  inconsistent stock records!);
    fs.writeFileSync(
      'migration-inconsistent-stock.json',
      JSON.stringify(inconsistent, null, 2)
    );
  } else {
    console.log('   Stock data is consistent');
  }
  
  return {
    stats,
    orphanBatches,
    inconsistent
  };
}
`

#### **STEP 4: Update APIs**

`javascript
// src/modules/product-management/products/productService.js

//  OLD - Get product (wrong way)
export const getProductById_OLD = async (id) => {
  const product = await prisma.products.findUnique({
    where: { id: Number(id) }
  });
  
  return product; // Missing stock info!
};

//  NEW - Get product with inventory
export const getProductById = async (id, branchId = null) => {
  const product = await prisma.products.findUnique({
    where: { id: Number(id) },
    include: {
      categories: true,
      suppliers: true,
      productunits: true
    }
  });
  
  if (!product) {
    return null;
  }
  
  // Get inventory data
  let inventoryData;
  
  if (branchId) {
    // Get stock for specific branch
    inventoryData = await prisma.branchinventory.findUnique({
      where: {
        branch_id_product_id: {
          branch_id: Number(branchId),
          product_id: Number(id)
        }
      },
      include: {
        branches: {
          select: {
            id: true,
            name: true,
            city_id: true
          }
        },
        productBatch: {
          where: {
            status: 'active',
            expiry_date: {
              gte: new Date()
            }
          }
        }
      }
    });
  } else {
    // Get total stock across all branches
    const allInventories = await prisma.branchinventory.findMany({
      where: {
        product_id: Number(id)
      },
      include: {
        branches: {
          select: {
            id: true,
            name: true,
            city_id: true
          }
        }
      }
    });
    
    const totalStock = allInventories.reduce((sum, inv) => sum + (inv.stock || 0), 0);
    
    inventoryData = {
      total_stock: totalStock,
      branch_count: allInventories.length,
      branches: allInventories.map(inv => ({
        branch_id: inv.branch_id,
        branch_name: inv.branches.name,
        stock: inv.stock,
        in_stock: inv.stock > 0
      }))
    };
  }
  
  return {
    ...product,
    inventory: inventoryData
  };
};
`

#### **STEP 5: Update Order Processing**

`javascript
// src/modules/order-management/orders/orderService.js

export const createOrder = async (orderData) => {
  return await prisma.(async (tx) => {
    // ... existing order creation code ...
    
    // Update: Deduct from inventory
    for (const item of orderData.items) {
      //  NEW: Use branch inventory
      const inventory = await tx.branchinventory.findUnique({
        where: {
          branch_id_product_id: {
            branch_id: orderData.branch_id || 1, // Default branch
            product_id: item.product_id
          }
        }
      });
      
      if (!inventory || inventory.stock < item.quantity) {
        throw new Error(Insufficient stock for product );
      }
      
      // Deduct stock
      await tx.branchinventory.update({
        where: {
          id: inventory.id
        },
        data: {
          stock: {
            decrement: item.quantity
          },
          last_updated: new Date()
        }
      });
      
      // Log inventory movement
      await tx.inventoryLog.create({
        data: {
          branch_id: inventory.branch_id,
          product_id: item.product_id,
          quantity: -item.quantity, // Negative = export
          type: 'EXPORT',
          reference_type: 'order',
          reference_id: order.id,
          note: Order #,
          date: new Date()
        }
      });
    }
    
    return order;
  });
};
`

### 6.3. Post-Migration Tasks

- [ ] **Update Documentation**
  - API docs
  - Database schema docs
  - User manuals

- [ ] **Train Staff**
  - How to use new inventory system
  - How to check stock
  - How to reorder

- [ ] **Monitor System**
  `javascript
  // Create monitoring dashboard
  const dailyStats = await prisma.
    SELECT 
      DATE(date) as date,
      type,
      COUNT(*) as count,
      SUM(quantity) as total_quantity
    FROM inventoryLog
    WHERE date >= NOW() - INTERVAL '7 days'
    GROUP BY DATE(date), type
    ORDER BY date DESC
  ;
  `

- [ ] **Clean up old data** (if any)

---

## 7. ROLLBACK STRATEGY

### 7.1. Rollback Plan

`javascript
async function rollback() {
  console.log(' Starting rollback...');
  
  // Step 1: Delete inventory logs
  const deletedLogs = await prisma.inventoryLog.deleteMany({
    where: {
      reference_type: 'migration'
    }
  });
  console.log( Deleted  inventory logs);
  
  // Step 2: Delete product batches
  const deletedBatches = await prisma.productBatch.deleteMany({
    where: {
      note: 'Initial migration batch'
    }
  });
  console.log( Deleted  product batches);
  
  // Step 3: Delete branch inventories
  const deletedInventories = await prisma.branchinventory.deleteMany({
    where: {
      branches: {
        name: CONFIG.DEFAULT_BRANCH_NAME
      }
    }
  });
  console.log( Deleted  branch inventories);
  
  // Step 4: (Optional) Delete default branch
  // Only if created during migration
  const deletedBranch = await prisma.branches.deleteMany({
    where: {
      name: CONFIG.DEFAULT_BRANCH_NAME,
      phone: "0000000000" // Migration marker
    }
  });
  console.log( Deleted  branches);
  
  console.log(' Rollback completed');
}
`

### 7.2. Restore from Backup

`ash
# If rollback fails, restore from backup
psql -h host -U user -d database < backup_YYYYMMDD_HHMMSS.sql
`

---

## 8. TESTING PLAN

### 8.1. Test Cases

`javascript
// tests/migration.test.js

describe('Product Inventory Migration', () => {
  
  test('Should create branch inventory for each product', async () => {
    const products = await prisma.products.findMany();
    
    for (const product of products) {
      const inventory = await prisma.branchinventory.findFirst({
        where: {
          product_id: product.id
        }
      });
      
      expect(inventory).toBeDefined();
      expect(inventory.stock).toBeGreaterThanOrEqual(0);
    }
  });
  
  test('Should create at least one batch per product', async () => {
    const products = await prisma.products.findMany();
    
    for (const product of products) {
      const batches = await prisma.productBatch.findMany({
        where: {
          product_id: product.id
        }
      });
      
      expect(batches.length).toBeGreaterThan(0);
    }
  });
  
  test('Should maintain stock consistency', async () => {
    const inventories = await prisma.branchinventory.findMany({
      include: {
        productBatch: {
          where: { status: 'active' }
        }
      }
    });
    
    for (const inv of inventories) {
      const batchTotal = inv.productBatch.reduce(
        (sum, b) => sum + b.quantity, 
        0
      );
      
      expect(inv.stock).toBe(batchTotal);
    }
  });
  
  test('Should log all migrations', async () => {
    const logs = await prisma.inventoryLog.findMany({
      where: {
        reference_type: 'migration'
      }
    });
    
    expect(logs.length).toBeGreaterThan(0);
  });
  
  test('API: Get product with inventory should work', async () => {
    const product = await getProductById(1);
    
    expect(product).toHaveProperty('inventory');
    expect(product.inventory).toHaveProperty('total_stock');
  });
  
  test('API: Create order should deduct inventory', async () => {
    const initialStock = await prisma.branchinventory.findUnique({
      where: {
        branch_id_product_id: {
          branch_id: 1,
          product_id: 1
        }
      }
    });
    
    await createOrder({
      customer_id: 1,
      branch_id: 1,
      items: [{
        product_id: 1,
        quantity: 5
      }]
    });
    
    const finalStock = await prisma.branchinventory.findUnique({
      where: {
        branch_id_product_id: {
          branch_id: 1,
          product_id: 1
        }
      }
    });
    
    expect(finalStock.stock).toBe(initialStock.stock - 5);
  });
});
`

### 8.2. Load Testing

`javascript
// tests/load.test.js

import { check } from 'k6';
import http from 'k6/http';

export let options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 0 },   // Ramp down
  ],
};

export default function () {
  // Test get product with inventory
  let res = http.get('http://localhost:3000/api/products/1');
  check(res, {
    'status is 200': (r) => r.status === 200,
    'has inventory data': (r) => JSON.parse(r.body).inventory !== undefined,
  });
}
`

---

## 9. MONITORING & VALIDATION

### 9.1. Real-time Monitoring

`javascript
// Dashboard queries
const inventoryDashboard = {
  // Total products
  totalProducts: await prisma.products.count(),
  
  // Total stock value
  totalStockValue: await prisma.
    SELECT SUM(bi.stock * p.price) as total_value
    FROM branchinventory bi
    JOIN products p ON p.id = bi.product_id
  ,
  
  // Low stock alerts
  lowStockProducts: await prisma.branchinventory.count({
    where: {
      AND: [
        { min_stock: { not: null } },
        { stock: { lte: prisma.branchinventory.fields.min_stock } }
      ]
    }
  }),
  
  // Out of stock
  outOfStock: await prisma.branchinventory.count({
    where: { stock: 0 }
  }),
  
  // Expiring soon (30 days)
  expiringSoon: await prisma.productBatch.count({
    where: {
      status: 'active',
      expiry_date: {
        gte: new Date(),
        lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    }
  })
};
`

### 9.2. Daily Health Check

`javascript
// scripts/health-check.js

async function dailyHealthCheck() {
  const issues = [];
  
  // Check 1: Negative stock
  const negativeStock = await prisma.branchinventory.findMany({
    where: { stock: { lt: 0 } }
  });
  if (negativeStock.length > 0) {
    issues.push(Found  records with negative stock);
  }
  
  // Check 2: Orphan batches
  const orphanBatches = await prisma.productBatch.count({
    where: {
      OR: [
        { products: null },
        { branchinventory: null }
      ]
    }
  });
  if (orphanBatches > 0) {
    issues.push(Found  orphan batches);
  }
  
  // Check 3: Stock inconsistency
  const inconsistent = await prisma.
    SELECT COUNT(*) as count
    FROM branchinventory bi
    WHERE bi.stock != (
      SELECT COALESCE(SUM(pb.quantity), 0)
      FROM productBatch pb
      WHERE pb.branch_id = bi.branch_id
        AND pb.product_id = bi.product_id
        AND pb.status = 'active'
    )
  ;
  if (inconsistent[0].count > 0) {
    issues.push(Found  inconsistent stock records);
  }
  
  if (issues.length > 0) {
    // Send alert email
    sendAlertEmail({
      subject: 'Inventory Health Check Failed',
      body: issues.join('\n')
    });
  }
  
  return issues;
}
`

---

## 10. CHECKLIST TỔNG HỢP

###  Before Migration

- [ ] Full database backup
- [ ] Test migration on staging
- [ ] Notify all stakeholders
- [ ] Schedule maintenance window
- [ ] Prepare rollback plan
- [ ] Review all scripts
- [ ] Check server resources (CPU, RAM, Disk)

###  During Migration

- [ ] Enable maintenance mode
- [ ] Run migration script
- [ ] Monitor logs in real-time
- [ ] Check error logs
- [ ] Validate data at each step

###  After Migration

- [ ] Run validation queries
- [ ] Test all APIs
- [ ] Check dashboard
- [ ] Disable maintenance mode
- [ ] Monitor system for 24 hours
- [ ] Update documentation
- [ ] Train staff
- [ ] Archive migration logs

---

## 11. TIMELINE ƯỚC TÍNH

| Phase | Tasks | Duration | Dependencies |
|-------|-------|----------|--------------|
| **Preparation** | Backup, validate, create scripts | 2 days | None |
| **Testing** | Dry run on staging | 1 day | Preparation |
| **Execution** | Run migration on production | 4 hours | Testing |
| **Validation** | Check data, test APIs | 2 hours | Execution |
| **Monitoring** | Monitor for issues | 1 week | Validation |
| **Documentation** | Update docs, train staff | 2 days | Monitoring |

**Total estimated time: ~5 days**

---

## 12. CONTACT & SUPPORT

**Migration Team:**
- Database Admin: [Name]
- Backend Lead: [Name]
- QA Lead: [Name]

**Emergency Contact:**
- Phone: [Number]
- Email: [Email]

**Rollback Authority:** Only DBA and Backend Lead can authorize rollback.

---

##  NOTES

1. **Không chạy migration vào giờ cao điểm**
   - Thời gian tốt nhất: 2:00 AM - 5:00 AM

2. **Backup database trước khi chạy**
   - Giữ backup ít nhất 30 ngày

3. **Test kỹ trên staging trước**
   - Đảm bảo 100% success rate

4. **Monitor system sau migration**
   - Kiểm tra logs, performance, errors

5. **Chuẩn bị rollback plan**
   - Phải có khả năng rollback trong 30 phút

---

**Document Version:** 1.0  
**Last Updated:** 2025-11-26  
**Status:** READY FOR REVIEW  

---

## APPENDIX A: SQL Queries hữu ích

`sql
-- Check total products
SELECT COUNT(*) FROM products;

-- Check inventory coverage
SELECT 
  COUNT(DISTINCT p.id) as total_products,
  COUNT(DISTINCT bi.product_id) as products_in_inventory,
  (COUNT(DISTINCT bi.product_id) * 100.0 / COUNT(DISTINCT p.id)) as coverage_percent
FROM products p
LEFT JOIN branchinventory bi ON bi.product_id = p.id;

-- Check stock value by branch
SELECT 
  b.name as branch_name,
  COUNT(DISTINCT bi.product_id) as product_count,
  SUM(bi.stock) as total_units,
  SUM(bi.stock * p.price) as total_value
FROM branchinventory bi
JOIN branches b ON b.id = bi.branch_id
JOIN products p ON p.id = bi.product_id
GROUP BY b.id, b.name;

-- Find products without inventory
SELECT p.id, p.name
FROM products p
LEFT JOIN branchinventory bi ON bi.product_id = p.id
WHERE bi.id IS NULL;

-- Check batch expiry status
SELECT 
  status,
  COUNT(*) as count,
  SUM(quantity) as total_quantity
FROM productBatch
GROUP BY status;
`

---

**END OF DOCUMENT**
