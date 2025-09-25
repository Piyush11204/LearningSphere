const { sendVerificationEmail } = require('./utils/emailTemplates');

async function testEmail() {
  try {
    console.log('Testing email function...');
    await sendVerificationEmail('test@example.com', 'https://learningsphere-1fgj.onrender.com/verify/test123');
    console.log('Email function test completed successfully!');
  } catch (error) {
    console.error('Email function test failed:', error);
  }
}

testEmail();