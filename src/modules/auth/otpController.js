import * as otpService from './otpService.js';

/**
 * Request OTP for customer login
 */
export const requestOTP = async (req, res) => {
  try {
    const { phone } = req.body;
    const result = await otpService.requestOTP(phone);

    if (!result.success) {
      return res.status(result.status).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Request OTP controller error:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi yêu cầu OTP'
    });
  }
};

/**
 * Verify OTP for customer login
 */
export const verifyOTP = async (req, res) => {
  try {
    const { phone, otp } = req.body;
    const result = await otpService.verifyOTP(phone, otp);

    if (!result.success) {
      return res.status(result.status).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Verify OTP controller error:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi xác thực OTP'
    });
  }
};
