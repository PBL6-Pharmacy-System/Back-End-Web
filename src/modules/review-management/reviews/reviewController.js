import * as reviewService from './reviewService.js';

// Get all reviews with optional filters
export const getAllReviews = async (req, res) => {
  try {
    const { page, limit, productId, customerId, rating, sortBy, sortOrder } = req.query;
    const result = await reviewService.getAllReviews({
      page: parseInt(page),
      limit: parseInt(limit),
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
export const createReview = async (req, res) => {
  try {
    const result = await reviewService.createReview(req.body);
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
export const updateReview = async (req, res) => {
  try {
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