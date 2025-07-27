# Components Guide

This document describes the React components in the Conclav application, organized by category.

## Core Components

### Layout & Navigation

**NetworkHeader.jsx**
- Network header with consistent 80px height
- Displays network logo, navigation, and user menu
- Responsive design with mobile menu

**AdminLayout.jsx**
- Admin interface layout wrapper
- Consistent 80px header height
- Sidebar navigation for admin sections

**ProtectedRoute.jsx**
- Route protection wrapper
- Redirects unauthenticated users to login
- Preserves intended destination

**ProfileAwareRoute.jsx**
- **Multiple profiles system route wrapper**
- Ensures active profile is loaded before rendering
- Integrates with ProfileProvider
- Handles profile switching scenarios

**Footer.jsx**
- Application footer with links
- Privacy policy, terms, documentation links

### Authentication & User Management

**ProfileSelector.jsx**
- **Multiple profiles system - Profile selection interface**
- Displays available profiles/networks for user
- Visual network cards with profile information
- Profile creation for new networks
- Used during login/onboarding

**ProfileSwitcher.jsx**
- **Multiple profiles system - Quick profile switching**
- Dropdown/modal for rapid profile changes
- Shows active profile indicator
- Persistent across application tabs
- Integrates with cookie-based storage

**UserSearchAutocomplete.jsx**
- Real-time user search with debouncing
- Shows avatars and bio previews
- Excludes existing conversations
- Used in direct messages and mentions

**UserBadges.jsx**
- Displays user's earned badges
- Tooltip with badge descriptions
- Compact and full display modes

**SubscriptionBadge.jsx**
- Shows network subscription status
- Plan name and expiration
- Trial status indicator

## Chat & Messaging Components

### Network Chat

**Chat.jsx**
- Real-time network chat with media support
- @mention functionality with autocomplete
- Message reply system with context
- Link previews and media player integration
- Message deletion for authors and admins

**ChatTab.jsx**
- Wrapper for chat interface
- Handles fullscreen mode
- Chat state management

### Direct Messages

**DirectMessageChat.jsx**
- DM interface with dark mode support
- Enhanced link preview integration
- Media sharing capabilities
- Read receipts

**DirectMessagesList.jsx**
- Conversation list with unread counts
- Dark mode ready
- Last message preview
- Online status indicators

**CommentSection.jsx**
- Threaded comment system for social wall
- Nested replies support
- Real-time updates
- Moderation controls for admins

## Media Components

### Upload & Display

**MediaUpload.jsx**
- Comprehensive file upload system
- Multi-file support with progress
- File type validation
- Preview generation
- Storage quota checking

**MediaPlayer.jsx**
- Video/audio playback
- Artwork display for audio files
- Fullscreen support
- Custom controls

**ImageViewerModal.jsx**
- Full-screen image viewer
- Zoom and pan controls
- Gallery navigation
- Keyboard shortcuts

### PDF Components

**PDFReader.jsx**
- Full PDF document reader
- Page navigation controls
- Zoom functionality

**PDFModal.jsx**
- Modal wrapper for PDF viewing
- Download option
- Responsive sizing

**PDFPreview.jsx**
- Basic PDF preview component
- First page thumbnail

**PDFPreviewEnhanced.jsx**
- Enhanced preview with metadata
- Page count display
- File size information

**PDFFirstPageViewer.jsx**
- Generates first page thumbnails
- Used in file listings

**SimplePDFViewer.jsx**
- Lightweight PDF viewer
- Minimal UI

### Content Preview

**LinkPreview.jsx**
- Enhanced URL preview cards
- OpenGraph data extraction
- Loading states with skeletons
- Error handling with fallbacks
- Image resolution and caching

## Network Feature Components

### Events

**EventsTab.jsx**
- Event listing and management
- Calendar and list views
- Event creation/editing
- RSVP tracking

**EventParticipation.jsx**
- Event RSVP widget
- Attendance status
- Participant count

**EventParticipationStats.jsx**
- Event analytics dashboard
- Attendance trends
- Demographic breakdowns

**EventsMap.jsx**
- Mapbox integration
- Event location markers
- Clustering for multiple events

### Members

**MembersTab.jsx**
- Member listing with search
- Integrated invitation management
- Badge display
- Role management

**VirtualizedMemberList.jsx**
- Performance-optimized member list
- React Window integration
- Handles large member counts

