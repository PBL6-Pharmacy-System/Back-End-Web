import * as shippingAddressService from './shippingAddressService.js';

/**
 * Get all addresses of a customer
 */
export const getCustomerAddresses = async (req, res, next) => {
  try {
    const { customerId } = req.params;

    const result = await shippingAddressService.getCustomerAddresses(customerId);

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
 * Get address by ID
 */
export const getAddressById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await shippingAddressService.getAddressById(id);

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
 * Create new shipping address
 */
export const createAddress = async (req, res, next) => {
  try {
    const { customerId } = req.params;
    const addressData = req.body;

    const result = await shippingAddressService.createAddress(customerId, addressData);

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
 * Update shipping address
 */
export const updateAddress = async (req, res, next) => {
  try {
    const { id } = req.params;
    const addressData = req.body;

    const result = await shippingAddressService.updateAddress(id, addressData);

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
 * Delete shipping address
 */
export const deleteAddress = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await shippingAddressService.deleteAddress(id);

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
 * Set address as default
 */
export const setDefaultAddress = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { customerId } = req.body;

    // If customerId not in body, get from route params if available
    const customerIdToUse = customerId || req.params.customerId;

    const result = await shippingAddressService.setDefaultAddress(id, customerIdToUse);

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
 * Get default address of a customer
 */
export const getDefaultAddress = async (req, res, next) => {
  try {
    const { customerId } = req.params;

    const result = await shippingAddressService.getDefaultAddress(customerId);

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
