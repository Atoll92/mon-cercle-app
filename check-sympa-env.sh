#!/bin/bash

echo "🔍 Checking Sympa Integration Environment Variables"
echo "=================================================="
echo ""

# Check Supabase secrets
echo "📋 Checking Supabase Edge Function Secrets..."
echo ""

supabase secrets list 2>/dev/null || {
  echo "⚠️  Could not list secrets. Make sure you're logged in to Supabase CLI:"
  echo "   supabase login"
  echo ""
}

echo ""
echo "✅ Required secrets for Sympa integration:"
echo "   - RESEND_API_KEY (for sending emails)"
echo "   - ADMIN_EMAIL (sender email for Sympa commands)"
echo "   - SYMPA_COMMAND_EMAIL (default: sympa@lists.riseup.net)"
echo ""

# Check if Edge Functions are deployed
echo "📦 Checking deployed Edge Functions..."
echo ""

supabase functions list 2>/dev/null || {
  echo "⚠️  Could not list functions. Make sure you're in a Supabase project:"
  echo "   cd /path/to/your/project"
  echo ""
}

echo ""
echo "✅ Required Edge Functions:"
echo "   - sympa-moderate-message"
echo "   - sympa-manage-subscription"
echo ""

# Check local env file
echo "📄 Checking local .env file..."
if [ -f .env ]; then
  echo "✅ .env file exists"
  if grep -q "VITE_SUPABASE_URL" .env; then
    echo "✅ VITE_SUPABASE_URL is set"
  else
    echo "❌ VITE_SUPABASE_URL is not set in .env"
  fi

  if grep -q "VITE_SUPABASE_ANON_KEY" .env; then
    echo "✅ VITE_SUPABASE_ANON_KEY is set"
  else
    echo "❌ VITE_SUPABASE_ANON_KEY is not set in .env"
  fi
else
  echo "❌ .env file not found"
  echo "   Copy .env.example to .env and fill in your values"
fi

echo ""
echo "=================================================="
echo ""
echo "To set Edge Function secrets:"
echo "  supabase secrets set RESEND_API_KEY='your_api_key'"
echo "  supabase secrets set ADMIN_EMAIL='your_email@domain.com'"
echo ""
echo "To deploy Edge Functions:"
echo "  supabase functions deploy sympa-moderate-message"
echo "  supabase functions deploy sympa-manage-subscription"
echo ""
