import prisma from '../src/config/db.js';

async function checkSchema() {
  try {
    console.log('=== Checking current database schema ===\n');
    
    // Check branches table
    const branches = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'branches' AND column_name IN ('city', 'city_id')
      ORDER BY column_name;
    `;
    console.log('Branches columns:', branches);
    
    // Check customers table
    const customers = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'customers' AND column_name IN ('city', 'city_id')
      ORDER BY column_name;
    `;
    console.log('Customers columns:', customers);
    
    // Check shippingaddresses table
    const shippingAddresses = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'shippingaddresses' AND column_name IN ('city', 'city_id')
      ORDER BY column_name;
    `;
    console.log('ShippingAddresses columns:', shippingAddresses);
    
    // Check if cities table exists
    const citiesTable = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'cities'
      );
    `;
    console.log('\nCities table exists:', citiesTable);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkSchema();
