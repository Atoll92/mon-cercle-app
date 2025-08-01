# Notification System Cron Setup

## Overview
The notification system has been migrated from client-side processing to server-side using Supabase Edge Functions and cron jobs.

## Setup Instructions

### 1. Deploy the Edge Function
First, deploy the `process-notifications` edge function:

```bash
npx supabase functions deploy process-notifications
```

### 2. Run the Migration
Apply the database migration to set up indexes and logging:

```bash
npx supabase db push
```

### 3. Configure Cron Job in Supabase Dashboard

1. Go to your Supabase Dashboard
2. Navigate to **Edge Functions** → **Cron**
3. Click **Create a new cron job**
4. Configure as follows:
   - **Name**: `process-notifications`
   - **Schedule**: `*/1 * * * *` (every minute)
   - **Function**: `process-notifications`
   - **HTTP Method**: `POST`
   - **Headers**: 
     ```json
     {
       "Content-Type": "application/json",
       "Authorization": "Bearer [YOUR_SERVICE_ROLE_KEY]"
     }
     ```
   - **Body**:
     ```json
     {
       "trigger": "cron"
     }
     ```

### 4. Alternative: Using Supabase CLI (if supported)

```bash
npx supabase functions deploy process-notifications --schedule "*/1 * * * *"
```

## Monitoring

### View Processing Logs
```sql
-- Recent processing runs
SELECT * FROM notification_processing_log 
ORDER BY created_at DESC 
LIMIT 20;

-- Failed runs
SELECT * FROM notification_processing_log 
WHERE error_message IS NOT NULL 
ORDER BY created_at DESC;

-- Processing statistics
SELECT 
  DATE(created_at) as date,
  COUNT(*) as runs,
  SUM(notifications_processed) as total_processed,
  SUM(notifications_sent) as total_sent,
  SUM(notifications_failed) as total_failed
FROM notification_processing_log
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

### Manual Testing
You can manually trigger the processor for testing:

```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/process-notifications \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"trigger": "manual"}'
```

## Troubleshooting

### Common Issues

1. **Authentication Error**: Make sure you're using the service role key, not the anon key
2. **Function Not Found**: Ensure the function is deployed successfully
3. **No Notifications Processed**: Check that there are pending notifications in the queue
4. **Rate Limiting**: The function processes with 600ms delay between emails to respect Resend limits

### Debug Queries

```sql
-- Check pending notifications
SELECT COUNT(*) FROM notification_queue 
WHERE is_sent = false AND error_message IS NULL;

-- Check recent errors
SELECT * FROM notification_queue 
WHERE error_message IS NOT NULL 
ORDER BY updated_at DESC 
LIMIT 10;
```

## Security Notes

- The edge function requires authentication (service role key)
- Client-side access to notification_queue should be restricted via RLS
- Only the cron job and admin users should be able to trigger processing