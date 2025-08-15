import { chromium } from 'playwright';

async function testModernProfile() {
  console.log('🎨 TESTING MODERN COMPACT PROFILE DESIGN');
  console.log('📏 Analyzing space optimization and user experience');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000
  });
  
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  
  const page = await context.newPage();
  
  try {
    // Quick login and navigation
    console.log('🔐 Logging in and navigating...');
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
      // Try to find Boost Club
      let boostClubFound = false;
      for (const card of networkCards) {
        const text = await card.textContent();
        if (text && text.toLowerCase().includes('boost')) {
          await card.click();
          boostClubFound = true;
          break;
        }
      }
      
      if (!boostClubFound) {
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
    await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle' });
    await page.waitForTimeout(4000);
    
    console.log('📊 Analyzing modern profile card design...');
    
    // Take initial screenshot
    await page.screenshot({ 
      path: 'screenshots/modern_profile_full.png',
      fullPage: false
    });
    
    // Find the profile card
    const profileCard = await page.$('.MuiCard-root:has(.MuiAvatar-root)');
    if (profileCard) {
      // Get overall card dimensions
      const cardBounds = await profileCard.boundingBox();
      console.log(`Profile card: ${cardBounds.width}x${cardBounds.height}px`);
      
      // Take focused screenshot of just the profile card
      await page.screenshot({ 
        path: 'screenshots/modern_profile_focused.png',
        clip: {
          x: cardBounds.x - 10,
          y: cardBounds.y - 10,
          width: cardBounds.width + 20,
          height: cardBounds.height + 20
        }
      });
      
      // Analyze the header section
      const headerSection = await profileCard.$('div:has(.MuiAvatar-root)');
      if (headerSection) {
        const headerBounds = await headerSection.boundingBox();
        console.log(`Header section: ${headerBounds.width}x${headerBounds.height}px`);
        
        // Check if name and avatar are horizontally aligned
        const nameElement = await headerSection.$('h6, .MuiTypography-h6');
        const avatarElement = await headerSection.$('.MuiAvatar-root');
        
        if (nameElement && avatarElement) {
          const nameBounds = await nameElement.boundingBox();
          const avatarBounds = await avatarElement.boundingBox();
          
          const horizontalAlignment = Math.abs(nameBounds.y - avatarBounds.y) < 20;
          const avatarOnRight = avatarBounds.x > nameBounds.x;
          
          console.log(`Name and avatar horizontally aligned: ${horizontalAlignment ? '✅' : '❌'}`);
          console.log(`Avatar positioned to the right: ${avatarOnRight ? '✅' : '❌'}`);
          console.log(`Name: x=${Math.round(nameBounds.x)}, y=${Math.round(nameBounds.y)}, w=${Math.round(nameBounds.width)}`);
          console.log(`Avatar: x=${Math.round(avatarBounds.x)}, y=${Math.round(avatarBounds.y)}, size=${Math.round(avatarBounds.width)}px`);
        }
      }
      
      // Check for compact chips
      const chips = await profileCard.$$('.MuiChip-root');
      console.log(`Number of status chips: ${chips.length}`);
      
      if (chips.length > 0) {
        const chipBounds = await chips[0].boundingBox();
        console.log(`Chip size: ${Math.round(chipBounds.width)}x${Math.round(chipBounds.height)}px`);
      }
      
      // Check the buttons section
      const cardActions = await profileCard.$('.MuiCardActions-root');
      if (cardActions) {
        const actionsBounds = await cardActions.boundingBox();
        const buttons = await cardActions.$$('button');
        
        console.log(`Button area: ${actionsBounds.width}x${actionsBounds.height}px`);
        console.log(`Number of buttons: ${buttons.length}`);
        
        if (buttons.length > 0) {
          const buttonBounds = await buttons[0].boundingBox();
          console.log(`Button size: ${Math.round(buttonBounds.width)}x${Math.round(buttonBounds.height)}px`);
          
          // Test tooltips
          console.log('Testing button tooltips...');
          for (let i = 0; i < Math.min(buttons.length, 3); i++) {
            await buttons[i].hover();
            await page.waitForTimeout(800);
            
            const tooltip = await page.$('.MuiTooltip-tooltip');
            if (tooltip) {
              const tooltipText = await tooltip.textContent();
              console.log(`Button ${i + 1} tooltip: "${tooltipText}" ✅`);
            }
            
            await page.mouse.move(0, 0);
            await page.waitForTimeout(300);
          }
        }
      }
      
      // Calculate space efficiency
      const cardContent = await profileCard.$('.MuiCardContent-root');
      if (cardContent) {
        const contentBounds = await cardContent.boundingBox();
        const contentHeight = contentBounds.height;
        const totalHeight = cardBounds.height;
        const efficiency = (contentHeight / totalHeight) * 100;
        
        console.log(`\\n📏 SPACE EFFICIENCY ANALYSIS:`);
        console.log(`Total card height: ${totalHeight}px`);
        console.log(`Content height: ${contentHeight}px`);
        console.log(`Content efficiency: ${efficiency.toFixed(1)}%`);
        
        // Estimate space saved from original design
        const originalEstimatedHeight = 450; // Estimated original design height
        const spaceSaved = originalEstimatedHeight - totalHeight;
        const spaceSavingPercent = (spaceSaved / originalEstimatedHeight) * 100;
        
        console.log(`Estimated space saved: ~${spaceSaved}px (${spaceSavingPercent.toFixed(1)}%)`);
      }
      
      // Test layout stability
      console.log('\\n🔍 Testing layout stability...');
      const allCards = await page.$$('.MuiCard-root');
      if (allCards.length >= 2) {
        const card1Bounds = await allCards[0].boundingBox();
        const card2Bounds = await allCards[1].boundingBox();
        
        const sideBySide = Math.abs(card1Bounds.y - card2Bounds.y) < 50;
        console.log(`Cards remain side by side: ${sideBySide ? '✅' : '❌'}`);
        
        if (sideBySide) {
          const totalWidth = card1Bounds.width + card2Bounds.width;
          const availableWidth = 1300; // Approximate container width
          const widthUtilization = (totalWidth / availableWidth) * 100;
          console.log(`Width utilization: ${widthUtilization.toFixed(1)}%`);
        }
      }
      
    } else {
      console.log('❌ Profile card not found');
    }
    
    console.log('\\n✅ Modern profile design analysis complete!');
    console.log('📸 Screenshots saved: modern_profile_full.png and modern_profile_focused.png');
    
    await page.waitForTimeout(5000);
    
  } catch (error) {
    console.error('🚨 Test Error:', error);
    await page.screenshot({ path: 'screenshots/modern_profile_error.png', fullPage: false });
  }
  
  await browser.close();
}

testModernProfile().catch(console.error);