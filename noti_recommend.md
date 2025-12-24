NOTIFICATION SYSTEM IMPLEMENTATION PLAN
========================================

PROJECT: PBL6 Pharmacy System - Back-End-Web
CURRENT SYSTEM ANALYSIS (As of Dec 2024)
========================================

## CRITICAL FINDINGS FROM CODEBASE REVIEW

### ✅ EXISTING INFRASTRUCTURE FOUND:
1. **FEFO Algorithm Already Implemented**: 
   - Location: `src/modules/inventory-management/product-batch/productBatchService.js`
   - Functions: `allocateBatchesFEFO()`, `exportStockFEFO()`
   - Used in checkout process to select oldest expiring batches first
   
2. **Checkout Service Uses FEFO**:
   - Location: `src/modules/order-management/cart/checkoutService.js`
   - Line ~520: Calls `allocateBatchesFEFO()` during order creation
   - **This is where we need to add staff notifications**

3. **No Socket.IO Installed**: Need to install `socket.io@4.8.1`

4. **Staff Table Structure**:
   - Has `user_id`, `branch_id`, `position`, `is_active` fields
   - Position values may vary (warehouse_staff, pharmacist, manager, etc.)
   - **Use flexible position matching in queries**

5. **Admin Table Structure**:
   - Has `user_id` field only (NO `is_active` field)
   - Simple structure for admin access

6. **Customer-User Relationship**:
   - Customers have `user_id` field linking to users table
   - **Access via**: `customers.user_id` NOT `customer.users.id`

### ⚠️ CRITICAL CHANGES NEEDED:
1. Database schema needs enhanced fields (title, icon, action_url, metadata, priority, category)
2. Notification triggers must be added AFTER FEFO allocation in checkoutService
3. Staff position field requires flexible matching (multiple role names)
4. Socket.IO must be installed and configured

========================================

## EXISTING INFRASTRUCTURE

### Technology Stack:
- **Framework**: Express 5.1.0 (ES6 modules enabled)
- **Database**: PostgreSQL with Prisma ORM 6.16.2
- **Authentication**: JWT (jsonwebtoken 9.0.2)
- **Job Scheduler**: node-cron 4.2.1 (already installed)
- **Redis**: ioredis 5.8.2 (available for caching/pub-sub)

### Current Notification Module Status:
**Location**: `src/modules/notification-management/notifications/`

**Existing Files**:
- ✅ `notificationService.js` - Basic CRUD operations
- ✅ `notificationController.js` - REST API endpoints
- ✅ `notificationRoutes.js` - Routing configuration

**Current Features**:
- ✅ Basic CRUD (getAllNotifications, getNotificationById, createNotification, updateNotification, deleteNotification)
- ✅ Read/unread status tracking (markNotificationsAsRead)
- ✅ Unread count (getUnreadNotificationCount)
- ✅ User filtering and pagination
- ✅ Validation logic (NOTIFICATION_TYPES: info, warning, success, error, system)

**Database Schema** (prisma/schema.prisma):
```prisma
model notifications {
  id          Int        @id @default(autoincrement())
  user_id     Int?       // Links to users table (staff, admin, customer via users relation)
  customer_id Int?       // DEPRECATED - use user_id instead
  message     String
  type        String?    @db.VarChar(50)
  is_read     Boolean?   @default(false)
  created_at  DateTime?  @default(now()) @db.Timestamp(6)
  customers   customers? @relation(fields: [customer_id], references: [id], onDelete: NoAction, onUpdate: NoAction)
  users       users?     @relation(fields: [user_id], references: [id], onDelete: NoAction, onUpdate: NoAction)
}
```

**Note**: Current schema uses `user_id` for all users (customers, staff, admins). 
- For customers: Get user_id via `customers.user_id`
- For staff: Get user_id via `staff.user_id`  
- For admins: Get user_id via `admin.user_id`

**Critical Gaps**:
- ❌ NO real-time delivery (Socket.IO not installed or configured)
- ❌ NO automated triggers for business events (orders, payments, inventory, FEFO)
- ❌ NO notification templates
- ❌ NO staff/admin notifications for order management
- ❌ NO branch-specific notifications for staff
- ❌ NO deep linking (action_url field missing)
- ❌ NO notification metadata (orderId, productId, branchId, etc.)
- ❌ NO priority/category system
- ❌ NO role-based notification routing

### Key Integration Points Identified:
1. **Checkout Service** (CRITICAL - FEFO INTEGRATION): `src/modules/order-management/cart/checkoutService.js`
   - Function: `checkout(data)` at line 318
   - **Already uses FEFO**: Calls `allocateBatchesFEFO()` to allocate inventory batches
   - This is where staff should be notified about batch selections
   
2. **Order Service**: `src/modules/order-management/orders/orderService.js`
   - Function: `updateOrderStatus(orderId, status, userId)` at line 408
   - Handles order status transitions (pending → confirmed → processing → shipping → delivered)
   
3. **Product Batch Service** (FEFO ALGORITHM): `src/modules/inventory-management/product-batch/productBatchService.js`
   - Functions: `getAvailableBatchesFEFO()`, `allocateBatchesFEFO()`, `exportStockFEFO()`
   - FEFO algorithm sorts batches by expiry_date (ASC), then created_at (ASC)
   - Returns allocation plan with batch details
   
4. **Prescription Service**: `src/modules/medical/prescriptions/prescriptionService.js`
   - Functions: `uploadPrescription()` (line 17), `verifyPrescription()` (line 370)
   - Upload triggers notification to pharmacists
   - Verification triggers notification to customer
 
5. **Payment Gateways**: 
   - VNPay: `src/modules/order-management/payments/gateways/vnpay/`
   - MoMo: `src/modules/order-management/payments/gateways/momo/`
   - PayOS: `src/modules/order-management/payments/gateways/payos/`
   - PayPal: `src/modules/order-management/payments/gateways/paypal/`

6. **Shipments Table**: Available in schema for tracking delivery
   - Fields: tracking_number, carrier, shipped_date, estimated_delivery, status, branch_id

5. **Main Entry Point**: `index.js`
   - Already imports and runs cron jobs (flashsaleJob, cartCleanupJob, paymentExpirationJob, reservationCleanupJob)

========================================
DETAILED IMPLEMENTATION PLAN
========================================

## PHASE 1: REAL-TIME NOTIFICATIONS (Week 1, Days 1-2) - CRITICAL

**Objective**: Enable instant notification delivery to connected users without page refresh

### Step 1.1: Install Socket.IO Dependencies
```bash
cd C:\Users\admina\PBL6\Back-End-Web
npm install socket.io@4.8.1
npm install socket.io-client@4.8.1  # For testing
```

