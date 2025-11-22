import * as citiesService from './citiesService.js';

export const getAllCities = async (req, res, next) => {
  try {
    const result = await citiesService.getAllCities();
    if (result.success) {
      res.json(result);
    } else {
      res.status(result.status || 400).json(result);
    }
  } catch (error) {
    next(error);
  }
};

export const getCityById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await citiesService.getCityById(id);
    if (result.success) {
      res.json(result);
    } else {
      res.status(result.status || 404).json(result);
    }
  } catch (error) {
    next(error);
  }
};

export const createCity = async (req, res, next) => {
  try {
    const result = await citiesService.createCity(req.body);
    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(result.status || 400).json(result);
    }
  } catch (error) {
    next(error);
  }
};

export const updateCity = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await citiesService.updateCity(id, req.body);
    if (result.success) {
      res.json(result);
    } else {
      res.status(result.status || 400).json(result);
    }
  } catch (error) {
    next(error);
  }
};

export const deleteCity = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await citiesService.deleteCity(id);
    if (result.success) {
      res.json(result);
    } else {
      res.status(result.status || 400).json(result);
    }
  } catch (error) {
    next(error);
  }
};

export const searchCities = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({
        success: false,
        error: 'Query parameter "q" is required'
      });
    }
    const result = await citiesService.searchCities(q);
    res.json(result);
  } catch (error) {
    next(error);
  }
};
