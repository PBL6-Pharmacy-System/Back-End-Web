export const adminOnly = (req, res, next) => {
  if (req.user.role_id !== 1) {
    return res.status(403).json({
      success: false,
      error: 'Chỉ admin mới có quyền truy cập dashboard'
    });
  }
  next();
};
