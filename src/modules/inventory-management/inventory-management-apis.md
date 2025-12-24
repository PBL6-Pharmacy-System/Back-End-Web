### Tổng quan module `inventory-management`

#### 1. Phạm vi module

Module `inventory-management` phụ trách toàn bộ nghiệp vụ về kho hàng trong hệ thống, bao gồm:

- **Quản lý chi nhánh & tồn kho chi nhánh**
- **Quản lý tồn kho tổng (cross-branch)**
- **Quản lý lô hàng / batch & chính sách FEFO**
- **Chuyển kho nội bộ**
- **Kiểm kê kho (stock-take)**
- **Đơn đặt hàng nhà cung cấp & nhập kho**
- **Health-check & kiểm tra tính nhất quán dữ liệu**
- **Thống kê tồn kho & movement**
- **Hub điều phối nghiệp vụ kho (stock-operations)**

---

### 2. Nhóm API chính trong module

#### 2.1. Quản lý chi nhánh & tồn kho theo chi nhánh

**File chính**: `branches/branchRoutes.js`, `branches/branchController.js`, `branch-inventory/branchInventoryController.js`, `branch-inventory/branchInventoryRoutes.js`

- **Thông tin chi nhánh (public/basic)**  
  - **GET `/api/branches`**
    - Mục đích: Lấy danh sách chi nhánh.
    - Query: `includeInventory`, `search`, `active`, `hasInventory`, `page`, `limit`, `sortBy`, `sortOrder`.
    - Access: Public (thông tin cơ bản), dùng cho khách hàng và UI chọn chi nhánh.
  - **GET `/api/branches/:id`**
    - Mục đích: Lấy chi tiết 1 chi nhánh, có thể kèm tổng quan tồn kho.
    - Query: `includeInventory`.
    - Access: Public (thông tin cơ bản).

- **Tồn kho theo chi nhánh (nested, hỗ trợ Public + Staff/Admin)**  
  (kết hợp `branchRoutes.js` + `branchInventoryController.js`)
  - **GET `/api/branches/:branchId/inventory`**
    - Mục đích: Xem danh sách tồn kho của một chi nhánh.
    - Query: `page`, `limit`, `sortBy`, `sortOrder`.
    - Access:
      - Public/Customer: chỉ thấy product info + `in_stock` (boolean).
      - Staff/Admin: thấy đầy đủ chi tiết tồn kho (inventory, batches đã mask phù hợp).
  - **GET `/api/branches/:branchId/inventory/:productId`**
    - Mục đích: Xem chi tiết tồn kho/batches của một sản phẩm tại chi nhánh.
    - Access:
      - Public/Customer: chỉ thấy thông tin sản phẩm cơ bản + `in_stock`.
      - Staff/Admin: danh sách batches, giá nhập (cost) được mask phù hợp role.
  - **GET `/api/branches/:branchId/inventory/alerts/expiring-soon`**
    - Mục đích: Danh sách lô hàng sắp hết hạn ở chi nhánh.
    - Access: Staff/Admin only.
  - **GET `/api/branches/:branchId/inventory/alerts/low-stock`**
    - Mục đích: Cảnh báo tồn kho thấp cho chi nhánh.
    - Query: `threshold`.
    - Access: Staff/Admin only.
  - **PUT `/api/branches/:branchId/inventory/:productId`**
    - Mục đích: Cập nhật thủ công số lượng tồn kho một sản phẩm tại chi nhánh.
    - Access: Staff chỉ được update chi nhánh của mình, Admin có thể ở mọi chi nhánh.

- **Quản lý chi nhánh (Admin-only)**  
  - **POST `/api/branches`**: Tạo chi nhánh mới.
  - **PUT `/api/branches/:id`**: Cập nhật thông tin chi nhánh.
  - **DELETE `/api/branches/:id`**: Xoá chi nhánh.

