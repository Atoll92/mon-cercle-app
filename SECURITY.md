# Security Guidelines for Conclav

This document outlines security best practices and configuration for the Conclav application.

## 🔐 Environment Variables

### Critical Security Rules

1. **NEVER commit actual API keys or secrets to version control**
2. **Always use environment variables for sensitive configuration**
3. **Use different keys for development and production**
4. **Rotate keys regularly, especially after team member changes**

### Required Environment Variables

#### Client-Side Variables (VITE_* prefix)

These variables are embedded in the client-side bundle and are **publicly accessible**. Only use public/publishable keys.

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc... # Public anon key (safe for client)

# Stripe Configuration
VITE_STRIPE_PUBLIC_KEY=pk_test_... # Publishable key (safe for client)

# Giphy API
VITE_GIPHY_API_KEY=your_giphy_api_key # Public API key

# Mapbox Configuration
VITE_MAPBOX_TOKEN=pk.eyJ... # Public access token (safe for client)
```

#### Server-Side Variables (Edge Functions)

These should ONLY be configured in Supabase dashboard under Settings > Edge Functions > Environment Variables:

```bash
# Stripe Secret Key (NEVER expose to client!)
STRIPE_SECRET_KEY=sk_live_... # or sk_test_... for testing

# Supabase Service Role Key (NEVER expose to client!)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... # Full database access
```

### Setup Instructions

1. **Copy the example file**:
   ```bash
   cp .env.example .env
   ```

2. **Fill in your development values** in `.env`:
   - Use test/development keys
   - Get Mapbox token from: https://account.mapbox.com/access-tokens/
   - Get Supabase keys from: https://app.supabase.com/project/_/settings/api

3. **Never commit `.env`** - It's already in `.gitignore`

4. **For production**, set environment variables in your hosting platform:
   - Vercel: Project Settings > Environment Variables
   - Netlify: Site Settings > Environment Variables
   - Supabase Edge Functions: Dashboard > Settings > Edge Functions

### Mapbox Token Security

**What changed**: Previously, the Mapbox token was hardcoded in source files:
- `src/components/EventsMap.jsx`
- `src/components/AddressSuggestions.jsx`

**Why this was insecure**:
- Tokens visible in version control history
- Can't rotate tokens without code changes
- Anyone with code access has the token

**Current implementation**:
```javascript
// Secure: Token from environment variable
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

if (!MAPBOX_TOKEN) {
  console.error('VITE_MAPBOX_TOKEN is not defined in environment variables');
}
```

**Token restrictions**: Configure your Mapbox token at https://account.mapbox.com/access-tokens/ with:
- URL restrictions to your domains (e.g., `conclav.club`, `conclav.network`)
- Scope limitations (only allow needed APIs)
- Enable secret token for server-side usage

## 🛡️ Security Best Practices

### Input Validation & Sanitization

✅ **Already implemented**:
- DOMPurify for HTML sanitization (`src/utils/sanitizeHtml.js`)
- File upload validation with 20MB limit
- Password strength validation
- XSS protection via `sanitizeHtml` utility

```javascript
import { sanitizeHtml } from '../utils/sanitizeHtml';

// Always sanitize user-generated HTML
const cleanContent = sanitizeHtml(userContent);
```

### Row-Level Security (RLS)

✅ **Comprehensive RLS policies** enforced at database level:
- Network membership validation
- Profile ownership checks
- Admin privilege verification
- Multi-profile pattern support

**Critical pattern**:
```sql
-- Correct: Multi-profile aware
WHERE profiles.user_id = auth.uid()

-- Wrong: Don't use this
WHERE profiles.id = auth.uid()
```

### Authentication Security

**Current implementation**:
- Supabase Auth with JWT tokens
- Email/password authentication
- Secure password reset flow

**Recommendations for production**:
- [ ] Implement rate limiting on login attempts
- [ ] Add 2FA for network administrators
- [ ] Configure session timeout
- [ ] Set up suspicious login detection
- [ ] Enable CAPTCHA for registration

### File Upload Security

✅ **Current protections**:
- 20MB file size limit
- File type validation
- Image compression before upload
- Storage bucket policies

**Additional recommendations**:
- [ ] Implement virus scanning for uploads
- [ ] Add content-type verification
- [ ] Set up CDN with DDoS protection

### Logging & Monitoring

**Updated approach**:
- Use `src/utils/logger.js` for all logging
- Debug logs only in development
- Errors always logged (for monitoring)

```javascript
import { logger } from '../utils/logger';

// Development only
logger.debug('Processing payment', { userId, amount });

// Always logged
logger.error('Payment failed', error);
```

**For production**:
- [ ] Integrate Sentry for error tracking
- [ ] Set up log aggregation (e.g., Logtail)
- [ ] Configure alerts for critical errors
- [ ] Monitor API rate limits

## 🚨 Incident Response

If you suspect a security breach:

1. **Rotate all secrets immediately**:
   - Supabase keys
   - Stripe keys
   - Mapbox token
   - Any other API keys

2. **Check logs** for suspicious activity:
   - Failed login attempts
   - Unusual API usage
   - Database access patterns

3. **Notify team** and affected users if data was compromised

4. **Review and update** security policies

## 📋 Security Checklist

### Before Production Launch

- [x] Remove hardcoded API keys
- [x] Implement environment-aware logging
- [ ] Set up production environment variables
- [ ] Configure Mapbox URL restrictions
- [ ] Enable Stripe production mode
- [ ] Set up error monitoring (Sentry)
- [ ] Configure rate limiting
- [ ] Enable database backups
- [ ] Set up SSL/HTTPS
- [ ] Configure CORS properly
- [ ] Review all RLS policies
- [ ] Audit file upload permissions
- [ ] Set up monitoring alerts

### Regular Security Maintenance

- [ ] Rotate API keys quarterly
- [ ] Update dependencies monthly (`npm audit`)
- [ ] Review access logs weekly
- [ ] Test backup restoration quarterly
- [ ] Security audit annually

## 📚 Additional Resources

- [Supabase Security Best Practices](https://supabase.com/docs/guides/security)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Stripe Security](https://stripe.com/docs/security/guide)
- [Mapbox Token Best Practices](https://docs.mapbox.com/help/troubleshooting/how-to-use-mapbox-securely/)

## 🔍 Security Contacts

For security issues, please contact:
- **Email**: security@conclav.club
- **Create a system ticket**: Via Super Admin Dashboard

---

**Last Updated**: 2025-11-01
**Review Schedule**: Quarterly
