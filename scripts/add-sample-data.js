import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function addSampleData() {
  console.log('Starting to add sample data...\n');

  try {
    // 1. Add Cities (if not exist)
    console.log('Adding cities...');
    const cities = [
      { name: 'Hồ Chí Minh', code: 'HCM', region: 'Miền Nam' },
      { name: 'Hà Nội', code: 'HN', region: 'Miền Bắc' },
      { name: 'Đà Nẵng', code: 'DN', region: 'Miền Trung' },
      { name: 'Cần Thơ', code: 'CT', region: 'Miền Nam' },
      { name: 'Hải Phòng', code: 'HP', region: 'Miền Bắc' },
      { name: 'Biên Hòa', code: 'BH', region: 'Miền Nam' },
      { name: 'Nha Trang', code: 'NT', region: 'Miền Trung' },
      { name: 'Huế', code: 'HU', region: 'Miền Trung' },
      { name: 'Vũng Tàu', code: 'VT', region: 'Miền Nam' },
      { name: 'Buôn Ma Thuột', code: 'BMT', region: 'Miền Trung' }
    ];

    for (const city of cities) {
      await prisma.cities.upsert({
        where: { name: city.name },
        update: {},
        create: city
      });
    }
    console.log(`✓ Added ${cities.length} cities\n`);

    // 2. Update existing branches with city_id
    const allCities = await prisma.cities.findMany();
    const branches = await prisma.branches.findMany();
    
    if (branches.length > 0) {
      console.log('Updating branches with city_id...');
      for (let i = 0; i < branches.length; i++) {
        const branch = branches[i];
        const cityIndex = i % allCities.length;
        await prisma.branches.update({
          where: { id: branch.id },
          data: { city_id: allCities[cityIndex].id }
        });
      }
      console.log(`✓ Updated ${branches.length} branches\n`);
    }

    // 3. Add more Branches
    console.log('Adding more branches...');
    const hcmCity = allCities.find(c => c.code === 'HCM');
    const hnCity = allCities.find(c => c.code === 'HN');
    const dnCity = allCities.find(c => c.code === 'DN');

    const newBranches = [
      {
        name: 'Chi nhánh Quận 1 - HCM',
        address: '123 Nguyễn Huệ, Quận 1, TP.HCM',
        phone: '0281234567',
        city: 'Hồ Chí Minh',
        city_id: hcmCity?.id,
        is_active: true
      },
      {
        name: 'Chi nhánh Cầu Giấy - Hà Nội',
        address: '456 Cầu Giấy, Hà Nội',
        phone: '0242345678',
        city: 'Hà Nội',
        city_id: hnCity?.id,
        is_active: true
      },
      {
        name: 'Chi nhánh Hải Châu - Đà Nẵng',
        address: '789 Hải Châu, Đà Nẵng',
        phone: '0236345678',
        city: 'Đà Nẵng',
        city_id: dnCity?.id,
        is_active: true
      }
    ];

    for (const branch of newBranches) {
      const exists = await prisma.branches.findFirst({
        where: { name: branch.name }
      });
      if (!exists) {
        await prisma.branches.create({ data: branch });
      }
    }
    console.log(`✓ Added new branches\n`);

    // 4. Update customers with city_id
    const customers = await prisma.customers.findMany();
    if (customers.length > 0) {
      console.log('Updating customers with city_id...');
      for (let i = 0; i < customers.length; i++) {
        const customer = customers[i];
        const cityIndex = i % allCities.length;
        await prisma.customers.update({
          where: { id: customer.id },
          data: { 
            city: allCities[cityIndex].name,
            city_id: allCities[cityIndex].id 
          }
        });
      }
      console.log(`✓ Updated ${customers.length} customers\n`);
    }

    // 5. Add BranchInventory records
    console.log('Adding branch inventory records...');
    const allBranches = await prisma.branches.findMany();
    const products = await prisma.products.findMany({ take: 50 });
    
    let inventoryCount = 0;
    for (const branch of allBranches) {
      for (let i = 0; i < Math.min(20, products.length); i++) {
        const product = products[i];
        const exists = await prisma.branchinventory.findFirst({
          where: { branch_id: branch.id, product_id: product.id }
        });
        
        if (!exists) {
          await prisma.branchinventory.create({
            data: {
              branch_id: branch.id,
              product_id: product.id,
              stock: Math.floor(Math.random() * 100) + 50,
              min_stock: 10,
              max_stock: 200,
              reorder_point: 20,
              reorder_quantity: 50
            }
          });
          inventoryCount++;
        }
      }
    }
    console.log(`✓ Added ${inventoryCount} branch inventory records\n`);

    // 6. Add ProductBatch records
    console.log('Adding product batches...');
    const inventories = await prisma.branchinventory.findMany({ take: 30 });
    const suppliers = await prisma.suppliers.findMany({ take: 10 });
    
    let batchCount = 0;
    for (const inv of inventories) {
      const supplier = suppliers[batchCount % suppliers.length];
      const batchNumber = `BATCH-${Date.now()}-${batchCount}`;
      
      const exists = await prisma.productBatch.findFirst({
        where: { 
          batch_number: batchNumber,
          product_id: inv.product_id,
          branch_id: inv.branch_id
        }
      });
      
      if (!exists) {
        const manufactureDate = new Date();
        manufactureDate.setMonth(manufactureDate.getMonth() - Math.floor(Math.random() * 6));
        
        const expiryDate = new Date();
        expiryDate.setMonth(expiryDate.getMonth() + 12 + Math.floor(Math.random() * 24));
        
        await prisma.productBatch.create({
          data: {
            product_id: inv.product_id,
            branch_id: inv.branch_id,
            batch_number: batchNumber,
            manufacture_date: manufactureDate,
            expiry_date: expiryDate,
            quantity: Math.floor(Math.random() * 50) + 20,
            cost_price: Math.floor(Math.random() * 50000) + 10000,
            selling_price: Math.floor(Math.random() * 80000) + 20000,
            supplier_id: supplier.id,
            status: 'active'
          }
        });
        batchCount++;
      }
    }
    console.log(`✓ Added ${batchCount} product batches\n`);

    // 7. Add Reviews
    console.log('Adding product reviews...');
    const reviewProducts = await prisma.products.findMany({ take: 30 });
    const reviewCustomers = await prisma.customers.findMany({ take: 20 });
    
    let reviewCount = 0;
    for (let i = 0; i < 25; i++) {
      const product = reviewProducts[i % reviewProducts.length];
      const customer = reviewCustomers[i % reviewCustomers.length];
      
      const exists = await prisma.reviews.findFirst({
        where: { 
          customer_id: customer.id,
          product_id: product.id
        }
      });
      
      if (!exists) {
        const comments = [
          'Sản phẩm tốt, giao hàng nhanh',
          'Chất lượng như mô tả',
          'Giá hợp lý, sẽ mua lại',
          'Đóng gói cẩn thận',
          'Hiệu quả sử dụng tốt',
          'Rất hài lòng với sản phẩm',
          'Giao hàng đúng hẹn',
          'Shop phục vụ tốt',
          'Sản phẩm chính hãng',
          'Giá cả phải chăng'
        ];
        
        await prisma.reviews.create({
          data: {
            customer_id: customer.id,
            product_id: product.id,
            rating: Math.floor(Math.random() * 3) + 3, // 3-5 stars
            comment: comments[i % comments.length]
          }
        });
        reviewCount++;
      }
    }
    console.log(`✓ Added ${reviewCount} reviews\n`);

    // 8. Add StockTake records
    console.log('Adding stock take records...');
    for (let i = 0; i < 3; i++) {
      const branch = allBranches[i % allBranches.length];
      const stockTakeNo = `ST-${Date.now()}-${i}`;
      
      const exists = await prisma.stockTake.findFirst({
        where: { stock_take_no: stockTakeNo }
      });
      
      if (!exists) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - Math.floor(Math.random() * 30));
        
        const stockTake = await prisma.stockTake.create({
          data: {
            branch_id: branch.id,
            stock_take_no: stockTakeNo,
            status: i === 0 ? 'in_progress' : 'completed',
            start_date: startDate,
            complete_date: i === 0 ? null : new Date(),
            note: `Kiểm kê định kỳ tháng ${new Date().getMonth() + 1}`
          }
        });
        
        // Add stock take items
        const branchInv = await prisma.branchinventory.findMany({
          where: { branch_id: branch.id },
          take: 10
        });
        
        for (const inv of branchInv) {
          const systemQty = inv.stock || 0;
          const actualQty = systemQty + Math.floor(Math.random() * 10) - 5;
          const variance = actualQty - systemQty;
          
          await prisma.stockTakeItem.create({
            data: {
              stock_take_id: stockTake.id,
              product_id: inv.product_id,
              branch_id: inv.branch_id,
              system_qty: systemQty,
              actual_qty: actualQty,
              variance: variance,
              variance_value: variance * 50000,
              reason: variance !== 0 ? 'Chênh lệch kho' : null
            }
          });
        }
      }
    }
    console.log(`✓ Added stock take records\n`);

    // 9. Add Vouchers
    console.log('Adding vouchers...');
    const vouchers = [
      {
        code: 'WELCOME2024',
        discount_type: 'percentage',
        discount_value: 10,
        min_order_value: 100000,
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-12-31'),
        usage_limit: 1000,
        used_count: Math.floor(Math.random() * 100)
      },
      {
        code: 'NEWYEAR2024',
        discount_type: 'fixed',
        discount_value: 50000,
        min_order_value: 500000,
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-01-31'),
        usage_limit: 500,
        used_count: Math.floor(Math.random() * 200)
      },
      {
        code: 'FREESHIP50',
        discount_type: 'fixed',
        discount_value: 30000,
        min_order_value: 200000,
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-12-31'),
        usage_limit: 2000,
        used_count: Math.floor(Math.random() * 500)
      },
      {
        code: 'VIP20',
        discount_type: 'percentage',
        discount_value: 20,
        min_order_value: 1000000,
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-12-31'),
        usage_limit: 100,
        used_count: Math.floor(Math.random() * 50)
      }
    ];

    let voucherCount = 0;
    for (const voucher of vouchers) {
      const exists = await prisma.vouchers.findFirst({
        where: { code: voucher.code }
      });
      if (!exists) {
        await prisma.vouchers.create({ data: voucher });
        voucherCount++;
      }
    }
    console.log(`✓ Added ${voucherCount} vouchers\n`);

    // 10. Add Flashsales
    console.log('Adding flash sales...');
    const now = new Date();
    const flashsales = [
      {
        name: 'Flash Sale Cuối Tuần',
        description: 'Giảm giá sốc cuối tuần',
        start_time: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        end_time: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
        status: 'active'
      },
      {
        name: 'Flash Sale Đầu Tháng',
        description: 'Khuyến mãi đặc biệt đầu tháng',
        start_time: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
        end_time: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
        status: 'pending'
      }
    ];

    let flashsaleCount = 0;
    for (const fs of flashsales) {
      const exists = await prisma.flashsales.findFirst({
        where: { name: fs.name }
      });
      
      if (!exists) {
        const flashsale = await prisma.flashsales.create({ data: fs });
        flashsaleCount++;
        
        // Add flash sale products
        const fsProducts = await prisma.products.findMany({ take: 5 });
        for (const product of fsProducts) {
          await prisma.flashsale_products.create({
            data: {
              flashsale_id: flashsale.id,
              product_id: product.id,
              flash_price: Number(product.price) * 0.7, // 30% off
              stock_limit: 100,
              sold_count: Math.floor(Math.random() * 30)
            }
          });
        }
      }
    }
    console.log(`✓ Added ${flashsaleCount} flash sales\n`);

    // 11. Add ShippingAddresses
    console.log('Adding shipping addresses...');
    const customersForAddress = await prisma.customers.findMany({ take: 20 });
    let addressCount = 0;
    
    for (const customer of customersForAddress) {
      const existingAddresses = await prisma.shippingaddresses.findMany({
        where: { customer_id: customer.id }
      });
      
      if (existingAddresses.length === 0) {
        const city = allCities[addressCount % allCities.length];
        await prisma.shippingaddresses.create({
          data: {
            customer_id: customer.id,
            address_line: `${Math.floor(Math.random() * 999) + 1} Đường ${addressCount + 1}`,
            city: city.name,
            city_id: city.id,
            state: city.region,
            postal_code: `${70000 + addressCount}`,
            country: 'Vietnam',
            is_default: true
          }
        });
        addressCount++;
      }
    }
    console.log(`✓ Added ${addressCount} shipping addresses\n`);

    // 12. Add UnitTypes if needed
    console.log('Adding unit types...');
    const unitTypes = [
      { name: 'Viên' },
      { name: 'Hộp' },
      { name: 'Chai' },
      { name: 'Túi' },
      { name: 'Gói' },
      { name: 'Lọ' },
      { name: 'Ống' },
      { name: 'Vỉ' }
    ];

    let unitTypeCount = 0;
    for (const ut of unitTypes) {
      const exists = await prisma.unittype.findFirst({
        where: { name: ut.name }
      });
      if (!exists) {
        await prisma.unittype.create({ data: ut });
        unitTypeCount++;
      }
    }
    console.log(`✓ Added ${unitTypeCount} unit types\n`);

    console.log('\n✅ Sample data added successfully!');
    
  } catch (error) {
    console.error('❌ Error adding sample data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

addSampleData()
  .catch(console.error);