- **Global branch inventory (cross-branch)**  
  **File**: `branch-inventory/branchInventoryRoutes.js`, `branchInventoryController.js`
  - **GET `/api/branch-inventory`**
    - Mục đích: Danh sách record tồn kho, có thể filter theo `branchId`, `productId`.
    - Access: Admin/Staff; hỗ trợ cross-branch view.
  - **GET `/api/branch-inventory/alerts/low-stock`**
    - Mục đích: Cảnh báo low-stock trên toàn hệ thống.
    - Access: Admin/Staff.
  - **GET `/api/branch-inventory/:id`**
    - Mục đích: Xem chi tiết một record tồn kho.
    - Access: Admin/Staff.
  - **POST `/api/branch-inventory`**: Tạo record tồn kho mới (Admin).
  - **DELETE `/api/branch-inventory/:id`**: Xoá record tồn kho (Admin).
  - **Các hàm service/controller bổ sung:**
    - Lấy **tổng tồn kho** một sản phẩm trên tất cả chi nhánh.
    - Lấy tồn kho của 1 sản phẩm tại 1 chi nhánh.
    - Lấy **danh sách sản phẩm kèm tồn kho** (filter theo category, inStockOnly, branch).
    - Lấy **danh sách sản phẩm tồn kho thấp** toàn hệ thống.
    - Lấy **thống kê tồn kho theo chi nhánh**.

---

#### 2.2. Quản lý lô hàng / batch & FEFO

**File chính**: `product-batch/productBatchRoutes.js`, `productBatchController.js`

- **FEFO (First Expired First Out)**  
  - **GET `/api/product-batches/fefo/:branchId/:productId`**
    - Mục đích: Lấy danh sách batches theo thứ tự FEFO cho sản phẩm ở một chi nhánh.
    - Access: Admin/Staff; Staff chỉ xem được chi nhánh mình.
  - **POST `/api/product-batches/fefo/allocate`**
    - Mục đích: Tính toán plan phân bổ lô theo FEFO (preview trước khi xuất hàng).
    - Body: `branch_id`, `product_id`, `quantity`.
  - **POST `/api/product-batches/fefo/export`**
    - Mục đích: Thực hiện xuất kho theo chiến lược FEFO (cập nhật batch & inventory).
    - Body chứa thông tin chi nhánh và các dòng xuất.

- **Import & điều chỉnh lô**  
  - **POST `/api/product-batches/import`**
    - Mục đích: Nhập kho vào batch (tạo mới hoặc cộng thêm).
  - **POST `/api/product-batches/:id/add-stock`**
    - Mục đích: Cộng thêm số lượng vào một lô hiện có.

- **Thông tin & kiểm soát batch**  
  - **GET `/api/product-batches/summary/:branchId/:productId`**
    - Mục đích: Tổng quan lô theo trạng thái (available, reserved, expired, disposed, …) của 1 sản phẩm tại 1 chi nhánh.
  - **GET `/api/product-batches/validate/:branchId/:productId`**
    - Mục đích: Kiểm tra đồng bộ tồn kho giữa bảng batch và bảng inventory.
  - **POST `/api/product-batches/reconcile/:branchId/:productId`**
    - Mục đích: Thực hiện điều chỉnh tồn kho để đồng bộ giữa batches và inventory (Admin only).
  - **POST `/api/product-batches/auto-expire`**
    - Mục đích: Cron/manual endpoint auto gắn trạng thái hết hạn cho các batch.
  - **GET `/api/product-batches/generate-number/:productId/:branchId`**
    - Mục đích: Sinh mã lô hàng theo quy ước hệ thống.

- **CRUD & vận hành cơ bản batch**  
  - **GET `/api/product-batches`**: Danh sách lô hàng (filter & paging).
  - **GET `/api/product-batches/expiring-soon`**: Các lô sắp hết hạn.
  - **POST `/api/product-batches`**: Tạo lô hàng mới (thường từ nhập hàng nhà cung cấp).
  - **GET `/api/product-batches/:id`**: Chi tiết lô.
  - **PUT `/api/product-batches/:id`**: Cập nhật thông tin lô.
  - **POST `/api/product-batches/:id/expire`**: Đánh dấu lô hết hạn.
  - **POST `/api/product-batches/:id/dispose`**: Tiêu huỷ lô hết hạn, trừ tồn thực tế.
  - **DELETE `/api/product-batches/:id`**: Xoá lô (Admin).

---

#### 2.3. Chuyển kho nội bộ (Inventory Transfers)

**File chính**: `inventory-transfer/inventoryTransferRoutes.js`, `inventoryTransferController.js`

