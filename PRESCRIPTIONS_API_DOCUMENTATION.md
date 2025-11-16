# Prescriptions API Documentation

## ✅ Module hoàn thành

Prescription Management Module đã được implement thành công với các tính năng:

- ✅ Upload prescription (image/PDF)
- ✅ Auto generate prescription number
- ✅ Pharmacist verification workflow
- ✅ Auto expiry checking
- ✅ Link with orders (optional)
- ✅ Customer prescription history
- ✅ Statistics dashboard (Admin)
- ✅ Role-based access control

## 📂 Cấu trúc files

```
src/modules/medical/prescriptions/
├── prescriptionService.js      # Business logic (500+ lines)
├── prescriptionController.js   # HTTP request handlers
└── prescriptionRoutes.js       # Route definitions

prisma/schema.prisma            # Updated with prescriptions model
```

## 🗄️ Database Migration Required

**IMPORTANT:** Sau khi pull code, cần chạy migration để tạo bảng `prescriptions`:

```bash
npx prisma migrate dev --name add_prescriptions_table
npx prisma generate
```

## 📋 Database Schema

```sql
model prescriptions {
  id                  Int       @id @default(autoincrement())
  customer_id         Int       (FK → customers)
  order_id            Int?      (FK → orders, optional)
  prescription_number String?   UNIQUE (auto-generated: RX12345678ABCD)
  doctor_name         String?
  doctor_license      String?
  hospital_name       String?
  diagnosis           String?
  prescribed_date     Date?
  expiry_date         Date?     (auto: prescribed_date + 30 days)
  image_url           String?   (prescription image)
  pdf_url             String?   (prescription PDF)
  status              String    (pending/verified/rejected/expired)
  verified_by         Int?      (FK → users, pharmacist/admin)
  verified_at         Timestamp?
  verification_notes  String?
  created_at          Timestamp
  updated_at          Timestamp
}
```

## 🔐 Authentication

Tất cả endpoints yêu cầu authentication token trong header:

```
Authorization: Bearer <access_token>
```

## 📋 API Endpoints

### 1. Upload Prescription

**Endpoint:** `POST /api/prescriptions`

**Access:** Authenticated users (Customer)

**Request Body:**
```json
{
  "customerId": 5,
  "orderId": 123,
  "doctorName": "Dr. Nguyen Van A",
  "doctorLicense": "BYT-12345",
  "hospitalName": "Bệnh viện Chợ Rẫy",
  "diagnosis": "Viêm họng cấp",
  "prescribedDate": "2025-01-15",
  "expiryDate": "2025-02-15",
  "imageUrl": "https://storage.example.com/prescriptions/img123.jpg",
  "pdfUrl": "https://storage.example.com/prescriptions/rx123.pdf"
}
```

**Required Fields:**
- `customerId` (number)
- `imageUrl` OR `pdfUrl` (at least one)

**Optional Fields:**
- `orderId` - Link prescription to specific order
- `doctorName`, `doctorLicense`, `hospitalName`
- `diagnosis`
- `prescribedDate` - Date prescribed
- `expiryDate` - Auto-calculated if not provided (prescribed_date + 30 days)

**Example Request:**
```bash
POST /api/prescriptions
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
  "customerId": 5,
  "imageUrl": "https://storage.example.com/rx-image.jpg",
  "doctorName": "Dr. Nguyen Van A",
  "prescribedDate": "2025-01-15"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "customer_id": 5,
    "order_id": null,
    "prescription_number": "RX1234567890ABCD",
    "doctor_name": "Dr. Nguyen Van A",
    "doctor_license": null,
    "hospital_name": null,
    "diagnosis": null,
    "prescribed_date": "2025-01-15T00:00:00Z",
    "expiry_date": "2025-02-14T00:00:00Z",
    "image_url": "https://storage.example.com/rx-image.jpg",
    "pdf_url": null,
    "status": "pending",
    "verified_by": null,
    "verified_at": null,
    "verification_notes": null,
    "created_at": "2025-01-16T10:00:00Z",
    "updated_at": "2025-01-16T10:00:00Z",
    "customers": {
      "id": 5,
      "full_name": "Nguyen Van B",
      "email": "nguyenvanb@email.com",
      "phone": "0901234567"
    },
    "orders": null
  },
  "message": "Upload đơn thuốc thành công. Đơn thuốc đang chờ xác minh."
}
```

**Business Logic:**
- ✅ **Auto generate prescription_number** - Format: RX + timestamp + random
- ✅ **Auto calculate expiry_date** - prescribed_date + 30 days
- ✅ **Initial status** - Always "pending"
- ✅ **Validate order ownership** - If orderId provided, must belong to customer
- ✅ **Require file** - At least imageUrl OR pdfUrl must be provided

