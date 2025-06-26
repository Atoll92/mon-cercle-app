# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Documentation

- **[Application Status](./status.md)** - Current state of the application and production readiness
- **[Pre-Launch Tasks](./tasks.md)** - Remaining tasks before production launch

## Technical Documentation

- **[Project Structure](./docs/PROJECT_STRUCTURE.md)** - Directory organization and file structure
- **[Database Schema](./docs/DATABASE_SCHEMA.md)** - Complete database table definitions
- **[Complete Database Documentation](./database.md)** - **CRITICAL: Comprehensive database schema, relationships, and data analysis - MUST READ before any database changes**
- **[RLS Policies](./docs/RLS_POLICIES.md)** - Row-Level Security policies
- **[API Documentation](./docs/API_DOCUMENTATION.md)** - API functions and services
- **[Components Guide](./docs/COMPONENTS_GUIDE.md)** - React components documentation
- **[Recent Changes](./docs/RECENT_CHANGES.md)** - Latest updates and features

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
- `src/context/profileContext.jsx` - **Multiple profiles management and active profile selection**
- `src/context/networkContext.jsx` - Network data management
- `src/context/directMessagesContext.jsx` - Direct messaging state

#### API Layer (`src/api/`)
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
- `ProfileAwareRoute.jsx` - **Profile-aware route wrapper for multiple profiles system**
- `UserSearchAutocomplete.jsx` - User search with autocomplete for network members
- `NetworkSelector.jsx` - **Network selection interface for users with multiple networks**

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
- `EventDetailsDialog.jsx` - Reusable event details dialog with RSVP functionality
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

See [Recent Changes](./docs/RECENT_CHANGES.md) for a complete list of updates and new features.

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
- `profiles.js`: User profile operations (CRUD, preferences, subscriptions)
- `wiki.js`: Wiki page operations (CRUD, categories, comments, revisions)
- `events.js`: Event participation management and statistics

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
- **`ProfileProvider` (`context/profileContext.jsx`): Manages multiple profiles per user, active profile selection, and profile switching**
- `NetworkProvider` (`context/networkContext.jsx`): Manages network data (now profile-aware)
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
- **`profiles`: Multiple user profiles system - users can have one profile per network they join** (notification preferences, moderation status, profile-specific data)
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
- `badges`: Badge definitions for networks
- `user_badges`: Badge assignments to users
- `network_invitation_links`: Shareable invitation links with QR codes
- `support_tickets`: Support ticket system for network admins
- `ticket_messages`: Threaded messages for support tickets

## Components

For complete component documentation, see [Components Guide](./docs/COMPONENTS_GUIDE.md).

### Key Components
- **Chat.jsx** - Real-time network chat with mentions and replies
- **MediaUpload.jsx** - Comprehensive file upload system
- **MediaPlayer.jsx** - Video/audio playback with custom controls
- **LinkPreview.jsx** - Enhanced URL preview cards
- **PollCard.jsx** - Interactive polling with multiple types
- **NetworkOnboardingWizard.jsx** - Step-by-step network setup
- **AdminLayout.jsx** - Admin interface wrapper
- **ModerationTab.jsx** - Content and user moderation tools
- **ThemeProvider.jsx** - Dark/light mode management

## Database Schema

For complete database schema documentation, see [Database Schema](./docs/DATABASE_SCHEMA.md).

### Key Tables

- **profiles** - **Multiple profiles per user system** - each user can have separate profiles for different networks with individual roles and preferences
- **networks** - Network/community configurations
- **messages** - Network chat messages with media support
- **direct_messages** - Private messaging between users
- **network_events** - Event management with locations
- **network_news** - News posts with rich media
- **portfolio_items** - User portfolio projects
- **wiki_pages** - Collaborative documentation
- **moodboards** - Visual content boards
- **network_badges** - Engagement recognition system
- **support_tickets** - Help desk functionality

## Row-Level Security

For complete RLS documentation, see [RLS Policies](./docs/RLS_POLICIES.md).

### Summary

RLS is enabled on all sensitive tables with policies enforcing:
- Network membership requirements
- Owner-only access for private data
- Admin privileges for moderation
- System-only access for internal operations

## Environment Setup

The application requires the following environment variables:
- `VITE_SUPABASE_URL`: Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Supabase anonymous key
- `STRIPE_SECRET_KEY`: For Edge Functions (stripe payment integration)

## Feature Areas

### Multiple Profiles System

**Architecture**: Users can have multiple profiles, one for each network they join (1:many:many relationship)

Key features:
- **Profile per Network**: Each user gets a separate profile when joining a network
- **Active Profile Selection**: Users can switch between their profiles using ProfileSelector/ProfileSwitcher components
- **Cookie-based Persistence**: Active profile is saved in cookies for seamless experience
- **Profile Context**: `ProfileProvider` manages profile state across the application
- **Backward Compatibility**: All components handle both old (single profile) and new (multiple profiles) patterns

Implementation details:
- **Database Schema**: 
  - `profiles.user_id` references `auth.users.id` (many profiles per user)
  - `profiles.id` uses generated UUIDs (not user IDs)
  - Unique constraint on `(user_id, network_id)` - one profile per user per network
- **Frontend Components**: All major components use `activeProfile?.id || user.id` pattern for compatibility
- **API Functions**: Profile-aware with schema detection and fallback support
- **Migration Complete**: Full database migration completed with 35+ RLS policy fixes

Components involved:
- `ProfileProvider` - Core profile state management
- `ProfileSelector` - Profile selection interface  
- `ProfileSwitcher` - Quick profile switching
- `ProfileAwareRoute` - Profile-aware routing wrapper

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

## Database Schema Validation Protocol

**CRITICAL REQUIREMENT**: Before making ANY database schema changes, AI assistants MUST:

1. **Read Complete Database Documentation** - Review `./database.md` for full schema understanding
2. **Validate Against Current State** - Check existing migrations in `supabase/migrations/`
3. **Use Multi-Model Validation** - Employ Zen MCP for cross-model verification of database changes
4. **Follow Multi-Profile Architecture** - Ensure all changes support the 1:many:many User:Profile:Network system

### Schema Change Workflow

```bash
# REQUIRED: Before any database modifications
1. Read ./database.md for complete schema context
2. Check latest migration files for current state
3. Use Zen MCP to validate approach with multiple AI models
4. Test RLS policies with multi-profile patterns
5. Verify foreign key integrity across all related tables
```

### Multi-Model Validation with Zen

When proposing database changes, use the Zen MCP to:
- Compare schema modification approaches across different AI models
- Validate migration scripts for safety and completeness  
- Ensure RLS policies maintain security with multi-profile system
- Cross-check foreign key relationships and constraints

**Example Zen Usage:**
```bash
# Use Zen to validate database migration approach
zen compare "Review this database migration for multi-profile compatibility and suggest improvements" --models claude,gpt4,gemini
```

This ensures database integrity and prevents breaking changes to the complex multi-profile relationship system.