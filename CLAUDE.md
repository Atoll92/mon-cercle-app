# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Documentation

- **[Application Status](./status.md)** - Current state of the application and production readiness
- **[Pre-Launch Tasks](./tasks.md)** - Remaining tasks before production launch

## App Map

### Project Structure Overview
```
mon-cercle-app/
├── public/                    # Static assets
├── src/                       # Source code
│   ├── __mocks__/             # Mock implementations for testing
│   ├── api/                   # API layer functions
│   ├── assets/                # Images, icons, and static resources
│   ├── components/            # Reusable React components
│   │   ├── admin/             # Admin-specific components
│   │   ├── superadmin/        # Super admin components
│   │   └── [feature components]
│   ├── config/                # Application configuration
│   ├── constants/             # Application constants
│   ├── context/               # React Context providers
│   ├── hooks/                 # Custom React hooks
│   ├── mocks/                 # MSW mock handlers
│   ├── pages/                 # Page components (routes)
│   ├── services/              # Business logic and external services
│   ├── stripe/                # Stripe configuration
│   ├── styles/                # CSS files
│   └── utils/                 # Utility functions
├── supabase/                  # Supabase backend
│   ├── functions/             # Edge functions
│   └── migrations/            # Database migrations
└── [config files]            # Various configuration files
```

### Key Files by Category

#### Entry Points
- `src/main.jsx` - React app entry point
- `src/App.jsx` - Main app component with routing
- `index.html` - HTML template

#### Configuration
- `vite.config.js` - Vite bundler configuration
- `package.json` - Dependencies and scripts
- `vercel.json` - Vercel deployment settings
- `eslint.config.js` - Linting rules
- `.env` - Environment variables (not tracked)
- `src/config/cors.js` - CORS configuration for production domains
- `src/config/environment.js` - Environment configuration and validation
- `src/constants/moodboard.js` - Moodboard constants and defaults

#### Core Application Files
- `src/supabaseclient.jsx` - Supabase client initialization

#### Context Providers
- `src/context/authcontext.jsx` - Authentication state management
- `src/context/networkContext.jsx` - Network data management
- `src/context/directMessagesContext.jsx` - Direct messaging state

#### API Layer (`src/api/`)
- `auth.jsx` - Authentication functions
- `networks.jsx` - Network CRUD operations
- `directMessages.js` - Direct messaging API (fixed for dark mode)
- `moodboards.jsx` - Moodboard operations
- `polls.js` - Polling system
- `invitations.js` - Invitation management
- `superAdmin.js` - Admin dashboard API
- `comments.js` - Social wall comments system (add, fetch, delete, toggle visibility)
- `tickets.js` - Support ticket system (create, update, view, message)

#### Services (`src/services/`)
- `emailNotificationService.js` - Email notification queue
- `networkFiles.js` - File management
- `opengraphService.js` - Enhanced URL preview generation with multiple proxy support and better fallbacks
- `stripeService.js` - Payment processing
- `subscriptionService.js` - Subscription management

#### Pages (`src/pages/`)
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

#### Components (`src/components/`)

##### Chat & Messaging
- `Chat.jsx` - Network chat with mentions and reply functionality
- `DirectMessageChat.jsx` - DM interface (dark mode ready, enhanced link preview support)
- `DirectMessagesList.jsx` - Conversation list (dark mode ready)
- `CommentSection.jsx` - Comment system for social wall items with threaded replies

##### Network Features
- `NetworkHeader.jsx` - Network header (80px height)
- `NetworkOnboardingWizard.jsx` - Setup wizard
- `NetworkDetailsModal.jsx` - Network info display
- `EventsTab.jsx` - Events management
- `MembersTab.jsx` - Member management (includes invitations)
- `NewsTab.jsx` - News feed
- `SocialWallTab.jsx` - Combined social feed
- `WikiTab.jsx` - Wiki content
- `FilesTab.jsx` - File sharing
- `MoonboardTab.jsx` - Moodboard display
- `AboutTab.jsx` - Network about section
- `ChatTab.jsx` - Chat interface wrapper
- `PrivacyPage.jsx` - Privacy policy page

