# Stripe Production Mode Test Protocol

## Overview
This document outlines the comprehensive testing protocol for transitioning Mon Cercle's Stripe integration from test mode to production mode.

## Quick Reference

### Critical Files to Review
- `src/services/stripeService.js` - Frontend checkout initiation
- `src/config/environment.js` - Environment-specific price IDs
- `supabase/functions/create-checkout-session/index.ts` - Checkout session creation
- `supabase/functions/stripe-webhook/index.ts` - Webhook event processing
- `supabase/functions/manage-subscription/index.ts` - Subscription management

### Production Webhook URL
```
https://[YOUR-SUPABASE-PROJECT-ID].supabase.co/functions/v1/stripe-webhook
```

### Required Environment Variables
| Location | Variable | Description |
|----------|----------|-------------|
| Supabase Edge Functions | `STRIPE_SECRET_KEY` | Production secret key (sk_live_...) |
| Supabase Edge Functions | `STRIPE_WEBHOOK_SECRET` | Webhook signing secret (whsec_...) |
| Frontend (Vercel) | `VITE_STRIPE_PUBLIC_KEY` | Production publishable key (pk_live_...) |

### Database Fields Updated by Stripe
- `networks.stripe_customer_id` - Stripe customer identifier
- `networks.stripe_subscription_id` - Active subscription ID
- `networks.subscription_status` - Current status (active, canceled, etc.)
- `networks.subscription_plan` - Plan name (community, organization, etc.)
- `networks.subscription_end_date` - Current period end date

## Current Implementation Details

### Stripe Integration Points
1. **Frontend Service**: `src/services/stripeService.js`
2. **Configuration**: `src/stripe/config.js` and `src/config/environment.js`
3. **Edge Functions**:
   - `supabase/functions/create-checkout-session/`
   - `supabase/functions/stripe-webhook/`
   - `supabase/functions/manage-subscription/`
4. **Database Tables**: `networks` table with Stripe fields

### Current Price IDs Configuration
```javascript
// Development Price IDs
community: 'price_1RSy002KqNIKpvjTG7YyuZZ6' // €17/month
organization: 'price_1RK6qr2KqNIKpvjTZh47uSJO' // €97/month

// Production Price IDs (to be verified)
community: 'price_1RSxxQ2KqNIKpvjTYs9cYDin' // €17/month
organization: 'price_1RK6Vk2KqNIKpvjTKgFNpV0y' // €97/month
```

## Pre-Production Checklist

### 1. Stripe Account Setup
- [ ] Verify Stripe account is fully activated with all KYC requirements completed
- [ ] Complete business verification process
- [ ] Set up bank account for EUR payouts
- [ ] Configure tax settings for European VAT if required
- [ ] Review and accept Stripe's Terms of Service
- [ ] Enable Stripe Billing and Customer Portal in Dashboard
- [ ] Configure Customer Portal settings (what customers can do)

### 2. Environment Configuration

#### Supabase Edge Functions Environment Variables
- [ ] Set in Supabase Dashboard > Edge Functions:
  - [ ] `STRIPE_SECRET_KEY` (production key starting with `sk_live_`)
  - [ ] `STRIPE_WEBHOOK_SECRET` (from webhook endpoint in Stripe)
  - [ ] `SUPABASE_URL` (already set)
  - [ ] `SUPABASE_SERVICE_ROLE_KEY` (already set)

#### Frontend Environment Variables
- [ ] Set in Vercel/Production environment:
  - [ ] `VITE_STRIPE_PUBLIC_KEY` (production key starting with `pk_live_`)
  - [ ] `VITE_SUPABASE_URL`
  - [ ] `VITE_SUPABASE_ANON_KEY`

### 3. Webhook Configuration
- [ ] Register production webhook endpoint in Stripe Dashboard:
  - **URL**: `https://[YOUR-SUPABASE-PROJECT-ID].supabase.co/functions/v1/stripe-webhook`
- [ ] Configure webhook to listen for required events:
  - [ ] `checkout.session.completed`
  - [ ] `customer.subscription.updated`
  - [ ] `customer.subscription.deleted`
- [ ] Copy webhook signing secret to Supabase Edge Functions environment
- [ ] Test webhook endpoint is accessible (returns 200 for OPTIONS)

