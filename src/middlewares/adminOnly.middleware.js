export const adminOnly = (req, res, next) => {
  // ✅ FIXED: Sử dụng role_name thay vì role_id để nhất quán với auth.middleware.js
  if (!req.user || req.user.role_name !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Chỉ admin mới có quyền truy cập dashboard'
    });
  }
  next();
};
