import crypto from 'crypto';
import prisma from '../../../config/db.js';
import { hashPassword } from '../../../utils/helpers.js';

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
        { users: { full_name: { contains: search, mode: 'insensitive' } } },
        { users: { phone: { contains: search } } },
        { users: { email: { contains: search, mode: 'insensitive' } } }
      ];
    }

    const [customers, total] = await Promise.all([
      prisma.customers.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          users: {
            select: {
              id: true,
              username: true,
              email: true,
              phone: true,
              full_name: true,
              avatar_url: true,
              is_active: true,
              is_verified: true,
              last_login: true
            }
          },
          cities: {
            select: {
              id: true,
              name: true
            }
          },
          orders: {
            include: {
              orderitems: true
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
        users: {
          select: {
            id: true,
            username: true,
            email: true,
            phone: true,
            full_name: true,
            avatar_url: true,
            is_active: true,
            is_verified: true,
            last_login: true,
            created_at: true
          }
        },
        orders: {
          include: {
            orderitems: true,
            vouchers: true
          }
        },
        reviews: {
          include: {
            products: true
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
    const { full_name, gender, address, email, phone, dob, username, password } = data;

    // Validate required fields
    if (!full_name?.trim() || !email?.trim() || !phone?.trim()) {
      return {
        success: false,
        status: 400,
        error: 'Vui lòng điền đầy đủ thông tin bắt buộc (họ tên, email, số điện thoại)'
      };
    }

    // Validate gender
    if (gender && gender !== "Nam" && gender !== "Nữ") {
      return {
        success: false,
        status: 400,
        error: 'Giới tính không hợp lệ'
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

    // Validate email format
    if (!isValidEmail(email)) {
      return {
        success: false,
        status: 400,
        error: 'Email không hợp lệ'
      };
    }

    // Validate date of birth if provided
    if (dob && !isValidBirthdate(dob)) {
      return {
        success: false,
        status: 400,
        error: 'Ngày sinh không hợp lệ'
      };
    }

    // Check if user already exists
    const existingUser = await prisma.users.findFirst({
      where: {
        OR: [
          { email },
          { phone },
          ...(username ? [{ username }] : [])
        ]
      }
    });

    if (existingUser) {
      return {
        success: false,
        status: 409,
        error: existingUser.email === email 
          ? 'Email đã tồn tại' 
          : existingUser.phone === phone 
          ? 'Số điện thoại đã tồn tại'
          : 'Username đã tồn tại'
      };
    }

    // Create user first, then customer
    const user = await prisma.users.create({
      data: {
        username: username || email,
        email,
        phone,
        full_name,
        password_hash: password ? await hashPassword(password) : await hashPassword(crypto.randomBytes(32).toString('hex')),
        role_id: 3, // Customer role
        is_verified: false
      }
    });

    // Create customer record
    const customer = await prisma.customers.create({
      data: {
        user_id: user.id,
        dob: dob ? new Date(dob) : null,
        gender,
        address,
        city_id: data.city_id ? Number(data.city_id) : null
      },
      include: {
        users: {
          select: {
            id: true,
            username: true,
            email: true,
            phone: true,
            full_name: true,
            avatar_url: true,
            is_active: true,
            is_verified: true
          }
        },
        cities: {
          select: {
            id: true,
            name: true
          }
        },
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
      return {
        success: false,
        status: 409,
        error: 'Email hoặc số điện thoại đã tồn tại'
      };
    }
    throw error;
  }
};

export const updateCustomer = async (id, data) => {
  try {
    const { email, phone, full_name, dob, gender, address, avatar_url } = data;

    // Get customer with user info
    const customer = await prisma.customers.findUnique({
      where: { id: Number(id) },
      include: { users: true }
    });

    if (!customer) {
      return {
        success: false,
        status: 404,
        error: 'Không tìm thấy khách hàng'
      };
    }

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
    if (dob && !isValidBirthdate(dob)) {
      return {
        success: false,
        status: 400,
        error: 'Ngày sinh không hợp lệ'
      };
    }

    // Update user info (email, phone, full_name, avatar_url)
    if (customer.user_id) {
      const userUpdateData = {};
      if (email) userUpdateData.email = email;
      if (phone) userUpdateData.phone = phone;
      if (full_name) userUpdateData.full_name = full_name;
      if (avatar_url !== undefined) userUpdateData.avatar_url = avatar_url;

      if (Object.keys(userUpdateData).length > 0) {
        await prisma.users.update({
          where: { id: customer.user_id },
          data: userUpdateData
        });
      }
    }

    // Update customer info (dob, gender, address, city_id)
    const customerUpdateData = {};
    if (dob !== undefined) customerUpdateData.dob = dob ? new Date(dob) : null;
    if (gender !== undefined) customerUpdateData.gender = gender;
    if (address !== undefined) customerUpdateData.address = address;
    if (data.city_id !== undefined) customerUpdateData.city_id = data.city_id ? Number(data.city_id) : null;

    const updatedCustomer = await prisma.customers.update({
      where: { id: Number(id) },
      data: customerUpdateData,
      include: {
        users: {
          select: {
            id: true,
            username: true,
            email: true,
            phone: true,
            full_name: true,
            avatar_url: true,
            is_active: true,
            is_verified: true
          }
        },
        cities: {
          select: {
            id: true,
            name: true
          }
        },
        orders: true,
        reviews: true
      }
    });

    return {
      success: true,
      data: updatedCustomer
    };
  } catch (error) {
    if (error.code === 'P2002') {
      return {
        success: false,
        status: 409,
        error: 'Email hoặc số điện thoại đã tồn tại'
      };
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