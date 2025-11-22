import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function addMoreData() {
  console.log('Adding additional sample data...\n');

  try {
    // 1. Add Product Units
    console.log('Adding product units...');
    const products = await prisma.products.findMany({ take: 50 });
    const unitTypes = await prisma.unittype.findMany();
    
    let unitCount = 0;
    for (let i = 0; i < Math.min(40, products.length); i++) {
      const product = products[i];
      const existing = await prisma.productunits.findMany({
        where: { product_id: product.id }
      });
      
      if (existing.length === 0) {
        const unitType = unitTypes[i % unitTypes.length];
        await prisma.productunits.create({
          data: {
            product_id: product.id,
            unit_name: unitType.name,
            conversion_factor: 1,
            price: product.price
          }
        });
        unitCount++;
      }
    }
    console.log(`✓ Added ${unitCount} product units\n`);

    // 2. Add Inventory Transfers
    console.log('Adding inventory transfers...');
    const branches = await prisma.branches.findMany();
    const branchInvs = await prisma.branchinventory.findMany({ take: 20 });
    
    let transferCount = 0;
    for (let i = 0; i < 10; i++) {
      const fromInv = branchInvs[i % branchInvs.length];
      
      // Find or create inventory in target branch
      const toBranch = branches.find(b => b.id !== fromInv.branch_id) || branches[0];
      let toInv = await prisma.branchinventory.findFirst({
        where: {
          branch_id: toBranch.id,
          product_id: fromInv.product_id
        }
      });
      
      if (!toInv) {
        toInv = await prisma.branchinventory.create({
          data: {
            branch_id: toBranch.id,
            product_id: fromInv.product_id,
            stock: 0,
            min_stock: 10,
            max_stock: 200
          }
        });
      }
      
      const requestedDate = new Date();
      requestedDate.setDate(requestedDate.getDate() - Math.floor(Math.random() * 30));
      
      const status = ['pending', 'approved', 'shipped', 'completed'][Math.floor(Math.random() * 4)];
      
      await prisma.inventoryTransfer.create({
        data: {
          from_branch_id: fromInv.branch_id,
          to_branch_id: toBranch.id,
          product_id: fromInv.product_id,
          quantity: Math.floor(Math.random() * 20) + 5,
          status: status,
          requested_date: requestedDate,
          tracking_number: `TRK-${Date.now()}-${i}`,
          note: `Chuyển kho sản phẩm #${fromInv.product_id}`
        }
      });
      transferCount++;
    }
    console.log(`✓ Added ${transferCount} inventory transfers\n`);

    // 3. Add Supplier Orders
    console.log('Adding supplier orders...');
    const suppliers = await prisma.suppliers.findMany({ take: 10 });
    
    for (let i = 0; i < 20; i++) {
      const supplier = suppliers[i % suppliers.length];
      const branch = branches[i % branches.length];
      const orderNumber = `PO-${Date.now()}-${i}`;
      
      const orderDate = new Date();
      orderDate.setDate(orderDate.getDate() - Math.floor(Math.random() * 90));
      
      const expectedDate = new Date(orderDate);
      expectedDate.setDate(expectedDate.getDate() + 7);
      
      const status = ['draft', 'pending', 'approved', 'received', 'cancelled'][Math.floor(Math.random() * 5)];
      const totalAmount = Math.floor(Math.random() * 50000000) + 10000000;
      const taxAmount = totalAmount * 0.1;
      const discountAmount = Math.floor(Math.random() * 1000000);
      const finalAmount = totalAmount + taxAmount - discountAmount;
      
      const order = await prisma.supplierOrder.create({
        data: {
          supplier_id: supplier.id,
          branch_id: branch.id,
          order_number: orderNumber,
          status: status,
          total_amount: totalAmount,
          tax_amount: taxAmount,
          discount_amount: discountAmount,
          final_amount: finalAmount,
          order_date: orderDate,
          expected_date: expectedDate,
          received_date: status === 'received' ? new Date() : null,
          payment_status: status === 'received' ? 'paid' : 'unpaid',
          note: `Đơn nhập hàng từ ${supplier.name}`
        }
      });
      
      // Add order items
      const orderProducts = await prisma.products.findMany({ 
        take: Math.floor(Math.random() * 5) + 3 
      });
      
      for (const product of orderProducts) {
        const quantity = Math.floor(Math.random() * 100) + 10;
        const unitPrice = Math.floor(Math.random() * 100000) + 10000;
        const subtotal = quantity * unitPrice;
        
        await prisma.supplierOrderItem.create({
          data: {
            order_id: order.id,
            product_id: product.id,
            quantity: quantity,
            received_qty: status === 'received' ? quantity : 0,
            unit_price: unitPrice,
            tax_rate: 10,
            discount: 0,
            subtotal: subtotal,
            batch_number: `BATCH-${Date.now()}-${product.id}`,
            expiry_date: new Date(Date.now() + 730 * 24 * 60 * 60 * 1000)
          }
        });
      }
    }
    console.log(`✓ Added 20 supplier orders with items\n`);

    // 4. Add User Vouchers
    console.log('Adding user vouchers...');
    const customers = await prisma.customers.findMany();
    const vouchers = await prisma.vouchers.findMany();
    
    for (let i = 0; i < 30; i++) {
      const customer = customers[i % customers.length];
      const voucher = vouchers[i % vouchers.length];
      
      const exists = await prisma.uservouchers.findFirst({
        where: {
          customer_id: customer.id,
          voucher_id: voucher.id
        }
      });
      
      if (!exists) {
        await prisma.uservouchers.create({
          data: {
            customer_id: customer.id,
            voucher_id: voucher.id,
            is_used: Math.random() > 0.5,
            assigned_at: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000)
          }
        });
      }
    }
    console.log(`✓ Added user vouchers\n`);

    // 5. Add Shipments
    console.log('Adding shipments...');
    const orders = await prisma.orders.findMany({
      include: { shippingaddresses: true }
    });
    
    let shipmentCount = 0;
    for (const order of orders) {
      if (!order.shipping_address_id) continue;
      
      const exists = await prisma.shipments.findFirst({
        where: { order_id: order.id }
      });
      
      if (!exists) {
        const branch = branches[shipmentCount % branches.length];
        const shippedDate = new Date(order.order_date);
        shippedDate.setDate(shippedDate.getDate() + 1);
        
        const estimatedDelivery = new Date(shippedDate);
        estimatedDelivery.setDate(estimatedDelivery.getDate() + 3);
        
        const statuses = ['pending', 'shipped', 'in_transit', 'delivered'];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        
        await prisma.shipments.create({
          data: {
            order_id: order.id,
            branch_id: branch.id,
            shipping_address_id: order.shipping_address_id,
            tracking_number: `SHIP-${Date.now()}-${shipmentCount}`,
            carrier: ['Giao Hàng Nhanh', 'Giao Hàng Tiết Kiệm', 'ViettelPost', 'VNPOST'][Math.floor(Math.random() * 4)],
            shipped_date: shippedDate,
            estimated_delivery: estimatedDelivery,
            actual_delivery: status === 'delivered' ? new Date() : null,
            status: status
          }
        });
        shipmentCount++;
      }
    }
    console.log(`✓ Added ${shipmentCount} shipments\n`);

    // 6. Add Prescriptions
    console.log('Adding prescriptions...');
    const prescriptionCustomers = await prisma.customers.findMany({ take: 15 });
    const prescriptionOrders = await prisma.orders.findMany({ take: 10 });
    
    for (let i = 0; i < 20; i++) {
      const customer = prescriptionCustomers[i % prescriptionCustomers.length];
      const order = i < prescriptionOrders.length ? prescriptionOrders[i] : null;
      
      const prescribedDate = new Date();
      prescribedDate.setDate(prescribedDate.getDate() - Math.floor(Math.random() * 180));
      
      const expiryDate = new Date(prescribedDate);
      expiryDate.setDate(expiryDate.getDate() + 90);
      
      await prisma.prescriptions.create({
        data: {
          customer_id: customer.id,
          order_id: order?.id,
          prescription_number: `RX-${Date.now()}-${i}`,
          doctor_name: `Bác sĩ ${['Nguyễn Văn A', 'Trần Thị B', 'Lê Văn C', 'Phạm Thị D'][i % 4]}`,
          doctor_license: `BYT-${10000 + i}`,
          hospital_name: `Bệnh viện ${['Chợ Rẫy', 'Bạch Mai', 'Đại học Y', '115'][i % 4]}`,
          diagnosis: ['Viêm họng', 'Đau đầu', 'Cảm cúm', 'Viêm phế quản'][i % 4],
          prescribed_date: prescribedDate,
          expiry_date: expiryDate,
          status: ['pending', 'verified', 'rejected'][Math.floor(Math.random() * 3)],
          verification_notes: 'Đơn thuốc hợp lệ'
        }
      });
    }
    console.log(`✓ Added 20 prescriptions\n`);

    // 7. Add Notifications
    console.log('Adding notifications...');
    const users = await prisma.users.findMany({ take: 20 });
    const notifCustomers = await prisma.customers.findMany({ take: 20 });
    
    for (let i = 0; i < 30; i++) {
      const messages = [
        'Đơn hàng của bạn đã được xác nhận',
        'Đơn hàng đang được giao',
        'Đơn hàng đã được giao thành công',
        'Bạn có voucher mới',
        'Flash sale sắp bắt đầu',
        'Sản phẩm yêu thích đã có hàng',
        'Đơn hàng đã được hủy',
        'Thanh toán thành công',
        'Có sản phẩm mới phù hợp với bạn',
        'Nhắc nhở: Đơn thuốc sắp hết hạn'
      ];
      
      const types = ['order', 'promotion', 'system', 'delivery'];
      
      await prisma.notifications.create({
        data: {
          user_id: i % 2 === 0 ? users[i % users.length].id : null,
          customer_id: i % 2 === 1 ? notifCustomers[i % notifCustomers.length].id : null,
          message: messages[i % messages.length],
          type: types[Math.floor(Math.random() * types.length)],
          is_read: Math.random() > 0.5
        }
      });
    }
    console.log(`✓ Added 30 notifications\n`);

    // 8. Add Logs
    console.log('Adding logs...');
    for (let i = 0; i < 50; i++) {
      const user = users[i % users.length];
      const actions = [
        'login',
        'logout',
        'create_order',
        'update_order',
        'cancel_order',
        'add_product',
        'update_product',
        'delete_product',
        'add_inventory',
        'transfer_inventory'
      ];
      
      await prisma.logs.create({
        data: {
          user_id: user.id,
          action: actions[i % actions.length],
          details: `User ${user.username} performed ${actions[i % actions.length]}`,
          created_at: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000)
        }
      });
    }
    console.log(`✓ Added 50 logs\n`);

    console.log('\n✅ All additional sample data added successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

addMoreData().catch(console.error);
