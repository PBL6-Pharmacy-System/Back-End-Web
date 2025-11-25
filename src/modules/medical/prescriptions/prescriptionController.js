import * as prescriptionService from './prescriptionService.js';

/**
 * Upload prescription
 */
export const uploadPrescription = async (req, res, next) => {
  try {
    const prescriptionData = req.body;

    const result = await prescriptionService.uploadPrescription(prescriptionData);

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
 * Get prescription by ID
 */
export const getPrescriptionById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await prescriptionService.getPrescriptionById(id);

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
 * Get all prescriptions (Admin/Pharmacist)
 */
export const getAllPrescriptions = async (req, res, next) => {
  try {
    const filters = {
      page: req.query.page,
      limit: req.query.limit,
      status: req.query.status,
      customerId: req.query.customerId,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      sortBy: req.query.sortBy,
      sortOrder: req.query.sortOrder
    };

    const result = await prescriptionService.getAllPrescriptions(filters);

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
 * Get customer's prescriptions
 */
export const getCustomerPrescriptions = async (req, res, next) => {
  try {
    const { customerId } = req.params;
    const filters = {
      page: req.query.page,
      limit: req.query.limit,
      status: req.query.status
    };

    const result = await prescriptionService.getCustomerPrescriptions(customerId, filters);

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
 * Verify prescription (Pharmacist/Admin)
 */
export const verifyPrescription = async (req, res, next) => {
  try {
    const { id } = req.params;
    const verificationData = req.body;
    const userId = req.user?.userId;

    const result = await prescriptionService.verifyPrescription(id, verificationData, userId);

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
 * Check and update expired prescriptions
 */
export const checkExpiredPrescriptions = async (req, res, next) => {
  try {
    const result = await prescriptionService.checkExpiredPrescriptions();

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
 * Get prescription statistics (Admin)
 */
export const getPrescriptionStatistics = async (req, res, next) => {
  try {
    const filters = {
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };

    const result = await prescriptionService.getPrescriptionStatistics(filters);

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
