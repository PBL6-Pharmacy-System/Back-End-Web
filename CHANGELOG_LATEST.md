Dựa trên kết quả so sánh với commit gần nhất, đây là tổng hợp các thay đổi chính trong dự án Back-End-Web:

📋 TỔNG HỢP THAY ĐỔI SO VỚI COMMIT GẦN NHẤT
🗑️ Files đã xóa:
bestSellersJob.js - Job cũ cleanup OTP (đã thay thế)
cartExpirationJob.js - Job cũ xử lý cart hết hạn (đã thay thế)
✨ Files mới được tạo:
File	Mô tả
cartCleanupJob.js	Job dọn dẹp cart abandoned (chạy 2:00 AM hàng ngày)
inventoryReconciliationJob.js	Job kiểm tra đồng bộ inventory với batch
otpCleanupJob.js	Job dọn dẹp OTP hết hạn (mỗi 5 phút)
reservationCleanupJob.js	Job dọn dẹp inventory reservation hết hạn
inventoryHealthCheck.js	Service kiểm tra sức khỏe inventory
inventoryHealthCheckRoutes.js	API routes cho inventory health check
logger.js	Logger utility với masking sensitive data
retryHelper.js	Retry mechanism với exponential backoff
test-customer-security.js	Script test bảo mật với tài khoản Customer
test-staff-apis.js	Script test API với tài khoản Staff
migrate-inventory-log-convention.js	Script migration inventory log convention
inventory_log_convention_migration.sql	SQL migration cho inventory log
CHANGELOG_LATEST.md	Tài liệu changelog
INVENTORY_LOG_CONVENTION.md	Hướng dẫn convention inventory log
note.md	Ghi chú kỹ thuật về các flow
🔧 Files đã sửa đổi quan trọng:
1. Middlewares:
rateLimit.middleware.js - Thêm rate limiters mới: checkoutLimiter, cancelOrderLimiter, inventoryLimiter, productStatsLimiter, bestSellersLimiter
validate.middleware.js - Thêm validators cho text fields: validateTextFields, validateNote, validateReason
2. Auth Module:
auth.middleware.js - Thêm middlewares: authorizeTransferBranch, authorizeCreateTransfer cho inventory transfer
authService.js - Fix customer login OTP: đảm bảo role_name và customer_id luôn có giá trị
3. Order Management:
cartService.js - Đồng bộ với checkoutService, thêm inventory reservation, fix FEFO allocation
checkoutService.js - Major refactor: Thêm price sync, inventory reservations, Serializable isolation
orderService.js - Thêm state machine validation, fix cancel order (rollback voucher, flashsale, multi-branch)
paymentService.js - Thêm idempotency check cho COD payment
4. Inventory Management:
inventoryTransferRoutes.js - Thêm authorization middlewares cho Staff branch validation
inventoryTransferService.js - Fix inventory log convention (số DƯƠNG với type TRANSFER_OUT)
productBatchService.js - Fix atomic check cho batch quantity, thêm Serializable isolation
5. Shipping Management:
shipmentRoutes.js - Thêm validateShipmentOwnership, validateOrderShipmentOwnership
shipmentService.js - Thêm idempotency check khi RETURNED, hoàn batch
shippingAddressRoutes.js - Thêm validateAddressOwnership
shippingAddressService.js - Fix kiểm tra shipments khi xóa địa chỉ
shippingFeeController.js - Thêm input validation cho geocode, coordinates
shippingFeeRoutes.js - Thêm rate limiters
6. Product Management:
productRoutes.js - Thêm rate limiters cho best-sellers và product stats
productUnitRoutes.js - Đổi sang kebab-case, thêm backward compatibility redirects
supplierController.js - Mask thông tin nhạy cảm cho public users
supplierRoutes.js - Sử dụng optionalAuth để mask data
7. User Management:
staffRoutes.js - Fix validateId param name
8. Constants:
constants.js - Thêm INVENTORY_LOG_TYPE, INVENTORY_INCREASE_TYPES, INVENTORY_DECREASE_TYPES, calculateStockMovement
🔒 Các fix bảo mật quan trọng:
Ownership validation cho payments, shipments, shipping addresses
Rate limiting cho geocoding, shipping APIs
Input validation cho coordinates, addresses
Masking sensitive data trong supplier info cho public users
🐛 Các bug fixes quan trọng:
Fix #1-25: Inventory log convention (backward compatible)
Fix race condition: Atomic updates với Serializable isolation
Fix cancel order: Rollback voucher, flashsale, multi-branch shipments
Fix checkout: Price sync, inventory reservations
Fix idempotency: COD payment, shipment returned
📊 Thống kê:
Files mới: ~15 files
Files sửa: ~25 files
Files xóa: 2 files
Tổng thay đổi: ~40+ files
