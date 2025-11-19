import * as bestSellersService from './bestSellersService.js';

/**
 * Get top 10 best selling products
 */
export const getBestSellers = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const result = await bestSellersService.getBestSellers(limit);

    if (!result.success) {
      return res.status(result.status || 500).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Get best sellers controller error:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi lấy sản phẩm nổi bật'
    });
  }
};

/**
 * Get product statistics
 */
export const getProductStats = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await bestSellersService.getProductStats(parseInt(id));

    if (!result.success) {
      return res.status(result.status || 500).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Get product stats controller error:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi lấy thống kê sản phẩm'
    });
  }
};
