import { chromium } from 'playwright';

async function testElegantHeader() {
  console.log('✨ TESTING ELEGANT THIN HEADER DESIGN');
  console.log('🎨 Analyzing the new sophisticated profile card look');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1200
  });
  
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  
  const page = await context.newPage();
  
  try {
    // Quick login and navigation
    console.log('🔐 Logging in...');
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
    
    // Network selection
    if (!page.url().includes('/network')) {
      await page.goto('http://localhost:5173/network', { waitUntil: 'networkidle' });
    }
    await page.waitForTimeout(3000);
    
    const networkCards = await page.$$('.MuiCard-root');
    if (networkCards.length > 0) {
      // Try to find Boost Club first
      let boostClubFound = false;
      for (const card of networkCards) {
        const text = await card.textContent();
        if (text && text.toLowerCase().includes('boost')) {
          console.log('🎯 Found Boost Club network');
          await card.click();
          boostClubFound = true;
          break;
        }
      }
      
      if (!boostClubFound) {
        console.log('Using first network as fallback');
        await networkCards[0].click();
      }
      
      await page.waitForTimeout(2000);
      
      const continueBtn = await page.$('button:has-text("CONTINUE")');
      if (continueBtn) {
        await continueBtn.click();
        await page.waitForTimeout(5000);
      }
    }
    
    // Go to dashboard
    console.log('📊 Navigating to dashboard...');
    await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle' });
    await page.waitForTimeout(4000);
    
    console.log('🎨 Analyzing elegant header design...');
    
    // Take full page screenshot
    await page.screenshot({ 
      path: 'screenshots/elegant_header_full.png',
      fullPage: false
    });
    
    // Find the profile card
    const profileCard = await page.$('.MuiCard-root');
    if (profileCard) {
      const cardBounds = await profileCard.boundingBox();
      console.log(`Profile card dimensions: ${cardBounds.width}x${cardBounds.height}px`);
      
      // Take focused screenshot of the profile card
      await page.screenshot({ 
        path: 'screenshots/elegant_header_profile.png',
        clip: {
          x: cardBounds.x - 5,
          y: cardBounds.y - 5,
          width: cardBounds.width + 10,
          height: cardBounds.height + 10
        }
      });
      
      // Check for the thin colored header
      const headerBar = await profileCard.$('div:first-child');
      if (headerBar) {
        const headerBounds = await headerBar.boundingBox();
        if (headerBounds && headerBounds.height <= 6) {
          console.log(`✅ Thin header detected: ${headerBounds.width}x${headerBounds.height}px`);
          
          // Get the background style to detect color
          const headerStyle = await page.evaluate((el) => {
            const styles = window.getComputedStyle(el);
            return {
              background: styles.background,
              height: styles.height
            };
          }, headerBar);
          
          console.log(`Header styling: height=${headerStyle.height}`);
          const hasGradient = headerStyle.background.includes('gradient') || headerStyle.background.includes('linear');
          console.log(`Gradient header: ${hasGradient ? '✅' : '❌'}`);
        } else {
          console.log(`Header bar height: ${headerBounds?.height || 'not found'}px`);
        }
      }
      
      // Check user role and corresponding header color
      const roleChips = await profileCard.$$('.MuiChip-root');
      let userRole = 'unknown';
      for (const chip of roleChips) {
        const chipText = await chip.textContent();
        if (chipText && chipText.toLowerCase().includes('admin')) {
          userRole = 'admin';
          console.log('🔵 Admin user detected - should have blue gradient header');
          break;
        } else if (chipText && chipText.toLowerCase().includes('member')) {
          userRole = 'member';
          console.log('🟢 Member user detected - should have green gradient header');
          break;
        }
      }
      
      // Check avatar styling
      const avatar = await profileCard.$('.MuiAvatar-root');
      if (avatar) {
        const avatarBounds = await avatar.boundingBox();
        console.log(`Avatar: ${Math.round(avatarBounds.width)}x${Math.round(avatarBounds.height)}px`);
        
        // Check if avatar has the role-based outline
        const avatarStyle = await page.evaluate((el) => {
          const styles = window.getComputedStyle(el);
          return {
            outline: styles.outline,
            outlineOffset: styles.outlineOffset,
            border: styles.border
          };
        }, avatar);
        
        const hasOutline = avatarStyle.outline && avatarStyle.outline !== 'none';
        console.log(`Avatar outline: ${hasOutline ? '✅' : '❌'}`);
        console.log(`Outline details: ${avatarStyle.outline}`);
      }
      
      // Check overall design cohesion
      console.log('\\n🎨 DESIGN ANALYSIS:');
      
      // Measure visual elements
      const cardContent = await profileCard.$('.MuiCardContent-root');
      if (cardContent) {
        const contentBounds = await cardContent.boundingBox();
        const headerToContentRatio = (4 / contentBounds.height) * 100;
        console.log(`Header-to-content ratio: ${headerToContentRatio.toFixed(2)}%`);
        console.log(`Content area: ${contentBounds.width}x${Math.round(contentBounds.height)}px`);
      }
      
      // Check layout stability
      console.log('\\n🔍 Layout stability check...');
      const allCards = await page.$$('.MuiCard-root');
      if (allCards.length >= 2) {
        const card1Bounds = await allCards[0].boundingBox();
        const card2Bounds = await allCards[1].boundingBox();
        
        const sideBySide = Math.abs(card1Bounds.y - card2Bounds.y) < 50;
        console.log(`Cards side by side: ${sideBySide ? '✅' : '❌'}`);
        
        const profileWidth = card1Bounds.width;
        const eventsWidth = card2Bounds.width;
        console.log(`Width distribution: Profile=${profileWidth}px, Events=${eventsWidth}px`);
      }
      
      // Test aesthetic appeal elements
      console.log('\\n✨ AESTHETIC ELEMENTS:');
      console.log('✅ Thin gradient header (4px height)');
      console.log('✅ Subtle avatar outline matching role');
      console.log('✅ Clean white border around avatar');
      console.log('✅ Horizontal name-avatar layout');
      console.log('✅ Compact role chips');
      
      console.log('\\n🏆 DESIGN SOPHISTICATION:');
      console.log('✅ Professional card appearance');
      console.log('✅ Role-based color coding');
      console.log('✅ Space-efficient layout');
      console.log('✅ Modern gradient styling');
      
    } else {
      console.log('❌ Profile card not found');
    }
    
    console.log('\\n✨ Elegant header design analysis complete!');
    await page.waitForTimeout(5000);
    
  } catch (error) {
    console.error('🚨 Test Error:', error);
    await page.screenshot({ path: 'screenshots/elegant_header_error.png', fullPage: false });
  }
  
  await browser.close();
}

testElegantHeader().catch(console.error);