import { chromium } from 'playwright';
import { mkdir } from 'fs/promises';

async function testDashboardLayout() {
  console.log('🧪 TESTING DASHBOARD LAYOUT FOR NON-ADMIN MEMBERS');
  console.log('📸 Testing if Profile Card and Upcoming Events Card are side by side');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000,
    devtools: false
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
    await page.waitForTimeout(5000);
    
    console.log('📸 Taking initial screenshot...');
    await page.screenshot({ 
      path: 'screenshots/layout-test/dashboard_initial.png',
      fullPage: true 
    });
    
    console.log('🔍 Step 4: Analyzing Dashboard Layout...');
    
    // Wait for dashboard to load completely
    await page.waitForSelector('.MuiGrid-container', { timeout: 10000 });
    await page.waitForTimeout(3000);
    
    // Find the main grid container
    const gridContainers = await page.$$('.MuiGrid-container');
    console.log(`Found ${gridContainers.length} grid containers`);
    
    // Look for profile card
    const profileCard = await page.$('[data-testid="profile-card"], .profile-card, .MuiCard-root:has(.profile-picture, .MuiAvatar-root)');
    let profileCardInfo = null;
    
    if (profileCard) {
      const profileBounds = await profileCard.boundingBox();
      const profileText = await profileCard.textContent();
      profileCardInfo = {
        bounds: profileBounds,
        hasContent: profileText && (profileText.includes('Edit Profile') || profileText.includes('View Profile'))
      };
      console.log('✅ Profile card found:', profileBounds);
    } else {
      console.log('❌ Profile card not found');
    }
    
    // Look for upcoming events card  
    const eventsCard = await page.$('.MuiCard-root:has([data-testid="upcoming-events"]), .MuiCard-root:has-text("Upcoming Events"), .MuiCard-root:has-text("upcomingEvents")');
    let eventsCardInfo = null;
    
    if (eventsCard) {
      const eventsBounds = await eventsCard.boundingBox();
      const eventsText = await eventsCard.textContent();
      eventsCardInfo = {
        bounds: eventsBounds,
        hasContent: eventsText && eventsText.toLowerCase().includes('event')
      };
      console.log('✅ Events card found:', eventsBounds);
    } else {
      console.log('❌ Events card not found');
      
      // Try alternative selectors for events
      const altEventsCard = await page.$('.MuiCard-root:has(.MuiCardHeader-title:has-text("Events"))');
      if (altEventsCard) {
        const eventsBounds = await altEventsCard.boundingBox();
        eventsCardInfo = { bounds: eventsBounds, hasContent: true };
        console.log('✅ Events card found (alternative selector):', eventsBounds);
      }
    }
    
    // Check user role
    const roleChips = await page.$$('.MuiChip-root');
    let isAdmin = false;
    for (const chip of roleChips) {
      const chipText = await chip.textContent();
      if (chipText && chipText.toLowerCase().includes('admin')) {
        isAdmin = true;
        break;
      }
    }
    
    console.log(`User role: ${isAdmin ? 'Admin' : 'Non-Admin Member'}`);
    
    // Take detailed screenshot
    await page.screenshot({ 
      path: 'screenshots/layout-test/dashboard_detailed_analysis.png',
      fullPage: true 
    });
    
    // Analysis
    console.log('\n📊 LAYOUT ANALYSIS RESULTS:');
    console.log('='.repeat(50));
    
    if (profileCardInfo && eventsCardInfo) {
      const profileX = profileCardInfo.bounds.x;
      const profileY = profileCardInfo.bounds.y;
      const profileRight = profileX + profileCardInfo.bounds.width;
      
      const eventsX = eventsCardInfo.bounds.x;
      const eventsY = eventsCardInfo.bounds.y;
      
      // Check if they're on the same row (Y coordinates are close)
      const yDiff = Math.abs(profileY - eventsY);
      const sameLine = yDiff < 50; // Allow 50px tolerance
      
      // Check if events card is to the right of profile card
      const eventsToRight = eventsX > profileRight;
      
      console.log(`Profile Card: x=${profileX}, y=${profileY}, width=${profileCardInfo.bounds.width}`);
      console.log(`Events Card: x=${eventsX}, y=${eventsY}, width=${eventsCardInfo.bounds.width}`);
      console.log(`Y difference: ${yDiff}px`);
      console.log(`Same row (Y diff < 50px): ${sameLine ? '✅ YES' : '❌ NO'}`);
      console.log(`Events to right of profile: ${eventsToRight ? '✅ YES' : '❌ NO'}`);
      
      const sideBySide = sameLine && eventsToRight;
      console.log(`\n🎯 SIDE BY SIDE LAYOUT: ${sideBySide ? '✅ SUCCESS' : '❌ FAILED'}`);
      
      if (!sideBySide) {
        console.log('\n🔧 ISSUE DETECTED: Cards are not side by side');
        if (!sameLine) {
          console.log('   - Cards are not on the same horizontal line');
          console.log('   - This suggests they might be stacked vertically');
        }
        if (!eventsToRight) {
          console.log('   - Events card is not positioned to the right of profile card');
        }
        
        // Take a focused screenshot of the problematic area
        if (profileCardInfo.bounds.y < eventsCardInfo.bounds.y) {
          await page.screenshot({ 
            path: 'screenshots/layout-test/layout_issue_vertical_stacking.png',
            clip: {
              x: 0,
              y: profileCardInfo.bounds.y - 50,
              width: 1440,
              height: (eventsCardInfo.bounds.y + eventsCardInfo.bounds.height) - profileCardInfo.bounds.y + 100
            }
          });
        }
      } else {
        console.log('\n✅ SUCCESS: Cards are properly positioned side by side');
        
        // Take success screenshot
        await page.screenshot({ 
          path: 'screenshots/layout-test/layout_success_side_by_side.png',
          clip: {
            x: 0,
            y: Math.min(profileY, eventsY) - 50,
            width: 1440,
            height: Math.max(profileCardInfo.bounds.height, eventsCardInfo.bounds.height) + 100
          }
        });
      }
      
    } else {
      console.log('❌ Could not find both profile and events cards for analysis');
      if (!profileCardInfo) console.log('   - Profile card missing');
      if (!eventsCardInfo) console.log('   - Events card missing');
    }
    
    // Look for Grid structure issues
    console.log('\n🔍 GRID STRUCTURE ANALYSIS:');
    const gridItems = await page.$$('.MuiGrid-item');
    console.log(`Found ${gridItems.length} grid items`);
    
    for (let i = 0; i < Math.min(gridItems.length, 10); i++) {
      const item = gridItems[i];
      const classes = await item.getAttribute('class');
      const bounds = await item.boundingBox();
      console.log(`Grid item ${i + 1}: ${classes} - bounds: ${JSON.stringify(bounds)}`);
    }
    
    // Final comprehensive screenshot
    await page.screenshot({ 
      path: 'screenshots/layout-test/dashboard_final_comprehensive.png',
      fullPage: true 
    });
    
  } catch (error) {
    console.error('🚨 Test Error:', error);
    await page.screenshot({ 
      path: 'screenshots/layout-test/test_error.png',
      fullPage: true 
    });
  }
  
  await page.waitForTimeout(3000);
  await browser.close();
  console.log('🎯 Dashboard layout test complete!');
  console.log('📁 Screenshots saved to screenshots/layout-test/ folder');
}

// Run the test
console.log('🚀 Starting Dashboard Layout Test');
testDashboardLayout().catch(console.error);