---

### 2. Get Prescription Statistics

**Endpoint:** `GET /api/prescriptions/statistics`

**Access:** Admin only

**Query Parameters:**
- `startDate` (optional) - YYYY-MM-DD
- `endDate` (optional) - YYYY-MM-DD

**Example Request:**
```bash
GET /api/prescriptions/statistics?startDate=2025-01-01&endDate=2025-01-31
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalPrescriptions": 150,
    "prescriptionsByStatus": {
      "pending": 25,
      "verified": 100,
      "rejected": 15,
      "expired": 10
    },
    "verificationRate": "66.67%"
  }
}
```

---

### 3. Check Expired Prescriptions

**Endpoint:** `POST /api/prescriptions/check-expired`

**Access:** Admin only

**Purpose:** Cron job endpoint để auto-update expired prescriptions

**Example Request:**
```bash
POST /api/prescriptions/check-expired
Authorization: Bearer ADMIN_TOKEN
```

**Response:**
```json
{
  "success": true,
  "data": {
    "count": 5
  },
  "message": "Đã cập nhật 5 đơn thuốc hết hạn"
}
```

**Business Logic:**
- ✅ Find all `verified` prescriptions where `expiry_date < now`
- ✅ Update status to `expired`
- ✅ Return count of updated prescriptions

**Recommended Cron Schedule:**
```javascript
// Daily at midnight
cron.schedule('0 0 * * *', async () => {
  await checkExpiredPrescriptions();
});
```

---

### 4. Get All Prescriptions

**Endpoint:** `GET /api/prescriptions`

**Access:** Admin, Staff only

**Query Parameters:**
- `page` (optional) - Default: 1
- `limit` (optional) - Default: 10
- `status` (optional) - Filter by status
- `customerId` (optional) - Filter by customer
- `startDate` (optional) - YYYY-MM-DD
- `endDate` (optional) - YYYY-MM-DD
- `sortBy` (optional) - Default: created_at
- `sortOrder` (optional) - asc/desc (default: desc)

**Example Request:**
```bash
GET /api/prescriptions?page=1&limit=20&status=pending
```

**Response:**
```json
{
  "success": true,
  "data": {
    "prescriptions": [
      {
        "id": 1,
        "prescription_number": "RX1234567890ABCD",
        "status": "pending",
        "prescribed_date": "2025-01-15T00:00:00Z",
        "expiry_date": "2025-02-14T00:00:00Z",
        "created_at": "2025-01-16T10:00:00Z",
        "customers": {
          "id": 5,
          "full_name": "Nguyen Van B",
          "phone": "0901234567"
        },
        "verified_by_user": null
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "totalPages": 3
    }
  }
}
```

---

### 5. Get Prescription by ID

**Endpoint:** `GET /api/prescriptions/:id`

**Access:** Admin, Staff, or Customer who owns the prescription

**Example Request:**
```bash
GET /api/prescriptions/1
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "customer_id": 5,
    "order_id": 123,
    "prescription_number": "RX1234567890ABCD",
    "doctor_name": "Dr. Nguyen Van A",
    "doctor_license": "BYT-12345",
    "hospital_name": "Bệnh viện Chợ Rẫy",
    "diagnosis": "Viêm họng cấp",
    "prescribed_date": "2025-01-15T00:00:00Z",
    "expiry_date": "2025-02-14T00:00:00Z",
    "image_url": "https://storage.example.com/rx-image.jpg",
    "pdf_url": null,
    "status": "verified",
    "verified_by": 2,
    "verified_at": "2025-01-16T14:00:00Z",
    "verification_notes": "Đơn thuốc hợp lệ",
    "created_at": "2025-01-16T10:00:00Z",
    "updated_at": "2025-01-16T14:00:00Z",
    "customers": {
      "id": 5,
      "full_name": "Nguyen Van B",
      "email": "nguyenvanb@email.com",
      "phone": "0901234567"
    },
    "orders": {
      "id": 123,
      "status": "confirmed",
      "order_date": "2025-01-15T09:00:00Z"
    },
    "verified_by_user": {
      "id": 2,
      "username": "pharmacist1",
      "full_name": "Dược sĩ Trần Thị C"
    }
  }
}
```

---

### 6. Get Customer's Prescriptions

**Endpoint:** `GET /api/customers/:customerId/prescriptions`

**Access:** Admin, Staff, or the Customer

**Query Parameters:**
- `page` (optional) - Default: 1
- `limit` (optional) - Default: 10
- `status` (optional) - Filter by status

