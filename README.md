# Mon Cercle App

A platform for creating and managing closed user networks with powerful collaboration and community features.

## Tech Stack

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
- **PDF Rendering**: pdfjs-dist
- **Media Processing**: music-metadata-browser, browser-image-compression
- **Analytics**: Vercel Analytics

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Lint code
npm run lint

# Preview production build
npm run preview
```

## Core Features

### Networks
Create closed networks for communities, teams, or groups with:
- Member management with role-based permissions
- Events with location mapping and participation tracking
- News posts with rich media support (images, videos, PDFs)
- Shared files with storage quota management
- Wiki pages with revision history
- Real-time chat with replies and media sharing
- Social wall combining news and portfolio items
- Polls for community engagement
- Customizable themes and branding

### Collaboration Tools
- **Chat Messaging**: Real-time chat with mentions, replies, and media sharing
- **Direct Messaging**: Private conversations with media support
- **Comments System**: Threaded comments on news and portfolio items
- **File Sharing**: Upload and share documents, images, videos, and PDFs
- **Wiki System**: Collaborative knowledge base with categories and search
- **Moodboards**: Visual collaboration boards for creative projects
- **Polls**: Create surveys with multiple choice, yes/no, and date picker options

### User Features
- **Rich Profiles**: Detailed profiles with portfolios, skills, and social links
- **Portfolio Projects**: Showcase work with images, videos, and descriptions
- **Engagement Badges**: Earn badges for contributions and achievements
- **Notification Preferences**: Control email notifications for different activities
- **Event Participation**: RSVP to events and view attendee lists
- **Media Uploads**: Share images, videos, audio files, and PDFs
- **Full-Screen Media Viewer**: Enhanced viewing experience for images and PDFs
- **Dark/Light Mode**: System-wide theme support

### Admin Features

#### Network Management
- **Member Management**: Invite members individually or in bulk via CSV/Excel
- **Invitation Links**: Create shareable invitation links with QR codes
- **Role Management**: Assign admin or member roles with different permissions
- **Network Settings**: Configure privacy levels, features, and default tabs
- **Storage Management**: Monitor and manage network storage usage
- **Billing Management**: Handle subscriptions and payment history

#### Content Management
- **Events**: Create events with locations, capacity limits, and cover images
- **News Posts**: Publish announcements with rich media attachments
- **Wiki Pages**: Organize knowledge base with categories and publishing controls
- **Polls**: Create and manage community polls with result analytics
- **Badge System**: Design custom badges and award them to members

#### Moderation Tools
- **Content Moderation**: Flag, hide, or remove inappropriate content
- **Comment Moderation**: Manage comments on social wall items
- **User Moderation**: Suspend users or restrict their capabilities
- **Moderation Logs**: Complete audit trail of all moderation actions
- **Batch Operations**: Efficiently manage multiple items at once

#### Analytics & Monitoring
- **Network Statistics**: View member count, activity levels, and growth
- **Storage Analytics**: Track storage usage by content type
- **Email Queue Monitoring**: Monitor notification delivery status
- **User Engagement**: Track member contributions and activity

## Database Schema

The application uses Supabase (PostgreSQL) with the following key tables:

### Core Tables
- `profiles`: User profiles with notification preferences and badges
- `networks`: Network configuration, settings, and subscription data
- `messages`: Network chat with replies and media support
- `direct_conversations` & `direct_messages`: Private messaging with media

### Content Tables
- `network_events`: Events with location data and participation tracking
- `network_news`: News posts with rich media attachments
- `portfolio_items`: User portfolio projects with media
- `wiki_pages`: Knowledge base with categories and revisions
- `moodboards` & `moodboard_items`: Visual collaboration boards
- `network_files`: Shared file storage with metadata

### Feature Tables
- `network_polls` & `network_poll_votes`: Polling system
- `social_wall_comments`: Comments on news and portfolio items
- `network_badges` & `user_badges`: Achievement system
- `network_invitation_links`: Shareable invitation codes
- `media_uploads`: Centralized media storage and metadata

### System Tables
- `moderation_logs`: Audit trail for moderation actions
- `notification_queue`: Email notification delivery queue
- `opengraph_cache`: URL preview metadata cache

## Supabase Setup

### Migrations
Database schema is managed through Supabase migrations. To apply migrations:

```bash
supabase migration up
```

### Edge Functions
The app uses Supabase Edge Functions for server-side operations:
- `network-invite`: Send invitation emails to new members
- `create-checkout-session`: Initialize Stripe payment flow
- `stripe-webhook`: Handle payment events and update subscriptions
- `manage-subscription`: Manage subscription lifecycle
- `test-stripe`: Development testing for payment integration

## Subscription Plans

The platform offers multiple subscription tiers:
- **Community Plan**: €17/month - Essential features for small communities
- **Professional Plan**: €49/month - Advanced features and higher limits
- **Enterprise Plan**: €199/month - Maximum capacity and priority support

Each plan includes different storage quotas (2GB to 5TB) and member limits.

## Environment Variables

Required environment variables:
- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Supabase anonymous key
- `STRIPE_SECRET_KEY`: Stripe secret key (for Edge Functions)

See `README_ENV_SETUP.md` for detailed setup instructions.

## License

All rights reserved. This codebase is proprietary and may not be copied, modified, or distributed without permission.