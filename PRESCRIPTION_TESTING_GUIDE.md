# Prescription Module Testing Guide

## 🚀 BƯỚC 1: Chuẩn bị môi trường

### 1.1. Setup Environment Variables

Nếu chưa có file `.env`, tạo từ template:

```bash
cp .env.example .env
```

Cập nhật DATABASE_URL trong `.env`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/pharmacy_db?schema=public"
```

### 1.2. Install Dependencies (nếu chưa có)

```bash
npm install
```

---

## 🗄️ BƯỚC 2: Run Database Migration

### 2.1. Create Migration

**QUAN TRỌNG:** Lệnh này sẽ tạo bảng `prescriptions` trong database:

```bash
npx prisma migrate dev --name add_prescriptions_table
```

**Kết quả mong đợi:**
```
✔ Generated Prisma Client
✔ The migration has been created successfully
✔ Database schema updated
```

### 2.2. Generate Prisma Client

```bash
npx prisma generate
```

### 2.3. Verify Database

Kiểm tra bảng đã được tạo:

```bash
npx prisma studio
```

Mở browser tại `http://localhost:5555` và kiểm tra:
- ✅ Bảng `prescriptions` đã tồn tại
- ✅ Có các fields: id, customer_id, prescription_number, status, etc.
- ✅ Relations với customers, orders, users

---

## ▶️ BƯỚC 3: Start Server

### 3.1. Start Backend Server

```bash
npm run dev
```

**Kết quả mong đợi:**
```
🚀 Server running on port 3000
🌍 Environment: development
📡 API URL: http://localhost:3000/api
```

### 3.2. Verify Server

```bash
curl http://localhost:3000/health
```

**Response:**
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2025-01-16T..."
}
```

---

## 🧪 BƯỚC 4: Test API Endpoints

### 4.1. Get Authentication Token

**Login as Admin:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "your_password"
  }'
```

**Lưu accessToken:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "..."
  }
}
```

**Set token as environment variable:**
```bash
export TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

### 4.2. Test 1: Upload Prescription ✅

**Scenario:** Customer uploads prescription

```bash
curl -X POST http://localhost:3000/api/prescriptions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": 1,
    "doctorName": "Dr. Nguyen Van A",
    "doctorLicense": "BYT-12345",
    "hospitalName": "Bệnh viện Chợ Rẫy",
    "diagnosis": "Viêm họng cấp",
    "prescribedDate": "2025-01-15",
    "imageUrl": "https://example.com/prescription-image.jpg"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "customer_id": 1,
    "prescription_number": "RX1234567890ABCD",
    "doctor_name": "Dr. Nguyen Van A",
    "status": "pending",
    "prescribed_date": "2025-01-15T00:00:00Z",
    "expiry_date": "2025-02-14T00:00:00Z",
    "image_url": "https://example.com/prescription-image.jpg",
    ...
  },
  "message": "Upload đơn thuốc thành công. Đơn thuốc đang chờ xác minh."
}
```

**Verify:**
- ✅ prescription_number được auto-generate (format: RX...)
- ✅ status = "pending"
- ✅ expiry_date = prescribed_date + 30 days
- ✅ Returns full prescription details

---

### 4.3. Test 2: Get All Prescriptions (Admin) ✅

