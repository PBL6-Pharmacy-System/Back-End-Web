// Seed script để tạo dữ liệu cho module Inventory và Shipment
// Chạy: node prisma/seed-inventory-shipment.cjs

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// ============== HELPER FUNCTIONS ==============

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function generateTrackingNumber() {
  const prefix = randomElement(['VN', 'GHN', 'GHTK', 'JT', 'VTP']);
  const number = Math.random().toString().slice(2, 14);
  return `${prefix}${number}`;
}

function generateOrderNumber(prefix, index) {
  const date = new Date();
  const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  return `${prefix}${dateStr}${String(index).padStart(4, '0')}`;
}

// ============== SEED DATA ==============

// Roles
const ROLES = [
  { id: 1, role_name: 'admin', description: 'Quản trị viên hệ thống' },
  { id: 2, role_name: 'staff', description: 'Nhân viên' },
  { id: 3, role_name: 'customer', description: 'Khách hàng' },
];

// Cities với tọa độ thực tế
const CITIES = [
  { name: 'Hà Nội', code: 'HN', region: 'Miền Bắc', latitude: 21.0285, longitude: 105.8542 },
  { name: 'Hồ Chí Minh', code: 'HCM', region: 'Miền Nam', latitude: 10.8231, longitude: 106.6297 },
  { name: 'Đà Nẵng', code: 'DN', region: 'Miền Trung', latitude: 16.0544, longitude: 108.2022 },
  { name: 'Hải Phòng', code: 'HP', region: 'Miền Bắc', latitude: 20.8449, longitude: 106.6881 },
  { name: 'Cần Thơ', code: 'CT', region: 'Miền Nam', latitude: 10.0452, longitude: 105.7469 },
  { name: 'Huế', code: 'HUE', region: 'Miền Trung', latitude: 16.4637, longitude: 107.5909 },
  { name: 'Nha Trang', code: 'NT', region: 'Miền Trung', latitude: 12.2388, longitude: 109.1967 },
  { name: 'Bình Dương', code: 'BD', region: 'Miền Nam', latitude: 10.9804, longitude: 106.6519 },
  { name: 'Đồng Nai', code: 'DNA', region: 'Miền Nam', latitude: 10.9453, longitude: 106.8243 },
  { name: 'Vũng Tàu', code: 'VT', region: 'Miền Nam', latitude: 10.4114, longitude: 107.1362 },
];

// Suppliers
const SUPPLIERS = [
  {
    name: 'Công ty Dược phẩm Hậu Giang',
    contact_info: { phone: '02923891433', email: 'dhgpharma@dhgpharma.com.vn', address: '288 Bis Nguyễn Văn Cừ, Cần Thơ' }
  },
  {
    name: 'Công ty Dược phẩm Traphaco',
    contact_info: { phone: '02438533033', email: 'info@traphaco.com.vn', address: '75 Yên Ninh, Hà Nội' }
  },
  {
    name: 'Công ty Dược phẩm Imexpharm',
    contact_info: { phone: '02773881515', email: 'imexpharm@imexpharm.com', address: '04 Đường 30/4, Cao Lãnh, Đồng Tháp' }
  },
  {
    name: 'Công ty Dược phẩm Pymepharco',
    contact_info: { phone: '02573824053', email: 'pyme@pymepharco.com', address: '166-170 Nguyễn Huệ, Tuy Hòa, Phú Yên' }
  },
  {
    name: 'Công ty Dược phẩm Domesco',
    contact_info: { phone: '02773851800', email: 'domesco@domesco.com', address: '66 Quốc lộ 30, Đồng Tháp' }
  },
  {
    name: 'Công ty GSK Vietnam',
    contact_info: { phone: '02839325500', email: 'contact.vn@gsk.com', address: 'Tầng 11, Tòa nhà Deutsches Haus, HCM' }
  },
  {
    name: 'Công ty Sanofi Vietnam',
    contact_info: { phone: '02839307100', email: 'vietnam.contact@sanofi.com', address: 'Tầng 32, Bitexco Financial Tower, HCM' }
  },
  {
    name: 'Công ty Abbott Vietnam',
    contact_info: { phone: '02839100100', email: 'abbott.vietnam@abbott.com', address: 'Tầng 8, Vincom Center, HCM' }
  },
];

// Branches
const BRANCHES = [
  { name: 'Chi nhánh Quận 1 - HCM', address: '123 Nguyễn Huệ, Quận 1, TP.HCM', phone: '02838123456', city: 'Hồ Chí Minh', latitude: 10.7769, longitude: 106.7009 },
  { name: 'Chi nhánh Quận 7 - HCM', address: '456 Nguyễn Thị Thập, Quận 7, TP.HCM', phone: '02838789012', city: 'Hồ Chí Minh', latitude: 10.7340, longitude: 106.7215 },
  { name: 'Chi nhánh Hoàn Kiếm - HN', address: '78 Hàng Bài, Hoàn Kiếm, Hà Nội', phone: '02438234567', city: 'Hà Nội', latitude: 21.0245, longitude: 105.8512 },
  { name: 'Chi nhánh Cầu Giấy - HN', address: '200 Xuân Thủy, Cầu Giấy, Hà Nội', phone: '02438345678', city: 'Hà Nội', latitude: 21.0380, longitude: 105.7820 },
  { name: 'Chi nhánh Hải Châu - ĐN', address: '50 Nguyễn Văn Linh, Hải Châu, Đà Nẵng', phone: '02363456789', city: 'Đà Nẵng', latitude: 16.0678, longitude: 108.2208 },
  { name: 'Chi nhánh Ninh Kiều - CT', address: '30 Nguyễn Trãi, Ninh Kiều, Cần Thơ', phone: '02923567890', city: 'Cần Thơ', latitude: 10.0341, longitude: 105.7678 },
];

