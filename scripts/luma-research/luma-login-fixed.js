const puppeteer = require('puppeteer');
const fs = require('fs');

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function loginToLuma() {
  const email = 'admin@poap.fr';
  const password = '!q*g%@TP7w^q';
  
  console.log('🚀 Starting Luma login process...');
  
  const browser = await puppeteer.launch({
    headless: false, // Set to false to see what's happening
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  try {
    // Go to Luma login page
    console.log('📍 Navigating to Luma login page...');
    await page.goto('https://lu.ma/signin', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // Wait for email input
    console.log('📧 Entering email...');
    await page.waitForSelector('input[type="email"]', { visible: true });
    await page.type('input[type="email"]', email, { delay: 100 });
    
    // Click continue
    console.log('➡️ Clicking continue...');
    await page.click('button[type="submit"]');
    
    // Wait for navigation or password field
    await delay(3000);
    
    // Check if password field is present
    try {
      console.log('🔑 Looking for password field...');
      await page.waitForSelector('input[type="password"]', { visible: true, timeout: 5000 });
      
      console.log('🔑 Entering password...');
      await page.type('input[type="password"]', password, { delay: 100 });
      
      // Submit password
      console.log('🔐 Submitting login form...');
      await page.click('button[type="submit"]');
      
    } catch (e) {
      console.log('No password field found, might be using different auth method');
    }
    
    // Wait for navigation to complete
    console.log('⏳ Waiting for login to complete...');
    await delay(5000);
    
    // Get current URL
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);
    
    // Get all cookies
    const cookies = await page.cookies();
    console.log(`\nFound ${cookies.length} cookies`);
    
    // Find the auth session cookie
    const sessionCookie = cookies.find(cookie => 
      cookie.name === 'luma.auth-session-key'
    );
    
    if (sessionCookie) {
      console.log('\n✅ Found luma.auth-session-key!');
      const cookieString = `${sessionCookie.name}=${sessionCookie.value}`;
      
      // Save cookie info
      const cookieData = {
        cookie: cookieString,
        name: sessionCookie.name,
        value: sessionCookie.value,
        domain: sessionCookie.domain,
        path: sessionCookie.path,
        expires: sessionCookie.expires,
        httpOnly: sessionCookie.httpOnly,
        secure: sessionCookie.secure,
        obtained_at: new Date().toISOString()
      };
      
      fs.writeFileSync('luma-session-cookie.json', JSON.stringify(cookieData, null, 2));
      console.log('💾 Cookie saved to luma-session-cookie.json');
      
      // Test the cookie immediately
      await testCookieWithAPI(cookieString);
      
      // Also save cookie for use in bash script
      fs.writeFileSync('luma-cookie.txt', cookieString);
      console.log('📝 Cookie string saved to luma-cookie.txt');
      
      return cookieString;
    } else {
      console.log('\n❌ Could not find luma.auth-session-key');
      console.log('Available cookies:');
      cookies.forEach(cookie => {
        console.log(`- ${cookie.name}: ${cookie.value.substring(0, 30)}...`);
      });
    }
    
  } catch (error) {
    console.error('❌ Login error:', error.message);
  } finally {
    console.log('\nPress Ctrl+C to close the browser...');
    // Keep browser open for debugging
    // await browser.close();
  }
}

async function testCookieWithAPI(cookieString) {
  const fetch = require('node-fetch');
  
  console.log('\n🧪 Testing cookie with admin API...');
  
  const testEventId = 'evt-H2y5Rg51kDNxaDQ';
  
  try {
    // Test 1: Get event info
    console.log('\n1️⃣ Testing event info endpoint...');
    const eventResponse = await fetch(`https://api.lu.ma/event/admin/get?event_api_id=${testEventId}`, {
      headers: {
        'Cookie': cookieString,
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    });
    
    console.log('Event info status:', eventResponse.status);
    
    if (eventResponse.ok) {
      const eventData = await eventResponse.json();
      console.log('✅ Successfully retrieved event!');
      console.log('Event name:', eventData.event?.name);
      console.log('Start date:', eventData.event?.start_at);
      console.log('Hosts:', eventData.hosts?.map(h => h.name).join(', '));
      
      fs.writeFileSync('event-admin-data.json', JSON.stringify(eventData, null, 2));
    } else {
      console.log('❌ Failed to get event:', await eventResponse.text());
    }
    
    // Test 2: Get guests
    console.log('\n2️⃣ Testing guests endpoint...');
    const guestsResponse = await fetch(`https://api.lu.ma/event/admin/get-guests?event_api_id=${testEventId}`, {
      headers: {
        'Cookie': cookieString,
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    });
    
    console.log('Guests status:', guestsResponse.status);
    
    if (guestsResponse.ok) {
      const guestsData = await guestsResponse.json();
      console.log('✅ Successfully retrieved guests!');
      console.log('Total guests:', guestsData.entries?.length || 0);
      
      if (guestsData.entries && guestsData.entries.length > 0) {
        console.log('\nGuest list:');
        guestsData.entries.forEach(entry => {
          const guest = entry.guest;
          console.log(`- ${guest.name} (${guest.email}) - Checked in: ${guest.checked_in_at ? 'Yes' : 'No'}`);
        });
      }
      
      fs.writeFileSync('guests-admin-data.json', JSON.stringify(guestsData, null, 2));
    } else {
      console.log('❌ Failed to get guests:', await guestsResponse.text());
    }
    
  } catch (error) {
    console.error('API test error:', error.message);
  }
}

// Run the login
loginToLuma().catch(console.error);