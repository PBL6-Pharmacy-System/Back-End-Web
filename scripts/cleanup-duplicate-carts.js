/**
 * Script để dọn dẹp các cart trùng lặp
 * Nếu một customer có nhiều cart với status 'cart', 
 * hợp nhất tất cả items vào cart mới nhất và xóa các cart cũ
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupDuplicateCarts() {
  console.log('🔍 Đang tìm các customer có nhiều cart...');
  
  try {
    // Tìm các customer có nhiều cart với status = 'cart'
    const duplicates = await prisma.$queryRaw`
      SELECT customer_id, COUNT(*) as cart_count, array_agg(id ORDER BY order_date DESC) as cart_ids
      FROM orders 
      WHERE status = 'cart' AND customer_id IS NOT NULL
      GROUP BY customer_id
      HAVING COUNT(*) > 1
    `;
    
    console.log(`📦 Tìm thấy ${duplicates.length} customer có nhiều cart`);
    
    for (const dup of duplicates) {
      const customerId = dup.customer_id;
      const cartIds = dup.cart_ids;
      
      console.log(`\n👤 Customer ${customerId}: ${cartIds.length} carts`);
      console.log(`   Cart IDs: ${cartIds.join(', ')}`);
      
      // Cart mới nhất (đầu tiên trong array vì đã sort DESC theo order_date)
      const newestCartId = cartIds[0];
      const oldCartIds = cartIds.slice(1);
      
      console.log(`   ✅ Giữ lại cart: ${newestCartId}`);
      console.log(`   ❌ Sẽ merge từ carts: ${oldCartIds.join(', ')}`);
      
      // Lấy items từ các cart cũ
      const oldItems = await prisma.orderitems.findMany({
        where: {
          order_id: { in: oldCartIds }
        }
      });
      
      console.log(`   📋 Tổng ${oldItems.length} items từ các cart cũ`);
      
      // Merge items vào cart mới nhất
      for (const item of oldItems) {
        // Kiểm tra item đã tồn tại trong cart mới chưa
        const existingItem = await prisma.orderitems.findFirst({
          where: {
            order_id: newestCartId,
            product_id: item.product_id,
            unit_id: item.unit_id
          }
        });
        
        if (existingItem) {
          // Cộng dồn số lượng
          await prisma.orderitems.update({
            where: { id: existingItem.id },
            data: {
              quantity: existingItem.quantity + item.quantity,
              subtotal: Number(existingItem.subtotal) + Number(item.subtotal)
            }
          });
          console.log(`      ↗️ Cập nhật item ${item.product_id}: +${item.quantity}`);
        } else {
          // Di chuyển item sang cart mới
          await prisma.orderitems.update({
            where: { id: item.id },
            data: { order_id: newestCartId }
          });
          console.log(`      ➡️ Di chuyển item ${item.product_id} sang cart ${newestCartId}`);
        }
      }
      
      // Xóa các cart cũ (items đã được di chuyển)
      for (const oldCartId of oldCartIds) {
        // Xóa items còn lại (nếu có - trường hợp đã merge vào item có sẵn)
        await prisma.orderitems.deleteMany({
          where: { order_id: oldCartId }
        });
        
        // Xóa cart cũ
        await prisma.orders.delete({
          where: { id: oldCartId }
        });
        console.log(`      🗑️ Đã xóa cart ${oldCartId}`);
      }
      
      // Cập nhật tổng tiền của cart mới nhất
      const updatedItems = await prisma.orderitems.findMany({
        where: { order_id: newestCartId }
      });
      
      const total = updatedItems.reduce((sum, item) => sum + Number(item.subtotal), 0);
      
      await prisma.orders.update({
        where: { id: newestCartId },
        data: {
          total_amount: total,
          final_amount: total
        }
      });
      
      console.log(`   💰 Cập nhật tổng tiền: ${total}`);
    }
    
    console.log('\n✅ Hoàn thành dọn dẹp!');
    
  } catch (error) {
    console.error('❌ Lỗi:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Chạy script
cleanupDuplicateCarts();