##### Media & Content
- `MediaUpload.jsx` - File upload system
- `MediaPlayer.jsx` - Video/audio playback with artwork support
- `LinkPreview.jsx` - Enhanced URL preview cards with improved OpenGraph data extraction
- `QuillEditor.jsx` - Rich text editor
- `moodboardGallery.jsx` - Moodboard gallery
- `ImageViewerModal.jsx` - Full-screen image viewer with zoom and gallery navigation
- `PDFReader.jsx` - PDF document reader with page navigation
- `PDFModal.jsx` - PDF viewer modal wrapper
- `PDFPreview.jsx` - PDF preview component
- `PDFPreviewEnhanced.jsx` - Enhanced PDF preview with metadata
- `PDFFirstPageViewer.jsx` - PDF first page thumbnail generator
- `SimplePDFViewer.jsx` - Lightweight PDF viewer

##### UI Components
- `AnimatedComponents.jsx` - Animation wrappers
- `ShimmerProvider.jsx` - Shimmer effects
- `ShimmeryText.jsx` - Text animations
- `TextCycler.jsx` - Cycling text display
- `ThreeJSBackground.jsx` - 3D background
- `LoadingSkeleton.jsx` - Loading states
- `ThemeProvider.jsx` - Theme management
- `ProtectedRoute.jsx` - Route protection
- `UserSearchAutocomplete.jsx` - User search with autocomplete for network members

##### Widgets & Cards
- `PollCard.jsx` - Poll display/voting
- `LatestNewsWidget.jsx` - News widget (with media support)
- `LatestPostsWidget.jsx` - Posts widget (with media support)
- `PersonalMoodboardWidget.jsx` - Moodboard widget
- `InvitationLinkWidget.jsx` - Invitation links
- `SubscriptionBadge.jsx` - Subscription status
- `UserBadges.jsx` - User badge display component
- `ErrorBoundary.jsx` - Error handling wrapper
- `EventParticipation.jsx` - Event participation widget
- `EventParticipationStats.jsx` - Event analytics and statistics  
- `EventsMap.jsx` - Map component for displaying events using Mapbox
- `LazyImage.jsx` - Lazy loading image component
- `MembersDetailModal.jsx` - Member details popup
- `MoodboardItem.jsx` - Individual moodboard item component
- `NetworkDetailsModal.jsx` - Network information modal
- `NewsPostPage.jsx` - Individual news post page
- `TestNotificationSystem.jsx` - Notification testing component
- `OnboardingGuide.jsx` - Interactive onboarding guide with tooltips
- `EditItemDialog.jsx` - Dialog for editing moodboard items
- `Footer.jsx` - Application footer component
- `WelcomeMessage.jsx` - Welcome dialog for new network members with celebration animation

##### SuperAdmin Components (`src/components/superadmin/`)
- `TicketsManagement.jsx` - Super admin ticket dashboard and management

##### Admin Components (`src/components/admin/`)
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

#### Utilities (`src/utils/`)
- `mediaUpload.js` - Media file handling
- `animationHelpers.js` - Animation utilities
- `logger.js` - Application logging utility
- `moodboardHelpers.js` - Moodboard manipulation helpers
- `passwordValidation.js` - Password strength validation
- `sanitizeHtml.js` - HTML sanitization for user content

#### Hooks (`src/hooks/`)
- `useAnimation.js` - Animation hook
- `useScrollAnimation.js` - Scroll-based animations
- `useMoodboardCanvas.js` - Moodboard canvas interaction hook
- `useRealtimeChannel.js` - Supabase realtime subscription hook

#### Styles (`src/styles/`)
- `animations.css` - Animation definitions
- Component-specific CSS files

#### Testing
- `src/setupTests.js` - Test configuration
- `src/test-utils.jsx` - Testing utilities
- `src/__mocks__/` - Component mocks
- `src/mocks/` - MSW mock handlers

#### Supabase Backend (`supabase/`)
- `supabase/functions/` - Edge functions
  - `create-checkout-session/` - Stripe checkout
  - `stripe-webhook/` - Payment webhooks
  - `network-invite/` - Invitation emails
  - `manage-subscription/` - Subscription logic
- `supabase/migrations/` - Database migrations
- `supabase_schema.sql` - Database schema

### Recent Changes
- Application rebranded from "Mon Cercle" to "Conclav"
- Production domains configured: conclav.club and conclav.network
- Fixed direct messages foreign key relationship issue
- Updated DirectMessagesPage, DirectMessagesList, and DirectMessageChat for dark mode support
- Integrated invitation links into MembersTab instead of separate tab
- Fixed header height consistency (80px)
- Added comprehensive mention system in Chat component
- Added message deletion functionality
- Integrated Vercel Analytics
- Created Terms of Service page (CGU) compliant with French/EU law
- Integrated multiple Stripe subscription plans with new price IDs
- Harmonized LatestPostsWidget and LatestNewsWidget with consistent author/date displays
- Enhanced widget visuals: larger text, images (200px), avatars (40px), and increased padding
- Unified widget headers to match PersonalMoodboardWidget style with consistent Box layout
- **PDF Support System**: Complete PDF rendering and preview capabilities
  - PDF viewer components for various use cases (full reader, preview, thumbnails)
  - PDF support in messages, network news, portfolio items, and direct messages
  - Integration with pdfjs-dist library for browser-based rendering
