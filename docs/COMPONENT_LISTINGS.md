# Conclav Component Listings

This document contains detailed component listings for the Conclav codebase, organized by feature area.

## Core Application Components

### Authentication & User Management
- `ProtectedRoute.jsx` - Route protection for authenticated users
- `ProfileAwareRoute.jsx` - Profile-aware route wrapper for multiple profiles system
- `UserSearchAutocomplete.jsx` - User search with autocomplete for network members
- `UserBadges.jsx` - User badge display component
- `ErrorBoundary.jsx` - Error handling wrapper

### Network Management & Navigation
- `NetworkHeader.jsx` - Network header component (80px height)
- `NetworkSelector.jsx` - Network selection interface for users with multiple networks
- `NetworkSwitcher.jsx` - Quick network switching component (replaced ProfileSelector/ProfileSwitcher)
- `NetworkOnboardingWizard.jsx` - Step-by-step network setup wizard
- `NetworkDetailsModal.jsx` - Network information display modal
- `OnboardingGuide.jsx` - Interactive onboarding guide with tooltips
- `WelcomeMessage.jsx` - Welcome dialog for new network members with celebration animation

## Content Management Components

### Media Handling & Display
- `MediaUpload.jsx` - Comprehensive file upload system
- `MediaPlayer.jsx` - Video/audio playback with artwork support and custom controls
- `ImageViewerModal.jsx` - Full-screen image viewer with zoom and gallery navigation
- `LazyImage.jsx` - Lazy loading image component with optimization

### PDF Document Support
- `PDFReader.jsx` - PDF document reader with page navigation
- `PDFModal.jsx` - PDF viewer modal wrapper
- `PDFPreview.jsx` - PDF preview component
- `PDFPreviewEnhanced.jsx` - Enhanced PDF preview with metadata
- `PDFFirstPageViewer.jsx` - PDF first page thumbnail generator
- `SimplePDFViewer.jsx` - Lightweight PDF viewer

### Content Creation & Editing
- `QuillEditor.jsx` - Rich text editor for content creation
- `LinkPreview.jsx` - Enhanced URL preview cards with improved OpenGraph data extraction
- `PostCard.jsx` - Individual post display component
- `CreatePostModal.jsx` - Modal for creating and editing portfolio posts with media upload

## Communication & Social Features

### Chat & Messaging
- `Chat.jsx` - Real-time network chat with mentions and reply functionality
- `DirectMessageChat.jsx` - Direct message interface (dark mode ready, enhanced link preview support)
- `DirectMessagesList.jsx` - Conversation list interface (dark mode ready)
- `CommentSection.jsx` - Comment system for social wall items with threaded replies

### Social Wall & Content Display
- `SocialWallTab.jsx` - Combined social feed with news and portfolio items
- `PollCard.jsx` - Interactive poll display and voting interface
- `NewsPostPage.jsx` - Individual news post page with full content display

## Network Feature Tabs
- `EventsTab.jsx` - Events management and display
- `MembersTab.jsx` - Member management (includes invitations)
- `NewsTab.jsx` - Network news feed
- `WikiTab.jsx` - Wiki content management
- `FilesTab.jsx` - File sharing and management
- `MoonboardTab.jsx` - Moodboard display and interaction
- `AboutTab.jsx` - Network about section
- `ChatTab.jsx` - Chat interface wrapper
- `PrivacyPage.jsx` - Privacy policy page

## UI Framework & Visual Components

### Animation & Visual Effects
- `AnimatedComponents.jsx` - Animation wrappers and effects
- `ShimmerProvider.jsx` - Shimmer effects provider
- `ShimmeryText.jsx` - Text animations and shimmer effects
- `TextCycler.jsx` - Cycling text display component
- `ThreeJSBackground.jsx` - 3D background graphics
- `LoadingSkeleton.jsx` - Loading state skeletons
- `ThemeProvider.jsx` - Dark/light theme management

### Specialized Widgets
- `LatestNewsWidget.jsx` - News widget with media support
- `LatestPostsWidget.jsx` - Posts widget with media support
- `PersonalMoodboardWidget.jsx` - Personal moodboard widget
- `InvitationLinkWidget.jsx` - Invitation link management
- `SubscriptionBadge.jsx` - Subscription status display
- `EventParticipation.jsx` - Event participation widget
- `EventParticipationStats.jsx` - Event analytics and statistics
- `EventsMap.jsx` - Map component for displaying events using Mapbox
- `TestNotificationSystem.jsx` - Notification testing component

### Development & Debug Components
- `NotificationDebugger.jsx` - Debug tool for testing email notification queue
- `NotificationSystemManager.jsx` - Notification system management interface
- `NotificationSystemTester.jsx` - Testing component for notification features

## Modal & Dialog Components
- `MembersDetailModal.jsx` - Member details popup
- `EditItemDialog.jsx` - Dialog for editing moodboard items
- `EventDetailsDialog.jsx` - Reusable event details dialog with RSVP functionality

## Moodboard System
- `moodboardGallery.jsx` - Moodboard gallery display
- `MoodboardItem.jsx` - Individual moodboard item component

### Moodboard Folder Components (`src/components/Moodboard/`)
- `MoodboardCanvas.jsx` - Canvas-based moodboard interface
- `MoodboardItem.jsx` - Individual item component
- `MoodboardItemDisplay.jsx` - Item display logic
- `MoodboardItemGrid.jsx` - Grid layout for items
- `MoodboardSettingsDialog.jsx` - Settings configuration
- `ZoomControls.jsx` - Zoom interface controls
- `index.js` - Module exports

## Layout Components
- `Footer.jsx` - Application footer component

## Shared Widget Components (`src/components/shared/`)
- `WidgetEmptyState.jsx` - Empty state display for widgets
- `WidgetErrorState.jsx` - Error state display for widgets
- `WidgetHeader.jsx` - Standard widget header component
- `WidgetSkeleton.jsx` - Loading skeleton for widgets

## SuperAdmin Components (`src/components/superadmin/`)
- `TicketsManagement.jsx` - Super admin ticket dashboard and management

## Key Components Summary
- **Chat.jsx** - Real-time network chat with mentions and replies
- **MediaUpload.jsx** - Comprehensive file upload system
- **MediaPlayer.jsx** - Video/audio playback with custom controls
- **LinkPreview.jsx** - Enhanced URL preview cards
- **PollCard.jsx** - Interactive polling with multiple types
- **NetworkOnboardingWizard.jsx** - Step-by-step network setup
- **AdminLayout.jsx** - Admin interface wrapper
- **ModerationTab.jsx** - Content and user moderation tools
- **ThemeProvider.jsx** - Dark/light mode management