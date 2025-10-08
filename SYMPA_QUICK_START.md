# Sympa Category Lists - Quick Start

## What Changed?

Instead of sending ALL announcements to ALL members via one list, we now have **3 separate lists**:

| Category | Sympa List                        | Who Receives                | Status |
|----------|-----------------------------------|-----------------------------| ------- |
| general  | `rezoprospec@lists.riseup.net`    | **ALL members** (MANDATORY) | EXISTING list |
| logement | `rezoprospec-logement@lists.riseup.net` | Members subscribed to "logement" (OPTIONAL) | NEW list |
| ateliers | `rezoprospec-ateliers@lists.riseup.net` | Members subscribed to "ateliers" (OPTIONAL) | NEW list |

**Important:**
- ✅ **"general" is MANDATORY** - All members always receive general announcements
- ⚙️ **"logement" and "ateliers" are OPTIONAL** - Members can unsubscribe from these

## How It Works

### When Admin Approves an Announcement:

```
Admin assigns category = "logement"
    ↓
System looks up: rezoprospec-logement@lists.riseup.net
    ↓
Sends: DISTRIBUTE rezoprospec-logement <message_id>
    ↓
Only members subscribed to "logement" receive it ✅
```

### When Member Updates Preferences:

```
User unchecks "ateliers" in Settings → Notifications
(Note: "general" checkbox is DISABLED - cannot be unchecked)
    ↓
System updates database
    ↓
Background job sends: SIGNOFF rezoprospec-ateliers
    ↓
User no longer receives "ateliers" emails ✅
User STILL receives "general" emails (mandatory)
```

## Setup Steps

### 1. Create 2 New Sympa Lists

On https://lists.riseup.net, create:
- 🆕 `rezoprospec-logement`
- 🆕 `rezoprospec-ateliers`

Configure as **moderated** lists.

**Note:** Keep the existing `rezoprospec` list - it will be used for "general" category.

### 2. Run Database Migrations

```bash
npx supabase db push
```

This creates:
- `sympa_lists` table (maps categories to email addresses)
- `sympa_subscriptions` table (tracks member subscriptions)
- Automatic triggers (sync preferences to subscriptions)

### 3. Deploy Edge Functions

```bash
npx supabase functions deploy sympa-moderate-message
npx supabase functions deploy sympa-sync-subscriptions
```

### 4. Test

#### Test Category-Specific Distribution:

1. Create a test announcement with category "logement"
2. Approve it
3. Check Edge Function logs - should show:
   ```
   📋 Using Sympa list: rezoprospec-logement
   📧 Sending: DISTRIBUTE rezoprospec-logement ...
   ```
4. Verify only "logement" subscribers received it

#### Test Member Subscription Sync:

1. Login as test member
2. Go to Settings → Notifications
3. Uncheck "ateliers"
4. Check database:
   ```sql
   SELECT * FROM sympa_subscriptions
   WHERE profile_id = '<test-user-id>'
   AND sympa_list_id IN (
     SELECT id FROM sympa_lists WHERE category = 'ateliers'
   );
   ```
5. Should show `status = 'unsubscribed'`
6. Run sync function:
   ```bash
   npx supabase functions invoke sympa-sync-subscriptions \
     --data '{"profileId": "<test-user-id>"}'
   ```
7. Check logs - should show: `SIGNOFF rezoprospec-ateliers`

## Migration Plan for Existing Members

All existing members on the `rezoprospec` list will:

1. **Automatically stay subscribed** to the "general" category (uses existing list - MANDATORY)
2. **Need to be subscribed** to new `rezoprospec-logement` and `rezoprospec-ateliers` lists

### Option A: Mass Subscribe (Recommended)

Subscribe all existing members to all 3 categories by default:

1. Export existing member emails from `rezoprospec` list
2. Bulk subscribe them to:
   - ✅ `rezoprospec` (already subscribed - MANDATORY)
   - 🆕 `rezoprospec-logement` (bulk subscribe)
   - 🆕 `rezoprospec-ateliers` (bulk subscribe)
3. Members can then unsubscribe from "logement" and "ateliers" if they don't want them
4. Members CANNOT unsubscribe from "general" (mandatory)

### Option B: Gradual Migration

1. Announce the new category system to members
2. Direct them to Settings → Notifications to choose categories
3. As they update preferences, they'll be subscribed to relevant lists
4. Until they update, they only receive "general" category emails (mandatory minimum)

## Database Tables

### `sympa_lists`
Configuration for each list:

```sql
SELECT * FROM sympa_lists;
```

| category | list_name              | list_email                           |
|----------|------------------------|--------------------------------------|
| general  | rezoprospec            | rezoprospec@lists.riseup.net         |
| logement | rezoprospec-logement   | rezoprospec-logement@lists.riseup.net|
| ateliers | rezoprospec-ateliers   | rezoprospec-ateliers@lists.riseup.net|

### `sympa_subscriptions`
Member subscriptions:

```sql
SELECT
  p.full_name,
  p.contact_email,
  sl.category,
  s.status
FROM sympa_subscriptions s
JOIN profiles p ON s.profile_id = p.id
JOIN sympa_lists sl ON s.sympa_list_id = sl.id
WHERE p.network_id = 'b4e51e21-de8f-4f5b-b35d-f98f6df27508'
ORDER BY p.full_name, sl.category;
```

### `profiles.annonces_categories`
User preferences:

```sql
SELECT
  full_name,
  contact_email,
  annonces_categories
FROM profiles
WHERE network_id = 'b4e51e21-de8f-4f5b-b35d-f98f6df27508';
```

Example:
```json
["general", "logement", "ateliers"]  // All categories
["general", "logement"]              // No ateliers
["general"]                          // Only general (MINIMUM - mandatory)
```

**Note:** "general" must ALWAYS be present. Database constraint enforces this.

## Troubleshooting

### Members not receiving emails

1. **Check subscription status:**
   ```sql
   SELECT * FROM sympa_subscriptions
   WHERE email = 'member@example.com';
   ```
2. If `status = 'pending'`, run sync:
   ```bash
   npx supabase functions invoke sympa-sync-subscriptions
   ```

### Wrong category receiving emails

1. **Check annonce category assignment:**
   ```sql
   SELECT id, subject, category, synced_to_sympa, sympa_command
   FROM annonces_moderation
   ORDER BY created_at DESC
   LIMIT 10;
   ```
2. Verify `sympa_command` shows correct list name

### Sync failing

1. **Check Edge Function logs:**
   ```bash
   npx supabase functions logs sympa-sync-subscriptions
   ```
2. Common issues:
   - Email sending not configured (RESEND_API_KEY)
   - From address not verified
   - Sympa list doesn't exist

## Key Files

- Migration: `supabase/migrations/20251008100000_sympa_category_lists.sql`
- Edge Function (moderation): `supabase/functions/sympa-moderate-message/index.ts`
- Edge Function (sync): `supabase/functions/sympa-sync-subscriptions/index.ts`
- Full Documentation: `SYMPA_ARCHITECTURE.md`

## Summary

✅ **3 lists** = category-based distribution
✅ **Existing `rezoprospec` list** = "general" category (MANDATORY for all members)
✅ **2 new lists** = "logement" and "ateliers" (OPTIONAL - members can unsubscribe)
✅ **Database tracks** member subscriptions
✅ **Background sync** keeps Sympa updated
✅ **Members control** what they receive (except "general" which is mandatory)
✅ **UI prevents** unchecking "general" category
✅ **Database constraint** enforces "general" is always present
