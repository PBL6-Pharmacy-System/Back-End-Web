import prisma from '../src/config/db.js';

async function cleanTestUsers() {
  try {
    console.log('🧹 Cleaning test users...\n');

    // List of test usernames to delete
    const testUsernames = [
      'admin',
      'admin_test',
      'moderator',
      'moderator_test',
      'pharmacist1',
      'cashier1',
      'warehouse1',
      'customer1',
      'customer2',
      'customer3',
      'vip_customer'
    ];

    // Find existing test users
    const existingUsers = await prisma.users.findMany({
      where: {
        username: {
          in: testUsernames
        }
      },
      select: {
        id: true,
        username: true,
        email: true,
        role_id: true
      }
    });

    if (existingUsers.length === 0) {
      console.log('✅ No test users found. Database is clean.');
      console.log('\nYou can now run: node scripts/seed.js\n');
      return;
    }

    console.log(`Found ${existingUsers.length} test users:`);
    console.table(existingUsers);

    console.log('\n🗑️  Deleting test users...');

    // Delete users (will cascade to admin, staff, customers due to ON DELETE CASCADE)
    const deleteResult = await prisma.users.deleteMany({
      where: {
        username: {
          in: testUsernames
        }
      }
    });

    console.log(`\n✅ Deleted ${deleteResult.count} test users`);
    console.log('\nYou can now run: node scripts/seed.js\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

cleanTestUsers();
