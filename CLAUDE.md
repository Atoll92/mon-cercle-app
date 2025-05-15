# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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

- API functions are organized in the `src/api/` directory:
  - `auth.jsx`: Authentication-related functions
  - `networks.jsx`: Network management (users, events, news)
  - `directMessages.js`: Direct messaging system
  - `moodboards.jsx`: Moodboard functionality

#### Context Providers

The app uses React Context for state management:
- `AuthProvider` (`context/authcontext.jsx`): Manages user authentication state
- `NetworkProvider` (`context/networkContext.jsx`): Manages network data
- `DirectMessagesProvider` (`context/directMessagesContext.jsx`): Manages direct messaging state
- `NavigationProvider` (`context/navigationContext.jsx`): Unified navigation system

#### Routing

The application uses React Router for routing, with protected routes implemented via the `ProtectedRoute` component to secure access to authenticated-only features.

#### Edge Functions

Supabase Edge Functions handle server-side operations:
- `create-checkout-session`: Creates Stripe checkout sessions
- `stripe-webhook`: Processes Stripe webhook events
- `network-invite`: Sends network invitations to users
- `manage-subscription`: Handles subscription management

### Data Model

Key entities in the Supabase database:
- `profiles`: User profiles linked to auth users
- `networks`: User networks/communities
- `network_events`: Events within networks
- `network_news`: News/posts within networks
- `direct_conversations`: Direct message conversations
- `direct_messages`: Individual messages in conversations
- `portfolio_items`: User portfolio projects
- `wiki_pages`: Network wiki content
- `network_files`: Shared network files

## UI Components

### Layout Components
- `GlobalNavbar`: Main navigation component
- `MainLayout`: Layout wrapper for all pages
- `SideMenu`: Side navigation menu

### Feature Components
- `Chat`: Handles network chat interaction
- `DirectMessageChat`: Direct messaging interface
- `EventsTab`: Network event management and display
- `MembersTab`: Network member listing and management
- `SocialWallTab`: Combined news and portfolio social feed
- `WikiTab`: Wiki content display
- `FilesTab`: Shared files management

### Theme Support
- Dark mode and light mode support
- ThemeProvider component
- Custom theme extensions via MUI theme provider

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
- updated_at (timestamp)

portfolio_items
- id (uuid, PK)
- profile_id (uuid, FK to profiles.id)
- title (varchar)
- description (text)
- url (varchar)
- image_url (varchar)
- created_at (timestamp)
- updated_at (timestamp)

networks
- id (uuid, PK)
- name (varchar)
- description (text)
- logo_url (varchar)
- background_image_url (varchar)
- subscription_status (varchar)
- subscription_plan (varchar)
- subscription_end_date (timestamp)
- stripe_customer_id (varchar)
- stripe_subscription_id (varchar)
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
- read_at (timestamp)
- created_at (timestamp)
- updated_at (timestamp)

messages
- id (uuid, PK)
- network_id (uuid, FK to networks.id)
- user_id (uuid, FK to profiles.id)
- content (text)
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

### Messaging

Direct messaging system allows users to:
- Start conversations with other users
- Send/receive messages in real-time using Supabase realtime subscriptions
- See unread message counts

### Events

Network events system to:
- Create, update, and delete events
- Track event participation
- Export event participant lists
- View events on a map and calendar

### Files & Content

Content management features:
- Wiki pages with categories
- Shared files system
- Moodboards for visual content

### Social Wall

Combined social feed that includes:
- Network news posts
- Member portfolio projects
- Interactive content with media support

### Portfolio

User portfolio system:
- Users can add portfolio projects
- Projects can include images and links
- Portfolio items appear in the social wall

### Chat

Real-time network chat:
- Persistent chat history
- User presence indicators
- Support for fullscreen mode
- Link previews

### Subscription & Billing

Stripe integration for subscription management:
- Payment processing
- Subscription status tracking
- Billing information management