- **Danh sách & chi tiết phiếu chuyển kho**
  - **GET `/api/inventory-transfers`**
    - Mục đích: Lấy danh sách phiếu chuyển kho.
    - Query: `branchId`, `status`, `page`, `limit`.
  - **GET `/api/inventory-transfers/:id`**
    - Mục đích: Lấy chi tiết một phiếu chuyển kho.

- **Workflow chuyển kho**
  - **POST `/api/inventory-transfers`**
    - Mục đích: Tạo phiếu chuyển kho.
    - Ràng buộc: Staff chỉ được tạo phiếu từ chi nhánh của mình (`from_branch_id`).
  - **POST `/api/inventory-transfers/:id/approve`**
    - Mục đích: Duyệt phiếu chuyển kho (Admin).
  - **POST `/api/inventory-transfers/:id/ship`**
    - Mục đích: Xuất kho (từ chi nhánh nguồn).
    - Ràng buộc: Staff chỉ xuất từ chi nhánh của mình.
  - **POST `/api/inventory-transfers/:id/receive`**
    - Mục đích: Nhận kho tại chi nhánh đích.
    - Ràng buộc: Staff chỉ nhận vào chi nhánh của mình.
  - **POST `/api/inventory-transfers/:id/cancel`**
    - Mục đích: Huỷ phiếu chuyển kho (có lý do).
    - Ràng buộc: Staff chỉ huỷ phiếu của chi nhánh nguồn mình.

---

#### 2.4. Kiểm kê kho (Stock Takes)

**File chính**: `stock-take/stockTakeRoutes.js`, `stockTakeController.js`

- **Stock take workflow**
  - **POST `/api/stock-takes`**
    - Mục đích: Tạo phiếu kiểm kê mới.
    - Ràng buộc: Staff chỉ tạo kiểm kê cho chi nhánh của mình.
  - **GET `/api/stock-takes`**
    - Mục đích: Lấy danh sách phiếu kiểm kê.
  - **GET `/api/stock-takes/:id`**
    - Mục đích: Lấy chi tiết 1 phiếu kiểm kê.
  - **GET `/api/stock-takes/:id/items`**
    - Mục đích: Lấy danh sách các dòng kiểm kê của phiếu.
  - **PUT `/api/stock-takes/:id/items/:itemId`**
    - Mục đích: Cập nhật số lượng thực tế cho một dòng kiểm kê.
  - **POST `/api/stock-takes/:id/complete`**
    - Mục đích: Hoàn thành phiếu kiểm kê (thường trigger điều chỉnh tồn kho).
  - **POST `/api/stock-takes/:id/cancel`**
    - Mục đích: Huỷ phiếu kiểm kê (cần reason).
  - **DELETE `/api/stock-takes/:id`**
    - Mục đích: Xoá phiếu kiểm kê.

---

#### 2.5. Đơn đặt hàng nhà cung cấp & nhập kho

**File chính**: `supplier-order/supplierOrderRoutes.js`, `supplierOrderService.js`

- **Quản lý đơn NCC**
  - **GET `/api/supplier-orders`**
    - Mục đích: Danh sách đơn đặt hàng NCC (filter/paging).
    - Access: Admin/Staff.
  - **GET `/api/supplier-orders/statistics`**
    - Mục đích: Thống kê đơn NCC (theo trạng thái, NCC, thời gian, …).
    - Access: Admin.
  - **GET `/api/supplier-orders/:id`**
    - Mục đích: Chi tiết đơn NCC.

- **Workflow đơn NCC**
  - **POST `/api/supplier-orders`**
    - Mục đích: Tạo đơn đặt hàng NCC.
  - **PATCH `/api/supplier-orders/:id/status`**
    - Mục đích: Cập nhật trạng thái đơn (`pending`, `approved`, `shipped`, `received`, `cancelled`), có thể kèm `receivedItems`.
  - **POST `/api/supplier-orders/:id/receive`**
    - Mục đích: Nhận hàng từ NCC và **tự động nhập kho** (import vào inventory/batch).
  - **POST `/api/supplier-orders/:id/cancel`**
    - Mục đích: Huỷ đơn NCC (có lý do).

