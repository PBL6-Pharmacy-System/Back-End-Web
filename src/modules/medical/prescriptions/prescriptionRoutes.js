import express from 'express';
import * as prescriptionController from './prescriptionController.js';
import { authenticateToken, authorizeAdmin, authorizeRoles } from '../../auth/auth.middleware.js';
import { validateId } from '../../../middlewares/validate.middleware.js';

const router = express.Router();

/**
 * POST /api/prescriptions
 * Upload a new prescription
 * Access: Authenticated users (Customer uploads their own)
 * Body: {
 *   customerId: number (required),
 *   orderId: number (optional),
 *   doctorName: string (optional),
 *   doctorLicense: string (optional),
 *   hospitalName: string (optional),
 *   diagnosis: string (optional),
 *   prescribedDate: date (optional),
 *   expiryDate: date (optional),
 *   imageUrl: string (required if no pdfUrl),
 *   pdfUrl: string (required if no imageUrl)
 * }
 */
router.post(
  '/prescriptions',
  authenticateToken,
  prescriptionController.uploadPrescription
);

/**
 * GET /api/prescriptions/statistics
 * Get prescription statistics
 * Access: Admin only
 * Query params: startDate, endDate
 */
router.get(
  '/prescriptions/statistics',
  authenticateToken,
  authorizeAdmin,
  prescriptionController.getPrescriptionStatistics
);

/**
 * POST /api/prescriptions/check-expired
 * Check and update expired prescriptions (Cron job endpoint)
 * Access: Admin only
 */
router.post(
  '/prescriptions/check-expired',
  authenticateToken,
  authorizeAdmin,
  prescriptionController.checkExpiredPrescriptions
);

/**
 * GET /api/prescriptions
 * Get all prescriptions (Admin/Staff/Pharmacist)
 * Access: Admin, Staff only
 * Query params: page, limit, status, customerId, startDate, endDate, sortBy, sortOrder
 */
router.get(
  '/prescriptions',
  authenticateToken,
  authorizeRoles('admin', 'staff'),
  prescriptionController.getAllPrescriptions
);

/**
 * GET /api/prescriptions/:id
 * Get prescription details by ID
 * Access: Admin, Staff, or Customer who owns the prescription
 */
router.get(
  '/prescriptions/:id',
  authenticateToken,
  validateId(),
  prescriptionController.getPrescriptionById
);

/**
 * GET /api/customers/:customerId/prescriptions
 * Get all prescriptions of a specific customer
 * Access: Admin, Staff, or the Customer themselves
 */
router.get(
  '/customers/:customerId/prescriptions',
  authenticateToken,
  validateId('customerId'),
  prescriptionController.getCustomerPrescriptions
);

/**
 * POST /api/prescriptions/:id/verify
 * Verify or reject a prescription (Pharmacist/Admin)
 * Access: Admin, Staff (Pharmacist) only
 * Body: {
 *   status: string (required - "verified" or "rejected"),
 *   verificationNotes: string (optional)
 * }
 */
router.post(
  '/prescriptions/:id/verify',
  authenticateToken,
  authorizeRoles('admin', 'staff'),
  validateId(),
  prescriptionController.verifyPrescription
);

export default router;
