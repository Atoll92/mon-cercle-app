# OpenGraph Testing Guide for Invitation Links

## Overview

Invitation links now have **two URLs** that work differently:

1. **For Users** (regular access): `https://www.conclav.club/join/{CODE}`
   - Regular users get the full React app experience
   - Seamless navigation and interaction

2. **For Bots** (social media previews): Same URL, different response
   - Social media crawlers get HTML with network-specific OG tags
   - Shows network name, description, and logo in link previews

## How It Works

### Architecture

```
User shares: https://www.conclav.club/join/5B1E7D90
                              ↓
                    Vercel receives request
                              ↓
                     Check User-Agent header
                              ↓
              ┌───────────────┴────────────────┐
              ↓                                ↓
         Is Bot/Crawler?                  Regular User?
              ↓                                ↓
    /api/join/[code].js              Redirect to React SPA
    Serverless Function                        ↓
              ↓                        App loads at /join/:code
    Fetch network from Supabase               ↓
              ↓                        Network-specific content
    Generate HTML with OG tags
              ↓
    Return HTML to crawler
```

### Bot Detection

The serverless function detects bots using User-Agent patterns:
- `facebookexternalhit` (Facebook/WhatsApp)
- `Twitterbot` (Twitter/X)
- `LinkedInBot` (LinkedIn)
- `WhatsApp` (WhatsApp web scraper)
- `Discordbot` (Discord)
- `Slackbot` (Slack)
- `Telegram` (Telegram)
- Generic patterns: `bot`, `crawler`, `spider`

### OG Tags Injected

```html
<meta property="og:type" content="website">
<meta property="og:url" content="https://www.conclav.club/join/CODE">
<meta property="og:title" content="Join {Network Name} on Conclav">
<meta property="og:description" content="{Network Description}">
<meta property="og:image" content="{Network Logo URL}">
<meta property="og:image:secure_url" content="{Network Logo URL}">
<meta property="og:image:type" content="image/png">
<meta property="og:image:width" content="300">
<meta property="og:image:height" content="300">
<meta property="og:image:alt" content="{Network Name}">
<meta property="og:site_name" content="Conclav">
<meta property="og:locale" content="en_US">
```

## Testing Commands

### 1. Test Bot Response (Command Line)

```bash
# Test with Facebook crawler user-agent
curl -A "facebookexternalhit/1.0" https://www.conclav.club/join/5B1E7D90

# Should return HTML with network-specific OG tags
# Look for: <meta property="og:title" content="Join {Network Name} on Conclav">
```

```bash
# Test with WhatsApp user-agent
curl -A "WhatsApp/2.0" https://www.conclav.club/join/5B1E7D90

# Should return same HTML with OG tags
```

```bash
# Test with regular browser user-agent
curl -A "Mozilla/5.0" https://www.conclav.club/join/5B1E7D90

# Should return redirect or SPA HTML
```

### 2. Extract OG Tags

```bash
# Extract just the OG tags
curl -s -A "facebookexternalhit/1.0" https://www.conclav.club/join/5B1E7D90 | grep -E "og:|twitter:"

# Should show:
# <meta property="og:type" content="website">
# <meta property="og:url" content="...">
# <meta property="og:title" content="Join {Network} on Conclav">
# etc.
```

### 3. Check Image Size (Important for WhatsApp)

```bash
# WhatsApp requires images < 300KB
curl -I "https://etoxvocwsktguoddmgcu.supabase.co/storage/v1/object/public/networks/{network_id}/{logo_file}"

# Look for: content-length: {should be < 300000}
```

## Online Testing Tools

### Facebook Debugger
1. Go to: https://developers.facebook.com/tools/debug/
2. Enter: `https://www.conclav.club/join/5B1E7D90`
3. Click "Debug"
4. Should show:
   - ✅ Title: "Join {Network Name} on Conclav"
   - ✅ Description: {Network Description}
   - ✅ Image: {Network Logo}

**Note**: Facebook caches aggressively. Click "Scrape Again" to see updates.

### Twitter Card Validator
1. Go to: https://cards-dev.twitter.com/validator
2. Enter: `https://www.conclav.club/join/5B1E7D90`
3. Click "Preview card"
4. Should show network-specific preview

### LinkedIn Post Inspector
1. Go to: https://www.linkedin.com/post-inspector/
2. Enter: `https://www.conclav.club/join/5B1E7D90`
3. Click "Inspect"
4. Should show network details

### OpenGraph.xyz (Universal)
1. Go to: https://www.opengraph.xyz/
2. Enter: `https://www.conclav.club/join/5B1E7D90`
3. Should show preview for multiple platforms

### WhatsApp Testing
**Method 1: Send to yourself**
1. Send the link to yourself or a friend
2. WhatsApp should show:
   - Network logo (must be < 300KB)
   - Network name
   - Network description preview

**Method 2: Use API (requires WhatsApp Business)**
```bash
# Not publicly available, but WhatsApp uses similar crawling as Facebook
```

