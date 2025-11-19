import express from 'express';
import * as shippingAddressController from './shippingAddressController.js';
import { authenticateToken, authorizeRoles } from '../../auth/auth.middleware.js';
import { validateId } from '../../../middlewares/validate.middleware.js';

const router = express.Router();

/**
 * GET /api/customers/:customerId/shipping-addresses
 * Get all shipping addresses of a customer
 * Access: Admin, Staff, or the customer themselves
 */
router.get(
  '/customers/:customerId/shipping-addresses',
  authenticateToken,
  validateId('customerId'),
  shippingAddressController.getCustomerAddresses
);

/**
 * GET /api/customers/:customerId/shipping-addresses/default
 * Get default shipping address of a customer
 * Access: Admin, Staff, or the customer themselves
 */
router.get(
  '/customers/:customerId/shipping-addresses/default',
  authenticateToken,
  validateId('customerId'),
  shippingAddressController.getDefaultAddress
);

/**
 * GET /api/shipping-addresses/:id
 * Get shipping address by ID
 * Access: Admin, Staff, or address owner
 */
router.get(
  '/shipping-addresses/:id',
  authenticateToken,
  validateId(),
  shippingAddressController.getAddressById
);

/**
 * POST /api/customers/:customerId/shipping-addresses
 * Create new shipping address for a customer
 * Access: Admin, Staff, or the customer themselves
 * Body: {
 *   address_line: string (required),
 *   city: string (required),
 *   state: string (optional),
 *   postal_code: string (optional),
 *   country: string (optional, default: "Vietnam"),
 *   is_default: boolean (optional)
 * }
 */
router.post(
  '/customers/:customerId/shipping-addresses',
  authenticateToken,
  validateId('customerId'),
  shippingAddressController.createAddress
);

/**
 * PUT /api/shipping-addresses/:id
 * Update shipping address
 * Access: Admin, Staff, or address owner
 * Body: {
 *   address_line: string (optional),
 *   city: string (optional),
 *   state: string (optional),
 *   postal_code: string (optional),
 *   country: string (optional),
 *   is_default: boolean (optional)
 * }
 */
router.put(
  '/shipping-addresses/:id',
  authenticateToken,
  validateId(),
  shippingAddressController.updateAddress
);

/**
 * DELETE /api/shipping-addresses/:id
 * Delete shipping address
 * Access: Admin, Staff, or address owner
 * Note: Cannot delete if address is used in active orders
 */
router.delete(
  '/shipping-addresses/:id',
  authenticateToken,
  validateId(),
  shippingAddressController.deleteAddress
);

/**
 * PUT /api/shipping-addresses/:id/set-default
 * Set an address as default
 * Access: Admin, Staff, or address owner
 * Body: { customerId: number }
 */
router.put(
  '/shipping-addresses/:id/set-default',
  authenticateToken,
  validateId(),
  shippingAddressController.setDefaultAddress
);

export default router;
