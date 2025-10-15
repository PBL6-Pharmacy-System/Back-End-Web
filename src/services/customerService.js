import prisma from '../config/db.js';

// Validate email format
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate phone format
const isValidPhone = (phone) => {
  const phoneRegex = /^[0-9]{10}$/;
  return phoneRegex.test(phone);
};

// Validate date of birth
const isValidBirthdate = (birthdate) => {
  const birthdateObj = new Date(birthdate);
  const now = new Date();
  
  if (birthdateObj > now) {
    return false;
  }
  
  // Calculate age
  const age = Math.floor((now - birthdateObj) / (365.25 * 24 * 60 * 60 * 1000));
  return age <= 120;
};

export const getAllCustomers = async ({ search, membership, status, page = 1, limit = 10 }) => {
  try {
    const where = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    if (membership) {
      where.membership = membership;
    }
    
    if (status) {
      where.status = status;
    }

    const [customers, total] = await Promise.all([
      prisma.customers.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          orders: {
            include: {
              orderItems: true
            }
          },
          reviews: true
        }
      }),
      prisma.customers.count({ where })
    ]);

    return {
      data: customers,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        totalRecords: total
      }
    };
  } catch (error) {
    throw error;
  }
};

export const getCustomerById = async (id) => {
  try {
    return await prisma.customers.findUnique({
      where: { id: Number(id) },
      include: {
        orders: {
          include: {
            orderItems: true,
            voucher: true
          }
        },
        reviews: {
          include: {
            product: true
          }
        }
      }
    });
  } catch (error) {
    throw error;
  }
};

export const createCustomer = async (data) => {
  try {
    const { name, email, phone, date_of_birth } = data;

    // Validate required fields
    if (!name || !phone) {
      return {
        success: false,
        status: 400,
        error: 'Vui lòng điền đầy đủ thông tin bắt buộc (họ tên, số điện thoại)'
      };
    }

    // Validate phone format
    if (!isValidPhone(phone)) {
      return {
        success: false,
        status: 400,
        error: 'Số điện thoại không hợp lệ'
      };
    }

    // Validate email format if provided
    if (email && !isValidEmail(email)) {
      return {
        success: false,
        status: 400,
        error: 'Email không hợp lệ'
      };
    }

    // Validate date of birth if provided
    if (date_of_birth && !isValidBirthdate(date_of_birth)) {
      return {
        success: false,
        status: 400,
        error: 'Ngày sinh không hợp lệ'
      };
    }

    const customer = await prisma.customers.create({
      data: {
        ...data,
        date_of_birth: date_of_birth ? new Date(date_of_birth) : undefined,
        created_at: new Date(),
        status: 'active'
      },
      include: {
        orders: true,
        reviews: true
      }
    });

    return {
      success: true,
      data: customer
    };
  } catch (error) {
    if (error.code === 'P2002') {
      if (error.meta?.target?.includes('phone')) {
        return {
          success: false,
          status: 409,
          error: 'Số điện thoại đã tồn tại'
        };
      }
      if (error.meta?.target?.includes('email')) {
        return {
          success: false,
          status: 409,
          error: 'Email đã tồn tại'
        };
      }
    }
    throw error;
  }
};

export const updateCustomer = async (id, data) => {
  try {
    const { email, phone, date_of_birth } = data;

    // Validate phone format if provided
    if (phone && !isValidPhone(phone)) {
      return {
        success: false,
        status: 400,
        error: 'Số điện thoại không hợp lệ'
      };
    }

    // Validate email format if provided
    if (email && !isValidEmail(email)) {
      return {
        success: false,
        status: 400,
        error: 'Email không hợp lệ'
      };
    }

    // Validate date of birth if provided
    if (date_of_birth && !isValidBirthdate(date_of_birth)) {
      return {
        success: false,
        status: 400,
        error: 'Ngày sinh không hợp lệ'
      };
    }

    const customer = await prisma.customers.update({
      where: { id: Number(id) },
      data: {
        ...data,
        date_of_birth: date_of_birth ? new Date(date_of_birth) : undefined
      },
      include: {
        orders: true,
        reviews: true
      }
    });

    return {
      success: true,
      data: customer
    };
  } catch (error) {
    if (error.code === 'P2025') {
      return {
        success: false,
        status: 404,
        error: 'Không tìm thấy khách hàng'
      };
    }
    if (error.code === 'P2002') {
      if (error.meta?.target?.includes('phone')) {
        return {
          success: false,
          status: 409,
          error: 'Số điện thoại đã tồn tại'
        };
      }
      if (error.meta?.target?.includes('email')) {
        return {
          success: false,
          status: 409,
          error: 'Email đã tồn tại'
        };
      }
    }
    throw error;
  }
};

