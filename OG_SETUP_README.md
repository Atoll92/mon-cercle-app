# Open Graph Setup for Invitation Links

## Problem

Social media platforms (WhatsApp, Discord, Facebook, etc.) need **server-side** Open Graph meta tags to show link previews. However, Conclav uses a client-side React app (Vite SPA), which renders meta tags in the browser after the page loads. Social media crawlers don't execute JavaScript, so they can't see React-rendered meta tags.

## Solution

We've created a dedicated Supabase Edge Function that generates network-specific OG tags.

### For Social Media Sharing

**Use the dedicated preview URL format:**

```
https://etoxvocwsktguoddmgcu.supabase.co/functions/v1/invitation-preview/{CODE}
```

**Example:**
```
https://etoxvocwsktguoddmgcu.supabase.co/functions/v1/invitation-preview/5B1E7D90
```

This URL:
- ✅ Shows network-specific name, description, and background image in previews
- ✅ Works on WhatsApp, Facebook, Twitter, LinkedIn, Discord, Telegram
- ✅ Has a "Join Network" button that redirects to the main app
- ✅ No authentication required (publicly accessible)

### For Direct User Access

Users can still visit the regular URL and it works normally:
```
https://www.conclav.club/join/{CODE}
```

## Testing

### Test the Preview Function
```bash
curl -s "https://etoxvocwsktguoddmgcu.supabase.co/functions/v1/invitation-preview/5B1E7D90" | grep "og:title"
```

### Test with Social Media Debuggers
- **Facebook**: https://developers.facebook.com/tools/debug/
- **Twitter**: https://cards-dev.twitter.com/validator
- **LinkedIn**: https://www.linkedin.com/post-inspector/
- **OpenGraph**: https://www.opengraph.xyz/

## Implementation Details

The Supabase Edge Function:
1. Extracts the invitation code from the URL
2. Fetches network details from Supabase database
3. Generates HTML with network-specific OG meta tags
4. Returns static HTML (crawlers can read it)
5. Includes a "Join Network" button for real users

### Files
- **Supabase Function**: `/supabase/functions/invitation-preview/index.ts`
- **Vercel API** (alternative): `/api/invitation/[code].js`

## Future Improvements

To make `/join/:code` URLs work automatically with social media:

1. **Option 1**: Migrate to Next.js or Remix for SSR support
2. **Option 2**: Use Vercel's prerendering (complex setup)
3. **Option 3**: Use a service like Prerender.io or similar

For now, the Supabase Edge Function URL is the recommended approach.