```bash
curl -X GET "http://localhost:3000/api/prescriptions?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "prescriptions": [
      {
        "id": 1,
        "prescription_number": "RX1234567890ABCD",
        "status": "pending",
        ...
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

**Verify:**
- ✅ Returns paginated list
- ✅ Includes customer info
- ✅ Filter by status works

---

### 4.4. Test 3: Get Prescription by ID ✅

```bash
curl -X GET http://localhost:3000/api/prescriptions/1 \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "prescription_number": "RX1234567890ABCD",
    "status": "pending",
    "customers": {
      "full_name": "...",
      "email": "...",
      "phone": "..."
    },
    "verified_by_user": null,
    ...
  }
}
```

**Verify:**
- ✅ Returns full details
- ✅ Includes customer info
- ✅ Includes verified_by_user (if verified)

---

### 4.5. Test 4: Get Customer Prescriptions ✅

```bash
curl -X GET http://localhost:3000/api/customers/1/prescriptions \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "prescriptions": [
      {
        "id": 1,
        "prescription_number": "RX1234567890ABCD",
        "status": "pending",
        ...
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

**Verify:**
- ✅ Only shows prescriptions of specified customer
- ✅ Sorted by created_at desc
- ✅ Pagination works

---

### 4.6. Test 5: Verify Prescription (Pharmacist) ✅

**Scenario:** Pharmacist approves prescription

```bash
curl -X POST http://localhost:3000/api/prescriptions/1/verify \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "verified",
    "verificationNotes": "Đơn thuốc hợp lệ. Bác sĩ được cấp phép."
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "status": "verified",
    "verified_by": 2,
    "verified_at": "2025-01-16T14:00:00Z",
    "verification_notes": "Đơn thuốc hợp lệ. Bác sĩ được cấp phép.",
    "verified_by_user": {
      "full_name": "Dược sĩ Trần Thị C"
    },
    ...
  },
  "message": "Xác minh đơn thuốc thành công"
}
```

**Verify:**
- ✅ Status changed to "verified"
- ✅ verified_by = current user ID
- ✅ verified_at timestamp set
- ✅ verification_notes saved

---

### 4.7. Test 6: Reject Prescription ✅

**Scenario:** Pharmacist rejects invalid prescription

```bash
# Upload another prescription first
curl -X POST http://localhost:3000/api/prescriptions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": 1,
    "imageUrl": "https://example.com/prescription2.jpg"
  }'

# Then reject it
curl -X POST http://localhost:3000/api/prescriptions/2/verify \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "rejected",
    "verificationNotes": "Chữ ký bác sĩ không rõ ràng"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "status": "rejected",
    "verified_by": 2,
    "verified_at": "2025-01-16T14:05:00Z",
    "verification_notes": "Chữ ký bác sĩ không rõ ràng",
    ...
  },
  "message": "Từ chối đơn thuốc"
}
```

**Verify:**
- ✅ Status changed to "rejected"
- ✅ Cannot be used for orders
- ✅ Rejection reason saved

---

### 4.8. Test 7: Check Expired Prescriptions (Cron) ✅

**Scenario:** Manually trigger expired check

```bash
curl -X POST http://localhost:3000/api/prescriptions/check-expired \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "count": 0
  },
  "message": "Đã cập nhật 0 đơn thuốc hết hạn"
}
```

**To test expiry logic:**
1. Upload prescription với `expiryDate` in the past:
```bash
curl -X POST http://localhost:3000/api/prescriptions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": 1,
    "imageUrl": "https://example.com/prescription3.jpg",
    "prescribedDate": "2024-12-01",
    "expiryDate": "2024-12-31"
  }'
```

2. Verify it:
```bash
curl -X POST http://localhost:3000/api/prescriptions/3/verify \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "verified"}'
```

3. Run expired check:
```bash
curl -X POST http://localhost:3000/api/prescriptions/check-expired \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "count": 1
  },
  "message": "Đã cập nhật 1 đơn thuốc hết hạn"
}
```

**Verify:**
- ✅ Prescription #3 status changed from "verified" to "expired"
- ✅ Count is correct

---

### 4.9. Test 8: Get Statistics (Admin) ✅

```bash
curl -X GET "http://localhost:3000/api/prescriptions/statistics" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "totalPrescriptions": 3,
    "prescriptionsByStatus": {
      "pending": 0,
      "verified": 1,
      "rejected": 1,
      "expired": 1
    },
    "verificationRate": "33.33%"
  }
}
```

**Verify:**
- ✅ Total count correct
- ✅ Breakdown by status correct
- ✅ Verification rate calculated (verified / total)

---

## 🔍 BƯỚC 5: Error Handling Tests

### 5.1. Test Missing Required Fields

```bash
curl -X POST http://localhost:3000/api/prescriptions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": 1
  }'
```

**Expected:** 400 Bad Request
```json
{
  "success": false,
  "error": "Cần upload ảnh hoặc PDF đơn thuốc"
}
```

---

### 5.2. Test Invalid Customer

```bash
curl -X POST http://localhost:3000/api/prescriptions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": 99999,
    "imageUrl": "https://example.com/rx.jpg"
  }'
```

**Expected:** 404 Not Found
```json
{
  "success": false,
  "error": "Không tìm thấy khách hàng"
}
```

---

### 5.3. Test Re-verify Already Verified

```bash
# Try to verify prescription #1 again
curl -X POST http://localhost:3000/api/prescriptions/1/verify \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "verified"
  }'
```

**Expected:** 400 Bad Request
```json
{
  "success": false,
  "error": "Đơn thuốc đã được verified"
}
```

---

### 5.4. Test Invalid Verification Status

```bash
curl -X POST http://localhost:3000/api/prescriptions/1/verify \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "invalid_status"
  }'
```

**Expected:** 400 Bad Request
```json
{
  "success": false,
  "error": "Trạng thái phải là \"verified\" hoặc \"rejected\""
}
```

---

## 📊 BƯỚC 6: Verify Database State

### 6.1. Check via Prisma Studio

```bash
npx prisma studio
```

Open `http://localhost:5555` and verify:

**prescriptions table:**
- ✅ Has records with auto-generated prescription_number
- ✅ Status values: pending, verified, rejected, expired
- ✅ verified_by links to users table
- ✅ customer_id links to customers table
- ✅ Timestamps are correct

---

### 6.2. Direct Database Query

```bash
# Install psql if not already
# Then connect:
psql "postgresql://user:password@localhost:5432/pharmacy_db"

# Query prescriptions
SELECT
  id,
  prescription_number,
  status,
  customer_id,
  verified_by,
  created_at
FROM prescriptions
ORDER BY created_at DESC;
```

**Verify:**
- ✅ prescription_number is unique
- ✅ Status values are correct
- ✅ Foreign keys work (customer_id, verified_by)

---

## ✅ TESTING CHECKLIST

### API Functionality
- [ ] Upload prescription with all fields
- [ ] Upload prescription with minimal fields (only customerId + imageUrl)
- [ ] Auto-generate prescription_number (format: RX...)
- [ ] Auto-calculate expiry_date (prescribed_date + 30 days)
- [ ] Get all prescriptions (pagination works)
- [ ] Get prescription by ID
- [ ] Get customer prescriptions (filtered)
- [ ] Filter by status (pending, verified, etc.)
- [ ] Verify prescription (status → verified)
- [ ] Reject prescription (status → rejected)
- [ ] Check expired prescriptions (cron endpoint)
- [ ] Get statistics (counts & rates)

### Business Logic
- [ ] Cannot re-verify already verified prescription
- [ ] Cannot re-verify already rejected prescription
- [ ] Expired check only affects verified prescriptions
- [ ] Verification records user who verified
- [ ] Verification timestamp is set correctly
- [ ] Prescription linked to order (optional)
- [ ] Only valid statuses accepted (verified/rejected)

### Error Handling
- [ ] Missing customerId → 400 error
- [ ] Missing imageUrl AND pdfUrl → 400 error
- [ ] Invalid customerId → 404 error
- [ ] Invalid prescriptionId → 404 error
- [ ] Invalid verification status → 400 error
- [ ] Already verified → 400 error

### Security
- [ ] Authentication required for all endpoints
- [ ] Customer can only see their own prescriptions
- [ ] Admin/Staff can see all prescriptions
- [ ] Only Admin/Staff can verify prescriptions

### Performance
- [ ] Pagination works with large dataset
- [ ] Queries are efficient (check with EXPLAIN)
- [ ] Indexes exist on customer_id, status

---

## 🐛 Common Issues & Solutions

### Issue 1: Migration fails

**Error:**
```
Error: P3018: A migration failed to apply...
```

**Solution:**
```bash
# Reset database (WARNING: This deletes all data!)
npx prisma migrate reset

# Or manually drop prescriptions table
psql -d pharmacy_db -c "DROP TABLE IF EXISTS prescriptions CASCADE;"

# Then re-run migration
npx prisma migrate dev --name add_prescriptions_table
```

---

### Issue 2: Prisma Client not updated

**Error:**
```
PrismaClient validation error: Invalid `prisma.prescriptions.create()` invocation
```

**Solution:**
```bash
npx prisma generate
```

---

### Issue 3: Token expired

**Error:**
```json
{
  "success": false,
  "error": "Token đã hết hạn"
}
```

**Solution:**
```bash
# Login again to get new token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "your_password"}'

# Update TOKEN variable
export TOKEN="new_token_here"
```

---

### Issue 4: Port 3000 already in use

**Error:**
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solution:**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or change port in .env
PORT=3001
```

---

## 📝 Test Results Template

Use this template to document your test results:

```markdown
# Prescription Module Test Results

**Date:** 2025-01-16
**Tester:** [Your Name]
**Environment:** Development

## Test Summary
- Total Tests: 13
- Passed: __
- Failed: __
- Skipped: __

## Detailed Results

### 1. Upload Prescription
- Status: [ ] PASS / [ ] FAIL
- Notes: ___

### 2. Get All Prescriptions
- Status: [ ] PASS / [ ] FAIL
- Notes: ___

### 3. Get Prescription by ID
- Status: [ ] PASS / [ ] FAIL
- Notes: ___

### 4. Get Customer Prescriptions
- Status: [ ] PASS / [ ] FAIL
- Notes: ___

### 5. Verify Prescription
- Status: [ ] PASS / [ ] FAIL
- Notes: ___

### 6. Reject Prescription
- Status: [ ] PASS / [ ] FAIL
- Notes: ___

### 7. Check Expired
- Status: [ ] PASS / [ ] FAIL
- Notes: ___

### 8. Get Statistics
- Status: [ ] PASS / [ ] FAIL
- Notes: ___

### 9-13. Error Handling Tests
- Missing fields: [ ] PASS / [ ] FAIL
- Invalid customer: [ ] PASS / [ ] FAIL
- Re-verify: [ ] PASS / [ ] FAIL
- Invalid status: [ ] PASS / [ ] FAIL

## Issues Found
1. ___
2. ___

## Recommendations
1. ___
2. ___
```

---

## 🎯 Next Steps After Testing

Once all tests pass:

1. [ ] Document any bugs found
2. [ ] Fix critical issues
3. [ ] Setup file upload service (for real image/PDF uploads)
4. [ ] Setup cron job for expired check
5. [ ] Integrate with order checkout flow
6. [ ] Move to production testing

---

**Testing Guide Version:** 1.0.0
**Last Updated:** 2025-01-16
