import { login } from '../src/modules/auth/authService.js';

async function testAuth() {
  console.log('🔐 Testing Authentication...\n');

  // Test 1: Admin Login
  console.log('Test 1: Admin Login');
  console.log('==================');
  const adminResult = await login({
    username: 'admin_test',
    password: 'password123'
  });

  if (adminResult.success) {
    console.log('✅ Admin login successful!');
    console.log('   User ID:', adminResult.data.user.id);
    console.log('   Username:', adminResult.data.user.username);
    console.log('   Role:', adminResult.data.user.role.role_name);
    console.log('   Admin Level:', adminResult.data.user.admin.admin_level);
    console.log('   Is Super Admin:', adminResult.data.user.admin.is_super_admin);
    console.log('   Token:', adminResult.data.token.substring(0, 50) + '...');
  } else {
    console.log('❌ Admin login failed:', adminResult.error);
  }

  // Test 2: Staff Login
  console.log('\nTest 2: Staff Login');
  console.log('==================');
  const staffResult = await login({
    username: 'pharmacist1',
    password: 'password123'
  });

  if (staffResult.success) {
    console.log('✅ Staff login successful!');
    console.log('   User ID:', staffResult.data.user.id);
    console.log('   Username:', staffResult.data.user.username);
    console.log('   Role:', staffResult.data.user.role.role_name);
    console.log('   Employee ID:', staffResult.data.user.staff.employee_id);
    console.log('   Position:', staffResult.data.user.staff.position);
    console.log('   Salary:', staffResult.data.user.staff.salary.toLocaleString(), 'VND');
    console.log('   Token:', staffResult.data.token.substring(0, 50) + '...');
  } else {
    console.log('❌ Staff login failed:', staffResult.error);
  }

  // Test 3: Customer Login
  console.log('\nTest 3: Customer Login');
  console.log('==================');
  const customerResult = await login({
    username: 'customer1',
    password: 'password123'
  });

  if (customerResult.success) {
    console.log('✅ Customer login successful!');
    console.log('   User ID:', customerResult.data.user.id);
    console.log('   Username:', customerResult.data.user.username);
    console.log('   Role:', customerResult.data.user.role.role_name);
    console.log('   Gender:', customerResult.data.user.customer.gender);
    console.log('   Address:', customerResult.data.user.customer.address);
    console.log('   Token:', customerResult.data.token.substring(0, 50) + '...');
  } else {
    console.log('❌ Customer login failed:', customerResult.error);
  }

  // Test 4: Invalid Password
  console.log('\nTest 4: Invalid Password');
  console.log('==================');
  const invalidResult = await login({
    username: 'admin_test',
    password: 'wrongpassword'
  });

  if (!invalidResult.success) {
    console.log('✅ Correctly rejected invalid password');
    console.log('   Error:', invalidResult.error);
  } else {
    console.log('❌ Should have rejected invalid password!');
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 Test Summary:');
  console.log('='.repeat(50));
  console.log(`✅ Admin Login: ${adminResult.success ? 'PASS' : 'FAIL'}`);
  console.log(`✅ Staff Login: ${staffResult.success ? 'PASS' : 'FAIL'}`);
  console.log(`✅ Customer Login: ${customerResult.success ? 'PASS' : 'FAIL'}`);
  console.log(`✅ Invalid Password: ${!invalidResult.success ? 'PASS' : 'FAIL'}`);
  console.log('='.repeat(50));

  process.exit(0);
}

testAuth();