- **Social Wall Comments**: Threaded comment system for social content
  - Comments on news posts and portfolio items with nested replies
  - Real-time comment updates and moderation tools
  - Comment visibility controls for admins
- **Chat Reply System**: Message reply functionality in network chat
  - Reply to specific messages with context preservation
  - Visual reply indicators and navigation
  - Reply content preview in message threads
- **Enhanced Image Viewer**: Full-screen image viewing experience
  - Zoom controls and pan functionality
  - Gallery navigation for multiple images
  - Keyboard shortcuts for navigation
- **Enhanced Media Metadata**: Rich media file information
  - Audio file artwork extraction using music-metadata-browser
  - Automatic thumbnail generation for videos
  - Media type detection and appropriate player selection
- **Unified Invitation System**: Streamlined invitation flow for all users
  - Email invitations now use the same `/join/:code` flow as invitation links
  - Automatic email prefilling when following invitation links
  - Single-use invitation codes for email invitations
  - Consistent user experience regardless of invitation method
- **Welcome Experience**: Enhanced onboarding for new members
  - Welcome message dialog with celebration animation (confetti)
  - Automatic detection of new members (joined within 5 minutes or via invitation)
  - Overview of key network features
  - Option to start guided tour from welcome message
  - Persistent state to avoid repeated displays

### Latest Updates (February 2025)
- **Enhanced LinkPreview Component**: Improved URL preview functionality
  - Better image handling with proper URL resolution and error states
  - Improved loading states with skeleton screens
  - Enhanced typography with better title and description display
  - Graceful error handling with fallback previews
  - Fixed deprecated frameBorder warnings
- **Improved OpenGraph Service**: More reliable link preview data extraction
  - Multiple proxy support (corsproxy.io and allorigins.win) with automatic fallback
  - Better meta tag extraction from multiple sources (OpenGraph, Twitter cards)
  - Enhanced image URL resolution for relative paths
  - Smart cache handling that detects and refetches placeholder data
  - First paragraph extraction when no description meta tag is found
- **Direct Messages User Search**: Improved conversation initiation flow
  - Replaced manual userId input with UserSearchAutocomplete component
  - Real-time search for network members with debouncing
  - Shows user avatars and bio previews in search results
  - Excludes already existing conversations from search
  - Better UX for starting new conversations
  - Improved favicon detection with Google favicon service fallback
- **Admin Role Invitations**: Enhanced invitation system with role assignment
  - "Invite as Admin" checkbox for single email invitations
  - "Invite all as Admins" option for batch invitations
  - Role selection dropdown for invitation links (Member/Admin)
  - Automatic role assignment when users accept invitations
  - Role display in pending invitations table
  - Database migration to add role field to network_invitation_links table
  - Fixed role assignment during signup flow for new users with invitations
  - Fixed invitation links table not refreshing after single/batch email invitations

### Latest Updates (January 2025)
- **Storage Management System**: Added comprehensive storage tracking for network admins
  - Real-time storage usage monitoring with visual progress bars
  - Storage limits by subscription plan (2GB to 5TB)
  - Automatic storage prevention when limits reached
  - Storage usage breakdown including all network member files
  - SuperAdmin dashboard with detailed storage analytics
- **Billing & Plan Management**: New admin panel for subscription management
  - Current plan overview with usage statistics
  - Payment history and invoice management
  - Quick upgrade/downgrade options
  - Integration with Stripe customer portal
  - Real-time subscription status monitoring
- **Enhanced Media Player**: Improved audio/video display across all widgets
  - Added artwork/thumbnail support for audio files
  - Consistent media display in LatestNewsWidget and LatestPostsWidget
  - Automatic media type detection and fallback handling
  - Dark mode compatibility and responsive design
- **Engagement & Badges System**: Comprehensive user engagement tracking
  - Customizable badge creation with Material UI icons and colors
  - Automatic badge awarding based on activity metrics
  - Manual badge awarding by admins with bulk assignment
  - User engagement statistics (posts, events, messages, etc.)
  - Badge display on profiles and member cards
  - Default badge set for new networks (Early Adopter, Active Contributor, etc.)
  - Top contributors leaderboard with activity breakdown