**MembersDetailModal.jsx**
- Member profile popup
- Contact information
- Activity summary

### Content Management

**NewsTab.jsx**
- Network news feed
- Rich text editor
- Media attachments
- Moderation controls

**SocialWallTab.jsx**
- Combined news and portfolio feed
- Media gallery view
- Interactive engagement
- Comment threads

**WikiTab.jsx**
- Wiki content browser
- Category navigation
- Search functionality

**FilesTab.jsx**
- Shared file management
- Upload/download tracking
- File type filtering
- Storage usage display

## UI Components

### Animation & Effects

**AnimatedComponents.jsx**
- Reusable animation wrappers
- Fade, slide, scale effects
- Stagger animations

**TextCycler.jsx**
- Cycling text display
- Smooth transitions
- Configurable intervals

**ThreeJSBackground.jsx**
- 3D animated background
- Performance considerations
- Responsive scaling

### Forms & Input

**QuillEditor.jsx**
- Rich text editor
- Media embedding
- Custom toolbar
- Format preservation

**AddressSuggestions.jsx**
- Location autocomplete
- Geocoding integration
- Address formatting

**EditItemDialog.jsx**
- Moodboard item editing
- Position and size controls
- Content updates

### Widgets & Cards

**PollCard.jsx**
- Interactive poll display
- Multiple question types
- Real-time vote updates
- Results visualization

**LatestNewsWidget.jsx**
- News preview widget
- Media thumbnail support
- Author and date display
- Consistent styling

**LatestPostsWidget.jsx**
- Portfolio posts widget
- Media preview
- Engagement metrics
- Widget header styling

**PersonalMoodboardWidget.jsx**
- Moodboard preview
- Drag interaction hint
- Quick access

**InvitationLinkWidget.jsx**
- Invitation link display
- QR code generation
- Copy functionality
- Usage tracking

## Admin Components

### Network Administration

**NetworkSettingsTab.jsx**
- Network configuration
- Feature toggles
- Privacy settings
- Theme customization

**ModerationTab.jsx**
- Content moderation tools
- User suspension/restriction
- Moderation logs
- Bulk actions

**ThemeTab.jsx**
- Theme color picker
- Preview functionality
- Custom CSS support

**NotificationQueueTab.jsx**
- Email queue monitoring
- Retry failed sends
- Queue statistics
- Template preview

### User & Content Management

**BadgesTab.jsx**
- Badge creation and management
- Icon and color selection
- Automatic criteria configuration
- User activity leaderboard

**PollsTab.jsx**
- Poll management interface
- Results analysis
- Export functionality
- Poll scheduling

**InvitationLinksTab.jsx**
- Invitation link management
- QR code display
- Usage analytics
- Expiration control

**BatchInviteModal.jsx**
- Bulk email invitations
- CSV import
- Role assignment
- Progress tracking

### Billing & Support

**BillingTab.jsx**
- Subscription management
- Payment history
- Usage statistics
- Plan comparison

**MonetizationTab.jsx**
- Revenue tracking
- Subscription analytics
- Payment method management

**SupportTicketsTab.jsx**
- Ticket management for admins
- Status updates
- Priority assignment
- Response tracking

## Super Admin Components

**TicketsManagement.jsx**
- System-wide ticket dashboard
- Advanced filtering
- Assignment management
- Internal notes
- Performance metrics

## Utility Components

**LoadingSkeleton.jsx**
- Consistent loading states
- Content-aware skeletons
- Smooth transitions

**ErrorBoundary.jsx**
- Error catching wrapper
- Fallback UI
- Error reporting

**ThemeProvider.jsx**
- Theme context provider
- Dark/light mode toggle
- Custom theme support

**OnboardingGuide.jsx**
- Interactive tooltips
- Step-by-step guidance
- Progress tracking
- Skip functionality

**WelcomeMessage.jsx**
- New member welcome dialog
- Celebration animation (confetti)
- Feature overview
- Tour initiation

## Component Best Practices

1. **Consistent Styling**: Use Material-UI components and theme
2. **Error Handling**: Wrap in ErrorBoundary where appropriate
3. **Loading States**: Always show loading feedback
4. **Accessibility**: Include ARIA labels and keyboard navigation
5. **Performance**: Use React.memo and useMemo for expensive operations
6. **Dark Mode**: Test components in both light and dark themes
7. **Responsive Design**: Ensure mobile compatibility