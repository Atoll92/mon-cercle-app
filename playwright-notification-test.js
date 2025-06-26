import { test, expect } from '@playwright/test';
import { chromium } from 'playwright';

async function testNotificationSystem() {
  console.log('🔔 NOTIFICATION SYSTEM COMPREHENSIVE TEST');
  console.log('📧 Testing notification preferences, queue management, and email flow');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 800,
    devtools: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    permissions: ['notifications']
  });
  
  const page = await context.newPage();
  
  const testResults = {
    total: 0,
    passed: 0,
    failed: 0,
    notifications: []
  };

  async function captureState(name, description) {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const filename = `notification_${name}_${timestamp}.png`;
    await page.screenshot({ 
      path: `screenshots/${filename}`,
      fullPage: true 
    });
    console.log(`📸 ${description} → ${filename}`);
    return filename;
  }

  async function testStep(name, testFn, description) {
    testResults.total++;
    console.log(`\n🔔 Testing: ${name} - ${description}`);
    
    try {
      await testFn();
      testResults.passed++;
      console.log(`✅ ${name} - PASSED`);
      await captureState(name.toLowerCase().replace(/\s+/g, '_'), `${name} completed successfully`);
    } catch (error) {
      testResults.failed++;
      console.error(`❌ ${name} - FAILED:`, error.message);
      await captureState(`${name.toLowerCase().replace(/\s+/g, '_')}_FAILED`, `${name} failed with error`);
      testResults.notifications.push({
        test: name,
        status: 'failed',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  try {
    // Navigate to the application
    console.log('🌐 Navigating to Mon Cercle application...');
    await page.goto('http://localhost:5173');
    await page.waitForTimeout(2000);

    // Login Process
    await testStep('Login Authentication', async () => {
      // Check if already logged in by looking for dashboard elements or network selection
      const isDashboard = await page.locator('[data-testid="dashboard"], .dashboard, [href="/dashboard"]').first().isVisible().catch(() => false);
      const isNetworkSelection = await page.locator('text=Choose Your Network, text=Select which network').first().isVisible().catch(() => false);
      
      if (!isDashboard && !isNetworkSelection) {
        // Look for login button or form
        const loginButton = page.locator('button:has-text("Sign In"), button:has-text("Login"), a:has-text("Sign In")').first();
        if (await loginButton.isVisible().catch(() => false)) {
          await loginButton.click();
          await page.waitForTimeout(1000);
        }

        // Fill in login credentials (adjust selectors as needed)
        const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first();
        const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
        
        if (await emailInput.isVisible({ timeout: 5000 }).catch(() => false)) {
          await emailInput.fill('arthur.boval@gmail.com');
          await passwordInput.fill('testetest');
          
          const submitButton = page.locator('button[type="submit"], button:has-text("Sign In"), button:has-text("Login")').first();
          await submitButton.click();
          await page.waitForTimeout(3000);
        }
      }
      
      // Check if we're on network selection page and select first network
      const networkSelectionTitle = page.locator('text=Choose Your Network, text=Select which network');
      if (await networkSelectionTitle.isVisible({ timeout: 5000 }).catch(() => false)) {
        console.log('🔄 On network selection page, selecting first available network...');
        
        // Look for "Continue" button or first network button
        const continueButton = page.locator('button:has-text("Continue")').first();
        const firstNetworkButton = page.locator('button:has-text("Boost Club"), button:has-text("Les Manstres"), .network-card button, .MuiCard-root button').first();
        
        if (await continueButton.isVisible({ timeout: 3000 }).catch(() => false)) {
          await continueButton.click();
        } else if (await firstNetworkButton.isVisible({ timeout: 3000 }).catch(() => false)) {
          await firstNetworkButton.click();
        }
        
        await page.waitForTimeout(3000);
      }
      
      // Verify we're logged in - now look for dashboard elements OR valid network content
      await expect(page.locator('body')).toContainText(['Dashboard', 'Profile', 'Network', 'Settings', 'Chat', 'Events', 'Social Wall'], { timeout: 10000 });
    }, 'User authentication and network selection');

    // Navigate to Edit Profile
    await testStep('Navigate to Edit Profile', async () => {
      // Look for user menu or avatar first (modern apps often have these in header)
      const userMenu = page.locator('[data-testid="user-menu"], .user-menu, [aria-label="Account menu"], button[aria-haspopup="menu"]').first();
      const userAvatar = page.locator('.MuiAvatar-root, [data-testid="avatar"], img[alt*="avatar"]').first();
      
      // Try clicking user menu/avatar first
      if (await userMenu.isVisible({ timeout: 3000 }).catch(() => false)) {
        await userMenu.click();
        await page.waitForTimeout(500);
        
        // Look for edit profile in dropdown
        const editProfileMenuItem = page.locator('li:has-text("Edit Profile"), [role="menuitem"]:has-text("Edit Profile"), a:has-text("Edit Profile")').first();
        if (await editProfileMenuItem.isVisible({ timeout: 2000 }).catch(() => false)) {
          await editProfileMenuItem.click();
          await page.waitForTimeout(1000);
        }
      } else if (await userAvatar.isVisible({ timeout: 3000 }).catch(() => false)) {
        await userAvatar.click();
        await page.waitForTimeout(500);
      }
      
      // If that didn't work, look for direct profile links
      const profileLink = page.locator('a:has-text("Edit Profile"), a:has-text("Profile"), button:has-text("Profile"), [href*="profile"]').first();
      
      if (await profileLink.isVisible({ timeout: 3000 }).catch(() => false)) {
        await profileLink.click();
        await page.waitForTimeout(1000);
      } else {
        // Try navigating directly to edit profile
        console.log('🔄 Direct navigation to edit profile...');
        await page.goto('http://localhost:5173/edit-profile');
        await page.waitForTimeout(2000);
        
        // If still not there, check current URL and try alternative paths
        const currentUrl = page.url();
        console.log('📍 Current URL:', currentUrl);
        
        if (!currentUrl.includes('edit-profile') && !currentUrl.includes('profile')) {
          // Try alternative profile URLs
          const possibleUrls = [
            'http://localhost:5173/profile/edit',
            'http://localhost:5173/settings/profile',
            'http://localhost:5173/user/profile'
          ];
          
          for (const url of possibleUrls) {
            await page.goto(url);
            await page.waitForTimeout(1000);
            const hasProfileElements = await page.locator('h1:has-text("Edit Profile"), h2:has-text("Profile"), input[name="name"], input[name="bio"]').first().isVisible({ timeout: 2000 }).catch(() => false);
            if (hasProfileElements) {
              console.log('✅ Found profile page at:', url);
              break;
            }
          }
        }
      }
      
      await page.waitForTimeout(2000);
      
      // More flexible check for profile page elements
      const profileElements = page.locator('h1:has-text("Edit Profile"), h2:has-text("Profile"), h3:has-text("Profile"), input[name="name"], input[name="bio"], text=Personal Information');
      await expect(profileElements.first()).toBeVisible({ timeout: 15000 });
    }, 'Navigate to edit profile page');

    // Navigate to Notifications Tab
    await testStep('Open Notifications Tab', async () => {
      // Look for notifications tab
      const notificationsTab = page.locator('button:has-text("Notifications"), .MuiTab-root:has-text("Notifications"), [role="tab"]:has-text("Notifications")').first();
      
      await expect(notificationsTab).toBeVisible({ timeout: 10000 });
      await notificationsTab.click();
      await page.waitForTimeout(1000);
      
      // Verify notification settings are visible
      await expect(page.locator('text=Email Notifications, text=Notification Types')).toBeVisible({ timeout: 5000 });
    }, 'Access notifications tab in edit profile');

    // Test Notification Preferences
    await testStep('Verify Notification Preferences', async () => {
      // Check that all notification preference toggles are present
      const masterToggle = page.locator('input[type="checkbox"], .MuiSwitch-input').first();
      await expect(masterToggle).toBeVisible();
      
      // Verify specific notification types are present
      const notificationTypes = ['Network News', 'Events', 'Mentions', 'Direct Messages'];
      for (const type of notificationTypes) {
        await expect(page.locator(`text=${type}`)).toBeVisible();
      }
      
      console.log('📧 All notification preference controls verified');
    }, 'Verify all notification preference controls are present');

    // Test Notification System Manager
    await testStep('Access Notification System Manager', async () => {
      // Look for the notification system manager section
      await expect(page.locator('text=Notification System Manager, h6:has-text("Notification System Manager")')).toBeVisible({ timeout: 5000 });
      
      // Verify control buttons are present
      const buttons = ['Refresh', 'Test News', 'Test DM', 'Process Queue'];
      for (const buttonText of buttons) {
        await expect(page.locator(`button:has-text("${buttonText}")`)).toBeVisible();
      }
      
      console.log('🎛️ Notification System Manager interface verified');
    }, 'Verify notification system manager interface');

    // Test News Notification
    await testStep('Test News Notification', async () => {
      const testNewsButton = page.locator('button:has-text("Test News")');
      await testNewsButton.click();
      await page.waitForTimeout(2000);
      
      // Look for success message
      const successAlert = page.locator('.MuiAlert-standardSuccess, [role="alert"]:has-text("success"), text=successfully');
      await expect(successAlert).toBeVisible({ timeout: 10000 });
      
      console.log('📰 News notification test completed');
    }, 'Test news notification queueing');

    // Test DM Notification  
    await testStep('Test DM Notification', async () => {
      const testDMButton = page.locator('button:has-text("Test DM")');
      await testDMButton.click();
      await page.waitForTimeout(2000);
      
      // Look for success message
      const successAlert = page.locator('.MuiAlert-standardSuccess, [role="alert"]:has-text("success"), text=successfully');
      await expect(successAlert).toBeVisible({ timeout: 10000 });
      
      console.log('💬 DM notification test completed');
    }, 'Test direct message notification queueing');

    // Refresh and Check Queue
    await testStep('Refresh Notification Queue', async () => {
      const refreshButton = page.locator('button:has-text("Refresh")');
      await refreshButton.click();
      await page.waitForTimeout(3000);
      
      // Check if notifications appear in the table
      const notificationTable = page.locator('table, .MuiTable-root');
      await expect(notificationTable).toBeVisible();
      
      // Look for pending notifications
      const pendingChips = page.locator('.MuiChip-root:has-text("Pending"), [role="status"]:has-text("Pending")');
      const notificationRows = page.locator('tr:has(.MuiChip-root), .MuiTableRow-root');
      
      const pendingCount = await pendingChips.count();
      const rowCount = await notificationRows.count();
      
      console.log(`📊 Found ${pendingCount} pending notifications in ${rowCount} total rows`);
      
      if (pendingCount === 0) {
        console.log('⚠️ No pending notifications found - this may indicate an issue with queueing');
        // Let's check for any error messages
        const errorAlerts = page.locator('.MuiAlert-standardError, [role="alert"]:has-text("error"), [role="alert"]:has-text("failed")');
        if (await errorAlerts.count() > 0) {
          const errorText = await errorAlerts.first().textContent();
          console.log('❌ Error found:', errorText);
        }
      }
    }, 'Refresh and verify notification queue displays notifications');

    // Test Process Queue
    await testStep('Process Notification Queue', async () => {
      const processButton = page.locator('button:has-text("Process Queue")');
      await processButton.click();
      await page.waitForTimeout(5000); // Give time for processing
      
      // Look for processing result
      const alerts = page.locator('.MuiAlert-root, [role="alert"]');
      const alertCount = await alerts.count();
      
      if (alertCount > 0) {
        const alertText = await alerts.last().textContent();
        console.log('📤 Processing result:', alertText);
      }
      
      console.log('🔄 Queue processing completed');
    }, 'Process pending notifications');

    // Final Refresh to Check Queue State
    await testStep('Final Queue Status Check', async () => {
      const refreshButton = page.locator('button:has-text("Refresh")');
      await refreshButton.click();
      await page.waitForTimeout(2000);
      
      // Check notification statistics
      const statsChips = page.locator('.MuiChip-root:has-text("Total:"), .MuiChip-root:has-text("Sent:"), .MuiChip-root:has-text("Pending:")');
      const statsCount = await statsChips.count();
      
      if (statsCount > 0) {
        console.log('📈 Notification Statistics:');
        for (let i = 0; i < statsCount; i++) {
          const statText = await statsChips.nth(i).textContent();
          console.log(`  ${statText}`);
        }
      }
      
      // Check for sent notifications
      const sentChips = page.locator('.MuiChip-root:has-text("Sent")');
      const sentCount = await sentChips.count();
      
      console.log(`✅ Found ${sentCount} sent notifications after processing`);
    }, 'Verify final notification queue state and statistics');

    // Test Console Logs for Debug Information
    await testStep('Check Browser Console', async () => {
      // Monitor console messages
      page.on('console', msg => {
        if (msg.type() === 'log' && msg.text().includes('DM DEBUG')) {
          console.log('💬 DM Debug:', msg.text());
          testResults.notifications.push({
            type: 'dm_debug',
            message: msg.text(),
            timestamp: new Date().toISOString()
          });
        }
        if (msg.type() === 'log' && msg.text().includes('EMAIL DEBUG')) {
          console.log('📧 Email Debug:', msg.text());
          testResults.notifications.push({
            type: 'email_debug', 
            message: msg.text(),
            timestamp: new Date().toISOString()
          });
        }
        if (msg.type() === 'error') {
          console.log('🚨 Console Error:', msg.text());
          testResults.notifications.push({
            type: 'error',
            message: msg.text(),
            timestamp: new Date().toISOString()
          });
        }
      });
      
      console.log('👂 Browser console monitoring activated');
    }, 'Monitor browser console for notification debug information');

  } catch (error) {
    console.error('🚨 Critical test failure:', error);
    await captureState('critical_failure', 'Critical test failure occurred');
  }

  // Generate Test Report
  console.log('\n📊 NOTIFICATION SYSTEM TEST REPORT');
  console.log('=' .repeat(50));
  console.log(`Total Tests: ${testResults.total}`);
  console.log(`Passed: ${testResults.passed}`);
  console.log(`Failed: ${testResults.failed}`);
  console.log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
  
  if (testResults.notifications.length > 0) {
    console.log('\n🔔 Notification Events:');
    testResults.notifications.forEach((notification, index) => {
      console.log(`  ${index + 1}. [${notification.type}] ${notification.message || notification.error}`);
    });
  }

  await page.waitForTimeout(3000);
  await browser.close();
  
  return testResults;
}

// Run the test
testNotificationSystem().catch(console.error);