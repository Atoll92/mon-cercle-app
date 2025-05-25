# Environment Setup Instructions

## Required Environment Variables

Create a `.env` file in the root of your project with the following variables:

```bash
# Supabase Configuration (Required)
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Stripe Configuration (Required)
VITE_STRIPE_PUBLIC_KEY=your_stripe_public_key

# Optional - Application URL (defaults to current origin)
# VITE_SITE_URL=http://localhost:5173
```

## Where to find these values:

### Supabase:
1. Go to your Supabase project dashboard
2. Navigate to Settings > API
3. Copy the "Project URL" for `VITE_SUPABASE_URL`
4. Copy the "anon public" key for `VITE_SUPABASE_ANON_KEY`

### Stripe:
1. Go to your Stripe dashboard
2. Navigate to Developers > API keys
3. Copy the "Publishable key" for `VITE_STRIPE_PUBLIC_KEY`

## Important Notes:
- Never commit your `.env` file to version control
- The `.env` file is already in `.gitignore`
- All environment variables for Vite must start with `VITE_`
- After creating/updating the `.env` file, restart your development server

## Edge Functions (Server-side):
For Supabase Edge Functions, set these in your Supabase dashboard:
- `STRIPE_SECRET_KEY` - Your Stripe secret key