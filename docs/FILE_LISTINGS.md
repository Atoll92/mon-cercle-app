# Conclav File Listings

This document contains detailed file listings for the Conclav codebase, organized by category.

## Pages (`src/pages/`)
- `LandingPage.jsx` - Public landing page
- `LoginPage.jsx` - User authentication
- `SignupPage.jsx` - User registration
- `DashboardPage.jsx` - User dashboard
- `DirectMessagesPage.jsx` - Direct messaging interface (dark mode ready)
- `NetworkLandingPage.jsx` - Network-specific landing
- `NetworkAdminPage.jsx` - Network administration
- `ProfilePage.jsx` - User profile management
- `EditProfilePage.jsx` - Profile editing
- `EventPage.jsx` - Event details
- `WikiPage.jsx` - Wiki content display
- `WikiEditPage.jsx` - Wiki page editor
- `WikiListPage.jsx` - Wiki page listing
- `MoodboardPage.jsx` - Moodboard interface
- `PersonalMoodboardPage.jsx` - Personal moodboard page
- `SuperAdminDashboard.jsx` - System administration
- `PricingPage.jsx` - Subscription plans
- `BillingPage.jsx` - Billing management
- `PaymentSuccessPage.jsx` - Payment confirmation page
- `JoinNetworkPage.jsx` - Network joining flow
- `NetworkOnboardingPage.jsx` - Network setup flow
- `NewsPostPage.jsx` - Individual news post view
- `PasswordResetPage.jsx` - Password reset flow
- `PasswordUpdatePage.jsx` - Password update form
- `SharedFilesPage.jsx` - Shared files browser
- `TermsPage.jsx` - Terms of service page
- `NotFoundPage.jsx` - 404 error page
- `DemoPage.jsx` - Feature demo page
- `MediaTest.jsx` - Media feature testing
- `MicroConclavPage.jsx` - Micro-conclav feature page
- `ShimmeringTextPage.jsx` - Text animation demo
- `SimpleLandingPage.jsx` - Alternative landing page
- `DocumentationPage.jsx` - Help center with FAQ and user guides
- `EnhancedLandingPage.jsx` - Modern privacy-focused landing page with advanced animations
- `PostPage.jsx` - Individual portfolio post page with full content display
- `AlternativeLandingPage.jsx` - Alternative landing page design
- `NewLandingPage.jsx` - New landing page variant
- `NewLandingPage2.jsx` - Another landing page variant

## API Layer (`src/api/`)
- `auth.jsx` - Authentication functions
- `networks.jsx` - Network CRUD operations
- `directMessages.js` - Direct messaging API with conversation deletion support
- `moodboards.jsx` - Moodboard operations
- `polls.js` - Polling system
- `invitations.js` - Invitation management
- `superAdmin.js` - Admin dashboard API
- `comments.js` - Social wall comments system (add, fetch, delete, toggle visibility)
- `tickets.js` - Support ticket system (create, update, view, message)
- `profiles.js` - **Multiple profile system with user-network profile management** (CRUD, preferences, subscriptions, active profile selection)
- `wiki.js` - Wiki page operations (CRUD, categories, comments, revisions)
- `events.js` - Event participation management and statistics
- `posts.js` - Portfolio post management (create, update with media support and notifications)
- `badges.js` - Engagement badges system (create, award, track user stats)
- `categories.js` - Wiki category management

## Services (`src/services/`)
- `emailNotificationService.js` - Email notification queue
- `networkFiles.js` - File management
- `opengraphService.js` - Enhanced URL preview generation with multiple proxy support and better fallbacks
- `stripeService.js` - Payment processing
- `subscriptionService.js` - Subscription management

## Context Providers (`src/context/`)
- `authcontext.jsx` - Authentication state management
- `profileContext.jsx` - **Multiple profiles management and active profile selection**
- `networkContext.jsx` - Network data management
- `directMessagesContext.jsx` - Direct messaging state
- `appContext.jsx` - Lightweight context for network ID and loading state

## Admin Components (`src/components/admin/`)
- `AdminLayout.jsx` - Admin interface layout (80px header)
- `AdminBreadcrumbs.jsx` - Navigation breadcrumbs
- `MembersTab.jsx` - Member management (integrated invitations, badges display)
- `EventsTab.jsx` - Event administration
- `InvitationLinksTab.jsx` - Invitation link management
- `ModerationTab.jsx` - Content moderation
- `MonetizationTab.jsx` - Billing management
- `BillingTab.jsx` - Subscription and billing management panel
- `BadgesTab.jsx` - Engagement badges management and user activity tracking
- `NetworkInfoPanel.jsx` - Network statistics (with storage tracking)
- `NetworkSettingsTab.jsx` - Network configuration
- `Newstab.jsx` - News administration
- `NotificationQueueTab.jsx` - Email queue monitoring
- `PollsTab.jsx` - Poll management
- `ThemeTab.jsx` - Theme customization
- `BatchInviteModal.jsx` - Bulk invitations
- `SupportTicketsTab.jsx` - Support ticket management for network admins

## Utilities (`src/utils/`)
- `mediaUpload.js` - Media file handling
- `animationHelpers.js` - Animation utilities
- `logger.js` - Application logging utility
- `moodboardHelpers.js` - Moodboard manipulation helpers
- `passwordValidation.js` - Password strength validation
- `sanitizeHtml.js` - HTML sanitization for user content
- `errorHandling.js` - Centralized error handling utilities (handleArrayError, handleObjectError, logError)
- `icsGenerator.js` - ICS calendar file generation for event invitations
- `apiHelpers.js` - API utility functions
- `dateFormatting.js` - Date formatting utilities (formatTimeAgo, etc.)
- `mediaDetection.js` - Media type detection utilities
- `textFormatting.js` - Text formatting utilities

## Hooks (`src/hooks/`)
- `useAnimation.js` - Animation hook
- `useScrollAnimation.js` - Scroll-based animations
- `useMoodboardCanvas.js` - Moodboard canvas interaction hook
- `useRealtimeChannel.js` - Supabase realtime subscription hook
- `useNetworkRefresh.js` - Global event emitter for network data refreshes
- `useWheelHandler.js` - Canvas wheel event handling
- `useSupabaseQuery.js` - Supabase query wrapper hook

## Supabase Edge Functions (`supabase/functions/`)
See [Functions Documentation](../functions.db) for complete details:
- `_shared/cors.ts` - Shared CORS configuration for all functions
- `create-checkout-session/` - Stripe checkout session creation
- `stripe-webhook/` - Payment webhook event processing with subscription sync
- `network-invite/` - Multi-type email invitation system (existing users, new users, news notifications)
- `manage-subscription/` - Comprehensive subscription management (cancel, reactivate, billing portal, invoices)
- `test-stripe/` - Stripe integration testing and validation