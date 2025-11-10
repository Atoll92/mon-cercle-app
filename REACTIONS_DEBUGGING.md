# Reactions System Debugging Guide

## Problem: Reactions don't appear or work in SocialWallTab

### Step 1: Verify Database Migration

Run this in Supabase SQL Editor to check if reactions table exists:

```sql
-- Check if reactions table exists
SELECT EXISTS (
   SELECT FROM information_schema.tables
   WHERE table_schema = 'public'
   AND table_name = 'reactions'
) as reactions_table_exists;
```

**Expected result**: `true`

If `false`, the migration didn't run. Go to Supabase Dashboard → SQL Editor and run the entire contents of:
`supabase/migrations/20251106000000_reactions_system.sql`

### Step 2: Check if reaction_count columns exist

```sql
-- Check portfolio_items
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'portfolio_items' AND column_name = 'reaction_count';

-- Check network_news
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'network_news' AND column_name = 'reaction_count';
```

**Expected**: Both should return `reaction_count`

### Step 3: Test React Component Rendering

Open browser console (F12) and check for errors:

1. Navigate to a page with posts (Social Wall)
2. Look for any errors mentioning:
   - `ReactionBar`
   - `reactions`
   - `fetchReactionSummary`
   - `supabase`

### Step 4: Test Database Connection

In browser console, run:

```javascript
// Check if supabase is available
console.log('Supabase:', window.supabase || 'not found');

// Try fetching from reactions table
const testFetch = async () => {
  const { data, error } = await supabase
    .from('reactions')
    .select('*')
    .limit(1);
  console.log('Reactions fetch test:', { data, error });
};
testFetch();
```

### Step 5: Check RLS Policies

```sql
-- View RLS policies on reactions table
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'reactions';
```

**Expected**: Should see 4 policies:
- "Users can view reactions in their networks" (SELECT)
- "Users can add reactions in their networks" (INSERT)
- "Users can remove their own reactions" (DELETE)
- "Users can update their own reactions" (UPDATE)

### Step 6: Manual Test Insert

Try manually inserting a reaction:

```sql
-- Replace these UUIDs with real values from your database
INSERT INTO reactions (
  profile_id,
  network_id,
  content_type,
  content_id,
  emoji
) VALUES (
  'YOUR_PROFILE_ID',     -- Get from profiles table
  'YOUR_NETWORK_ID',      -- Get from networks table
  'post',
  'SOME_POST_ID',         -- Get from portfolio_items table
  '👍'
);

-- Then check if it was inserted
SELECT * FROM reactions;
```

### Step 7: Check Component Props

Add console.log to ReactionBar component to see if it's receiving correct props:

Edit `src/components/ReactionBar.jsx`, add at line 50 (after const definitions):

```javascript
console.log('ReactionBar props:', {
  contentType,
  contentId,
  profileId,
  networkId,
  initialCount
});
```

Then check browser console - you should see these logs when viewing posts.

### Step 8: Test API Functions Directly

In browser console:

```javascript
// Import API functions (if your bundler exposes them)
import { fetchReactionSummary, addReaction } from './api/reactions';

// Test fetching reactions for a post
const testPostId = 'SOME_POST_ID'; // Replace with real post ID
const result = await fetchReactionSummary(supabase, 'post', testPostId);
console.log('Reaction summary:', result);
```

### Common Issues & Solutions

#### Issue 1: "relation 'reactions' does not exist"
**Solution**: Migration not applied. Run migration manually in Supabase SQL Editor.

#### Issue 2: "permission denied for table reactions"
**Solution**: RLS policies not created or incorrect. Re-run the policy creation part of the migration.

#### Issue 3: Reactions don't appear but no errors
**Solution**:
- Check if `contentType` and `contentId` props are correct
- Check if `profileId` and `networkId` are defined
- Verify the component is actually rendering (use React DevTools)

#### Issue 4: Can't add reactions (no response)
**Solution**:
- Check browser network tab for failed API calls
- Verify `activeProfile` exists in React context
- Check if `networkId` is being passed correctly

#### Issue 5: Reactions appear but don't persist
**Solution**:
- Check if insert is succeeding (browser network tab)
- Verify trigger `trigger_update_reaction_count` exists:
  ```sql
  SELECT tgname FROM pg_trigger WHERE tgname = 'trigger_update_reaction_count';
  ```

### Quick Test Component

To quickly test if reactions work, add this to any page temporarily:

```jsx
import ReactionBar from './components/ReactionBar';

// In your component render:
<div style={{ padding: '20px', border: '2px solid red' }}>
  <h3>Reaction Test</h3>
  <ReactionBar
    contentType="post"
    contentId="PUT_REAL_POST_ID_HERE"
    initialCount={0}
    size="large"
  />
</div>
```

### Enable Verbose Logging

Edit `src/api/reactions.js` and add logging to each function:

```javascript
export const addReaction = async (supabase, profileId, networkId, contentType, contentId, emoji) => {
  console.log('addReaction called:', { profileId, networkId, contentType, contentId, emoji });
  try {
    const { data, error } = await supabase
      .from('reactions')
      .upsert({
        profile_id: profileId,
        network_id: networkId,
        content_type: contentType,
        content_id: contentId,
        emoji: emoji
      }, {
        onConflict: 'profile_id,content_type,content_id'
      })
      .select()
      .single();

    console.log('addReaction result:', { data, error });
    if (error) throw error;
    return handleObjectError(data);
  } catch (error) {
    console.error('addReaction error:', error);
    return { error: error.message };
  }
};
```

### Final Checklist

- [ ] `reactions` table exists in database
- [ ] `reaction_count` columns added to content tables
- [ ] RLS policies created and active
- [ ] ReactionBar component imports without errors
- [ ] ReactionBar renders on PostCard/NewsCard
- [ ] Browser console shows no React errors
- [ ] `activeProfile` has valid `id` and `network_id`
- [ ] API functions receive correct parameters
- [ ] Supabase client is properly initialized

### Still Not Working?

If you've checked all of the above and it still doesn't work:

1. Check browser console for ANY errors
2. Check browser Network tab for failed API calls
3. Check Supabase logs (Dashboard → Logs)
4. Try the ReactionTest component I created: `src/components/ReactionTest.jsx`
5. Share the specific error message you're seeing

### Contact Points

- Browser Console: F12 → Console tab
- Network Requests: F12 → Network tab → Filter by "reactions"
- React DevTools: Check if ReactionBar component is in the tree
- Supabase Logs: Dashboard → Logs → Filter by "reactions" table
