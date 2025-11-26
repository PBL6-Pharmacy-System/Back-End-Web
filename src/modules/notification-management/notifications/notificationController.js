import * as notificationService from './notificationService.js';

export const getAllNotifications = async (req, res) => {
  try {
    const {
      isRead,
      type,
      page = 1,
      limit = 10,
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = req.query;

    let userId;
    if (req.user.role_name === 'admin') {
      userId = req.query.userId ? parseInt(req.query.userId) : undefined;
    } else {
      userId = req.user.userId;
    }

    const result = await notificationService.getAllNotifications({
      userId,
      isRead: isRead === 'true',
      type,
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy,
      sortOrder
    });

    if (!result.success) {
      return res.status(result.status).json(result);
    }

    res.json(result);
  } catch (err) {
    console.error('Error in getAllNotifications:', err);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi lấy danh sách thông báo'
    });
  }
};

export const getNotificationById = async (req, res) => {
  try {
    const result = await notificationService.getNotificationById(req.params.id);
    if (!result.success) {
      return res.status(result.status).json(result);
    }

    if (req.user.role_name !== 'admin') {
      if (result.data.user_id !== req.user.userId) {
        return res.status(403).json({
          success: false,
          error: 'Bạn không có quyền xem thông báo này'
        });
      }
    }

    res.json(result);
  } catch (err) {
    console.error('Error in getNotificationById:', err);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi lấy thông tin thông báo'
    });
  }
};

export const createNotification = async (req, res) => {
  try {
    const result = await notificationService.createNotification(req.body);
    if (!result.success) {
      return res.status(result.status).json(result);
    }

    res.status(201).json(result);
  } catch (err) {
    console.error('Error in createNotification:', err);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi tạo thông báo mới'
    });
  }
};

export const updateNotification = async (req, res) => {
  try {
    const notificationResult = await notificationService.getNotificationById(req.params.id);

    if (!notificationResult.success) {
      return res.status(notificationResult.status).json(notificationResult);
    }

    if (req.user.role_name !== 'admin') {
      if (notificationResult.data.user_id !== req.user.userId) {
        return res.status(403).json({
          success: false,
          error: 'Bạn chỉ có thể cập nhật thông báo của chính mình'
        });
      }
    }

    const result = await notificationService.updateNotification(
      req.params.id,
      req.body
    );

    if (!result.success) {
      return res.status(result.status).json(result);
    }

    res.json(result);
  } catch (err) {
    console.error('Error in updateNotification:', err);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi cập nhật thông báo'
    });
  }
};

export const deleteNotification = async (req, res) => {
  try {
    const result = await notificationService.deleteNotification(req.params.id);
    if (!result.success) {
      return res.status(result.status).json(result);
    }

    res.json(result);
  } catch (err) {
    console.error('Error in deleteNotification:', err);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi xóa thông báo'
    });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const result = await notificationService.markNotificationsAsRead(req.body.notificationIds);
    if (!result.success) {
      return res.status(result.status).json(result);
    }

    res.json(result);
  } catch (err) {
    console.error('Error in markAsRead:', err);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi cập nhật trạng thái thông báo'
    });
  }
};

export const getUserUnreadCount = async (req, res) => {
  try {
    const result = await notificationService.getUnreadNotificationCount(req.params.userId);
    if (!result.success) {
      return res.status(result.status).json(result);
    }

    res.json(result);
  } catch (err) {
    console.error('Error in getUserUnreadCount:', err);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi lấy số lượng thông báo chưa đọc'
    });
  }
};