const puppeteer = require('puppeteer');

async function loginToLuma() {
  const email = 'admin@poap.fr';
  const password = '!q*g%@TP7w^q';
  
  console.log('🚀 Starting Luma login process...');
  
  const browser = await puppeteer.launch({
    headless: false, // Set to true in production
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  try {
    // Go to Luma login page
    console.log('📍 Navigating to Luma login page...');
    await page.goto('https://lu.ma/signin', { waitUntil: 'networkidle2' });
    
    // Wait for and fill email field
    console.log('📧 Entering email...');
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await page.type('input[type="email"]', email);
    
    // Click continue/next button
    console.log('➡️ Clicking continue...');
    await page.click('button[type="submit"]');
    
    // Wait for password field
    console.log('🔑 Waiting for password field...');
    await page.waitForSelector('input[type="password"]', { visible: true, timeout: 10000 });
    await page.type('input[type="password"]', password);
    
    // Submit login form
    console.log('🔐 Submitting login...');
    await page.click('button[type="submit"]');
    
    // Wait for navigation to complete
    console.log('⏳ Waiting for login to complete...');
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    
    // Get all cookies
    const cookies = await page.cookies();
    
    // Find the auth session cookie
    const authCookie = cookies.find(cookie => 
      cookie.name === 'luma.auth-session-key' || 
      cookie.name.includes('auth') ||
      cookie.name.includes('session')
    );
    
    if (authCookie) {
      console.log('✅ Auth cookie found!');
      console.log(`Cookie: ${authCookie.name}=${authCookie.value}`);
      
      // Save cookie details
      const cookieData = {
        name: authCookie.name,
        value: authCookie.value,
        domain: authCookie.domain,
        expires: authCookie.expires,
        obtained_at: new Date().toISOString()
      };
      
      const fs = require('fs');
      fs.writeFileSync('luma-cookie.json', JSON.stringify(cookieData, null, 2));
      console.log('💾 Cookie saved to luma-cookie.json');
      
      // Test the cookie
      console.log('\n🧪 Testing cookie with admin API...');
      await testCookie(authCookie);
      
    } else {
      console.log('❌ No auth cookie found');
      console.log('All cookies:', cookies.map(c => c.name));
    }
    
  } catch (error) {
    console.error('❌ Login error:', error);
  } finally {
    await browser.close();
  }
}

async function testCookie(authCookie) {
  const fetch = require('node-fetch');
  
  const testEventId = 'evt-H2y5Rg51kDNxaDQ';
  const cookieString = `${authCookie.name}=${authCookie.value}`;
  
  try {
    const response = await fetch(`https://api.lu.ma/event/admin/get?event_api_id=${testEventId}`, {
      headers: {
        'Cookie': cookieString,
        'Accept': 'application/json'
      }
    });
    
    console.log('Test response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Cookie works! Event name:', data.event?.name);
    } else {
      const error = await response.text();
      console.log('❌ Cookie test failed:', error);
    }
  } catch (error) {
    console.error('Test error:', error);
  }
}

// Check if puppeteer is installed
try {
  require.resolve('puppeteer');
  loginToLuma();
} catch (e) {
  console.log('Installing dependencies...');
  const { execSync } = require('child_process');
  execSync('npm install puppeteer node-fetch', { stdio: 'inherit' });
  console.log('Dependencies installed. Please run the script again.');
}