import crypto from 'crypto';
import nodemailer from 'nodemailer';
import prisma from '../../config/db.js';

/**
 * Generate random 6-digit OTP
 */
const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

/**
 * Configure email transporter
 */
const createEmailTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD
    }
  });
};

/**
 * Send OTP to phone (mock - integrate with SMS service later)
 */
const sendOTPSMS = async (phone, otp) => {
  // TODO: Integrate with SMS service (Twilio, AWS SNS, etc.)
  console.log(`📱 Sending OTP ${otp} to phone ${phone}`);
  
  // Mock success for development
  if (process.env.NODE_ENV === 'development') {
    console.log(`✅ [DEV MODE] OTP SMS: ${otp}`);
  }
  
  return {
    success: true,
    message: `OTP sent to ${phone}`
  };
};

/**
 * Send OTP to email (REAL - using Gmail SMTP)
 */
const sendOTPEmail = async (email, otp) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
      console.error('❌ EMAIL_USER hoặc EMAIL_APP_PASSWORD chưa được cấu hình');
      
      // Development fallback
      if (process.env.NODE_ENV === 'development') {
        console.log(`✅ [DEV MODE] OTP Email: ${otp} → ${email}`);
        return { success: true };
      }
      
      return { success: false, error: 'Email chưa được cấu hình' };
    }

    const transporter = createEmailTransporter();
    
    const mailOptions = {
      from: `"PBL6 Pharmacy" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Mã xác thực OTP - PBL6 Pharmacy',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .otp-box { background: white; border: 2px dashed #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
            .otp-code { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 8px; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #888; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏥 PBL6 Pharmacy</h1>
              <p>Xác thực tài khoản của bạn</p>
            </div>
            <div class="content">
              <h2>Xin chào!</h2>
              <p>Bạn đã yêu cầu mã OTP để xác thực tài khoản. Vui lòng sử dụng mã bên dưới:</p>
              
              <div class="otp-box">
                <p style="margin: 0; font-size: 14px; color: #666;">Mã OTP của bạn</p>
                <div class="otp-code">${otp}</div>
              </div>
              
              <p><strong>⏰ Mã có hiệu lực trong 5 phút.</strong></p>
              <p>Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email này.</p>
              
              <div class="footer">
                <p>© 2025 PBL6 Pharmacy System. All rights reserved.</p>
                <p>Email này được gửi tự động, vui lòng không trả lời.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ OTP email sent to ${email}`);
    
    return { success: true };
  } catch (error) {
    console.error('❌ Send email error:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Request OTP - Hỗ trợ cả phone và email
 */
export const requestOTP = async (phone = null, email = null) => {
  try {
    // Phải có ít nhất 1 trong 2
    if (!phone && !email) {
      return {
        success: false,
        error: 'Số điện thoại hoặc email là bắt buộc',
        status: 400
      };
    }

    let normalizedPhone = null;
    let normalizedEmail = null;

    // Validate và normalize phone nếu có
    if (phone) {
      if (!/^(\+84|0)[0-9]{9,10}$/.test(phone)) {
        return {
          success: false,
          error: 'Số điện thoại không hợp lệ',
          status: 400
        };
      }
      normalizedPhone = phone.startsWith('+84') ? phone : phone.replace(/^0/, '+84');
    }

    // Validate email nếu có
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return {
          success: false,
          error: 'Email không hợp lệ',
          status: 400
        };
      }
      normalizedEmail = email.toLowerCase().trim();
    }

    // Check if there's a recent OTP (within 1 minute)
    const whereClause = {
      OR: [
        ...(normalizedPhone ? [{ phone: normalizedPhone }] : []),
        ...(normalizedEmail ? [{ email: normalizedEmail }] : [])
      ],
      created_at: {
        gte: new Date(Date.now() - 60000) // 1 minute ago (60000ms = 1 phút)
      }
    };

    const recentOTP = await prisma.otp_verifications.findFirst({
      where: whereClause,
      orderBy: {
        created_at: 'desc'
      }
    });

    if (recentOTP) {
      return {
        success: false,
        error: 'Vui lòng đợi 1 phút trước khi yêu cầu OTP mới',
        status: 429
      };
    }

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60000); // 5 minutes

    // Save OTP to database
    await prisma.otp_verifications.create({
      data: {
        phone: normalizedPhone,
        email: normalizedEmail,
        otp_code: otp,
        expires_at: expiresAt
      }
    });

    // Send OTP
    let sendResult;
    let sentTo;
    
    if (normalizedEmail) {
      // Ưu tiên gửi qua email (thật, miễn phí)
      sendResult = await sendOTPEmail(normalizedEmail, otp);
      sentTo = normalizedEmail;
    } else if (normalizedPhone) {
      // Fallback: SMS (mock)
      sendResult = await sendOTPSMS(normalizedPhone, otp);
      sentTo = normalizedPhone;
    }

    if (!sendResult.success) {
      return {
        success: false,
        error: sendResult.error || 'Không thể gửi OTP. Vui lòng thử lại',
        status: 500
      };
    }

    return {
      success: true,
      message: `OTP đã được gửi đến ${normalizedEmail ? 'email' : 'số điện thoại'} của bạn`,
      data: {
        ...(normalizedPhone && { phone: normalizedPhone }),
        ...(normalizedEmail && { email: normalizedEmail }),
        expiresIn: 300 // seconds
      }
    };
  } catch (error) {
    console.error('Request OTP error:', error);
    return {
      success: false,
      error: 'Lỗi khi gửi OTP',
      status: 500
    };
  }
};

