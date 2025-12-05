import * as dashboardService from './dashboardService.js';

export const getOverview = async (req, res, next) => {
  try {
    const { branchId } = req.query;
    const result = await dashboardService.getOverviewStats({ branchId });
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getRevenueAnalytics = async (req, res, next) => {
  try {
    const { period, startDate, endDate, branchId, comparison } = req.query;
    
    const result = await dashboardService.getRevenueAnalytics({
      period,
      startDate,
      endDate,
      branchId,
      comparison: comparison !== 'false'
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getTopProducts = async (req, res, next) => {
  try {
    const { period, startDate, endDate, branchId, limit } = req.query;
    
    const result = await dashboardService.getTopProducts({
      period,
      startDate,
      endDate,
      branchId,
      limit
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getOrdersStatistics = async (req, res, next) => {
  try {
    const { period, startDate, endDate, branchId, comparison } = req.query;
    
    const result = await dashboardService.getOrdersStatistics({
      period,
      startDate,
      endDate,
      branchId,
      comparison: comparison !== 'false'
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getCustomersStatistics = async (req, res, next) => {
  try {
    const { period, startDate, endDate, limit, branchId } = req.query;
    
    const result = await dashboardService.getCustomersStatistics({
      period,
      startDate,
      endDate,
      limit,
      branchId
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getInventoryStatistics = async (req, res, next) => {
  try {
    const { branchId } = req.query;
    const result = await dashboardService.getInventoryStatistics({ branchId });
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getBranchesPerformance = async (req, res, next) => {
  try {
    const { period, startDate, endDate, comparison } = req.query;
    
    const result = await dashboardService.getBranchesPerformance({
      period,
      startDate,
      endDate,
      comparison: comparison !== 'false'
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getPromotionsStatistics = async (req, res, next) => {
  try {
    const { period, startDate, endDate, branchId } = req.query;
    
    const result = await dashboardService.getPromotionsStatistics({
      period,
      startDate,
      endDate,
      branchId
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getReviewsStatistics = async (req, res, next) => {
  try {
    const { period, startDate, endDate, productId, branchId } = req.query;
    
    const result = await dashboardService.getReviewsStatistics({
      period,
      startDate,
      endDate,
      productId,
      branchId
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getRecentActivities = async (req, res, next) => {
  try {
    const { limit, branchId } = req.query;
    
    const result = await dashboardService.getRecentActivities({
      limit,
      branchId
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
};