**Example Request:**
```bash
GET /api/customers/5/prescriptions?status=verified
```

**Response:**
```json
{
  "success": true,
  "data": {
    "prescriptions": [
      {
        "id": 1,
        "prescription_number": "RX1234567890ABCD",
        "doctor_name": "Dr. Nguyen Van A",
        "prescribed_date": "2025-01-15T00:00:00Z",
        "expiry_date": "2025-02-14T00:00:00Z",
        "status": "verified",
        "image_url": "https://storage.example.com/rx-image.jpg",
        "orders": {
          "id": 123,
          "status": "confirmed"
        },
        "verified_by_user": {
          "full_name": "Dược sĩ Trần Thị C"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 12,
      "totalPages": 2
    }
  }
}
```

---

### 7. Verify Prescription (Pharmacist/Admin)

**Endpoint:** `POST /api/prescriptions/:id/verify`

**Access:** Admin, Staff (Pharmacist) only

**Request Body:**
```json
{
  "status": "verified",
  "verificationNotes": "Đơn thuốc hợp lệ, bác sĩ được cấp phép"
}
```

**Valid Statuses:**
- `verified` - Đơn thuốc hợp lệ
- `rejected` - Từ chối (không hợp lệ)

**Example Request:**
```bash
POST /api/prescriptions/1/verify
Content-Type: application/json
Authorization: Bearer PHARMACIST_TOKEN

{
  "status": "verified",
  "verificationNotes": "Đơn thuốc hợp lệ"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "status": "verified",
    "verified_by": 2,
    "verified_at": "2025-01-16T14:00:00Z",
    "verification_notes": "Đơn thuốc hợp lệ",
    "updated_at": "2025-01-16T14:00:00Z",
    "customers": {
      "id": 5,
      "full_name": "Nguyen Van B",
      "email": "nguyenvanb@email.com"
    },
    "verified_by_user": {
      "full_name": "Dược sĩ Trần Thị C"
    }
  },
  "message": "Xác minh đơn thuốc thành công"
}
```

**Business Logic:**
- ✅ **Only pending** - Chỉ verify prescriptions có status = "pending"
- ✅ **Record verifier** - Save user ID who verified
- ✅ **Timestamp** - Auto set verified_at
- ✅ **Notes** - Optional verification notes
- ✅ **Cannot re-verify** - Once verified/rejected, cannot change

---

## 🔄 Prescription Status Flow

```
Upload → pending
           ↓
    [Pharmacist reviews]
           ↓
    verified or rejected
           ↓
    [If verified & expiry_date passed]
           ↓
        expired
```

### Status Transitions:

| From | To | Trigger | Notes |
|------|-----|---------|-------|
| - | `pending` | Upload | Initial status |
| `pending` | `verified` | Pharmacist approval | Cannot revert |
| `pending` | `rejected` | Pharmacist rejection | Cannot revert |
| `verified` | `expired` | Cron job (daily) | Auto when expiry_date < now |

---

## 🔗 Integration with Products

### Prescription Required Products:

Products có field `prescription_required = true` cần prescription khi order:

**Workflow:**
```
1. Customer thêm thuốc kê đơn vào cart
2. At checkout, check if cart has prescription_required products
3. If yes, require valid prescription
4. Link prescription to order (prescription.order_id = order.id)
5. Pharmacist verifies prescription
6. Only process order if prescription verified
```

**Implementation Example:**
```javascript
// In checkout service
const hasRequires trong cart

Con items có prescription_required = true

if (hasRxProducts) {
  // Check customer has valid prescription
  const validRx = await prisma.prescriptions.findFirst({
    where: {
      customer_id: customerId,
      status: 'verified',
      expiry_date: { gte: new Date() }
    }
  });

  if (!validRx) {
    throw new Error('Cần đơn thuốc hợp lệ để mua thuốc kê đơn');
  }

  // Link prescription to order
  order.prescription_id = validRx.id;
}
```

---

## ⚠️ Error Responses

### 400 Bad Request - Missing Fields
```json
{
  "success": false,
  "error": "Cần upload ảnh hoặc PDF đơn thuốc"
}
```

### 400 Bad Request - Already Verified
```json
{
  "success": false,
  "error": "Đơn thuốc đã được verified"
}
```

### 403 Forbidden - Wrong Customer
```json
{
  "success": false,
  "error": "Đơn hàng không thuộc về khách hàng này"
}
```

### 404 Not Found - Customer
```json
{
  "success": false,
  "error": "Không tìm thấy khách hàng"
}
```

### 404 Not Found - Prescription
```json
{
  "success": false,
  "error": "Không tìm thấy đơn thuốc"
}
```

---

