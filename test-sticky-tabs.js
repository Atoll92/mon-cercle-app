// Test to check smart sticky tabs behavior
const { chromium } = require('playwright');

async function testStickyTabs() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Navigate to the network page (assuming dev server is running)
    await page.goto('http://localhost:5173/network', { waitUntil: 'networkidle' });
    
    // Wait for the page to load
    await page.waitForTimeout(2000);
    
    // Check initial state - tabs should be in normal position
    const originalTabs = await page.locator('#tabs-original-position');
    const originalVisible = await originalTabs.isVisible();
    
    console.log('Initial state - Original tabs visible:', originalVisible);
    
    // Check if fixed tabs are initially hidden
    const fixedTabsExist = await page.locator('div').filter({ hasText: /Fixed tabs section/ }).count();
    console.log('Fixed tabs initially present:', fixedTabsExist > 0);
    
    // Get initial position of original tabs
    const originalRect = await originalTabs.boundingBox();
    console.log('Original tabs position:', originalRect);
    
    // Scroll down slowly to trigger the sticky behavior
    console.log('Scrolling to trigger sticky tabs...');
    await page.evaluate(() => window.scrollTo(0, 300));
    await page.waitForTimeout(500);
    
    // Check if the behavior switched
    const originalVisibleAfterScroll = await originalTabs.isVisible();
    console.log('After scroll - Original tabs visible:', originalVisibleAfterScroll);
    
    // Check if fixed tabs appeared
    const fixedTabsVisible = await page.evaluate(() => {
      const fixedTabs = document.querySelector('[sx*="position: \'fixed\'"]');
      return fixedTabs !== null;
    });
    console.log('Fixed tabs appeared after scroll:', fixedTabsVisible);
    
    // Scroll more to test persistence
    await page.evaluate(() => window.scrollTo(0, 800));
    await page.waitForTimeout(1000);
    
    // Test scrolling back up
    console.log('Scrolling back up to test state change...');
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(1000);
    
    const backToTopOriginalVisible = await originalTabs.isVisible();
    console.log('Back to top - Original tabs visible:', backToTopOriginalVisible);
    
    // Take screenshots
    await page.screenshot({ path: 'sticky-tabs-initial.png' });
    
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'sticky-tabs-scrolled.png' });
    
    console.log('✅ Smart sticky tabs test completed!');
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await browser.close();
  }
}

testStickyTabs();