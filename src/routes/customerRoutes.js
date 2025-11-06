import express from 'express';
import * as customerController from '../controllers/customerController.js';
import { authenticateToken, authorizeAdmin } from '../middlewares/auth.middleware.js';
import { validateId } from '../middlewares/validate.middleware.js';

const router = express.Router();

// Admin only - Xem tất cả customers
router.get('/customers', authenticateToken, authorizeAdmin, customerController.getAllCustomers);

// Protected routes - Customer có thể xem/sửa thông tin của mình
router.get('/customers/:id', authenticateToken, validateId(), customerController.getCustomerById);
router.put('/customers/:id', authenticateToken, validateId(), customerController.updateCustomer);

// Public - Tạo customer mới (khi register)
router.post('/customers', customerController.createCustomer);

// Admin only - Xóa customer
router.delete('/customers/:id', authenticateToken, authorizeAdmin, validateId(), customerController.deleteCustomer);

export default router;