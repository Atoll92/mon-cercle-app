import { chromium } from 'playwright';

async function debugReflowIssue() {
  console.log('🔍 DEBUGGING LAYOUT REFLOW ISSUE');
  console.log('📊 Tracking card positions during loading phases');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 800
  });
  
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  
  const page = await context.newPage();
  
  try {
    // Quick login
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
    
    console.log('🏃‍♂️ Navigating to dashboard and monitoring reflow...');
    
    // Go to dashboard and immediately start monitoring
    await page.goto('http://localhost:5173/dashboard');
    
    // Monitor layout changes in real-time
    let checkCount = 0;
    const maxChecks = 20;
    const checkInterval = 500; // Every 500ms
    
    const monitorLayout = async () => {
      checkCount++;
      console.log(`\n📊 Check #${checkCount} (${checkCount * checkInterval}ms after navigation):`);
      
      const cards = await page.$$('.MuiCard-root');
      console.log(`Found ${cards.length} cards`);
      
      if (cards.length >= 2) {
        const card1Bounds = await cards[0].boundingBox();
        const card2Bounds = await cards[1].boundingBox();
        
        if (card1Bounds && card2Bounds) {
          const yDiff = Math.abs(card1Bounds.y - card2Bounds.y);
          const sameLine = yDiff < 50;
          const sideBySide = sameLine && card2Bounds.x > (card1Bounds.x + card1Bounds.width - 100);
          
          console.log(`  Card 1 (Profile): x=${Math.round(card1Bounds.x)}, y=${Math.round(card1Bounds.y)}, w=${Math.round(card1Bounds.width)}, h=${Math.round(card1Bounds.height)}`);
          console.log(`  Card 2 (Events): x=${Math.round(card2Bounds.x)}, y=${Math.round(card2Bounds.y)}, w=${Math.round(card2Bounds.width)}, h=${Math.round(card2Bounds.height)}`);
          console.log(`  Y difference: ${Math.round(yDiff)}px`);
          console.log(`  Side by side: ${sideBySide ? '✅' : '❌'}`);
          
          // Check content loading state
          const card2Text = await cards[1].textContent();
          const hasEventContent = card2Text && (card2Text.includes('test event') || card2Text.includes('Aucun événement') || card2Text.includes('No upcoming'));
          console.log(`  Events loaded: ${hasEventContent ? '✅' : '❌'} (${card2Text ? card2Text.substring(0, 50) + '...' : 'No content'})`);
          
          // Check loading state
          const hasSpinner = await cards[1].$('.MuiCircularProgress-root, [role="progressbar"]') !== null;
          console.log(`  Still loading: ${hasSpinner ? '⏳' : '✅'}`);
          
          // Screenshot at different phases
          if (checkCount === 1) {
            await page.screenshot({ path: 'screenshots/reflow_phase_1_initial.png', fullPage: false });
          } else if (checkCount === 3) {
            await page.screenshot({ path: 'screenshots/reflow_phase_2_early.png', fullPage: false });
          } else if (hasEventContent && checkCount > 3) {
            await page.screenshot({ path: 'screenshots/reflow_phase_3_loaded.png', fullPage: false });
          }
          
          // If we detect the reflow happening, take immediate screenshot
          if (!sideBySide && checkCount > 1) {
            console.log(`🚨 REFLOW DETECTED at check #${checkCount}!`);
            await page.screenshot({ path: `screenshots/reflow_detected_${checkCount}.png`, fullPage: false });
          }
        }
      }
      
      // Check Grid container width and available space
      const gridContainer = await page.$('.MuiGrid-container');
      if (gridContainer) {
        const containerBounds = await gridContainer.boundingBox();
        console.log(`  Grid container: w=${Math.round(containerBounds.width)}, h=${Math.round(containerBounds.height)}`);
        
        // Calculate available space for both cards
        const spacing = 16; // Material-UI default spacing
        const profileWidth = cards.length >= 1 ? (await cards[0].boundingBox()).width : 0;
        const eventsWidth = cards.length >= 2 ? (await cards[1].boundingBox()).width : 0;
        const totalNeeded = profileWidth + eventsWidth + spacing;
        const available = containerBounds.width;
        
        console.log(`  Space needed: ${Math.round(totalNeeded)}px, Available: ${Math.round(available)}px`);
        console.log(`  Fits in row: ${totalNeeded <= available ? '✅' : '❌ OVERFLOW!'}`);
      }
      
      // Continue monitoring if we haven't reached max checks
      if (checkCount < maxChecks) {
        setTimeout(monitorLayout, checkInterval);
      } else {
        console.log('\n🏁 Monitoring complete!');
        
        // Final detailed analysis
        await detailedAnalysis();
        
        await page.waitForTimeout(5000);
        await browser.close();
      }
    };
    
    const detailedAnalysis = async () => {
      console.log('\n🔬 DETAILED FINAL ANALYSIS:');
      
      // Check Grid breakpoints
      const viewportWidth = await page.evaluate(() => window.innerWidth);
      console.log(`Viewport width: ${viewportWidth}px`);
      
      // Check computed styles
      const gridItems = await page.$$('.MuiGrid-item');
      console.log(`Grid items: ${gridItems.length}`);
      
      for (let i = 0; i < Math.min(gridItems.length, 2); i++) {
        const item = gridItems[i];
        const computedStyle = await page.evaluate((el) => {
          const styles = window.getComputedStyle(el);
          return {
            width: styles.width,
            maxWidth: styles.maxWidth,
            flexBasis: styles.flexBasis,
            flexGrow: styles.flexGrow,
            flexShrink: styles.flexShrink,
            display: styles.display,
            position: styles.position
          };
        }, item);
        console.log(`Grid item ${i + 1} computed styles:`, computedStyle);
      }
      
      // Check if Material-UI breakpoints are working
      const isDesktop = await page.evaluate(() => window.innerWidth >= 960);
      console.log(`Should use desktop layout: ${isDesktop}`);
      
      // Check for any CSS that might be interfering
      const cards = await page.$$('.MuiCard-root');
      if (cards.length >= 2) {
        const card2Styles = await page.evaluate((el) => {
          const styles = window.getComputedStyle(el);
          return {
            width: styles.width,
            maxWidth: styles.maxWidth,
            minWidth: styles.minWidth,
            flex: styles.flex,
            position: styles.position,
            float: styles.float
          };
        }, cards[1]);
        console.log('Events card computed styles:', card2Styles);
      }
    };
    
    // Start monitoring
    setTimeout(monitorLayout, 100);
    
  } catch (error) {
    console.error('🚨 Debug Error:', error);
    await page.screenshot({ path: 'screenshots/debug_error.png', fullPage: false });
    await browser.close();
  }
}

debugReflowIssue().catch(console.error);