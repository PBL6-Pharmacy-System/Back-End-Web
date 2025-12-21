import prisma from '../../../config/db.js';
import { validateNumericFields, validateRequiredFields } from '../../../utils/validation.js';

// Validate review data
const validateReview = (data) => {
  // Required fields
  const requiredFields = ['customer_id', 'product_id', 'rating'];
  const missingFields = validateRequiredFields(data, requiredFields);
  if (missingFields.length > 0) {
    return {
      isValid: false,
      error: `Thiếu các trường bắt buộc: ${missingFields.join(', ')}`
    };
  }

  // Validate numeric fields
  const numericFields = ['customer_id', 'product_id', 'rating'];
  const invalidNumbers = validateNumericFields(data, numericFields);
  if (invalidNumbers.length > 0) {
    return {
      isValid: false,
      error: `Các trường sau phải là số hợp lệ: ${invalidNumbers.join(', ')}`
    };
  }

  // Validate rating range
  if (data.rating < 1 || data.rating > 5) {
    return {
      isValid: false,
      error: 'Đánh giá phải từ 1 đến 5 sao'
    };
  }

  // Validate comment length if provided
  if (data.comment && data.comment.length > 1000) {
    return {
      isValid: false,
      error: 'Nội dung đánh giá không được vượt quá 1000 ký tự'
    };
  }

  return { isValid: true };
};

// Check if customer has purchased product
const hasCustomerPurchasedProduct = async (customerId, productId) => {
  const order = await prisma.orders.findFirst({
    where: {
      customer_id: Number(customerId),
      status: 'confirmed',
      orderitems: {
        some: {
          product_id: Number(productId)
        }
      }
    }
  });
  return !!order;
};

// Check if customer has already reviewed product
const hasCustomerReviewedProduct = async (customerId, productId) => {
  const review = await prisma.reviews.findFirst({
    where: {
      customer_id: Number(customerId),
      product_id: Number(productId)
    }
  });
  return !!review;
};

