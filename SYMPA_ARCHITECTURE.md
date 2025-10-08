# Sympa Integration Architecture - RezoProSpec

## Overview

This document explains how the Conclav platform integrates with Sympa mailing lists to ensure **category-based email distribution**. Members only receive announcements for categories they've subscribed to.

## The Problem We're Solving

**Without category-specific lists:**
- Admin approves "logement" announcement
- System sends: `DISTRIBUTE rezoprospec message_id`
- **ALL members receive it** ❌ (even those not subscribed to "logement")

**With category-specific lists:**
- Admin approves "logement" announcement
- System sends: `DISTRIBUTE rezoprospec-logement message_id`
- **Only members subscribed to "logement" receive it** ✅

## Architecture

### 1. Three Separate Sympa Lists

```
rezoprospec@lists.riseup.net           → General announcements (EXISTING list)
rezoprospec-logement@lists.riseup.net  → Housing announcements (NEW list)
rezoprospec-ateliers@lists.riseup.net  → Workshop announcements (NEW list)
```

**Note:** The "general" category uses the existing `rezoprospec` list (no `-general` suffix) to maintain backward compatibility.

### 2. Database Schema

#### `sympa_lists` Table
Stores configuration for each Sympa list:

```sql
CREATE TABLE sympa_lists (
  id UUID PRIMARY KEY,
  network_id UUID, -- RezoProSpec network
  category TEXT,   -- 'general', 'logement', 'ateliers'
  list_name TEXT,  -- 'rezoprospec' (for general), 'rezoprospec-logement', etc.
  list_email TEXT, -- 'rezoprospec@lists.riseup.net', etc.
  description TEXT
);
```

**Example data:**
| category   | list_name              | list_email                           |
|------------|------------------------|--------------------------------------|
| general    | rezoprospec            | rezoprospec@lists.riseup.net         |
| logement   | rezoprospec-logement   | rezoprospec-logement@lists.riseup.net|
| ateliers   | rezoprospec-ateliers   | rezoprospec-ateliers@lists.riseup.net|

#### `sympa_subscriptions` Table
Tracks each member's subscription to each list:

```sql
CREATE TABLE sympa_subscriptions (
  id UUID PRIMARY KEY,
  profile_id UUID,      -- Member
  sympa_list_id UUID,   -- Which list
  email TEXT,           -- Member's email
  status TEXT,          -- 'pending', 'subscribed', 'unsubscribed', 'error'
  last_synced_at TIMESTAMPTZ,
  sync_error TEXT
);
```

**Example data:**
| profile_id | sympa_list_id (category) | email              | status      |
|------------|--------------------------|--------------------|-------------|
| user-123   | list-general             | john@example.com   | subscribed  |
| user-123   | list-logement            | john@example.com   | subscribed  |
| user-123   | list-ateliers            | john@example.com   | unsubscribed|
| user-456   | list-general             | jane@example.com   | subscribed  |
| user-456   | list-logement            | jane@example.com   | unsubscribed|
| user-456   | list-ateliers            | jane@example.com   | subscribed  |

#### `profiles.annonces_categories` Field
User preference stored as JSONB array:

```json
["general", "logement"]  // John is subscribed to general + logement
["general", "ateliers"]  // Jane is subscribed to general + ateliers
```

## Complete Flow

### Flow 1: Member Updates Notification Preferences

```
┌─────────────────────────────────────────────────────────────┐
│ 1. User toggles categories in NotificationSettings.jsx     │
│    Before: ["general", "logement", "ateliers"]             │
│    After:  ["general", "logement"]                         │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. updateSympaCategories() API call                        │
│    Updates profiles.annonces_categories                    │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. Database trigger: sync_profile_sympa_subscriptions()    │
│    Automatically updates sympa_subscriptions table:        │
│                                                             │
│    - general:  'subscribed'  (still in array)              │
│    - logement: 'subscribed'  (still in array)              │
│    - ateliers: 'unsubscribed' (removed from array) ← NEW!  │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. Edge Function: sympa-sync-subscriptions                 │
│    Processes pending/unsubscribed records:                 │
│                                                             │
│    Sends to sympa@lists.riseup.net:                        │
│    - SIGNOFF rezoprospec-ateliers                          │
│                                                             │
│    Updates status: 'pending' → 'subscribed'/'unsubscribed' │
└─────────────────────────────────────────────────────────────┘
```

**Key Points:**
- ✅ Database trigger automatically creates/updates `sympa_subscriptions` records
- ✅ Edge Function runs periodically (CRON) or on-demand to sync with Sympa
- ✅ User doesn't need to wait - UI updates instantly, Sympa syncs in background