### Step 1.2: Create Socket Configuration
**File**: `src/config/socket.js` (NEW FILE)
```javascript
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

let io;

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || '*',
      methods: ['GET', 'POST'],
      credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
      if (!token) {
        return next(new Error('Authentication error'));
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId || decoded.id;
      socket.userRole = decoded.role;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`✅ User ${socket.userId} connected (Socket ID: ${socket.id})`);
    
    // Join user-specific room
    socket.join(`user_${socket.userId}`);
    
    // Handle notification read acknowledgment
    socket.on('notification:read', async (notificationIds) => {
      // Will integrate with notificationService.markNotificationsAsRead
      console.log(`User ${socket.userId} read notifications:`, notificationIds);
    });

    socket.on('disconnect', () => {
      console.log(`❌ User ${socket.userId} disconnected`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};

export const emitToUser = (userId, event, data) => {
  if (io) {
    io.to(`user_${userId}`).emit(event, data);
  }
};
```

### Step 1.3: Update Main Entry Point (index.js)
**File**: `index.js`
**Changes**:
```javascript
import app from './src/app.js';
import prisma from './src/config/db.js';
import { createServer } from 'http';
import { initSocket } from './src/config/socket.js';  // ADD THIS

// ... existing imports

const PORT = process.env.PORT || 3000;

const httpServer = createServer(app);  // CHANGE THIS
const io = initSocket(httpServer);     // ADD THIS

httpServer.listen(PORT, async () => {  // CHANGE app.listen to httpServer.listen
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔌 WebSocket server initialized`);  // ADD THIS

  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Database connected');
  } catch (e) {
    console.error('❌ Database error:', e);
  }

  startPaymentExpirationJob();
  startReservationCleanupJob();
  startCartCleanupJob();
});
```

### Step 1.4: Create WebSocket Notification Service
**File**: `src/modules/notification-management/notifications/notificationSocketService.js` (NEW FILE)
```javascript
import { emitToUser } from '../../../config/socket.js';

export const emitNewNotification = (userId, notification) => {
  emitToUser(userId, 'notification:new', {
    id: notification.id,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    icon: notification.icon,
    action_url: notification.action_url,
    created_at: notification.created_at
  });
};

export const emitUnreadCount = (userId, unreadCount) => {
  emitToUser(userId, 'notification:count', { unreadCount });
};

export const emitNotificationRead = (userId, notificationIds) => {
  emitToUser(userId, 'notification:read', { notificationIds });
};
```

### Step 1.5: Integrate WebSocket with Notification Service
**File**: `src/modules/notification-management/notifications/notificationService.js`
**Changes**: Add import and emit calls
```javascript
import { emitNewNotification, emitUnreadCount } from './notificationSocketService.js';

// In createNotification function, after successful creation:
// Line ~165, after: const notification = await prisma.notifications.create({...})
try {
  emitNewNotification(notification.user_id, notification);
  const unreadResult = await getUnreadNotificationCount(notification.user_id);
  if (unreadResult.success) {
    emitUnreadCount(notification.user_id, unreadResult.data.unreadCount);
  }
} catch (socketError) {
  console.warn('Failed to emit real-time notification:', socketError);
  // Don't fail the entire operation if socket fails
}

