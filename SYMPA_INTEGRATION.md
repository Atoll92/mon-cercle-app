# Sympa Mailing List Integration Guide

This document explains the Sympa mailing list integration for the RezoProSpec network, enabling email-based moderation and subscription management through the Conclav application.

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Setup Instructions](#setup-instructions)
- [Usage Guide](#usage-guide)
- [API Reference](#api-reference)
- [Database Schema](#database-schema)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

---

## Overview

The Sympa integration enables administrators to:
- **Moderate annonces** (classified ads) sent to the Sympa mailing list directly from the app
- **Manage user subscriptions** by approving/rejecting membership requests
- **Control email categories** with app-only filtering based on user preferences

### Key Features

✅ **Email-based moderation** - Approve/reject messages via Resend API → Sympa commands
✅ **Subscription management** - Queue-based approval workflow for new members
✅ **Category filtering** - Users control which annonce categories they receive
✅ **Unified admin interface** - Manage everything from the app admin panel
✅ **Audit trail** - All actions tracked in database

---

## Architecture

### Hybrid Email-Based Integration

```
┌─────────────────────────────────────────────────────────────────┐
│                      Application Flow                            │
└─────────────────────────────────────────────────────────────────┘

User Action in App
       ↓
Edge Function (Supabase)
       ↓
Email Command via Resend API
       ↓
Sympa Command Email (sympa@lists.riseup.net)
       ↓
Sympa Processes Command
       ↓
Database Updated (synced_to_sympa = true)
```

### Components

1. **Edge Functions** (Supabase Functions)
   - `sympa-moderate-message` - Send moderation commands (DISTRIBUTE/REJECT)
   - `sympa-manage-subscription` - Send subscription commands (ADD/DEL)

2. **API Layer** (`src/api/`)
   - `annonces.js` - Annonce moderation functions
   - `sympaSync.js` - Subscription management functions

3. **UI Components** (`src/components/`)
   - `admin/AnnoncesModerationTab.jsx` - Moderate incoming messages
   - `admin/UsersModerationTab.jsx` - Approve/reject subscription requests
   - `NotificationSettings.jsx` - User category preferences

4. **Database Tables**
   - `annonces_moderation` - Stores moderation queue with Sympa metadata
   - `sympa_subscription_queue` - Tracks subscription requests
   - `profiles.annonces_categories` - User category preferences

---

## Setup Instructions

### 1. Environment Variables

Add the following to your Supabase Edge Function secrets:

```bash
# Set via Supabase CLI
supabase secrets set RESEND_API_KEY="re_xxxxx"
supabase secrets set ADMIN_EMAIL="admin@your-domain.com"
supabase secrets set SYMPA_COMMAND_EMAIL="sympa@lists.riseup.net"
supabase secrets set SYMPA_LIST_NAME="rezoprospec"
```

### 2. Run Database Migration

Apply the Sympa integration migration:

```bash
# Using Supabase CLI
supabase db push

# Or manually apply migration
psql < supabase/migrations/20251003000000_add_sympa_integration.sql
```

This creates:
- `annonces_moderation` table with Sympa fields
- `sympa_subscription_queue` table
- `profiles.annonces_categories` column
- RLS policies for security

### 3. Deploy Edge Functions

Deploy the Sympa integration Edge Functions:

```bash
# Deploy moderation function
supabase functions deploy sympa-moderate-message

# Deploy subscription management function
supabase functions deploy sympa-manage-subscription
```

### 4. Configure Resend

1. Go to [Resend Dashboard](https://resend.com)
2. Verify your sending domain (if not already done)
3. Get your API key and add to Edge Function secrets (step 1)
4. Ensure the `ADMIN_EMAIL` is authorized to send from your domain

### 5. Test the Integration

```bash
# Test moderation command
curl -X POST https://your-project.supabase.co/functions/v1/sympa-moderate-message \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"annonceId":"test-id","action":"approved"}'

# Test subscription management
curl -X POST https://your-project.supabase.co/functions/v1/sympa-manage-subscription \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","action":"subscribe"}'
```

---

## Usage Guide

### For Network Admins

#### Moderating Annonces

1. Navigate to **Admin Panel** → **Annonces Moderation** tab
2. View pending annonces from the Sympa mailing list
3. Assign a category (optional)
4. Click **Valider** (Approve) or **Rejeter** (Reject)
5. Status indicator shows if synced with Sympa:
   - ✅ **Sympa ✓** - Successfully synced
   - ⚙️ **App uniquement** - Only in app (no Sympa data)

**Commands sent to Sympa:**
- Approve: `AUTH {token} DISTRIBUTE rezoprospec {ticket_id}`
- Reject: `AUTH {token} REJECT rezoprospec {ticket_id}`

#### Managing Subscriptions

1. Navigate to **Admin Panel** → **Users Moderation** tab
2. View pending subscription requests
3. Review user information and motivation
4. Click **Approuver** (Approve) or **Rejeter** (Reject)
5. Approved users are added to Sympa mailing list

**Commands sent to Sympa:**
- Approve: `ADD rezoprospec user@example.com`
- Reject: Updates database only (no Sympa command)

### For Users

#### Setting Category Preferences

1. Go to **Profile Settings** → **Notifications** tab
2. Scroll to **Catégories d'Annonces** section (RezoProSpec network only)
3. Toggle categories to control which emails you receive:
   - Immobilier
   - Ateliers
   - Cours
   - Matériel
   - Échange
   - Casting
   - Annonces
   - Dons
4. Changes are saved automatically

**Note:** All users are subscribed to the Sympa list, but the app filters emails based on preferences before sending notifications.

#### Signing Up

1. Visit the [RezoProSpec signup page](https://your-domain.com/signup/rezoprospec)
2. Accept the charter
3. Create account
4. Subscription request is automatically added to moderation queue
5. Wait for admin approval
6. You'll receive email confirmation once approved

---

## API Reference

### Annonces API (`src/api/annonces.js`)

#### `fetchAnnonces(networkId, status)`
Fetch annonces for moderation.

```javascript
const annonces = await fetchAnnonces(networkId, 'pending');
```

#### `moderateAnnonceWithSympa(annonceId, status, category)`
Moderate an annonce and sync with Sympa.

```javascript
const result = await moderateAnnonceWithSympa(
  'annonce-id',
  'approved',
  'immobilier'
);
// Returns: { success: true, synced: true, message: '...' }
```

### Sympa Sync API (`src/api/sympaSync.js`)

#### `fetchSubscriptionRequests(networkId, statusFilter)`
Get subscription requests for admin review.

```javascript
const requests = await fetchSubscriptionRequests(networkId, 'pending');
```

#### `approveSubscription(subscriptionId, email)`
Approve a subscription request.

```javascript
await approveSubscription(sub.id, sub.email);
```

#### `rejectSubscription(subscriptionId, profileId)`
Reject a subscription request.

```javascript
await rejectSubscription(sub.id, sub.profile_id);
```

#### `subscribeToSympa(profileId, email, categories, motivation)`
Create a new subscription request.

```javascript
await subscribeToSympa(
  profileId,
  'user@example.com',
  ['immobilier', 'cours'],
  'Je suis artiste à Marseille'
);
```

#### `updateSympaCategories(profileId, categories)`
Update user's category preferences.

```javascript
await updateSympaCategories(profileId, ['immobilier', 'ateliers']);
```

---

## Database Schema

### `annonces_moderation` Table

Stores annonces for moderation with Sympa integration metadata.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `network_id` | UUID | Network (RezoProSpec) |
| `sender_email` | TEXT | Sender's email |
| `sender_name` | TEXT | Sender's name |
| `subject` | TEXT | Email subject |
| `content` | TEXT | Email body |
| `category` | TEXT | Assigned category |
| `status` | TEXT | pending/approved/rejected |
| `sympa_ticket_id` | TEXT | Sympa ticket ID (from moderation email) |
| `sympa_auth_token` | TEXT | Auth token from Sympa |
| `sympa_command` | TEXT | Command sent to Sympa |
| `synced_to_sympa` | BOOLEAN | Whether synced with Sympa |
| `original_email_date` | TIMESTAMPTZ | Original email timestamp |
| `moderated_at` | TIMESTAMPTZ | Moderation timestamp |

### `sympa_subscription_queue` Table

Tracks subscription requests and approvals.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `profile_id` | UUID | User's profile |
| `email` | TEXT | User's email |
| `status` | TEXT | pending/approved/rejected/synced |
| `categories` | JSONB | Selected categories |
| `motivation` | TEXT | User's motivation (optional) |
| `sympa_auth_token` | TEXT | Auth token (if needed) |
| `created_at` | TIMESTAMPTZ | Request timestamp |
| `synced_at` | TIMESTAMPTZ | Sync timestamp |

### `profiles.annonces_categories`

User's category preferences (JSONB array).

```json
["immobilier", "ateliers", "cours", "materiel", "echange", "casting", "annonces", "dons"]
```

---

## Testing

### Manual Testing

#### 1. Test Annonce Moderation

```sql
-- Insert test annonce
INSERT INTO annonces_moderation (
  network_id,
  sender_email,
  sender_name,
  subject,
  content,
  category,
  status,
  sympa_ticket_id,
  sympa_auth_token
) VALUES (
  'b4e51e21-de8f-4f5b-b35d-f98f6df27508',
  'test@example.com',
  'Test User',
  'Test Subject',
  'Test content for moderation',
  'immobilier',
  'pending',
  '12345678',
  'test-auth-token'
);
```

Then approve via admin interface and verify email sent.

#### 2. Test Subscription Flow

1. Sign up at `/signup/rezoprospec`
2. Check `sympa_subscription_queue` table for entry
3. Approve via admin interface
4. Verify Resend email sent with ADD command

#### 3. Test Category Preferences

1. Go to Notification Settings
2. Toggle categories
3. Check `profiles.annonces_categories` column updated

### Automated Testing

```bash
# Run Edge Function tests (if implemented)
cd supabase/functions/sympa-moderate-message
deno test --allow-env --allow-net

cd ../sympa-manage-subscription
deno test --allow-env --allow-net
```

---

## Troubleshooting

### Common Issues

#### 1. Moderation not syncing with Sympa

**Symptoms:** Status shows "App uniquement" instead of "Sympa ✓"

**Possible causes:**
- Missing `sympa_ticket_id` or `sympa_auth_token` in annonce
- Resend API key not configured
- Edge Function error

**Solution:**
```bash
# Check Edge Function logs
supabase functions logs sympa-moderate-message

# Verify environment variables
supabase secrets list

# Test manually
curl -X POST https://your-project.supabase.co/functions/v1/sympa-moderate-message \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"annonceId":"YOUR_ANNONCE_ID","action":"approved"}'
```

#### 2. Subscription approval fails

**Symptoms:** Error message when approving subscription request

**Possible causes:**
- Resend API rate limit
- Invalid email address
- Edge Function timeout

**Solution:**
```bash
# Check function logs
supabase functions logs sympa-manage-subscription

# Verify Resend API status
curl https://api.resend.com/emails \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"from":"test@your-domain.com","to":"test@example.com","subject":"Test","html":"Test"}'
```

#### 3. Category preferences not saving

**Symptoms:** Changes revert after page reload

**Possible causes:**
- Database permission issue
- RLS policy blocking update
- Network mismatch

**Solution:**
```sql
-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'profiles';

-- Verify user can update
SELECT * FROM profiles WHERE id = 'YOUR_PROFILE_ID';

-- Test manual update
UPDATE profiles
SET annonces_categories = '["immobilier","cours"]'::jsonb
WHERE id = 'YOUR_PROFILE_ID';
```

### Debug Mode

Enable debug logging in Edge Functions:

```typescript
// In sympa-moderate-message/index.ts or sympa-manage-subscription/index.ts
const DEBUG = Deno.env.get('DEBUG') === 'true';

if (DEBUG) {
  console.log('Full request body:', JSON.stringify(body, null, 2));
  console.log('Sympa command:', sympaCommand);
  console.log('Resend response:', await resendResponse.json());
}
```

Set via CLI:
```bash
supabase secrets set DEBUG="true"
```

---

## Future Enhancements

### Phase 6: Email Webhook Integration

Currently, annonces must be manually added to the database. Future enhancement:

1. **Forward Sympa emails** to webhook endpoint
2. **Parse email** to extract ticket ID, auth token, content
3. **Auto-create** annonces in moderation queue

**Implementation:**
- Use email parsing service (CloudMailin, Mailgun Inbound, or Resend Inbound)
- Create `process-sympa-webhook` Edge Function
- Configure email forwarding from Riseup admin

### Phase 7: Two-Way Sync

Periodically sync member list from Sympa:

```typescript
// Pseudo-code for sync-sympa-members CRON job
const sympaMembers = await fetchSympaMembers(); // Via SOAP API or email
const appMembers = await fetchAppSubscriptions();

// Identify discrepancies
const toAdd = appMembers.filter(m => !sympaMembers.includes(m.email));
const toRemove = sympaMembers.filter(m => !appMembers.some(a => a.email === m));

// Reconcile
await Promise.all(toAdd.map(m => subscribeToSympa(m)));
await Promise.all(toRemove.map(m => unsubscribeFromSympa(m)));
```

---

## Support

For issues or questions:
- Check [GitHub Issues](https://github.com/your-repo/issues)
- Contact: admin@your-domain.com
- Sympa documentation: https://www.sympa.org/documentation

---

**Last Updated:** 2025-10-03
**Version:** 1.0.0
