# Deployment Instructions - Batch Moderation

## ✅ Completed

1. **Edge Function Deployed** - `sympa-batch-moderate` is now live
   - URL: https://etoxvocwsktguoddmgcu.supabase.co/functions/v1/sympa-batch-moderate
   - Dashboard: https://supabase.com/dashboard/project/etoxvocwsktguoddmgcu/functions

## 🔧 Manual Steps Required

### Apply Database Migrations

The migrations couldn't be applied automatically due to conflicts with older migrations. You need to apply them manually via the Supabase Dashboard.

#### Steps:

1. **Open Supabase SQL Editor**
   - Go to: https://supabase.com/dashboard/project/etoxvocwsktguoddmgcu/sql/new

2. **Copy the SQL from the file:** `apply_batch_moderation_migrations.sql`

3. **Run the SQL** in the editor

4. **Verify the results:**
   - Check that new columns exist: `scheduled_send_at`, `sent_at`
   - Check that cron job was created (last query should return 1 row)

### What the SQL Does:

1. ✅ Adds `scheduled_send_at` column to `annonces_moderation`
2. ✅ Adds `sent_at` column to `annonces_moderation`
3. ✅ Creates indexes for efficient batch queries
4. ✅ Enables `pg_cron` extension
5. ✅ Creates cron job `sympa-batch-moderate-18h` (runs daily at 18:00)

---

## 🧪 Testing

Once migrations are applied, test the system:

### Quick Test

Run the test script:
```bash
./test_batch_moderation.sh
```

### Manual Test

1. **Moderate an annonce** via the UI
2. **Check the database** - scheduled_send_at should be set
3. **Check the UI** - Should show "Envoi à 18:00" chip
4. **Wait for 18h** OR manually trigger:
   ```bash
   curl -X POST https://etoxvocwsktguoddmgcu.supabase.co/functions/v1/sympa-batch-moderate \
     -H "Authorization: Bearer YOUR_ANON_KEY" \
     -H "Content-Type: application/json" \
     -d '{"trigger": "manual"}'
   ```
5. **Verify** - Check that `sent_at` is now set and email was sent

---

## 📊 Monitoring

### Check Cron Jobs

Via Supabase Dashboard SQL Editor:
```sql
SELECT jobid, jobname, schedule, active
FROM cron.job
WHERE jobname = 'sympa-batch-moderate-18h';
```

### Check Scheduled Annonces

```sql
SELECT id, status, scheduled_send_at, sent_at, synced_to_sympa
FROM annonces_moderation
WHERE scheduled_send_at IS NOT NULL
ORDER BY scheduled_send_at DESC
LIMIT 10;
```

### Check Cron History (if enabled)

```sql
SELECT * FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'sympa-batch-moderate-18h')
ORDER BY start_time DESC
LIMIT 10;
```

---

## 🔄 Rollback (if needed)

If you need to revert:

1. **Remove cron job:**
   ```sql
   SELECT cron.unschedule('sympa-batch-moderate-18h');
   ```

2. **Optionally remove columns** (not recommended - keep for data history):
   ```sql
   ALTER TABLE public.annonces_moderation
   DROP COLUMN IF EXISTS scheduled_send_at,
   DROP COLUMN IF EXISTS sent_at;
   ```

3. **Revert API code** to send immediately (see git history)

---

## 📝 Next Steps After Testing

1. Monitor first 18h run for any errors
2. Check email logs in Resend dashboard
3. Verify Sympa received and processed commands
4. Adjust schedule if needed (currently 18:00 UTC)