export const getAllReviews = async ({ 
  page = 1, 
  limit = 10,
  productId,
  customerId,
  rating,
  sortBy = 'created_at',
  sortOrder = 'desc'
}) => {
  try {
    const where = {};

    if (productId) {
      where.product_id = Number(productId);
    }

    if (customerId) {
      where.customer_id = Number(customerId);
    }

    if (rating) {
      where.rating = Number(rating);
    }

    const [reviews, total] = await Promise.all([
      prisma.reviews.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
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
          products: {
            select: {
              id: true,
              name: true,
              image_url: true
            }
          }
        },
        orderBy: {
          [sortBy]: sortOrder
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

export const getReviewById = async (id) => {
  try {
    const review = await prisma.reviews.findUnique({
      where: { id: Number(id) },
      include: {
        customers: {
          select: {
            id: true,
            users: {
              select: {
                full_name: true
              }
            }
          }
        },
        products: {
          select: {
            id: true,
            name: true,
            image_url: true
          }
        }
      }
    });

    if (!review) {
      return {
        success: false,
        status: 404,
        error: 'Không tìm thấy đánh giá'
      };
    }

    return {
      success: true,
      data: review
    };
  } catch (error) {
    throw error;
  }
};

export const createReview = async (data) => {
  try {
    // Validate review data
    const validation = validateReview(data);
    if (!validation.isValid) {
      return {
        success: false,
        status: 400,
        error: validation.error
      };
    }

    // Check if product and customer exist
    const [product, customer] = await Promise.all([
      prisma.products.findUnique({
        where: { id: Number(data.product_id) }
      }),
      prisma.customers.findUnique({
        where: { id: Number(data.customer_id) }
      })
    ]);

    if (!product) {
      return {
        success: false,
        status: 404,
        error: 'Sản phẩm không tồn tại'
      };
    }

    if (!customer) {
      return {
        success: false,
        status: 404,
        error: 'Khách hàng không tồn tại'
      };
    }

    // Check if customer has purchased product
    const hasPurchased = await hasCustomerPurchasedProduct(
      data.customer_id,
      data.product_id
    );

    if (!hasPurchased) {
      return {
        success: false,
        status: 400,
        error: 'Bạn cần mua sản phẩm trước khi đánh giá'
      };
    }

    // Check if customer has already reviewed
    const hasReviewed = await hasCustomerReviewedProduct(
      data.customer_id,
      data.product_id
    );

    if (hasReviewed) {
      return {
        success: false,
        status: 400,
        error: 'Bạn đã đánh giá sản phẩm này rồi'
      };
    }

    // Lưu media nếu có
    const review = await prisma.reviews.create({
      data: {
        customer_id: Number(data.customer_id),
        product_id: Number(data.product_id),
        rating: Number(data.rating),
        comment: data.comment,
        media: data.media && Array.isArray(data.media) ? data.media : [],
        created_at: new Date()
      },
      include: {
        customers: true,
        products: true
      }
    });

    return {
      success: true,
      data: review
    };
  } catch (error) {
    throw error;
  }
};

export const updateReview = async (id, data) => {
  try {
    // Get existing review
    const existingReview = await prisma.reviews.findUnique({
      where: { id: Number(id) }
    });

    if (!existingReview) {
      return {
        success: false,
        status: 404,
        error: 'Không tìm thấy đánh giá'
      };
    }

    // Validate rating if provided
    if (data.rating !== undefined) {
      if (data.rating < 1 || data.rating > 5) {
        return {
          success: false,
          status: 400,
          error: 'Đánh giá phải từ 1 đến 5 sao'
        };
      }
    }

    // Validate comment length if provided
    if (data.comment && data.comment.length > 1000) {
      return {
        success: false,
        status: 400,
        error: 'Nội dung đánh giá không được vượt quá 1000 ký tự'
      };
    }

    const review = await prisma.reviews.update({
      where: { id: Number(id) },
      data: {
        rating: data.rating ? Number(data.rating) : undefined,
        comment: data.comment,
        updated_at: new Date()
      },
      include: {
        customers: true,
        products: true
      }
    });

    return {
      success: true,
      data: review
    };
  } catch (error) {
    throw error;
  }
};

export const deleteReview = async (id) => {
  try {
    const review = await prisma.reviews.delete({
      where: { id: Number(id) },
      include: {
        customers: true,
        products: true
      }
    });

    return {
      success: true,
      data: review
    };
  } catch (error) {
    if (error.code === 'P2025') {
      return {
        success: false,
        status: 404,
        error: 'Không tìm thấy đánh giá'
      };
    }
    throw error;
  }
};

export const getProductReviews = async (productId, {
  page = 1,
  limit = 10,
  rating,
  sortBy = 'created_at',
  sortOrder = 'desc'
}) => {
  try {
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;

    // Check if product exists
    const product = await prisma.products.findUnique({
      where: { id: Number(productId) }
    });

    if (!product) {
      return {
        success: false,
        status: 404,
        error: 'Sản phẩm không tồn tại'
      };
    }

    const where = { product_id: Number(productId) };
    if (rating) {
      where.rating = Number(rating);
    }

    const [reviews, total] = await Promise.all([
      prisma.reviews.findMany({
        where,
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
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
          products: {
            select: {
              id: true,
              name: true,
              image_url: true
            }
          }
        },
        orderBy: {
          [sortBy]: sortOrder
        }
      }),
      prisma.reviews.count({ where })
    ]);

    return {
      success: true,
      data: {
        product,
        reviews,
        pagination: {
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
          totalRecords: total
        }
      }
    };
  } catch (error) {
    throw error;
  }
};

export const getProductRatingStats = async (productId) => {
  try {
    // Check if product exists
    const product = await prisma.products.findUnique({
      where: { id: Number(productId) }
    });

    if (!product) {
      return {
        success: false,
        status: 404,
        error: 'Sản phẩm không tồn tại'
      };
    }

    const reviews = await prisma.reviews.findMany({
      where: {
        product_id: Number(productId)
      },
      select: {
        rating: true
      }
    });

    const totalReviews = reviews.length;
    if (totalReviews === 0) {
      return {
        success: true,
        data: {
          product,
          stats: {
            averageRating: 0,
            totalReviews: 0,
            ratingDistribution: {
              1: 0, 2: 0, 3: 0, 4: 0, 5: 0
            }
          }
        }
      };
    }

    const ratingSum = reviews.reduce((sum, review) => sum + review.rating, 0);
    const ratingDistribution = reviews.reduce((acc, review) => {
      acc[review.rating] = (acc[review.rating] || 0) + 1;
      return acc;
    }, {});

    return {
      success: true,
      data: {
        product,
        stats: {
          averageRating: ratingSum / totalReviews,
          totalReviews,
          ratingDistribution: {
            1: ratingDistribution[1] || 0,
            2: ratingDistribution[2] || 0,
            3: ratingDistribution[3] || 0,
            4: ratingDistribution[4] || 0,
            5: ratingDistribution[5] || 0
          }
        }
      }
    };
  } catch (error) {
    throw error;
  }
};