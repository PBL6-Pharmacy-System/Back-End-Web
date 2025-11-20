import prisma from '../../../config/db.js';
import { updateProductSoldCount } from '../../product-management/products/bestSellersService.js';

/**
 * Apply voucher to order and calculate discount
 */
const applyVoucher = async (voucherCode, totalAmount, customerId) => {
  if (!voucherCode) {
    return {
      valid: true,
      discountAmount: 0,
      voucher: null
    };
  }

  // Find voucher
  const voucher = await prisma.vouchers.findUnique({
    where: {
      code: voucherCode
    }
  });

  if (!voucher) {
    return {
      valid: false,
      error: 'Mã voucher không tồn tại'
    };
  }

  // Check if voucher is still valid (date range)
  const now = new Date();
  const startDate = new Date(voucher.start_date);
  const endDate = new Date(voucher.end_date);
  endDate.setHours(23, 59, 59, 999); // End of day

  if (now < startDate || now > endDate) {
    return {
      valid: false,
      error: 'Mã voucher đã hết hạn hoặc chưa có hiệu lực'
    };
  }

  // Check usage limit
  if (voucher.usage_limit && voucher.used_count >= voucher.usage_limit) {
    return {
      valid: false,
      error: 'Mã voucher đã hết lượt sử dụng'
    };
  }

  // Check minimum order value
  if (voucher.min_order_value && totalAmount < voucher.min_order_value) {
    return {
      valid: false,
      error: `Đơn hàng phải có giá trị tối thiểu ${voucher.min_order_value.toString()} VNĐ`
    };
  }

  // Check if customer has already used this voucher
  const existingUse = await prisma.uservouchers.findFirst({
    where: {
      customer_id: customerId,
      voucher_id: voucher.id,
      is_used: true
    }
  });

  if (existingUse) {
    return {
      valid: false,
      error: 'Bạn đã sử dụng mã voucher này rồi'
    };
  }

  // Calculate discount
  let discountAmount = 0;
  if (voucher.discount_type === 'percentage') {
    discountAmount = (totalAmount * voucher.discount_value) / 100;
  } else if (voucher.discount_type === 'fixed') {
    discountAmount = parseFloat(voucher.discount_value);
  }

  // Ensure discount doesn't exceed total amount
  discountAmount = Math.min(discountAmount, parseFloat(totalAmount));

  return {
    valid: true,
    discountAmount,
    voucher
  };
};

/**
 * Checkout - Convert cart to order with payment
 */
export const checkout = async (data) => {
  try {
    const {
      customerId,
      voucherCode,
      shippingAddressId,
      paymentMethod = 'cash' // cash, card, bank_transfer, momo, zalopay
    } = data;

    // Validate customer
    const customer = await prisma.customers.findUnique({
      where: {
        id: customerId
      }
    });

    if (!customer) {
      return {
        success: false,
        error: 'Khách hàng không tồn tại',
        status: 404
      };
    }

    // Get cart
    const cart = await prisma.orders.findFirst({
      where: {
        customer_id: customerId,
        status: 'cart'
      },
      include: {
        orderitems: {
          include: {
            products: true,
            productunits: true
          }
        }
      }
    });

    if (!cart) {
      return {
        success: false,
        error: 'Giỏ hàng trống',
        status: 400
      };
    }

    if (!cart.orderitems || cart.orderitems.length === 0) {
      return {
        success: false,
        error: 'Giỏ hàng trống',
        status: 400
      };
    }

    // Validate shipping address if provided
    if (shippingAddressId) {
      const address = await prisma.shippingaddresses.findFirst({
        where: {
          id: shippingAddressId,
          customer_id: customerId
        }
      });

      if (!address) {
        return {
          success: false,
          error: 'Địa chỉ giao hàng không hợp lệ',
          status: 400
        };
      }
    }

    // Validate stock availability
    for (const item of cart.orderitems) {
      if (item.products.stock < item.quantity) {
        return {
          success: false,
          error: `Sản phẩm "${item.products.name}" không đủ số lượng trong kho`,
          status: 400
        };
      }
    }

    // Calculate total amount
    const totalAmount = cart.orderitems.reduce((sum, item) => {
      return sum + parseFloat(item.subtotal);
    }, 0);

    // Apply voucher
    const voucherResult = await applyVoucher(voucherCode, totalAmount, customerId);

    if (voucherCode && !voucherResult.valid) {
      return {
        success: false,
        error: voucherResult.error,
        status: 400
      };
    }

    const discountAmount = voucherResult.discountAmount;
    const finalAmount = totalAmount - discountAmount;

    // Use transaction to ensure atomicity and enable rollback on error
    const result = await prisma.$transaction(async (tx) => {
      // Update cart to pending order
      const order = await tx.orders.update({
        where: {
          id: cart.id
        },
        data: {
          status: 'pending',
          total_amount: totalAmount,
          discount_amount: discountAmount,
          final_amount: finalAmount,
          voucher_id: voucherResult.voucher?.id,
          shipping_address_id: shippingAddressId,
          order_date: new Date(),
          updated_at: new Date()
        },
        include: {
          orderitems: {
            include: {
              products: true,
              productunits: true
            }
          },
          vouchers: true,
          shippingaddresses: true
        }
      });

      // Create payment record
      const payment = await tx.payments.create({
        data: {
          order_id: order.id,
          payment_method: paymentMethod,
          amount: finalAmount,
          status: paymentMethod === 'cash' ? 'pending' : 'pending',
          transaction_id: `TXN-${Date.now()}-${order.id}`
        }
      });

      // Update voucher usage if voucher was used
      if (voucherResult.voucher) {
        await tx.vouchers.update({
          where: {
            id: voucherResult.voucher.id
          },
          data: {
            used_count: {
              increment: 1
            }
          }
        });

        // Create user voucher record
        await tx.uservouchers.create({
          data: {
            customer_id: customerId,
            voucher_id: voucherResult.voucher.id,
            order_id: order.id,
            is_used: true
          }
        });
      }

      // Update product stock (decrement)
      for (const item of cart.orderitems) {
        const updatedProduct = await tx.products.update({
          where: {
            id: item.product_id
          },
          data: {
            stock: {
              decrement: item.quantity
            }
          },
          select: {
            id: true,
            stock: true
          }
        });

        // Double-check stock didn't go negative (race condition protection)
        if (updatedProduct.stock < 0) {
          throw new Error(`Sản phẩm "${item.products.name}" không đủ số lượng trong kho`);
        }

        // Don't increment sold_count yet - only after payment confirmation
      }

      // Create order status history
      await tx.order_status_history.create({
        data: {
          order_id: order.id,
          status: 'pending',
          changed_at: new Date()
        }
      });

      return { order, payment };
    });

    // Transaction successful
    return {
      success: true,
      message: 'Đặt hàng thành công',
      data: {
        order: result.order,
        payment: result.payment,
        summary: {
          subtotal: totalAmount,
          discount: discountAmount,
          total: finalAmount,
          items_count: cart.orderitems.length
        }
      }
    };
  } catch (error) {
    console.error('Checkout error:', error);

    // If error message is from our validation, return it
    if (error.message && error.message.includes('không đủ số lượng')) {
      return {
        success: false,
        error: error.message,
        status: 400
      };
    }

    return {
      success: false,
      error: 'Lỗi khi thanh toán. Vui lòng thử lại',
      status: 500
    };
  }
};

