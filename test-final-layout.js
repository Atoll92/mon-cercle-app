import { chromium } from 'playwright';

async function quickLayoutTest() {
  console.log('🧪 QUICK LAYOUT TEST - After Fix');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500
  });
  
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  
  const page = await context.newPage();
  
  try {
    // Login quickly
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
    
    // Select network
    if (!page.url().includes('/network')) {
      await page.goto('http://localhost:5173/network', { waitUntil: 'networkidle' });
    }
    await page.waitForTimeout(3000);
    
    const networkCards = await page.$$('.MuiCard-root');
    if (networkCards.length > 0) {
      await networkCards[0].click();
      await page.waitForTimeout(2000);
      
      const continueBtn = await page.$('button:has-text("CONTINUE"), button:has-text("Continue")');
      if (continueBtn) {
        await continueBtn.click();
        await page.waitForTimeout(5000);
      }
    }
    
    // Go to dashboard
    await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle' });
    await page.waitForTimeout(5000);
    
    // Quick analysis
    const cards = await page.$$('.MuiCard-root');
    console.log(`Found ${cards.length} cards`);
    
    if (cards.length >= 2) {
      const card1Bounds = await cards[0].boundingBox();
      const card2Bounds = await cards[1].boundingBox();
      
      console.log(`Card 1: x=${card1Bounds.x}, y=${card1Bounds.y}, w=${card1Bounds.width}`);
      console.log(`Card 2: x=${card2Bounds.x}, y=${card2Bounds.y}, w=${card2Bounds.width}`);
      
      const yDiff = Math.abs(card1Bounds.y - card2Bounds.y);
      const sameLine = yDiff < 50;
      const sideBySide = sameLine && card2Bounds.x > (card1Bounds.x + card1Bounds.width - 50);
      
      console.log(`Y difference: ${yDiff}px`);
      console.log(`Same line: ${sameLine ? '✅ YES' : '❌ NO'}`);
      console.log(`Side by side: ${sideBySide ? '✅ SUCCESS!' : '❌ STILL FAILED'}`);
      
      if (sideBySide) {
        console.log('🎉 LAYOUT FIX SUCCESSFUL!');
      } else {
        console.log('🚨 LAYOUT STILL BROKEN');
      }
    }
    
    // Screenshot
    await page.screenshot({ 
      path: 'screenshots/layout_after_fix.png',
      fullPage: false
    });
    
    // Let's also check Grid items
    const gridItems = await page.$$('.MuiGrid-item');
    console.log(`Grid items found: ${gridItems.length}`);
    
    await page.waitForTimeout(10000); // Pause to see result
    
  } catch (error) {
    console.error('Error:', error);
  }
  
  await browser.close();
}

quickLayoutTest().catch(console.error);