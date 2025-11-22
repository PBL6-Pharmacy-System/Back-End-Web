# JUNCTION TABLES IMPLEMENTATION - SUMMARY

**Date:** 2025-11-22  
**Status:** ✅ Partially Completed  
**Purpose:** Replace polymorphic associations with proper Foreign Key constraints

---

## 🎯 MỤC TIÊU

Thay thế pattern polymorphic association (sử dụng `reference_type` + `reference_id` string) bằng junction tables với Foreign Key constraints thật sự từ database.

### Vấn đề cũ
- `reference_id` không có Foreign Key constraint
- Có thể tham chiếu đến records không tồn tại (orphaned records)
- Phụ thuộc hoàn toàn vào application-level validation
- Không có cascade delete tự động

### Giải pháp mới
- Tạo 4 junction tables: `inventoryLog_Order`, `inventoryLog_Transfer`, `inventoryLog_SupplierOrder`, `inventoryLog_StockTake`
- Mỗi junction table có Foreign Key constraints đến cả 2 bên
- Cascade delete tự động khi xóa giao dịch gốc
- Database đảm bảo tính toàn vẹn dữ liệu

---

## 📋 JUNCTION TABLES ĐÃ TẠO

### 1. inventoryLog_Order
Liên kết inventory logs với orders (đơn hàng khách)

```prisma
model inventoryLog_Order {
  id               Int          @id @default(autoincrement())
  inventory_log_id Int          @unique
  order_id         Int
  
  inventoryLog     inventoryLog @relation(fields: [inventory_log_id], references: [id], onDelete: Cascade)
  orders           orders       @relation(fields: [order_id], references: [id], onDelete: Cascade)

  @@index([order_id])
  @@index([inventory_log_id])
}
```

**Use cases:**
- Xuất kho khi khách đặt hàng (`type: 'OUT'`, `reference_type: 'order'`)
- Hoàn kho khi hủy đơn (`type: 'IN'`, `reference_type: 'order_cancel'`)
- Hoàn hàng (`type: 'IN'`, `reference_type: 'return'`)

### 2. inventoryLog_Transfer
Liên kết inventory logs với inventory transfers (chuyển kho giữa chi nhánh)

```prisma
model inventoryLog_Transfer {
  id                Int               @id @default(autoincrement())
  inventory_log_id  Int               @unique
  transfer_id       Int
  
  inventoryLog      inventoryLog      @relation(fields: [inventory_log_id], references: [id], onDelete: Cascade)
  inventoryTransfer inventoryTransfer @relation(fields: [transfer_id], references: [id], onDelete: Cascade)

  @@index([transfer_id])
  @@index([inventory_log_id])
}
```

**Use cases:**
- Xuất kho từ chi nhánh nguồn (`type: 'TRANSFER_OUT'`, `reference_type: 'transfer'`)
- Nhập kho vào chi nhánh đích (`type: 'TRANSFER_IN'`, `reference_type: 'transfer'`)

### 3. inventoryLog_SupplierOrder
Liên kết inventory logs với supplier orders (đơn nhập hàng từ nhà cung cấp)

```prisma
model inventoryLog_SupplierOrder {
  id               Int           @id @default(autoincrement())
  inventory_log_id Int           @unique
  supplier_order_id Int
  
  inventoryLog     inventoryLog  @relation(fields: [inventory_log_id], references: [id], onDelete: Cascade)
  supplierOrder    supplierOrder @relation(fields: [supplier_order_id], references: [id], onDelete: Cascade)

  @@index([supplier_order_id])
  @@index([inventory_log_id])
}
```

**Use cases:**
- Nhập hàng từ nhà cung cấp (`type: 'IN'`, `reference_type: 'supplier_order'`)

### 4. inventoryLog_StockTake
Liên kết inventory logs với stock takes (kiểm kê kho)

