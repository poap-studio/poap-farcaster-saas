const puppeteer = require('puppeteer');
const fs = require('fs');

async function loginToLuma() {
  const email = 'admin@poap.fr';
  const password = '!q*g%@TP7w^q';
  
  console.log('🚀 Starting Luma login process...');
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Set user agent to avoid detection
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  
  try {
    // Go to Luma login page
    console.log('📍 Navigating to Luma login page...');
    await page.goto('https://lu.ma/signin', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // Take screenshot for debugging
    await page.screenshot({ path: 'login-page.png' });
    
    // Wait for email input
    console.log('📧 Looking for email input...');
    
    // Try different selectors
    const emailSelectors = [
      'input[type="email"]',
      'input[name="email"]',
      'input[placeholder*="email" i]',
      '#email',
      'input[autocomplete="email"]'
    ];
    
    let emailInput = null;
    for (const selector of emailSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 5000 });
        emailInput = selector;
        console.log(`Found email input with selector: ${selector}`);
        break;
      } catch (e) {
        continue;
      }
    }
    
    if (!emailInput) {
      throw new Error('Could not find email input');
    }
    
    // Type email
    await page.type(emailInput, email, { delay: 100 });
    
    // Find and click continue button
    console.log('➡️ Looking for continue button...');
    const buttonSelectors = [
      'button[type="submit"]',
      'button:has-text("Continue")',
      'button:has-text("Next")',
      'button:has-text("Sign in")'
    ];
    
    for (const selector of buttonSelectors) {
      try {
        await page.click(selector);
        console.log(`Clicked button with selector: ${selector}`);
        break;
      } catch (e) {
        continue;
      }
    }
    
    // Wait for password field or navigation
    console.log('🔑 Waiting for password field...');
    await page.waitForTimeout(2000);
    
    // Look for password field
    const passwordSelectors = [
      'input[type="password"]',
      'input[name="password"]',
      'input[placeholder*="password" i]',
      '#password'
    ];
    
    let passwordInput = null;
    for (const selector of passwordSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 5000 });
        passwordInput = selector;
        console.log(`Found password input with selector: ${selector}`);
        break;
      } catch (e) {
        continue;
      }
    }
    
    if (passwordInput) {
      await page.type(passwordInput, password, { delay: 100 });
      
      // Submit password
      console.log('🔐 Submitting password...');
      await page.keyboard.press('Enter');
    }
    
    // Wait for navigation
    console.log('⏳ Waiting for login to complete...');
    await page.waitForTimeout(5000);
    
    // Get all cookies
    const cookies = await page.cookies();
    console.log(`\nFound ${cookies.length} cookies`);
    
    // Find auth cookies
    const authCookies = cookies.filter(cookie => 
      cookie.name.includes('auth') || 
      cookie.name.includes('session') ||
      cookie.name.includes('luma')
    );
    
    console.log('\nAuth-related cookies:');
    authCookies.forEach(cookie => {
      console.log(`- ${cookie.name}: ${cookie.value.substring(0, 50)}...`);
    });
    
    // Look for the specific auth session key
    const sessionCookie = cookies.find(cookie => 
      cookie.name === 'luma.auth-session-key'
    );
    
    if (sessionCookie) {
      console.log('\n✅ Found luma.auth-session-key!');
      const cookieString = `${sessionCookie.name}=${sessionCookie.value}`;
      
      // Save to file
      const cookieData = {
        cookie: cookieString,
        name: sessionCookie.name,
        value: sessionCookie.value,
        expires: sessionCookie.expires,
        obtained_at: new Date().toISOString()
      };
      
      fs.writeFileSync('luma-session-cookie.json', JSON.stringify(cookieData, null, 2));
      console.log('💾 Cookie saved to luma-session-cookie.json');
      
      // Test the cookie
      await testCookie(cookieString);
      
      return cookieString;
    } else {
      console.log('\n❌ Could not find luma.auth-session-key');
      console.log('All cookie names:', cookies.map(c => c.name));
      
      // Save page HTML for debugging
      const html = await page.content();
      fs.writeFileSync('login-result.html', html);
      console.log('Page HTML saved to login-result.html for debugging');
    }
    
  } catch (error) {
    console.error('❌ Login error:', error.message);
    
    // Take error screenshot
    await page.screenshot({ path: 'error-screenshot.png' });
    console.log('Error screenshot saved to error-screenshot.png');
  } finally {
    await browser.close();
  }
}

async function testCookie(cookieString) {
  try {
    console.log('\n🧪 Testing cookie with admin API...');
    
    const fetch = require('node-fetch');
    const testEventId = 'evt-H2y5Rg51kDNxaDQ';
    
    const response = await fetch(`https://api.lu.ma/event/admin/get?event_api_id=${testEventId}`, {
      headers: {
        'Cookie': cookieString,
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    });
    
    console.log('Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Cookie works!');
      console.log('Event name:', data.event?.name);
      console.log('Event date:', data.event?.start_at);
      
      // Save event data
      fs.writeFileSync('test-event-data.json', JSON.stringify(data, null, 2));
    } else {
      const error = await response.text();
      console.log('❌ Cookie test failed:', error);
    }
  } catch (error) {
    console.error('Test error:', error.message);
  }
}

// Run the login
loginToLuma().catch(console.error);