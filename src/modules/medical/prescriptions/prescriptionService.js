import prisma from '../../../config/db.js';
import { PRESCRIPTION_STATUS } from '../../../utils/constants.js';

/**
 * Generate unique prescription number
 */
const generatePrescriptionNumber = () => {
  const prefix = 'RX';
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}${timestamp}${random}`;
};

/**
 * Upload prescription (create new record)
 */
export const uploadPrescription = async (prescriptionData) => {
  try {
    const {
      customerId,
      orderId = null,
      doctorName,
      doctorLicense,
      hospitalName,
      diagnosis,
      prescribedDate,
      expiryDate,
      imageUrl,
      pdfUrl
    } = prescriptionData;

    // Validate required fields
    if (!customerId) {
      return {
        success: false,
        status: 400,
        error: 'Customer ID là bắt buộc'
      };
    }

    // At least one file (image or PDF) required
    if (!imageUrl && !pdfUrl) {
      return {
        success: false,
        status: 400,
        error: 'Cần upload ảnh hoặc PDF đơn thuốc'
      };
    }

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

    // Check if order exists (if provided)
    if (orderId) {
      const order = await prisma.orders.findUnique({
        where: { id: Number(orderId) }
      });

      if (!order) {
        return {
          success: false,
          status: 404,
          error: 'Không tìm thấy đơn hàng'
        };
      }

      // Verify order belongs to customer
      if (order.customer_id !== Number(customerId)) {
        return {
          success: false,
          status: 403,
          error: 'Đơn hàng không thuộc về khách hàng này'
        };
      }
    }

    // Generate prescription number
    const prescriptionNumber = generatePrescriptionNumber();

    // Calculate expiry date if not provided (default: 30 days from prescribed date)
    let calculatedExpiryDate = expiryDate;
    if (!calculatedExpiryDate && prescribedDate) {
      const prescribed = new Date(prescribedDate);
      calculatedExpiryDate = new Date(prescribed);
      calculatedExpiryDate.setDate(prescribed.getDate() + 30); // 30 days validity
    }

    // Create prescription
    const prescription = await prisma.prescriptions.create({
      data: {
        customer_id: Number(customerId),
        order_id: orderId ? Number(orderId) : null,
        prescription_number: prescriptionNumber,
        doctor_name: doctorName,
        doctor_license: doctorLicense,
        hospital_name: hospitalName,
        diagnosis,
        prescribed_date: prescribedDate ? new Date(prescribedDate) : null,
        expiry_date: calculatedExpiryDate ? new Date(calculatedExpiryDate) : null,
        image_url: imageUrl,
        pdf_url: pdfUrl,
        status: PRESCRIPTION_STATUS.PENDING,
        created_at: new Date(),
        updated_at: new Date()
      },
      include: {
        customers: {
          select: {
            id: true,
            users: {
              select: {
                full_name: true,
                email: true,
                phone: true
              }
            }
          }
        },
        orders: {
          select: {
            id: true,
            status: true,
            order_date: true
          }
        }
      }
    });

    return {
      success: true,
      data: prescription,
      message: 'Upload đơn thuốc thành công. Đơn thuốc đang chờ xác minh.'
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Get prescription by ID
 */
export const getPrescriptionById = async (prescriptionId) => {
  try {
    const prescription = await prisma.prescriptions.findUnique({
      where: { id: Number(prescriptionId) },
      include: {
        customers: {
          select: {
            id: true,
            users: {
              select: {
                full_name: true,
                email: true,
                phone: true
              }
            }
          }
        },
        orders: {
          select: {
            id: true,
            status: true,
            order_date: true
          }
        },
        users: {
          select: {
            id: true,
            username: true,
            full_name: true
          }
        }
      }
    });

    if (!prescription) {
      return {
        success: false,
        status: 404,
        error: 'Không tìm thấy đơn thuốc'
      };
    }

    return {
      success: true,
      data: prescription
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Get all prescriptions with pagination and filters
 */
export const getAllPrescriptions = async (filters = {}) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      customerId,
      startDate,
      endDate,
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = filters;

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    // Build where clause
    const where = {};

    if (status) {
      where.status = status;
    }

    if (customerId) {
      where.customer_id = Number(customerId);
    }

    if (startDate || endDate) {
      where.created_at = {};
      if (startDate) where.created_at.gte = new Date(startDate);
      if (endDate) where.created_at.lte = new Date(endDate);
    }

    // Get prescriptions
    const [prescriptions, total] = await Promise.all([
      prisma.prescriptions.findMany({
        where,
        skip,
        take,
        orderBy: {
          [sortBy]: sortOrder
        },
        include: {
          customers: {
            select: {
              id: true,
              users: {
                select: {
                  full_name: true,
                  phone: true
                }
              }
            }
          },
          users: {
            select: {
              id: true,
              full_name: true
            }
          }
        }
      }),
      prisma.prescriptions.count({ where })
    ]);

    return {
      success: true,
      data: {
        prescriptions,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit))
        }
      }
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Get customer's prescriptions
 */
export const getCustomerPrescriptions = async (customerId, filters = {}) => {
  try {
    const {
      page = 1,
      limit = 10,
      status
    } = filters;

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

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

    // Build where clause
    const where = {
      customer_id: Number(customerId)
    };

    if (status) {
      where.status = status;
    }

    // Get prescriptions
    const [prescriptions, total] = await Promise.all([
      prisma.prescriptions.findMany({
        where,
        skip,
        take,
        orderBy: {
          created_at: 'desc'
        },
        include: {
          orders: {
            select: {
              id: true,
              status: true
            }
          },
          users: {
            select: {
              full_name: true
            }
          }
        }
      }),
      prisma.prescriptions.count({ where })
    ]);

    return {
      success: true,
      data: {
        prescriptions,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit))
        }
      }
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Verify prescription (Pharmacist/Admin)
 */
export const verifyPrescription = async (prescriptionId, verificationData, userId) => {
  try {
    const { status, verificationNotes } = verificationData;

    // Validate status
    const validStatuses = [PRESCRIPTION_STATUS.VERIFIED, PRESCRIPTION_STATUS.REJECTED];
    if (!validStatuses.includes(status)) {
      return {
        success: false,
        status: 400,
        error: 'Trạng thái phải là "verified" hoặc "rejected"'
      };
    }

    // Get current prescription
    const currentPrescription = await prisma.prescriptions.findUnique({
      where: { id: Number(prescriptionId) }
    });

    if (!currentPrescription) {
      return {
        success: false,
        status: 404,
        error: 'Không tìm thấy đơn thuốc'
      };
    }

    // Check if already verified/rejected
    if (currentPrescription.status !== PRESCRIPTION_STATUS.PENDING) {
      return {
        success: false,
        status: 400,
        error: `Đơn thuốc đã được ${currentPrescription.status}`
      };
    }

    // Update prescription
    const updatedPrescription = await prisma.prescriptions.update({
      where: { id: Number(prescriptionId) },
      data: {
        status,
        verified_by: userId ? Number(userId) : null,
        verified_at: new Date(),
        verification_notes: verificationNotes,
        updated_at: new Date()
      },
      include: {
        customers: {
          select: {
            id: true,
            users: {
              select: {
                full_name: true,
                email: true
              }
            }
          }
        },
        users: {
          select: {
            full_name: true
          }
        }
      }
    });

    return {
      success: true,
      data: updatedPrescription,
      message: status === PRESCRIPTION_STATUS.VERIFIED
        ? 'Xác minh đơn thuốc thành công'
        : 'Từ chối đơn thuốc'
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Check if prescription is expired
 */
export const checkExpiredPrescriptions = async () => {
  try {
    const now = new Date();

    // Find all verified prescriptions that have passed expiry date
    const expiredPrescriptions = await prisma.prescriptions.updateMany({
      where: {
        status: PRESCRIPTION_STATUS.VERIFIED,
        expiry_date: {
          lt: now
        }
      },
      data: {
        status: PRESCRIPTION_STATUS.EXPIRED,
        updated_at: now
      }
    });

    return {
      success: true,
      data: {
        count: expiredPrescriptions.count
      },
      message: `Đã cập nhật ${expiredPrescriptions.count} đơn thuốc hết hạn`
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Get prescription statistics (Admin)
 */
export const getPrescriptionStatistics = async (filters = {}) => {
  try {
    const { startDate, endDate } = filters;

    const where = {};

    if (startDate || endDate) {
      where.created_at = {};
      if (startDate) where.created_at.gte = new Date(startDate);
      if (endDate) where.created_at.lte = new Date(endDate);
    }

    // Get statistics
    const [
      totalPrescriptions,
      pendingPrescriptions,
      verifiedPrescriptions,
      rejectedPrescriptions,
      expiredPrescriptions
    ] = await Promise.all([
      prisma.prescriptions.count({ where }),
      prisma.prescriptions.count({
        where: { ...where, status: PRESCRIPTION_STATUS.PENDING }
      }),
      prisma.prescriptions.count({
        where: { ...where, status: PRESCRIPTION_STATUS.VERIFIED }
      }),
      prisma.prescriptions.count({
        where: { ...where, status: PRESCRIPTION_STATUS.REJECTED }
      }),
      prisma.prescriptions.count({
        where: { ...where, status: PRESCRIPTION_STATUS.EXPIRED }
      })
    ]);

    // Calculate verification rate
    const verificationRate = totalPrescriptions > 0
      ? ((verifiedPrescriptions / totalPrescriptions) * 100).toFixed(2)
      : 0;

    return {
      success: true,
      data: {
        totalPrescriptions,
        prescriptionsByStatus: {
          pending: pendingPrescriptions,
          verified: verifiedPrescriptions,
          rejected: rejectedPrescriptions,
          expired: expiredPrescriptions
        },
        verificationRate: `${verificationRate}%`
      }
    };
  } catch (error) {
    throw error;
  }
};