- **Support Ticket System**: Comprehensive help desk for network admins
  - Network admins can submit support tickets to super admins
  - Ticket categorization (technical, billing, feature request, bug report)
  - Priority levels (low, medium, high, urgent)
  - Ticket status tracking (open, in progress, waiting response, resolved, closed)
  - Threaded conversation system with internal notes
  - Super admin dashboard with statistics and filters
  - Automatic assignment and response tracking
  - Email notifications for ticket updates
- **Free Trial System**: 14-day trial for new networks
  - Automatic trial period tracking
  - Trial expiration notifications
  - Seamless conversion to paid plans
  - Trial days remaining calculation

## Commands

### Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Lint code
npm run lint

# Preview production build
npm run preview

# Run tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

## Architecture Overview

### Tech Stack

- **Frontend**: React with Vite
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **Authentication**: Supabase Auth
- **Styling**: Material UI (MUI), CSS
- **Routing**: React Router
- **State Management**: Context API
- **Payments**: Stripe integration
- **Realtime Communication**: Supabase Realtime
- **Testing**: Vitest, React Testing Library
- **Rich Text Editing**: TipTap, React Quill, MD Editor
- **3D Graphics**: Three.js
- **Virtualization**: React Window
- **PDF Rendering**: pdfjs-dist
- **Media Processing**: music-metadata-browser, browser-image-compression
- **Analytics**: Vercel Analytics
- **Animations**: canvas-confetti
- **Utilities**: buffer (polyfill)

### Core Components

#### Auth System

The application uses Supabase for authentication. The auth flow is implemented in `src/context/authcontext.jsx`, which provides:
- User session management
- Sign-up, sign-in, sign-out functionality
- Password reset and update capabilities

#### Supabase Client

Supabase integration is set up in `src/supabaseclient.jsx`, which initializes the Supabase client with environment variables:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

#### API Layer

API functions are organized in the `src/api/` directory:
- `auth.jsx`: Authentication-related functions
- `networks.jsx`: Network management (users, events, news, moderation, storage tracking)
- `directMessages.js`: Direct messaging system
- `moodboards.jsx`: Moodboard functionality
- `polls.js`: Polling system with voting and statistics
- `invitations.js`: Enhanced invitation system with links and codes
- `superAdmin.js`: Super admin dashboard and system management
- `badges.js`: Engagement badges system (create, award, track user stats)

#### Services Layer

Service functions are organized in the `src/services/` directory:
- `emailNotificationService.js`: Email notification queue management
- `networkFiles.js`: File upload and management
- `opengraphService.js`: Link preview generation
- `stripeService.js`: Stripe payment processing
- `subscriptionService.js`: Subscription management

#### Utilities

Utility functions are organized in the `src/utils/` directory:
- `mediaUpload.js`: Media file validation, upload, and processing
- `animationHelpers.js`: Animation timing, easing, and helper functions

#### Context Providers

The app uses React Context for state management:
- `AuthProvider` (`context/authcontext.jsx`): Manages user authentication state
- `NetworkProvider` (`context/networkContext.jsx`): Manages network data
- `DirectMessagesProvider` (`context/directMessagesContext.jsx`): Manages direct messaging state

#### Routing

The application uses React Router for routing, with protected routes implemented via the `ProtectedRoute` component to secure access to authenticated-only features.

#### Edge Functions

Supabase Edge Functions handle server-side operations:
- `create-checkout-session`: Creates Stripe checkout sessions
- `stripe-webhook`: Processes Stripe webhook events
- `network-invite`: Sends network invitations to users
- `manage-subscription`: Handles subscription management
- `test-stripe`: Testing Stripe integration

### Data Model

Key entities in the Supabase database:
- `profiles`: User profiles with notification preferences and moderation status
- `networks`: User networks/communities with configuration options
- `network_events`: Events within networks
- `network_news`: News/posts within networks with media support
- `network_polls`: Network polls with multiple question types
- `network_poll_votes`: Poll voting records
- `direct_conversations`: Direct message conversations
- `direct_messages`: Individual messages in conversations with media support
- `portfolio_items`: User portfolio projects with media support
- `wiki_pages`: Network wiki content
- `wiki_categories`: Wiki page categorization
- `wiki_comments`: Comments on wiki pages
- `wiki_revisions`: Version control for wiki pages
- `network_files`: Shared network files
- `media_uploads`: Media file storage and metadata
- `moderation_logs`: Content and user moderation history
- `notification_queue`: Email notification queue with retry mechanism
- `opengraph_cache`: URL preview cache
- `moodboards`: Personal and network moodboards
- `moodboard_items`: Moodboard content items
- `social_wall_comments`: Comments on social wall items (news and portfolio)
- `network_badges`: Badge definitions for networks
- `user_badges`: Badge assignments to users
- `network_invitation_links`: Shareable invitation links with QR codes
- `support_tickets`: Support ticket system for network admins
- `ticket_messages`: Threaded messages for support tickets