/**
 * Verify OTP - Hỗ trợ cả phone và email
 */
export const verifyOTP = async (phone = null, email = null, otpCode) => {
  try {
    // Validate inputs
    if ((!phone && !email) || !otpCode) {
      return {
        success: false,
        error: 'Số điện thoại/email và mã OTP là bắt buộc',
        status: 400
      };
    }

    let normalizedPhone = null;
    let normalizedEmail = null;

    // Normalize phone if provided
    if (phone) {
      normalizedPhone = phone.startsWith('+84') ? phone : phone.replace(/^0/, '+84');
    }

    // Normalize email if provided
    if (email) {
      normalizedEmail = email.toLowerCase().trim();
    }

    // Build where clause
    const whereClause = {
      OR: [
        ...(normalizedPhone ? [{ phone: normalizedPhone }] : []),
        ...(normalizedEmail ? [{ email: normalizedEmail }] : [])
      ],
      otp_code: otpCode,
      verified: false,
      expires_at: {
        gte: new Date()
      }
    };

    // Find OTP
    const otpRecord = await prisma.otp_verifications.findFirst({
      where: whereClause,
      orderBy: {
        created_at: 'desc'
      }
    });

    if (!otpRecord) {
      // Increment attempts
      const updateWhere = {
        OR: [
          ...(normalizedPhone ? [{ phone: normalizedPhone }] : []),
          ...(normalizedEmail ? [{ email: normalizedEmail }] : [])
        ],
        verified: false
      };
      
      await prisma.otp_verifications.updateMany({
        where: updateWhere,
        data: {
          attempts: {
            increment: 1
          }
        }
      });

      return {
        success: false,
        error: 'Mã OTP không hợp lệ hoặc đã hết hạn',
        status: 400
      };
    }

    // Check attempts
    if (otpRecord.attempts >= 5) {
      return {
        success: false,
        error: 'Bạn đã nhập sai quá nhiều lần. Vui lòng yêu cầu OTP mới',
        status: 429
      };
    }

    // Mark as verified
    await prisma.otp_verifications.update({
      where: {
        id: otpRecord.id
      },
      data: {
        verified: true
      }
    });

    return {
      success: true,
      message: 'Xác thực OTP thành công',
      data: {
        ...(normalizedPhone && { phone: normalizedPhone }),
        ...(normalizedEmail && { email: normalizedEmail })
      }
    };
  } catch (error) {
    console.error('Verify OTP error:', error);
    return {
      success: false,
      error: 'Lỗi khi xác thực OTP',
      status: 500
    };
  }
};

/**
 * Clean up expired OTPs (run periodically)
 */
export const cleanupExpiredOTPs = async () => {
  try {
    const result = await prisma.otp_verifications.deleteMany({
      where: {
        expires_at: {
          lt: new Date()
        }
      }
    });

    console.log(`🧹 Cleaned up ${result.count} expired OTPs`);
    return result.count;
  } catch (error) {
    console.error('Cleanup OTP error:', error);
    return 0;
  }
};
