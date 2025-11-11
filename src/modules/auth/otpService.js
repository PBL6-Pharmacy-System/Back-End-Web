import prisma from '../../../config/db.js';
import crypto from 'crypto';

/**
 * Generate random 6-digit OTP
 */
const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

/**
 * Send OTP to phone (mock - integrate with SMS service later)
 */
const sendOTP = async (phone, otp) => {
  // TODO: Integrate with SMS service (Twilio, AWS SNS, etc.)
  console.log(`📱 Sending OTP ${otp} to phone ${phone}`);
  
  // Mock success
  return {
    success: true,
    message: `OTP sent to ${phone}`
  };
};

/**
 * Request OTP for phone number
 */
export const requestOTP = async (phone) => {
  try {
    // Validate phone
    if (!phone || !/^(\+84|0)[0-9]{9,10}$/.test(phone)) {
      return {
        success: false,
        error: 'Số điện thoại không hợp lệ',
        status: 400
      };
    }

    // Normalize phone number
    const normalizedPhone = phone.startsWith('+84') 
      ? phone 
      : phone.replace(/^0/, '+84');

    // Check if there's a recent OTP (within 1 minute)
    const recentOTP = await prisma.otp_verifications.findFirst({
      where: {
        phone: normalizedPhone,
        created_at: {
          gte: new Date(Date.now() - 60000) // 1 minute ago
        }
      },
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
        otp_code: otp,
        expires_at: expiresAt
      }
    });

    // Send OTP via SMS
    const smsResult = await sendOTP(normalizedPhone, otp);

    if (!smsResult.success) {
      return {
        success: false,
        error: 'Không thể gửi OTP. Vui lòng thử lại',
        status: 500
      };
    }

    return {
      success: true,
      message: 'OTP đã được gửi đến số điện thoại của bạn',
      data: {
        phone: normalizedPhone,
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
 * Verify OTP
 */
export const verifyOTP = async (phone, otpCode) => {
  try {
    // Validate inputs
    if (!phone || !otpCode) {
      return {
        success: false,
        error: 'Số điện thoại và mã OTP là bắt buộc',
        status: 400
      };
    }

    // Normalize phone
    const normalizedPhone = phone.startsWith('+84') 
      ? phone 
      : phone.replace(/^0/, '+84');

    // Find OTP
    const otpRecord = await prisma.otp_verifications.findFirst({
      where: {
        phone: normalizedPhone,
        otp_code: otpCode,
        verified: false,
        expires_at: {
          gte: new Date()
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    if (!otpRecord) {
      // Increment attempts
      await prisma.otp_verifications.updateMany({
        where: {
          phone: normalizedPhone,
          verified: false
        },
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
        phone: normalizedPhone
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