// Staff data
const STAFF_DATA = [
  { position: 'Quản lý chi nhánh', department: 'Quản lý', salary: 25000000 },
  { position: 'Dược sĩ', department: 'Bán hàng', salary: 15000000 },
  { position: 'Nhân viên kho', department: 'Kho vận', salary: 10000000 },
  { position: 'Nhân viên bán hàng', department: 'Bán hàng', salary: 9000000 },
  { position: 'Nhân viên giao hàng', department: 'Vận chuyển', salary: 8500000 },
];

// Shipping zones
const SHIPPING_ZONES = [
  { name: 'Nội thành', min_distance: 0, max_distance: 10, base_fee: 15000, fee_per_km: 0, min_order_free: 500000, estimated_days: 1 },
  { name: 'Ngoại thành', min_distance: 10, max_distance: 30, base_fee: 25000, fee_per_km: 1000, min_order_free: 800000, estimated_days: 2 },
  { name: 'Liên tỉnh gần', min_distance: 30, max_distance: 100, base_fee: 35000, fee_per_km: 500, min_order_free: 1000000, estimated_days: 3 },
  { name: 'Liên tỉnh xa', min_distance: 100, max_distance: 500, base_fee: 50000, fee_per_km: 300, min_order_free: 1500000, estimated_days: 5 },
  { name: 'Vùng sâu vùng xa', min_distance: 500, max_distance: 2000, base_fee: 80000, fee_per_km: 200, min_order_free: null, estimated_days: 7 },
];

// Vouchers
const VOUCHERS = [
  { code: 'WELCOME10', discount_type: 'percentage', discount_value: 10, min_order_value: 200000, usage_limit: 1000 },
  { code: 'FREESHIP', discount_type: 'fixed', discount_value: 30000, min_order_value: 300000, usage_limit: 500 },
  { code: 'SAVE50K', discount_type: 'fixed', discount_value: 50000, min_order_value: 500000, usage_limit: 200 },
  { code: 'VIP20', discount_type: 'percentage', discount_value: 20, min_order_value: 1000000, usage_limit: 100 },
  { code: 'BLACKFRIDAY', discount_type: 'percentage', discount_value: 30, min_order_value: 800000, usage_limit: 300 },
];

