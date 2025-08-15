import { chromium } from 'playwright';

async function testBoostClubLayout() {
  console.log('🎯 TESTING BOOST CLUB LAYOUT - Non-Admin Member');
  console.log('📊 Monitoring reflow during event loading');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 800
  });
  
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  
  const page = await context.newPage();
  
  try {
    // Step 1: Login
    console.log('🔐 Step 1: Logging in...');
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    const loginForm = await page.$('input[name="email"]');
    if (!loginForm) {
      const loginBtn = await page.$('button:has-text("Login"), button:has-text("Sign In")');
      if (loginBtn) await loginBtn.click();
      await page.waitForTimeout(2000);
    }
    
    await page.fill('input[name="email"]', 'arthur.boval@gmail.com');
    await page.fill('input[type="password"]', 'testetest');
    await page.click('button:has-text("SIGN IN")');
    await page.waitForTimeout(5000);
    
    // Step 2: Network Selection - Specifically select Boost Club
    console.log('🌐 Step 2: Selecting Boost Club Network...');
    if (!page.url().includes('/network')) {
      await page.goto('http://localhost:5173/network', { waitUntil: 'networkidle' });
    }
    await page.waitForTimeout(3000);
    
    // Find and click Boost Club specifically
    const networkCards = await page.$$('.MuiCard-root');
    let boostClubFound = false;
    
    console.log(`Found ${networkCards.length} networks, looking for Boost Club...`);
    
    for (let i = 0; i < networkCards.length; i++) {
      const card = networkCards[i];
      const text = await card.textContent();
      console.log(`Network ${i + 1}: ${text ? text.substring(0, 50) + '...' : 'No text'}`);
      
      if (text && text.toLowerCase().includes('boost')) {
        console.log('🎯 Found Boost Club! Clicking...');
        await card.click();
        await page.waitForTimeout(2000);
        boostClubFound = true;
        break;
      }
    }
    
    if (!boostClubFound) {
      console.log('⚠️ Boost Club not found, using first network as fallback');
      if (networkCards.length > 0) {
        await networkCards[0].click();
        await page.waitForTimeout(2000);
      }
    }
    
    // Continue into the network
    const continueBtn = await page.$('button:has-text("CONTINUE"), button:has-text("Continue")');
    if (continueBtn) {
      console.log('✅ Clicking CONTINUE button');
      await continueBtn.click();
      await page.waitForTimeout(5000);
    }
    
    // Step 3: Navigate to dashboard and monitor
    console.log('📊 Step 3: Navigating to dashboard...');
    await page.goto('http://localhost:5173/dashboard');
    
    // Take screenshot immediately
    await page.screenshot({ 
      path: 'screenshots/boost_club_initial.png',
      fullPage: false
    });
    
    // Monitor for reflow during loading
    let checkCount = 0;
    const maxChecks = 15;
    let lastPositions = null;
    
    const monitorReflow = async () => {
      checkCount++;
      console.log(`\\n📊 Check #${checkCount} (${checkCount * 800}ms):`);
      
      // Check user role first
      const roleChips = await page.$$('.MuiChip-root');
      let userRole = 'unknown';
      for (const chip of roleChips) {
        const chipText = await chip.textContent();
        if (chipText && (chipText.toLowerCase().includes('admin') || chipText.toLowerCase().includes('member'))) {
          userRole = chipText.includes('admin') ? 'admin' : 'member';
          break;
        }
      }
      console.log(`  User role: ${userRole}`);
      
      // Get all cards
      const cards = await page.$$('.MuiCard-root');
      console.log(`  Found ${cards.length} cards`);
      
      if (cards.length >= 2) {
        const card1Bounds = await cards[0].boundingBox();
        const card2Bounds = await cards[1].boundingBox();
        
        if (card1Bounds && card2Bounds) {
          const currentPositions = {
            card1: { x: Math.round(card1Bounds.x), y: Math.round(card1Bounds.y), w: Math.round(card1Bounds.width) },
            card2: { x: Math.round(card2Bounds.x), y: Math.round(card2Bounds.y), w: Math.round(card2Bounds.width) }
          };
          
          console.log(`  Card 1: x=${currentPositions.card1.x}, y=${currentPositions.card1.y}, w=${currentPositions.card1.w}`);
          console.log(`  Card 2: x=${currentPositions.card2.x}, y=${currentPositions.card2.y}, w=${currentPositions.card2.w}`);
          
          // Check for reflow
          if (lastPositions) {
            const card1Moved = lastPositions.card1.x !== currentPositions.card1.x || lastPositions.card1.y !== currentPositions.card1.y;
            const card2Moved = lastPositions.card2.x !== currentPositions.card2.x || lastPositions.card2.y !== currentPositions.card2.y;
            
            if (card1Moved || card2Moved) {
              console.log(`  🚨 REFLOW DETECTED!`);
              console.log(`    Card 1 moved: ${card1Moved ? 'YES' : 'NO'}`);
              console.log(`    Card 2 moved: ${card2Moved ? 'YES' : 'NO'}`);
              
              await page.screenshot({ 
                path: `screenshots/reflow_detected_check_${checkCount}.png`,
                fullPage: false
              });
            }
          }
          
          lastPositions = currentPositions;
          
          // Check layout status
          const yDiff = Math.abs(currentPositions.card1.y - currentPositions.card2.y);
          const sideBySide = yDiff < 50 && currentPositions.card2.x > (currentPositions.card1.x + currentPositions.card1.w - 100);
          console.log(`  Side by side: ${sideBySide ? '✅' : '❌'}`);
          
          // Check content loading state for card 2
          const card2Text = await cards[1].textContent();
          const hasEvents = card2Text && (card2Text.includes('test event') || card2Text.includes('Aucun') || card2Text.includes('No upcoming') || card2Text.includes('Events'));
          const isLoading = await cards[1].$('.MuiCircularProgress-root') !== null;
          
          console.log(`  Events card content loaded: ${hasEvents ? '✅' : '❌'}`);
          console.log(`  Still loading: ${isLoading ? '⏳' : '✅'}`);
          
          if (card2Text) {
            console.log(`  Card 2 content preview: "${card2Text.substring(0, 60)}..."`);
          }
        }
      }
      
      if (checkCount < maxChecks) {
        setTimeout(monitorReflow, 800);
      } else {
        console.log('\\n🏁 Monitoring complete!');
        
        // Final screenshot
        await page.screenshot({ 
          path: 'screenshots/boost_club_final.png',
          fullPage: false
        });
        
        // Wait for manual inspection
        console.log('\\n⏸️ Pausing for manual inspection...');
        await page.waitForTimeout(10000);
        
        await browser.close();
      }
    };
    
    // Start monitoring after a brief delay
    setTimeout(monitorReflow, 800);
    
  } catch (error) {
    console.error('🚨 Test Error:', error);
    await page.screenshot({ path: 'screenshots/boost_club_error.png', fullPage: false });
    await browser.close();
  }
}

testBoostClubLayout().catch(console.error);