---

#### 2.6. Health check & tính nhất quán tồn kho

**File chính**: `inventoryHealthCheckRoutes.js`, `inventoryHealthCheck.js`

- **Health & consistency**
  - **GET `/api/inventory/health`**
    - Mục đích: Tổng quan sức khoẻ hệ thống tồn kho (các loại cảnh báo chính).
  - **GET `/api/inventory/health/branch/:branchId`**
    - Mục đích: Kiểm tra consistency tồn kho cho 1 chi nhánh.
  - **GET `/api/inventory/health/logs/:branchId/:productId`**
    - Mục đích: Kiểm tra consistency log tồn kho của 1 sản phẩm tại 1 chi nhánh.
  - **GET `/api/inventory/health/reservations`**
    - Mục đích: Kiểm tra các reservation bị kẹt.
  - **POST `/api/inventory/health/reservations/fix`**
    - Mục đích: Auto-fix các reservation bị kẹt (Admin).

---

#### 2.7. Hub điều phối nghiệp vụ kho (Stock Operations)

**File chính**: `stock-operations/stockOperationsRoutes.js`

- **Tài liệu tổng quan**
  - **GET `/api/stock-operations`**
    - Mục đích: Trả về JSON mô tả các flow chính:
      - Import (product-batches)
      - Transfer (inventory-transfers)
      - StockTake (stock-takes)
      - Inventory view (branch-inventory + product-batches)

- **Deprecated redirect endpoints**
  - **POST `/api/stock-operations/import`** → hướng dẫn dùng `POST /api/product-batches`.
  - **POST `/api/stock-operations/transfer`** → hướng dẫn dùng `POST /api/inventory-transfers`.

---

### 3. Thống kê tồn kho (Inventory Statistics)

Dù nằm ở module `statistics/inventory`, nhưng phục vụ trực tiếp nghiệp vụ inventory.

**File chính**: `statistics/inventory/inventoryStatisticsRoutes.js`

- **Các endpoint chính**
  - **GET `/api/statistics/inventory/overview`**: Tổng quan tồn kho toàn hệ thống.
  - **GET `/api/statistics/inventory/branch/:branchId`**: Thống kê tồn kho theo chi nhánh.
  - **GET `/api/statistics/inventory/low-stock`**: Sản phẩm low-stock (góc nhìn thống kê).
  - **GET `/api/statistics/inventory/overstock`**: Sản phẩm overstock.
  - **GET `/api/statistics/inventory/movements`**: Báo cáo luân chuyển tồn kho (import, export, chuyển kho, điều chỉnh…).
  - **GET `/api/statistics/inventory/top-imported`** / **`top-exported`** / **`by-category`**: Báo cáo phân tích sâu theo nhóm.

---

### 4. Nhận xét tổng quan

- Module `inventory-management` đã bao phủ hầu hết **quy trình nghiệp vụ kho chuẩn**:
  - Nhập hàng từ NCC, nhập điều chỉnh, import batch.
  - Xuất kho (bán hàng, chuyển kho, tiêu huỷ, hết hạn) với chiến lược FEFO.
  - Chuyển kho nội bộ với workflow nhiều bước.
  - Kiểm kê, điều chỉnh chênh lệch, reconciliation giữa batch & inventory.
  - Health-check, reservation check/fix, cảnh báo low-stock & expiring.
  - Thống kê & báo cáo ở nhiều góc độ (theo chi nhánh, theo category, theo movement).

- Một số nhóm API nâng cao có thể bổ sung (không bắt buộc, tuỳ business):
  - **Cấu hình tồn kho per product-branch**: min/max stock, safety stock, reorder point.
  - **Audit log / inventory ledger chi tiết** cho từng sản phẩm-chi nhánh.
  - **Quản lý reservation ở mức API riêng** (list, filter, manual release).
  - **Bulk operations** (bulk adjust/import cho data migration hoặc upload Excel).
  - **Public availability cross-branch** (còn hàng ở chi nhánh nào gần khách, kết hợp location/shipping).

Tài liệu này có thể dùng làm nền tảng để viết thêm API spec chi tiết (request/response schema, ví dụ JSON, error codes) hoặc làm đầu vào cho việc sync với team FE/QA.