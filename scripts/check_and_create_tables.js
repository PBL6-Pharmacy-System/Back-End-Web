import prisma from '../src/config/db.js';

async function checkAndCreateTables() {
  try {
    console.log('🔍 Checking database tables...\n');

    // Check which tables exist
    const tables = await prisma.$queryRaw`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN ('roles', 'staff', 'admin', 'users', 'customers', 'branches');
    `;

    console.log('📋 Existing tables:');
    console.table(tables);

    const tableNames = tables.map(t => t.table_name);
    const hasStaff = tableNames.includes('staff');
    const hasAdmin = tableNames.includes('admin');

    if (!hasStaff) {
      console.log('\n⚠️  Creating staff table...');
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS staff (
          id SERIAL PRIMARY KEY,
          user_id INTEGER UNIQUE NOT NULL,
          employee_id VARCHAR(50) UNIQUE,
          branch_id INTEGER,
          position VARCHAR(100),
          department VARCHAR(100),
          hire_date DATE,
          hometown VARCHAR(255),
          id_number VARCHAR(50),
          emergency_contact VARCHAR(20),
          emergency_name VARCHAR(255),
          salary DECIMAL(12, 2),
          bank_account VARCHAR(50),
          bank_name VARCHAR(100),
          is_active BOOLEAN DEFAULT true,
          notes TEXT,
          created_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

          CONSTRAINT fk_staff_user FOREIGN KEY (user_id)
            REFERENCES users(id) ON DELETE CASCADE,
          CONSTRAINT fk_staff_branch FOREIGN KEY (branch_id)
            REFERENCES branches(id) ON DELETE SET NULL
        );
      `;
      console.log('✅ Staff table created');

      // Create indexes
      await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_staff_user_id ON staff(user_id);`;
      await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_staff_branch_id ON staff(branch_id);`;
      await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_staff_employee_id ON staff(employee_id);`;
      console.log('✅ Staff indexes created');
    }

    if (!hasAdmin) {
      console.log('\n⚠️  Creating admin table...');
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS admin (
          id SERIAL PRIMARY KEY,
          user_id INTEGER UNIQUE NOT NULL,
          admin_level INTEGER DEFAULT 1,
          permissions JSON,
          last_activity TIMESTAMP(6),
          is_super_admin BOOLEAN DEFAULT false,
          notes TEXT,
          created_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

          CONSTRAINT fk_admin_user FOREIGN KEY (user_id)
            REFERENCES users(id) ON DELETE CASCADE
        );
      `;
      console.log('✅ Admin table created');

      // Create indexes
      await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_admin_user_id ON admin(user_id);`;
      await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_admin_level ON admin(admin_level);`;
      console.log('✅ Admin indexes created');
    }

    if (hasStaff && hasAdmin) {
      console.log('\n✅ All required tables already exist!');
    }

    // Create update trigger if not exists
    await prisma.$executeRaw`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
      END;
      $$ language 'plpgsql';
    `;

    if (!hasStaff) {
      await prisma.$executeRaw`
        DROP TRIGGER IF EXISTS update_staff_updated_at ON staff;
        CREATE TRIGGER update_staff_updated_at
            BEFORE UPDATE ON staff
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
      `;
    }

    if (!hasAdmin) {
      await prisma.$executeRaw`
        DROP TRIGGER IF EXISTS update_admin_updated_at ON admin;
        CREATE TRIGGER update_admin_updated_at
            BEFORE UPDATE ON admin
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
      `;
    }

    // Verify final state
    const finalTables = await prisma.$queryRaw`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN ('roles', 'staff', 'admin')
      ORDER BY table_name;
    `;

    console.log('\n📊 Final table status:');
    console.table(finalTables);

    console.log('\n✅ Database schema is ready!');
    console.log('\nNext step: Run seeding script');
    console.log('   node scripts/seed.js\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkAndCreateTables();
