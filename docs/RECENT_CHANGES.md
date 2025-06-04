# Recent Changes & Features

This document tracks significant changes and new features in the Conclav application.

## Application Rebranding
- Renamed from "Mon Cercle" to "Conclav"
- Production domains: conclav.club and conclav.network
- Updated branding throughout the application

## June 2025 Updates

### Profile Creation Timestamps
- Added `created_at` column to profiles table with automatic timestamp on creation
- Updated MembersDetailModal to show "Joined X time ago" using formatTimeAgo utility
- Updated NetworkDetailsModal to show member join dates with relative time
- Migration added to initialize existing profiles with current date
- Improved member listings with join date information

## February 2025 Updates

### Enhanced LinkPreview Component
- Better image handling with proper URL resolution and error states
- Improved loading states with skeleton screens
- Enhanced typography with better title and description display
- Graceful error handling with fallback previews
- Fixed deprecated frameBorder warnings

### Improved OpenGraph Service
- Multiple proxy support (corsproxy.io and allorigins.win) with automatic fallback
- Better meta tag extraction from multiple sources (OpenGraph, Twitter cards)
- Enhanced image URL resolution for relative paths
- Smart cache handling that detects and refetches placeholder data
- First paragraph extraction when no description meta tag is found
- Improved favicon detection with Google favicon service fallback

### Direct Messages User Search
- Replaced manual userId input with UserSearchAutocomplete component
- Real-time search for network members with debouncing
- Shows user avatars and bio previews in search results
- Excludes already existing conversations from search
- Better UX for starting new conversations

### Admin Role Invitations
- "Invite as Admin" checkbox for single email invitations
- "Invite all as Admins" option for batch invitations
- Role selection dropdown for invitation links (Member/Admin)
- Automatic role assignment when users accept invitations
- Role display in pending invitations table
- Database migration to add role field to network_invitation_links table
- Fixed role assignment during signup flow for new users with invitations
- Fixed invitation links table not refreshing after single/batch email invitations

## January 2025 Updates

### Storage Management System
- Real-time storage usage monitoring with visual progress bars
- Storage limits by subscription plan (2GB to 5TB)
- Automatic storage prevention when limits reached
- Storage usage breakdown including all network member files
- SuperAdmin dashboard with detailed storage analytics

### Billing & Plan Management
- Current plan overview with usage statistics
- Payment history and invoice management
- Quick upgrade/downgrade options
- Integration with Stripe customer portal
- Real-time subscription status monitoring

### Enhanced Media Player
- Added artwork/thumbnail support for audio files
- Consistent media display in LatestNewsWidget and LatestPostsWidget
- Automatic media type detection and fallback handling
- Dark mode compatibility and responsive design

### Engagement & Badges System
- Customizable badge creation with Material UI icons and colors
- Automatic badge awarding based on activity metrics
- Manual badge awarding by admins with bulk assignment
- User engagement statistics (posts, events, messages, etc.)
- Badge display on profiles and member cards
- Default badge set for new networks (Early Adopter, Active Contributor, etc.)
- Top contributors leaderboard with activity breakdown

### Support Ticket System
- Network admins can submit support tickets to super admins
- Ticket categorization (technical, billing, feature request, bug report)
- Priority levels (low, medium, high, urgent)
- Ticket status tracking (open, in progress, waiting response, resolved, closed)
- Threaded conversation system with internal notes
- Super admin dashboard with statistics and filters
- Automatic assignment and response tracking
- Email notifications for ticket updates

### Free Trial System
- 14-day trial for new networks
- Automatic trial period tracking
- Trial expiration notifications
- Seamless conversion to paid plans
- Trial days remaining calculation

## Core Feature Enhancements

### PDF Support System
- Complete PDF rendering and preview capabilities
- PDF viewer components for various use cases (full reader, preview, thumbnails)
- PDF support in messages, network news, portfolio items, and direct messages
- Integration with pdfjs-dist library for browser-based rendering

### Social Wall Comments
- Threaded comment system for social content
- Comments on news posts and portfolio items with nested replies
- Real-time comment updates and moderation tools
- Comment visibility controls for admins

### Chat Reply System
- Message reply functionality in network chat
- Reply to specific messages with context preservation
- Visual reply indicators and navigation
- Reply content preview in message threads

### Enhanced Image Viewer
- Full-screen image viewing experience
- Zoom controls and pan functionality
- Gallery navigation for multiple images
- Keyboard shortcuts for navigation

### Enhanced Media Metadata
- Audio file artwork extraction using music-metadata-browser
- Automatic thumbnail generation for videos
- Media type detection and appropriate player selection

### Unified Invitation System
- Email invitations now use the same `/join/:code` flow as invitation links
- Automatic email prefilling when following invitation links
- Single-use invitation codes for email invitations
- Consistent user experience regardless of invitation method

### Welcome Experience
- Welcome message dialog with celebration animation (confetti)
- Automatic detection of new members (joined within 5 minutes or via invitation)
- Overview of key network features
- Option to start guided tour from welcome message
- Persistent state to avoid repeated displays

## UI/UX Improvements

### Consistent Header Height
- Fixed header height at 80px across all interfaces
- Unified admin and network headers

### Widget Enhancements
- Harmonized LatestPostsWidget and LatestNewsWidget
- Consistent author/date displays
- Enhanced widget visuals: larger text, images (200px), avatars (40px)
- Increased padding for better readability
- Unified widget headers to match PersonalMoodboardWidget style

### Dark Mode Support
- Updated DirectMessagesPage, DirectMessagesList, and DirectMessageChat
- Consistent theming across all components

## Integration Updates

### Stripe Subscription Plans
- Multiple plan tiers with new price IDs
- Automated subscription management
- Customer portal integration

### Vercel Analytics
- Performance tracking
- User behavior analytics
- Error monitoring

### Terms of Service
- CGU compliant with French/EU law
- Privacy policy updates
- Cookie policy implementation

## Technical Improvements

### Database
- Fixed direct messages foreign key relationship issue
- Added comprehensive RLS policies
- Performance indexes for large datasets
- Optimized query patterns

### Component Integration
- Integrated invitation links into MembersTab
- Mention system in Chat component
- Message deletion functionality
- Real-time updates across all features

### Performance
- Virtualized member lists for large networks
- Lazy loading for images and heavy components
- Optimized media processing
- Efficient caching strategies