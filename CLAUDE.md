# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with the **Conclav** codebase (formerly Mon Cercle).

## 🚀 Quick Start

**Conclav** is a privacy-focused social network platform. Production domains: `conclav.club` and `conclav.network`.

### Essential Commands
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run lint         # Check code style
npm run test         # Run all tests
npm run test:watch   # Run tests in watch mode
```

## 📚 Documentation Hub

### Core Documentation
- **[Database Documentation](./database.md)** - **CRITICAL: Complete schema, relationships, and data analysis - MUST READ before database changes**
- **[Functions Documentation](./functions.db)** - **CRITICAL: All Supabase Edge Functions, Stripe integrations, CRON jobs**
- **[Application Status](./status.md)** - Current state and production readiness
- **[Pre-Launch Tasks](./tasks.md)** - Remaining tasks before production launch

### Recent Changes

#### 2025-10-29: Analytics System
- **User Analytics Dashboard**: Comprehensive monitoring for soft launch
  - Migration: `20251029000000_analytics_system.sql`
  - Track: logins, network creation, invites, profile completion, first posts, feature usage, errors
  - Views: network health, onboarding funnel, user engagement, recent errors
  - Super Admin Dashboard → "User Analytics" tab
  - **[Analytics Integration Guide](./docs/ANALYTICS_INTEGRATION.md)** - Full documentation

#### 2025-08-29: Unified Comments Table
- **Unified Comments Table**: Consolidated 3 separate comment tables into single `comments` table
  - Migration: `20250829162551_unified_comments_table.sql`
  - Simplified API: `src/api/comments.js` now uses single table
  - Wiki comments now support threading
  - Full referential integrity with cascading deletes

### Technical References
- **[Project Structure](./docs/PROJECT_STRUCTURE.md)** - Directory organization
- **[Database Schema](./docs/DATABASE_SCHEMA.md)** - Table definitions
- **[RLS Policies](./docs/RLS_POLICIES.md)** - Row-Level Security
- **[API Documentation](./docs/API_DOCUMENTATION.md)** - API functions
- **[Components Guide](./docs/COMPONENTS_GUIDE.md)** - React components
- **[Analytics Integration](./docs/ANALYTICS_INTEGRATION.md)** - User analytics and tracking
- **[Recent Changes](./docs/RECENT_CHANGES.md)** - Latest updates
- **[File Listings](./docs/FILE_LISTINGS.md)** - Complete file directory
- **[Component Listings](./docs/COMPONENT_LISTINGS.md)** - All components by category

## 🏗️ Architecture Overview

### Tech Stack
- **Frontend**: React with Vite, Material UI, React Router
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **Payments**: Stripe integration
- **Real-time**: Supabase Realtime
- **Media**: 20MB upload limit, browser-image-compression, pdfjs-dist
- **Testing**: Vitest, React Testing Library

### Key Architectural Decisions

#### Multiple Profiles System (ADR-001)
- **1:many:many** User:Profile:Network relationship
- Each user gets a separate profile per network they join
- Profile-aware components use `activeProfile?.id || user.id` pattern
- Managed by `ProfileProvider` context

#### Unified Post Creation (ADR-002)
- Single interface for portfolio and news posts
- Consistent UI/UX across content types

#### API-Level Notifications (ADR-003)
- All notifications triggered at API level
- Centralized processing for reliability

#### Network-First Navigation (ADR-004)
- NetworkSelector/NetworkSwitcher for better UX
- Users think in terms of networks, not profiles

## 🎯 Key Development Patterns

### API Function Pattern
```javascript
import { handleArrayError, handleObjectError } from '../utils/errorHandling';

export const fetchData = async (supabase, profileId, networkId) => {
  try {
    const { data, error } = await supabase
      .from('table_name')
      .select('*')
      .eq('profile_id', profileId)
      .eq('network_id', networkId);
    
    if (error) throw error;
    return handleArrayError(data);
  } catch (error) {
    console.error('Error fetching data:', error);
    return { error: error.message };
  }
};
```

### Component Pattern
```javascript
// Always check for activeProfile
const { activeProfile, user } = useAuth();
const profileId = activeProfile?.id || user?.id;

