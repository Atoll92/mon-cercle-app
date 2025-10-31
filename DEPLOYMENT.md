# Deployment Guide for Conclav

## Vercel Environment Variables

When deploying to Vercel (or any production environment), you need to configure environment variables separately from your local `.env` file.

### Required Environment Variables for Production

Add these environment variables in your Vercel project settings:

1. **Navigate to Vercel Dashboard**
   - Go to your project: https://vercel.com/dashboard
   - Select your project (e.g., `conclav-network`)
   - Go to **Settings** → **Environment Variables**

2. **Add the following variables:**

   | Variable Name | Description | Example Value |
   |--------------|-------------|---------------|
   | `VITE_SUPABASE_URL` | Your Supabase project URL | `https://xxxxx.supabase.co` |
   | `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | `eyJhbGci...` |
   | `VITE_STRIPE_PUBLIC_KEY` | Stripe publishable key | `pk_live_...` or `pk_test_...` |
   | `VITE_GIPHY_API_KEY` | Giphy API key for GIF picker | `cz3kUuWYuJYVQyGLtlW5HkZWJ05jiOTT` |
   | `VITE_SITE_URL` | Your production URL | `https://conclav.network` |

3. **Environment Scope**
   - For each variable, select which environments it applies to:
     - ✅ Production
     - ✅ Preview (optional, for preview deployments)
     - ❌ Development (use local `.env` file)

### Adding Environment Variables via Vercel CLI

Alternatively, you can add environment variables using the Vercel CLI:

```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Login to Vercel
vercel login

# Link your project
vercel link

# Add environment variables
vercel env add VITE_GIPHY_API_KEY production
# Paste your API key when prompted: cz3kUuWYuJYVQyGLtlW5HkZWJ05jiOTT

# List all environment variables
vercel env ls
```

### After Adding Variables

1. **Redeploy your application**
   - Environment variables only take effect after a new deployment
   - Either push a new commit to trigger auto-deployment
   - Or manually trigger a redeploy in Vercel dashboard

2. **Verify the deployment**
   - Navigate to your production URL
   - Open the chat in a network
   - Click the GIF button to verify it's working
   - Check browser console for any errors

### Troubleshooting

**GIF picker shows "your_giphy_api_key_here" error:**
- Environment variable not set in Vercel
- Solution: Add `VITE_GIPHY_API_KEY` in Vercel dashboard

**Changes not reflected after adding variables:**
- Need to redeploy after adding environment variables
- Solution: Push a new commit or trigger manual redeploy

**GIFs not loading:**
- Check browser console for API errors
- Verify API key is correct in Vercel dashboard
- Ensure API key has not exceeded rate limits

### Security Notes

- ✅ All variables prefixed with `VITE_` are **safe to expose** in the client bundle
- ✅ Giphy API key can be public (it's rate-limited per IP)
- ❌ Never expose `SUPABASE_SERVICE_KEY` or `STRIPE_SECRET_KEY` (use Edge Functions for these)

### Rate Limits

**Giphy Free Tier:**
- 42 API calls per hour per IP address
- Monitor usage at: https://developers.giphy.com/dashboard/
- Upgrade to paid plan if needed for higher limits

## Quick Deployment Checklist

- [ ] Add `VITE_GIPHY_API_KEY` to Vercel environment variables
- [ ] Add other required environment variables if not already present
- [ ] Trigger a new deployment (git push or manual redeploy)
- [ ] Test GIF picker in production
- [ ] Test emoji skin tone selector in production
- [ ] Monitor Giphy API usage

## Support

For deployment issues:
- Vercel: https://vercel.com/docs
- Giphy API: https://developers.giphy.com/docs/