## UI Components

### Feature Components
- `Chat`: Handles network chat interaction with media support
- `DirectMessageChat`: Direct messaging interface
- `EventsTab`: Network event management and display
- `MembersTab`: Network member listing and management
- `SocialWallTab`: Combined news and portfolio social feed with media
- `WikiTab`: Wiki content display
- `FilesTab`: Shared files management
- `NewsTab`: Network news feed with media support
- `MoonboardTab`: Network moodboard display
- `MediaUpload`: Complete media upload system with validation and preview
- `MediaPlayer`: Video/audio player with fullscreen and chat integration
- `PollCard`: Interactive polling component with multiple question types
- `NotificationSettings`: User email notification preferences
- `NetworkOnboardingWizard`: Step-by-step network setup
- `LinkPreview`: Enhanced URL preview component with improved data extraction and display
- `LatestNewsWidget`: News display widget
- `LatestPostsWidget`: Recent posts display widget
- `PersonalMoodboardWidget`: Personal moodboard display
- `VirtualizedMemberList`: Performance-optimized member list
- `ThreeJSBackground`: 3D animated background
- `AnimatedComponents`: Styled components with animations
- `ShimmerProvider`: Dynamic shimmer effects
- `SubscriptionBadge`: Subscription status indicator
- `AddressSuggestions`: Location-based address suggestions
- `TextCycler`: Animated text cycling component
- `EventsMap`: Interactive map for event locations
- `OnboardingGuide`: Step-by-step user onboarding
- `Footer`: Application footer with links

### Admin Components
- `AdminLayout`: Admin interface layout
- `ModerationTab`: Content and user moderation
- `NotificationQueueTab`: Email queue monitoring
- `NetworkSettingsTab`: Network configuration
- `ThemeTab`: Theme customization
- `BatchInviteModal`: Bulk user invitations
- `InvitationLinksTab`: Invitation link management with QR codes
- `PollsTab`: Poll management interface
- `MonetizationTab`: Subscription and billing management

### Theme Support
- Dark mode and light mode support
- `ThemeProvider` component for theme management
- Custom theme extensions via MUI theme provider
- Network-specific theme colors

## Database Schema

### Auth Tables (Supabase Default)
```
auth.users
- id (uuid, PK)
- email (varchar)
- created_at (timestamp)
- updated_at (timestamp)
- [other Supabase auth fields]
```

### Application Tables

