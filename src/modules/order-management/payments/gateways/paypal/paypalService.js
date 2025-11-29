import axios from 'axios';
import prisma from '../../../../../config/db.js';
import { PAYPAL_CONFIG, PAYPAL_STATUS } from './paypalConfig.js';
import { getPayPalAccessToken, convertVNDtoUSD, generatePayPalOrderId } from './paypalUtils.js';

/**
 * Create PayPal payment
 */
export const createPayPalPayment = async (orderId) => {
  try {
    const order = await prisma.orders.findUnique({
      where: { id: Number(orderId) },
      include: {
        customers: {
          include: {
            users: {
              select: { id: true, email: true, full_name: true, phone: true }
            }
          }
        },
        orderitems: {
          include: {
            products: true
          }
        }
      }
    });

    if (!order) {
      return {
        success: false,
        status: 404,
        error: 'Không tìm thấy đơn hàng'
      };
    }

    // Check or create payment record in database
    let payment = await prisma.payments.findFirst({
      where: {
        order_id: Number(orderId),
        payment_method: 'paypal'
      }
    });

    if (!payment) {
      payment = await prisma.payments.create({
        data: {
          order_id: Number(orderId),
          payment_method: 'paypal',
          amount: order.final_amount,
          status: 'pending',
          created_at: new Date(),
          updated_at: new Date()
        }
      });

      await prisma.payment_logs.create({
        data: {
          payment_id: payment.id,
          action: 'paypal_payment_initiated',
          old_status: null,
          new_status: 'pending',
          metadata: {
            orderId: order.id,
            amount: order.final_amount
          },
          created_at: new Date()
        }
      });
    }

    // Get PayPal access token
    const accessToken = await getPayPalAccessToken();

    // Convert VND to USD with live exchange rate
    const amountVND = Number(order.final_amount);
    const amountUSD = await convertVNDtoUSD(amountVND);

    const paypalOrderId = generatePayPalOrderId(order.id);

    // Create order items for PayPal
    const items = await Promise.all(
      order.orderitems.map(async (item) => ({
        name: item.products.name.substring(0, 127), // PayPal limit 127 chars
        quantity: String(item.quantity),
        unit_amount: {
          currency_code: PAYPAL_CONFIG.currency,
          value: (await convertVNDtoUSD(item.price)).toFixed(2)
        }
      }))
    );

    // Create PayPal order
    const requestBody = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: String(order.id),
          description: `Đơn hàng #${order.id}`,
          custom_id: paypalOrderId,
          amount: {
            currency_code: PAYPAL_CONFIG.currency,
            value: amountUSD.toFixed(2),
            breakdown: {
              item_total: {
                currency_code: PAYPAL_CONFIG.currency,
                value: amountUSD.toFixed(2)
              }
            }
          },
          items: items
        }
      ],
      application_context: {
        brand_name: 'PBL6 Pharmacy',
        landing_page: 'NO_PREFERENCE',
        user_action: 'PAY_NOW',
        return_url: PAYPAL_CONFIG.returnUrl,
        cancel_url: PAYPAL_CONFIG.cancelUrl
      }
    };

    console.log('🟡 PayPal Payment Request:', {
      orderId: order.id,
      paypalOrderId,
      amountVND,
      amountUSD
    });

    const response = await axios.post(
      `${PAYPAL_CONFIG.apiUrl}/v2/checkout/orders`,
      requestBody,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'PayPal-Request-Id': paypalOrderId
        }
      }
    );

    console.log('🟡 PayPal Response:', response.data);

    if (response.data.id) {
      // Get approval URL
      const approvalUrl = response.data.links.find(
        link => link.rel === 'approve'
      )?.href;

      return {
        success: true,
        data: {
          paypalOrderId: response.data.id,
          approvalUrl: approvalUrl,
          orderId: order.id,
          amountVND,
          amountUSD,
          status: response.data.status
        }
      };
    } else {
      return {
        success: false,
        status: 400,
        error: 'Không thể tạo thanh toán PayPal'
      };
    }
  } catch (error) {
    console.error('PayPal create payment error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Capture PayPal payment after approval
 */
export const capturePayPalPayment = async (paypalOrderId) => {
  try {
    const accessToken = await getPayPalAccessToken();

    console.log('🟡 Capturing PayPal order:', paypalOrderId);

    const response = await axios.post(
      `${PAYPAL_CONFIG.apiUrl}/v2/checkout/orders/${paypalOrderId}/capture`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('🟡 PayPal Capture Response:', response.data);

    if (response.data.status === PAYPAL_STATUS.COMPLETED) {
      // Get system order ID from custom_id
      const customId = response.data.purchase_units[0]?.custom_id;
      const systemOrderId = customId ? customId.split('_')[1] : null;

      if (!systemOrderId) {
        return {
          success: false,
          status: 400,
          error: 'Không tìm thấy mã đơn hàng'
        };
      }

      // Update payment in database
      const payment = await prisma.payments.findFirst({
        where: {
          order_id: Number(systemOrderId),
          payment_method: 'paypal'
        },
        include: {
          orders: true
        }
      });

      if (!payment) {
        return {
          success: false,
          status: 404,
          error: 'Không tìm thấy thanh toán'
        };
      }

      const captureId = response.data.purchase_units[0]?.payments?.captures[0]?.id;

      await prisma.$transaction(async (tx) => {
        await tx.payments.update({
          where: { id: payment.id },
          data: {
            status: 'completed',
            transaction_id: captureId,
            payment_date: new Date(),
            updated_at: new Date()
          }
        });

        await tx.payment_logs.create({
          data: {
            payment_id: payment.id,
            action: 'paypal_capture_success',
            old_status: payment.status,
            new_status: 'completed',
            metadata: {
              paypalOrderId,
              captureId,
              status: response.data.status
            },
            created_at: new Date()
          }
        });

        // Update order status if pending
        if (payment.orders.status === 'pending') {
          await tx.orders.update({
            where: { id: payment.order_id },
            data: {
              status: 'confirmed',
              updated_at: new Date()
            }
          });

          await tx.order_status_history.create({
            data: {
              order_id: payment.order_id,
              status: 'confirmed',
              changed_at: new Date()
            }
          });
        }
      });

      return {
        success: true,
        message: 'Thanh toán PayPal thành công',
        data: {
          orderId: payment.order_id,
          paypalOrderId,
          captureId
        }
      };
    } else {
      return {
        success: false,
        status: 400,
        error: 'Không thể hoàn thành thanh toán PayPal',
        paypalStatus: response.data.status
      };
    }
  } catch (error) {
    console.error('PayPal capture error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Handle PayPal callback
 */
export const handlePayPalCallback = async (query) => {
  try {
    const { token, PayerID } = query;

    if (!token) {
      return {
        success: false,
        status: 400,
        error: 'Thiếu thông tin thanh toán'
      };
    }

    // Capture the payment
    const result = await capturePayPalPayment(token);

    return result;
  } catch (error) {
    console.error('PayPal callback error:', error);
    throw error;
  }
};

/**
 * Handle PayPal cancel
 */
export const handlePayPalCancel = async (query) => {
  try {
    const { token } = query;

    if (token) {
      // Get order details to find system order ID
      const accessToken = await getPayPalAccessToken();
      
      const response = await axios.get(
        `${PAYPAL_CONFIG.apiUrl}/v2/checkout/orders/${token}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const customId = response.data.purchase_units[0]?.custom_id;
      const systemOrderId = customId ? customId.split('_')[1] : null;

      if (systemOrderId) {
        const payment = await prisma.payments.findFirst({
          where: {
            order_id: Number(systemOrderId),
            payment_method: 'paypal'
          }
        });

        if (payment) {
          await prisma.$transaction(async (tx) => {
            await tx.payments.update({
              where: { id: payment.id },
              data: {
                status: 'cancelled',
                updated_at: new Date()
              }
            });

            await tx.payment_logs.create({
              data: {
                payment_id: payment.id,
                action: 'paypal_cancelled',
                old_status: payment.status,
                new_status: 'cancelled',
                metadata: {
                  paypalOrderId: token,
                  reason: 'User cancelled'
                },
                created_at: new Date()
              }
            });
          });
        }
      }
    }

    return {
      success: true,
      message: 'Thanh toán đã bị hủy',
      cancelled: true
    };
  } catch (error) {
    console.error('PayPal cancel error:', error);
    throw error;
  }
};

/**
 * Handle PayPal webhook
 */
export const handlePayPalWebhook = async (body) => {
  try {
    const eventType = body.event_type;
    const resource = body.resource;

    console.log('🟡 PayPal Webhook Event:', eventType);

    // Handle different event types
    switch (eventType) {
      case 'CHECKOUT.ORDER.APPROVED':
        // Order approved by customer
        console.log('Order approved:', resource.id);
        break;

      case 'PAYMENT.CAPTURE.COMPLETED':
        // Payment captured successfully
        const captureId = resource.id;
        const customId = resource.custom_id;
        const systemOrderId = customId ? customId.split('_')[1] : null;

        if (systemOrderId) {
          const payment = await prisma.payments.findFirst({
            where: {
              order_id: Number(systemOrderId),
              payment_method: 'paypal'
            }
          });

          if (payment && payment.status !== 'completed') {
            await prisma.$transaction(async (tx) => {
              await tx.payments.update({
                where: { id: payment.id },
                data: {
                  status: 'completed',
                  transaction_id: captureId,
                  payment_date: new Date(),
                  updated_at: new Date()
                }
              });

              await tx.payment_logs.create({
                data: {
                  payment_id: payment.id,
                  action: 'paypal_webhook_capture_completed',
                  old_status: payment.status,
                  new_status: 'completed',
                  metadata: {
                    captureId,
                    eventType
                  },
                  created_at: new Date()
                }
              });
            });
          }
        }
        break;

      case 'PAYMENT.CAPTURE.DENIED':
        // Payment denied
        console.log('Payment denied:', resource.id);
        break;

      case 'PAYMENT.CAPTURE.REFUNDED':
        // Payment refunded
        console.log('Payment refunded:', resource.id);
        break;

      default:
        console.log('Unhandled webhook event:', eventType);
    }

    return {
      success: true,
      message: 'Webhook processed'
    };
  } catch (error) {
    console.error('PayPal webhook error:', error);
    throw error;
  }
};
