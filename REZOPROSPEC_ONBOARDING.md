# RezoProSpec Member Onboarding Guide

## Overview

This guide explains how to onboard the 2000+ RezoProSpec members from the email dump to the Conclav platform with notification preferences management.

## System Architecture

### 3-Category System

RezoProSpec uses a simplified 3-category notification system:

1. **Général** - All general announcements (cours, matériel, échange, casting, dons, etc.)
2. **Logement** - Housing (locations, ventes, colocations)
3. **Ateliers** - Workshops and studio spaces

**Default**: All new members are automatically subscribed to all 3 categories.

### Database Schema

The system uses existing Supabase tables:

- **`profiles`**: Stores user profiles with `annonces_categories` JSONB field
- **`sympa_subscription_queue`**: Tracks subscription requests and Sympa sync status
- **`annonces_moderation`**: Stores announcements with category assignments

## Onboarding Process

### Step 1: Prepare Email List

The email dump is already in `list_dump.txt` (2000+ emails).

### Step 2: Run Database Migration

Apply the migration to set up the 3-category system:

```bash
# Migration already created at:
# supabase/migrations/20251008000000_rezoprospec_three_categories.sql

# Push to Supabase
npx supabase db push
```

This migration:
- Updates category constraints to use 3 categories
- Sets default categories for new profiles
- Migrates existing profiles to new category system
- Creates trigger to auto-initialize categories

### Step 3: Batch Invite Members

Use the existing BatchInviteModal component:

1. **Login as RezoProSpec Admin**
2. **Navigate to**: Network Admin Dashboard → Members Tab
3. **Click**: "Invite Members" button
4. **Upload**: `list_dump.txt` file OR paste emails directly
5. **Set Options**:
   - Role: `member` (NOT admin)
   - Send Email: ✅ (yes, send invitation emails)
6. **Click**: "Send Invites"

The system will:
- Create invitation links for each email
- Send email invitations via Supabase
- Track invitation status

### Step 4: Member First Login Flow

When members receive the invitation email:

1. **Click invitation link** → Redirects to Conclav signup page
2. **Set password** via Supabase Auth (first time only)
3. **Complete profile** (optional: name, photo)
4. **Automatically subscribed** to all 3 categories by default

### Step 5: Notification Preferences Management

Members can manage their subscriptions at any time:

1. **Navigate to**: Settings → Notifications
2. **See 3 categories**:
   - Général (blue) - General announcements
   - Logement (blue) - Housing
   - Ateliers (purple) - Workshops
3. **Toggle on/off** individual categories
4. **Changes sync** to `profiles.annonces_categories` automatically

## Sympa Integration

### Category Mapping

The 3 Conclav categories map to Sympa lists:

- `general` → `rezoprospec-general@lists.riseup.net`
- `logement` → `rezoprospec-logement@lists.riseup.net`
- `ateliers` → `rezoprospec-ateliers@lists.riseup.net`

### Sync Process

When users update preferences:

1. **Frontend**: User toggles category in NotificationSettings
2. **API Call**: `updateSympaCategories(profileId, categories)`
3. **Database Update**: Updates `profiles.annonces_categories`
4. **Sympa Sync**: Edge Function syncs to Sympa lists (if configured)

## Admin Annonce Moderation

Admins can post announcements via the moderation interface:

1. **Navigate to**: Network Admin Dashboard → Annonces Tab
2. **View pending** announcements from Sympa email hook
3. **Assign category**:
   - Général (for general announcements)
   - Logement (for housing)
   - Ateliers (for workshops)
4. **Approve/Reject** → Syncs to Sympa

Only members subscribed to that category will receive the email.

## Technical Details

### Default Category Assignment

New RezoProSpec members automatically get all 3 categories via database trigger:

```sql
CREATE TRIGGER set_rezoprospec_categories
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION init_rezoprospec_member_categories();
```

### Category Validation

Frontend validates categories in:
- `src/components/NotificationSettings.jsx` - User preferences UI
- `src/components/admin/AnnoncesModerationTab.jsx` - Admin moderation UI
- `src/api/sympaSync.js` - API layer for category updates

### Migration Path

Existing 8-category data is automatically migrated:

```sql
-- Old → New mapping
'immobilier' → 'logement'
'ateliers' → 'ateliers'
all others → 'general'
```

## Testing Checklist

Before launching:

- [ ] Run migration on staging database
- [ ] Test batch invite with 5-10 test emails
- [ ] Verify default category assignment for new members
- [ ] Test notification preferences UI (toggle categories)
- [ ] Test annonce moderation with 3 categories
- [ ] Verify Sympa sync (if configured)
- [ ] Test email invitation delivery
- [ ] Test first-login password setup flow

## Monitoring

### Check Member Subscriptions

```sql
-- View all RezoProSpec members and their categories
SELECT
  p.full_name,
  p.contact_email,
  p.annonces_categories,
  p.created_at
FROM profiles p
WHERE p.network_id = 'b4e51e21-de8f-4f5b-b35d-f98f6df27508'
ORDER BY p.created_at DESC;
```

### Check Invitation Status

```sql
-- View invitation link usage
SELECT
  email,
  used,
  created_at,
  used_at
FROM network_invitation_links
WHERE network_id = 'b4e51e21-de8f-4f5b-b35d-f98f6df27508'
ORDER BY created_at DESC;
```

### Category Distribution

```sql
-- See how many users subscribed to each category
SELECT
  CASE
    WHEN annonces_categories @> '["general"]' THEN 'general'
    WHEN annonces_categories @> '["logement"]' THEN 'logement'
    WHEN annonces_categories @> '["ateliers"]' THEN 'ateliers'
  END as category,
  COUNT(*) as subscriber_count
FROM profiles
WHERE network_id = 'b4e51e21-de8f-4f5b-b35d-f98f6df27508'
GROUP BY category;
```

## Troubleshooting

### Issue: Members not receiving invitations

**Solution**: Check email configuration in Supabase Auth settings:
- Verify SMTP settings
- Check email templates are enabled
- Confirm sender email is verified

### Issue: Categories not saving

**Solution**: Check browser console for errors:
```javascript
// In browser console
localStorage.getItem('supabase.auth.token')
// Verify user is authenticated
```

### Issue: Sympa sync not working

**Solution**: Check Edge Function logs:
```bash
npx supabase functions logs sympa-moderate-message
```

## Support

For issues or questions:
- Check logs in Supabase Dashboard
- Review Edge Function logs
- Contact: [arthur@structure-void.com](mailto:arthur@structure-void.com)

## Next Steps

After successful onboarding:

1. Monitor invitation acceptance rate
2. Gather feedback on notification preferences
3. Adjust categories based on member needs
4. Consider adding more granular categories if requested
5. Set up analytics for engagement tracking