```
profiles
- id (uuid, PK, references auth.users.id)
- network_id (uuid, FK to networks.id)
- full_name (varchar)
- contact_email (varchar)
- bio (text)
- role (varchar) - 'admin' or 'member'
- profile_picture_url (varchar)
- portfolio_url (varchar)
- linkedin_url (varchar)
- skills (text[])
- is_suspended (boolean)
- suspension_reason (text)
- suspension_end_date (timestamp)
- restriction_level (varchar)
- restriction_reason (text)
- last_active (timestamp)
- email_notifications_enabled (boolean)
- notify_on_news (boolean)
- notify_on_events (boolean)
- notify_on_mentions (boolean)
- notify_on_direct_messages (boolean)
- updated_at (timestamp)

portfolio_items
- id (uuid, PK)
- profile_id (uuid, FK to profiles.id)
- title (varchar)
- description (text)
- url (varchar)
- image_url (varchar)
- media_urls (text[], nullable) - Array of media file URLs
- media_types (text[], nullable) - Array of media MIME types
- created_at (timestamp)
- updated_at (timestamp)

networks
- id (uuid, PK)
- name (varchar)
- description (text)
- logo_url (varchar)
- background_image_url (varchar)
- privacy_level (varchar) - 'public', 'private', 'invite-only'
- purpose (varchar) - 'community', 'professional', 'educational', 'hobby', 'other'
- theme_color (varchar)
- features_config (jsonb) - Feature toggles
- default_tabs (text[]) - Default visible tabs
- subscription_status (varchar)
- subscription_plan (varchar)
- subscription_end_date (timestamp)
- stripe_customer_id (varchar)
- stripe_subscription_id (varchar)
- trial_start_date (timestamp)
- trial_end_date (timestamp)
- is_trial (boolean)
- trial_days_used (integer)
- created_at (timestamp)
- updated_at (timestamp)

invitations
- id (uuid, PK)
- email (varchar)
- network_id (uuid, FK to networks.id)
- invited_by (uuid, FK to profiles.id)
- status (varchar) - 'pending', 'accepted', 'declined'
- role (varchar) - 'admin' or 'member'
- created_at (timestamp)

network_events
- id (uuid, PK)
- network_id (uuid, FK to networks.id)
- title (varchar)
- description (text)
- date (timestamp)
- location (varchar)
- coordinates (json) - {latitude, longitude}
- cover_image_url (varchar)
- capacity (integer)
- event_link (varchar)
- created_by (uuid, FK to profiles.id)
- created_at (timestamp)
- updated_at (timestamp)

event_participations
- id (uuid, PK)
- event_id (uuid, FK to network_events.id)
- profile_id (uuid, FK to profiles.id)
- status (varchar) - 'attending', 'maybe', 'declined'
- created_at (timestamp)
- updated_at (timestamp)

network_news
- id (uuid, PK)
- network_id (uuid, FK to networks.id)
- title (varchar)
- content (text)
- image_url (varchar)
- image_caption (varchar)
- media_urls (text[], nullable) - Array of media file URLs
- media_types (text[], nullable) - Array of media MIME types  
- is_hidden (boolean)
- is_flagged (boolean)
- flag_reason (text)
- created_by (uuid, FK to profiles.id)
- created_at (timestamp)
- updated_at (timestamp)

network_files
- id (uuid, PK)
- network_id (uuid, FK to networks.id)
- uploaded_by (uuid, FK to profiles.id)
- filename (varchar)
- filepath (varchar)
- file_url (varchar)
- file_size (integer)
- file_type (varchar)
- description (text)
- download_count (integer)
- created_at (timestamp)
- updated_at (timestamp)

direct_conversations
- id (uuid, PK)
- participants (uuid[]) - Array of user IDs (profiles.id)
- created_at (timestamp)
- updated_at (timestamp)
- last_message_at (timestamp)

direct_messages
- id (uuid, PK)
- conversation_id (uuid, FK to direct_conversations.id)
- sender_id (uuid, FK to profiles.id)
- content (text)
- media_urls (text[], nullable) - Array of media file URLs
- media_types (text[], nullable) - Array of media MIME types
- read_at (timestamp)
- created_at (timestamp)
- updated_at (timestamp)

messages
- id (uuid, PK)
- network_id (uuid, FK to networks.id)
- user_id (uuid, FK to profiles.id)
- content (text)
- is_hidden (boolean)
- is_flagged (boolean)
- flag_reason (text)
- parent_message_id (uuid, FK to messages.id, nullable) - For reply threads
- reply_to_user_id (uuid, FK to profiles.id, nullable) - User being replied to
- reply_to_content (text, nullable) - Preview of replied message
- media_urls (text[], nullable) - Array of media file URLs
- media_types (text[], nullable) - Array of media MIME types
- created_at (timestamp)

moodboards
- id (uuid, PK)
- title (varchar)
- description (text)
- created_by (uuid, FK to profiles.id)
- created_at (timestamp)
- updated_at (timestamp)

moodboard_items
- id (uuid, PK)
- moodboard_id (uuid, FK to moodboards.id)
- type (varchar) - 'image', 'text', etc.
- content (text)
- position_x (float)
- position_y (float)
- width (float)
- height (float)
- z_index (integer)
- created_at (timestamp)
- updated_at (timestamp)

wiki_pages
- id (uuid, PK)
- network_id (uuid, FK to networks.id)
- title (varchar)
- content (text)
- slug (varchar)
- category (varchar)
- is_published (boolean)
- created_by (uuid, FK to profiles.id)
- created_at (timestamp)
- updated_at (timestamp)

opengraph_cache
- id (uuid, PK)
- url (varchar, unique)
- title (varchar)
- description (text)
- image_url (varchar)
- site_name (varchar)
- created_at (timestamp)
- updated_at (timestamp)

moderation_logs
- id (uuid, PK)
- network_id (uuid, FK to networks.id)
- moderator_id (uuid, FK to profiles.id)
- target_user_id (uuid, FK to profiles.id, nullable)
- target_content_id (uuid, nullable)
- target_content_type (varchar) - 'message', 'news', 'profile'
- action (varchar) - 'hide', 'flag', 'suspend', 'restrict', 'unsuspend', 'unrestrict'
- reason (text)
- created_at (timestamp)

notification_queue
- id (uuid, PK)
- recipient_email (varchar)
- recipient_name (varchar)
- subject (varchar)
- template_id (varchar)
- template_data (jsonb)
- status (varchar) - 'pending', 'sent', 'failed'
- attempts (integer, default 0)
- last_attempt_at (timestamp)
- sent_at (timestamp)
- error_message (text)
- created_at (timestamp)
- updated_at (timestamp)

social_wall_comments
- id (uuid, PK)
- item_id (uuid) - References news or portfolio item
- item_type (varchar) - 'news' or 'portfolio'
- user_id (uuid, FK to profiles.id)
- content (text)
- parent_comment_id (uuid, FK to social_wall_comments.id, nullable)
- is_hidden (boolean)
- created_at (timestamp)
- updated_at (timestamp)

network_badges  
- id (uuid, PK)
- network_id (uuid, FK to networks.id)
- name (varchar)
- description (text)
- icon (varchar) - Material UI icon name
- color (varchar) - Hex color code
- criteria_type (varchar) - 'manual' or 'automatic'
- criteria_config (jsonb) - Automatic awarding rules
- created_at (timestamp)
- updated_at (timestamp)

user_badges
- id (uuid, PK)
- user_id (uuid, FK to profiles.id)
- badge_id (uuid, FK to network_badges.id)
- awarded_by (uuid, FK to profiles.id, nullable)
- awarded_at (timestamp)
- reason (text, nullable)

network_invitation_links
- id (uuid, PK)
- network_id (uuid, FK to networks.id)
- code (varchar, unique)
- created_by (uuid, FK to profiles.id)
- name (varchar)
- role (varchar) - 'admin' or 'member'
- max_uses (integer, nullable)
- uses_count (integer, default 0)
- expires_at (timestamp, nullable)
- is_active (boolean, default true)
- created_at (timestamp)
- updated_at (timestamp)

media_uploads
- id (uuid, PK)
- user_id (uuid, FK to profiles.id)
- network_id (uuid, FK to networks.id, nullable)
- file_path (varchar)
- file_url (varchar)
- file_type (varchar)
- file_size (bigint)
- metadata (jsonb) - Dimensions, duration, thumbnails, etc.
- created_at (timestamp)

support_tickets
- id (uuid, PK)
- network_id (uuid, FK to networks.id)
- submitted_by (uuid, FK to profiles.id)
- assigned_to (uuid, FK to profiles.id, nullable)
- title (varchar)
- description (text)
- category (varchar) - 'technical', 'billing', 'feature', 'bug', 'other'
- priority (varchar) - 'low', 'medium', 'high', 'urgent'
- status (varchar) - 'open', 'in_progress', 'waiting_response', 'resolved', 'closed'
- created_at (timestamp)
- updated_at (timestamp)
- resolved_at (timestamp, nullable)

ticket_messages
- id (uuid, PK)
- ticket_id (uuid, FK to support_tickets.id)
- sender_id (uuid, FK to profiles.id)
- message (text)
- is_internal (boolean) - For internal notes between super admins
- created_at (timestamp)
```

