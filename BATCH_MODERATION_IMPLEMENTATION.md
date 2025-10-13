# Batch Moderation Implementation

## Overview
Changed the annonces moderation system to **batch send** all approved/rejected moderation commands to Sympa at **18:00 daily**, instead of sending them immediately upon moderation.

## Changes Made

### 1. Database Migration (`20251013000000_add_batch_moderation_support.sql`)
Added two new columns to `annonces_moderation` table:
- `scheduled_send_at` - When the moderation command is scheduled to be sent (18h)
- `sent_at` - When the command was actually sent to Sympa

Added indexes for efficient batch processing queries.

### 2. API Changes (`src/api/annonces.js`)
**Modified `moderateAnnonceWithSympa()` function:**
- Now calculates the next 18h send time (today or tomorrow)
- Updates DB with `scheduled_send_at` instead of calling edge function immediately
- Returns scheduling information to the UI
- No longer invokes `sympa-moderate-message` edge function

**Key logic:**
```javascript
// If current time > 18h today → schedule for tomorrow 18h
// Otherwise → schedule for today 18h
const scheduledSendAt = now > today18h
  ? new Date(today18h.getTime() + 24 * 60 * 60 * 1000)
  : today18h;
```

### 3. New Edge Function (`sympa-batch-moderate/index.ts`)
Created new edge function to process batched moderations:

**What it does:**
1. Queries all annonces where:
   - `scheduled_send_at IS NOT NULL`
   - `sent_at IS NULL`
   - `status IN ('approved', 'rejected')`
   - `scheduled_send_at <= NOW()`

2. For each annonce:
   - Validates category and Sympa auth token
   - Builds Sympa command (`DISTRIBUTE` or `REJECT`)
   - Sends email via Resend API to `sympa@lists.riseup.net`
   - Updates DB: sets `sent_at`, `synced_to_sympa: true`

3. Returns summary:
   - Total processed
   - Successfully sent
   - Failed (with error details)

### 4. CRON Job (`20251013000001_add_batch_moderation_cron.sql`)
Added new pg_cron job:
- **Name:** `sympa-batch-moderate-18h`
- **Schedule:** `0 18 * * *` (daily at 18:00)
- **Action:** Triggers `sympa-batch-moderate` edge function via HTTP POST

### 5. UI Updates (`src/components/admin/AnnoncesModerationTab.jsx`)
Added visual indicators:
- **Schedule chip**: Shows "Envoi à 18:00" for pending sends
- **Sent chip**: Shows "Sympa ✓" only after actual send
- Updated tooltips with scheduled send date/time
- Console logs scheduling confirmation

## Flow Comparison

### Before (Immediate)
```
Admin clicks "Valider"
  → API updates DB status
  → API invokes sympa-moderate-message edge function
  → Edge function sends email to Sympa IMMEDIATELY
  → DB updated with synced_to_sympa: true
```

### After (Batched)
```
Admin clicks "Valider"
  → API updates DB with scheduled_send_at = next 18h
  → UI shows "Envoi à 18:00" chip
  → [Wait for 18h...]
  → CRON triggers sympa-batch-moderate
  → Batch function queries all pending sends
  → Sends all commands to Sympa
  → DB updated with sent_at and synced_to_sympa: true
```

## Testing Checklist

### Database
- [ ] Run migration: `supabase db push`
- [ ] Verify new columns exist: `scheduled_send_at`, `sent_at`
- [ ] Check cron job is created: `SELECT * FROM cron.job WHERE jobname = 'sympa-batch-moderate-18h';`

### Edge Function
- [ ] Deploy function: `supabase functions deploy sympa-batch-moderate`
- [ ] Test manually: Call function via HTTP POST
- [ ] Verify it processes scheduled annonces correctly
- [ ] Check error handling for missing Sympa data

### API & UI
- [ ] Moderate an annonce → Check `scheduled_send_at` is set
- [ ] Verify UI shows schedule chip
- [ ] Check time calculation (before/after 18h)
- [ ] Verify tooltip shows correct scheduling info

### End-to-End
- [ ] Moderate several annonces at different times
- [ ] Wait for 18h CRON trigger
- [ ] Verify emails sent to Sympa
- [ ] Check DB updated with `sent_at` and `synced_to_sympa: true`
- [ ] Verify UI now shows "Sympa ✓" instead of schedule chip

## Rollback Plan

If issues occur:
1. Revert API changes: Restore old `moderateAnnonceWithSympa` function
2. Delete CRON job: `SELECT cron.unschedule('sympa-batch-moderate-18h');`
3. Revert to immediate sending (old behavior)

## Notes

- **Timezone**: All times are in UTC. Frontend displays in user's local timezone.
- **Edge case**: If admin changes mind before 18h, re-moderating updates `scheduled_send_at`
- **Failed sends**: Edge function retries will be handled in future iteration
- **Manual trigger**: Can invoke edge function manually for testing via Supabase dashboard

## Related Files

- `/supabase/migrations/20251013000000_add_batch_moderation_support.sql`
- `/supabase/migrations/20251013000001_add_batch_moderation_cron.sql`
- `/supabase/functions/sympa-batch-moderate/index.ts`
- `/src/api/annonces.js`
- `/src/components/admin/AnnoncesModerationTab.jsx`

---

**Status:** ✅ Implementation complete - Ready for testing
**Date:** 2025-10-13