```prisma
model inventoryLog_StockTake {
  id               Int          @id @default(autoincrement())
  inventory_log_id Int          @unique
  stock_take_id    Int
  
  inventoryLog     inventoryLog @relation(fields: [inventory_log_id], references: [id], onDelete: Cascade)
  stockTake        stockTake    @relation(fields: [stock_take_id], references: [id], onDelete: Cascade)

  @@index([stock_take_id])
  @@index([inventory_log_id])
}
```

**Use cases:**
- Điều chỉnh tồn kho sau kiểm kê (`type: 'ADJUST'`, `reference_type: 'stocktake'`)

---

## ✅ ĐÃ CẬP NHẬT

### Database & Schema
- ✅ Thêm 4 junction tables vào `prisma/schema.prisma`
- ✅ Thêm relations từ `inventoryLog` đến junction tables
- ✅ Database migration đã chạy (tables đã tồn tại trong DB)

### Business Logic - Inventory Transfer
**File:** `src/modules/inventory-management/inventory-transfer/inventoryTransferService.js`

**Function `shipTransfer`:**
```javascript
// OLD
await tx.inventoryLog.create({
  data: { ..., reference_type: 'transfer', reference_id: transfer.id }
});

// NEW
const inventoryLogOut = await tx.inventoryLog.create({
  data: { ..., reference_type: 'transfer', reference_id: transfer.id }
});

await tx.inventoryLog_Transfer.create({
  data: {
    inventory_log_id: inventoryLogOut.id,
    transfer_id: transfer.id
  }
});
```

**Function `receiveTransfer`:**
```javascript
// Similar pattern - tạo cả inventoryLog và junction entry
```

### Business Logic - Order/Checkout
**File:** `src/modules/order-management/cart/checkoutService.js`

**Function `checkout`:**
```javascript
// Khi xuất kho cho đơn hàng
const inventoryLog = await tx.inventoryLog.create({
  data: {
    type: 'OUT',
    reference_type: 'order',
    reference_id: cart.id,
    quantity: -baseQuantityNeeded,
    ...
  }
});

await tx.inventoryLog_Order.create({
  data: {
    inventory_log_id: inventoryLog.id,
    order_id: cart.id
  }
});
```

**Function `cancelOrder`:**
```javascript
// Khi hoàn kho do hủy đơn
const returnLog = await tx.inventoryLog.create({
  data: {
    type: 'IN',
    reference_type: 'order_cancel',
    reference_id: orderId,
    quantity: baseQuantityToRestore,
    ...
  }
});

await tx.inventoryLog_Order.create({
  data: {
    inventory_log_id: returnLog.id,
    order_id: orderId
  }
});
```

### Documentation
- ✅ `INVENTORY_REFERENCE_ID_DOCUMENTATION.md` - Updated toàn bộ với junction tables
- ✅ `JUNCTION_TABLES_IMPLEMENTATION.md` - Tài liệu tóm tắt này

---

## ⏳ CẦN CẬP NHẬT

### Business Logic chưa update
- [ ] **Supplier Order Service** - Cần thêm logic tạo `inventoryLog_SupplierOrder` entries
- [ ] **Stock Take Service** - Cần thêm logic tạo `inventoryLog_StockTake` entries
- [ ] **Các services khác** - Kiểm tra xem còn chỗ nào tạo inventoryLog không

### Data Migration
- [ ] **Migration script** - Tạo script để migrate old data (có `reference_id` nhưng không có junction entry)
- [ ] **Run migration** - Chạy script để tạo junction entries cho existing logs

### Queries
- [ ] **Update all queries** - Thay thế queries sử dụng `reference_type`/`reference_id` bằng junction table joins
- [ ] **Statistics queries** - Update các query thống kê để dùng junction tables

### Testing
- [ ] **Unit tests** - Test FK constraints, cascade deletes
- [ ] **Integration tests** - Test toàn bộ flow từ order → inventory log → junction entry
- [ ] **Performance tests** - Đo đạc performance với junction tables

