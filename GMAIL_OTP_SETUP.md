# 📧 HƯỚNG DẪN SETUP GMAIL ĐỂ GỬI OTP

## 🎯 Tại sao dùng Gmail?

✅ **MIỄN PHÍ 100%** - Không mất tiền
✅ **DỄ SETUP** - Chỉ 5 phút
✅ **ỔN ĐỊNH** - Hạ tầng của Google
✅ **KHÔNG CẦN API KEY** trả phí

---

## 📝 BƯỚC 1: TẠO APP PASSWORD

### 1.1. Đăng nhập Gmail

- Vào: https://myaccount.google.com/
- Đăng nhập tài khoản Gmail của bạn

### 1.2. Bật xác thực 2 bước (bắt buộc)

1. Vào: **Security** (Bảo mật)
2. Tìm **2-Step Verification** (Xác minh 2 bước)
3. Bật nó lên nếu chưa bật

### 1.3. Tạo App Password

1. Vào: https://myaccount.google.com/apppasswords
2. Trong **Select app**, chọn **Mail**
3. Trong **Select device**, chọn **Other (Custom name)**
4. Nhập tên: `PBL6 Pharmacy OTP`
5. Click **Generate**
6. **COPY mã 16 ký tự** xuất hiện (dạng: `xxxx xxxx xxxx xxxx`)

⚠️ **LƯU Ý:** Mã này chỉ hiện 1 lần, hãy copy ngay!

---

## 🔧 BƯỚC 2: CẤU HÌNH .ENV

Mở file `.env` và thêm:

```env
# Email Service - Gmail SMTP (for OTP)
EMAIL_USER=your_email@gmail.com
EMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
```

**Thay thế:**

- `your_email@gmail.com` → Email Gmail của bạn
- `xxxx xxxx xxxx xxxx` → App Password vừa tạo (16 ký tự, **GIỮ NGUYÊN DẤU CÁCH**)

**VÍ DỤ:**

```env
EMAIL_USER=pbl6pharmacy@gmail.com
EMAIL_APP_PASSWORD=abcd efgh ijkl mnop
```

---

## 🚀 BƯỚC 3: TEST

### Test gửi OTP qua Email:

```bash
POST http://localhost:3000/api/auth/otp/request
Content-Type: application/json

{
  "email": "customer@gmail.com"
}
```

**Kết quả:**

- ✅ Email sẽ đến hộp thư `customer@gmail.com` trong vài giây
- ✅ Email có thiết kế đẹp với mã OTP 6 số
- ✅ Mã có hiệu lực 5 phút

---

## 📊 API ENDPOINTS

### 1️⃣ Request OTP (Gửi qua Email hoặc Phone)

```bash
POST /api/auth/otp/request

# Gửi qua EMAIL (THẬT - miễn phí):
{
  "email": "customer@gmail.com"
}

# Gửi qua PHONE (MOCK - chưa thật):
{
  "phone": "0912345678"
}

# Hoặc cả 2 (ưu tiên email):
{
  "email": "customer@gmail.com",
  "phone": "0912345678"
}
```

### 2️⃣ Verify OTP

```bash
POST /api/auth/otp/verify

{
  "email": "customer@gmail.com",
  "otp": "123456"
}

# Hoặc với phone:
{
  "phone": "0912345678",
  "otp": "123456"
}
```

### 3️⃣ Login với OTP

```bash
POST /api/auth/customer/login-otp

# Login bằng PHONE + OTP:
{
  "phone": "0912345678",
  "otp": "123456"
}

# Login bằng EMAIL + OTP:
{
  "email": "customer@gmail.com",
  "otp": "123456"
}

# Hoặc cả 2:
{
  "phone": "0912345678",
  "email": "customer@gmail.com",
  "otp": "123456"
}
```

---

## ⚠️ TROUBLESHOOTING

### Lỗi: "Invalid login"

- ✅ Kiểm tra EMAIL_USER đúng chưa
- ✅ Kiểm tra đã bật 2-Step Verification chưa
- ✅ Tạo lại App Password

### Lỗi: "Invalid password"

- ✅ Kiểm tra EMAIL_APP_PASSWORD đúng chưa (16 ký tự)
- ✅ Copy lại App Password (không dùng password Gmail thường)

### Email không đến

- ✅ Kiểm tra spam folder
- ✅ Chờ vài giây
- ✅ Kiểm tra log server: `✅ OTP email sent to...`

### Development mode

- Nếu chưa config EMAIL, sẽ in OTP ra console:
  ```
  ✅ [DEV MODE] OTP Email: 123456 → customer@gmail.com
  ```

---

## 🎨 EMAIL TEMPLATE

Email OTP được gửi có giao diện đẹp:

- 📱 Responsive (hiển thị tốt trên mobile)
- 🎨 Gradient header đẹp mắt
- 🔢 Mã OTP rõ ràng, dễ đọc
- ⏰ Thông báo thời gian hết hạn
- 🔒 Thông báo bảo mật

---

## 💡 BEST PRACTICES

### 1. Bảo mật

- ❌ **KHÔNG** commit `.env` lên Git
- ✅ Thêm `.env` vào `.gitignore`
- ✅ Dùng email riêng cho dự án (không dùng email cá nhân)

### 2. Giới hạn

- Gmail cho phép gửi **500 email/ngày** (miễn phí)
- Nếu vượt quota → Dùng SendGrid (100 email/ngày free)

### 3. Production

- ✅ Tạo email domain riêng: `noreply@pbl6pharmacy.com`
- ✅ Dùng service chuyên nghiệp: SendGrid, AWS SES
- ✅ Setup DKIM, SPF để tránh spam

---

## 📚 TÀI LIỆU THAM KHẢO

- [Google App Passwords](https://support.google.com/accounts/answer/185833)
- [Nodemailer Gmail Guide](https://nodemailer.com/usage/using-gmail/)
- [Gmail Sending Limits](https://support.google.com/a/answer/166852)

---

## ✅ CHECKLIST

- [ ] Bật 2-Step Verification
- [ ] Tạo App Password
- [ ] Thêm EMAIL_USER vào .env
- [ ] Thêm EMAIL_APP_PASSWORD vào .env
- [ ] Restart server
- [ ] Test gửi OTP qua email
- [ ] Kiểm tra email đến hộp thư
