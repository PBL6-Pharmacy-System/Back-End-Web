import * as reviewService from './reviewService.js';

// Get all reviews with optional filters
export const getAllReviews = async (req, res) => {
  try {
    const { page, limit, productId, customerId, rating, sortBy, sortOrder } = req.query;
    const result = await reviewService.getAllReviews({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
      productId,
      customerId,
      rating,
      sortBy,
      sortOrder
    });

    res.json(result);
  } catch (err) {
    console.error('Error in getAllReviews:', err);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi lấy danh sách đánh giá'
    });
  }
};

// Get review by ID
export const getReviewById = async (req, res) => {
  try {
    const result = await reviewService.getReviewById(req.params.id);
    if (!result.success) {
      return res.status(result.status).json(result);
    }
    res.json(result);
  } catch (err) {
    console.error('Error in getReviewById:', err);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi lấy thông tin đánh giá'
    });
  }
};

// Create new review
// ✅ FIXED: Add check if customer purchased the product
export const createReview = async (req, res) => {
  try {
    // Get customer_id from authenticated user
    const customer_id = req.user?.customer_id;

    if (!customer_id) {
      return res.status(400).json({
        success: false,
        error: 'Chỉ khách hàng mới có thể tạo đánh giá'
      });
    }

    // Xử lý file upload (media)
    let media = [];
    if (req.files && req.files.length > 0) {
      media = req.files.map(f => `/uploads/reviews/${f.filename}`);
    }

    // Map productId to product_id if needed
    const reviewData = {
      customer_id,
      product_id: req.body.productId || req.body.product_id,
      rating: req.body.rating,
      comment: req.body.comment,
      media
    };

    const result = await reviewService.createReview(reviewData);
    if (!result.success) {
      return res.status(result.status).json(result);
    }
    res.status(201).json(result);
  } catch (err) {
    console.error('Error in createReview:', err);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi tạo đánh giá'
    });
  }
};

// Update existing review
// ✅ FIXED: Add ownership validation
export const updateReview = async (req, res) => {
  try {
    // ✅ Get review first to check ownership
    const reviewResult = await reviewService.getReviewById(req.params.id);

    if (!reviewResult.success) {
      return res.status(reviewResult.status).json(reviewResult);
    }

    // ✅ Check ownership (only customer can update their own review, or admin)
    if (req.user.role_name !== 'admin') {
      if (reviewResult.data.customer_id !== req.user.customer_id) {
        return res.status(403).json({
          success: false,
          error: 'Bạn chỉ có thể sửa đánh giá của chính mình'
        });
      }
    }

    const result = await reviewService.updateReview(req.params.id, req.body);
    if (!result.success) {
      return res.status(result.status).json(result);
    }
    res.json(result);
  } catch (err) {
    console.error('Error in updateReview:', err);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi cập nhật đánh giá'
    });
  }
};

// Delete review
export const deleteReview = async (req, res) => {
  try {
    const result = await reviewService.deleteReview(req.params.id);
    if (!result.success) {
      return res.status(result.status).json(result);
    }
    res.json(result);
  } catch (err) {
    console.error('Error in deleteReview:', err);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi xóa đánh giá'
    });
  }
};

// Get reviews for a specific product
export const getProductReviews = async (req, res) => {
  try {
    const { page, limit, rating, sortBy, sortOrder } = req.query;
    const result = await reviewService.getProductReviews(
      req.params.productId,
      {
        page: parseInt(page),
        limit: parseInt(limit),
        rating,
        sortBy,
        sortOrder
      }
    );

    if (!result.success) {
      return res.status(result.status).json(result);
    }
    res.json(result);
  } catch (err) {
    console.error('Error in getProductReviews:', err);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi lấy đánh giá của sản phẩm'
    });
  }
};

// Get rating statistics for a product
export const getProductRatingStats = async (req, res) => {
  try {
    const result = await reviewService.getProductRatingStats(req.params.productId);
    if (!result.success) {
      return res.status(result.status).json(result);
    }
    res.json(result);
  } catch (err) {
    console.error('Error in getProductRatingStats:', err);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi lấy thống kê đánh giá'
    });
  }
};