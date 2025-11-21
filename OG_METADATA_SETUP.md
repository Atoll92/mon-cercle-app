# Open Graph Metadata for Network Invitations

## Overview

This document describes the implementation of dynamic Open Graph (OG) metadata for network invitation links, enabling rich social media previews with network-specific branding.

## Problem

When sharing invitation links like `https://www.conclav.club/join/5B1E7D90`, social media platforms (Facebook, Twitter, LinkedIn, WhatsApp, etc.) would show generic Conclav branding instead of the specific network's name and background image.

## Solution

We've implemented a multi-layered approach to provide dynamic Open Graph metadata:

### 1. **Vercel Serverless Function** (Primary Solution for Social Crawlers)

**Location:** `/api/invitation/[code].js`

This serverless function intercepts requests to `/join/:code` URLs and:
- Fetches network details from Supabase based on the invitation code
- Generates an HTML page with dynamic Open Graph meta tags
- Automatically redirects users to the React app while providing rich metadata to crawlers

**Key Features:**
- Network-specific title: "Join {Network Name} on Conclav"
- Network description (cleaned and truncated to 160 chars)
- Network background image or logo for OG preview
- Support for Facebook, Twitter/X, and other social platforms
- Automatic client-side redirection to the React app

**How it works:**
```javascript
// URL: https://www.conclav.club/join/ABC123
// 1. Serverless function fetches network data
// 2. Generates HTML with OG tags
// 3. Social crawlers see the meta tags
// 4. Regular users are redirected via JavaScript
```

### 2. **Vercel Routing Configuration**

**Location:** `/vercel.json`

```json
{
  "rewrites": [
    {
      "source": "/join/:code",
      "destination": "/api/invitation/:code"
    },
    {
      "source": "/(.*)",
      "destination": "/"
    }
  ]
}
```

This configuration ensures ALL `/join/:code` requests go through the serverless function first.

### 3. **React Helmet (Client-Side Enhancement)**

**Location:** `src/pages/JoinNetworkPage.jsx`

For browsers and search engines that execute JavaScript, we also inject dynamic meta tags client-side using `react-helmet-async`.

**Implementation:**
```jsx
<Helmet>
  <title>Join {networkName} on Conclav</title>
  <meta property="og:title" content={`Join ${networkName} on Conclav`} />
  <meta property="og:description" content={networkDescription} />
  <meta property="og:image" content={networkBackgroundUrl} />
  {/* ... more meta tags */}
</Helmet>
```

### 4. **Supabase Edge Function** (Optional/Alternative)

**Location:** `supabase/functions/invitation-preview/index.ts`

This Edge Function provides the same functionality but can be deployed to Supabase if needed. It's currently not the primary solution but is available as an alternative.

## Technical Details

### Meta Tags Included

1. **Basic Meta Tags:**
   - `title`: Page title
   - `description`: Network description

2. **Open Graph (Facebook, LinkedIn):**
   - `og:type`: "website"
   - `og:url`: Full invitation URL
   - `og:title`: "Join {Network Name} on Conclav"
   - `og:description`: Network description (cleaned, max 160 chars)
   - `og:image`: Network background_image_url or logo_url
   - `og:image:width`: 1200
   - `og:image:height`: 630
   - `og:image:alt`: Network name
   - `og:site_name`: "Conclav"

3. **Twitter Card:**
   - `twitter:card`: "summary_large_image"
   - `twitter:url`: Full invitation URL
   - `twitter:title`: "Join {Network Name} on Conclav"
   - `twitter:description`: Network description
   - `twitter:image`: Network background image

### Data Flow

```
User shares: https://www.conclav.club/join/ABC123
         ↓
Vercel receives request
         ↓
Routes to /api/invitation/ABC123
         ↓
Serverless function:
  1. Queries Supabase for invitation & network data
  2. Generates HTML with OG meta tags
  3. Returns HTML to crawler/browser
         ↓
Social Crawler: Reads meta tags for preview
         ↓
Browser: JavaScript redirects to React app
         ↓
React app loads with additional meta tags via Helmet
```

## Dependencies Added

1. **react-helmet-async** `^2.0.5`
   - Client-side meta tag management
   - Installed with `--legacy-peer-deps` due to React 19

2. **styled-components** `^6.1.19`
   - Required by @giphy/react-components
   - Added to vite.config.js optimizeDeps

## Configuration Changes

### 1. `vite.config.js`
```javascript
optimizeDeps: {
  include: ['buffer', 'styled-components']
}
```

### 2. `vercel.json`
Added rewrite rule for `/join/:code` routes.

### 3. `src/App.jsx`
Wrapped app with `<HelmetProvider>` for react-helmet-async.

## Testing

### 1. **Local Testing**

```bash
npm run dev
```

Navigate to: `http://localhost:5173/join/YOUR_CODE`