## 🧪 Testing với Postman/cURL

### 1. Upload prescription
```bash
curl -X POST http://localhost:3000/api/prescriptions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": 5,
    "imageUrl": "https://storage.example.com/rx-image.jpg",
    "doctorName": "Dr. Nguyen Van A",
    "prescribedDate": "2025-01-15"
  }'
```

### 2. Get customer prescriptions
```bash
curl -X GET "http://localhost:3000/api/customers/5/prescriptions" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Verify prescription (Pharmacist)
```bash
curl -X POST http://localhost:3000/api/prescriptions/1/verify \
  -H "Authorization: Bearer PHARMACIST_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "verified",
    "verificationNotes": "Đơn thuốc hợp lệ"
  }'
```

### 4. Check expired (Cron job)
```bash
curl -X POST http://localhost:3000/api/prescriptions/check-expired \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

---

## 📸 File Upload Integration

**Note:** This API expects image_url/pdf_url. You need to implement file upload separately.

### Recommended Approach:

**Option 1: Direct upload to cloud storage**
```javascript
// Client side
1. Upload file to AWS S3 / Cloudinary / Firebase Storage
2. Get file URL
3. Call POST /api/prescriptions with URL
```

**Option 2: Upload via backend**
```javascript
// Add file upload endpoint
POST /api/prescriptions/upload
- Use multer middleware
- Upload to cloud storage
- Return file URL
- Then call POST /api/prescriptions
```

### Example with Multer + AWS S3:
```javascript
import multer from 'multer';
import AWS from 'aws-sdk';

const upload = multer({ storage: multer.memoryStorage() });
const s3 = new AWS.S3();

router.post('/prescriptions/upload',
  authenticateToken,
  upload.single('file'),
  async (req, res) => {
    const params = {
      Bucket: 'your-bucket',
      Key: `prescriptions/${Date.now()}-${req.file.originalname}`,
      Body: req.file.buffer,
      ContentType: req.file.mimetype
    };

    const result = await s3.upload(params).promise();
    res.json({ url: result.Location });
  }
);
```

---

## 💡 Best Practices

### 1. Prescription Number
- ✅ Auto-generated unique format: `RX + timestamp + random`
- ✅ Always unique (database constraint)
- ✅ Easy to reference and track

### 2. Expiry Management
- ✅ Auto-calculate if not provided (prescribed_date + 30 days)
- ✅ Run cron job daily to check expired prescriptions
- ✅ Expired prescriptions cannot be used for orders

### 3. Verification Workflow
- ✅ All uploaded prescriptions start as "pending"
- ✅ Only pharmacist/admin can verify
- ✅ Once verified/rejected, cannot change
- ✅ Record who verified and when

### 4. Privacy & Security
- ✅ Customers can only see their own prescriptions
- ✅ Pharmacist/Admin can see all
- ✅ Secure file storage (HTTPS URLs)
- ✅ Audit trail (verified_by, verified_at)

---

## 🎯 Use Cases

### Customer Perspective:
1. Upload prescription image before ordering Rx drugs
2. View prescription history
3. Check verification status
4. Link prescription to specific order

### Pharmacist Perspective:
1. View pending prescriptions queue
2. Review prescription details
3. Verify or reject with notes
4. Track verification history

### Admin Perspective:
1. View all prescriptions
2. Monitor verification rate
3. Run expired checks
4. Generate statistics

---

## 📋 API Endpoints Summary

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/prescriptions` | Customer | Upload prescription |
| GET | `/prescriptions/statistics` | Admin | Get statistics |
| POST | `/prescriptions/check-expired` | Admin | Check expired (cron) |
| GET | `/prescriptions` | Admin, Staff | List all prescriptions |
| GET | `/prescriptions/:id` | Admin, Staff, Owner | Get details |
| GET | `/customers/:id/prescriptions` | Admin, Staff, Owner | Customer prescriptions |
| POST | `/prescriptions/:id/verify` | Admin, Staff | Verify/Reject |

---

**Created:** 2025-01-16
**Version:** 1.0.0
**Status:** ✅ Ready for Testing (After Migration)

---

## ⚠️ DEPLOYMENT CHECKLIST

Before deploying to production:

- [ ] Run `npx prisma migrate dev` to create prescriptions table
- [ ] Setup file upload service (S3/Cloudinary)
- [ ] Setup cron job for expired checks
- [ ] Test prescription upload with real images
- [ ] Test pharmacist verification workflow
- [ ] Configure file size limits
- [ ] Setup backup for prescription files
- [ ] Test prescription + order integration

---

## ⏭️ Next Module

**FAQs Module** - Medical Q&A and knowledge base
