import * as businessStatisticsService from './businessStatisticsService.js';

// Dashboard tổng quan
export const getDashboardOverview = async (req, res) => {
  try {
    const result = await businessStatisticsService.getDashboardOverview();
    res.json(result);
  } catch (error) {
    console.error('Error in getDashboardOverview:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi lấy tổng quan dashboard'
    });
  }
};

// Doanh thu theo thời gian
export const getRevenueByPeriod = async (req, res) => {
  try {
    const { startDate, endDate, groupBy } = req.query;
    const result = await businessStatisticsService.getRevenueByPeriod({
      startDate,
      endDate,
      groupBy
    });
    res.json(result);
  } catch (error) {
    console.error('Error in getRevenueByPeriod:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi lấy doanh thu theo thời gian'
    });
  }
};

// Đơn hàng theo trạng thái
export const getOrdersByStatus = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const result = await businessStatisticsService.getOrdersByStatus({
      startDate,
      endDate
    });
    res.json(result);
  } catch (error) {
    console.error('Error in getOrdersByStatus:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi lấy đơn hàng theo trạng thái'
    });
  }
};

// Sản phẩm bán chạy nhất
export const getBestSellingProducts = async (req, res) => {
  try {
    const { startDate, endDate, limit } = req.query;
    const result = await businessStatisticsService.getBestSellingProducts({
      startDate,
      endDate,
      limit: Number(limit) || 10
    });
    res.json(result);
  } catch (error) {
    console.error('Error in getBestSellingProducts:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi lấy sản phẩm bán chạy nhất'
    });
  }
};

// Khách hàng mua nhiều nhất
export const getTopCustomers = async (req, res) => {
  try {
    const { startDate, endDate, limit } = req.query;
    const result = await businessStatisticsService.getTopCustomers({
      startDate,
      endDate,
      limit: Number(limit) || 10
    });
    res.json(result);
  } catch (error) {
    console.error('Error in getTopCustomers:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi lấy khách hàng mua nhiều nhất'
    });
  }
};

// Hiệu quả voucher
export const getVoucherPerformance = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const result = await businessStatisticsService.getVoucherPerformance({
      startDate,
      endDate
    });
    res.json(result);
  } catch (error) {
    console.error('Error in getVoucherPerformance:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi lấy hiệu quả voucher'
    });
  }
};

// Hiệu quả flashsale
export const getFlashsalePerformance = async (req, res) => {
  try {
    const { flashsaleId } = req.query;
    const result = await businessStatisticsService.getFlashsalePerformance({
      flashsaleId
    });
    res.json(result);
  } catch (error) {
    console.error('Error in getFlashsalePerformance:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi lấy hiệu quả flashsale'
    });
  }
};

// Tỷ lệ chuyển đổi
export const getConversionRate = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const result = await businessStatisticsService.getConversionRate({
      startDate,
      endDate
    });
    res.json(result);
  } catch (error) {
    console.error('Error in getConversionRate:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi lấy tỷ lệ chuyển đổi'
    });
  }
};

// Giá trị đơn hàng trung bình
export const getAverageOrderValue = async (req, res) => {
  try {
    const { startDate, endDate, groupBy } = req.query;
    const result = await businessStatisticsService.getAverageOrderValue({
      startDate,
      endDate,
      groupBy
    });
    res.json(result);
  } catch (error) {
    console.error('Error in getAverageOrderValue:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi lấy giá trị đơn hàng trung bình'
    });
  }
};

// Doanh thu theo phương thức thanh toán
export const getRevenueByPaymentMethod = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const result = await businessStatisticsService.getRevenueByPaymentMethod({
      startDate,
      endDate
    });
    res.json(result);
  } catch (error) {
    console.error('Error in getRevenueByPaymentMethod:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi lấy doanh thu theo phương thức thanh toán'
    });
  }
};
