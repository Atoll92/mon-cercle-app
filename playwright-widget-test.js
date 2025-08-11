const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500 // Slow down for visibility
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();

  try {
    // Navigate to the app
    await page.goto('http://localhost:5173');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Check if we're on login page
    if (page.url().includes('/login')) {
      console.log('On login page, logging in...');
      
      // Fill in login credentials
      await page.fill('input[type="email"]', 'admin@conclav.com');
      await page.fill('input[type="password"]', 'password123'); // Update with correct password
      
      // Click login button
      await page.click('button[type="submit"]');
      
      // Wait for navigation to dashboard
      await page.waitForURL('**/dashboard', { timeout: 10000 });
    }
    
    // Wait for content to load
    await page.waitForTimeout(3000);
    
    // Find the widgets
    const newsWidget = await page.$('div:has(> div:has-text("Latest News"))');
    const postsWidget = await page.$('div:has(> div:has-text("Latest Posts"))');
    
    // Get widget dimensions
    if (newsWidget) {
      const newsBounds = await newsWidget.boundingBox();
      console.log('News Widget:', {
        width: newsBounds.width,
        height: newsBounds.height,
        x: newsBounds.x,
        y: newsBounds.y
      });
    }
    
    if (postsWidget) {
      const postsBounds = await postsWidget.boundingBox();
      console.log('Posts Widget:', {
        width: postsBounds.width,
        height: postsBounds.height,
        x: postsBounds.x,
        y: postsBounds.y
      });
    }
    
    // Get viewport width
    const viewportSize = page.viewportSize();
    console.log('Viewport:', viewportSize);
    
    // Calculate percentages
    if (newsWidget && postsWidget) {
      const newsBounds = await newsWidget.boundingBox();
      const postsBounds = await postsWidget.boundingBox();
      
      console.log('\nWidget Width Analysis:');
      console.log(`News Widget: ${newsBounds.width}px (${(newsBounds.width / viewportSize.width * 100).toFixed(1)}% of viewport)`);
      console.log(`Posts Widget: ${postsBounds.width}px (${(postsBounds.width / viewportSize.width * 100).toFixed(1)}% of viewport)`);
      
      // Check Grid container
      const gridContainer = await page.$('div.MuiGrid-container:has(div:has-text("Latest News"))');
      if (gridContainer) {
        const gridBounds = await gridContainer.boundingBox();
        console.log(`\nGrid Container: ${gridBounds.width}px`);
        console.log(`News Widget: ${(newsBounds.width / gridBounds.width * 100).toFixed(1)}% of grid`);
        console.log(`Posts Widget: ${(postsBounds.width / gridBounds.width * 100).toFixed(1)}% of grid`);
      }
    }
    
    // Take screenshots at different viewport sizes
    const sizes = [
      { width: 1920, height: 1080, name: 'desktop' },
      { width: 1366, height: 768, name: 'laptop' },
      { width: 768, height: 1024, name: 'tablet' },
      { width: 375, height: 667, name: 'mobile' }
    ];
    
    for (const size of sizes) {
      await page.setViewportSize({ width: size.width, height: size.height });
      await page.waitForTimeout(1000);
      
      // Scroll to widgets
      const widgetsArea = await page.$('div:has(> div:has-text("Latest News"))');
      if (widgetsArea) {
        await widgetsArea.scrollIntoViewIfNeeded();
      }
      
      await page.screenshot({ 
        path: `screenshots/widgets-${size.name}-${size.width}x${size.height}.png`,
        fullPage: false
      });
      
      console.log(`\nScreenshot taken for ${size.name} (${size.width}x${size.height})`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Keep browser open for inspection
    console.log('\nPress Ctrl+C to close the browser...');
  }
})();