### 4. Product and Price Setup
- [ ] Create/verify all products in Stripe production dashboard:
  - [ ] Community Plan - €17/month
  - [ ] Organization Plan - €97/month
  - [ ] Nonprofit Plan - €49/month (if applicable)
  - [ ] Network Plan - €247/month (if applicable)
  - [ ] Business Plan - €497/month (if applicable)
- [ ] Update `src/config/environment.js` with correct production price IDs
- [ ] Set up proper product descriptions and metadata
- [ ] Configure trial periods if applicable

## Functional Testing Protocol

### 1. Subscription Flow Testing

#### A. New Network Subscription
1. **Test Scenario**: Admin subscribes network to paid plan
   - [ ] Create new network via onboarding wizard
   - [ ] Navigate to pricing page (`/pricing`)
   - [ ] Click "Choose Plan" for desired tier
   - [ ] Verify `createCheckoutSession` is called with correct price ID
   - [ ] Complete Stripe checkout with test card
   - [ ] Verify redirect to `/payment-success?session_id={CHECKOUT_SESSION_ID}`
   - [ ] Confirm network's subscription fields updated in database:
     - `stripe_customer_id`
     - `stripe_subscription_id`
     - `subscription_status` = 'active'
     - `subscription_plan` = correct plan name
   - [ ] Check network header shows subscription badge
   - [ ] Verify premium features are enabled

2. **Production Cards to Test**:
   - Success: `4242 4242 4242 4242` (any future expiry, any CVC)
   - 3D Secure Required: `4000 0025 0000 3155`
   - Insufficient Funds: `4000 0000 0000 9995`
   - Card Declined: `4000 0000 0000 0002`

#### B. Network Billing Management
1. **Test Scenario**: Access Stripe Customer Portal
   - [ ] Login as network admin
   - [ ] Navigate to network admin page
   - [ ] Go to Billing tab
   - [ ] Click "Manage Subscription" button
   - [ ] Verify redirect to Stripe Customer Portal
   - [ ] Test updating payment method
   - [ ] Test downloading invoices
   - [ ] Test changing subscription plan

#### C. Webhook Processing Flow
1. **Test Scenario**: Verify webhook handles events correctly
   - [ ] Complete a checkout session
   - [ ] Monitor Supabase Edge Function logs for webhook receipt
   - [ ] Verify `checkout.session.completed` event processed
   - [ ] Check database updates:
     - Network's subscription fields populated
     - Correct plan determined from price ID
   - [ ] Test subscription update event
   - [ ] Test subscription cancellation event

### 2. Edge Function Testing

#### A. Create Checkout Session Function
1. **Test with Production Keys**:
   - [ ] Deploy function with production Stripe key
   - [ ] Test creating session with valid price ID
   - [ ] Verify session URL returned
   - [ ] Test error handling for invalid price ID
   - [ ] Verify metadata (userId, networkId) attached correctly

2. **CORS Configuration**:
   - [ ] Verify production domains in `supabase/functions/_shared/cors.ts`
   - [ ] Test from production frontend domain
   - [ ] Ensure no CORS errors

#### B. Stripe Webhook Function
1. **Webhook Signature Validation**:
   - [ ] Test with correct signing secret
   - [ ] Verify rejection of invalid signatures
   - [ ] Check timestamp validation (prevent replay attacks)

2. **Event Processing**:
   - [ ] Test `checkout.session.completed`:
     - Verify network ID extracted from metadata
     - Check price-to-plan mapping works
     - Confirm database update succeeds
   - [ ] Test `customer.subscription.updated`:
     - Verify status changes reflected
     - Check subscription end date updated
   - [ ] Test `customer.subscription.deleted`:
     - Verify subscription marked as canceled
     - Check plan downgraded to 'community'

#### C. Manage Subscription Function
1. **Portal Session Creation**:
   - [ ] Test creating billing portal session
   - [ ] Verify correct customer ID used
   - [ ] Check return URL configuration

2. **Invoice Retrieval**:
   - [ ] Test fetching customer invoices
   - [ ] Verify invoice formatting
   - [ ] Check PDF links work

### 3. Testing Utilities

#### A. Test Stripe Configuration
1. **Using test-stripe Edge Function**:
   ```bash
   # Test if Stripe key is configured
   curl https://[SUPABASE-PROJECT-ID].supabase.co/functions/v1/test-stripe \
     -H "Authorization: Bearer [ANON-KEY]"
   
   # Expected response:
   # {"hasStripeKey": true, "keyPrefix": "sk_live"}
   ```

