const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  try {
    // Navigate to the login page
    await page.goto('http://localhost:5173/login');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Take screenshot of login page
    await page.screenshot({ path: 'screenshots/01-login-page.png', fullPage: true });
    
    // Fill in login credentials - you may need to update these
    await page.fill('input[type="email"]', 'admin@conclav.com');
    await page.fill('input[type="password"]', 'your-password-here');
    
    // Click login button
    await page.click('button[type="submit"]');
    
    // Wait for navigation to dashboard
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    await page.waitForLoadState('networkidle');
    
    // Give extra time for content to load
    await page.waitForTimeout(3000);
    
    // Take full dashboard screenshot
    await page.screenshot({ path: 'screenshots/02-dashboard-full.png', fullPage: true });
    
    // Scroll to and capture the news/posts widgets area
    const widgetsSection = await page.$('div:has(> div:has-text("Latest News"))');
    if (widgetsSection) {
      await widgetsSection.scrollIntoViewIfNeeded();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'screenshots/03-news-posts-widgets.png', fullPage: true });
      
      // Capture just the news widget
      const newsWidget = await page.$('div:has(> div:has-text("Latest News"))');
      if (newsWidget) {
        await newsWidget.screenshot({ path: 'screenshots/04-news-widget.png' });
      }
      
      // Capture just the posts widget
      const postsWidget = await page.$('div:has(> div:has-text("Latest Posts"))');
      if (postsWidget) {
        await postsWidget.screenshot({ path: 'screenshots/05-posts-widget.png' });
      }
    }
    
    console.log('Screenshots captured successfully!');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
})();