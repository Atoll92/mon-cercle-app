# Project Structure

This document describes the file and directory organization of the Conclav application.

## Directory Overview

```
mon-cercle-app/
├── public/                    # Static assets
├── src/                       # Source code
│   ├── __mocks__/            # Mock implementations for testing
│   ├── api/                  # API layer functions
│   ├── assets/               # Images, icons, and static resources
│   ├── components/           # Reusable React components
│   │   ├── admin/            # Admin-specific components
│   │   ├── superadmin/       # Super admin components
│   │   ├── shared/           # Shared widget components
│   │   └── [feature components]
│   ├── config/               # Application configuration
│   ├── constants/            # Application constants
│   ├── context/              # React Context providers
│   ├── hooks/                # Custom React hooks
│   ├── mocks/                # MSW mock handlers
│   ├── pages/                # Page components (routes)
│   ├── services/             # Business logic and external services
│   ├── stripe/               # Stripe configuration
│   ├── styles/               # CSS files
│   └── utils/                # Utility functions
├── supabase/                 # Supabase backend
│   ├── functions/            # Edge functions
│   └── migrations/           # Database migrations
├── docs/                     # Documentation files
└── [config files]            # Various configuration files
```

## Key Directories

### `/src/api/`
API layer containing all data fetching and mutation functions. Each file corresponds to a specific feature area.

### `/src/components/`
Reusable React components organized by:
- Feature area (chat, media, events, etc.)
- User role (admin/, superadmin/)
- Shared utilities (shared/)

### `/src/pages/`
Page-level components that map to routes. Each page represents a distinct view in the application.

### `/src/context/`
React Context providers for global state management:
- `authcontext.jsx` - Authentication state
- `networkContext.jsx` - Network data
- `directMessagesContext.jsx` - Direct messaging

### `/src/hooks/`
Custom React hooks for reusable logic:
- Animation hooks
- Data fetching hooks
- UI interaction hooks

### `/src/services/`
Business logic and external service integrations:
- Email notifications
- Payment processing
- File management
- URL preview generation

### `/src/utils/`
Utility functions for common operations:
- Media handling
- Animation helpers
- Validation
- Formatting

### `/supabase/`
Backend configuration and functions:
- `functions/` - Serverless Edge Functions
- `migrations/` - Database schema migrations
- `config.toml` - Supabase configuration

## Configuration Files

### Root Level
- `package.json` - Dependencies and scripts
- `vite.config.js` - Build configuration
- `vercel.json` - Deployment settings
- `eslint.config.js` - Code linting rules
- `.env` - Environment variables (not tracked)

### Testing
- `src/setupTests.js` - Test environment setup
- `src/test-utils.jsx` - Testing utilities
- `vitest.config.js` - Test runner configuration

## Entry Points

### Application
- `index.html` - HTML template
- `src/main.jsx` - React app bootstrap
- `src/App.jsx` - Root component with routing

### Styles
- `src/index.css` - Global styles
- `src/App.css` - App-level styles
- `src/styles/` - Component-specific styles

## Build Output

### Development
- Hot module replacement
- Source maps
- Development server at `http://localhost:5173`

### Production
- `dist/` - Optimized build output
- Code splitting
- Asset optimization
- Tree shaking

## Environment Variables

Required environment variables:
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key
- `STRIPE_SECRET_KEY` - Stripe API key (for Edge Functions)

Optional:
- `VITE_MAPBOX_TOKEN` - Mapbox API token
- `VITE_GOOGLE_MAPS_API_KEY` - Google Maps API key

## Import Aliases

The project uses absolute imports from `src/`:
```javascript
import { Component } from 'components/Component'
import { useHook } from 'hooks/useHook'
import { utility } from 'utils/utility'
```