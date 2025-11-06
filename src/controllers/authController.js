import * as authService from '../services/authService.js';

/**
 * Đăng ký user mới
 */
export const register = async (req, res) => {
  try {
    const result = await authService.register(req.body);
    
    if (!result.success) {
      return res.status(result.status).json(result);
    }

    res.status(201).json(result);
  } catch (error) {
    console.error('Register controller error:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi đăng ký'
    });
  }
};

/**
 * Đăng nhập
 */
export const login = async (req, res) => {
  try {
    const result = await authService.login(req.body);
    
    if (!result.success) {
      return res.status(result.status).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Login controller error:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi đăng nhập'
    });
  }
};

/**
 * Lấy thông tin user hiện tại (từ token)
 */
export const getCurrentUser = async (req, res) => {
  try {
    const result = await authService.getCurrentUser(req.user.id);
    
    if (!result.success) {
      return res.status(result.status).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Get current user controller error:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi lấy thông tin user'
    });
  }
};

/**
 * Đổi password
 */
export const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const result = await authService.changePassword(req.user.id, oldPassword, newPassword);
    
    if (!result.success) {
      return res.status(result.status).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Change password controller error:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi đổi password'
    });
  }
};

/**
 * Logout (client-side sẽ xóa token)
 */
export const logout = async (req, res) => {
  res.json({
    success: true,
    message: 'Đăng xuất thành công'
  });
};

/**
 * Refresh access token
 */
export const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const result = await authService.refreshAccessToken(refreshToken);
    
    if (!result.success) {
      return res.status(result.status).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Refresh token controller error:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi refresh token'
    });
  }
};