### Flow 2: Admin Approves Announcement

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Admin receives annonce via Sympa email hook             │
│    Stored in annonces_moderation table                     │
│    category: NULL (not yet assigned)                       │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. Admin opens AnnoncesModerationTab                       │
│    Assigns category: "logement"                            │
│    Clicks "Approve"                                        │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. moderateAnnonceWithSympa() API call                     │
│    annonceId: "abc-123"                                    │
│    action: "approved"                                      │
│    category: "logement"                                    │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. Edge Function: sympa-moderate-message                   │
│                                                             │
│    a) Fetch annonce from database                          │
│    b) Lookup Sympa list for category "logement":           │
│       → rezoprospec-logement@lists.riseup.net              │
│    c) Build command:                                       │
│       DISTRIBUTE rezoprospec-logement <message_id>         │
│    d) Send email to sympa@lists.riseup.net                 │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. Sympa processes DISTRIBUTE command                      │
│    Sends email ONLY to members of rezoprospec-logement:    │
│    ✅ john@example.com  (subscribed to logement)           │
│    ❌ jane@example.com  (NOT subscribed to logement)       │
└─────────────────────────────────────────────────────────────┘
```

**Key Points:**
- ✅ Category MUST be assigned before approval
- ✅ Sympa list is looked up dynamically from `sympa_lists` table
- ✅ Only members subscribed to that specific category receive the email

## Implementation Details

### Trigger: Auto-Sync Subscriptions

When a profile's `annonces_categories` changes, automatically update `sympa_subscriptions`:

```sql
CREATE TRIGGER sync_sympa_on_profile_change
  AFTER INSERT OR UPDATE OF annonces_categories ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_profile_sympa_subscriptions();
```

**What it does:**
1. Reads `annonces_categories` array (e.g., `["general", "logement"]`)
2. For each category:
   - Find corresponding `sympa_list`
   - Insert/update `sympa_subscriptions` with status='pending'
3. For categories NOT in array:
   - Update status='unsubscribed'

### Edge Function: Sync Subscriptions

**Endpoint:** `/functions/v1/sympa-sync-subscriptions`

**Purpose:** Process pending subscriptions and send commands to Sympa

**Invocation:**
```javascript
// Sync all pending subscriptions (batch)
await supabase.functions.invoke('sympa-sync-subscriptions', {
  body: { batchSize: 50 }
})

// Sync specific user immediately
await supabase.functions.invoke('sympa-sync-subscriptions', {
  body: { profileId: 'user-123' }
})
```

**Process:**
1. Fetch records with `status IN ('pending', 'error')`
2. For each record:
   - Build command: `SUBSCRIBE rezoprospec-logement` or `SIGNOFF rezoprospec-logement`
   - Send email from user's address to `sympa@lists.riseup.net`
   - Update status to 'subscribed'/'unsubscribed'

**Important:** Sympa requires the email to come FROM the user's address for security. This means:
- You need to configure Resend/SendGrid to allow sending from user emails
- OR use Sympa's "quiet" mode if available
- OR have a verified domain and use SPF/DKIM

### Edge Function: Moderate Message

**Endpoint:** `/functions/v1/sympa-moderate-message`

**Purpose:** Approve/reject announcements and distribute to correct list

**Changes from old version:**
```typescript
// OLD (wrong - sends to everyone)
const SYMPA_LIST_NAME = 'rezoprospec'
sympaCommand = `DISTRIBUTE ${SYMPA_LIST_NAME} ${message_id}`

// NEW (correct - sends to category-specific list)
const sympaList = await getListForCategory(annonce.category)
sympaCommand = `DISTRIBUTE ${sympaList.list_name} ${message_id}`
```

## Setup Instructions

### 1. Create Sympa Lists on Riseup

You need to manually create 2 NEW lists on Riseup.net:

1. **Go to:** https://lists.riseup.net
2. **Login** with your account
3. **Create lists:**
   - ✅ `rezoprospec` (ALREADY EXISTS - keep as is)
   - 🆕 `rezoprospec-logement` (NEW - create this)
   - 🆕 `rezoprospec-ateliers` (NEW - create this)

4. **Configure each NEW list:**
   - **Sending:** Moderated (hold messages for approval)
   - **Subscription:** Open or closed (your choice)
   - **Archives:** Enable if desired

**Note:** The existing `rezoprospec` list will be used for the "general" category.

### 2. Run Migrations

```bash
# Apply category list migrations
npx supabase db push

# This creates:
# - sympa_lists table
# - sympa_subscriptions table
# - Inserts 3 list configurations
# - Creates triggers
```

### 3. Deploy Edge Functions

```bash
# Deploy subscription sync function
npx supabase functions deploy sympa-sync-subscriptions