2. **Stripe CLI Testing**:
   ```bash
   # Forward webhooks to local/staging
   stripe listen --forward-to https://[SUPABASE-PROJECT-ID].supabase.co/functions/v1/stripe-webhook
   
   # Trigger test events
   stripe trigger checkout.session.completed
   stripe trigger customer.subscription.updated
   ```

#### B. Database Verification Queries
```sql
-- Check subscription status
SELECT 
  id, 
  name, 
  stripe_customer_id,
  stripe_subscription_id,
  subscription_status,
  subscription_plan,
  subscription_end_date
FROM networks
WHERE stripe_subscription_id IS NOT NULL
ORDER BY updated_at DESC;

-- Find mismatched subscriptions
SELECT * FROM networks
WHERE subscription_status = 'active'
AND subscription_end_date < NOW();
```

### 4. Database Integration Testing

#### A. Network Subscription Fields
1. **Field Updates**:
   - [ ] `stripe_customer_id` populated correctly
   - [ ] `stripe_subscription_id` stored
   - [ ] `subscription_status` reflects Stripe status
   - [ ] `subscription_plan` matches price ID
   - [ ] `subscription_end_date` set for active subscriptions
   - [ ] `trial_end_date` handled if applicable

#### B. Plan Mapping Verification
1. **Price ID to Plan Name**:
   - [ ] Community plan (€17) maps correctly
   - [ ] Organization plan (€97) maps correctly
   - [ ] Other plans map to correct names
   - [ ] Unknown price IDs default safely

### 5. Error Scenarios Testing

#### A. Payment Failures
1. **Card Declined**:
   - [ ] Test with declining test card
   - [ ] Verify error message shown to user
   - [ ] Check no partial database updates
   - [ ] Confirm user can retry payment

2. **Network Issues**:
   - [ ] Test checkout interruption
   - [ ] Verify webhook retry mechanism
   - [ ] Check idempotency handling

#### B. Edge Function Errors
1. **Missing Environment Variables**:
   - [ ] Test function behavior without Stripe key
   - [ ] Verify appropriate error responses
   - [ ] Check no sensitive data exposed

2. **Invalid Requests**:
   - [ ] Test with malformed request body
   - [ ] Test with missing required fields
   - [ ] Verify 400 responses with clear errors

#### C. Data Consistency
1. **Webhook Failures**:
   - [ ] Simulate webhook processing failure
   - [ ] Verify Stripe retry behavior
   - [ ] Test manual reconciliation process
   - [ ] Check subscription status sync

### 6. Security & Compliance Testing

#### A. API Key Security
1. **Frontend Security**:
   - [ ] Verify only public key in frontend code
   - [ ] Check no secret keys in browser console
   - [ ] Confirm keys not in git history
   - [ ] Test key rotation process

2. **Backend Security**:
   - [ ] Verify secret keys only in Edge Functions env
   - [ ] Check webhook secret not exposed
   - [ ] Test signature validation rejects tampered requests

#### B. PCI Compliance
1. **Payment Data Handling**:
   - [ ] Confirm no card details stored in database
   - [ ] Verify all payment data goes directly to Stripe
   - [ ] Check no card numbers in logs
   - [ ] Test secure redirect to Stripe Checkout

#### C. Data Privacy
1. **Customer Data**:
   - [ ] Verify GDPR compliance for EU customers
   - [ ] Test data export capabilities
   - [ ] Check customer deletion process
   - [ ] Verify billing address handling

## Production Deployment Steps

### 1. Pre-Deployment Preparation

#### Code Review
- [ ] Review all Stripe-related code changes
- [ ] Verify no hardcoded test keys
- [ ] Check error handling is comprehensive
- [ ] Confirm logging doesn't expose sensitive data

#### Database Preparation
- [ ] Back up production database
- [ ] Verify all Stripe-related migrations applied
- [ ] Check indexes on Stripe fields for performance
- [ ] Document current subscription states

#### Deployment Planning
- [ ] Schedule deployment during low-traffic period
- [ ] Notify support team of deployment
- [ ] Prepare customer communication templates
- [ ] Create rollback plan with specific steps

### 2. Deployment Process

#### Step 1: Edge Functions Deployment
```bash
# Deploy all Stripe-related Edge Functions
supabase functions deploy create-checkout-session
supabase functions deploy stripe-webhook
supabase functions deploy manage-subscription
```

