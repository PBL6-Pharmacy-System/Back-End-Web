import express from 'express';
import * as voucherController from '../controllers/voucherController.js';
const router = express.Router();
router.get('/vouchers', voucherController.getAllVouchers);
router.get('/vouchers/:id', voucherController.getVoucherById);
router.post('/vouchers', voucherController.createVoucher);
router.put('/vouchers/:id', voucherController.updateVoucher);
router.delete('/vouchers/:id', voucherController.deleteVoucher);
export default router;