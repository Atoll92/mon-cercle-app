import { test, expect } from '@playwright/test';
import { chromium } from 'playwright';
import { mkdir } from 'fs/promises';

async function comprehensiveAuthenticatedTesting() {
  console.log('🧘‍♂️ ZEN AUTHENTICATED COMPREHENSIVE PLATFORM TEST');
  console.log('🔐 Testing all interactions with proper authentication');
  console.log('📸 Screenshots will be saved to screenshots/authenticated/ folder');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1200,
    devtools: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    recordVideo: { dir: 'screenshots/authenticated/videos' },
    permissions: ['notifications', 'geolocation', 'camera', 'microphone']
  });
  
  const page = await context.newPage();
  
  // Comprehensive test state
  const testResults = {
    total: 0,
    passed: 0,
    failed: 0,
    interactions: [],
    networkFeatures: [],
    tabs: []
  };

  async function captureState(name, description, subfolder = '') {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const path = subfolder ? `screenshots/authenticated/${subfolder}` : 'screenshots/authenticated';
    const filename = `${name}_${timestamp}.png`;
    await page.screenshot({ 
      path: `${path}/${filename}`,
      fullPage: true 
    });
    console.log(`📸 ${description} → ${filename}`);
    return filename;
  }

  async function testInteraction(name, testFn, description, subfolder = '') {
    testResults.total++;
    console.log(`\n🧘 Testing: ${name} - ${description}`);
    
    try {
      await testFn();
      testResults.passed++;
      testResults.interactions.push({ name, status: 'PASSED', description });
      console.log(`✅ PASSED: ${name}`);
      await captureState(`success_${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`, `Success: ${name}`, subfolder);
    } catch (error) {
      testResults.failed++;
      testResults.interactions.push({ name, status: 'FAILED', description, error: error.message });
      console.log(`❌ FAILED: ${name} - ${error.message}`);
      await captureState(`failed_${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`, `Failed: ${name}`, subfolder);
    }
    
    await page.waitForTimeout(1500);
  }

  async function deepTestTab(tabName, tabElement) {
    console.log(`\n🎯 DEEP TESTING TAB: ${tabName}`);
    
    try {
      // Click the tab
      await tabElement.click();
      await page.waitForTimeout(4000);
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
      
      // Capture initial tab state
      await captureState(`tab_${tabName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_initial`, `${tabName} tab initial state`, 'tabs');
      
      const tabTests = [];
      
      // Test based on tab type
      const lowerTabName = tabName.toLowerCase();
      
      if (lowerTabName.includes('chat') || lowerTabName.includes('discussion')) {
        tabTests.push(
          ['Chat Input', async () => {
            const chatInputs = await page.$$('input[placeholder*="message"], input[placeholder*="Message"], textarea[placeholder*="message"], textarea[placeholder*="Message"], .chat-input input, .message-input input, [data-testid="chat-input"]');
            if (chatInputs.length > 0) {
              await chatInputs[0].fill('🧘 Test message from Playwright automation');
              await page.waitForTimeout(1000);
              
              // Try to send
              const sendButtons = await page.$$('button:has-text("Send"), button[aria-label*="send"], .send-button, [data-testid="send-button"]');
              if (sendButtons.length > 0) {
                await sendButtons[0].click();
                await page.waitForTimeout(2000);
              } else {
                await page.keyboard.press('Enter');
                await page.waitForTimeout(2000);
              }
              console.log('✅ Chat message sent successfully');
            } else {
              console.log('ℹ️ No chat input found');
            }
          }],
          ['Chat History', async () => {
            const messages = await page.$$('.message, .chat-message, [data-testid="message"]');
            console.log(`Found ${messages.length} chat messages`);
          }],
          ['Chat Features', async () => {
            const features = await page.$$('button[aria-label*="attach"], button[aria-label*="emoji"], .attachment-button, .emoji-button');
            console.log(`Found ${features.length} chat features (attach/emoji/etc)`);
          }]
        );
      }
      
      if (lowerTabName.includes('member') || lowerTabName.includes('user')) {
        tabTests.push(
          ['Member List', async () => {
            const members = await page.$$('.member-card, .user-card, .member-item, [data-testid="member"]');
            console.log(`Found ${members.length} members`);
            
            // Try to interact with first member
            if (members.length > 0) {
              await members[0].click();
              await page.waitForTimeout(2000);
              
              // Check if modal opened
              const modal = await page.$('[role="dialog"], .modal, .MuiDialog-root');
              if (modal) {
                await captureState(`member_modal_${tabName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`, 'Member details modal', 'tabs');
                
                // Close modal
                const closeBtn = await page.$('[aria-label="close"], button:has-text("Close"), .close-button');
                if (closeBtn) {
                  await closeBtn.click();
                } else {
                  await page.keyboard.press('Escape');
                }
                await page.waitForTimeout(1000);
              }
            }
          }],
          ['Member Actions', async () => {
            const actionButtons = await page.$$('button:has-text("Invite"), button:has-text("Add"), button:has-text("Message"), .action-button');
            console.log(`Found ${actionButtons.length} member action buttons`);
          }]
        );
      }
      
      if (lowerTabName.includes('event')) {
        tabTests.push(
          ['Event List', async () => {
            const events = await page.$$('.event-card, .event-item, [data-testid="event"]');
            console.log(`Found ${events.length} events`);
            
            // Try to click on first event
            if (events.length > 0) {
              await events[0].click();
              await page.waitForTimeout(2000);
            }
          }],
          ['Create Event', async () => {
            const createButtons = await page.$$('button:has-text("Create"), button:has-text("Add Event"), .create-event-button');
            if (createButtons.length > 0) {
              await createButtons[0].click();
              await page.waitForTimeout(2000);
              
              // Check if form opened
              const form = await page.$('form, [role="dialog"], .event-form');
              if (form) {
                await captureState(`create_event_form_${tabName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`, 'Create event form', 'tabs');
                
                // Close form
                const cancelBtn = await page.$('button:has-text("Cancel"), button:has-text("Close")');
                if (cancelBtn) {
                  await cancelBtn.click();
                } else {
                  await page.keyboard.press('Escape');
                }
              }
            }
          }],
          ['Event Calendar', async () => {
            const calendar = await page.$('.calendar, .event-calendar, [data-testid="calendar"]');
            if (calendar) {
              console.log('✅ Calendar component found');
            }
          }]
        );
      }
      
      if (lowerTabName.includes('news') || lowerTabName.includes('feed')) {
        tabTests.push(
          ['News Posts', async () => {
            const posts = await page.$$('.news-item, .post-card, .news-post, [data-testid="news-post"]');
            console.log(`Found ${posts.length} news posts`);
            
            // Try to interact with posts
            for (let i = 0; i < Math.min(posts.length, 3); i++) {
              const post = posts[i];
              
              // Look for like/comment buttons
              const likeBtn = await post.$('button[aria-label*="like"], .like-button, button:has-text("👍")');
              if (likeBtn) {
                await likeBtn.click();
                await page.waitForTimeout(500);
                console.log(`✅ Liked post ${i + 1}`);
              }
              
              const commentBtn = await post.$('button[aria-label*="comment"], .comment-button, button:has-text("Comment")');
              if (commentBtn) {
                await commentBtn.click();
                await page.waitForTimeout(1000);
                
                // Try to add comment
                const commentInput = await page.$('input[placeholder*="comment"], textarea[placeholder*="comment"]');
                if (commentInput) {
                  await commentInput.fill('🧘 Automated test comment');
                  await page.keyboard.press('Enter');
                  await page.waitForTimeout(1000);
                  console.log(`✅ Added comment to post ${i + 1}`);
                }
              }
            }
          }],
          ['Create News Post', async () => {
            const createButtons = await page.$$('button:has-text("Create"), button:has-text("New Post"), button:has-text("Add")');
            if (createButtons.length > 0) {
              await createButtons[0].click();
              await page.waitForTimeout(2000);
              
              const form = await page.$('form, [role="dialog"], .post-form');
              if (form) {
                await captureState(`create_news_form_${tabName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`, 'Create news form', 'tabs');
                
                // Fill form if possible
                const titleInput = await page.$('input[placeholder*="title"], input[name="title"]');
                const contentInput = await page.$('textarea[placeholder*="content"], textarea[name="content"], .editor');
                
                if (titleInput) {
                  await titleInput.fill('🧘 Automated Test Post');
                }
                if (contentInput) {
                  await contentInput.fill('This is an automated test post created by Playwright for comprehensive testing.');
                }
                
                await page.waitForTimeout(1000);
                
                // Close without saving
                const cancelBtn = await page.$('button:has-text("Cancel"), button:has-text("Close")');
                if (cancelBtn) {
                  await cancelBtn.click();
                } else {
                  await page.keyboard.press('Escape');
                }
              }
            }
          }]
        );
      }
      
      if (lowerTabName.includes('file') || lowerTabName.includes('document')) {
        tabTests.push(
          ['File List', async () => {
            const files = await page.$$('.file-item, .file-card, [data-testid="file"]');
            console.log(`Found ${files.length} files`);
            
            // Try to preview files
            for (let i = 0; i < Math.min(files.length, 3); i++) {
              const file = files[i];
              await file.click();
              await page.waitForTimeout(2000);
              
              // Check if preview opened
              const preview = await page.$('.file-preview, .preview-modal, [role="dialog"]');
              if (preview) {
                await captureState(`file_preview_${i}_${tabName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`, `File ${i + 1} preview`, 'tabs');
                
                // Close preview
                const closeBtn = await page.$('[aria-label="close"], button:has-text("Close")');
                if (closeBtn) {
                  await closeBtn.click();
                } else {
                  await page.keyboard.press('Escape');
                }
                await page.waitForTimeout(1000);
              }
            }
          }],
          ['File Upload', async () => {
            const uploadButtons = await page.$$('button:has-text("Upload"), input[type="file"], .upload-button');
            console.log(`Found ${uploadButtons.length} upload elements`);
            
            if (uploadButtons.length > 0) {
              // Don't actually upload, just test the button
              const button = uploadButtons[0];
              const tagName = await button.evaluate(el => el.tagName);
              console.log(`Upload element type: ${tagName}`);
            }
          }]
        );
      }
      
      if (lowerTabName.includes('wiki') || lowerTabName.includes('knowledge')) {
        tabTests.push(
          ['Wiki Pages', async () => {
            const wikiPages = await page.$$('.wiki-page, .wiki-item, [data-testid="wiki-page"]');
            console.log(`Found ${wikiPages.length} wiki pages`);
            
            // Try to open first wiki page
            if (wikiPages.length > 0) {
              await wikiPages[0].click();
              await page.waitForTimeout(2000);
            }
          }],
          ['Wiki Categories', async () => {
            const categories = await page.$$('.wiki-category, .category-item, [data-testid="wiki-category"]');
            console.log(`Found ${categories.length} wiki categories`);
          }],
          ['Create Wiki Page', async () => {
            const createButtons = await page.$$('button:has-text("Create"), button:has-text("New Page"), .create-wiki-button');
            if (createButtons.length > 0) {
              await createButtons[0].click();
              await page.waitForTimeout(2000);
              
              const editor = await page.$('.editor, textarea, [data-testid="wiki-editor"]');
              if (editor) {
                await captureState(`wiki_editor_${tabName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`, 'Wiki page editor', 'tabs');
                
                // Close editor
                const cancelBtn = await page.$('button:has-text("Cancel"), button:has-text("Close")');
                if (cancelBtn) {
                  await cancelBtn.click();
                } else {
                  await page.keyboard.press('Escape');
                }
              }
            }
          }]
        );
      }
      
      if (lowerTabName.includes('social') || lowerTabName.includes('wall')) {
        tabTests.push(
          ['Social Posts', async () => {
            const posts = await page.$$('.social-post, .wall-item, .post-card, [data-testid="social-post"]');
            console.log(`Found ${posts.length} social wall posts`);
            
            // Test social interactions
            for (let i = 0; i < Math.min(posts.length, 2); i++) {
              const post = posts[i];
              
              // Like post
              const likeBtn = await post.$('button[aria-label*="like"], .like-button');
              if (likeBtn) {
                await likeBtn.click();
                await page.waitForTimeout(500);
              }
              
              // Share post
              const shareBtn = await post.$('button[aria-label*="share"], .share-button');
              if (shareBtn) {
                await shareBtn.click();
                await page.waitForTimeout(1000);
                
                // Close share modal if opened
                const modal = await page.$('[role="dialog"]');
                if (modal) {
                  await page.keyboard.press('Escape');
                }
              }
            }
          }],
          ['Social Interactions', async () => {
            const interactionButtons = await page.$$('button[aria-label*="like"], button[aria-label*="share"], button[aria-label*="comment"]');
            console.log(`Found ${interactionButtons.length} social interaction buttons`);
          }]
        );
      }
      
      if (lowerTabName.includes('about') || lowerTabName.includes('info')) {
        tabTests.push(
          ['Network Information', async () => {
            const infoSections = await page.$$('.info-section, .about-section, [data-testid="network-info"]');
            console.log(`Found ${infoSections.length} information sections`);
          }],
          ['Network Settings', async () => {
            const settingButtons = await page.$$('button:has-text("Edit"), button:has-text("Settings"), .settings-button');
            console.log(`Found ${settingButtons.length} settings buttons`);
          }]
        );
      }
      
      // Execute all tab-specific tests
      for (const [testName, testFn] of tabTests) {
        await testInteraction(`${tabName} - ${testName}`, testFn, `Test ${testName} in ${tabName} tab`, 'tabs');
      }
      
      // Capture final tab state
      await captureState(`tab_${tabName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_final`, `${tabName} tab final state`, 'tabs');
      
      testResults.tabs.push({
        name: tabName,
        testsCount: tabTests.length,
        features: tabTests.map(([name]) => name)
      });
      
    } catch (error) {
      console.log(`⚠️ Error testing tab ${tabName}: ${error.message}`);
      await captureState(`tab_error_${tabName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`, `${tabName} tab error state`, 'tabs');
    }
  }

  try {
    // Ensure screenshots directory exists
    await mkdir('screenshots/authenticated', { recursive: true });
    await mkdir('screenshots/authenticated/videos', { recursive: true });
    await mkdir('screenshots/authenticated/tabs', { recursive: true });
    
    console.log('\n🌟 PHASE 1: AUTHENTICATION FLOW');
    
    // Test 1: Go to login page
    await testInteraction('Navigate to Login', async () => {
      await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);
      
      // Check if already on login page or needs navigation
      const loginForm = await page.$('input[name="email"], input[type="email"]');
      if (!loginForm) {
        // Look for login button/link
        const loginBtn = await page.$('button:has-text("Login"), a:has-text("Login"), button:has-text("Sign In"), a:has-text("Sign In")');
        if (loginBtn) {
          await loginBtn.click();
          await page.waitForTimeout(2000);
        }
      }
    }, 'Navigate to login page');

    // Test 2: Complete Authentication
    await testInteraction('User Authentication', async () => {
      // Wait for login form to be ready
      await page.waitForSelector('input[name="email"], input[type="email"]', { timeout: 10000 });
      await page.waitForTimeout(1000);
      
      // Fill credentials exactly as provided
      await page.fill('input[name="email"]', 'arthur.boval@gmail.com');
      await page.fill('input[type="password"]', 'testetest');
      await page.click('button:has-text("SIGN IN")');
      
      // Wait for authentication to complete
      await page.waitForTimeout(5000);
      await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
      
      // Verify we're logged in
      const currentUrl = page.url();
      console.log(`Post-login URL: ${currentUrl}`);
      
      // Look for signs of successful login
      const loggedInIndicators = await page.$$('.user-menu, .profile-button, .logout-button, .dashboard, .network-selector');
      if (loggedInIndicators.length === 0) {
        throw new Error('No logged-in indicators found');
      }
      
      console.log(`✅ Login successful - found ${loggedInIndicators.length} logged-in indicators`);
    }, 'Complete user authentication');

    console.log('\n🌟 PHASE 2: NETWORK SELECTION & ACCESS');

    // Test 3: Access Network Selection
    await testInteraction('Network Selection Access', async () => {
      // Try to navigate to network selection if not already there
      if (!page.url().includes('/network')) {
        await page.goto('http://localhost:5173/network', { waitUntil: 'networkidle' });
      }
      await page.waitForTimeout(3000);
      
      // Look for network cards
      const networkCards = await page.$$('.network-card, [data-testid="network-card"], .MuiCard-root, .network-item');
      console.log(`Found ${networkCards.length} available networks`);
      
      if (networkCards.length === 0) {
        throw new Error('No network cards found');
      }
    }, 'Access network selection page');

    // Test 4: Enter Network
    await testInteraction('Network Entry', async () => {
      const networkCards = await page.$$('.network-card, [data-testid="network-card"], .MuiCard-root, .network-item');
      
      if (networkCards.length > 0) {
        // Click first available network
        await networkCards[0].click();
        await page.waitForTimeout(2000);
        
        // Look for continue/enter button
        const continueBtn = await page.$('button:has-text("CONTINUE"), button:has-text("Continue"), button:has-text("Enter"), button:has-text("JOIN")');
        if (continueBtn) {
          await continueBtn.click();
          await page.waitForTimeout(5000);
        }
        
        // Wait for network interface to load
        await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
        
        console.log(`✅ Successfully entered network - URL: ${page.url()}`);
      }
    }, 'Enter selected network');

    console.log('\n🌟 PHASE 3: COMPREHENSIVE TAB DISCOVERY & TESTING');

    // Test 5: Discover All Available Tabs
    await testInteraction('Complete Tab Discovery', async () => {
      await page.waitForTimeout(3000);
      
      // Multiple strategies to find tabs with more specific selectors
      const tabStrategies = [
        '[role="tab"]',
        '.MuiTab-root',
        '.MuiTabs-flexContainer button',
        '.MuiTabs-flexContainer [role="tab"]',
        'nav button',
        '.tab-button',
        '.navigation-tab',
        'button[aria-selected]',
        '.tab-container button',
        '.tabs-wrapper button',
        '[data-testid*="tab"]',
        'button[data-tab]',
        // Network-specific tab patterns
        'button:has-text("Members")',
        'button:has-text("Events")', 
        'button:has-text("News")',
        'button:has-text("Chat")',
        'button:has-text("Files")',
        'button:has-text("Wiki")',
        'button:has-text("About")',
        'button:has-text("Social")',
        'button:has-text("Moodboard")',
        'button:has-text("Timeline")',
        'button:has-text("Gallery")',
        'button:has-text("Settings")'
      ];
      
      let allTabs = [];
      for (const strategy of tabStrategies) {
        try {
          const tabs = await page.$$(strategy);
          for (const tab of tabs) {
            const isVisible = await tab.isVisible();
            const isEnabled = await tab.isEnabled();
            if (isVisible && isEnabled) {
              allTabs.push(tab);
            }
          }
        } catch (error) {
          // Continue with next strategy
        }
      }
      
      // Remove duplicates by text content
      const uniqueTabs = [];
      const seenTexts = new Set();
      
      for (const tab of allTabs) {
        try {
          const text = await tab.textContent();
          const cleanText = text?.trim();
          if (cleanText && !seenTexts.has(cleanText) && cleanText.length > 0) {
            uniqueTabs.push({ element: tab, text: cleanText });
            seenTexts.add(cleanText);
          }
        } catch (error) {
          // Skip this tab
        }
      }
      
      console.log(`Found ${uniqueTabs.length} unique tabs: ${uniqueTabs.map(t => t.text).join(', ')}`);
      
      if (uniqueTabs.length === 0) {
        throw new Error('No tabs discovered');
      }
      
      // Store tabs for comprehensive testing
      page.discoveredTabs = uniqueTabs;
      
    }, 'Discover all available network tabs');

    // Test 6-N: Comprehensive Tab Testing
    if (page.discoveredTabs && page.discoveredTabs.length > 0) {
      console.log(`\n🎯 TESTING ${page.discoveredTabs.length} DISCOVERED TABS:`);
      
      for (let i = 0; i < page.discoveredTabs.length; i++) {
        const tab = page.discoveredTabs[i];
        console.log(`\n${'='.repeat(60)}`);
        console.log(`🎯 TAB ${i + 1}/${page.discoveredTabs.length}: ${tab.text}`);
        console.log(`${'='.repeat(60)}`);
        
        await deepTestTab(tab.text, tab.element);
        
        // Brief pause between tabs
        await page.waitForTimeout(2000);
      }
    }

    console.log('\n🌟 PHASE 4: CROSS-TAB FUNCTIONALITY TESTING');

    // Test comprehensive cross-tab features
    await testInteraction('Navigation Consistency', async () => {
      // Test that tabs remain accessible after interactions
      if (page.discoveredTabs) {
        let accessibleTabs = 0;
        for (const tab of page.discoveredTabs) {
          try {
            const isVisible = await tab.element.isVisible();
            const isEnabled = await tab.element.isEnabled();
            if (isVisible && isEnabled) {
              accessibleTabs++;
            }
          } catch (error) {
            // Tab might have been detached
          }
        }
        console.log(`${accessibleTabs}/${page.discoveredTabs.length} tabs remain accessible`);
      }
    }, 'Test navigation consistency across tabs');

    console.log('\n🌟 PHASE 5: COMPREHENSIVE FEATURE TESTING');

    // Test global features
    await testInteraction('Global Search', async () => {
      const searchInputs = await page.$$('input[placeholder*="search"], input[placeholder*="Search"], .search-input, [data-testid="search"]');
      if (searchInputs.length > 0) {
        await searchInputs[0].fill('test search query');
        await page.keyboard.press('Enter');
        await page.waitForTimeout(2000);
        console.log('✅ Global search tested');
      } else {
        console.log('ℹ️ No global search found');
      }
    }, 'Test global search functionality');

    await testInteraction('User Profile Access', async () => {
      const profileButtons = await page.$$('.profile-button, .user-menu, [aria-label*="profile"], [data-testid="profile"]');
      if (profileButtons.length > 0) {
        await profileButtons[0].click();
        await page.waitForTimeout(2000);
        
        const profileMenu = await page.$('.profile-menu, .user-dropdown, [role="menu"]');
        if (profileMenu) {
          await captureState('user_profile_menu', 'User profile menu opened', 'features');
          
          // Close menu
          await page.keyboard.press('Escape');
        }
        console.log('✅ User profile access tested');
      } else {
        console.log('ℹ️ No profile button found');
      }
    }, 'Test user profile access');

    await testInteraction('Notifications', async () => {
      const notificationButtons = await page.$$('.notification-button, [aria-label*="notification"], .bell-icon, [data-testid="notifications"]');
      if (notificationButtons.length > 0) {
        await notificationButtons[0].click();
        await page.waitForTimeout(2000);
        
        const notificationPanel = await page.$('.notification-panel, .notifications-dropdown, [role="menu"]');
        if (notificationPanel) {
          await captureState('notifications_panel', 'Notifications panel opened', 'features');
          
          // Close panel
          await page.keyboard.press('Escape');
        }
        console.log('✅ Notifications tested');
      } else {
        console.log('ℹ️ No notification button found');
      }
    }, 'Test notifications system');

    // Final comprehensive screenshot
    await captureState('final_authenticated_state', 'Final authenticated application state');

  } catch (error) {
    console.error('🚨 Critical error during authenticated testing:', error);
    await captureState('critical_error_authenticated', 'Critical error state during authenticated testing');
  }

  // Generate comprehensive test report
  console.log('\n' + '='.repeat(80));
  console.log('📊 COMPREHENSIVE AUTHENTICATED TEST RESULTS');
  console.log('='.repeat(80));
  console.log(`Total Tests: ${testResults.total}`);
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`🎯 Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
  console.log('='.repeat(80));

  if (testResults.tabs.length > 0) {
    console.log('\n📋 TABS TESTED:');
    testResults.tabs.forEach((tab, index) => {
      console.log(`${index + 1}. ${tab.name} (${tab.testsCount} tests)`);
      console.log(`   Features: ${tab.features.join(', ')}`);
    });
  }

  console.log('\n📋 DETAILED RESULTS:');
  testResults.interactions.forEach((interaction, index) => {
    console.log(`${index + 1}. ${interaction.status === 'PASSED' ? '✅' : '❌'} ${interaction.name}`);
    console.log(`   ${interaction.description}`);
    if (interaction.error) {
      console.log(`   Error: ${interaction.error}`);
    }
  });

  console.log('\n🧘‍♂️ Comprehensive authenticated testing complete.');
  console.log('📁 All screenshots and videos saved to screenshots/authenticated/ folder');
  await page.waitForTimeout(3000);
  
  await browser.close();
  console.log('🎯 Authentication-based comprehensive testing complete!');
  
  return testResults;
}

// Run the comprehensive authenticated test
console.log('🚀 Starting Comprehensive Authenticated Platform Testing');
console.log('🔐 With proper authentication and zen awareness');
comprehensiveAuthenticatedTesting().catch(console.error);