// In markNotificationsAsRead function, after successful update:
// Line ~270, after: await prisma.notifications.updateMany({...})
import { emitNotificationRead } from './notificationSocketService.js';
// After successful update, emit to all affected users
const affectedNotifications = await prisma.notifications.findMany({
  where: { id: { in: notificationIds.map(id => Number(id)) } },
  select: { user_id: true }
});
const uniqueUserIds = [...new Set(affectedNotifications.map(n => n.user_id))];
uniqueUserIds.forEach(userId => {
  emitNotificationRead(userId, notificationIds);
  getUnreadNotificationCount(userId).then(result => {
    if (result.success) emitUnreadCount(userId, result.data.unreadCount);
  });
});
```

**Testing Real-Time Notifications**:
```bash
# Test endpoint: POST /api/notifications
# Body: { "userId": 1, "type": "info", "message": "Test notification" }
# Monitor browser console for WebSocket event: 'notification:new'
```

--------------------------------------------------------------------------------------------------------------  

## PHASE 2: DATABASE SCHEMA UPDATE (Week 1, Day 3) - HIGH PRIORITY

**Objective**: Add missing fields to support advanced notification features

### Step 2.1: Update Prisma Schema
**File**: `prisma/schema.prisma`
**Location**: Find `model notifications {` (around line 422)
**Replace with**:
```prisma
model notifications {
  id          Int        @id @default(autoincrement())
  user_id     Int?
  customer_id Int?
  message     String
  type        String?    @db.VarChar(50)
  is_read     Boolean?   @default(false)
  created_at  DateTime?  @default(now()) @db.Timestamp(6)
  
  // NEW FIELDS FOR ENHANCED FEATURES
  title       String?    @db.VarChar(255)      // Notification title
  icon        String?    @db.VarChar(50)       // Icon/emoji
  action_url  String?    @db.VarChar(500)      // Deep link (e.g., /orders/123)
  metadata    Json?                             // Extra data (orderId, productId, branchId, etc.)
  priority    String?    @default("normal")    // low, normal, high, urgent
  category    String?    @db.VarChar(50)       // order, payment, inventory, fefo, system
  read_at     DateTime?  @db.Timestamp(6)      // When user read it
  
  customers   customers? @relation(fields: [customer_id], references: [id], onDelete: NoAction, onUpdate: NoAction)
  users       users?     @relation(fields: [user_id], references: [id], onDelete: NoAction, onUpdate: NoAction)

  @@index([user_id, is_read], map: "idx_notifications_user_read")
  @@index([category], map: "idx_notifications_category")
  @@index([created_at], map: "idx_notifications_created")
}
```

### Step 2.2: Generate and Apply Migration
```bash
cd C:\Users\admina\PBL6\Back-End-Web
npx prisma migrate dev --name add_notification_enhanced_fields
npx prisma generate
```

### Step 2.3: Update notificationService.js Constants
**File**: `src/modules/notification-management/notifications/notificationService.js`
**Add after line 3**:
```javascript
const NOTIFICATION_TYPES = ['info', 'warning', 'success', 'error', 'system'];
const NOTIFICATION_PRIORITIES = ['low', 'normal', 'high', 'urgent'];  // ADD
const NOTIFICATION_CATEGORIES = ['order', 'payment', 'inventory', 'fefo', 'prescription', 'system'];  // ADD
```

## PHASE 3: NOTIFICATION TEMPLATES (Week 1, Days 4-5) - HIGH PRIORITY

**Objective**: Standardized, professional messages for all business events

### Step 3.1: Create Template System
**File**: `src/modules/notification-management/templates/notificationTemplates.js` (NEW FILE)
```javascript
export const NOTIFICATION_TEMPLATES = {
  // CUSTOMER ORDER NOTIFICATIONS
  ORDER_CONFIRMED: {
    category: 'order',
    type: 'success',
    priority: 'high',
    icon: '✅',
    title: 'Đơn hàng đã xác nhận',
    message: (orderId) => `Đơn hàng #${orderId} đã được xác nhận và đang được chuẩn bị.`,
    action_url: (orderId) => `/orders/${orderId}`,
    metadata: (orderId, additionalData = {}) => ({ orderId, ...additionalData })
  },
  
  ORDER_PROCESSING: {
    category: 'order',
    type: 'info',
    priority: 'normal',
    icon: '📦',
    title: 'Đơn hàng đang xử lý',
    message: (orderId) => `Đơn hàng #${orderId} đang được đóng gói.`,
    action_url: (orderId) => `/orders/${orderId}`,
    metadata: (orderId) => ({ orderId })
  },

  ORDER_SHIPPED: {
    category: 'order',
    type: 'info',
    priority: 'high',
    icon: '🚚',
    title: 'Đơn hàng đang giao',
    message: (orderId, trackingNumber) => 
      `Đơn hàng #${orderId} đang được giao đến bạn. Mã vận đơn: ${trackingNumber}`,
    action_url: (orderId) => `/orders/${orderId}`,
    metadata: (orderId, trackingNumber) => ({ orderId, trackingNumber })
  },

  ORDER_DELIVERED: {
    category: 'order',
    type: 'success',
    priority: 'high',
    icon: '🎉',
    title: 'Đơn hàng đã giao thành công',
    message: (orderId) => `Đơn hàng #${orderId} đã được giao thành công. Hãy đánh giá đơn hàng nhé!`,
    action_url: (orderId) => `/orders/${orderId}/review`,
    metadata: (orderId) => ({ orderId })
  },

  ORDER_CANCELLED: {
    category: 'order',
    type: 'error',
    priority: 'high',
    icon: '❌',
    title: 'Đơn hàng đã bị hủy',
    message: (orderId, reason) => `Đơn hàng #${orderId} đã bị hủy. Lý do: ${reason}`,
    action_url: (orderId) => `/orders/${orderId}`,
    metadata: (orderId, reason) => ({ orderId, reason })
  },

  // STAFF ORDER NOTIFICATIONS (NEW REQUIREMENT)
  STAFF_NEW_ORDER: {
    category: 'order',
    type: 'info',
    priority: 'high',
    icon: '🛒',
    title: 'Đơn hàng mới cần xử lý',
    message: (orderId, branchNames) => 
      `Đơn hàng #${orderId} cần xử lý tại chi nhánh: ${branchNames}`,
    action_url: (orderId) => `/staff/orders/${orderId}`,
    metadata: (orderId, branchIds, branchNames) => ({ orderId, branchIds, branchNames })
  },

  STAFF_FEFO_SELECTED: {
    category: 'fefo',
    type: 'info',
    priority: 'high',
    icon: '📅',
    title: 'FEFO - Sản phẩm được chọn',
    message: (orderId, productName, batchCode, expiryDate, branchName) => 
      `Đơn hàng #${orderId}: Lô "${batchCode}" (${productName}) HSD ${expiryDate} được chọn cho xuất kho tại ${branchName}`,
    action_url: (orderId) => `/staff/orders/${orderId}/prepare`,
    metadata: (orderId, productId, productName, batchId, batchCode, expiryDate, branchId, branchName) => 
      ({ orderId, productId, productName, batchId, batchCode, expiryDate, branchId, branchName })
  },

  STAFF_ORDER_READY: {
    category: 'order',
    type: 'success',
    priority: 'high',
    icon: '✅',
    title: 'Đơn hàng sẵn sàng xuất kho',
    message: (orderId, branchName) => 
      `Đơn hàng #${orderId} đã được chuẩn bị xong tại ${branchName}`,
    action_url: (orderId) => `/staff/orders/${orderId}/ship`,
    metadata: (orderId, branchId, branchName) => ({ orderId, branchId, branchName })
  },

  // ADMIN ORDER NOTIFICATIONS
  ADMIN_ORDER_ALERT: {
    category: 'order',
    type: 'warning',
    priority: 'urgent',
    icon: '⚠️',
    title: 'Cảnh báo đơn hàng',
    message: (orderId, alertType, details) => 
      `Đơn hàng #${orderId} - ${alertType}: ${details}`,
    action_url: (orderId) => `/admin/orders/${orderId}`,
    metadata: (orderId, alertType, details) => ({ orderId, alertType, details })
  },

  // PAYMENT NOTIFICATIONS
  PAYMENT_SUCCESS: {
    category: 'payment',
    type: 'success',
    priority: 'high',
    icon: '💰',
    title: 'Thanh toán thành công',
    message: (orderId, amount) => `Đã thanh toán thành công ${amount.toLocaleString('vi-VN')}₫ cho đơn hàng #${orderId}`,
    action_url: (orderId) => `/orders/${orderId}`,
    metadata: (orderId, amount, paymentMethod) => ({ orderId, amount, paymentMethod })
  },

  PAYMENT_FAILED: {
    category: 'payment',
    type: 'error',
    priority: 'urgent',
    icon: '⚠️',
    title: 'Thanh toán thất bại',
    message: (orderId, reason) => `Thanh toán cho đơn hàng #${orderId} thất bại. ${reason}. Vui lòng thử lại.`,
    action_url: (orderId) => `/orders/${orderId}/payment`,
    metadata: (orderId, reason) => ({ orderId, reason })
  },

  // INVENTORY NOTIFICATIONS FOR STAFF/ADMIN
  LOW_STOCK_ALERT: {
    category: 'inventory',
    type: 'warning',
    priority: 'high',
    icon: '⚠️',
    title: 'Cảnh báo tồn kho thấp',
    message: (productName, quantity, branchName) => 
      `Sản phẩm "${productName}" chỉ còn ${quantity} tại chi nhánh ${branchName}`,
    action_url: (productId, branchId) => `/staff/inventory/products/${productId}?branch=${branchId}`,
    metadata: (productId, productName, quantity, branchId, branchName) => 
      ({ productId, productName, quantity, branchId, branchName })
  },

  PRODUCT_EXPIRING_SOON: {
    category: 'fefo',
    type: 'warning',
    priority: 'high',
    icon: '📅',
    title: 'Sản phẩm sắp hết hạn',
    message: (productName, expiryDate, batchCode, branchName) => 
      `Sản phẩm "${productName}" (lô ${batchCode}) sẽ hết hạn vào ${expiryDate} tại ${branchName}`,
    action_url: (batchId, branchId) => `/staff/inventory/batches/${batchId}?branch=${branchId}`,
    metadata: (productId, productName, batchId, batchCode, expiryDate, branchId, branchName, daysUntilExpiry) => 
      ({ productId, productName, batchId, batchCode, expiryDate, branchId, branchName, daysUntilExpiry })
  },

  STOCK_TRANSFER_REQUESTED: {
    category: 'inventory',
    type: 'info',
    priority: 'normal',
    icon: '🔄',
    title: 'Yêu cầu chuyển kho',
    message: (productName, quantity, fromBranch, toBranch) => 
      `Yêu cầu chuyển ${quantity} ${productName} từ ${fromBranch} đến ${toBranch}`,
    action_url: (transferId) => `/staff/inventory/transfers/${transferId}`,
    metadata: (transferId, productId, productName, quantity, fromBranchId, toBranchId) => 
      ({ transferId, productId, productName, quantity, fromBranchId, toBranchId })
  },

  STOCK_TRANSFER_COMPLETED: {
    category: 'inventory',
    type: 'success',
    priority: 'normal',
    icon: '✅',
    title: 'Chuyển kho hoàn tất',
    message: (productName, quantity, fromBranch, toBranch) => 
      `Đã chuyển ${quantity} ${productName} từ ${fromBranch} đến ${toBranch}`,
    action_url: (transferId) => `/staff/inventory/transfers/${transferId}`,
    metadata: (transferId, productId, productName, quantity, fromBranchId, toBranchId) => 
      ({ transferId, productId, productName, quantity, fromBranchId, toBranchId })
  },

  // PRESCRIPTION NOTIFICATIONS
  PRESCRIPTION_UPLOADED: {
    category: 'prescription',
    type: 'info',
    priority: 'high',
    icon: '📋',
    title: 'Đơn thuốc mới cần xét duyệt',
    message: (customerId, customerName) => 
      `Khách hàng ${customerName} (ID: ${customerId}) đã tải lên đơn thuốc mới`,
    action_url: (prescriptionId) => `/pharmacist/prescriptions/${prescriptionId}/verify`,
    metadata: (prescriptionId, customerId, customerName) => 
      ({ prescriptionId, customerId, customerName })
  },

  PRESCRIPTION_APPROVED: {
    category: 'prescription',
    type: 'success',
    priority: 'high',
    icon: '✅',
    title: 'Đơn thuốc đã được duyệt',
    message: () => `Đơn thuốc của bạn đã được dược sĩ xác nhận. Bạn có thể đặt hàng ngay!`,
    action_url: (prescriptionId) => `/prescriptions/${prescriptionId}`,
    metadata: (prescriptionId, pharmacistId) => ({ prescriptionId, pharmacistId })
  },

  PRESCRIPTION_REJECTED: {
    category: 'prescription',
    type: 'error',
    priority: 'high',
    icon: '❌',
    title: 'Đơn thuốc bị từ chối',
    message: (reason) => `Đơn thuốc của bạn không được duyệt. Lý do: ${reason}`,
    action_url: (prescriptionId) => `/prescriptions/${prescriptionId}`,
    metadata: (prescriptionId, reason, pharmacistId) => 
      ({ prescriptionId, reason, pharmacistId })
  }
};

export const generateNotification = (templateKey, ...params) => {
  const template = NOTIFICATION_TEMPLATES[templateKey];
  if (!template) {
    throw new Error(`Template ${templateKey} not found`);
  }

  return {
    category: template.category,
    type: template.type,
    priority: template.priority,
    icon: template.icon,
    title: template.title,
    message: typeof template.message === 'function' ? template.message(...params) : template.message,
    action_url: typeof template.action_url === 'function' ? template.action_url(params[0]) : template.action_url,
    metadata: typeof template.metadata === 'function' ? template.metadata(...params) : template.metadata
  };
};
```

### Step 3.2: Create Template Service
**File**: `src/modules/notification-management/templates/templateNotificationService.js` (NEW FILE)
```javascript
import { generateNotification } from './notificationTemplates.js';
import { createNotification } from '../notifications/notificationService.js';

export const sendTemplatedNotification = async (userId, templateKey, ...params) => {
  try {
    const notificationData = generateNotification(templateKey, ...params);
    
    return await createNotification({
      userId: userId,
      ...notificationData
    });
  } catch (error) {
    console.error('Error sending templated notification:', error);
    return {
      success: false,
      error: error.message
    };
  }
};
```

## PHASE 4: AUTOMATED TRIGGERS (Week 2, Days 1-3) - CRITICAL

**Objective**: Auto-send notifications when business events occur

### Step 4.1: Create Order Notification Triggers (Customer & Staff)
**File**: `src/modules/notification-management/triggers/orderNotifications.js` (NEW FILE)
```javascript
import { sendTemplatedNotification } from '../templates/templateNotificationService.js';
import prisma from '../../../config/db.js';

// CUSTOMER NOTIFICATIONS
export const notifyOrderConfirmed = async (order) => {
  // Get customer user_id
  if (!order.customer?.user_id) {
    console.warn('Cannot send order confirmed notification: missing customer user_id');
    return;
  }
  
  return await sendTemplatedNotification(
    order.customer.user_id,  // user_id from customers table
    'ORDER_CONFIRMED',
    order.id
  );
};

export const notifyOrderProcessing = async (order) => {
  if (!order.customer?.user_id) return;
  
  return await sendTemplatedNotification(
    order.customer.user_id,
    'ORDER_PROCESSING',
    order.id
  );
};

export const notifyOrderShipped = async (order, trackingNumber) => {
  if (!order.customer?.user_id) return;
  
  return await sendTemplatedNotification(
    order.customer.user_id,
    'ORDER_SHIPPED',
    order.id,
    trackingNumber
  );
};

export const notifyOrderDelivered = async (order) => {
  if (!order.customer?.user_id) return;
  
  return await sendTemplatedNotification(
    order.customer.user_id,
    'ORDER_DELIVERED',
    order.id
  );
};

export const notifyOrderCancelled = async (order, reason) => {
  if (!order.customer?.user_id) return;
  
  return await sendTemplatedNotification(
    order.customer.user_id,
    'ORDER_CANCELLED',
    order.id,
    reason
  );
};

// STAFF NOTIFICATIONS (NEW REQUIREMENT)
export const notifyStaffNewOrder = async (orderId, fefoResults) => {
  // fefoResults contains branch allocations from FEFO algorithm
  // Example: [{ branchId: 1, branchName: "HCM", items: [...] }]
  
  const branchIds = fefoResults.map(r => r.branchId);
  const branchNames = fefoResults.map(r => r.branchName).join(', ');
  
  // Get staff from affected branches using actual staff table structure
  const branchStaff = await prisma.staff.findMany({
    where: {
      branch_id: { in: branchIds },
      is_active: true,
      position: { in: ['warehouse_staff', 'pharmacist', 'store_manager', 'warehouse', 'manager'] }
    },
    select: {
      user_id: true,  // Get user_id to send notification
      branch_id: true,
      position: true
    }
  });
  
  // Notify each staff member
  for (const staff of branchStaff) {
    await sendTemplatedNotification(
      staff.user_id,  // Send to staff's user_id
      'STAFF_NEW_ORDER',
      orderId,
      branchNames,
      branchIds
    );
  }
};

export const notifyStaffFEFOSelection = async (orderId, fefoSelection) => {
  // Notify staff about specific batches selected by FEFO algorithm
  // fefoSelection: { productId, productName, batchId, batchCode, expiryDate, branchId, branchName, quantity }
  
  const branchStaff = await prisma.staff.findMany({
    where: {
      branch_id: fefoSelection.branchId,
      is_active: true,
      position: { in: ['warehouse_staff', 'pharmacist', 'warehouse', 'inventory_staff'] }
    },
    select: { user_id: true }
  });
  
  for (const staff of branchStaff) {
    await sendTemplatedNotification(
      staff.user_id,
      'STAFF_FEFO_SELECTED',
      orderId,
      fefoSelection.productName,
      fefoSelection.batchCode,
      fefoSelection.expiryDate,
      fefoSelection.branchName,
      fefoSelection.productId,
      fefoSelection.batchId,
      fefoSelection.branchId
    );
  }
};

export const notifyStaffOrderReady = async (orderId, branchId, branchName) => {
  const branchStaff = await prisma.staff.findMany({
    where: {
      branch_id: branchId,
      is_active: true,
      position: { in: ['delivery_staff', 'store_manager', 'shipper', 'delivery', 'manager'] }
    },
    select: { user_id: true }
  });
  
  for (const staff of branchStaff) {
    await sendTemplatedNotification(
      staff.user_id,
      'STAFF_ORDER_READY',
      orderId,
      branchName,
      branchId
    );
  }
};

// ADMIN NOTIFICATIONS
export const notifyAdminOrderAlert = async (orderId, alertType, details) => {
  const admins = await prisma.admin.findMany({
    where: { /* No is_active field in admin table */ },
    select: { user_id: true }
  });
  
  for (const admin of admins) {
    await sendTemplatedNotification(
      admin.user_id,
      'ADMIN_ORDER_ALERT',
      orderId,
      alertType,
      details
    );
  }
};

export const notifyPaymentSuccess = async (order, amount, paymentMethod) => {
  if (!order.customer?.user_id) return;
  
  return await sendTemplatedNotification(
    order.customer.user_id,
    'PAYMENT_SUCCESS',
    order.id,
    amount,
    paymentMethod
  );
};

export const notifyPaymentFailed = async (order, reason) => {
  if (!order.customer?.user_id) return;
  
  return await sendTemplatedNotification(
    order.customer.user_id,
    'PAYMENT_FAILED',
    order.id,
    reason
  );
};
```

### Step 4.2: Integrate with Order Service & FEFO Algorithm
**IMPORTANT**: The checkout service (`checkoutService.js`) already uses FEFO algorithm. We need to add notifications AFTER the FEFO allocation happens.

**File**: `src/modules/order-management/cart/checkoutService.js`
**Location**: After `allocateBatchesFEFO` is called (around line 500-550)
**Add import at top**:
```javascript
import * as orderNotifications from '../../notification-management/triggers/orderNotifications.js';
```

**Find the FEFO allocation code** (search for "allocateBatchesFEFO"):
```javascript
// EXISTING CODE (around line 520):
const allocationResult = await allocateBatchesFEFO(branchId, item.product_id, baseQuantityNeeded);
if (allocationResult.success) {
  batchAllocations = allocationResult.data.allocations;
  
  // ADD NOTIFICATION HERE - After FEFO selects batches:
  try {
    for (const allocation of batchAllocations) {
      // Get batch details
      const batch = await prisma.productBatch.findUnique({
        where: { id: allocation.batchId },
        include: {
          products: { select: { name: true } },
          branches: { select: { name: true } }
        }
      });
      
      if (batch) {
        await orderNotifications.notifyStaffFEFOSelection(orderId, {
          productId: item.product_id,
          productName: batch.products.name,
          batchId: batch.id,
          batchCode: batch.batch_number || `BATCH-${batch.id}`,
          expiryDate: batch.expiry_date ? new Date(batch.expiry_date).toLocaleDateString('vi-VN') : 'N/A',
          branchId: branchId,
          branchName: batch.branches.name,
          quantity: allocation.quantity
        });
      }
    }
  } catch (notifError) {
    console.warn('Failed to send FEFO notification:', notifError);
  }
}
```

**Also add notification after order is created**:
```javascript
// After order status changes from 'cart' to 'pending' (around line 650-700):
// ADD THIS after the transaction completes:
try {
  // Collect all branches involved in this order
  const branchesInvolved = [...new Set(
    cart.orderitems.map(item => item.branch_id).filter(Boolean)
  )];
  
  // Get branch names
  const branches = await prisma.branches.findMany({
    where: { id: { in: branchesInvolved } },
    select: { id: true, name: true }
  });
  
  const fefoResults = branches.map(branch => ({
    branchId: branch.id,
    branchName: branch.name,
    items: cart.orderitems.filter(item => item.branch_id === branch.id)
  }));
  
  await orderNotifications.notifyStaffNewOrder(orderId, fefoResults);
} catch (notifError) {
  console.warn('Failed to send staff order notification:', notifError);
}
```

**File**: `src/modules/order-management/orders/orderService.js`
**Location**: Function `updateOrderStatus` (around line 408)
**Add import at top**:
```javascript
import * as orderNotifications from '../../notification-management/triggers/orderNotifications.js';
```

**Add notification calls inside updateOrderStatus function**:
```javascript
export const updateOrderStatus = async (orderId, status, userId) => {
  try {
    // ... existing validation code ...

    const updatedOrder = await prisma.orders.update({
      where: { id: Number(orderId) },
      data: { 
        status,
        updated_at: new Date()
      },
      include: {
        customer: true,  // CHANGED: Remove nested user include, get user_id directly from customer
        shipments: true,
        order_items: {
          include: {
            products: true,
            branch_inventories: {
              include: {
                branches: true
              }
            }
          }
        }
      }
    });

    // ADD NOTIFICATION TRIGGERS HERE (after successful update)
    try {
      // Get customer user_id for notifications
      const customer = await prisma.customers.findUnique({
        where: { id: updatedOrder.customer_id },
        select: { user_id: true }
      });
      
      if (customer?.user_id) {
        switch(status) {
          case 'confirmed':
            await orderNotifications.notifyOrderConfirmed({ 
              ...updatedOrder, 
              customer: { user_id: customer.user_id } 
            });
            break;
          case 'processing':
            await orderNotifications.notifyOrderProcessing({ 
              ...updatedOrder, 
              customer: { user_id: customer.user_id } 
            });
            break;
          case 'shipping':
            const trackingNumber = updatedOrder.shipments?.[0]?.tracking_number || 'N/A';
            await orderNotifications.notifyOrderShipped({ 
              ...updatedOrder, 
              customer: { user_id: customer.user_id } 
            }, trackingNumber);
            break;
          case 'delivered':
            await orderNotifications.notifyOrderDelivered({ 
              ...updatedOrder, 
              customer: { user_id: customer.user_id } 
            });
            break;
          case 'cancelled':
            await orderNotifications.notifyOrderCancelled({ 
              ...updatedOrder, 
              customer: { user_id: customer.user_id } 
            }, 'Đơn hàng bị hủy');
            break;
        }
      }
    } catch (notifError) {
      console.error('Failed to send order notification:', notifError);
      // Don't fail the entire order update if notification fails
    }

    return {
      success: true,
      data: updatedOrder,
      message: 'Cập nhật trạng thái đơn hàng thành công'
    };
  } catch (error) {
    // ... existing error handling ...
  }
};
```

**IMPORTANT NOTES**:
1. Current schema has `customer.user_id` to link customers to users table
2. Staff are accessed via `staff.user_id` with `staff.branch_id` for branch routing
3. Admins are accessed via `admin.user_id`
4. **DO NOT** use `customer.users` relation - query `customers` table to get `user_id`
**Location**: After FEFO algorithm selects batches (in order creation or preparation flow)
```javascript
// After FEFO algorithm runs and selects batches
// Example: In createOrder or preparOrderItems function

// Notify staff about new order with branch allocations
const fefoResults = [
  { 
    branchId: 1, 
    branchName: "Chi nhánh HCM",
    items: [...]
  },
  // ... more branches
];

await orderNotifications.notifyStaffNewOrder(orderId, fefoResults);

// Notify staff about specific FEFO batch selections
for (const item of fefoResults.flatMap(r => r.items)) {
  await orderNotifications.notifyStaffFEFOSelection(orderId, {
    productId: item.productId,
    productName: item.productName,
    batchId: item.batchId,
    batchCode: item.batchCode,
    expiryDate: item.expiryDate,
    branchId: item.branchId,
    branchName: item.branchName
  });
}
```

--------------------------------------------------------------------------------------------------------------  

### Step 4.3: Integrate with Payment Webhooks
**Files**: Update all payment gateway webhook handlers

**Example for VNPay**: `src/modules/order-management/payments/gateways/vnpay/vnpayController.js`
```javascript
// Add import
import * as orderNotifications from '../../../notification-management/triggers/orderNotifications.js';

// In webhook handler, after successful payment processing:
if (paymentSuccess) {
  await orderNotifications.notifyPaymentSuccess(order, amount, 'VNPay');
} else {
  await orderNotifications.notifyPaymentFailed(order, 'Giao dịch không thành công');
}
```

**Repeat for**: MoMo, PayOS, PayPal webhook controllers

### Step 4.4: Create Inventory Notification Triggers (Staff/Admin)
**File**: `src/modules/notification-management/triggers/inventoryNotifications.js` (NEW FILE)
```javascript
import { sendTemplatedNotification } from '../templates/templateNotificationService.js';
import prisma from '../../../config/db.js';

export const notifyLowStock = async (productId, productName, quantity, branchId, branchName) => {
  // Notify branch staff
  const branchStaff = await prisma.staff.findMany({
    where: {
      branch_id: branchId,
      is_active: true,
      position: { in: ['warehouse_staff', 'store_manager', 'pharmacist', 'warehouse', 'manager', 'inventory_staff'] }
    },
    select: { user_id: true }
  });
  
  for (const staff of branchStaff) {
    await sendTemplatedNotification(
      staff.user_id,
      'LOW_STOCK_ALERT',
      productName,
      quantity,
      branchName,
      productId,
      branchId
    );
  }
  
  // Also notify admins (no is_active field in admin table)
  const admins = await prisma.admin.findMany({
    select: { user_id: true }
  });
  
  for (const admin of admins) {
    await sendTemplatedNotification(
      admin.user_id,
      'LOW_STOCK_ALERT',
      productName,
      quantity,
      branchName,
      productId,
      branchId
    );
  }
};

export const notifyProductExpiringSoon = async (productId, productName, batchId, batchCode, expiryDate, branchId, branchName, daysUntilExpiry) => {
  // Notify warehouse staff and pharmacists at the branch
  const branchStaff = await prisma.staff.findMany({
    where: {
      branch_id: branchId,
      is_active: true,
      position: { in: ['warehouse_staff', 'pharmacist', 'inventory_manager', 'warehouse', 'inventory_staff'] }
    },
    select: { user_id: true }
  });

  for (const staff of branchStaff) {
    await sendTemplatedNotification(
      staff.user_id,
      'PRODUCT_EXPIRING_SOON',
      productName,
      expiryDate,
      batchCode,
      branchName,
      productId,
      batchId,
      branchId,
      daysUntilExpiry
    );
  }
};

export const notifyStockTransferRequested = async (transferId, productId, productName, quantity, fromBranchId, toBranchId) => {
  // Get branch names
  const branches = await prisma.branches.findMany({
    where: { id: { in: [fromBranchId, toBranchId] } },
    select: { id: true, name: true }
  });
  
  const fromBranch = branches.find(b => b.id === fromBranchId);
  const toBranch = branches.find(b => b.id === toBranchId);
  
  // Notify staff at source branch
  const fromStaff = await prisma.staff.findMany({
    where: {
      branch_id: fromBranchId,
      is_active: true,
      position: { in: ['warehouse_staff', 'store_manager', 'warehouse', 'manager', 'inventory_staff'] }
    },
    select: { user_id: true }
  });
  
  for (const staff of fromStaff) {
    await sendTemplatedNotification(
      staff.user_id,
      'STOCK_TRANSFER_REQUESTED',
      productName,
      quantity,
      fromBranch?.name || 'Unknown',
      toBranch?.name || 'Unknown',
      transferId,
      productId,
      fromBranchId,
      toBranchId
    );
  }
};

export const notifyStockTransferCompleted = async (transferId, productId, productName, quantity, fromBranchId, toBranchId) => {
  // Get branch names
  const branches = await prisma.branches.findMany({
    where: { id: { in: [fromBranchId, toBranchId] } },
    select: { id: true, name: true }
  });
  
  const fromBranch = branches.find(b => b.id === fromBranchId);
  const toBranch = branches.find(b => b.id === toBranchId);
  
  // Notify staff at destination branch
  const toStaff = await prisma.staff.findMany({
    where: {
      branch_id: toBranchId,
      is_active: true,
      position: { in: ['warehouse_staff', 'store_manager', 'warehouse', 'manager', 'inventory_staff'] }
    },
    select: { user_id: true }
  });
  
  for (const staff of toStaff) {
    await sendTemplatedNotification(
      staff.user_id,
      'STOCK_TRANSFER_COMPLETED',
      productName,
      quantity,
      fromBranch?.name || 'Unknown',
      toBranch?.name || 'Unknown',
      transferId,
      productId,
      fromBranchId,
      toBranchId
    );
  }
};
```

### Step 4.5: Create Prescription Notification Triggers (Pharmacist/Customer)
**File**: `src/modules/notification-management/triggers/prescriptionNotifications.js` (NEW FILE)
```javascript
import { sendTemplatedNotification } from '../templates/templateNotificationService.js';
import prisma from '../../../config/db.js';

export const notifyPrescriptionUploaded = async (prescriptionId, customerId, customerName) => {
  // Notify all active pharmacists (position field stores role name)
  const pharmacists = await prisma.staff.findMany({
    where: { 
      position: { in: ['pharmacist', 'chief_pharmacist', 'dược sĩ'] },  // Support Vietnamese
      is_active: true
    },
    select: { user_id: true }
  });

  for (const pharmacist of pharmacists) {
    await sendTemplatedNotification(
      pharmacist.user_id,
      'PRESCRIPTION_UPLOADED',
      customerId,
      customerName,
      prescriptionId
    );
  }
};

export const notifyPrescriptionApproved = async (prescription, pharmacistId) => {
  if (!prescription.customer?.user_id) return;

  return await sendTemplatedNotification(
    prescription.customer.user_id,
    'PRESCRIPTION_APPROVED',
    prescription.id,
    pharmacistId
  );
};

export const notifyPrescriptionRejected = async (prescription, reason, pharmacistId) => {
  if (!prescription.customer?.user_id) return;

  return await sendTemplatedNotification(
    prescription.customer.user_id,
    'PRESCRIPTION_REJECTED',
    reason,
    prescription.id,
    pharmacistId
  );
};
```

### Step 4.6: Integrate Triggers with Prescription Service
**File**: `src/modules/medical/prescriptions/prescriptionService.js`
```javascript
// Add import at top
import * as prescriptionNotifications from '../../notification-management/triggers/prescriptionNotifications.js';

// In uploadPrescription function (line 17):
// After creating prescription successfully:
try {
  const customer = await prisma.customers.findUnique({
    where: { id: prescription.customer_id },
    include: { users: { select: { full_name: true } } }
  });
  
  if (customer) {
    await prescriptionNotifications.notifyPrescriptionUploaded(
      prescription.id, 
      customer.id, 
      customer.users?.full_name || 'Khách hàng'
    );
  }
} catch (notifError) {
  console.warn('Failed to send prescription upload notification:', notifError);
}

// In verifyPrescription function (line 370):
// After updating prescription status (around line 415):
try {
  const customer = await prisma.customers.findUnique({
    where: { id: updatedPrescription.customer_id },
    select: { user_id: true }
  });
  
  if (customer?.user_id) {
    if (status === 'verified') {
      await prescriptionNotifications.notifyPrescriptionApproved(
        { ...updatedPrescription, customer: { user_id: customer.user_id } },
        userId
      );
    } else if (status === 'rejected') {
      await prescriptionNotifications.notifyPrescriptionRejected(
        { ...updatedPrescription, customer: { user_id: customer.user_id } },
        verificationNotes || 'Đơn thuốc không hợp lệ',
        userId
      );
    }
  }
} catch (notifError) {
  console.warn('Failed to send prescription verification notification:', notifError);
}
```

--------------------------------------------------------------------------------------------------------------  

========================================
IMPLEMENTATION PRIORITY & TIMELINE
========================================

### WEEK 1 - FOUNDATION (CRITICAL)
**Days 1-2**: Real-Time WebSocket (Phase 1)
- Install Socket.IO
- Configure WebSocket server
- Integrate with existing notification service
- Test real-time delivery

**Day 3**: Database Schema Update (Phase 2)
- Update Prisma schema with new fields
- Run migrations
- Update service layer to use new fields

**Days 4-5**: Notification Templates (Phase 3)
- Create template system
- Define all notification types (customer, staff, admin)
- Create template service

### WEEK 2 - AUTOMATION (CRITICAL)
**Days 1-5**: Automated Triggers (Phase 4)
- Create customer order notification triggers
- Create staff/admin order notification triggers
- Integrate with orderService and FEFO algorithm
- Create payment notification triggers  
- Integrate with payment webhooks
- Create inventory notifications for staff/admin
- Create prescription notifications for pharmacists
- Add branch-specific notification routing

### WEEK 3+ - ADVANCED FEATURES (OPTIONAL)
**Phase 5**: Scheduled Notifications (Optional)
- Create scheduler job for batch notifications
- Add scheduling API for future notifications

========================================
QUICK START GUIDE (MINIMAL VIABLE PRODUCT)
========================================

If you need a working system ASAP, implement in this order:

## Step 1: Update Database (30 minutes)
```bash
# Update prisma/schema.prisma with enhanced notifications model
npx prisma migrate dev --name add_notification_enhanced_fields
npx prisma generate
```

## Step 2: Create Templates (1 hour)
- Create `src/modules/notification-management/templates/notificationTemplates.js` with all customer, staff, and admin templates
- Create `src/modules/notification-management/templates/templateNotificationService.js`

## Step 3: Add Order & FEFO Triggers (3 hours)
- Create `src/modules/notification-management/triggers/orderNotifications.js` with:
  - Customer notification functions (ORDER_CONFIRMED, ORDER_SHIPPED, etc.)
  - Staff notification functions (STAFF_NEW_ORDER, STAFF_FEFO_SELECTED, STAFF_ORDER_READY)
  - Admin notification functions (ADMIN_ORDER_ALERT)
- Integrate with `src/modules/order-management/orders/orderService.js`
- Add calls after FEFO algorithm selects batches
- Test with actual order creation and status changes

## Step 4: Add Inventory & Prescription Triggers (2 hours)
- Create `src/modules/notification-management/triggers/inventoryNotifications.js` for staff/admin
- Create `src/modules/notification-management/triggers/prescriptionNotifications.js` for pharmacists
- Integrate with inventory and prescription services
- Test with low stock and expiring product scenarios

## Step 4: Add Real-Time (3 hours)
- Install Socket.IO: `npm install socket.io@4.8.1`
- Create `src/config/socket.js`
- Update `index.js` to use httpServer
- Create `src/modules/notification-management/notifications/notificationSocketService.js`
- Integrate with notification service

## Step 5: Test End-to-End (1 hour)
- Create an order → Staff at relevant branches receive notifications
- FEFO algorithm selects batches → Staff receive batch-specific notifications
- Update order status → Customer receives notification
- Low stock detected → Branch staff and admins receive alerts
- Check database for notification records

**Total MVP Time: ~10-11 hours**

========================================
TESTING CHECKLIST
========================================

### Real-Time Notifications
- [ ] User connects to WebSocket with JWT token
- [ ] New notification appears instantly without refresh
- [ ] Unread count updates in real-time
- [ ] Multiple users receive separate notifications

### Customer Notifications
- [ ] Order confirmed → Customer receives notification
- [ ] Order shipped → Customer receives notification with tracking
- [ ] Order delivered → Customer receives notification
- [ ] Payment success → Customer receives notification
- [ ] Payment failed → Customer receives notification

### Staff/Admin Notifications (NEW REQUIREMENT)
- [ ] New order created → Staff at correlated branches receive notification
- [ ] FEFO algorithm selects batch → Staff receive batch-specific notification with expiry date
- [ ] Order ready for shipment → Branch delivery staff receive notification
- [ ] Low stock → Branch staff and admins receive alert
- [ ] Product expiring soon → Warehouse staff at specific branch receive alert
- [ ] Stock transfer requested → Source branch staff receive notification
- [ ] Stock transfer completed → Destination branch staff receive notification
- [ ] Prescription uploaded → All pharmacists receive notification
- [ ] Order issues → Admins receive alert with details

### Branch-Specific Routing
- [ ] Staff only receive notifications for their assigned branch
- [ ] Admins receive notifications for all branches
- [ ] FEFO notifications contain correct branch information

========================================
ENVIRONMENT VARIABLES REQUIRED
========================================

Add to `.env` file:

```env
# WebSocket Configuration
CORS_ORIGIN=http://localhost:5173

# JWT (already exists)
JWT_SECRET=your-secret-key

# Email Configuration (for Phase 6)
JWT_SECRET=your-secret-key

# Database (already exists)
DATABASE_URL=postgresql://...
```

========================================
API ENDPOINTS SUMMARY
========================================

### Existing Endpoints:
- GET `/api/notifications` - Get all notifications
- GET `/api/notifications/:id` - Get notification by ID
- POST `/api/notifications` - Create notification (manual)
- PUT `/api/notifications/:id` - Update notification
- DELETE `/api/notifications/:id` - Delete notification
- POST `/api/notifications/mark-read` - Mark as read
- GET `/api/notifications/unread-count` - Get unread count

========================================
MAINTENANCE & MONITORING
========================================

### Daily Checks:
- Monitor WebSocket connection errors in logs
- Review failed notification attempts
- Check staff/admin notification routing

### Weekly Tasks:
- Review notification patterns by branch
- Check FEFO notification accuracy
- Clean up old read notifications (>30 days)
- Verify branch-specific routing is working correctly

### Performance Optimization:
- Add database indexes for frequently queried fields (already in schema)
- Implement notification caching with Redis (ioredis already installed)
- Batch database writes for high-traffic periods

========================================
TROUBLESHOOTING GUIDE
========================================

**Issue**: WebSocket not connecting
- Check CORS_ORIGIN in .env
- Verify JWT token in client handshake
- Check firewall/proxy settings

**Issue**: Notifications not sending
- Verify trigger integration in order/inventory services
- Check database constraints
- Verify user_id exists for staff/admin

**Issue**: Staff notifications not routing correctly
- Verify staff.branch_id matches the expected branch
- Check staff.position field for correct role
- Verify staff.is_active is true

**Issue**: FEFO notifications missing batch details
- Check FEFO algorithm output includes all required fields
- Verify batch information is passed to notification trigger
- Check metadata field in database

**Issue**: Database errors after migration
- Run `npx prisma generate`
- Restart server
- Check Prisma schema syntax

========================================
FUTURE ENHANCEMENTS
========================================

1. **Push Notifications** - Add Firebase Cloud Messaging for mobile apps
2. **Notification Grouping** - Group similar notifications ("3 new orders at HCM branch")
3. **Rich Notifications** - Support images, buttons, and custom actions
4. **Smart Routing** - AI-based notification priority and routing
5. **Notification Queue** - Use Redis queue for high-volume scenarios
6. **Multi-Language Support** - Support Vietnamese and English
7. **Voice Alerts** - Audio notifications for urgent staff alerts
8. **Dashboard Widgets** - Real-time notification stats for admins

========================================
END OF IMPLEMENTATION PLAN
========================================


###
● Summary

   I've validated and updated the noti_recommend.md document based on the actual back-end codebase. Here are the   
   key findings and fixes:

   🔍 Critical Findings:

     - ✅ FEFO Algorithm Already Exists
       - Located in: src/modules/inventory-management/product-batch/productBatchService.js
       - Functions: allocateBatchesFEFO(), exportStockFEFO()
       - Already integrated in checkout process
     - ✅ Integration Point Identified
       - src/modules/order-management/cart/checkoutService.js (line ~520)
       - Calls allocateBatchesFEFO() during order creation
       - This is where staff notifications should be triggered
     - ✅ Database Structure Verified
       - staff: has user_id, branch_id, position, is_active
       - admin: has user_id only (NO is_active field)
       - customers: has user_id linking to users table
       - shipments: has tracking_number, carrier, branch_id
     - ⚠️ Socket.IO Not Installed - needs npm install socket.io@4.8.1

   📝 Document Fixes Made:

   ✅ Added critical findings section at the top
   ✅ Fixed customer.user_id access (NOT customer.users.id)
   ✅ Updated staff position queries with flexible matching (warehouse, manager, pharmacist, warehouse_staff,      
   etc.)
   ✅ Removed admin.is_active references (field doesn't exist)
    Updated integration points with actual file paths and line numbers
   ✅ Added prescription service integration with correct line numbers (17, 370)

   🎯 Key Changes to Implementation:

   🎯 Key Changes to Implementation:


     - Checkout Service Integration: Staff notifications must be added in checkoutService.js AFTER
   allocateBatchesFEFO() returns results
   allocateBatchesFEFO() returns results
     - Position Field Matching: Use flexible array matching for staff positions (includes multiple role name       
   variations)
     - Customer Notifications: Access via customers.user_id field directly
     - Admin Queries: No is_active filter needed

   The document is now accurate and ready for implementation based on your actual codebase structure!