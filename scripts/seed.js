import prisma from '../src/config/db.js';
import { hashPassword } from '../src/utils/helpers.js';

/**
 * Seed script to create sample data for user/role system
 * Run: node scripts/seed.js
 */

async function seed() {
  try {
    console.log('🌱 Starting database seeding...\n');

    // Check if roles exist
    const rolesCount = await prisma.roles.count();
    if (rolesCount === 0) {
      console.log('❌ Error: Roles table is empty. Please run migration first.');
      console.log('   Run: npx prisma db push OR execute scripts/migrate_roles.sql\n');
      process.exit(1);
    }

    console.log(`✅ Found ${rolesCount} roles in database\n`);

    // Common password for all test accounts
    const testPassword = 'password123';
    const hashedPassword = await hashPassword(testPassword);

    console.log('🔐 Test account credentials:');
    console.log(`   Username: [see below]`);
    console.log(`   Password: ${testPassword}\n`);

    // ==================== CREATE ADMIN USERS ====================
    console.log('👑 Creating Admin users...');

    const admin1 = await prisma.$transaction(async (tx) => {
      const user = await tx.users.create({
        data: {
          username: 'admin_test',
          email: 'admin_test@pharmacy.com',
          password_hash: hashedPassword,
          phone: '+84901111111',
          full_name: 'Nguyễn Văn Admin',
          role_id: 1,
          is_active: true,
          is_verified: true
        }
      });

      await tx.admin.create({
        data: {
          user_id: user.id,
          admin_level: 1,
          is_super_admin: true,
          permissions: {
            manage_users: true,
            manage_products: true,
            manage_orders: true,
            manage_branches: true,
            view_reports: true,
            manage_promotions: true
          },
          notes: 'Super Admin - Full system access'
        }
      });

      return tx.users.findUnique({
        where: { id: user.id },
        include: { role: true, admin: true }
      });
    });

    console.log(`   ✅ Created: ${admin1.username} (Super Admin)`);

    const admin2 = await prisma.$transaction(async (tx) => {
      const user = await tx.users.create({
        data: {
          username: 'moderator_test',
          email: 'moderator_test@pharmacy.com',
          password_hash: hashedPassword,
          phone: '+84901111112',
          full_name: 'Trần Thị Moderator',
          role_id: 1,
          is_active: true,
          is_verified: true
        }
      });

      await tx.admin.create({
        data: {
          user_id: user.id,
          admin_level: 3,
          is_super_admin: false,
          permissions: {
            manage_products: true,
            view_reports: true
          },
          notes: 'Moderator - Limited admin access'
        }
      });

      return tx.users.findUnique({
        where: { id: user.id },
        include: { role: true, admin: true }
      });
    });

    console.log(`   ✅ Created: ${admin2.username} (Moderator)\n`);

    // ==================== CREATE STAFF USERS ====================
    console.log('👨‍💼 Creating Staff users...');

    // Get first branch if exists
    const firstBranch = await prisma.branches.findFirst();
    const branchId = firstBranch?.id || null;

    if (!firstBranch) {
      console.log('   ⚠️  Warning: No branches found. Staff will be created without branch assignment.');
    }

    const staff1 = await prisma.$transaction(async (tx) => {
      const user = await tx.users.create({
        data: {
          username: 'pharmacist1',
          email: 'pharmacist1@pharmacy.com',
          password_hash: hashedPassword,
          phone: '+84902222221',
          full_name: 'Lê Văn Dược Sĩ',
          role_id: 2,
          is_active: true,
          is_verified: true
        }
      });

      await tx.staff.create({
        data: {
          user_id: user.id,
          employee_id: 'NV001',
          branch_id: branchId,
          position: 'Dược sĩ',
          department: 'Bán lẻ',
          hire_date: new Date('2023-01-15'),
          hometown: 'Hà Nội',
          id_number: '001234567890',
          emergency_contact: '+84987654321',
          emergency_name: 'Lê Thị Mẹ',
          salary: 15000000,
          bank_account: '1234567890',
          bank_name: 'Vietcombank',
          is_active: true,
          notes: 'Dược sĩ chính - Chi nhánh Hà Nội'
        }
      });

      return tx.users.findUnique({
        where: { id: user.id },
        include: { role: true, staff: { include: { branch: true } } }
      });
    });

    console.log(`   ✅ Created: ${staff1.username} (Dược sĩ - ${staff1.staff.employee_id})`);

    const staff2 = await prisma.$transaction(async (tx) => {
      const user = await tx.users.create({
        data: {
          username: 'cashier1',
          email: 'cashier1@pharmacy.com',
          password_hash: hashedPassword,
          phone: '+84902222222',
          full_name: 'Phạm Thị Thu Ngân',
          role_id: 2,
          is_active: true,
          is_verified: true
        }
      });

      await tx.staff.create({
        data: {
          user_id: user.id,
          employee_id: 'NV002',
          branch_id: branchId,
          position: 'Thu ngân',
          department: 'Bán lẻ',
          hire_date: new Date('2023-03-20'),
          hometown: 'Hồ Chí Minh',
          id_number: '001234567891',
          emergency_contact: '+84987654322',
          emergency_name: 'Phạm Văn Cha',
          salary: 10000000,
          bank_account: '9876543210',
          bank_name: 'Techcombank',
          is_active: true,
          notes: 'Thu ngân ca sáng'
        }
      });

      return tx.users.findUnique({
        where: { id: user.id },
        include: { role: true, staff: { include: { branch: true } } }
      });
    });

    console.log(`   ✅ Created: ${staff2.username} (Thu ngân - ${staff2.staff.employee_id})`);

    const staff3 = await prisma.$transaction(async (tx) => {
      const user = await tx.users.create({
        data: {
          username: 'warehouse1',
          email: 'warehouse1@pharmacy.com',
          password_hash: hashedPassword,
          phone: '+84902222223',
          full_name: 'Hoàng Văn Kho',
          role_id: 2,
          is_active: true,
          is_verified: true
        }
      });

      await tx.staff.create({
        data: {
          user_id: user.id,
          employee_id: 'NV003',
          branch_id: branchId,
          position: 'Quản lý kho',
          department: 'Kho',
          hire_date: new Date('2022-11-01'),
          hometown: 'Đà Nẵng',
          id_number: '001234567892',
          emergency_contact: '+84987654323',
          emergency_name: 'Hoàng Thị Vợ',
          salary: 12000000,
          bank_account: '5555555555',
          bank_name: 'ACB',
          is_active: true,
          notes: 'Quản lý kho chính'
        }
      });

      return tx.users.findUnique({
        where: { id: user.id },
        include: { role: true, staff: { include: { branch: true } } }
      });
    });

    console.log(`   ✅ Created: ${staff3.username} (Quản lý kho - ${staff3.staff.employee_id})\n`);

    // ==================== CREATE CUSTOMER USERS ====================
    console.log('👥 Creating Customer users...');

    const customer1 = await prisma.$transaction(async (tx) => {
      const user = await tx.users.create({
        data: {
          username: 'customer1',
          email: 'customer1@example.com',
          password_hash: hashedPassword,
          phone: '+84903333331',
          full_name: 'Nguyễn Thị Khách Hàng',
          role_id: 3,
          is_active: true,
          is_verified: true
        }
      });

      await tx.customers.create({
        data: {
          user_id: user.id,
          dob: new Date('1990-05-15'),
          gender: 'female',
          address: '123 Đường Lê Lợi, Quận 1, TP.HCM'
        }
      });

      return tx.users.findUnique({
        where: { id: user.id },
        include: { role: true, customer: true }
      });
    });

    console.log(`   ✅ Created: ${customer1.username} (${customer1.customer.gender})`);

    const customer2 = await prisma.$transaction(async (tx) => {
      const user = await tx.users.create({
        data: {
          username: 'customer2',
          email: 'customer2@example.com',
          password_hash: hashedPassword,
          phone: '+84903333332',
          full_name: 'Trần Văn Mua Hàng',
          role_id: 3,
          is_active: true,
          is_verified: true
        }
      });

      await tx.customers.create({
        data: {
          user_id: user.id,
          dob: new Date('1985-12-20'),
          gender: 'male',
          address: '456 Đường Trần Hưng Đạo, Quận 5, TP.HCM'
        }
      });

      return tx.users.findUnique({
        where: { id: user.id },
        include: { role: true, customer: true }
      });
    });

    console.log(`   ✅ Created: ${customer2.username} (${customer2.customer.gender})`);

    const customer3 = await prisma.$transaction(async (tx) => {
      const user = await tx.users.create({
        data: {
          username: 'customer3',
          email: 'customer3@example.com',
          password_hash: hashedPassword,
          phone: '+84903333333',
          full_name: 'Lê Thị Thường Xuyên',
          role_id: 3,
          is_active: true,
          is_verified: true
        }
      });

      await tx.customers.create({
        data: {
          user_id: user.id,
          dob: new Date('1995-08-10'),
          gender: 'female',
          address: '789 Đường Nguyễn Huệ, Quận 1, TP.HCM'
        }
      });

      return tx.users.findUnique({
        where: { id: user.id },
        include: { role: true, customer: true }
      });
    });

    console.log(`   ✅ Created: ${customer3.username} (${customer3.customer.gender})`);

    const customer4 = await prisma.$transaction(async (tx) => {
      const user = await tx.users.create({
        data: {
          username: 'vip_customer',
          email: 'vip@example.com',
          password_hash: hashedPassword,
          phone: '+84903333334',
          full_name: 'Phạm Văn VIP',
          role_id: 3,
          is_active: true,
          is_verified: true
        }
      });

      await tx.customers.create({
        data: {
          user_id: user.id,
          dob: new Date('1980-03-25'),
          gender: 'male',
          address: '321 Đường Pasteur, Quận 3, TP.HCM'
        }
      });

      return tx.users.findUnique({
        where: { id: user.id },
        include: { role: true, customer: true }
      });
    });

    console.log(`   ✅ Created: ${customer4.username} (VIP customer)\n`);

    // ==================== SUMMARY ====================
    console.log('📊 Seeding Summary:');
    console.log('   ✅ 2 Admin users created');
    console.log('   ✅ 3 Staff users created');
    console.log('   ✅ 4 Customer users created');
    console.log('   ✅ Total: 9 users\n');

    console.log('🔑 Login Credentials:');
    console.log('┌──────────────────┬─────────────────────────────────┬──────────────┐');
    console.log('│ Username         │ Email                           │ Role         │');
    console.log('├──────────────────┼─────────────────────────────────┼──────────────┤');
    console.log('│ admin_test       │ admin_test@pharmacy.com         │ Super Admin  │');
    console.log('│ moderator_test   │ moderator_test@pharmacy.com     │ Moderator    │');
    console.log('│ pharmacist1      │ pharmacist1@pharmacy.com        │ Dược sĩ      │');
    console.log('│ cashier1         │ cashier1@pharmacy.com           │ Thu ngân     │');
    console.log('│ warehouse1       │ warehouse1@pharmacy.com         │ Quản lý kho  │');
    console.log('│ customer1        │ customer1@example.com           │ Customer     │');
    console.log('│ customer2        │ customer2@example.com           │ Customer     │');
    console.log('│ customer3        │ customer3@example.com           │ Customer     │');
    console.log('│ vip_customer     │ vip@example.com                 │ VIP Customer │');
    console.log('└──────────────────┴─────────────────────────────────┴──────────────┘');
    console.log(`\n🔐 Password for all accounts: ${testPassword}\n`);

    console.log('✅ Database seeding completed successfully!\n');

  } catch (error) {
    console.error('❌ Seeding failed:', error);

    if (error.code === 'P2002') {
      console.log('\n⚠️  Some users already exist. Please delete existing test users first or modify usernames in seed script.\n');
    }

    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run seeding
seed();