/**
 * Confirm payment (for online payment methods)
 */
export const confirmPayment = async (orderId, transactionId) => {
  try {
    // Get order with items
    const order = await prisma.orders.findUnique({
      where: {
        id: orderId
      },
      include: {
        orderitems: true
      }
    });

    if (!order) {
      return {
        success: false,
        error: 'Đơn hàng không tồn tại',
        status: 404
      };
    }

    // Update payment status
    await prisma.payments.updateMany({
      where: {
        order_id: orderId,
        transaction_id: transactionId
      },
      data: {
        status: 'completed',
        payment_date: new Date()
      }
    });

    // Update order status
    await prisma.orders.update({
      where: {
        id: orderId
      },
      data: {
        status: 'confirmed',
        updated_at: new Date()
      }
    });

    // Update sold count for products (real-time best sellers update)
    for (const item of order.orderitems) {
      await updateProductSoldCount(item.product_id, item.quantity);
    }

    return {
      success: true,
      message: 'Thanh toán thành công'
    };
  } catch (error) {
    console.error('Confirm payment error:', error);
    return {
      success: false,
      error: 'Lỗi khi xác nhận thanh toán',
      status: 500
    };
  }
};

/**
 * Cancel order
 */
export const cancelOrder = async (orderId, customerId) => {
  try {
    const order = await prisma.orders.findFirst({
      where: {
        id: orderId,
        customer_id: customerId
      },
      include: {
        orderitems: true
      }
    });

    if (!order) {
      return {
        success: false,
        error: 'Đơn hàng không tồn tại',
        status: 404
      };
    }

    if (order.status === 'delivered' || order.status === 'shipped') {
      return {
        success: false,
        error: 'Không thể hủy đơn hàng đã giao',
        status: 400
      };
    }

    // Restore branch inventory stock
    for (const item of order.orderitems) {
      // Find branch inventory to restore
      const inventory = await prisma.branchinventory.findFirst({
        where: {
          product_id: item.product_id
        }
      });

      if (inventory) {
        await prisma.branchinventory.update({
          where: { id: inventory.id },
          data: {
            stock: {
              increment: item.quantity
            }
          }
        });
      }
    }

    // Update order status
    await prisma.orders.update({
      where: {
        id: orderId
      },
      data: {
        status: 'cancelled',
        updated_at: new Date()
      }
    });

    return {
      success: true,
      message: 'Đã hủy đơn hàng thành công'
    };
  } catch (error) {
    console.error('Cancel order error:', error);
    return {
      success: false,
      error: 'Lỗi khi hủy đơn hàng',
      status: 500
    };
  }
};