## Supabase Row-Level Security Policies

The following tables have Row-Level Security (RLS) enabled:

```
- direct_conversations
- direct_messages
- event_participations
- messages
- moodboard_items
- moodboards
- network_files
- opengraph_cache
- wiki_pages
- moderation_logs
- notification_queue
- social_wall_comments
- network_badges
- user_badges
- network_invitation_links
- media_uploads
- support_tickets
- ticket_messages
```

### Key RLS Policies

#### Direct Messages
- Users can only view messages from conversations they're part of
- Users can only send messages to conversations they're part of
- Participants in a conversation can update the read_at status

#### Network Files
- Users can view files in their network
- Users can upload files to their network
- Users can update and delete their own files
- Network admins can manage all files in their network

#### Wiki Pages
- Anyone can view published wiki pages
- Network admins can view all wiki pages, including unpublished ones
- Network members can insert wiki pages
- Network admins can update any wiki page
- Page creators can update their own unpublished pages

#### Moodboards
- Users can view public moodboards
- Users can view personal moodboards they created
- Users can view collaborative moodboards in their network
- Network admins can view all moodboards
- Users can create moodboards in their network
- Users can update their own moodboards
- Users can delete their own moodboards

#### Event Participations
- Participations are viewable by everyone
- Users can manage their own participations
- Network admins can view all participations in their network

