# Activity Feed Debugging Guide

## Current Status
✅ Triggers are working - activities ARE being created in the database
✅ Migration is applied
❌ Activities not showing in UI for Boost Club network

## Debugging Steps

### Step 1: Run SQL Diagnostic
Run `test_boost_club_activity.sql` in Supabase SQL Editor while logged in as yourself.

This will tell us:
- If Boost Club has `activity_feed: true` in features_config
- If there are activities for Boost Club network
- If RLS is blocking access

### Step 2: Check Browser Console
1. Open Boost Club network dashboard
2. Open Browser DevTools (F12)
3. Go to Console tab
4. Look for errors related to:
   - `fetchNetworkActivity`
   - `activity_feed`
   - RLS policy errors

### Step 3: Verify Network ID
The ActivityFeedWidget uses `network.id` from context. Check:

```javascript
// In browser console on dashboard:
console.log('Current network:', window.__NETWORK_CONTEXT__);
```

Or add temporary logging to `src/components/ActivityFeedWidget.jsx`:
```javascript
const ActivityFeedWidget = () => {
  const { network } = useNetwork();

  console.log('ActivityFeedWidget network:', network);
  console.log('Network ID:', network?.id);
  console.log('Network name:', network?.name);
  console.log('Features:', network?.features_config);

  // ... rest of code
}
```

### Step 4: Check API Call
Add logging to `src/api/activityFeed.js`:

```javascript
export const fetchNetworkActivity = async (supabase, networkId, limit = 50) => {
  console.log('🔍 Fetching activity for network:', networkId);

  try {
    const { data, error } = await supabase
      .from('activity_feed')
      .select(...)
      .eq('network_id', networkId)
      .order('created_at', { ascending: false })
      .limit(limit);

    console.log('📊 Activity results:', { count: data?.length, error });
    console.log('📋 Activities:', data);

    if (error) throw error;
    return handleArrayError(data);
  } catch (error) {
    console.error('❌ Error fetching network activity:', error);
    return { error: error.message };
  }
};
```

## Common Issues

### Issue 1: Feature Not Enabled
**Symptom**: Widget doesn't render at all
**Solution**: Enable in Network Settings → Features & Modules → Activity Feed

### Issue 2: Wrong Network Context
**Symptom**: Widget shows "No activities yet" but activities exist
**Cause**: `network.id` doesn't match `activity_feed.network_id`
**Solution**: Check network context in browser console

### Issue 3: RLS Blocking Access
**Symptom**: API returns empty array or RLS error
**Cause**: User's profile not found in network
**Solution**: Run SQL query 2 & 6 from test_boost_club_activity.sql

### Issue 4: Triggers Not Installed
**Symptom**: New actions don't create activities
**Cause**: Migration not applied
**Solution**: Apply migration in Supabase SQL Editor

## SQL Queries to Run

### Quick Check 1: Do activities exist for my network?
```sql
SELECT COUNT(*), MAX(created_at)
FROM activity_feed
WHERE network_id = 'YOUR_NETWORK_ID_HERE';
```

### Quick Check 2: Can I access them with RLS?
```sql
-- Run while logged in
SELECT * FROM activity_feed
WHERE network_id = 'YOUR_NETWORK_ID_HERE'
ORDER BY created_at DESC
LIMIT 5;
```

### Quick Check 3: What's my network ID?
```sql
SELECT
  p.network_id,
  n.name,
  n.features_config->>'activity_feed' as enabled
FROM profiles p
JOIN networks n ON p.network_id = n.id
WHERE p.user_id = auth.uid();
```

## Expected Results

When working correctly, you should see:
1. ✅ Features config: `"activity_feed": true`
2. ✅ Activity records in database for your network
3. ✅ API call in console returns activities
4. ✅ Widget renders with activity list
5. ✅ Real-time updates when new activities occur

## Next Steps

After running the SQL diagnostic, we'll know exactly which of these is the issue:
- Feature flag (easiest fix)
- Network context mismatch
- RLS policy issue
- Trigger installation
