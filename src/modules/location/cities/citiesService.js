import prisma from '../../../config/db.js';

/**
 * Get all cities
 */
export const getAllCities = async () => {
  try {
    const cities = await prisma.cities.findMany({
      orderBy: {
        name: 'asc'
      }
    });

    return {
      success: true,
      data: cities
    };
  } catch (error) {
    console.error('Error fetching cities:', error);
    throw error;
  }
};

/**
 * Get city by ID
 */
export const getCityById = async (cityId) => {
  try {
    const city = await prisma.cities.findUnique({
      where: {
        id: Number(cityId)
      },
      include: {
        _count: {
          select: {
            branches: true,
            customers: true,
            shippingaddresses: true
          }
        }
      }
    });

    if (!city) {
      return {
        success: false,
        error: 'Không tìm thấy thành phố',
        status: 404
      };
    }

    return {
      success: true,
      data: city
    };
  } catch (error) {
    console.error('Error fetching city:', error);
    throw error;
  }
};

/**
 * Create new city
 */
export const createCity = async (data) => {
  try {
    const { name, code, region } = data;

    // Check if city already exists
    const existing = await prisma.cities.findFirst({
      where: {
        name: {
          equals: name,
          mode: 'insensitive'
        }
      }
    });

    if (existing) {
      return {
        success: false,
        error: 'Thành phố đã tồn tại',
        status: 400
      };
    }

    const city = await prisma.cities.create({
      data: {
        name,
        code,
        region
      }
    });

    return {
      success: true,
      data: city
    };
  } catch (error) {
    console.error('Error creating city:', error);
    throw error;
  }
};

/**
 * Update city
 */
export const updateCity = async (cityId, data) => {
  try {
    const { name, code, region } = data;

    // Check if city exists
    const existing = await prisma.cities.findUnique({
      where: { id: Number(cityId) }
    });

    if (!existing) {
      return {
        success: false,
        error: 'Không tìm thấy thành phố',
        status: 404
      };
    }

    // Check for duplicate name
    if (name && name !== existing.name) {
      const duplicate = await prisma.cities.findFirst({
        where: {
          name: {
            equals: name,
            mode: 'insensitive'
          },
          id: {
            not: Number(cityId)
          }
        }
      });

      if (duplicate) {
        return {
          success: false,
          error: 'Tên thành phố đã tồn tại',
          status: 400
        };
      }
    }

    const city = await prisma.cities.update({
      where: { id: Number(cityId) },
      data: {
        ...(name && { name }),
        ...(code !== undefined && { code }),
        ...(region !== undefined && { region }),
        updated_at: new Date()
      }
    });

    return {
      success: true,
      data: city
    };
  } catch (error) {
    console.error('Error updating city:', error);
    throw error;
  }
};

/**
 * Delete city
 */
export const deleteCity = async (cityId) => {
  try {
    // Check if city exists
    const existing = await prisma.cities.findUnique({
      where: { id: Number(cityId) },
      include: {
        _count: {
          select: {
            branches: true,
            customers: true,
            shippingaddresses: true
          }
        }
      }
    });

    if (!existing) {
      return {
        success: false,
        error: 'Không tìm thấy thành phố',
        status: 404
      };
    }

    // Check if city is in use
    const totalUsage = existing._count.branches + existing._count.customers + existing._count.shippingaddresses;
    if (totalUsage > 0) {
      return {
        success: false,
        error: `Không thể xóa thành phố đang được sử dụng (${totalUsage} bản ghi liên quan)`,
        status: 400
      };
    }

    await prisma.cities.delete({
      where: { id: Number(cityId) }
    });

    return {
      success: true,
      message: 'Xóa thành phố thành công'
    };
  } catch (error) {
    console.error('Error deleting city:', error);
    throw error;
  }
};

/**
 * Search cities by name
 */
export const searchCities = async (query) => {
  try {
    const cities = await prisma.cities.findMany({
      where: {
        name: {
          contains: query,
          mode: 'insensitive'
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    return {
      success: true,
      data: cities
    };
  } catch (error) {
    console.error('Error searching cities:', error);
    throw error;
  }
};