**Note:** Meta tags won't show rich previews locally - you need to test on a deployed environment.

### 2. **Social Media Debuggers**

Once deployed, test with these tools:

#### Facebook Debugger
1. Go to: https://developers.facebook.com/tools/debug/
2. Enter: `https://www.conclav.club/join/YOUR_CODE`
3. Click "Debug"
4. Should show network name, description, and background image

#### Twitter Card Validator
1. Go to: https://cards-dev.twitter.com/validator
2. Enter: `https://www.conclav.club/join/YOUR_CODE`
3. Click "Preview card"
4. Should show large image card with network details

#### LinkedIn Post Inspector
1. Go to: https://www.linkedin.com/post-inspector/
2. Enter: `https://www.conclav.club/join/YOUR_CODE`
3. Should show network preview

#### General OG Tester
1. Go to: https://www.opengraph.xyz/
2. Enter: `https://www.conclav.club/join/YOUR_CODE`
3. View all OG tags and preview

### 3. **Manual Testing**

1. Create an invitation link in your network admin panel
2. Copy the invitation URL
3. Paste into:
   - WhatsApp (private message to yourself)
   - Telegram
   - Facebook Messenger
   - LinkedIn post (as draft)
   - Twitter/X
4. Verify the preview shows:
   - Network name in title
   - Network description
   - Network background image

## Deployment Checklist

- [ ] Ensure `VITE_SUPABASE_URL` is set in Vercel environment variables
- [ ] Ensure `VITE_SUPABASE_ANON_KEY` is set in Vercel environment variables
- [ ] Deploy to Vercel
- [ ] Test invitation links with social media debuggers
- [ ] Clear social media cache if needed (use debuggers' "Fetch new scrape information")

## Environment Variables Required

These should be set in Vercel:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_APP_URL=https://www.conclav.club  # Optional, defaults to conclav.club
```

## Troubleshooting

### Issue: Social media shows old/generic preview

**Solution:**
1. Use the social platform's debugger tool (links above)
2. Click "Fetch new scrape information" or similar
3. Social platforms cache OG data, so you may need to force refresh

### Issue: Preview not showing

**Checklist:**
- [ ] Invitation link is active (not expired, not at max uses)
- [ ] Network has a `background_image_url` or `logo_url`
- [ ] Image URLs are publicly accessible (not behind auth)
- [ ] Vercel environment variables are set correctly
- [ ] Deployment succeeded without errors

### Issue: Image not loading in preview

**Possible causes:**
- Image URL is returning 404
- Image requires authentication
- Image is too large (>8MB for some platforms)
- Image URL is not absolute (must start with https://)

**Solution:**
- Check that network images are uploaded to Supabase Storage with public access
- Verify image URLs are absolute and publicly accessible
- Recommended image size: 1200x630px (Facebook's recommended OG image size)

## Best Practices

1. **Network Images:**
   - Use high-quality background images (1200x630px recommended)
   - Ensure images are publicly accessible
   - Keep file sizes reasonable (<1MB)

2. **Network Descriptions:**
   - Keep descriptions concise (160 chars is the truncation limit)
   - Avoid HTML in descriptions (it gets stripped)
   - Make descriptions compelling to encourage clicks

3. **Testing:**
   - Always test invitation links with social debuggers after deployment
   - Test on multiple platforms (Facebook, Twitter, LinkedIn, WhatsApp)
   - Clear cache if you update network images or descriptions

## Files Modified/Created

### Created:
- `/api/invitation/[code].js` - Vercel serverless function
- `/supabase/functions/invitation-preview/index.ts` - Supabase Edge Function (alternative)
- `/OG_METADATA_SETUP.md` - This documentation

### Modified:
- `/vercel.json` - Added routing for invitation links
- `/vite.config.js` - Added styled-components to optimizeDeps
- `/src/App.jsx` - Added HelmetProvider
- `/src/pages/JoinNetworkPage.jsx` - Added Helmet with dynamic meta tags
- `/package.json` - Added react-helmet-async and styled-components

## Future Enhancements

1. **Dynamic OG Image Generation:**
   - Create custom images on-the-fly with network name overlaid on background
   - Use services like Vercel's OG Image Generation or custom canvas rendering

2. **A/B Testing:**
   - Test different descriptions and images for better conversion rates

3. **Analytics:**
   - Track which social platforms generate the most invitations
   - Monitor invitation link click-through rates

## Support

For issues or questions:
- Check the troubleshooting section above
- Test with social media debuggers
- Verify environment variables in Vercel
- Check Vercel function logs for errors

## References

- [Open Graph Protocol](https://ogp.me/)
- [Twitter Card Documentation](https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards)
- [Facebook Sharing Best Practices](https://developers.facebook.com/docs/sharing/webmasters/)
- [React Helmet Async](https://github.com/staylor/react-helmet-async)
