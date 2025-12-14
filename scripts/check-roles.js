import prisma from '../src/config/db.js';

async function checkRoles() {
  try {
    console.log('🔍 Checking roles in database...\n');
    
    const roles = await prisma.roles.findMany({
      orderBy: { id: 'asc' }
    });
    
    console.log('📋 Found roles:', roles.length);
    roles.forEach(role => {
      console.log(`  - ID: ${role.id}, Name: ${role.role_name}, Description: ${role.description || 'N/A'}`);
    });
    
    // Check if customer role exists
    const customerRole = roles.find(r => r.id === 3 || r.role_name.toLowerCase() === 'customer');
    
    if (!customerRole) {
      console.log('\n⚠️ Customer role (id=3) NOT FOUND!');
      console.log('Creating customer role...');
      
      const newRole = await prisma.roles.create({
        data: {
          id: 3,
          role_name: 'customer',
          description: 'Customer role for registered users'
        }
      });
      
      console.log('✅ Customer role created:', newRole);
    } else {
      console.log('\n✅ Customer role exists:', customerRole);
    }
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

checkRoles();
