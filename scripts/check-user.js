import prisma from '../src/config/db.js';

async function checkUser() {
  try {
    const email = 'nguyenthanhjkluio@gmail.com';
    
    console.log('🔍 Checking user:', email, '\n');
    
    const user = await prisma.users.findFirst({
      where: {
        OR: [
          { email: email },
          { username: email }
        ]
      },
      include: {
        roles: true,
        customers: true
      }
    });
    
    if (!user) {
      console.log('❌ User NOT found');
    } else {
      console.log('✅ User found:');
      console.log('  - ID:', user.id);
      console.log('  - Username:', user.username);
      console.log('  - Email:', user.email);
      console.log('  - Role ID:', user.role_id);
      console.log('  - Role Name:', user.roles?.role_name);
      console.log('  - Has Customer Record:', !!user.customers);
      if (user.customers) {
        console.log('  - Customer ID:', user.customers.id);
      }
    }
    
    console.log('\n🔍 Checking OTP records for this email...');
    const otps = await prisma.otp_verifications.findMany({
      where: { email: email },
      orderBy: { created_at: 'desc' },
      take: 5
    });
    
    console.log('📋 Found', otps.length, 'OTP records:');
    otps.forEach((otp, i) => {
      console.log(`  ${i+1}. OTP: ${otp.otp_code}, Verified: ${otp.verified}, Expires: ${otp.expires_at}, Created: ${otp.created_at}`);
    });
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

checkUser();
