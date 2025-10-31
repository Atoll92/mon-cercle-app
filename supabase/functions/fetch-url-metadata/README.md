# Fetch URL Metadata Edge Function

This Supabase Edge Function fetches metadata (title, description, image) from URLs to enable link preview functionality in posts.

## Purpose

When users paste a link in the Create Post modal, this function:
1. Detects special platforms (YouTube, etc.) and uses their APIs for accurate metadata
2. For YouTube: Uses oEmbed API to get exact video title, author, and thumbnail
3. For other sites: Fetches webpage HTML and extracts Open Graph, Twitter Card, and standard meta tags
4. Returns structured metadata to auto-fill the post title

## Supported Platforms

### Video Platforms (using dedicated APIs)
- **YouTube**: Supports all formats (youtube.com/watch, youtu.be, youtube.com/shorts, youtube.com/embed)
  - Uses YouTube oEmbed API for reliable metadata
  - Returns: Video title, channel name, thumbnail

### General Websites
- All other URLs are fetched and parsed for Open Graph and meta tags
- Fallback to HTML `<title>` tag if no meta tags found

## Current Status

✅ **Deployed and Active** - The Edge Function is now deployed and being used as the primary method for fetching URL metadata. The application automatically falls back to AllOrigins CORS proxy if the Edge Function is unavailable (see `src/utils/urlMetadata.js`).

## Deployment

To deploy this function and improve performance:

```bash
# Make sure Docker Desktop is running
supabase functions deploy fetch-url-metadata --project-ref etoxvocwsktguoddmgcu
```

## Benefits of Deploying

- **Better Performance**: Direct server-side fetching is faster than proxy
- **More Reliable**: No dependency on third-party CORS proxy
- **Better Privacy**: URLs aren't sent through external services
- **Custom User-Agent**: Identifies as Conclav properly

## Testing

Once deployed, test with:

```bash
curl -X POST https://etoxvocwsktguoddmgcu.supabase.co/functions/v1/fetch-url-metadata \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{"url": "https://github.com"}'
```

## Fallback Behavior

The client code (`src/utils/urlMetadata.js`) will automatically use this Edge Function if available, otherwise it falls back to the CORS proxy. No code changes needed after deployment.