#### Moderation Logs
- Network admins can view moderation logs for their network
- Network admins can create moderation logs

#### Notification Queue
- Only system can insert into notification queue
- Network admins can view notifications for their network users

#### Social Wall Comments
- Users can view comments on public items or items in their network
- Users can create comments on items in their network
- Users can update/delete their own comments
- Network admins can moderate all comments in their network

#### Media Uploads
- Users can view their own uploads
- Users can view uploads in their network
- Users can create uploads
- Users can delete their own uploads

#### Network Badges & User Badges
- Network members can view badges in their network
- Network admins can manage badge definitions
- Network admins can award badges to users
- Users can view their own badges

#### Support Tickets
- Network admins can view and create tickets for their network
- Network admins can update their own tickets
- Super admins can view and update all tickets
- Only super admins can access ticket statistics

#### Ticket Messages
- Users can view messages for tickets they have access to
- Users can send messages to tickets they have access to
- Super admins can create internal notes
- Network admins cannot see internal notes

## Environment Setup

The application requires the following environment variables:
- `VITE_SUPABASE_URL`: Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Supabase anonymous key
- `STRIPE_SECRET_KEY`: For Edge Functions (stripe payment integration)

## Feature Areas

### Networks

Networks are the core social structure:
- Networks contain members with different roles (admin, member)
- Networks have events, news, and shared files
- Network admins can invite users, manage members, and customize settings
- Networks can be configured with different privacy levels and purposes
- Networks support custom theme colors and feature toggles

### Messaging

Direct messaging system allows users to:
- Start conversations with other users
- Send/receive messages with media attachments in real-time using Supabase realtime subscriptions
- See unread message counts
- Share images, videos, and audio files

### Events

Network events system to:
- Create, update, and delete events
- Track event participation
- Export event participant lists
- View events on a map and calendar

### Files & Content

Content management features:
- Wiki pages with categories, comments, and revision control
- Shared files system with download tracking
- Moodboards for visual content with personal and collaborative modes
- Rich text editing with multiple editor options
- Media upload system supporting images, videos, and audio

### Social Wall

Combined social feed that includes:
- Network news posts with rich media support
- Member portfolio projects with media
- Interactive content with media support
- Link previews for URLs
- Poll integration for interactive engagement
- Threaded comment system with nested replies
- Comment moderation for admins
- Full-screen image viewer for media
- PDF document preview and reading

### Portfolio

User portfolio system:
- Users can add portfolio projects with rich media
- Projects can include images, videos, and links
- Portfolio items appear in the social wall with media previews

### Chat

Real-time network chat:
- Persistent chat history with media support
- Message reply functionality with context preservation
- User presence indicators
- Support for fullscreen mode
- Link previews
- Content moderation support
- Media player integration for shared content
- PDF document sharing and preview

### Subscription & Billing

Stripe integration for subscription management:
- Payment processing
- Subscription status tracking
- Billing information management

### Email Notifications

Queue-based email notification system:
- User notification preferences
- Email templates for different notification types
- Retry mechanism for failed sends
- Admin monitoring of notification queue

### Moderation System

Content and user moderation features:
- Hide or flag inappropriate content
- Suspend or restrict user accounts
- Moderation logging for audit trail
- Admin moderation interface

### Network Configuration

Network setup and customization:
- Onboarding wizard for new networks
- Privacy level settings
- Purpose categorization
- Feature toggles
- Default tab configuration
- Custom theme colors
- Invitation link management with QR codes

### Polls System

Interactive polling features:
- Multiple choice polls
- Yes/no polls  
- Date picker polls
- Anonymous voting options
- Real-time vote tracking
- Poll statistics and analytics

### Super Admin Dashboard

System-wide administration:
- Network analytics and monitoring
- User management across all networks
- System health monitoring
- Data export capabilities
- Network suspension and activation
- Support ticket management with statistics
- Ticket assignment and prioritization
- Internal notes for ticket collaboration

### Animation System

Advanced animation framework:
- Fade-in and scale animations
- Staggered list animations
- Shimmer effects based on scroll and time
- Custom animation hooks
- CSS animation utilities

### Media System

Comprehensive media handling:
- Image optimization with browser-image-compression
- Audio metadata extraction with music-metadata-browser
- PDF rendering with pdfjs-dist
- Full-screen image viewer with zoom
- Video/audio player with custom controls
- Media type detection and validation
- Automatic thumbnail generation
- Storage quota management