// ============== MAIN SEED FUNCTION ==============
async function main() {
  console.log('🚀 Bắt đầu seed dữ liệu Inventory & Shipment...\n');

  try {
    // 1. Seed Roles
    console.log('1️⃣  Seeding Roles...');
    for (const role of ROLES) {
      await prisma.roles.upsert({
        where: { id: role.id },
        update: role,
        create: role,
      });
    }
    console.log(`   ✅ Đã tạo/cập nhật ${ROLES.length} roles\n`);

    // 2. Seed Cities
    console.log('2️⃣  Seeding Cities...');
    const createdCities = [];
    for (const city of CITIES) {
      const created = await prisma.cities.upsert({
        where: { name: city.name },
        update: city,
        create: city,
      });
      createdCities.push(created);
    }
    console.log(`   ✅ Đã tạo/cập nhật ${createdCities.length} cities\n`);

    // 3. Seed Suppliers - Lấy existing hoặc tạo mới
    console.log('3️⃣  Seeding Suppliers...');
    let createdSuppliers = await prisma.suppliers.findMany();
    if (createdSuppliers.length === 0) {
      for (const supplier of SUPPLIERS) {
        const created = await prisma.suppliers.create({
          data: supplier,
        });
        createdSuppliers.push(created);
      }
      console.log(`   ✅ Đã tạo ${createdSuppliers.length} suppliers\n`);
    } else {
      console.log(`   ℹ️  Đã có ${createdSuppliers.length} suppliers trong DB\n`);
    }

    // 4. Seed Admin User - kiểm tra tồn tại
    console.log('4️⃣  Seeding Users (Admin, Staff, Customers)...');
    const passwordHash = await bcrypt.hash('Password123!', 10);

    let adminUser = await prisma.users.findUnique({ where: { username: 'admin' } });
    if (!adminUser) {
      adminUser = await prisma.users.create({
        data: {
          username: 'admin',
          password_hash: passwordHash,
          email: 'admin@medicineshop.vn',
          phone: '0901000001',
          role_id: 1,
          full_name: 'Quản trị viên',
          is_active: true,
          is_verified: true,
        },
      });

      await prisma.admin.create({
        data: {
          user_id: adminUser.id,
          admin_level: 10,
          is_super_admin: true,
          permissions: { all: true },
        },
      });
      console.log('   ✅ Đã tạo admin user\n');
    } else {
      console.log('   ℹ️  Admin user đã tồn tại\n');
    }

    // 5. Seed Branches - kiểm tra tồn tại
    console.log('5️⃣  Seeding Branches...');
    let createdBranches = await prisma.branches.findMany();
    if (createdBranches.length === 0) {
      for (const branch of BRANCHES) {
        const city = createdCities.find(c => c.name === branch.city);
        const created = await prisma.branches.create({
          data: {
            name: branch.name,
            address: branch.address,
            phone: branch.phone,
            city: branch.city,
            city_id: city?.id,
            latitude: branch.latitude,
            longitude: branch.longitude,
            is_active: true,
          },
        });
        createdBranches.push(created);
      }
      console.log(`   ✅ Đã tạo ${createdBranches.length} branches\n`);
    } else {
      console.log(`   ℹ️  Đã có ${createdBranches.length} branches trong DB\n`);
    }

    // 6. Create staff users for each branch - kiểm tra tồn tại
    console.log('6️⃣  Seeding Staff...');
    let createdStaff = [];
    const existingStaff = await prisma.staff.findMany({ include: { users: true } });

    if (existingStaff.length === 0) {
      let staffCounter = 1;

      for (const branch of createdBranches) {
        const staffCount = randomInt(3, 5);
        for (let i = 0; i < staffCount; i++) {
          const staffData = STAFF_DATA[i % STAFF_DATA.length];
          const staffUser = await prisma.users.create({
            data: {
              username: `staff${staffCounter}`,
              password_hash: passwordHash,
              email: `staff${staffCounter}@medicineshop.vn`,
              phone: `090100${String(staffCounter + 10).padStart(4, '0')}`,
              role_id: 2,
              full_name: `Nhân viên ${staffCounter}`,
              is_active: true,
              is_verified: true,
            },
          });

          const staff = await prisma.staff.create({
            data: {
              user_id: staffUser.id,
              employee_id: `NV${String(staffCounter).padStart(5, '0')}`,
              branch_id: branch.id,
              position: staffData.position,
              department: staffData.department,
              hire_date: randomDate(new Date('2020-01-01'), new Date('2024-06-01')),
              salary: staffData.salary,
              is_active: true,
            },
          });
          createdStaff.push({ user: staffUser, staff });
          staffCounter++;
        }
      }

      // Update branch managers
      for (let i = 0; i < createdBranches.length; i++) {
        const branchStaff = createdStaff.filter(s => s.staff.branch_id === createdBranches[i].id);
        if (branchStaff.length > 0) {
          await prisma.branches.update({
            where: { id: createdBranches[i].id },
            data: { manager_id: branchStaff[0].user.id },
          });
        }
      }
      console.log(`   ✅ Đã tạo ${createdStaff.length} staff members\n`);
    } else {
      createdStaff = existingStaff.map(s => ({ user: s.users, staff: s }));
      console.log(`   ℹ️  Đã có ${existingStaff.length} staff trong DB\n`);
    }

    // 7. Seed Customers - kiểm tra tồn tại
    console.log('7️⃣  Seeding Customers...');
    let createdCustomers = [];
    const existingCustomers = await prisma.customers.findMany({ include: { users: true } });

    if (existingCustomers.length === 0) {
      for (let i = 1; i <= 30; i++) {
        const city = randomElement(createdCities);
        const customerUser = await prisma.users.create({
          data: {
            username: `customer${i}`,
            password_hash: passwordHash,
            email: `customer${i}@gmail.com`,
            phone: `098${String(i).padStart(7, '0')}`,
            role_id: 3,
            full_name: `Khách hàng ${i}`,
            is_active: true,
            is_verified: true,
          },
        });

        const customer = await prisma.customers.create({
          data: {
            user_id: customerUser.id,
            dob: randomDate(new Date('1970-01-01'), new Date('2005-01-01')),
            gender: randomElement(['male', 'female']),
            city: city.name,
            city_id: city.id,
            address: `Số ${randomInt(1, 200)}, Đường ${randomInt(1, 50)}, ${city.name}`,
          },
        });
        createdCustomers.push({ user: customerUser, customer });
      }
      console.log(`   ✅ Đã tạo ${createdCustomers.length} customers\n`);
    } else {
      createdCustomers = existingCustomers.map(c => ({ user: c.users, customer: c }));
      console.log(`   ℹ️  Đã có ${existingCustomers.length} customers trong DB\n`);
    }

    // 8. Seed Shipping Addresses
    console.log('8️⃣  Seeding Shipping Addresses...');
    let createdAddresses = await prisma.shippingaddresses.findMany();

    if (createdAddresses.length === 0) {
      for (const { customer } of createdCustomers) {
        const addressCount = randomInt(1, 3);
        for (let i = 0; i < addressCount; i++) {
          const city = randomElement(createdCities);
          const address = await prisma.shippingaddresses.create({
            data: {
              customer_id: customer.id,
              recipient_name: `Người nhận ${customer.id}-${i + 1}`,
              recipient_phone: `097${String(customer.id * 10 + i).padStart(7, '0')}`,
              address_line: `Số ${randomInt(1, 500)}, Đường ${randomInt(1, 100)}, Phường ${randomInt(1, 20)}`,
              city: city.name,
              city_id: city.id,
              district: `Quận ${randomInt(1, 12)}`,
              ward: `Phường ${randomInt(1, 20)}`,
              country: 'Vietnam',
              is_default: i === 0,
              latitude: Number(city.latitude) + (Math.random() - 0.5) * 0.1,
              longitude: Number(city.longitude) + (Math.random() - 0.5) * 0.1,
            },
          });
          createdAddresses.push(address);
        }
      }
      console.log(`   ✅ Đã tạo ${createdAddresses.length} shipping addresses\n`);
    } else {
      console.log(`   ℹ️  Đã có ${createdAddresses.length} shipping addresses trong DB\n`);
    }

    // 9. Seed Shipping Zones
    console.log('9️⃣  Seeding Shipping Zones...');
    const existingZones = await prisma.shipping_zones.count();
    if (existingZones === 0) {
      for (const zone of SHIPPING_ZONES) {
        await prisma.shipping_zones.create({
          data: zone,
        });
      }
      console.log(`   ✅ Đã tạo ${SHIPPING_ZONES.length} shipping zones\n`);
    } else {
      console.log(`   ℹ️  Đã có ${existingZones} shipping zones trong DB\n`);
    }

    // 10. Seed Vouchers
    console.log('🔟 Seeding Vouchers...');
    let createdVouchers = await prisma.vouchers.findMany();
    if (createdVouchers.length === 0) {
      for (const voucher of VOUCHERS) {
        const created = await prisma.vouchers.create({
          data: {
            ...voucher,
            start_date: new Date(),
            end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
          },
        });
        createdVouchers.push(created);
      }
      console.log(`   ✅ Đã tạo ${createdVouchers.length} vouchers\n`);
    } else {
      console.log(`   ℹ️  Đã có ${createdVouchers.length} vouchers trong DB\n`);
    }

    // 11. Get existing products
    console.log('1️⃣1️⃣ Getting existing products...');
    const products = await prisma.products.findMany({
      take: 100,
      orderBy: { id: 'asc' },
    });
    console.log(`   📦 Found ${products.length} products\n`);

    if (products.length === 0) {
      console.log('   ⚠️  Không có products trong database. Vui lòng seed products trước!\n');
      return;
    }

    // 12. Seed Product Units (if not exist)
    console.log('1️⃣2️⃣ Seeding Product Units...');
    let productUnitsCount = 0;

    for (const product of products) {
      const existingUnits = await prisma.productunits.findMany({
        where: { product_id: product.id },
      });

      if (existingUnits.length === 0) {
        await prisma.productunits.create({
          data: {
            product_id: product.id,
            unit_name: randomElement(['Hộp', 'Chai', 'Lọ']),
            conversion_factor: 1,
            price: product.price,
          },
        });
        productUnitsCount++;

        if (Math.random() > 0.5) {
          const subUnitName = randomElement(['Viên', 'Vỉ', 'Gói']);
          const conversionFactor = randomElement([10, 12, 20, 30]);
          await prisma.productunits.create({
            data: {
              product_id: product.id,
              unit_name: subUnitName,
              conversion_factor: conversionFactor,
              price: Number(product.price) / conversionFactor,
            },
          });
          productUnitsCount++;
        }
      }
    }
    console.log(`   ✅ Đã tạo ${productUnitsCount} product units mới\n`);

    // 13. Seed Branch Inventory
    console.log('1️⃣3️⃣ Seeding Branch Inventory...');
    let createdInventory = await prisma.branchinventory.findMany();

    if (createdInventory.length === 0) {
      for (const branch of createdBranches) {
        const branchProducts = products.filter(() => Math.random() > 0.3);

        for (const product of branchProducts) {
          // ✅ FIX: Tạo stock với giá trị sẽ được dùng cho batch
          const initialStock = randomInt(100, 500);

          const inventory = await prisma.branchinventory.create({
            data: {
              branch_id: branch.id,
              product_id: product.id,
              stock: initialStock,
              min_stock: randomInt(5, 20),
              max_stock: randomInt(500, 1000),
              reorder_point: randomInt(15, 50),
              reorder_quantity: randomInt(50, 200),
            },
          });
          // ✅ FIX: Lưu initialStock để dùng cho batch
          createdInventory.push({ ...inventory, initialStock });
        }
      }
      console.log(`   ✅ Đã tạo ${createdInventory.length} branch inventory records\n`);
    } else {
      console.log(`   ℹ️  Đã có ${createdInventory.length} branch inventory records trong DB\n`);
    }

    // 14. Seed Product Batches
    console.log('1️⃣4️⃣ Seeding Product Batches...');
    const existingBatches = await prisma.productBatch.count();
    let batchCount = 0;

    if (existingBatches === 0) {
      for (const inventory of createdInventory.slice(0, 200)) {
        const batchNumber = `LOT${Date.now().toString().slice(-6)}${String(batchCount).padStart(4, '0')}`;
        const manufactureDate = randomDate(new Date('2024-01-01'), new Date('2024-10-01'));
        const expiryDate = new Date(manufactureDate);
        expiryDate.setFullYear(expiryDate.getFullYear() + randomInt(1, 3));

        const product = products.find(p => p.id === inventory.product_id);

        // ✅ FIX: Batch quantity = inventory stock (để đồng bộ)
        const batchQuantity = inventory.initialStock || inventory.stock || randomInt(100, 500);

        await prisma.productBatch.create({
          data: {
            product_id: inventory.product_id,
            branch_id: inventory.branch_id,
            batch_number: batchNumber,
            manufacture_date: manufactureDate,
            expiry_date: expiryDate,
            quantity: batchQuantity, // ✅ FIX: Dùng cùng giá trị với inventory
            cost_price: Number(product.price) * 0.6,
            selling_price: product.price,
            supplier_id: randomElement(createdSuppliers).id,
            status: 'active',
          },
        });
        batchCount++;
      }
      console.log(`   ✅ Đã tạo ${batchCount} product batches\n`);
    } else {
      console.log(`   ℹ️  Đã có ${existingBatches} product batches trong DB\n`);
    }

    // 15. Seed Supplier Orders
    console.log('1️⃣5️⃣ Seeding Supplier Orders...');
    const existingSupplierOrders = await prisma.supplierOrder.count();
    const createdSupplierOrders = [];

    if (existingSupplierOrders === 0) {
      const statuses = ['draft', 'pending', 'approved', 'shipped', 'received', 'cancelled'];

      for (let i = 1; i <= 30; i++) {
        const supplier = randomElement(createdSuppliers);
        const branch = randomElement(createdBranches);
        const branchStaff = createdStaff.filter(s => s.staff.branch_id === branch.id);
        const orderedBy = branchStaff.length > 0 ? branchStaff[0].user.id : null;
        const status = randomElement(statuses);

        const orderProducts = products.slice(0, randomInt(3, 8));
        let totalAmount = 0;
        const items = [];

        for (const product of orderProducts) {
          const quantity = randomInt(20, 100);
          const unitPrice = Number(product.price) * 0.6;
          const subtotal = quantity * unitPrice;
          totalAmount += subtotal;

          items.push({
            product_id: product.id,
            quantity,
            unit_price: unitPrice,
            subtotal,
          });
        }

        const taxAmount = totalAmount * 0.1;
        const discountAmount = Math.random() > 0.7 ? totalAmount * 0.05 : 0;
        const finalAmount = totalAmount + taxAmount - discountAmount;

        const supplierOrder = await prisma.supplierOrder.create({
          data: {
            supplier_id: supplier.id,
            branch_id: branch.id,
            order_number: generateOrderNumber('PO', i),
            status,
            total_amount: totalAmount,
            tax_amount: taxAmount,
            discount_amount: discountAmount,
            final_amount: finalAmount,
            ordered_by: orderedBy,
            approved_by: status !== 'draft' && status !== 'pending' ? orderedBy : null,
            order_date: randomDate(new Date('2024-06-01'), new Date()),
            expected_date: randomDate(new Date(), new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
            payment_status: status === 'received' ? 'paid' : 'unpaid',
          },
        });

        for (const item of items) {
          await prisma.supplierOrderItem.create({
            data: {
              order_id: supplierOrder.id,
              product_id: item.product_id,
              quantity: item.quantity,
              received_qty: status === 'received' ? item.quantity : 0,
              unit_price: item.unit_price,
              subtotal: item.subtotal,
            },
          });
        }

        createdSupplierOrders.push(supplierOrder);
      }
      console.log(`   ✅ Đã tạo ${createdSupplierOrders.length} supplier orders\n`);
    } else {
      console.log(`   ℹ️  Đã có ${existingSupplierOrders} supplier orders trong DB\n`);
    }

    // 16. Seed Customer Orders
    console.log('1️⃣6️⃣ Seeding Customer Orders...');
    let createdOrders = await prisma.orders.findMany();

    if (createdOrders.length === 0) {
      const orderStatuses = ['pending', 'confirmed', 'processing', 'shipping', 'delivered', 'cancelled'];

      // ✅ FIX ISSUE #6: Track orders cần trừ inventory và branch đã chọn
      const ordersWithBranch = [];

      for (let i = 1; i <= 50; i++) {
        const customerData = randomElement(createdCustomers);
        const customerAddresses = createdAddresses.filter(a => a.customer_id === customerData.customer.id);
        const address = customerAddresses.length > 0 ? randomElement(customerAddresses) : null;
        const status = randomElement(orderStatuses);
        const voucher = Math.random() > 0.7 ? randomElement(createdVouchers) : null;

        // ✅ FIX: Chọn branch trước để đảm bảo có inventory
        const selectedBranch = randomElement(createdBranches);
        const branchInventoryItems = createdInventory.filter(inv => inv.branch_id === selectedBranch.id && inv.stock > 0);

        if (branchInventoryItems.length === 0) continue;

        const orderProductCount = randomInt(1, Math.min(5, branchInventoryItems.length));
        const orderProducts = [];
        const usedProductIds = new Set();

        for (let j = 0; j < orderProductCount; j++) {
          // ✅ FIX: Chỉ chọn sản phẩm có trong inventory của branch đã chọn
          const availableInventory = branchInventoryItems.filter(inv =>
            !usedProductIds.has(inv.product_id) && inv.stock > 0
          );

          if (availableInventory.length === 0) break;

          const selectedInventory = randomElement(availableInventory);
          const product = products.find(p => p.id === selectedInventory.product_id);
          if (!product) continue;

          usedProductIds.add(product.id);

          const productUnit = await prisma.productunits.findFirst({
            where: { product_id: product.id },
          });

          if (productUnit) {
            const conversionFactor = Number(productUnit.conversion_factor) || 1;
            // ✅ FIX: Đảm bảo quantity không vượt quá stock
            const maxBaseUnits = Math.floor(selectedInventory.stock / conversionFactor);
            const maxQuantity = Math.min(5, maxBaseUnits);

            if (maxQuantity <= 0) continue;

            const quantity = randomInt(1, maxQuantity);

            orderProducts.push({
              product_id: product.id,
              unit_id: productUnit.id,
              quantity,
              price: productUnit.price,
              subtotal: Number(productUnit.price) * quantity,
              conversion_factor: conversionFactor,
            });
          }
        }

        if (orderProducts.length === 0) continue;

        const totalAmount = orderProducts.reduce((sum, p) => sum + Number(p.subtotal), 0);
        let discountAmount = 0;

        if (voucher) {
          if (voucher.discount_type === 'percentage') {
            discountAmount = totalAmount * Number(voucher.discount_value) / 100;
          } else {
            discountAmount = Number(voucher.discount_value);
          }
        }

        const finalAmount = Math.max(0, totalAmount - discountAmount);

        const order = await prisma.orders.create({
          data: {
            customer_id: customerData.customer.id,
            voucher_id: voucher?.id,
            shipping_address_id: address?.id,
            total_amount: totalAmount,
            discount_amount: discountAmount,
            final_amount: finalAmount,
            status,
            note: Math.random() > 0.8 ? 'Giao hàng giờ hành chính' : null,
            order_date: randomDate(new Date('2024-06-01'), new Date()),
          },
        });

        for (const item of orderProducts) {
          await prisma.orderitems.create({
            data: {
              order_id: order.id,
              product_id: item.product_id,
              unit_id: item.unit_id,
              quantity: item.quantity,
              price: item.price,
              subtotal: item.subtotal,
            },
          });
        }

        await prisma.order_status_history.create({
          data: {
            order_id: order.id,
            status: 'pending',
            changed_at: order.order_date,
          },
        });

        if (status !== 'pending' && status !== 'cancelled') {
          await prisma.order_status_history.create({
            data: {
              order_id: order.id,
              status: 'confirmed',
              changed_at: new Date(order.order_date.getTime() + 2 * 60 * 60 * 1000),
            },
          });
        }

        // ✅ FIX ISSUE #6: Lưu thông tin để trừ inventory sau
        ordersWithBranch.push({
          order,
          orderProducts,
          branch_id: selectedBranch.id,
          status,
        });

        createdOrders.push(order);
      }

      // ✅ FIX ISSUE #6: Trừ inventory cho các order đã xác nhận (status != pending, cancelled)
      console.log('   📦 Đang trừ inventory cho các orders đã xác nhận...');
      let inventoryDeductedCount = 0;

      for (const { order, orderProducts, branch_id, status } of ordersWithBranch) {
        // Chỉ trừ inventory cho orders đã được xử lý (không phải pending hoặc cancelled)
        if (['pending', 'cancelled'].includes(status)) continue;

        for (const item of orderProducts) {
          const baseQuantity = item.quantity * item.conversion_factor;

          // Trừ branchinventory
          await prisma.branchinventory.updateMany({
            where: {
              branch_id: branch_id,
              product_id: item.product_id,
            },
            data: {
              stock: { decrement: baseQuantity },
              last_updated: new Date(),
            },
          });

          // Tạo inventory log
          await prisma.inventoryLog.create({
            data: {
              branch_id: branch_id,
              product_id: item.product_id,
              quantity: baseQuantity,
              type: 'EXPORT',
              reference_type: 'order',
              reference_id: order.id,
              note: `Xuất kho cho đơn hàng #${order.id} (Seed data)`,
              date: order.order_date,
            },
          });

          inventoryDeductedCount++;
        }

        // ✅ FIX: Cập nhật sold_count nếu order đã delivered/completed
        if (['delivered', 'completed'].includes(status)) {
          for (const item of orderProducts) {
            await prisma.products.update({
              where: { id: item.product_id },
              data: {
                sold_count: { increment: item.quantity },
              },
            });
          }
        }

        // Cập nhật inventory record trong memory để tránh overselling
        for (const item of orderProducts) {
          const invIndex = createdInventory.findIndex(
            inv => inv.branch_id === branch_id && inv.product_id === item.product_id
          );
          if (invIndex !== -1) {
            createdInventory[invIndex].stock -= item.quantity * item.conversion_factor;
          }
        }
      }

      console.log(`   ✅ Đã tạo ${createdOrders.length} customer orders`);
      console.log(`   ✅ Đã trừ inventory cho ${inventoryDeductedCount} order items\n`);
    } else {
      console.log(`   ℹ️  Đã có ${createdOrders.length} customer orders trong DB\n`);
    }

    // 17. Seed Payments
    console.log('1️⃣7️⃣ Seeding Payments...');
    const existingPayments = await prisma.payments.count();
    let paymentCount = 0;

    if (existingPayments === 0) {
      const paymentMethods = ['cod', 'bank_transfer', 'momo', 'vnpay', 'zalopay'];

      for (const order of createdOrders) {
        if (order.status === 'cancelled') continue;

        const paymentMethod = randomElement(paymentMethods);
        const isPaid = order.status === 'delivered' || (paymentMethod !== 'cod' && Math.random() > 0.3);

        await prisma.payments.create({
          data: {
            order_id: order.id,
            payment_method: paymentMethod,
            amount: order.final_amount,
            status: isPaid ? 'completed' : 'pending',
            transaction_id: isPaid ? `TXN${Date.now()}${order.id}` : null,
          },
        });
        paymentCount++;
      }
      console.log(`   ✅ Đã tạo ${paymentCount} payments\n`);
    } else {
      console.log(`   ℹ️  Đã có ${existingPayments} payments trong DB\n`);
    }

    // 18. Seed Shipments - ✅ FIX: Sử dụng đúng branch từ inventory log
    console.log('1️⃣8️⃣ Seeding Shipments...');
    const existingShipments = await prisma.shipments.count();
    let shipmentCount = 0;

    if (existingShipments === 0) {
      const carriers = ['Giao Hàng Nhanh', 'Giao Hàng Tiết Kiệm', 'J&T Express', 'Viettel Post', 'VNPost'];

      for (const order of createdOrders) {
        if (order.status === 'pending' || order.status === 'cancelled' || !order.shipping_address_id) continue;

        // ✅ FIX: Tìm branch từ inventory log của order
        const inventoryLog = await prisma.inventoryLog.findFirst({
          where: {
            reference_type: 'order',
            reference_id: order.id,
          },
          select: { branch_id: true },
        });

        // Fallback to random branch if no log found (legacy orders)
        const branchId = inventoryLog?.branch_id || randomElement(createdBranches).id;

        const shipmentStatus = order.status === 'delivered' ? 'delivered' :
          order.status === 'shipping' ? randomElement(['picked_up', 'in_transit']) : 'pending';

        const shippedDate = new Date(order.order_date);
        shippedDate.setDate(shippedDate.getDate() + 1);

        const estimatedDelivery = new Date(shippedDate);
        estimatedDelivery.setDate(estimatedDelivery.getDate() + randomInt(2, 5));

        await prisma.shipments.create({
          data: {
            order_id: order.id,
            branch_id: branchId, // ✅ FIX: Sử dụng branch đã xuất kho
            shipping_address_id: order.shipping_address_id,
            tracking_number: generateTrackingNumber(),
            carrier: randomElement(carriers),
            shipped_date: ['pending'].includes(shipmentStatus) ? null : shippedDate,
            estimated_delivery: estimatedDelivery,
            actual_delivery: shipmentStatus === 'delivered' ? estimatedDelivery : null,
            status: shipmentStatus,
          },
        });
        shipmentCount++;
      }
      console.log(`   ✅ Đã tạo ${shipmentCount} shipments\n`);
    } else {
      console.log(`   ℹ️  Đã có ${existingShipments} shipments trong DB\n`);
    }

    // 19. Seed Inventory Transfers
    console.log('1️⃣9️⃣ Seeding Inventory Transfers...');
    const existingTransfers = await prisma.inventoryTransfer.count();
    let transferCount = 0;

    if (existingTransfers === 0) {
      const transferStatuses = ['pending', 'approved', 'shipped', 'received', 'cancelled'];

      for (let i = 0; i < 20; i++) {
        const fromBranch = randomElement(createdBranches);
        const toBranch = randomElement(createdBranches.filter(b => b.id !== fromBranch.id));
        if (!toBranch) continue;

        const fromInventory = createdInventory.filter(inv => inv.branch_id === fromBranch.id);
        const toInventory = createdInventory.filter(inv => inv.branch_id === toBranch.id);

        const commonProductIds = fromInventory
          .map(inv => inv.product_id)
          .filter(pid => toInventory.some(inv => inv.product_id === pid));

        if (commonProductIds.length === 0) continue;

        const productId = randomElement(commonProductIds);
        const status = randomElement(transferStatuses);

        const fromStaff = createdStaff.find(s => s.staff.branch_id === fromBranch.id);
        const toStaff = createdStaff.find(s => s.staff.branch_id === toBranch.id);

        const requestedDate = randomDate(new Date('2024-08-01'), new Date());

        await prisma.inventoryTransfer.create({
          data: {
            from_branch_id: fromBranch.id,
            to_branch_id: toBranch.id,
            product_id: productId,
            quantity: randomInt(10, 50),
            status,
            requested_by: fromStaff?.user.id,
            approved_by: status !== 'pending' ? fromStaff?.user.id : null,
            shipped_by: ['shipped', 'received'].includes(status) ? fromStaff?.user.id : null,
            received_by: status === 'received' ? toStaff?.user.id : null,
            requested_date: requestedDate,
            approved_date: status !== 'pending' ? new Date(requestedDate.getTime() + 2 * 60 * 60 * 1000) : null,
            shipped_date: ['shipped', 'received'].includes(status) ? new Date(requestedDate.getTime() + 24 * 60 * 60 * 1000) : null,
            received_date: status === 'received' ? new Date(requestedDate.getTime() + 48 * 60 * 60 * 1000) : null,
            tracking_number: ['shipped', 'received'].includes(status) ? generateTrackingNumber() : null,
            note: `Chuyển kho từ ${fromBranch.name} sang ${toBranch.name}`,
          },
        });
        transferCount++;
      }
      console.log(`   ✅ Đã tạo ${transferCount} inventory transfers\n`);
    } else {
      console.log(`   ℹ️  Đã có ${existingTransfers} inventory transfers trong DB\n`);
    }

    // 20. Seed Stock Takes
    console.log('2️⃣0️⃣ Seeding Stock Takes...');
    const existingStockTakes = await prisma.stockTake.count();
    let stockTakeCount = 0;

    if (existingStockTakes === 0) {
      const stockTakeStatuses = ['in_progress', 'completed', 'cancelled'];

      for (const branch of createdBranches) {
        const stockTakeNum = randomInt(1, 3);

        for (let i = 0; i < stockTakeNum; i++) {
          const status = randomElement(stockTakeStatuses);
          const branchStaff = createdStaff.filter(s => s.staff.branch_id === branch.id);
          const startedBy = branchStaff.length > 0 ? branchStaff[0].user.id : null;

          const startDate = randomDate(new Date('2024-06-01'), new Date());

          const stockTake = await prisma.stockTake.create({
            data: {
              branch_id: branch.id,
              stock_take_no: `ST${branch.id}${Date.now().toString().slice(-6)}${i}`,
              status,
              started_by: startedBy,
              completed_by: status === 'completed' ? startedBy : null,
              start_date: startDate,
              complete_date: status === 'completed' ? new Date(startDate.getTime() + 4 * 60 * 60 * 1000) : null,
              note: `Kiểm kê định kỳ tháng ${startDate.getMonth() + 1}/${startDate.getFullYear()}`,
            },
          });

          const branchInventory = createdInventory.filter(inv => inv.branch_id === branch.id).slice(0, 20);

          for (const inventory of branchInventory) {
            const systemQty = inventory.stock;
            const actualQty = status === 'in_progress' ? null : systemQty + randomInt(-5, 5);
            const variance = actualQty !== null ? actualQty - systemQty : null;
            const product = products.find(p => p.id === inventory.product_id);

            await prisma.stockTakeItem.create({
              data: {
                stock_take_id: stockTake.id,
                product_id: inventory.product_id,
                branch_id: branch.id,
                system_qty: systemQty,
                actual_qty: actualQty,
                variance: variance,
                variance_value: variance !== null && product ? variance * Number(product.price) : null,
                reason: variance !== null && variance !== 0 ? randomElement(['Hư hỏng', 'Mất mát', 'Lỗi nhập liệu', 'Hết hạn']) : null,
              },
            });
          }

          stockTakeCount++;
        }
      }
      console.log(`   ✅ Đã tạo ${stockTakeCount} stock takes\n`);
    } else {
      console.log(`   ℹ️  Đã có ${existingStockTakes} stock takes trong DB\n`);
    }

    // 21. Seed Inventory Logs - ✅ SKIP: Đã tạo trong step 16
    console.log('2️⃣1️⃣ Checking Inventory Logs...');
    const existingLogs = await prisma.inventoryLog.count();
    console.log(`   ℹ️  Đã có ${existingLogs} inventory logs trong DB (đã tạo từ orders)\n`);

    // ✅ NEW: 22. Reconcile inventory với batches
    console.log('2️⃣2️⃣ Reconciling Inventory with Batches...');
    let reconciledCount = 0;

    // Lấy lại inventory mới nhất từ DB
    const latestInventory = await prisma.branchinventory.findMany({
      take: 100,
    });

    for (const inventory of latestInventory) {
      // Tính tổng từ batches
      const batchSum = await prisma.productBatch.aggregate({
        where: {
          branch_id: inventory.branch_id,
          product_id: inventory.product_id,
          status: { in: ['active', 'expired'] },
        },
        _sum: { quantity: true },
      });

      const batchTotal = batchSum._sum.quantity || 0;
      const currentStock = inventory.stock || 0;

      // Nếu batch total > 0 và khác current stock, log warning
      if (batchTotal > 0 && Math.abs(batchTotal - currentStock) > 5) {
        console.log(`   ⚠️  Branch ${inventory.branch_id}, Product ${inventory.product_id}: inventory=${currentStock}, batches=${batchTotal}`);
        reconciledCount++;
      }
    }

    if (reconciledCount > 0) {
      console.log(`   ⚠️  Tìm thấy ${reconciledCount} inventory records cần kiểm tra\n`);
    } else {
      console.log(`   ✅ Inventory đồng bộ với batches\n`);
    }

    // Summary
    console.log('🎉 HOÀN THÀNH SEED DỮ LIỆU!\n');
    console.log('📊 Tổng kết số liệu trong database:');

    const counts = await Promise.all([
      prisma.roles.count(),
      prisma.cities.count(),
      prisma.suppliers.count(),
      prisma.branches.count(),
      prisma.staff.count(),
      prisma.customers.count(),
      prisma.shippingaddresses.count(),
      prisma.shipping_zones.count(),
      prisma.vouchers.count(),
      prisma.branchinventory.count(),
      prisma.productBatch.count(),
      prisma.supplierOrder.count(),
      prisma.orders.count(),
      prisma.payments.count(),
      prisma.shipments.count(),
      prisma.inventoryTransfer.count(),
      prisma.stockTake.count(),
      prisma.inventoryLog.count(),
    ]);

    console.log(`   - Roles: ${counts[0]}`);
    console.log(`   - Cities: ${counts[1]}`);
    console.log(`   - Suppliers: ${counts[2]}`);
    console.log(`   - Branches: ${counts[3]}`);
    console.log(`   - Staff: ${counts[4]}`);
    console.log(`   - Customers: ${counts[5]}`);
    console.log(`   - Shipping Addresses: ${counts[6]}`);
    console.log(`   - Shipping Zones: ${counts[7]}`);
    console.log(`   - Vouchers: ${counts[8]}`);
    console.log(`   - Branch Inventory: ${counts[9]}`);
    console.log(`   - Product Batches: ${counts[10]}`);
    console.log(`   - Supplier Orders: ${counts[11]}`);
    console.log(`   - Customer Orders: ${counts[12]}`);
    console.log(`   - Payments: ${counts[13]}`);
    console.log(`   - Shipments: ${counts[14]}`);
    console.log(`   - Inventory Transfers: ${counts[15]}`);
    console.log(`   - Stock Takes: ${counts[16]}`);
    console.log(`   - Inventory Logs: ${counts[17]}`);

    console.log('\n📝 Thông tin đăng nhập mẫu:');
    console.log('   Admin: admin / Password123!');
    console.log('   Staff: staff1 / Password123!');
    console.log('   Customer: customer1 / Password123!');

    console.log('\n✅ Đã fix các vấn đề trong Phase 1:');
    console.log('   - Orders giờ trừ inventory đúng branch');
    console.log('   - Shipments sử dụng đúng branch đã xuất kho');
    console.log('   - sold_count được cập nhật cho delivered orders');
    console.log('   - Inventory logs được tạo với reference_type và reference_id');

  } catch (error) {
    console.error('❌ Lỗi:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
