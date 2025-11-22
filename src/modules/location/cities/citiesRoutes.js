import express from 'express';
import * as citiesController from './citiesController.js';

const router = express.Router();

// Public routes
router.get('/', citiesController.getAllCities);
router.get('/search', citiesController.searchCities);
router.get('/:id', citiesController.getCityById);

// Admin routes (would need auth middleware in production)
router.post('/', citiesController.createCity);
router.put('/:id', citiesController.updateCity);
router.delete('/:id', citiesController.deleteCity);

export default router;
