import prisma from '../../../config/db.js';
import { updateProductSoldCount } from '../../product-management/products/bestSellersService.js';
import { findOptimalBranchesForOrder, getCustomerCityId } from '../../../utils/branchSelection.js';

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
      paymentMethod = 'cash'
    } = data;

    // Map payment method aliases to database values
    const paymentMethodMap = {
      'COD': 'cash',
      'cod': 'cash',
      'cash': 'cash',
      'card': 'credit_card',
      'credit_card': 'credit_card',
      'momo': 'e_wallet',
      'zalopay': 'e_wallet',
      'e_wallet': 'e_wallet',
      'bank_transfer': 'bank_transfer',
      'banking': 'bank_transfer'
    };

    const normalizedPaymentMethod = paymentMethodMap[paymentMethod] || 'cash';

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

    // Get shipping address - use provided or default
    let address;
    let finalShippingAddressId;
    
    if (shippingAddressId) {
      // Use the specific address provided
      const parsedAddressId = parseInt(shippingAddressId);
      console.log(`[CHECKOUT] Looking for shipping address ID: ${parsedAddressId} for customer: ${customerId}`);
      
      address = await prisma.shippingaddresses.findFirst({
        where: {
          id: parsedAddressId,
          customer_id: customerId
        }
      });

      console.log(`[CHECKOUT] Found address:`, address ? `ID ${address.id}` : 'NOT FOUND');

      if (!address) {
        return {
          success: false,
          error: 'Địa chỉ giao hàng không hợp lệ',
          status: 400
        };
      }
      finalShippingAddressId = parsedAddressId;
    } else {
      // Use default address if not provided
      address = await prisma.shippingaddresses.findFirst({
        where: {
          customer_id: customerId,
          is_default: true
        }
      });

      if (!address) {
        // If no default, get any address
        address = await prisma.shippingaddresses.findFirst({
          where: {
            customer_id: customerId
          }
        });
      }

      if (!address) {
        return {
          success: false,
          error: 'Vui lòng cung cấp địa chỉ giao hàng',
          status: 400
        };
      }
      finalShippingAddressId = address.id;
    }

    console.log(`[CHECKOUT] Final shipping address ID to use: ${finalShippingAddressId}`);

    // Get customer city ID for optimal branch selection
    const customerCityId = await getCustomerCityId(customerId, address.id);

    // Prepare order items for branch selection
    const orderItemsForBranch = cart.orderitems.map(item => ({
      productId: item.product_id,
      quantity: item.quantity,
      conversionFactor: Number(item.productunits.conversion_factor)
    }));

    // Find optimal branch(es) for the order
    let branchAllocation;
    try {
      branchAllocation = await findOptimalBranchesForOrder(orderItemsForBranch, customerCityId);
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Không đủ hàng trong kho',
        status: 400
      };
    }

    // For simplicity, use single branch strategy for now
    // If multiple branches needed, would need more complex logic
    if (!branchAllocation.branches || branchAllocation.branches.length === 0) {
      return {
        success: false,
        error: 'Không tìm thấy chi nhánh có đủ hàng',
        status: 400
      };
    }

    const primaryBranch = branchAllocation.branches[0];
    const branchId = primaryBranch.branch.id;

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
      console.log(`[CHECKOUT] Updating order ${cart.id} with shipping_address_id: ${finalShippingAddressId}`);
      
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
          shipping_address_id: finalShippingAddressId,
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
          payment_method: normalizedPaymentMethod,
          amount: finalAmount,
          status: normalizedPaymentMethod === 'cash' ? 'pending' : 'pending',
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

      // Update branch inventory stock (decrement)
      for (const item of cart.orderitems) {
        // Calculate base quantity needed
        const conversionFactor = Number(item.productunits.conversion_factor);
        const baseQuantityNeeded = item.quantity * conversionFactor;
        
        // Update branch inventory
        const updatedInventory = await tx.branchinventory.updateMany({
          where: {
            branch_id: branchId,
            product_id: item.product_id,
            stock: {
              gte: baseQuantityNeeded
            }
          },
          data: {
            stock: {
              decrement: baseQuantityNeeded
            },
            last_updated: new Date()
          }
        });

        // Check if update was successful
        if (updatedInventory.count === 0) {
          throw new Error(`Sản phẩm "${item.products.name}" không đủ số lượng trong kho chi nhánh`);
        }

        // Create inventory log
        const inventoryLog = await tx.inventoryLog.create({
          data: {
            branch_id: branchId,
            product_id: item.product_id,
            unit_id: item.unit_id,
            quantity: -baseQuantityNeeded,
            type: 'OUT',
            reference_type: 'order',
            reference_id: cart.id,
            note: `Xuất kho cho đơn hàng #${cart.id}`,
            date: new Date()
          }
        });

        // Create junction table entry
        await tx.inventoryLog_Order.create({
          data: {
            inventory_log_id: inventoryLog.id,
            order_id: cart.id
          }
        });

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
        orderitems: {
          include: {
            products: true,
            productunits: true
          }
        }
      }
    });

    if (!order) {
      return {
        success: false,
        error: 'Đơn hàng không tồn tại',
        status: 404
      };
    }

    if (order.status !== 'pending') {
      return {
        success: false,
        error: 'Đơn hàng không ở trạng thái chờ xác nhận',
        status: 400
      };
    }

    await prisma.$transaction(async (tx) => {
      // Update payment status
      await tx.payments.updateMany({
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
      await tx.orders.update({
        where: {
          id: orderId
        },
        data: {
          status: 'confirmed',
          updated_at: new Date()
        }
      });

      // Create order status history
      await tx.order_status_history.create({
        data: {
          order_id: orderId,
          status: 'confirmed',
          changed_at: new Date()
        }
      });

      // Update sold count for products (real-time best sellers update)
      for (const item of order.orderitems) {
        await updateProductSoldCount(item.product_id, item.quantity);
        
        // Update product sold_count
        await tx.products.update({
          where: { id: item.product_id },
          data: {
            sold_count: {
              increment: item.quantity
            }
          }
        });
      }
    });

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
        orderitems: {
          include: {
            products: true,
            productunits: true
          }
        }
      }
    });

    if (!order) {
      return {
        success: false,
        error: 'Đơn hàng không tồn tại',
        status: 404
      };
    }

    if (order.status === 'delivered' || order.status === 'shipping' || order.status === 'cancelled') {
      return {
        success: false,
        error: 'Không thể hủy đơn hàng ở trạng thái này',
        status: 400
      };
    }

    await prisma.$transaction(async (tx) => {
      // Restore branch inventory stock
      for (const item of order.orderitems) {
        // Calculate base quantity to restore
        const conversionFactor = Number(item.productunits.conversion_factor);
        const baseQuantityToRestore = item.quantity * conversionFactor;
        
        // Find branch inventory to restore (from inventory logs)
        const inventoryLog = await tx.inventoryLog.findFirst({
          where: {
            reference_type: 'order',
            reference_id: orderId,
            product_id: item.product_id,
            type: 'EXPORT'
          }
        });

        if (inventoryLog) {
          // Restore to the same branch
          await tx.branchinventory.updateMany({
            where: {
              branch_id: inventoryLog.branch_id,
              product_id: item.product_id
            },
            data: {
              stock: {
                increment: baseQuantityToRestore
              },
              last_updated: new Date()
            }
          });

          // Create inventory log for restoration
          const returnLog = await tx.inventoryLog.create({
            data: {
              branch_id: inventoryLog.branch_id,
              product_id: item.product_id,
              unit_id: item.unit_id,
              quantity: baseQuantityToRestore,
              type: 'IN',
              reference_type: 'order_cancel',
              reference_id: orderId,
              note: `Hoàn kho do hủy đơn hàng #${orderId}`,
              date: new Date()
            }
          });

          // Create junction table entry
          await tx.inventoryLog_Order.create({
            data: {
              inventory_log_id: returnLog.id,
              order_id: orderId
            }
          });
        }
        
        // Decrease sold_count if order was confirmed
        if (order.status === 'confirmed' || order.status === 'delivered') {
          await tx.products.update({
            where: { id: item.product_id },
            data: {
              sold_count: { decrement: item.quantity }
            }
          });
        }
      }

      // Update order status
      await tx.orders.update({
        where: {
          id: orderId
        },
        data: {
          status: 'cancelled',
          updated_at: new Date()
        }
      });

      // Create order status history
      await tx.order_status_history.create({
        data: {
          order_id: orderId,
          status: 'cancelled',
          changed_at: new Date()
        }
      });
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
