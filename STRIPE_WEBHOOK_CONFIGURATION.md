# Stripe Webhook Configuration for Production

## Your Production Webhook Details

- **Webhook URL**: `https://mon-cercle-app.vercel.app/functions/v1/stripe-webhook`
- **Webhook Endpoint ID**: `we_1RK6Lj2KqNIKpvjT7feppFt6`
- **Signing Secret**: `whsec_JqF4iP5Kzwq5LzZIRexeIC5Xl3FwMUfA`

## Important Note ⚠️

Your webhook URL appears to be pointing to Vercel (`mon-cercle-app.vercel.app`), but your Stripe webhook handler is implemented as a Supabase Edge Function. This is a configuration mismatch.

## Correct Configuration

### Option 1: Use Supabase Edge Functions (Recommended)

Your webhook is implemented in `/supabase/functions/stripe-webhook/index.ts`, so the correct webhook URL should be:

```
https://[YOUR-SUPABASE-PROJECT-ID].supabase.co/functions/v1/stripe-webhook
```

**Steps:**
1. Get your Supabase project ID from your Supabase dashboard
2. Update the webhook URL in Stripe Dashboard to the Supabase URL
3. Set the following environment variables in Supabase Dashboard under Edge Functions:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_JqF4iP5Kzwq5LzZIRexeIC5Xl3FwMUfA
   STRIPE_SECRET_KEY=[your-stripe-secret-key]
   ```

### Option 2: Create Vercel Function (If you prefer Vercel)

If you want to use Vercel for webhooks, you need to create a new function at `/api/stripe-webhook.js` or `/api/stripe-webhook.ts` in your project.

## Current Issue

The webhook endpoint `https://mon-cercle-app.vercel.app/functions/v1/stripe-webhook` will return 404 because:
1. Vercel functions should be in `/api` directory, not `/functions`
2. Your webhook handler is in Supabase Edge Functions, not Vercel

## Recommended Action

1. **Update Stripe Dashboard**:
   - Change webhook URL to: `https://[YOUR-SUPABASE-PROJECT-ID].supabase.co/functions/v1/stripe-webhook`
   - Keep the same events selected:
     - `checkout.session.completed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`

2. **Configure Supabase Edge Functions Environment**:
   ```bash
   # In Supabase Dashboard > Edge Functions > stripe-webhook > Environment Variables
   STRIPE_WEBHOOK_SECRET=whsec_JqF4iP5Kzwq5LzZIRexeIC5Xl3FwMUfA
   STRIPE_SECRET_KEY=[your-stripe-secret-key]
   SUPABASE_URL=[already-set]
   SUPABASE_SERVICE_ROLE_KEY=[already-set]
   ```

3. **Deploy Edge Function**:
   ```bash
   supabase functions deploy stripe-webhook
   ```

## Testing the Webhook

Once configured, test with Stripe CLI:
```bash
stripe listen --forward-to https://[YOUR-SUPABASE-PROJECT-ID].supabase.co/functions/v1/stripe-webhook
stripe trigger checkout.session.completed
```

## Security Note 🔒

- Never commit webhook secrets to your repository
- The signing secret you provided should only be used in the Supabase Edge Functions environment
- Consider rotating this secret since it's been shared in plain text

## Verification Checklist

- [ ] Webhook URL points to correct location (Supabase, not Vercel)
- [ ] STRIPE_WEBHOOK_SECRET environment variable set in Supabase
- [ ] STRIPE_SECRET_KEY environment variable set in Supabase
- [ ] Edge function deployed to Supabase
- [ ] Webhook endpoint active in Stripe Dashboard
- [ ] Test webhook with Stripe CLI
- [ ] Monitor webhook logs in Stripe Dashboard