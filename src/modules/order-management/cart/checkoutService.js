import prisma from '../../../config/db.js';
import { findOptimalBranchesForOrder, getCustomerCityId } from '../../../utils/branchSelection.js';
import { allocateBatchesFEFO } from '../../inventory-management/product-batch/productBatchService.js';
import { INVENTORY_LOG_TYPE } from '../../../utils/constants.js';
import { checkoutLogger as logger } from '../../../utils/logger.js';

/**
 * Generate unique tracking number for shipment
 */
const generateTrackingNumber = () => {
  const prefix = 'VN';
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}${timestamp}${random}`;
};

/**
 * ✅ FIX ISSUE #3: Tạo inventory reservation để giữ chỗ tạm thời
 * Reservation sẽ hết hạn sau 15 phút nếu không hoàn tất checkout
 */
const RESERVATION_EXPIRY_MINUTES = 15;

const createInventoryReservations = async (tx, orderId, branchId, items) => {
  const reservations = [];
  const expiresAt = new Date(Date.now() + RESERVATION_EXPIRY_MINUTES * 60 * 1000);

  for (const item of items) {
    const conversionFactor = Number(item.productunits?.conversion_factor || item.conversionFactor || 1);
    const baseQuantityNeeded = item.quantity * conversionFactor;

    // Kiểm tra tồn kho với lock (SELECT FOR UPDATE via raw query không khả dụng trong Prisma)
    // Thay vào đó, sử dụng atomic check-and-update
    const inventory = await tx.branchinventory.findUnique({
      where: {
        branch_id_product_id: {
          branch_id: branchId,
          product_id: item.product_id || item.productId
        }
      }
    });

    if (!inventory) {
      throw new Error(`Sản phẩm không có trong kho chi nhánh`);
    }

    // Tính số lượng đã được reserve bởi các đơn hàng khác (chưa hết hạn)
    const existingReservations = await tx.inventoryReservation.aggregate({
      where: {
        branch_id: branchId,
        product_id: item.product_id || item.productId,
        status: 'active',
        expires_at: { gt: new Date() }
      },
      _sum: {
        quantity: true
      }
    });

    const reservedQty = existingReservations._sum.quantity || 0;
    const availableStock = inventory.stock - reservedQty;

    if (availableStock < baseQuantityNeeded) {
      const productName = item.products?.name || `ID ${item.product_id || item.productId}`;
      throw new Error(`Sản phẩm "${productName}" không đủ số lượng trong kho (cần ${baseQuantityNeeded}, còn ${availableStock} sau khi trừ reservation)`);
    }

    // Tạo reservation
    const reservation = await tx.inventoryReservation.create({
      data: {
        branch_id: branchId,
        product_id: item.product_id || item.productId,
        order_id: orderId,
        quantity: baseQuantityNeeded,
        status: 'active',
        expires_at: expiresAt,
        created_at: new Date(),
        updated_at: new Date()
      }
    });

    reservations.push(reservation);
  }

  return reservations;
};

/**
 * ✅ FIX ISSUE #3: Hoàn tất reservation - chuyển từ reserved sang deducted
 * Gọi sau khi đã trừ kho thực tế
 */
const completeReservations = async (tx, orderId) => {
  await tx.inventoryReservation.updateMany({
    where: {
      order_id: orderId,
      status: 'active'
    },
    data: {
      status: 'completed',
      updated_at: new Date()
    }
  });
};

/**
 * ✅ FIX ISSUE #3: Hủy reservation khi checkout thất bại
 */
const cancelReservations = async (tx, orderId) => {
  await tx.inventoryReservation.updateMany({
    where: {
      order_id: orderId,
      status: 'active'
    },
    data: {
      status: 'cancelled',
      updated_at: new Date()
    }
  });
};

/**
 * ✅ FIX ISSUE #3: Dọn dẹp các reservation đã hết hạn
 * Nên chạy định kỳ qua cron job
 */
export const cleanupExpiredReservations = async () => {
  const result = await prisma.inventoryReservation.updateMany({
    where: {
      status: 'active',
      expires_at: { lt: new Date() }
    },
    data: {
      status: 'expired',
      updated_at: new Date()
    }
  });

  if (result.count > 0) {
    console.log(`[InventoryReservation] Cleaned up ${result.count} expired reservations`);
  }

  return result.count;
};

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
 * ✅ FIX ISSUE #21: Auto-sync giá trong cart với giá hiện tại trước khi checkout
 * Nếu giá thay đổi, tự động cập nhật và thông báo cho user
 */
const syncCartPricesWithCurrent = async (tx, cart) => {
  const priceChanges = [];
  let totalUpdated = 0;

  for (const item of cart.orderitems) {
    // Lấy giá hiện tại từ productunits
    const currentProductUnit = await tx.productunits.findUnique({
      where: { id: item.unit_id },
      select: { price: true }
    });

    if (!currentProductUnit) {
      throw new Error(`Đơn vị sản phẩm ID ${item.unit_id} không tồn tại`);
    }

    const currentPrice = Number(currentProductUnit.price);
    const cartPrice = Number(item.price);

    // So sánh giá (cho phép sai số 0.01 do floating point)
    if (Math.abs(currentPrice - cartPrice) > 0.01) {
      const newSubtotal = item.quantity * currentPrice;

      // Ghi nhận thay đổi
      priceChanges.push({
        productId: item.product_id,
        productName: item.products?.name || `Product #${item.product_id}`,
        oldPrice: cartPrice,
        newPrice: currentPrice,
        quantity: item.quantity,
        oldSubtotal: Number(item.subtotal),
        newSubtotal: newSubtotal
      });

      // Cập nhật giá trong orderitems
      await tx.orderitems.update({
        where: { id: item.id },
        data: {
          price: currentPrice,
          subtotal: newSubtotal,
          updated_at: new Date()
        }
      });

      totalUpdated++;
    }
  }

  // Nếu có thay đổi, recalculate total
  if (totalUpdated > 0) {
    const updatedItems = await tx.orderitems.findMany({
      where: { order_id: cart.id }
    });

    const newTotalAmount = updatedItems.reduce((sum, item) =>
      sum + Number(item.subtotal), 0
    );

    await tx.orders.update({
      where: { id: cart.id },
      data: {
        total_amount: newTotalAmount,
        final_amount: newTotalAmount, // Will be recalculated with discount later
        updated_at: new Date()
      }
    });

    console.log(`[CHECKOUT] Synced ${totalUpdated} item prices. New total: ${newTotalAmount}`);
  }

  return {
    hasChanges: priceChanges.length > 0,
    changes: priceChanges,
    totalItemsUpdated: totalUpdated
  };
};

