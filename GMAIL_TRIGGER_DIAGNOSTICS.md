# Gmail Apps Script Trigger Diagnostics

## Issue: Script works with test data but not with real emails

When `testWithMockEmail()` works but the automatic trigger doesn't run, follow these steps:

---

## Step 1: Verify Trigger Exists

1. Go to [script.google.com](https://script.google.com)
2. Open your "Sympa Email Processor" project
3. Click the **clock icon** ⏰ (Triggers) in left sidebar
4. **Check if you see:**
   ```
   processSympaEmails | Time-driven | Minutes timer | Every 5 minutes
   ```

**If NO trigger exists:**
- Run the `setupTrigger()` function OR
- Manually create trigger (see [GMAIL_SYMPA_SETUP.md](./GMAIL_SYMPA_SETUP.md#42-create-time-based-trigger))

---

## Step 2: Check Execution Logs

1. In Apps Script, click **⚙️ Executions** (left sidebar)
2. Look for recent executions of `processSympaEmails`

**What to check:**
- ✅ **Success (green checkmark)** - Working correctly
- ⚠️ **Warning (yellow)** - Check logs for details
- ❌ **Error (red X)** - Click to see error message

**If NO executions appear:**
- Trigger isn't set up correctly
- Re-run `setupTrigger()` function

---

## Step 3: Check Email Criteria

The script ONLY processes emails that meet ALL these conditions:

### ✅ Required Conditions:
1. **Has label:** `Sympa-Moderation`
2. **Is UNREAD** (not marked as read)
3. **From:** `rezoprospec-request@lists.riseup.net`

### 🔍 How to Check:

**In Gmail:**
1. Search: `label:Sympa-Moderation is:unread`
2. **If you see emails** → Script should process them on next run
3. **If NO emails** → Either:
   - All emails already read (mark one as unread to test)
   - Gmail filter isn't working (check filter settings)
   - No new moderation emails received

---

## Step 4: Verify Configuration

Check your Apps Script configuration:

```javascript
// Line 24: Must be your actual Supabase URL
const SUPABASE_WEBHOOK_URL = 'https://etoxvocwsktguoddmgcu.supabase.co/functions/v1/process-sympa-email';

// Line 27: Must be your actual anon key (NOT "YOUR_SUPABASE_ANON_KEY_HERE")
const SUPABASE_ANON_KEY = 'eyJ...your-actual-key-here';

// Line 30: Must match your Gmail label name exactly
const GMAIL_LABEL = 'Sympa-Moderation';
```

**To verify:**
1. Open Apps Script editor
2. Check lines 24, 27, 30
3. Make sure `SUPABASE_ANON_KEY` is NOT the placeholder text

---

## Step 5: Force a Test Run

1. **Mark a real Sympa email as UNREAD:**
   - Find a Sympa moderation email in Gmail
   - Right-click → "Mark as unread"
   - Make sure it has `Sympa-Moderation` label

2. **Manually trigger the script:**
   - In Apps Script, select function: `processSympaEmails`
   - Click **Run** ▶️
   - Check **Execution log** below

3. **Expected log output:**
   ```
   🚀 Starting Sympa email processing...
   📧 Found 1 thread(s) to process
   📨 Processing: "Moderate"
   ✅ Successfully sent to webhook
   ✅ Processing complete: 1 success, 0 failed, 0 duplicates
   ```

---

## Step 6: Check Gmail Filter

Your Gmail filter must catch incoming emails:

**Filter criteria:**
- **From:** `rezoprospec-request@lists.riseup.net`
- **Subject:** `rezoprospec` (or leave empty to catch all)
- **Action:** Apply label `Sympa-Moderation`

**To verify:**
1. Gmail → Settings → Filters and Blocked Addresses
2. Find your Sympa filter
3. Check if "From" field matches `rezoprospec-request@lists.riseup.net`

**To test:**
- Forward yourself a Sympa email
- Check if it gets the `Sympa-Moderation` label automatically

---

## Common Issues & Solutions

### Issue 1: "Label not found"
**Log shows:** `❌ Label "Sympa-Moderation" not found`

**Solution:**
1. Create label in Gmail: Settings → Labels → Create new label
2. Name it exactly: `Sympa-Moderation` (case-sensitive)

---

### Issue 2: "No new Sympa emails to process"
**Log shows:** `✅ No new Sympa emails to process`

**This means:**
- No UNREAD emails with `Sympa-Moderation` label
- All emails already processed (and marked as read)

**Solution:**
- Mark an email as unread to test
- Wait for new moderation email from Sympa

---

### Issue 3: Script works with test but not real emails
**Possible causes:**
1. **Real emails are already READ** → Mark as unread
2. **Real emails don't have the label** → Check Gmail filter
3. **Trigger not set up** → Run `setupTrigger()`

**Solution:**
```
1. Find a real Sympa email in Gmail
2. Add label: Sympa-Moderation
3. Mark as: Unread
4. Run: processSympaEmails() manually
5. Check: Execution log
```

---

### Issue 4: Trigger exists but doesn't run
**Check:**
1. Trigger is enabled (not paused)
2. You're logged into the correct Google account
3. Script authorization is complete

**Solution:**
1. Delete existing trigger
2. Re-run `setupTrigger()` function
3. Re-authorize when prompted

---

## Quick Diagnostic Checklist

Run through this checklist:

- [ ] Trigger exists and is enabled
- [ ] SUPABASE_ANON_KEY is configured (not placeholder)
- [ ] Gmail label `Sympa-Moderation` exists
- [ ] Gmail filter is set up correctly (from `rezoprospec-request@lists.riseup.net`)
- [ ] At least one UNREAD email with `Sympa-Moderation` label exists
- [ ] Test function `testWithMockEmail()` works
- [ ] Manual run of `processSympaEmails()` works
- [ ] Execution logs show recent runs

---

## Testing Workflow

### Test 1: Manual Test with Mock Data
```javascript
// In Apps Script, run:
testWithMockEmail()

// Expected: ✅ Success message in log
```

### Test 2: Manual Test with Real Email
```javascript
// 1. Mark a real Sympa email as unread in Gmail
// 2. In Apps Script, run:
processSympaEmails()

// Expected:
// 📧 Found 1 thread(s) to process
// ✅ Successfully sent to webhook
```

### Test 3: Automatic Trigger Test
```javascript
// 1. Mark a real Sympa email as unread
// 2. Wait 5 minutes
// 3. Check Apps Script → Executions
// 4. Should see automatic execution of processSympaEmails()
```

---

## Still Not Working?

If all above checks pass but trigger still doesn't run:

1. **Check Google Apps Script quotas:**
   - Apps Script Dashboard → Quotas
   - Make sure you haven't hit daily limits

2. **Check authorization:**
   - Re-run `processSympaEmails()` manually
   - Re-authorize if prompted

3. **Recreate trigger:**
   ```javascript
   // Run these in order:
   removeTriggers()  // Remove all triggers
   setupTrigger()    // Create new trigger
   ```

4. **Check Edge Function logs:**
   - Supabase Dashboard → Edge Functions → process-sympa-email → Logs
   - See if webhook is receiving data

---

## Debug Commands

Add these temporary logging functions to debug:

```javascript
function debugEmailCheck() {
  const label = GmailApp.getUserLabelByName('Sympa-Moderation');
  const threads = label.getThreads(0, 10);

  Logger.log(`Total threads: ${threads.length}`);

  threads.forEach((thread, i) => {
    const messages = thread.getMessages();
    messages.forEach((msg, j) => {
      Logger.log(`Thread ${i}, Message ${j}:`);
      Logger.log(`  Subject: ${msg.getSubject()}`);
      Logger.log(`  From: ${msg.getFrom()}`);
      Logger.log(`  Unread: ${msg.isUnread()}`);
      Logger.log(`  Date: ${msg.getDate()}`);
    });
  });
}
```

**Run this to see exactly which emails the script sees.**

---

## Expected Behavior

**When working correctly:**

1. ⏰ Every 5 minutes, trigger fires
2. 📧 Script checks for unread `Sympa-Moderation` emails
3. 📨 Processes each email, sends to Supabase
4. ✅ Marks email as read, adds `Sympa-Processed` label
5. 📊 Creates entry in `annonces_moderation` table

**Check database:**
```sql
SELECT * FROM annonces_moderation
ORDER BY created_at DESC
LIMIT 5;
```

You should see new entries appearing automatically every 5 minutes when new Sympa emails arrive.

---

**Last Updated:** 2025-10-04
