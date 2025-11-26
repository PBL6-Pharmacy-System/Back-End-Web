import * as paymentService from './paymentService.js';

/**
 * Get payment by ID
 */
export const getPaymentById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await paymentService.getPaymentById(id);

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
 * Update payment status
 */
export const updatePaymentStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user?.userId; // From auth middleware

    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Trạng thái thanh toán là bắt buộc'
      });
    }

    const result = await paymentService.updatePaymentStatus(id, status, userId);

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
 * Process COD payment (confirm when delivered)
 */
export const processCODPayment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId; // From auth middleware

    const result = await paymentService.processCODPayment(id, userId);

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
 * Get payment statistics (Admin)
 */
export const getPaymentStatistics = async (req, res, next) => {
  try {
    const filters = {
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      paymentMethod: req.query.paymentMethod
    };

    const result = await paymentService.getPaymentStatistics(filters);

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
