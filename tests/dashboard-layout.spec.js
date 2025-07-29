import { test, expect } from '@playwright/test';

test.describe('Dashboard Layout Tests', () => {
  test('upcoming events card should display next to profile card for non-admin members on medium+ screens', async ({ page }) => {
    // Set viewport to medium screen size
    await page.setViewportSize({ width: 1024, height: 768 });
    
    // Navigate to login page first
    await page.goto('http://localhost:5173/login');
    
    // TODO: Add your non-admin test credentials here
    // await page.fill('input[name="email"]', 'test-member@example.com');
    // await page.fill('input[name="password"]', 'password');
    // await page.click('button[type="submit"]');
    
    // Wait for navigation to dashboard
    // await page.waitForURL('**/dashboard');
    
    // Wait for the profile card to be visible
    await page.goto('http://localhost:5173/dashboard');
    await page.waitForSelector('[data-testid="profile-card"], .MuiCard-root', { timeout: 10000 });
    
    // Get the profile card element
    const profileCard = await page.locator('.MuiGrid-item').filter({ has: page.locator('text=/Profile|Email/i') }).first();
    
    // Get the upcoming events card element
    const eventsCard = await page.locator('.MuiGrid-item').filter({ has: page.locator('text=/Upcoming Events/i') }).first();
    
    // Check if both cards exist
    const profileCardExists = await profileCard.count() > 0;
    const eventsCardExists = await eventsCard.count() > 0;
    
    console.log('Profile card exists:', profileCardExists);
    console.log('Events card exists:', eventsCardExists);
    
    if (profileCardExists && eventsCardExists) {
      // Get bounding boxes
      const profileBox = await profileCard.boundingBox();
      const eventsBox = await eventsCard.boundingBox();
      
      console.log('Profile card position:', profileBox);
      console.log('Events card position:', eventsBox);
      
      // Check if they are side by side (events card should be to the right of profile card)
      expect(eventsBox.x).toBeGreaterThan(profileBox.x + profileBox.width - 50); // Allow some margin
      
      // Check if they are roughly at the same vertical position
      expect(Math.abs(eventsBox.y - profileBox.y)).toBeLessThan(50); // Allow some vertical difference
      
      // Take a screenshot for visual debugging
      await page.screenshot({ path: 'dashboard-layout.png', fullPage: true });
    }
    
    // Also check the Grid container structure
    const flexFlowBox = await page.locator('.MuiGrid-container, [class*="FlexFlowBox"]').first();
    const flexDirection = await flexFlowBox.evaluate(el => window.getComputedStyle(el).flexDirection);
    const flexWrap = await flexFlowBox.evaluate(el => window.getComputedStyle(el).flexWrap);
    
    console.log('Container flex-direction:', flexDirection);
    console.log('Container flex-wrap:', flexWrap);
    
    // Check Grid items
    const gridItems = await page.locator('.MuiGrid-item').all();
    for (let i = 0; i < gridItems.length; i++) {
      const item = gridItems[i];
      const width = await item.evaluate(el => window.getComputedStyle(el).width);
      const flex = await item.evaluate(el => window.getComputedStyle(el).flex);
      const textContent = await item.textContent();
      console.log(`Grid item ${i}: width=${width}, flex=${flex}, content preview="${textContent.substring(0, 50)}..."`);
    }
  });
  
  test('debug dashboard layout structure', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('http://localhost:5173/dashboard');
    
    // Wait for content to load
    await page.waitForTimeout(3000);
    
    // Debug the FlexFlowBox structure
    const hasFlexFlowBox = await page.locator('div').filter({ hasText: 'FlexFlowBox' }).count() > 0;
    console.log('Has FlexFlowBox:', hasFlexFlowBox);
    
    // Find the main container
    const mainContainer = await page.locator('[class*="MuiGrid-container"]').first();
    const containerStyles = await mainContainer.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        display: styles.display,
        flexDirection: styles.flexDirection,
        flexWrap: styles.flexWrap,
        width: styles.width,
        gap: styles.gap
      };
    });
    console.log('Main container styles:', containerStyles);
    
    // Find profile and events cards with more specific selectors
    const profileCardGrid = await page.locator('.MuiGrid-item').filter({ 
      has: page.locator('.MuiCard-root').filter({ has: page.locator('text=/Email:|Profile/i') })
    }).first();
    
    const eventsCardGrid = await page.locator('.MuiGrid-item').filter({ 
      has: page.locator('.MuiCard-root').filter({ has: page.locator('text=/Upcoming Events/i') })
    }).first();
    
    if (await profileCardGrid.count() > 0) {
      const profileGridStyles = await profileCardGrid.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          width: styles.width,
          maxWidth: styles.maxWidth,
          flex: styles.flex,
          flexBasis: styles.flexBasis,
          display: styles.display,
          position: styles.position
        };
      });
      console.log('Profile Grid Item styles:', profileGridStyles);
    }
    
    if (await eventsCardGrid.count() > 0) {
      const eventsGridStyles = await eventsCardGrid.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          width: styles.width,
          maxWidth: styles.maxWidth,
          flex: styles.flex,
          flexBasis: styles.flexBasis,
          display: styles.display,
          position: styles.position
        };
      });
      console.log('Events Grid Item styles:', eventsGridStyles);
    }
    
    // Take screenshot with annotations
    await page.screenshot({ path: 'dashboard-layout-debug.png', fullPage: true });
  });
});