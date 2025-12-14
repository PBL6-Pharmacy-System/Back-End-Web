// Test login with email OTP
const BASE_URL = 'http://localhost:3000/api';
const TEST_EMAIL = 'nguyenthanhjkluio@gmail.com';

async function testOTPLogin() {
  try {
    console.log('🧪 Testing OTP Login Flow\n');
    
    // Step 1: Request OTP
    console.log('📧 Step 1: Requesting OTP for', TEST_EMAIL);
    const otpResponse = await fetch(`${BASE_URL}/auth/otp/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: TEST_EMAIL })
    });
    
    const otpData = await otpResponse.json();
    console.log('OTP Response:', otpData);
    
    if (!otpData.success) {
      console.error('❌ Failed to request OTP:', otpData.error);
      return;
    }
    
    console.log('✅ OTP sent successfully!');
    
    // Step 2: Get OTP from user
    const otp = process.argv[2];
    if (!otp) {
      console.log('\n⚠️ Please run: node test-otp-login.js <OTP_CODE>');
      console.log('   Check your email for the OTP code');
      return;
    }
    
    console.log('\n🔐 Step 2: Logging in with OTP:', otp);
    const loginResponse = await fetch(`${BASE_URL}/auth/customer/login-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        email: TEST_EMAIL,
        otp: otp 
      })
    });
    
    const loginData = await loginResponse.json();
    console.log('Login Response Status:', loginResponse.status);
    console.log('Login Response:', JSON.stringify(loginData, null, 2));
    
    if (!loginData.success) {
      console.error('❌ Login failed:', loginData.error);
      return;
    }
    
    console.log('\n✅ Login successful!');
    console.log('Token:', loginData.data.token?.substring(0, 20) + '...');
    console.log('User:', loginData.data.user?.email);
    console.log('Customer ID:', loginData.data.user?.customer_id);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testOTPLogin();
