import { chromium } from 'playwright';

async function testCompactButtons() {
  console.log('🎨 TESTING COMPACT ICON BUTTONS');
  console.log('📏 Measuring vertical space savings');
  
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
      await networkCards[0].click();
      await page.waitForTimeout(2000);
      
      const continueBtn = await page.$('button:has-text("CONTINUE")');
      if (continueBtn) {
        await continueBtn.click();
        await page.waitForTimeout(5000);
      }
    }
    
    // Go to dashboard
    await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    
    console.log('📊 Analyzing profile card layout...');
    
    // Find the profile card (should be the first card with avatar)
    const profileCard = await page.$('.MuiCard-root:has(.MuiAvatar-root)');
    if (profileCard) {
      const cardBounds = await profileCard.boundingBox();
      console.log(`Profile card dimensions: ${cardBounds.width}x${cardBounds.height}px`);
      
      // Find the buttons area
      const cardActions = await profileCard.$('.MuiCardActions-root');
      if (cardActions) {
        const actionsBounds = await cardActions.boundingBox();
        console.log(`Card actions area: ${actionsBounds.width}x${actionsBounds.height}px`);
        
        // Count buttons
        const buttons = await cardActions.$$('button');
        console.log(`Number of buttons: ${buttons.length}`);
        
        // Check button dimensions
        if (buttons.length > 0) {
          const buttonBounds = await buttons[0].boundingBox();
          console.log(`Button size: ${buttonBounds.width}x${buttonBounds.height}px`);
        }
        
        // Check for tooltips by hovering
        console.log('Testing tooltips...');
        for (let i = 0; i < Math.min(buttons.length, 3); i++) {
          await buttons[i].hover();
          await page.waitForTimeout(1000);
          
          const tooltip = await page.$('.MuiTooltip-tooltip');
          if (tooltip) {
            const tooltipText = await tooltip.textContent();
            console.log(`Button ${i + 1} tooltip: "${tooltipText}"`);
          } else {
            console.log(`Button ${i + 1} tooltip: Not found`);
          }
          
          // Move mouse away
          await page.mouse.move(0, 0);
          await page.waitForTimeout(500);
        }
        
        // Calculate space savings
        const buttonRowHeight = actionsBounds.height;
        const previousEstimatedHeight = 60; // Estimated height with text buttons
        const spaceSaved = previousEstimatedHeight - buttonRowHeight;
        
        console.log(`\n📏 SPACE ANALYSIS:`);
        console.log(`Current buttons height: ${buttonRowHeight}px`);
        console.log(`Previous estimated height: ${previousEstimatedHeight}px`);
        console.log(`Space saved: ~${spaceSaved}px`);
        console.log(`Space savings: ~${((spaceSaved / previousEstimatedHeight) * 100).toFixed(1)}%`);
        
      }
      
      // Check overall card compactness
      const cardContent = await profileCard.$('.MuiCardContent-root');
      if (cardContent) {
        const contentBounds = await cardContent.boundingBox();
        console.log(`Card content area: ${contentBounds.width}x${contentBounds.height}px`);
        
        const contentRatio = (contentBounds.height / cardBounds.height) * 100;
        console.log(`Content utilization: ${contentRatio.toFixed(1)}%`);
      }
    } else {
      console.log('❌ Profile card not found');
    }
    
    // Take screenshot to show the compact design
    await page.screenshot({ 
      path: 'screenshots/compact_buttons.png',
      fullPage: false
    });
    
    // Test the layout stability with the new compact buttons
    console.log('\n🔍 Testing layout stability...');
    
    const allCards = await page.$$('.MuiCard-root');
    if (allCards.length >= 2) {
      const card1Bounds = await allCards[0].boundingBox();
      const card2Bounds = await allCards[1].boundingBox();
      
      const sideBySide = Math.abs(card1Bounds.y - card2Bounds.y) < 50;
      console.log(`Cards still side by side: ${sideBySide ? '✅' : '❌'}`);
      console.log(`Profile card: x=${Math.round(card1Bounds.x)}, y=${Math.round(card1Bounds.y)}, w=${Math.round(card1Bounds.width)}, h=${Math.round(card1Bounds.height)}`);
      console.log(`Events card: x=${Math.round(card2Bounds.x)}, y=${Math.round(card2Bounds.y)}, w=${Math.round(card2Bounds.width)}, h=${Math.round(card2Bounds.height)}`);
    }
    
    console.log('\n✅ Compact button test complete!');
    await page.waitForTimeout(5000);
    
  } catch (error) {
    console.error('🚨 Test Error:', error);
    await page.screenshot({ path: 'screenshots/compact_buttons_error.png', fullPage: false });
  }
  
  await browser.close();
}

testCompactButtons().catch(console.error);