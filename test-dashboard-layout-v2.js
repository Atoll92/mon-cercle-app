import { chromium } from 'playwright';
import { mkdir } from 'fs/promises';

async function testDashboardLayout() {
  console.log('🧪 TESTING DASHBOARD LAYOUT FOR NON-ADMIN MEMBERS - V2');
  console.log('📸 Testing if Profile Card and Upcoming Events Card are side by side');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000,
    devtools: true // Enable devtools for inspection
  });
  
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1
  });
  
  const page = await context.newPage();
  
  try {
    // Ensure screenshots directory exists
    await mkdir('screenshots/layout-test', { recursive: true });
    
    console.log('🔐 Step 1: Authenticating...');
    // Navigate to login
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    // Check if already on login page or needs navigation
    const loginForm = await page.$('input[name="email"], input[type="email"]');
    if (!loginForm) {
      const loginBtn = await page.$('button:has-text("Login"), a:has-text("Login"), button:has-text("Sign In"), a:has-text("Sign In")');
      if (loginBtn) {
        await loginBtn.click();
        await page.waitForTimeout(2000);
      }
    }
    
    // Fill credentials
    await page.waitForSelector('input[name="email"]', { timeout: 10000 });
    await page.fill('input[name="email"]', 'arthur.boval@gmail.com');
    await page.fill('input[type="password"]', 'testetest');
    await page.click('button:has-text("SIGN IN")');
    
    // Wait for authentication
    await page.waitForTimeout(5000);
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    
    console.log('✅ Authentication successful');
    
    console.log('🌐 Step 2: Selecting Boost Club Network...');
    // Navigate to network selection if not already there
    if (!page.url().includes('/network')) {
      await page.goto('http://localhost:5173/network', { waitUntil: 'networkidle' });
    }
    await page.waitForTimeout(3000);
    
    // Look for Boost Club specifically
    const networkCards = await page.$$('.network-card, [data-testid="network-card"], .MuiCard-root');
    console.log(`Found ${networkCards.length} networks`);
    
    let boostClubFound = false;
    for (const card of networkCards) {
      const text = await card.textContent();
      if (text && text.toLowerCase().includes('boost')) {
        console.log('🎯 Found Boost Club network');
        await card.click();
        await page.waitForTimeout(2000);
        boostClubFound = true;
        break;
      }
    }
    
    if (!boostClubFound && networkCards.length > 0) {
      console.log('⚠️ Boost Club not found, using first available network');
      await networkCards[0].click();
      await page.waitForTimeout(2000);
    }
    
    // Continue/Enter network
    const continueBtn = await page.$('button:has-text("CONTINUE"), button:has-text("Continue"), button:has-text("Enter"), button:has-text("JOIN")');
    if (continueBtn) {
      await continueBtn.click();
      await page.waitForTimeout(5000);
    }
    
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    console.log('✅ Successfully entered network');
    
    console.log('📊 Step 3: Navigating to Dashboard...');
    // Navigate to dashboard
    await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle' });
    await page.waitForTimeout(8000); // Longer wait for full page load
    
    console.log('📸 Taking initial screenshot...');
    await page.screenshot({ 
      path: 'screenshots/layout-test/dashboard_initial_v2.png',
      fullPage: true 
    });
    
    console.log('🔍 Step 4: Comprehensive DOM Analysis...');
    
    // Log all MUI cards found on the page
    const allCards = await page.$$('.MuiCard-root');
    console.log(`Found ${allCards.length} total MUI cards on the page`);
    
    for (let i = 0; i < allCards.length; i++) {
      const card = allCards[i];
      const text = await card.textContent();
      const bounds = await card.boundingBox();
      const classes = await card.getAttribute('class');
      console.log(`Card ${i + 1}:`);
      console.log(`  Classes: ${classes}`);
      console.log(`  Bounds: ${JSON.stringify(bounds)}`);
      console.log(`  Text content: ${text ? text.substring(0, 100) + '...' : 'No text'}`);
      console.log('---');
    }
    
    // Look for Grid structure
    const gridContainers = await page.$$('.MuiGrid-container');
    console.log(`Found ${gridContainers.length} grid containers`);
    
    const gridItems = await page.$$('.MuiGrid-item');
    console.log(`Found ${gridItems.length} grid items`);
    
    // Look for specific text patterns
    const eventTexts = [
      'Upcoming Events',
      'upcomingEvents', 
      'Events',
      'No upcoming events',
      'noUpcoming'
    ];
    
    let eventsCard = null;
    for (const eventText of eventTexts) {
      const cards = await page.$$(`text=${eventText}`);
      if (cards.length > 0) {
        // Find parent card
        for (const textElement of cards) {
          const parentCard = await textElement.locator('xpath=ancestor::*[contains(@class, "MuiCard-root")]').first();
          if (await parentCard.count() > 0) {
            eventsCard = parentCard;
            console.log(`✅ Found events card with text: "${eventText}"`);
            break;
          }
        }
        if (eventsCard) break;
      }
    }
    
    // Alternative approach: look for EventIcon
    if (!eventsCard) {
      const eventIcons = await page.$$('[data-testid="EventIcon"], .MuiSvgIcon-root');
      for (const icon of eventIcons) {
        const parentCard = await icon.locator('xpath=ancestor::*[contains(@class, "MuiCard-root")]').first();
        if (await parentCard.count() > 0) {
          eventsCard = parentCard;
          console.log('✅ Found events card via EventIcon');
          break;
        }
      }
    }
    
    // Look for profile card more specifically
    const profileCards = await page.$$('.MuiCard-root:has(.MuiAvatar-root)');
    let profileCard = null;
    if (profileCards.length > 0) {
      profileCard = profileCards[0];
      console.log('✅ Found profile card via Avatar');
    }
    
    // Alternative profile card search
    if (!profileCard) {
      const editProfileButtons = await page.$$('text=Edit Profile');
      if (editProfileButtons.length > 0) {
        const parentCard = await editProfileButtons[0].locator('xpath=ancestor::*[contains(@class, "MuiCard-root")]').first();
        if (await parentCard.count() > 0) {
          profileCard = parentCard;
          console.log('✅ Found profile card via Edit Profile button');
        }
      }
    }
    
    console.log('\n🎯 DETAILED LAYOUT ANALYSIS:');
    console.log('='.repeat(60));
    
    if (profileCard) {
      const profileBounds = await profileCard.boundingBox();
      console.log(`✅ Profile Card bounds: ${JSON.stringify(profileBounds)}`);
    } else {
      console.log('❌ Profile card not found');
    }
    
    if (eventsCard) {
      const eventsBounds = await eventsCard.boundingBox();
      console.log(`✅ Events Card bounds: ${JSON.stringify(eventsBounds)}`);
    } else {
      console.log('❌ Events card not found');
    }
    
    // Check the Grid structure in detail
    console.log('\n🏗️ DETAILED GRID ANALYSIS:');
    
    // Find the main dashboard grid container
    const mainGrids = await page.$$('.MuiGrid-container');
    for (let i = 0; i < mainGrids.length; i++) {
      const grid = mainGrids[i];
      const gridBounds = await grid.boundingBox();
      const gridItems = await grid.$$('.MuiGrid-item');
      console.log(`Grid Container ${i + 1}: bounds=${JSON.stringify(gridBounds)}, items=${gridItems.length}`);
      
      for (let j = 0; j < gridItems.length; j++) {
        const item = gridItems[j];
        const itemBounds = await item.boundingBox();
        const classes = await item.getAttribute('class');
        const hasCard = await item.$('.MuiCard-root') !== null;
        console.log(`  Grid Item ${j + 1}: ${classes} - bounds=${JSON.stringify(itemBounds)} - hasCard=${hasCard}`);
      }
    }
    
    // Get the current screen width to understand responsive behavior
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    console.log(`Current viewport width: ${viewportWidth}px`);
    
    // Test different viewport sizes
    console.log('\n📐 TESTING RESPONSIVE BEHAVIOR:');
    
    const testSizes = [
      { width: 1440, height: 900, name: 'Desktop Large' },
      { width: 1200, height: 800, name: 'Desktop Medium' },
      { width: 960, height: 800, name: 'Tablet' },
      { width: 600, height: 800, name: 'Mobile' }
    ];
    
    for (const size of testSizes) {
      console.log(`\nTesting ${size.name} (${size.width}x${size.height}):`);
      await page.setViewportSize({ width: size.width, height: size.height });
      await page.waitForTimeout(2000);
      
      // Take screenshot
      await page.screenshot({ 
        path: `screenshots/layout-test/dashboard_${size.name.toLowerCase().replace(' ', '_')}.png`,
        fullPage: false
      });
      
      // Check card positions
      const cards = await page.$$('.MuiCard-root');
      if (cards.length >= 2) {
        const card1Bounds = await cards[0].boundingBox();
        const card2Bounds = await cards[1].boundingBox();
        
        if (card1Bounds && card2Bounds) {
          const sameLine = Math.abs(card1Bounds.y - card2Bounds.y) < 50;
          const sideBySide = sameLine && card2Bounds.x > (card1Bounds.x + card1Bounds.width - 50);
          console.log(`  Cards side by side: ${sideBySide ? '✅' : '❌'}`);
          console.log(`  Card 1: x=${card1Bounds.x}, y=${card1Bounds.y}`);
          console.log(`  Card 2: x=${card2Bounds.x}, y=${card2Bounds.y}`);
        }
      }
    }
    
    // Return to original size
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForTimeout(2000);
    
    // Final comprehensive screenshot
    await page.screenshot({ 
      path: 'screenshots/layout-test/dashboard_final_v2.png',
      fullPage: true 
    });
    
    console.log('\n🎯 Test completed! Check screenshots for detailed analysis.');
    
  } catch (error) {
    console.error('🚨 Test Error:', error);
    await page.screenshot({ 
      path: 'screenshots/layout-test/test_error_v2.png',
      fullPage: true 
    });
  }
  
  // Wait for manual inspection
  console.log('\n⏸️ Pausing for manual inspection. Check the browser and screenshots.');
  console.log('Press Ctrl+C when ready to continue...');
  await page.waitForTimeout(60000); // 1 minute pause
  
  await browser.close();
  console.log('🎯 Dashboard layout test complete!');
  console.log('📁 Screenshots saved to screenshots/layout-test/ folder');
}

// Run the test
console.log('🚀 Starting Dashboard Layout Test V2');
testDashboardLayout().catch(console.error);