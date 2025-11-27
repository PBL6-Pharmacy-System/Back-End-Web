import express from 'express';
import * as citiesController from './citiesController.js';
import { authenticateToken, authorizeAdmin } from '../../auth/auth.middleware.js';
import { validateId } from '../../../middlewares/validate.middleware.js';

const router = express.Router();

// ===============================================
// PUBLIC ROUTES - Xem danh sách thành phố
// ===============================================
router.get('/', citiesController.getAllCities);
router.get('/search', citiesController.searchCities);
router.get('/:id', validateId(), citiesController.getCityById);

// ===============================================
// ADMIN ONLY ROUTES - Quản lý thành phố
// ===============================================
router.post('/',
    authenticateToken,
    authorizeAdmin,
    citiesController.createCity
);

router.put('/:id',
    authenticateToken,
    authorizeAdmin,
    validateId(),
    citiesController.updateCity
);

router.delete('/:id',
    authenticateToken,
    authorizeAdmin,
    validateId(),
    citiesController.deleteCity
);

export default router;