# Deploy updated moderation function
npx supabase functions deploy sympa-moderate-message
```

### 4. Configure Environment Variables

In Supabase Dashboard → Edge Functions → Settings:

```env
RESEND_API_KEY=re_xxxxx
SYMPA_COMMAND_EMAIL=sympa@lists.riseup.net
FROM_EMAIL=noreply@conclav.club
```

### 5. Set Up CRON Job (Optional)

To automatically sync subscriptions every hour:

```sql
-- Create CRON job in Supabase
SELECT cron.schedule(
  'sympa-sync-hourly',
  '0 * * * *', -- Every hour
  $$
  SELECT net.http_post(
    url:='https://your-project.supabase.co/functions/v1/sympa-sync-subscriptions',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_KEY"}'::jsonb,
    body:='{"batchSize": 100}'::jsonb
  ) as request_id;
  $$
);
```

## Testing

### Test 1: Member Subscription Flow

1. **Create test user** in RezoProSpec network
2. **Check subscriptions:**
   ```sql
   SELECT * FROM sympa_subscriptions WHERE profile_id = 'test-user-id';
   ```
   Should show 3 records with `status='pending'`

3. **Run sync:**
   ```bash
   curl -X POST https://your-project.supabase.co/functions/v1/sympa-sync-subscriptions \
     -H "Authorization: Bearer SERVICE_KEY" \
     -H "Content-Type: application/json" \
     -d '{"profileId": "test-user-id"}'
   ```

4. **Check status changed to 'subscribed'**

5. **Toggle category off** in UI (unsubscribe from "ateliers")

6. **Check subscription updated:**
   ```sql
   SELECT * FROM sympa_subscriptions
   WHERE profile_id = 'test-user-id'
   AND sympa_list_id IN (SELECT id FROM sympa_lists WHERE category='ateliers');
   ```
   Should show `status='unsubscribed'`

### Test 2: Annonce Distribution

1. **Create test annonce** in `annonces_moderation`:
   ```sql
   INSERT INTO annonces_moderation (
     network_id, sender_email, subject, content, category, status
   ) VALUES (
     'b4e51e21-de8f-4f5b-b35d-f98f6df27508',
     'test@example.com',
     'Test Logement',
     'This is a test',
     'logement',
     'pending'
   );
   ```

2. **Approve via API:**
   ```bash
   curl -X POST https://your-project.supabase.co/functions/v1/sympa-moderate-message \
     -H "Authorization: Bearer SERVICE_KEY" \
     -H "Content-Type: application/json" \
     -d '{"annonceId": "annonce-id", "action": "approved"}'
   ```

3. **Check logs** - should show:
   ```
   📋 Using Sympa list: rezoprospec-logement
   📧 Sending Sympa command: DISTRIBUTE rezoprospec-logement ...
   ✅ Sympa command email sent successfully
   ```

4. **Verify in Sympa** - only `rezoprospec-logement` members receive it

## Monitoring

### Check Subscription Sync Status

```sql
-- See all subscriptions by status
SELECT
  s.status,
  COUNT(*) as count
FROM sympa_subscriptions s
GROUP BY s.status;

-- Find failed syncs
SELECT
  p.full_name,
  p.contact_email,
  sl.category,
  s.status,
  s.sync_error,
  s.updated_at
FROM sympa_subscriptions s
JOIN profiles p ON s.profile_id = p.id
JOIN sympa_lists sl ON s.sympa_list_id = sl.id
WHERE s.status = 'error'
ORDER BY s.updated_at DESC;
```

### Check Member Distribution

```sql
-- How many members subscribed to each category?
SELECT
  sl.category,
  COUNT(*) as subscriber_count
FROM sympa_subscriptions s
JOIN sympa_lists sl ON s.sympa_list_id = sl.id
WHERE s.status = 'subscribed'
GROUP BY sl.category
ORDER BY sl.category;
```

### Check Annonce Distribution History

```sql
-- See which list each annonce was sent to
SELECT
  a.subject,
  a.category,
  a.status,
  a.sympa_command,
  a.synced_to_sympa,
  a.moderated_at
FROM annonces_moderation a
WHERE a.network_id = 'b4e51e21-de8f-4f5b-b35d-f98f6df27508'
ORDER BY a.moderated_at DESC
LIMIT 20;
```

## Troubleshooting

### Issue: Subscriptions stuck in 'pending'

**Cause:** Edge Function not running or failing

**Solution:**
```bash
# Manually trigger sync
npx supabase functions invoke sympa-sync-subscriptions \
  --data '{"batchSize": 100}'

# Check logs
npx supabase functions logs sympa-sync-subscriptions --tail
```

### Issue: Members receiving wrong category emails

**Cause:** Either:
1. Sympa lists not set up correctly
2. DISTRIBUTE command using wrong list name

**Solution:**
- Verify lists exist on Riseup.net
- Check `sympa_lists` table has correct `list_name` values
- Check Edge Function logs for which list was used

### Issue: "From address not verified" error

**Cause:** Resend requires sender verification

**Solution:**
- Add your domain to Resend
- Configure SPF/DKIM records
- OR use a verified sender address (less ideal for Sympa)

## Future Enhancements

1. **Batch subscription sync** - Process all pending subscriptions daily
2. **Admin dashboard** - Show sync status, failed subscriptions
3. **Retry mechanism** - Automatically retry failed syncs
4. **Webhook from Sympa** - Real-time sync confirmation
5. **Member preference import** - Bulk import existing Sympa subscriptions

## Summary

**Key Points:**
- ✅ 3 separate Sympa lists = category-based distribution
- ✅ Database tables track subscriptions per list
- ✅ Triggers automatically sync preferences to subscriptions
- ✅ Edge Functions handle Sympa commands
- ✅ Members only receive emails for subscribed categories

**Critical Success Factors:**
1. Admin MUST assign category before approving
2. Sympa lists must exist on Riseup.net
3. Edge Functions must have correct permissions
4. Email sending must be configured (Resend/SendGrid)
5. Regular sync of subscriptions (CRON job)
