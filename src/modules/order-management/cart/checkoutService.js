import prisma from '../../../config/db.js';
import { findOptimalBranchesForOrder, getCustomerCityId } from '../../../utils/branchSelection.js';
import { allocateBatchesFEFO } from '../../inventory-management/product-batch/productBatchService.js';

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
      paymentMethod = 'cash',
      note
    } = data;

    // Map payment method aliases to database values
    const paymentMethodMap = {
      'COD': 'COD',
      'cod': 'COD',
      'cash': 'COD',
      'card': 'credit_card',
      'credit_card': 'credit_card',
      'momo': 'momo',
      'vnpay': 'vnpay',
      'bank_transfer': 'bank_transfer',
      'banking': 'bank_transfer'
    };

    const normalizedPaymentMethod = paymentMethodMap[paymentMethod] || 'COD';

    console.log('[CHECKOUT] Payment method mapping:', {
      original: paymentMethod,
      normalized: normalizedPaymentMethod
    });

    // ✅ OPTIMIZED: Run parallel queries instead of sequential
    const [customer, cart, addressResult] = await Promise.all([
      // Validate customer - only select needed fields
      prisma.customers.findUnique({
        where: { id: customerId },
        select: { id: true, user_id: true }
      }),

      // Get cart with items
      prisma.orders.findFirst({
        where: {
          customer_id: customerId,
          status: 'cart'
        },
        include: {
          orderitems: {
            include: {
              products: {
                select: { id: true, name: true, price: true }
              },
              productunits: {
                select: { id: true, unit_name: true, conversion_factor: true }
              }
            }
          }
        }
      }),

      // Get shipping address in parallel
      shippingAddressId
        ? prisma.shippingaddresses.findFirst({
          where: {
            id: parseInt(shippingAddressId),
            customer_id: customerId
          }
        })
        : prisma.shippingaddresses.findFirst({
          where: {
            customer_id: customerId,
            is_default: true
          },
          orderBy: { id: 'desc' }
        })
    ]);

    // Validate results
    if (!customer) {
      return {
        success: false,
        error: 'Khách hàng không tồn tại',
        status: 404
      };
    }

    if (!cart || !cart.orderitems || cart.orderitems.length === 0) {
      return {
        success: false,
        error: 'Giỏ hàng trống',
        status: 400
      };
    }

    let address = addressResult;
    if (!address) {
      // Try to get any address as fallback
      const fallbackAddress = await prisma.shippingaddresses.findFirst({
        where: { customer_id: customerId }
      });

      if (!fallbackAddress) {
        return {
          success: false,
          error: 'Vui lòng cung cấp địa chỉ giao hàng',
          status: 400
        };
      }

      address = fallbackAddress;
    }

    const finalShippingAddressId = address.id;

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
          note: note || null,
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
          status: 'pending',
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

      // Update branch inventory stock (decrement) with FEFO batch tracking
      for (const item of cart.orderitems) {
        // Calculate base quantity needed
        const conversionFactor = Number(item.productunits.conversion_factor);
        const baseQuantityNeeded = item.quantity * conversionFactor;

        // ✅ FIX #4: Try to allocate from batches using FEFO
        let batchAllocations = null;
        try {
          const allocationResult = await allocateBatchesFEFO(branchId, item.product_id, baseQuantityNeeded);
          if (allocationResult.success) {
            batchAllocations = allocationResult.data.allocations;
          }
        } catch (err) {
          console.log(`[CHECKOUT] FEFO allocation failed for product ${item.product_id}, falling back to simple deduction:`, err.message);
        }

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

        // ✅ FIX #4: If FEFO allocation successful, deduct from batches and create logs with batch_id
        if (batchAllocations && batchAllocations.length > 0) {
          for (const allocation of batchAllocations) {
            // Deduct from batch
            await tx.productBatch.update({
              where: { id: allocation.batch_id },
              data: {
                quantity: { decrement: allocation.allocated_qty },
                updated_at: new Date()
              }
            });

            // Create inventory log with batch_id
            const inventoryLog = await tx.inventoryLog.create({
              data: {
                branch_id: branchId,
                product_id: item.product_id,
                unit_id: item.unit_id,
                batch_id: allocation.batch_id,  // ✅ Include batch_id
                quantity: -allocation.allocated_qty,
                type: 'OUT',
                reference_type: 'order',
                reference_id: cart.id,
                note: `Xuất kho cho đơn hàng #${cart.id} - Lô ${allocation.batch_number}`,
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
          }
          console.log(`[CHECKOUT] FEFO: Deducted from ${batchAllocations.length} batches for product ${item.product_id}`);
        } else {
          // Fallback: Create inventory log without batch_id (backward compatible)
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
/**
 * ❌ DEPRECATED: Hàm này không còn được sử dụng
 * 
 * BUSINESS RULE: Khách hàng KHÔNG được tự hủy đơn hàng
 * Quy trình hủy đơn phải thông qua Staff/Admin:
 * - API: POST /api/orders/:id/cancel (chỉ Admin/Staff)
 * - Service: orderService.cancelOrder()
 * 
 * Hàm này được giữ lại để backward compatibility nhưng không nên gọi trực tiếp.
 * @deprecated Use orderService.cancelOrder() instead (Admin/Staff only)
 */
export const cancelOrder = async (orderId, customerId) => {
  // ❌ KHÔNG CHO PHÉP - Trả về lỗi ngay lập tức
  return {
    success: false,
    error: 'Khách hàng không được phép tự hủy đơn hàng. Vui lòng liên hệ nhân viên hỗ trợ để được hỗ trợ hủy đơn.',
    status: 403,
    contactSupport: true
  };
};
