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

# Lint code
npm run lint
```

## Core Features

### Networks
Create closed networks for communities, teams, or groups with:
- Member management
- Events
- News posts
- Shared files
- Wiki pages
- Chat

### Collaboration Tools
- Chat messaging
- Direct messaging
- File sharing
- Wiki content creation
- Moodboards for visual collaboration

### User Features
- Profiles with portfolios
- Customizable themes
- Event participation
- File uploads and downloads

### Admin Features

#### Network Management
- Invite members (including batch invitations through CSV/Excel imports)
- Manage member roles and permissions
- Customize network branding and appearance

#### Content Management
- Create and manage network events
- Post news and announcements
- Organize and categorize wiki content

#### Moderation Tools
- Content Moderation: Flag, hide, or remove inappropriate content
- User Moderation: Temporarily suspend users or restrict capabilities
- Moderation Logs: Track all moderation actions for accountability
- Batch Moderation: Efficiently manage multiple items

## Database Schema

The application uses Supabase (PostgreSQL) with the following key tables:
- `profiles`: User profiles linked to auth users
- `networks`: User networks/communities
- `messages`: Network chat messages
- `direct_conversations` & `direct_messages`: DM system
- `network_events`: Event management
- `network_news`: News and announcements
- `wiki_pages`: Knowledge base content
- `moodboards`: Visual collaboration boards
- `network_files`: Shared files system
- `moderation_logs`: Tracks moderation actions

## Supabase Setup

### Migrations
Database schema is managed through Supabase migrations. To apply migrations:

```bash
supabase migration up
```

### Edge Functions
The app uses Supabase Edge Functions for server-side operations:
- Network invitations
- Stripe payment processing
- Subscription management

## License

All rights reserved. This codebase is proprietary and may not be copied, modified, or distributed without permission.