---

## 📖 HƯỚNG DẪN SỬ DỤNG

### Tạo Inventory Log mới (với Junction Table)

**Pattern chung:**
```javascript
await prisma.$transaction(async (tx) => {
  // 1. Tạo inventory log
  const log = await tx.inventoryLog.create({
    data: {
      branch_id: branchId,
      product_id: productId,
      quantity: quantity,
      type: 'OUT' | 'IN' | 'TRANSFER_OUT' | 'TRANSFER_IN' | 'ADJUST',
      reference_type: 'order' | 'transfer' | 'supplier_order' | 'stocktake',
      reference_id: transactionId, // Giữ lại cho backward compat
      note: 'Mô tả',
      created_by: userId
    }
  });

  // 2. Tạo junction entry tương ứng
  switch (reference_type) {
    case 'order':
    case 'order_cancel':
      await tx.inventoryLog_Order.create({
        data: {
          inventory_log_id: log.id,
          order_id: transactionId
        }
      });
      break;

    case 'transfer':
      await tx.inventoryLog_Transfer.create({
        data: {
          inventory_log_id: log.id,
          transfer_id: transactionId
        }
      });
      break;

    case 'supplier_order':
      await tx.inventoryLog_SupplierOrder.create({
        data: {
          inventory_log_id: log.id,
          supplier_order_id: transactionId
        }
      });
      break;

    case 'stocktake':
      await tx.inventoryLog_StockTake.create({
        data: {
          inventory_log_id: log.id,
          stock_take_id: transactionId
        }
      });
      break;
  }
});
```

### Query Inventory Logs với Junction Tables

**Lấy logs của một order:**
```javascript
const logs = await prisma.inventoryLog.findMany({
  where: {
    inventoryLog_Order: {
      order_id: 123
    }
  },
  include: {
    inventoryLog_Order: {
      include: {
        orders: {
          include: { customers: true }
        }
      }
    },
    products: true,
    branches: true
  }
});
```

**Lấy logs của một transfer:**
```javascript
const logs = await prisma.inventoryLog.findMany({
  where: {
    inventoryLog_Transfer: {
      transfer_id: 456
    }
  },
  include: {
    inventoryLog_Transfer: {
      include: {
        inventoryTransfer: {
          include: {
            fromBranch: true,
            toBranch: true
          }
        }
      }
    }
  }
});
```

**Lấy tất cả logs với full transaction info:**
```javascript
const log = await prisma.inventoryLog.findUnique({
  where: { id: logId },
  include: {
    inventoryLog_Order: {
      include: { orders: { include: { customers: true } } }
    },
    inventoryLog_Transfer: {
      include: { inventoryTransfer: true }
    },
    inventoryLog_SupplierOrder: {
      include: { supplierOrder: { include: { suppliers: true } } }
    },
    inventoryLog_StockTake: {
      include: { stockTake: true }
    },
    products: true,
    branches: true,
    users: true
  }
});

// Xác định loại transaction
if (log.inventoryLog_Order) {
  console.log('Order transaction:', log.inventoryLog_Order.orders);
} else if (log.inventoryLog_Transfer) {
  console.log('Transfer transaction:', log.inventoryLog_Transfer.inventoryTransfer);
}
```

---

## 🔧 MIGRATION SCRIPT

Script để migrate old data sang junction tables:

```javascript
// scripts/migrate-inventory-logs.js
import prisma from '../src/config/db.js';

async function migrateInventoryLogs() {
  console.log('Starting migration...');

  // Find all logs without junction entries
  const logsToMigrate = await prisma.inventoryLog.findMany({
    where: {
      reference_id: { not: null },
      reference_type: { not: null },
      inventoryLog_Order: null,
      inventoryLog_Transfer: null,
      inventoryLog_SupplierOrder: null,
      inventoryLog_StockTake: null
    }
  });

  console.log(`Found ${logsToMigrate.length} logs to migrate`);

  let success = 0;
  let failed = 0;

  for (const log of logsToMigrate) {
    try {
      switch (log.reference_type) {
        case 'order':
        case 'order_cancel':
        case 'return':
          // Verify order exists
          const order = await prisma.orders.findUnique({
            where: { id: log.reference_id }
          });
          if (order) {
            await prisma.inventoryLog_Order.create({
              data: {
                inventory_log_id: log.id,
                order_id: log.reference_id
              }
            });
            success++;
          } else {
            console.warn(`Order ${log.reference_id} not found for log ${log.id}`);
            failed++;
          }
          break;

        case 'transfer':
          const transfer = await prisma.inventoryTransfer.findUnique({
            where: { id: log.reference_id }
          });
          if (transfer) {
            await prisma.inventoryLog_Transfer.create({
              data: {
                inventory_log_id: log.id,
                transfer_id: log.reference_id
              }
            });
            success++;
          } else {
            console.warn(`Transfer ${log.reference_id} not found for log ${log.id}`);
            failed++;
          }
          break;

        case 'supplier_order':
          const supplierOrder = await prisma.supplierOrder.findUnique({
            where: { id: log.reference_id }
          });
          if (supplierOrder) {
            await prisma.inventoryLog_SupplierOrder.create({
              data: {
                inventory_log_id: log.id,
                supplier_order_id: log.reference_id
              }
            });
            success++;
          } else {
            console.warn(`Supplier order ${log.reference_id} not found for log ${log.id}`);
            failed++;
          }
          break;

        case 'stocktake':
          const stockTake = await prisma.stockTake.findUnique({
            where: { id: log.reference_id }
          });
          if (stockTake) {
            await prisma.inventoryLog_StockTake.create({
              data: {
                inventory_log_id: log.id,
                stock_take_id: log.reference_id
              }
            });
            success++;
          } else {
            console.warn(`Stock take ${log.reference_id} not found for log ${log.id}`);
            failed++;
          }
          break;

        default:
          console.warn(`Unknown reference_type: ${log.reference_type} for log ${log.id}`);
          failed++;
      }
    } catch (error) {
      console.error(`Error migrating log ${log.id}:`, error.message);
      failed++;
    }
  }

  console.log(`\nMigration completed:`);
  console.log(`- Success: ${success}`);
  console.log(`- Failed: ${failed}`);
  console.log(`- Total: ${logsToMigrate.length}`);
}

migrateInventoryLogs()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
```

**Chạy migration:**
```bash
node scripts/migrate-inventory-logs.js
```

---

## ⚠️ LƯU Ý QUAN TRỌNG

### Backward Compatibility
- `reference_id` và `reference_type` vẫn được giữ lại trong `inventoryLog`
- Old queries vẫn hoạt động bình thường
- Junction tables là bổ sung, không thay thế hoàn toàn

### Cascade Deletes
- Khi xóa `order`, `inventoryLog_Order` entries tự động xóa (CASCADE)
- `inventoryLog` chính vẫn GIỮ LẠI để audit trail
- Nếu muốn xóa luôn `inventoryLog`, thay đổi cascade setting trong schema

### Performance
- Junction tables thêm overhead nhỏ khi query (thêm 1 join)
- Nhưng đổi lại được data integrity và type safety
- Index đã được thêm vào các foreign key columns

### Testing
- Test cascade deletes thật kỹ trước khi deploy production
- Verify FK constraints hoạt động đúng
- Test performance với data lớn

---

## 📞 HỖ TRỢ

- **Documentation:** `INVENTORY_REFERENCE_ID_DOCUMENTATION.md`
- **Related Docs:** `INVENTORY_STOCK_MANAGEMENT_DOCUMENTATION.md`
- **Schema:** `prisma/schema.prisma`

---

**Created:** 2025-11-22  
**Author:** Backend Development Team  
**Status:** Implementation in Progress
