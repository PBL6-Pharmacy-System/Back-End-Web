import prisma from '../src/config/db.js';

async function implementCityTable() {
  try {
    console.log('=== Implementing City Table ===\n');
    
    // Step 1: Create cities table
    console.log('Step 1: Creating cities table...');
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS cities (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        code VARCHAR(20),
        region VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    console.log('✓ Cities table created\n');
    
    // Step 2: Extract unique cities from existing data
    console.log('Step 2: Extracting and inserting unique cities...');
    
    const uniqueCities = await prisma.$queryRaw`
      SELECT DISTINCT city 
      FROM (
        SELECT city FROM branches WHERE city IS NOT NULL AND city != ''
        UNION
        SELECT city FROM customers WHERE city IS NOT NULL AND city != ''
        UNION
        SELECT city FROM shippingaddresses WHERE city IS NOT NULL AND city != ''
      ) AS all_cities
      ORDER BY city;
    `;
    
    console.log(`Found ${uniqueCities.length} unique cities:`, uniqueCities.map(c => c.city));
    
    // Insert cities
    for (const cityRow of uniqueCities) {
      const cityName = cityRow.city.trim();
      if (cityName) {
        await prisma.$executeRaw`
          INSERT INTO cities (name)
          VALUES (${cityName})
          ON CONFLICT (name) DO NOTHING;
        `;
      }
    }
    console.log('✓ Cities inserted\n');
    
    // Step 3: Add city_id columns
    console.log('Step 3: Adding city_id columns...');
    
    await prisma.$executeRaw`
      ALTER TABLE branches ADD COLUMN IF NOT EXISTS city_id INTEGER;
    `;
    
    await prisma.$executeRaw`
      ALTER TABLE customers ADD COLUMN IF NOT EXISTS city_id INTEGER;
    `;
    
    await prisma.$executeRaw`
      ALTER TABLE shippingaddresses ADD COLUMN IF NOT EXISTS city_id INTEGER;
    `;
    
    console.log('✓ city_id columns added\n');
    
    // Step 4: Migrate existing data
    console.log('Step 4: Migrating existing city data to city_id...');
    
    // Update branches
    await prisma.$executeRaw`
      UPDATE branches b
      SET city_id = c.id
      FROM cities c
      WHERE b.city = c.name AND b.city_id IS NULL;
    `;
    
    // Update customers
    await prisma.$executeRaw`
      UPDATE customers cu
      SET city_id = c.id
      FROM cities c
      WHERE cu.city = c.name AND cu.city_id IS NULL;
    `;
    
    // Update shippingaddresses
    await prisma.$executeRaw`
      UPDATE shippingaddresses sa
      SET city_id = c.id
      FROM cities c
      WHERE sa.city = c.name AND sa.city_id IS NULL;
    `;
    
    console.log('✓ Data migrated\n');
    
    // Step 5: Add foreign key constraints
    console.log('Step 5: Adding foreign key constraints...');
    
    await prisma.$executeRaw`
      ALTER TABLE branches
      ADD CONSTRAINT fk_branches_city_id
      FOREIGN KEY (city_id) REFERENCES cities(id)
      ON DELETE SET NULL
      ON UPDATE CASCADE;
    `;
    
    await prisma.$executeRaw`
      ALTER TABLE customers
      ADD CONSTRAINT fk_customers_city_id
      FOREIGN KEY (city_id) REFERENCES cities(id)
      ON DELETE SET NULL
      ON UPDATE CASCADE;
    `;
    
    await prisma.$executeRaw`
      ALTER TABLE shippingaddresses
      ADD CONSTRAINT fk_shippingaddresses_city_id
      FOREIGN KEY (city_id) REFERENCES cities(id)
      ON DELETE SET NULL
      ON UPDATE CASCADE;
    `;
    
    console.log('✓ Foreign keys added\n');
    
    // Step 6: Create indexes
    console.log('Step 6: Creating indexes...');
    
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_branches_city_id ON branches(city_id);
    `;
    
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_customers_city_id ON customers(city_id);
    `;
    
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_shippingaddresses_city_id ON shippingaddresses(city_id);
    `;
    
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_cities_name ON cities(name);
    `;
    
    console.log('✓ Indexes created\n');
    
    // Verification
    console.log('=== Verification ===');
    const citiesCount = await prisma.$queryRaw`SELECT COUNT(*) FROM cities;`;
    console.log('Total cities:', citiesCount[0].count);
    
    const branchesWithCity = await prisma.$queryRaw`
      SELECT COUNT(*) FROM branches WHERE city_id IS NOT NULL;
    `;
    console.log('Branches with city_id:', branchesWithCity[0].count);
    
    const customersWithCity = await prisma.$queryRaw`
      SELECT COUNT(*) FROM customers WHERE city_id IS NOT NULL;
    `;
    console.log('Customers with city_id:', customersWithCity[0].count);
    
    const shippingWithCity = await prisma.$queryRaw`
      SELECT COUNT(*) FROM shippingaddresses WHERE city_id IS NOT NULL;
    `;
    console.log('ShippingAddresses with city_id:', shippingWithCity[0].count);
    
    console.log('\n✅ City table implementation completed successfully!');
    console.log('\n⚠️  Note: Old "city" (string) columns are kept for backward compatibility.');
    console.log('    You can optionally drop them later after testing.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

implementCityTable();
