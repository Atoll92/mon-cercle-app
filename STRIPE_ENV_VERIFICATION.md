# Stripe Environment Variables Verification Guide

## Current Status ✅

### Local Development (.env) - UPDATED
- ✅ **VITE_STRIPE_PUBLIC_KEY**: `pk_live_***` (PRODUCTION - Active)
- ⚠️ Test key commented out for reference

---

## Supabase Edge Functions Environment Variables

### Required Secrets (Supabase Dashboard)

You need to verify these in your **Supabase Dashboard** → **Edge Functions** → **Environment Variables**:

1. **STRIPE_SECRET_KEY** ⚠️ VERIFY THIS
   - **Required value**: Should start with `sk_live_`
   - **Current status**: Set (but need to verify it's production key)
   - **How to verify**:
     - Go to: https://supabase.com/dashboard/project/etoxvocwsktguoddmgcu/settings/functions
     - Check if `STRIPE_SECRET_KEY` starts with `sk_live_` (not `sk_test_`)
     - If it's test mode (`sk_test_`), update it with your production secret key from Stripe Dashboard

2. **STRIPE_WEBHOOK_SECRET** ⚠️ VERIFY THIS
   - **Required value**: Should start with `whsec_`
   - **Current status**: Set (but need to verify it matches production webhook)
   - **How to verify**:
     - Go to: https://dashboard.stripe.com/webhooks
     - Find your production webhook endpoint: `https://etoxvocwsktguoddmgcu.supabase.co/functions/v1/stripe-webhook`
     - Copy the signing secret (whsec_...)
     - Update in Supabase if different

### How to Update Supabase Secrets

**Option 1: Via Supabase Dashboard (Recommended)**
1. Go to: https://supabase.com/dashboard/project/etoxvocwsktguoddmgcu/settings/functions
2. Find the secret you want to update
3. Click "Edit" or "Reveal" to check the current value
4. Update with production value
5. Save changes

**Option 2: Via Supabase CLI**
```bash
# Set production Stripe secret key
npx supabase secrets set STRIPE_SECRET_KEY=sk_live_YOUR_PRODUCTION_KEY

# Set production webhook secret
npx supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_YOUR_PRODUCTION_WEBHOOK_SECRET
```

---

## Vercel/Production Frontend Environment Variables

### Required Environment Variables

Go to: **Vercel Dashboard** → **Your Project** → **Settings** → **Environment Variables**

1. **VITE_STRIPE_PUBLIC_KEY**
   - **Value**: `pk_live_51PomwV2KqNIKpvjTaSUJSUuF41j7eSjsJxc2oPFf3omKBkUJAz0Q2hHSsDdATg2vZie9bOKSiFanC3jClektBUmR00GVvQFFkl`
   - **Environment**: Production (and optionally Preview)
   - **⚠️ ACTION REQUIRED**: Update this in Vercel Dashboard

2. **VITE_SUPABASE_URL**
   - **Value**: `https://etoxvocwsktguoddmgcu.supabase.co`
   - **Status**: Should already be set ✅

3. **VITE_SUPABASE_ANON_KEY**
   - **Value**: Check your Supabase project settings
   - **Status**: Should already be set ✅

### How to Update Vercel Environment Variables

1. Go to: https://vercel.com/dashboard
2. Select your project (mon-cercle-app or conclav)
3. Go to **Settings** → **Environment Variables**
4. Find or add `VITE_STRIPE_PUBLIC_KEY`
5. Set value to: `pk_live_51PomwV2KqNIKpvjTaSUJSUuF41j7eSjsJxc2oPFf3omKBkUJAz0Q2hHSsDdATg2vZie9bOKSiFanC3jClektBUmR00GVvQFFkl`
6. Select environment: **Production** (and optionally Preview)
7. **Redeploy** your application after updating

---

## Stripe Dashboard Configuration

### Webhook Endpoint Configuration

1. Go to: https://dashboard.stripe.com/webhooks
2. Find or create webhook endpoint:
   - **URL**: `https://etoxvocwsktguoddmgcu.supabase.co/functions/v1/stripe-webhook`
   - **Status**: Should be in **Live mode** (not Test mode) ⚠️

3. Ensure these events are selected:
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`

4. Copy the **Signing Secret** (starts with `whsec_`) and update in Supabase Edge Functions

---

## Verification Checklist

### ✅ Completed
- [x] Updated local .env with production public key
- [x] Deployed stripe-webhook function with production price ID mapping
- [x] Updated code to use production Community price ID: `price_1RSxxQ2KqNIKpvjTYs9cYDin`

### ⚠️ Action Required

#### Supabase Dashboard
- [ ] Verify `STRIPE_SECRET_KEY` is production key (`sk_live_`)
  - URL: https://supabase.com/dashboard/project/etoxvocwsktguoddmgcu/settings/functions

- [ ] Verify `STRIPE_WEBHOOK_SECRET` matches production webhook
  - Get from: https://dashboard.stripe.com/webhooks
  - Set in: https://supabase.com/dashboard/project/etoxvocwsktguoddmgcu/settings/functions

#### Vercel Dashboard
- [ ] Set `VITE_STRIPE_PUBLIC_KEY` to production key (`pk_live_`)
  - Value: `pk_live_51PomwV2KqNIKpvjTaSUJSUuF41j7eSjsJxc2oPFf3omKBkUJAz0Q2hHSsDdATg2vZie9bOKSiFanC3jClektBUmR00GVvQFFkl`

- [ ] Redeploy application after updating environment variables

#### Stripe Dashboard
- [ ] Verify webhook is in **Live mode**
  - URL: https://dashboard.stripe.com/webhooks

- [ ] Confirm webhook endpoint: `https://etoxvocwsktguoddmgcu.supabase.co/functions/v1/stripe-webhook`

- [ ] Verify events are configured correctly

---

## Quick Links

- **Supabase Functions**: https://supabase.com/dashboard/project/etoxvocwsktguoddmgcu/settings/functions
- **Stripe Webhooks**: https://dashboard.stripe.com/webhooks
- **Stripe API Keys**: https://dashboard.stripe.com/apikeys
- **Vercel Dashboard**: https://vercel.com/dashboard

---

## Testing After Configuration

Once all environment variables are verified/updated:

1. **Test checkout flow**:
   ```bash
   # Visit your app and try creating a subscription
   # Use test card: 4242 4242 4242 4242
   ```

2. **Check webhook logs**:
   - Supabase: https://supabase.com/dashboard/project/etoxvocwsktguoddmgcu/functions/stripe-webhook/logs
   - Stripe: https://dashboard.stripe.com/webhooks (click on your webhook)

3. **Verify database updates**:
   ```sql
   SELECT id, name, stripe_customer_id, stripe_subscription_id,
          subscription_status, subscription_plan
   FROM networks
   WHERE stripe_subscription_id IS NOT NULL
   ORDER BY updated_at DESC
   LIMIT 5;
   ```

---

## Production Price IDs Reference

- **Community Plan**: `price_1RSxxQ2KqNIKpvjTYs9cYDin` (€17/month) - Product: `prod_SNjQ5a7bOviQhV`
- **Organization Plan**: `price_1RK6Vk2KqNIKpvjTKgFNpV0y` (€97/month)

---

**Last Updated**: November 25, 2025
**Status**: Local environment configured ✅ | Supabase secrets need verification ⚠️ | Vercel deployment pending ⚠️
