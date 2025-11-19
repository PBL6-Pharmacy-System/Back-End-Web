import prisma from '../src/config/db.js';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigration() {
  try {
    console.log('🔧 Starting migration...\n');

    // Read the migration SQL file
    const migrationSQL = fs.readFileSync(
      join(__dirname, 'migrate_roles.sql'),
      'utf8'
    );

    console.log('📄 Executing migration SQL...');

    // Execute the migration SQL
    await prisma.$executeRawUnsafe(migrationSQL);

    console.log('\n✅ Migration completed successfully!\n');

    // Verify roles exist
    const roles = await prisma.roles.findMany();
    console.log('📊 Roles in database:');
    console.table(roles);

    // Check if tables exist
    const tables = await prisma.$queryRaw`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN ('roles', 'staff', 'admin')
      ORDER BY table_name;
    `;

    console.log('\n📋 Tables created:');
    console.table(tables);

    console.log('\n✅ Migration verification complete!');
    console.log('\nNext step: Run seeding script');
    console.log('   node scripts/seed.js\n');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);

    if (error.message.includes('does not exist')) {
      console.log('\n💡 Tip: The table rolepermissions might not exist yet.');
      console.log('   This is normal if you are setting up the database for the first time.');
      console.log('\n   Try running: npx prisma db push\n');
    }

    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runMigration();