## Real-World Testing Checklist

- [ ] **Facebook**: Link preview shows network name and logo
- [ ] **WhatsApp**: Preview appears (check image size < 300KB)
- [ ] **Twitter/X**: Card preview shows network details
- [ ] **LinkedIn**: Preview shows when posting
- [ ] **Discord**: Embed shows network information
- [ ] **Telegram**: Link preview displays correctly
- [ ] **Slack**: Unfurling shows network details

## Debugging

### Issue: No preview showing

**Possible causes:**
1. **Image too large**: WhatsApp requires < 300KB
   - Check: `curl -I {logo_url} | grep content-length`
   - Fix: Use network logo instead of background image

2. **Cached old version**: Social platforms cache OG tags
   - Facebook: Use "Scrape Again" button
   - WhatsApp: Wait 7 days or clear cache (not user-controllable)
   - Twitter: Use validator to refresh

3. **Bot not detected**: Check serverless function logs
   - Vercel Dashboard → Functions → /api/join/[code]
   - Look for log: `[OG-JOIN] Code: ..., isCrawler: true`

4. **Wrong URL format**: Ensure exact format
   - ✅ Correct: `https://www.conclav.club/join/5B1E7D90`
   - ❌ Wrong: `https://conclav.club/join/5B1E7D90` (missing www)
   - ❌ Wrong: `http://...` (not HTTPS)

### Issue: Regular users see HTML instead of React app

**Cause**: User-agent incorrectly detected as bot

**Fix**: Check user-agent pattern in [api/join/[code].js](api/join/[code].js)
```javascript
const isCrawler = /bot|crawler|spider|crawling|facebookexternalhit|Twitterbot|LinkedInBot|WhatsApp|Slackbot|Discordbot|Telegram|facebot|ia_archiver/i.test(userAgent);
```

### Issue: Database error or invitation not found

**Check:**
1. Invitation code is valid and active
2. Supabase environment variables are set correctly:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Network has required fields:
   - `name` (required)
   - `description` (optional, fallback provided)
   - `logo_url` (optional, fallback to /logo.png)

## Monitoring

### Vercel Function Logs

Check function execution logs:
1. Go to Vercel Dashboard
2. Select project: mon-cercle-app
3. Functions → `/api/join/[code]`
4. View real-time logs

**Expected logs:**
```
[OG-JOIN] Code: 5B1E7D90, UserAgent: facebookexternalhit/1.0, isCrawler: true
[OG-JOIN] Success for: {Network Name}, Image: {logo_url}
```

**Error logs:**
```
[OG-JOIN] Invitation not found: {CODE}
[OG-JOIN] Error: {error_details}
```

## Performance Considerations

### Caching Strategy

**Current setup:**
- No caching on serverless function (always fresh data)
- Social platforms cache previews for 7-30 days

**Future optimization (if needed):**
```javascript
// Add to serverless function response
headers: {
  'Cache-Control': 'public, max-age=300, s-maxage=600', // 5 min browser, 10 min CDN
}
```

### Cold Starts

- Vercel Serverless Functions may have 1-3s cold start
- Social crawlers usually retry if initial request is slow
- Consider Vercel Pro for faster edge functions

## Fallback Behavior

### If invitation code is invalid
- Returns 404 with generic Conclav OG tags
- Shows error message: "Invitation not found or inactive"
- Link to homepage: `https://www.conclav.club`

### If Supabase is down
- Returns 500 with generic error
- Graceful degradation

### If user accesses with regular browser
- Redirects to: `/?redirect=/join/{CODE}`
- React app handles the join flow

## Related Files

- **Serverless Function**: [api/join/[code].js](api/join/[code].js)
- **Vercel Config**: [vercel.json](vercel.json)
- **Fallback OG Tags**: [index.html](index.html)
- **Alternative Function**: [supabase/functions/invitation-preview/index.ts](supabase/functions/invitation-preview/index.ts)

## Alternative: Supabase Edge Function

You can also use the Supabase Edge Function directly:
```
https://etoxvocwsktguoddmgcu.supabase.co/functions/v1/invitation-preview/5B1E7D90
```

This URL:
- ✅ Always returns HTML with OG tags (doesn't detect bots)
- ✅ Works for all platforms
- ✅ Has "Join Network" button that redirects to app
- ❌ Not as clean as the main URL

## Summary

✅ **What works now:**
- `www.conclav.club/join/{CODE}` shows network-specific previews on all social platforms
- Regular users get the React app experience
- Bots get HTML with proper OG tags
- Network logo, name, and description appear in link previews

✅ **What to test after each deployment:**
- Facebook Debugger
- WhatsApp (send to yourself)
- At least one other platform (Twitter, LinkedIn, or Discord)

✅ **What to monitor:**
- Vercel function logs for errors
- Image sizes (must be < 300KB for WhatsApp)
- Social platform cache issues (use "Scrape Again")
