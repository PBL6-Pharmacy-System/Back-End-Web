import prisma from '../src/config/db.js';

async function insertDefaultRoles() {
  try {
    console.log('🔧 Inserting default roles...\n');

    // Check if rolepermissions table exists
    const tableCheck = await prisma.$queryRaw`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN ('roles', 'rolepermissions');
    `;

    console.log('📋 Existing tables:', tableCheck);

    // If rolepermissions exists but roles doesn't, we need to rename it
    const hasRolePermissions = tableCheck.some(t => t.table_name === 'rolepermissions');
    const hasRoles = tableCheck.some(t => t.table_name === 'roles');

    if (hasRolePermissions && !hasRoles) {
      console.log('\n⚠️  Found rolepermissions table, renaming to roles...');
      await prisma.$executeRaw`ALTER TABLE rolepermissions RENAME TO roles;`;
      console.log('✅ Renamed rolepermissions to roles');
    }

    if (!hasRoles && !hasRolePermissions) {
      console.log('\n❌ Error: Neither roles nor rolepermissions table exists!');
      console.log('   Please run: npx prisma db push\n');
      process.exit(1);
    }

    // Add description column if it doesn't exist
    try {
      await prisma.$executeRaw`ALTER TABLE roles ADD COLUMN IF NOT EXISTS description TEXT;`;
      console.log('✅ Added description column to roles table');
    } catch (error) {
      console.log('ℹ️  Description column already exists');
    }

    // Insert default roles using Prisma upsert
    const adminRole = await prisma.roles.upsert({
      where: { role_name: 'admin' },
      update: { description: 'Administrator with full system access' },
      create: {
        role_name: 'admin',
        description: 'Administrator with full system access'
      }
    });

    const staffRole = await prisma.roles.upsert({
      where: { role_name: 'staff' },
      update: { description: 'Staff member with limited access' },
      create: {
        role_name: 'staff',
        description: 'Staff member with limited access'
      }
    });

    const customerRole = await prisma.roles.upsert({
      where: { role_name: 'customer' },
      update: { description: 'Customer with basic access' },
      create: {
        role_name: 'customer',
        description: 'Customer with basic access'
      }
    });

    console.log('\n✅ Default roles inserted/updated:');
    console.table([adminRole, staffRole, customerRole]);

    console.log('\n✅ Roles setup complete!');
    console.log('\nNext step: Run seeding script');
    console.log('   node scripts/seed.js\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);

    if (error.code === 'P2021') {
      console.log('\n💡 The table "roles" does not exist.');
      console.log('   You need to run the migration first.');
      console.log('\n   Option 1: Run on Supabase Dashboard');
      console.log('   - Copy content from scripts/migrate_roles.sql');
      console.log('   - Execute in SQL Editor');
      console.log('\n   Option 2: Push Prisma schema');
      console.log('   - Run: npx prisma db push\n');
    }

    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

insertDefaultRoles();