// Use loading states
if (loading) return <LoadingSkeleton />;
if (error) return <WidgetErrorState error={error} />;
if (!data || data.length === 0) return <WidgetEmptyState />;
```

## 🔒 Database Schema Validation Protocol

**CRITICAL**: Before ANY database changes:

1. **Read `./database.md`** - Complete schema understanding
2. **Test multi-profile** - Ensure 1:many:many support

```bash
# Required workflow
1. Read ./database.md
2. Check latest migrations
3. Test RLS policies
4. Verify foreign keys
```

## 🚀 Common Development Tasks

### Adding New Features
1. Check if feature needs network configuration
2. Ensure RLS policies support multi-profile system
3. Add API functions to `src/api/`
4. Create UI components with dark mode support
5. Update documentation
6. Test with multiple profiles and networks

### Database Changes
1. **MUST** read `database.md` first
2. Create migration in `supabase/migrations/`
3. Update RLS policies for multi-profile support
4. Test migration rollback
5. Update documentation

### Media Handling
```javascript
import { validateMediaFile } from '../utils/mediaUpload';

const isValid = await validateMediaFile(file, 20); // 20MB limit
if (!isValid.valid) {
  console.error('Media validation failed:', isValid.error);
  return;
}

// Compress images when possible
if (file.type.startsWith('image/')) {
  const compressed = await imageCompression(file, {
    maxSizeMB: 2,
    maxWidthOrHeight: 1920
  });
}
```

## 🎨 Feature Areas

### Core Systems
- **Multiple Profiles**: User can have one profile per network
- **Networks**: Communities with events, news, files, wiki
- **Direct Messaging**: Real-time chat with media support
- **Social Wall**: Combined feed of news and portfolio items
- **Media System**: 20MB uploads, image/video/audio/PDF support
- **Unified Comments**: Single `comments` table for all content types (news, posts, events, wiki)

### Admin Features
- **Network Admin**: Member, content, and settings management
- **Super Admin**: System-wide monitoring and support tickets
- **Moderation**: Content and user moderation with audit logs

### Technical Features
- **Notifications**: Queue-based email system with ICS attachments
- **Subscriptions**: Stripe integration for billing
- **Real-time**: Live updates for chat and content
- **Dark Mode**: Theme support across all components

## ✅ Development Checklist

### Security
- [ ] Never expose Supabase service key
- [ ] Validate inputs with `sanitizeHtml`
- [ ] Check RLS policies for new tables
- [ ] Validate file uploads (20MB limit)
- [ ] Verify network membership

### Performance
- [ ] Use `LazyImage` for images
- [ ] Virtualize long lists
- [ ] Batch API calls
- [ ] Memoize expensive renders

### Code Quality
- [ ] Follow multi-profile pattern
- [ ] Use error handling utilities
- [ ] Support dark mode
- [ ] Add JSDoc comments
- [ ] Update CLAUDE.md

## 🔧 Quick Reference

### Environment Variables
```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
STRIPE_SECRET_KEY (Edge Functions)
```

### Key Files
- Entry: `src/main.jsx`, `src/App.jsx`
- Auth: `src/context/authcontext.jsx`
- Profiles: `src/context/profileContext.jsx`
- Supabase: `src/supabaseclient.jsx`
- Error Handling: `src/utils/errorHandling.js`

### Key Components

#### UserContent Component
- **Purpose**: Display all user-generated text content with consistent formatting
- **Location**: `src/components/UserContent.jsx`
- **Usage**: Use for ANY user-generated content (comments, posts, wiki pages, etc.)
- **Features**: Automatic text overflow handling, URL linkification, truncation with "Show more"
- **Props**:
  - `content` (string, required): The text/HTML to display
  - `html` (boolean, default: false): Whether content contains HTML
  - `component` (string, default: 'div'): Root element type
  - `maxLines` (number, optional): Max lines before truncation with "Show more" button
  - `sx` (object): Additional MUI styles

### Testing Commands
```bash
npm run test          # Run tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

## 📝 Best Practices

1. **Multi-Profile Awareness**: Always use `activeProfile?.id || user.id`
2. **Error Handling**: Use centralized utilities from `utils/errorHandling.js`
3. **Media Limits**: Respect 20MB limit, compress images
4. **Real-time**: Use `useRealtimeChannel` hook
5. **Dark Mode**: Support via `ThemeProvider`
6. **Documentation**: Update CLAUDE.md for new features

---

**Remember**: This is a privacy-focused social network. Always prioritize user data protection and network isolation.