// Check if customer can be deleted
const canDeleteCustomer = async (id) => {
  const orderCount = await prisma.orders.count({
    where: { user_id: Number(id) }
  });
  return orderCount === 0;
};

export const deleteCustomer = async (id) => {
  try {
    // Check if customer exists
    const existingCustomer = await prisma.customers.findUnique({
      where: { id: Number(id) }
    });

    if (!existingCustomer) {
      return {
        success: false,
        status: 404,
        error: 'Không tìm thấy khách hàng'
      };
    }

    // Check if customer can be deleted
    if (!await canDeleteCustomer(id)) {
      return {
        success: false,
        status: 400,
        error: 'Không thể xóa khách hàng này vì có liên kết với dữ liệu khác'
      };
    }

    const customer = await prisma.customers.delete({
      where: { id: Number(id) },
      include: {
        orders: true,
        reviews: true
      }
    });

    return {
      success: true,
      data: customer
    };
  } catch (error) {
    throw error;
  }
};

export const getCustomerOrders = async (customerId, { page, limit, status }) => {
  try {
    // Check if customer exists
    const customer = await prisma.customers.findUnique({
      where: { id: Number(customerId) }
    });

    if (!customer) {
      return {
        success: false,
        status: 404,
        error: 'Không tìm thấy khách hàng'
      };
    }

    const where = { user_id: Number(customerId) };
    if (status) {
      where.status = status;
    }

    const [orders, total] = await Promise.all([
      prisma.orders.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { order_date: 'desc' },
        include: {
          orderItems: {
            include: {
              product: true,
              productUnit: true
            }
          },
          voucher: true
        }
      }),
      prisma.orders.count({ where })
    ]);

    return {
      success: true,
      data: {
        orders,
        pagination: {
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          totalRecords: total
        }
      }
    };
  } catch (error) {
    throw error;
  }
};

export const getCustomerReviews = async (customerId, { page = 1, limit = 10 }) => {
  try {
    const where = { customer_id: Number(customerId) };

    const [reviews, total] = await Promise.all([
      prisma.reviews.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          product: true
        },
        orderBy: {
          created_at: 'desc'
        }
      }),
      prisma.reviews.count({ where })
    ]);

    return {
      success: true,
      data: {
        reviews,
        pagination: {
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          totalRecords: total
        }
      }
    };
  } catch (error) {
    throw error;
  }
};

export const getCustomerStats = async (customerId) => {
  try {
    // Check if customer exists
    const customer = await prisma.customers.findUnique({
      where: { id: Number(customerId) }
    });

    if (!customer) {
      return {
        success: false,
        status: 404,
        error: 'Không tìm thấy khách hàng'
      };
    }

    const [orders, reviews] = await Promise.all([
      prisma.orders.findMany({
        where: {
          user_id: Number(customerId),
          status: 'completed'
        }
      }),
      prisma.reviews.count({
        where: {
          customer_id: Number(customerId)
        }
      })
    ]);

    const totalSpent = orders.reduce((sum, order) => sum + parseFloat(order.final_amount), 0);
    const orderCount = orders.length;

    return {
      success: true,
      data: {
        totalSpent,
        orderCount,
        reviewCount: reviews,
        averageOrderValue: orderCount > 0 ? totalSpent / orderCount : 0,
        lastOrderDate: orders[0]?.order_date
      }
    };
  } catch (error) {
    throw error;
  }
};