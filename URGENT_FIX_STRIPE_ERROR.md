# 🚨 URGENT: Fix Stripe Payment Error

## Error
**"Payment error: Edge Function returned a non-2xx status code"**

## Root Cause
Your Supabase Edge Functions are likely using a **TEST** Stripe secret key (`sk_test_`), but your code is sending a **PRODUCTION** price ID (`price_1RSxxQ2KqNIKpvjTYs9cYDin`).

Stripe test keys cannot access production prices, which causes the checkout session creation to fail.

## Immediate Fix Required

### Step 1: Update STRIPE_SECRET_KEY in Supabase

1. **Go to Stripe Dashboard** and get your PRODUCTION secret key:
   - URL: https://dashboard.stripe.com/apikeys
   - **IMPORTANT**: Make sure Stripe is in **Live Mode** (toggle in top-right)
   - Copy the "Secret key" that starts with `sk_live_`

2. **Update Supabase Edge Function Secret**:
   - Go to: https://supabase.com/dashboard/project/etoxvocwsktguoddmgcu/settings/functions
   - Find `STRIPE_SECRET_KEY`
   - Click to edit/reveal the current value
   - **Replace with your production key** (starts with `sk_live_`)
   - Save changes

### Step 2: Verify STRIPE_WEBHOOK_SECRET

While you're in the Supabase secrets:

1. **Get your production webhook secret** from Stripe:
   - Go to: https://dashboard.stripe.com/webhooks
   - Make sure you're in **Live Mode**
   - Find webhook: `https://etoxvocwsktguoddmgcu.supabase.co/functions/v1/stripe-webhook`
   - Click on it and reveal the "Signing secret" (starts with `whsec_`)

2. **Update in Supabase**:
   - In the same secrets page: https://supabase.com/dashboard/project/etoxvocwsktguoddmgcu/settings/functions
   - Find `STRIPE_WEBHOOK_SECRET`
   - **Replace with production webhook secret** (starts with `whsec_`)
   - Save changes

### Step 3: Test the Payment Flow

After updating both secrets:

1. **Wait 1-2 minutes** for the secrets to propagate
2. **Try the payment again** on your site
3. The payment should now work!

---

## Alternative: Using CLI

If you prefer to update via command line:

```bash
# Update with your production Stripe secret key
npx supabase secrets set STRIPE_SECRET_KEY=sk_live_YOUR_ACTUAL_PRODUCTION_KEY

# Update with your production webhook secret
npx supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_YOUR_ACTUAL_WEBHOOK_SECRET
```

---

## How to Know if It Worked

### Success Indicators:
- ✅ Payment redirects to Stripe checkout page
- ✅ Can enter card details
- ✅ After payment, redirected back to your site
- ✅ Network subscription status updated in database

### Still Not Working?
Check browser console (F12) for detailed error messages and look for:
- "Invalid API Key" → Secret key is wrong or still test mode
- "No such price" → Price ID mismatch (unlikely now)
- "This API key cannot be used in live mode" → Still using test key

---

## Quick Verification Checklist

- [ ] Stripe Dashboard is in **Live Mode** (toggle in top-right corner)
- [ ] Copied production secret key from https://dashboard.stripe.com/apikeys (starts with `sk_live_`)
- [ ] Updated `STRIPE_SECRET_KEY` in Supabase Edge Functions
- [ ] Copied production webhook secret from https://dashboard.stripe.com/webhooks (starts with `whsec_`)
- [ ] Updated `STRIPE_WEBHOOK_SECRET` in Supabase Edge Functions
- [ ] Waited 1-2 minutes after updating secrets
- [ ] Tested payment flow again

---

**Status**: Functions deployed ✅ | Secrets need updating ⚠️
**Priority**: URGENT - Payment flow is broken until secrets are updated
