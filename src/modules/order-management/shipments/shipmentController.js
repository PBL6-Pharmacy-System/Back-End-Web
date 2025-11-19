import * as shipmentService from './shipmentService.js';

/**
 * Create shipment for an order
 */
export const createShipment = async (req, res, next) => {
  try {
    const shipmentData = req.body;

    const result = await shipmentService.createShipment(shipmentData);

    if (!result.success) {
      return res.status(result.status || 400).json({
        success: false,
        error: result.error
      });
    }

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Get shipment by ID
 */
export const getShipmentById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await shipmentService.getShipmentById(id);

    if (!result.success) {
      return res.status(result.status || 400).json({
        success: false,
        error: result.error
      });
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Get all shipments (Admin/Staff)
 */
export const getAllShipments = async (req, res, next) => {
  try {
    const filters = {
      page: req.query.page,
      limit: req.query.limit,
      status: req.query.status,
      branchId: req.query.branchId,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      sortBy: req.query.sortBy,
      sortOrder: req.query.sortOrder
    };

    const result = await shipmentService.getAllShipments(filters);

    if (!result.success) {
      return res.status(result.status || 400).json({
        success: false,
        error: result.error
      });
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Get shipments for an order
 */
export const getOrderShipments = async (req, res, next) => {
  try {
    const { orderId } = req.params;

    const result = await shipmentService.getOrderShipments(orderId);

    if (!result.success) {
      return res.status(result.status || 400).json({
        success: false,
        error: result.error
      });
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Track shipment by tracking number
 */
export const trackShipment = async (req, res, next) => {
  try {
    const { trackingNumber } = req.params;

    const result = await shipmentService.trackShipment(trackingNumber);

    if (!result.success) {
      return res.status(result.status || 400).json({
        success: false,
        error: result.error
      });
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Update shipment status
 */
export const updateShipmentStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user?.id;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Trạng thái vận chuyển là bắt buộc'
      });
    }

    const result = await shipmentService.updateShipmentStatus(id, status, userId);

    if (!result.success) {
      return res.status(result.status || 400).json({
        success: false,
        error: result.error
      });
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Get shipment statistics (Admin)
 */
export const getShipmentStatistics = async (req, res, next) => {
  try {
    const filters = {
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      branchId: req.query.branchId
    };

    const result = await shipmentService.getShipmentStatistics(filters);

    if (!result.success) {
      return res.status(result.status || 400).json({
        success: false,
        error: result.error
      });
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
};