#### Step 2: Environment Variable Updates
1. **Supabase Dashboard**:
   - [ ] Set `STRIPE_SECRET_KEY` to production key
   - [ ] Set `STRIPE_WEBHOOK_SECRET` to production webhook secret
   - [ ] Verify variables are in correct Edge Functions

2. **Vercel/Frontend**:
   - [ ] Update `VITE_STRIPE_PUBLIC_KEY` to production key
   - [ ] Deploy frontend with new environment variables

#### Step 3: Stripe Dashboard Configuration
- [ ] Create/verify webhook endpoint pointing to Supabase
- [ ] Enable production mode for webhook
- [ ] Verify all products and prices are created
- [ ] Configure Customer Portal settings

#### Step 4: Initial Testing
- [ ] Make one small test transaction (€1 test product)
- [ ] Verify webhook received and processed
- [ ] Check database updated correctly
- [ ] Test Customer Portal access

### 3. Post-Deployment Verification

#### Immediate Checks (First Hour)
- [ ] Process first real customer transaction
- [ ] Monitor Edge Function logs for errors
- [ ] Verify webhook processing (check Stripe Dashboard)
- [ ] Confirm database updates working
- [ ] Test subscription management flows
- [ ] Check no CORS errors in production

#### First 24 Hours Monitoring
- [ ] Track key metrics:
  - Checkout completion rate
  - Webhook success rate (target: >99%)
  - Payment success rate
  - Customer Portal access success
- [ ] Monitor for:
  - Failed payments
  - Webhook timeouts
  - Database sync issues
  - Customer complaints
- [ ] Review all Stripe Dashboard logs
- [ ] Check Supabase Edge Function analytics

## Rollback Plan

### Immediate Response (Within 15 minutes)

1. **Stop New Transactions**:
   ```bash
   # In Vercel, revert VITE_STRIPE_PUBLIC_KEY to test key
   # This prevents new checkouts from starting
   ```

2. **Preserve Webhook Processing**:
   - Keep production webhook active to process pending events
   - Monitor webhook queue in Stripe Dashboard

3. **Communication**:
   - [ ] Post status update on admin dashboard
   - [ ] Notify affected network admins via email
   - [ ] Update status page if available

### Data Recovery Process

1. **Identify Affected Transactions**:
   ```sql
   -- Find networks with recent subscription changes
   SELECT id, name, stripe_subscription_id, subscription_status, updated_at
   FROM networks
   WHERE updated_at > '[deployment_timestamp]'
   AND stripe_subscription_id IS NOT NULL;
   ```

2. **Reconciliation Steps**:
   - [ ] Export list of affected subscriptions
   - [ ] Compare Stripe Dashboard with database
   - [ ] Update any mismatched statuses
   - [ ] Document all manual changes

3. **Refund Process** (if needed):
   - [ ] Use Stripe Dashboard for refunds
   - [ ] Update database subscription status
   - [ ] Send apology email with explanation

## Monitoring & Alerting Setup

### Key Metrics to Monitor

1. **Stripe Metrics** (via Stripe Dashboard):
   - Successful charge rate (baseline: >95%)
   - Checkout conversion rate (baseline: >60%)
   - Webhook delivery success rate (baseline: >99%)
   - Average checkout completion time

2. **Application Metrics** (via Supabase/Vercel):
   - Edge Function invocation count
   - Edge Function error rate (<1%)
   - Database query performance
   - Frontend error rate

3. **Business Metrics**:
   - Daily transaction volume
   - Revenue by plan type
   - Churn rate
   - Failed payment recovery rate

### Alert Configuration

```javascript
// Example monitoring thresholds
const alerts = {
  webhookFailureRate: { threshold: 0.05, severity: 'critical' },
  paymentSuccessRate: { threshold: 0.95, severity: 'warning' },
  checkoutAbandonmentRate: { threshold: 0.40, severity: 'info' },
  edgeFunctionErrors: { threshold: 10, severity: 'critical' },
};
```

### Monitoring Tools Setup
- [ ] Configure Stripe radar rules
- [ ] Set up Stripe webhook alerts
- [ ] Enable Supabase function monitoring
- [ ] Configure Vercel Analytics alerts
- [ ] Set up uptime monitoring for Edge Functions

## Support Documentation

### Customer-Facing FAQ

