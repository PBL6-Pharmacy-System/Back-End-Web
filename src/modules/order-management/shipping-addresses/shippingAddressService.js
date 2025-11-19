import prisma from '../../../config/db.js';

/**
 * Get all addresses of a customer
 */
export const getCustomerAddresses = async (customerId) => {
  try {
    // Check if customer exists
    const customer = await prisma.customers.findUnique({
      where: { id: Number(customerId) }
    });

    if (!customer) {
      return {
        success: false,
        status: 404,
        error: 'Không tìm thấy khách hàng'
      };
    }

    // Get all addresses
    const addresses = await prisma.shippingaddresses.findMany({
      where: {
        customer_id: Number(customerId)
      },
      orderBy: [
        { is_default: 'desc' }, // Default address first
        { created_at: 'desc' }
      ]
    });

    return {
      success: true,
      data: addresses
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Get address by ID
 */
export const getAddressById = async (addressId) => {
  try {
    const address = await prisma.shippingaddresses.findUnique({
      where: { id: Number(addressId) },
      include: {
        customers: {
          select: {
            id: true,
            full_name: true,
            phone: true,
            email: true
          }
        }
      }
    });

    if (!address) {
      return {
        success: false,
        status: 404,
        error: 'Không tìm thấy địa chỉ'
      };
    }

    return {
      success: true,
      data: address
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Create new shipping address
 */
export const createAddress = async (customerId, addressData) => {
  try {
    const {
      address_line,
      city,
      state,
      postal_code,
      country = 'Vietnam',
      is_default = false
    } = addressData;

    // Validate required fields
    if (!address_line || !city) {
      return {
        success: false,
        status: 400,
        error: 'Địa chỉ và thành phố là bắt buộc'
      };
    }

    // Check if customer exists
    const customer = await prisma.customers.findUnique({
      where: { id: Number(customerId) }
    });

    if (!customer) {
      return {
        success: false,
        status: 404,
        error: 'Không tìm thấy khách hàng'
      };
    }

    // If this is set as default, unset other default addresses
    if (is_default) {
      await prisma.shippingaddresses.updateMany({
        where: {
          customer_id: Number(customerId),
          is_default: true
        },
        data: {
          is_default: false
        }
      });
    }

    // Check if this is the first address (auto set as default)
    const existingAddresses = await prisma.shippingaddresses.count({
      where: { customer_id: Number(customerId) }
    });

    const shouldBeDefault = existingAddresses === 0 || is_default;

    // Create address
    const address = await prisma.shippingaddresses.create({
      data: {
        customer_id: Number(customerId),
        address_line,
        city,
        state,
        postal_code,
        country,
        is_default: shouldBeDefault,
        created_at: new Date(),
        updated_at: new Date()
      }
    });

    return {
      success: true,
      data: address,
      message: 'Thêm địa chỉ giao hàng thành công'
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Update shipping address
 */
export const updateAddress = async (addressId, addressData) => {
  try {
    const {
      address_line,
      city,
      state,
      postal_code,
      country,
      is_default
    } = addressData;

    // Get current address
    const currentAddress = await prisma.shippingaddresses.findUnique({
      where: { id: Number(addressId) }
    });

    if (!currentAddress) {
      return {
        success: false,
        status: 404,
        error: 'Không tìm thấy địa chỉ'
      };
    }

    // If setting as default, unset other default addresses
    if (is_default === true) {
      await prisma.shippingaddresses.updateMany({
        where: {
          customer_id: currentAddress.customer_id,
          is_default: true,
          id: { not: Number(addressId) }
        },
        data: {
          is_default: false
        }
      });
    }

    // Update address
    const updatedAddress = await prisma.shippingaddresses.update({
      where: { id: Number(addressId) },
      data: {
        ...(address_line && { address_line }),
        ...(city && { city }),
        ...(state !== undefined && { state }),
        ...(postal_code !== undefined && { postal_code }),
        ...(country && { country }),
        ...(is_default !== undefined && { is_default }),
        updated_at: new Date()
      }
    });

    return {
      success: true,
      data: updatedAddress,
      message: 'Cập nhật địa chỉ giao hàng thành công'
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Delete shipping address
 */
export const deleteAddress = async (addressId) => {
  try {
    // Get address to check if it's default
    const address = await prisma.shippingaddresses.findUnique({
      where: { id: Number(addressId) }
    });

    if (!address) {
      return {
        success: false,
        status: 404,
        error: 'Không tìm thấy địa chỉ'
      };
    }

    // Check if address is being used in any active orders
    const ordersUsingAddress = await prisma.orders.count({
      where: {
        shipping_address_id: Number(addressId),
        status: {
          notIn: ['delivered', 'cancelled', 'completed']
        }
      }
    });

    if (ordersUsingAddress > 0) {
      return {
        success: false,
        status: 400,
        error: 'Không thể xóa địa chỉ đang được sử dụng trong đơn hàng'
      };
    }

    const customerId = address.customer_id;
    const wasDefault = address.is_default;

    // Delete address
    await prisma.shippingaddresses.delete({
      where: { id: Number(addressId) }
    });

    // If deleted address was default, set another address as default
    if (wasDefault) {
      const nextAddress = await prisma.shippingaddresses.findFirst({
        where: { customer_id: customerId },
        orderBy: { created_at: 'desc' }
      });

      if (nextAddress) {
        await prisma.shippingaddresses.update({
          where: { id: nextAddress.id },
          data: { is_default: true }
        });
      }
    }

    return {
      success: true,
      message: 'Xóa địa chỉ giao hàng thành công'
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Set address as default
 */
export const setDefaultAddress = async (addressId, customerId) => {
  try {
    // Verify address belongs to customer
    const address = await prisma.shippingaddresses.findUnique({
      where: { id: Number(addressId) }
    });

    if (!address) {
      return {
        success: false,
        status: 404,
        error: 'Không tìm thấy địa chỉ'
      };
    }

    if (address.customer_id !== Number(customerId)) {
      return {
        success: false,
        status: 403,
        error: 'Địa chỉ không thuộc về khách hàng này'
      };
    }

    // Already default
    if (address.is_default) {
      return {
        success: true,
        data: address,
        message: 'Địa chỉ đã là địa chỉ mặc định'
      };
    }

    // Transaction: unset current default and set new default
    const [_, updatedAddress] = await prisma.$transaction([
      // Unset current default
      prisma.shippingaddresses.updateMany({
        where: {
          customer_id: Number(customerId),
          is_default: true
        },
        data: {
          is_default: false
        }
      }),
      // Set new default
      prisma.shippingaddresses.update({
        where: { id: Number(addressId) },
        data: {
          is_default: true,
          updated_at: new Date()
        }
      })
    ]);

    return {
      success: true,
      data: updatedAddress,
      message: 'Đã đặt làm địa chỉ mặc định'
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Get default address of a customer
 */
export const getDefaultAddress = async (customerId) => {
  try {
    const address = await prisma.shippingaddresses.findFirst({
      where: {
        customer_id: Number(customerId),
        is_default: true
      }
    });

    if (!address) {
      return {
        success: false,
        status: 404,
        error: 'Không tìm thấy địa chỉ mặc định'
      };
    }

    return {
      success: true,
      data: address
    };
  } catch (error) {
    throw error;
  }
};
