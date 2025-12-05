import prisma from '../../../config/db.js';

const NOTIFICATION_TYPES = ['info', 'warning', 'success', 'error', 'system'];

// Validate notification data
const validateNotificationData = async (data, checkRequired = true) => {
  // Validate required fields
  if (checkRequired && (!data.userId || !data.type || !data.message)) {
    return {
      success: false,
      status: 400,
      error: 'Vui lòng điền đầy đủ thông tin bắt buộc (người nhận, loại, nội dung)'
    };
  }

  // Validate notification type
  if (data.type && !NOTIFICATION_TYPES.includes(data.type)) {
    return {
      success: false,
      status: 400,
      error: 'Loại thông báo không hợp lệ'
    };
  }

  // Validate content length
  if (data.message && data.message.length > 1000) {
    return {
      success: false,
      status: 400,
      error: 'Nội dung thông báo không được vượt quá 1000 ký tự'
    };
  }

  // Validate user exists if userId is provided
  if (data.userId) {
    const user = await prisma.users.findUnique({
      where: { id: Number(data.userId) }
    });
    if (!user) {
      return {
        success: false,
        status: 404,
        error: 'Không tìm thấy người dùng'
      };
    }
  }

  return { success: true };
};

export const getAllNotifications = async ({
  userId,
  isRead,
  type,
  page = 1,
  limit = 10,
  sortBy = 'created_at',
  sortOrder = 'desc'
}) => {
  try {
    const where = {
      AND: [
        userId ? { user_id: Number(userId) } : {},
        isRead !== undefined ? { is_read: isRead } : {},
        type ? { type } : {}
      ]
    };

    const [total, notifications] = await Promise.all([
      prisma.notifications.count({ where }),
      prisma.notifications.findMany({
        where,
        include: {
          users: true,
          customers: true
        },
        orderBy: { [sortBy]: sortOrder.toLowerCase() },
        skip: (page - 1) * limit,
        take: limit
      })
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      success: true,
      data: notifications,
      pagination: {
        total,
        page,
        limit,
        totalPages
      }
    };
  } catch (error) {
    console.error('Error in getAllNotifications service:', error);
    return {
      success: false,
      status: 500,
      error: 'Lỗi khi lấy danh sách thông báo'
    };
  }
};

export const getNotificationById = async (id) => {
  try {
    const notification = await prisma.notifications.findUnique({
      where: { id: Number(id) },
      include: {
        users: true,
        customers: true
      }
    });

    if (!notification) {
      return {
        success: false,
        status: 404,
        error: 'Không tìm thấy thông báo'
      };
    }

    return {
      success: true,
      data: notification
    };
  } catch (error) {
    console.error('Error in getNotificationById service:', error);
    return {
      success: false,
      status: 500,
      error: 'Lỗi khi lấy thông tin thông báo'
    };
  }
};

export const createNotification = async (data) => {
  try {
    // Validate notification data
    const validation = await validateNotificationData(data);
    if (!validation.success) {
      return validation;
    }

    const notification = await prisma.notifications.create({
      data: {
        message: data.content?.trim() || data.message?.trim(),
        type: data.type,
        user_id: data.userId ? Number(data.userId) : null,
        customer_id: data.customerId ? Number(data.customerId) : null,
        is_read: false,
        created_at: new Date()
      },
      include: {
        users: true,
        customers: true
      }
    });

    return {
      success: true,
      status: 201,
      data: notification,
      message: 'Tạo thông báo thành công'
    };
  } catch (error) {
    console.error('Error in createNotification service:', error);
    return {
      success: false,
      status: 500,
      error: 'Lỗi khi tạo thông báo mới'
    };
  }
};

export const updateNotification = async (id, data) => {
  try {
    // Check if notification exists
    const existingNotification = await getNotificationById(id);
    if (!existingNotification.success) {
      return existingNotification;
    }

    // Validate notification data
    const validation = await validateNotificationData(data, false);
    if (!validation.success) {
      return validation;
    }

    const updatedNotification = await prisma.notifications.update({
      where: { id: Number(id) },
      data: {
        message: data.content?.trim() || data.message?.trim(),
        type: data.type,
        is_read: data.isRead
      },
      include: {
        users: true,
        customers: true
      }
    });

    return {
      success: true,
      data: updatedNotification,
      message: 'Cập nhật thông báo thành công'
    };
  } catch (error) {
    console.error('Error in updateNotification service:', error);
    return {
      success: false,
      status: 500,
      error: 'Lỗi khi cập nhật thông báo'
    };
  }
};

export const deleteNotification = async (id) => {
  try {
    // Check if notification exists
    const existingNotification = await getNotificationById(id);
    if (!existingNotification.success) {
      return existingNotification;
    }

    const deletedNotification = await prisma.notifications.delete({
      where: { id: Number(id) },
      include: {
        users: true,
        customers: true
      }
    });

    return {
      success: true,
      data: deletedNotification,
      message: 'Xóa thông báo thành công'
    };
  } catch (error) {
    console.error('Error in deleteNotification service:', error);
    return {
      success: false,
      status: 500,
      error: 'Lỗi khi xóa thông báo'
    };
  }
};

export const markNotificationsAsRead = async (notificationIds) => {
  try {
    if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
      return {
        success: false,
        status: 400,
        error: 'Vui lòng cung cấp danh sách ID thông báo hợp lệ'
      };
    }

    await prisma.notifications.updateMany({
      where: {
        id: {
          in: notificationIds.map(id => Number(id))
        }
      },
      data: {
        is_read: true,
        read_at: new Date()
      }
    });

    return {
      success: true,
      message: 'Đã đánh dấu thông báo là đã đọc'
    };
  } catch (error) {
    console.error('Error in markNotificationsAsRead service:', error);
    return {
      success: false,
      status: 500,
      error: 'Lỗi khi cập nhật trạng thái thông báo'
    };
  }
};

export const getUnreadNotificationCount = async (userId) => {
  try {
    if (!userId) {
      return {
        success: false,
        status: 400,
        error: 'Vui lòng cung cấp ID người dùng'
      };
    }

    const count = await prisma.notifications.count({
      where: {
        user_id: Number(userId),
        is_read: false
      }
    });

    return {
      success: true,
      data: { unreadCount: count }
    };
  } catch (error) {
    console.error('Error in getUnreadNotificationCount service:', error);
    return {
      success: false,
      status: 500,
      error: 'Lỗi khi lấy số lượng thông báo chưa đọc'
    };
  }
};