/**
 * Checkout - Convert cart to order with payment
 * ✅ FIX ISSUE #3: Sử dụng inventoryReservation để tránh race condition
 * ✅ FIX ISSUE #4: Đồng bộ logic với cartService.checkout()
 * ✅ FIX ISSUE #21: Auto-sync giá trước khi checkout
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

    // ✅ Sử dụng logger thay vì console.log - không log sensitive data
    logger.debug('Checkout initiated', {
      customerId,
      hasVoucher: !!voucherCode,
      shippingAddressId,
      paymentMethod: normalizedPaymentMethod
    });

    // ✅ OPTIMIZED: Run parallel queries instead of sequential
    const [customer, cart, addressResult] = await Promise.all([
      prisma.customers.findUnique({
        where: { id: customerId },
        select: { id: true, user_id: true }
      }),
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
                select: { id: true, unit_name: true, conversion_factor: true, price: true }
              }
            }
          }
        }
      }),
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
      return { success: false, error: 'Khách hàng không tồn tại', status: 404 };
    }

    if (!cart || !cart.orderitems || cart.orderitems.length === 0) {
      return { success: false, error: 'Giỏ hàng trống', status: 400 };
    }

    let address = addressResult;
    if (!address) {
      const fallbackAddress = await prisma.shippingaddresses.findFirst({
        where: { customer_id: customerId }
      });

      if (!fallbackAddress) {
        return { success: false, error: 'Vui lòng cung cấp địa chỉ giao hàng', status: 400 };
      }
      address = fallbackAddress;
    }

    const finalShippingAddressId = address.id;
    logger.debug('Final shipping address ID to use', { finalShippingAddressId });

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
      return { success: false, error: error.message || 'Không đủ hàng trong kho', status: 400 };
    }

    if (!branchAllocation.branches || branchAllocation.branches.length === 0) {
      return { success: false, error: 'Không tìm thấy chi nhánh có đủ hàng', status: 400 };
    }

    const primaryBranch = branchAllocation.branches[0];
    const branchId = primaryBranch.branch.id;

    // ✅ FIX ISSUE #3 & #21: Sử dụng transaction với inventory reservation VÀ price sync
    const result = await prisma.$transaction(async (tx) => {
      // ✅ FIX #21: Step 0 - Sync prices TRƯỚC KHI tính toán
      const priceSync = await syncCartPricesWithCurrent(tx, cart);

      if (priceSync.hasChanges) {
        logger.info('Price changes detected', { changes: priceSync.changes });
      }

      // Reload cart với giá đã sync
      const updatedCart = await tx.orders.findUnique({
        where: { id: cart.id },
        include: {
          orderitems: {
            include: {
              products: { select: { id: true, name: true, price: true } },
              productunits: { select: { id: true, unit_name: true, conversion_factor: true } }
            }
          }
        }
      });

      // Calculate total amount với giá đã sync
      const totalAmount = updatedCart.orderitems.reduce((sum, item) => {
        return sum + parseFloat(item.subtotal);
      }, 0);

      // Apply voucher với giá đã sync
      const voucherResult = await applyVoucher(voucherCode, totalAmount, customerId);

      if (voucherCode && !voucherResult.valid) {
        throw new Error(voucherResult.error);
      }

      const discountAmount = voucherResult.discountAmount;
      const finalAmount = totalAmount - discountAmount;

      // Step 1: Tạo inventory reservations TRƯỚC để lock hàng
      logger.debug('Creating inventory reservations', { orderId: cart.id });

      try {
        await createInventoryReservations(tx, cart.id, branchId, updatedCart.orderitems);
      } catch (reservationError) {
        logger.error('Reservation failed', { error: reservationError.message });
        throw reservationError;
      }

      // Step 2: Update cart to pending order
      logger.debug('Updating order to pending', { orderId: cart.id, shippingAddressId: finalShippingAddressId });

      const order = await tx.orders.update({
        where: { id: cart.id },
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

      // Step 3: Create payment record
      const payment = await tx.payments.create({
        data: {
          order_id: order.id,
          payment_method: normalizedPaymentMethod,
          amount: finalAmount,
          status: 'pending',
          transaction_id: `TXN-${Date.now()}-${order.id}`
        }
      });

      // Step 4: Create shipment record
      const shipment = await tx.shipments.create({
        data: {
          order_id: order.id,
          branch_id: branchId,
          shipping_address_id: finalShippingAddressId,
          tracking_number: generateTrackingNumber(),
          carrier: 'Standard Delivery',
          status: 'pending',
          estimated_delivery: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
          created_at: new Date(),
          updated_at: new Date()
        }
      });

      logger.debug('Created shipment', { shipmentId: shipment.id, orderId: order.id, branchId });

      // Step 5: Update voucher usage if voucher was used
      if (voucherResult.voucher) {
        await tx.vouchers.update({
          where: { id: voucherResult.voucher.id },
          data: { used_count: { increment: 1 } }
        });

        await tx.uservouchers.create({
          data: {
            customer_id: customerId,
            voucher_id: voucherResult.voucher.id,
            order_id: order.id,
            is_used: true
          }
        });
      }

      // Step 6: Deduct inventory với FEFO batch tracking
      // ✅ FIX #25: Sử dụng quantity DƯƠNG với type EXPORT
      for (const item of updatedCart.orderitems) {
        const conversionFactor = Number(item.productunits.conversion_factor);
        const baseQuantityNeeded = item.quantity * conversionFactor;

        // Try FEFO allocation
        let batchAllocations = null;
        try {
          const allocationResult = await allocateBatchesFEFO(branchId, item.product_id, baseQuantityNeeded);
          if (allocationResult.success) {
            batchAllocations = allocationResult.data.allocations;
          }
        } catch (err) {
          logger.warn('FEFO allocation failed', { productId: item.product_id, error: err.message });
        }

        // Atomic update với điều kiện stock >= needed
        const updatedInventory = await tx.branchinventory.updateMany({
          where: {
            branch_id: branchId,
            product_id: item.product_id,
            stock: { gte: baseQuantityNeeded }
          },
          data: {
            stock: { decrement: baseQuantityNeeded },
            last_updated: new Date()
          }
        });

        if (updatedInventory.count === 0) {
          await cancelReservations(tx, cart.id);
          throw new Error(`Sản phẩm "${item.products.name}" không đủ số lượng trong kho chi nhánh`);
        }

        // Deduct from batches and create logs
        // ✅ FIX #25: quantity DƯƠNG, type = EXPORT cho biết chiều xuất kho
        if (batchAllocations && batchAllocations.length > 0) {
          for (const allocation of batchAllocations) {
            await tx.productBatch.update({
              where: { id: allocation.batch_id },
              data: {
                quantity: { decrement: allocation.allocated_qty },
                updated_at: new Date()
              }
            });

            const inventoryLog = await tx.inventoryLog.create({
              data: {
                branch_id: branchId,
                product_id: item.product_id,
                unit_id: item.unit_id,
                batch_id: allocation.batch_id,
                quantity: allocation.allocated_qty, // ✅ Số DƯƠNG
                type: INVENTORY_LOG_TYPE.EXPORT,    // ✅ Type cho biết chiều xuất kho
                reference_type: 'order',
                reference_id: cart.id,
                note: `Xuất kho cho đơn hàng #${cart.id} - Lô ${allocation.batch_number}`,
                date: new Date()
              }
            });

            await tx.inventoryLog_Order.create({
              data: {
                inventory_log_id: inventoryLog.id,
                order_id: cart.id
              }
            });
          }
          logger.debug('FEFO: Deducted from batches', { productId: item.product_id, batchCount: batchAllocations.length });
        } else {
          const inventoryLog = await tx.inventoryLog.create({
            data: {
              branch_id: branchId,
              product_id: item.product_id,
              unit_id: item.unit_id,
              quantity: baseQuantityNeeded,       // ✅ Số DƯƠNG
              type: INVENTORY_LOG_TYPE.EXPORT,    // ✅ Type cho biết chiều xuất kho
              reference_type: 'order',
              reference_id: cart.id,
              note: `Xuất kho cho đơn hàng #${cart.id}`,
              date: new Date()
            }
          });

          await tx.inventoryLog_Order.create({
            data: {
              inventory_log_id: inventoryLog.id,
              order_id: cart.id
            }
          });
        }
      }

      // Step 7: Complete reservations
      await completeReservations(tx, cart.id);

      // Step 8: Create order status history
      await tx.order_status_history.create({
        data: {
          order_id: order.id,
          status: 'pending',
          changed_at: new Date()
        }
      });

      return { order, payment, shipment, priceSync, totalAmount, discountAmount, finalAmount };
    }, {
      timeout: 30000,
      isolationLevel: 'Serializable'
    });

    // Transaction successful - include price change info in response
    const response = {
      success: true,
      message: 'Đặt hàng thành công',
      data: {
        order: result.order,
        payment: result.payment,
        shipment: {
          id: result.shipment.id,
          tracking_number: result.shipment.tracking_number,
          branch_id: result.shipment.branch_id,
          estimated_delivery: result.shipment.estimated_delivery
        },
        summary: {
          subtotal: result.totalAmount,
          discount: result.discountAmount,
          total: result.finalAmount,
          items_count: cart.orderitems.length
        }
      }
    };

    // ✅ FIX #21: Thông báo nếu giá đã thay đổi
    if (result.priceSync.hasChanges) {
      response.priceUpdated = true;
      response.priceChanges = result.priceSync.changes;
      response.message = `Đặt hàng thành công. Lưu ý: Giá của ${result.priceSync.totalItemsUpdated} sản phẩm đã được cập nhật theo giá hiện tại.`;
    }

    return response;
  } catch (error) {
    logger.error('Checkout error', { error });

    if (error.message && (error.message.includes('không đủ số lượng') || error.message.includes('voucher'))) {
      return { success: false, error: error.message, status: 400 };
    }

    if (error.code === 'P2028') {
      return {
        success: false,
        error: 'Hệ thống đang bận, vui lòng thử lại sau',
        status: 503
      };
    }

    return { success: false, error: 'Lỗi khi thanh toán. Vui lòng thử lại', status: 500 };
  }
};

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