1. **"Why was my payment declined?"**
   - Common decline reasons and solutions
   - How to update payment method
   - Contact support for assistance

2. **"How do I cancel my subscription?"**
   - Step-by-step guide to Customer Portal
   - What happens after cancellation
   - Refund policy explanation

3. **"Can I change my subscription plan?"**
   - How to upgrade/downgrade
   - Prorated billing explanation
   - When changes take effect

### Internal Troubleshooting Guide

1. **Webhook Not Processing**:
   - Check Edge Function logs
   - Verify webhook secret matches
   - Test with Stripe CLI
   - Check for signature validation errors

2. **Subscription Status Mismatch**:
   - Compare Stripe and database
   - Check webhook event history
   - Run reconciliation script
   - Update manually if needed

3. **Customer Portal Issues**:
   - Verify customer ID exists
   - Check portal configuration
   - Test with different browser
   - Check for CORS issues

## Success Criteria & Milestones

### Week 1 Success Metrics
- [ ] 50+ successful transactions
- [ ] <1% payment failure rate
- [ ] 99%+ webhook success rate
- [ ] Zero critical errors
- [ ] <5 support tickets related to billing

### Month 1 Success Metrics
- [ ] 500+ successful transactions
- [ ] 95%+ customer satisfaction with billing
- [ ] <0.5% involuntary churn rate
- [ ] Successful handling of all edge cases
- [ ] Documented playbook for common issues

### Long-term Success Indicators
- [ ] Automated reconciliation process
- [ ] Self-service rate >90%
- [ ] Support ticket rate <2% of transactions
- [ ] Revenue recovery rate >80% for failed payments
- [ ] Compliance with all regulations

## Known Issues & Solutions

### Common Implementation Issues

1. **Webhook URL Mismatch** (from STRIPE_WEBHOOK_CONFIGURATION.md):
   - **Issue**: Webhook pointing to Vercel instead of Supabase
   - **Solution**: Update webhook URL to `https://[SUPABASE-PROJECT-ID].supabase.co/functions/v1/stripe-webhook`

2. **Price ID Mapping**:
   - **Issue**: Unknown price IDs default to 'community' plan
   - **Solution**: Ensure all production price IDs are in `getPlanFromPriceId()` function

3. **CORS Errors**:
   - **Issue**: Production domain not in allowed origins
   - **Solution**: Update `supabase/functions/_shared/cors.ts` with production domains

4. **Metadata Loss**:
   - **Issue**: Network ID not passed through checkout
   - **Solution**: Always include `networkId` in checkout session metadata

### Edge Function Specific Issues

1. **Environment Variable Access**:
   ```typescript
   // Common error: Deno.env.get() returns undefined
   const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
   if (!stripeKey) {
     throw new Error('STRIPE_SECRET_KEY not configured');
   }
   ```

2. **Webhook Signature Validation**:
   ```typescript
   // Use constructEventAsync for Deno compatibility
   const event = await stripe.webhooks.constructEventAsync(
     body,
     signature,
     webhookSecret
   );
   ```

## Compliance Checklist

### Legal & Regulatory
- [ ] Terms of Service updated with billing terms
- [ ] Privacy Policy includes payment data handling
- [ ] VAT/tax handling configured correctly (EUR default)
- [ ] Refund policy clearly stated
- [ ] SCA (Strong Customer Authentication) enabled for EU cards

### Financial Controls
- [ ] Reconciliation process documented
- [ ] Audit trail for all transactions
- [ ] Monthly financial reporting setup
- [ ] Dispute handling process defined
- [ ] Fraud prevention rules configured in Stripe Radar

## Final Sign-off Checklist

### Technical Approval
- [ ] All test scenarios passed
- [ ] Security review completed
- [ ] Performance benchmarks met
- [ ] Rollback plan tested
- [ ] Monitoring configured

### Business Approval
- [ ] Pricing verified correct
- [ ] Customer communications ready
- [ ] Support team trained
- [ ] Legal review completed
- [ ] Finance team sign-off

### Go-Live Authorization
- [ ] CTO/Technical Lead: _____________ Date: _______
- [ ] Product Manager: _____________ Date: _______
- [ ] Finance Manager: _____________ Date: _______
- [ ] Legal Counsel: _____________ Date: _______

---

**Document Version**: 1.0
**Last Updated**: December 6, 2024
**Next Review**: One week post-deployment
**Owner**: Mon Cercle Development Team