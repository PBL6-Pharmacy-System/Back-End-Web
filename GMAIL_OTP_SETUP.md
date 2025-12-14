# 🔧 HƯỚNG DẪN CẤU HÌNH GMAIL OTP

## Bước 1: Tạo App Password cho Gmail

1. Truy cập: https://myaccount.google.com/apppasswords
2. Đăng nhập bằng tài khoản Gmail của bạn
3. Chọn "Mail" và "Windows Computer" (hoặc Other)
4. Click "Generate" để tạo mật khẩu ứng dụng 16 ký tự
5. Copy mật khẩu này (dạng: xxxx xxxx xxxx xxxx)

**Lưu ý:** Nếu không thấy tùy chọn App Passwords:
- Bật xác thực 2 yếu tố (2FA) cho tài khoản Gmail
- Sau khi bật 2FA, mục App Passwords sẽ xuất hiện

## Bước 2: Cập nhật file .env

Mở file `.env` và thêm/cập nhật:

```env
EMAIL_USER="your-gmail@gmail.com"
EMAIL_APP_PASSWORD="xxxx xxxx xxxx xxxx"
```

(Thay `your-gmail@gmail.com` và `xxxx xxxx xxxx xxxx` bằng thông tin của bạn)

## Bước 3: Test API

### Request OTP qua email:
```bash
POST http://localhost:3000/api/auth/request-otp
Content-Type: application/json

{
  "email": "customer@example.com"
}
```

### Đăng nhập với OTP:
```bash
POST http://localhost:3000/api/auth/login-otp
Content-Type: application/json

{
  "email": "customer@example.com",
  "otp": "123456"
}
```

## ✅ Đã sửa:

1. **Thêm cấu hình EMAIL trong `.env.example`**
   - `EMAIL_USER`: Địa chỉ Gmail để gửi OTP
   - `EMAIL_APP_PASSWORD`: Mật khẩu ứng dụng 16 ký tự

2. **Cải thiện nodemailer config**
   - Thêm `tls.rejectUnauthorized: false` để tránh lỗi SSL
   - Xử lý lỗi tốt hơn khi gửi email

3. **Development mode**
   - Trong môi trường development, nếu chưa cấu hình email, OTP sẽ in ra console

## 🔍 Debug

Nếu vẫn gặp lỗi, kiểm tra:
- `EMAIL_USER` và `EMAIL_APP_PASSWORD` đã được cấu hình đúng trong file `.env`
- Gmail account đã bật 2FA và tạo App Password
- Port 587 hoặc 465 không bị firewall chặn
- Check console log để xem OTP (trong development mode)
