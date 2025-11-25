# Payment Verification Guide

## Issue Fixed ✅
Updated [PaymentSuccessPage.jsx](src/pages/PaymentSuccessPage.jsx) to handle multiple profiles correctly.

**Error**: "JSON object requested, multiple (or no) rows returned"
**Cause**: Using `.single()` when user can have multiple profiles
**Fix**: Changed to fetch all profiles and use the most recent one

---

## Verify Payment in Database

### Option 1: Run Check Script
```bash
node check_payment_status.js
```

### Option 2: Check Manually in Supabase

Go to: https://supabase.com/dashboard/project/etoxvocwsktguoddmgcu/editor

Run this SQL query:
```sql
SELECT
  id,
  name,
  subscription_status,
  subscription_plan,
  stripe_customer_id,
  stripe_subscription_id,
  updated_at
FROM networks
WHERE stripe_customer_id IS NOT NULL
ORDER BY updated_at DESC
LIMIT 5;
```

### What to Look For:
- ✅ **subscription_status** should be `'active'`
- ✅ **subscription_plan** should be `'community'`
- ✅ **stripe_customer_id** should start with `cus_`
- ✅ **stripe_subscription_id** should start with `sub_`

---

## Check Webhook Processing

### Stripe Dashboard
1. Go to: https://dashboard.stripe.com/webhooks
2. Click on your webhook endpoint
3. Look for recent events:
   - ✅ `checkout.session.completed` - Should return 200 OK
   - ✅ `invoice.payment_succeeded` - Should return 200 OK
   - ✅ `customer.subscription.created` - Should return 200 OK

### Supabase Function Logs
1. Go to: https://supabase.com/dashboard/project/etoxvocwsktguoddmgcu/functions/stripe-webhook/logs
2. Check recent logs for:
   - "Event received: checkout.session.completed"
   - "Network updated successfully"
   - Any errors

---

## Webhook Events Order

When a successful payment happens, Stripe sends these events:

1. **checkout.session.completed** ← This is critical
   - Should update: `stripe_customer_id`, `stripe_subscription_id`, `subscription_status`, `subscription_plan`

2. **customer.subscription.created**
   - Additional subscription details

3. **invoice.payment_succeeded** ✅ You saw this
   - Confirms payment went through

4. **invoice.paid** ✅ You saw this
   - Invoice is fully paid

---

## Troubleshooting

### If Database Wasn't Updated

**Possible Causes:**

1. **Webhook not receiving `checkout.session.completed`**
   - Check Stripe webhook events
   - Ensure webhook is listening for this event type

2. **Webhook Secret Mismatch**
   - Webhook signature validation failed
   - Check Supabase logs for "Missing stripe signature" or signature errors

3. **Network ID Missing in Metadata**
   - Check if `networkId` was passed when creating checkout session
   - Look in Supabase logs for "No network ID in metadata"

### Manual Fix (If Needed)

If the webhook didn't process but payment went through in Stripe:

1. Get the Stripe Customer ID from Stripe Dashboard
2. Get the Subscription ID from Stripe Dashboard
3. Update the network manually in Supabase:

```sql
UPDATE networks
SET
  stripe_customer_id = 'cus_XXXXX',  -- From Stripe
  stripe_subscription_id = 'sub_XXXXX',  -- From Stripe
  subscription_status = 'active',
  subscription_plan = 'community',
  updated_at = NOW()
WHERE id = 'YOUR_NETWORK_ID';
```

---

## Next Steps

1. **Test the fixed payment success page**:
   - Clear browser cache
   - Try accessing the payment success URL again
   - Should no longer show "multiple rows" error

2. **Verify webhook is working**:
   - Check Stripe webhook logs
   - Check Supabase function logs
   - Ensure `checkout.session.completed` event returns 200 OK

3. **Test a new payment** (optional):
   - Use Stripe test card: `4242 4242 4242 4242`
   - Complete checkout
   - Verify database updates correctly
   - Verify success page loads without errors

---

## Success Indicators

✅ Payment success page loads without error
✅ Database shows `subscription_status = 'active'`
✅ Stripe webhook shows 200 OK responses
✅ Supabase logs show "Network updated successfully"
✅ User can access premium features

---

## Quick Links

- **Stripe Webhooks**: https://dashboard.stripe.com/webhooks
- **Supabase Functions**: https://supabase.com/dashboard/project/etoxvocwsktguoddmgcu/functions/stripe-webhook
- **Supabase Database**: https://supabase.com/dashboard/project/etoxvocwsktguoddmgcu/editor
- **Stripe Customers**: https://dashboard.stripe.com/customers

---

**Status**: PaymentSuccessPage fixed ✅ | Need to verify database update
