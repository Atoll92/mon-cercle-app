# Gmail + Sympa Integration Setup Guide

This guide explains how to set up automatic email parsing for Sympa moderation emails using Gmail and Google Apps Script.

## 📋 Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Step 1: Configure Gmail](#step-1-configure-gmail)
- [Step 2: Set Up Google Apps Script](#step-2-set-up-google-apps-script)
- [Step 3: Configure the Script](#step-3-configure-the-script)
- [Step 4: Set Up Trigger](#step-4-set-up-trigger)
- [Step 5: Test the Integration](#step-5-test-the-integration)
- [Step 6: Configure Sympa Forwarding](#step-6-configure-sympa-forwarding)
- [Monitoring and Troubleshooting](#monitoring-and-troubleshooting)
- [FAQ](#faq)

---

## Overview

This integration automatically:
1. **Receives** Sympa moderation emails in your Gmail inbox
2. **Parses** them using Google Apps Script (runs every 5 minutes)
3. **Sends** parsed data to Supabase Edge Function
4. **Creates** annonce entries in your database for admin moderation

**Architecture:**
```
Sympa Email → Gmail Inbox → Apps Script (every 5 min) → Edge Function → Database
```

---

## Prerequisites

✅ Gmail account with access to Sympa moderation emails
✅ Google Apps Script access (free with any Gmail account)
✅ Supabase project with Edge Function deployed
✅ Admin access to Riseup Sympa list

---

## Step 1: Configure Gmail

### 1.1 Create Gmail Labels

1. Open Gmail
2. Click the **gear icon** → **See all settings** → **Labels** tab
3. Create three new labels:
   - `Sympa-Moderation` (for incoming Sympa emails)
   - `Sympa-Processed` (for successfully processed emails)
   - `Sympa-Failed` (for emails that failed to parse)

### 1.2 Create Gmail Filter

1. In Gmail, click the **search box** at top
2. Click the **filter icon** (⚙️) on the right
3. **Filter criteria:**
   - **From:** `rezoprospec-request@lists.riseup.net`
   - **Subject:** `rezoprospec` (or your list name)
4. Click **Create filter**
5. **Filter actions:**
   - ✅ Apply label: `Sympa-Moderation`
   - ✅ Never send to spam
   - ✅ Always mark as important (optional)
6. Click **Create filter**

### 1.3 Test the Filter

Send a test email to yourself from `sympa@lists.riseup.net` or forward a real Sympa email. Verify it gets the `Sympa-Moderation` label.

---

## Step 2: Set Up Google Apps Script

### 2.1 Create New Apps Script Project

1. Go to **[script.google.com](https://script.google.com)**
2. Click **+ New Project**
3. **Rename the project:** Click "Untitled project" → Name it "Sympa Email Processor"

### 2.2 Copy the Script Code

1. Open the Apps Script file: [`gmail-apps-script/processSympaEmails.gs`](./gmail-apps-script/processSympaEmails.gs)
2. **Copy all the code**
3. **Paste it** into the Apps Script editor (replace the default `function myFunction()`)
4. Click **Save** (disk icon or Ctrl/Cmd+S)

---

## Step 3: Configure the Script

### 3.1 Update Configuration Constants

At the top of the script, update these values:

```javascript
// Your Supabase Edge Function URL
const SUPABASE_WEBHOOK_URL = 'https://etoxvocwsktguoddmgcu.supabase.co/functions/v1/process-sympa-email';

// Your Supabase Anon Key (find in Supabase Dashboard → Settings → API)
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY_HERE';

// Optional: Admin email for error notifications
const ADMIN_EMAIL = 'your-email@example.com'; // or leave empty ''
```

**Where to find your Supabase Anon Key:**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Click **Settings** (gear icon) → **API**
4. Copy the `anon` `public` key

### 3.2 Save the Script

Click **Save** again after updating the configuration.

---

## Step 4: Set Up Trigger

### 4.1 Authorize the Script

1. In Apps Script editor, click **Run** (▶️ icon) at the top
2. Select the function: **`processSympaEmails`**
3. Click **Run**
4. **Authorization prompt will appear:**
   - Click **Review permissions**
   - Choose your Gmail account
   - Click **Advanced** → **Go to Sympa Email Processor (unsafe)**
   - Click **Allow**

**Why "unsafe"?** Google marks all custom scripts as "unsafe" because they're not officially verified. This is YOUR script, so it's safe.

### 4.2 Create Time-Based Trigger

**Option A: Use the helper function (Recommended)**

1. Select function: **`setupTrigger`**
2. Click **Run** (▶️)
3. Check execution log: "✅ Trigger created successfully"

**Option B: Manual setup**

1. Click the **clock icon** (Triggers) in the left sidebar
2. Click **+ Add Trigger** (bottom right)
3. Configure:
   - **Function:** `processSympaEmails`
   - **Event source:** Time-driven
   - **Type:** Minutes timer
   - **Interval:** Every 5 minutes
4. Click **Save**

### 4.3 Verify Trigger

Go to **Triggers** tab (clock icon), you should see:
```
processSympaEmails | Time-driven | Minutes timer | Every 5 minutes
```

---

## Step 5: Test the Integration

### 5.1 Test with Mock Email (Quick Test)

1. In Apps Script editor, select function: **`testWithMockEmail`**
2. Click **Run** (▶️)
3. Check **Execution log** (Ctrl/Cmd+Enter):
   ```
   🧪 Testing with mock email...
   Mock email: {...}
   Response: { success: true, annonceId: "..." }
   ```

4. **Verify in Supabase:**
   ```sql
   SELECT * FROM annonces_moderation
   WHERE sympa_ticket_id = '35136367739771';
   ```

### 5.2 Test with Real Email

**Prerequisite:** Have at least one Sympa email in your Gmail with the `Sympa-Moderation` label.

1. Select function: **`testWithRealEmail`**
2. Click **Run** (▶️)
3. Check execution log for success/failure
4. Check Supabase database for new entry

### 5.3 Test Automatic Processing

1. Forward a Sympa moderation email to your Gmail
2. **Wait 5 minutes** (for trigger to run)
3. Check the email:
   - Should be marked as **Read**
   - Should have **`Sympa-Processed`** label
4. Check Supabase database for new entry

---

## Step 6: Configure Sympa Forwarding

Now that the integration works, configure Sympa to send moderation emails to your Gmail:

### Option A: Update List Owner Email

1. Log into Riseup Sympa: [lists.riseup.net](https://lists.riseup.net)
2. Go to your list (rezoprospec)
3. Click **Admin** → **List owners**
4. Update owner email to your Gmail address
5. Save

### Option B: Email Forwarding

If you can't change the owner email:

1. Set up email forwarding from your current moderator email to Gmail
2. Update Gmail filter to catch forwarded emails

---

## Monitoring and Troubleshooting

### Monitor Script Execution

1. Go to [script.google.com](https://script.google.com)
2. Open your project
3. Click **clock icon** (Triggers)
4. See recent executions and any failures

### Check Execution Logs

1. In Apps Script, click **Executions** (list icon) in left sidebar
2. Click any execution to see detailed logs
3. Look for:
   - ✅ **Success:** "Successfully processed, Annonce ID: ..."
   - ⚠️ **Duplicate:** "Duplicate ticket, skipping"
   - ❌ **Failed:** Error message with details

### Common Issues

#### Issue 1: "Label not found"
**Solution:** Create the `Sympa-Moderation` label in Gmail

#### Issue 2: "Authorization required"
**Solution:** Re-run the script manually and re-authorize

#### Issue 3: Emails not processing
**Solutions:**
- Check Gmail filter is working (emails should get labeled)
- Check trigger is active (clock icon → Triggers)
- Check execution logs for errors
- Verify Supabase Edge Function is deployed

#### Issue 4: Parse errors
**Symptoms:** Emails get `Sympa-Failed` label

**Solutions:**
- Check execution log for specific error
- Email format may be different than expected
- Update parser in Edge Function if needed
- Contact support with failed email example

### Email Notification on Errors

If you configured `ADMIN_EMAIL`, you'll receive emails when:
- Parsing fails
- Edge Function returns an error
- Fatal script error occurs

### Manual Reprocessing

If an email failed to process:

1. Remove the `Sympa-Processed` or `Sympa-Failed` label
2. Mark the email as **Unread**
3. Wait for next trigger run (or run `processSympaEmails` manually)

---

## Performance & Quotas

### Google Apps Script Quotas

**Free tier limits:**
- **Trigger runtime:** 90 minutes/day total
- **UrlFetch calls:** 20,000/day
- **Email sends:** 100/day (for error notifications)

**Our usage:**
- ~1 second per email
- If processing 10 emails every 5 minutes = 12 min/day (well within limit)

### Optimization Tips

1. **Adjust `MAX_EMAILS_PER_RUN`** if you receive many emails
2. **Increase trigger interval** to 10 or 15 minutes if needed
3. **Use batch processing** if you receive > 50 emails/day

---

## Advanced Configuration

### Custom Category Keywords

Edit the `autoCategorize()` function in the Edge Function to add/modify keywords:

```typescript
// In supabase/functions/process-sympa-email/index.ts

function autoCategorize(text: string): string | null {
  const lowerText = text.toLowerCase()

  // Add your custom keywords
  if (/\b(your|custom|keywords)\b/i.test(lowerText)) {
    return 'your-category'
  }

  // ... rest of categories
}
```

### Multi-Language Support

The parser supports both French and English Sympa emails:
- French: "De:", "Objet:", "Message:"
- English: "From:", "Subject:", "Message:"

To add more languages, update the regex patterns in `parseSympaEmail()`.

### Custom Email Processing Logic

Edit `gmail-apps-script/processSympaEmails.gs` to add custom logic:

```javascript
// Example: Skip emails older than 7 days
if (message.getDate() < new Date(Date.now() - 7*24*60*60*1000)) {
  Logger.log('Skipping old email');
  return;
}

// Example: Only process emails with specific subject
if (!message.getSubject().includes('rezoprospec')) {
  Logger.log('Skipping non-rezoprospec email');
  return;
}
```

---

## FAQ

### Q: How often does the script run?
**A:** Every 5 minutes by default. You can change this in the trigger settings.

### Q: Can I run it more frequently?
**A:** Yes, but be mindful of Google's quotas. Every 1 minute is the minimum interval.

### Q: What happens if the same email is processed twice?
**A:** The Edge Function checks for duplicate `sympa_ticket_id` and skips them.

### Q: Can I use multiple Gmail accounts?
**A:** Yes! Set up the Apps Script in each account, all pointing to the same Edge Function.

### Q: How do I stop the automation?
**A:** Run the `removeTriggers()` function or manually delete the trigger from the Triggers tab.

### Q: Does this cost money?
**A:** No! Both Gmail and Google Apps Script are free. Supabase Edge Functions are also free (up to 500K invocations/month).

### Q: What if my Gmail is hacked?
**A:** The script only reads emails and sends data to YOUR Supabase. The attacker would need both your Gmail AND your Supabase keys to cause damage. Still, use strong passwords and 2FA.

### Q: Can I see what emails were processed?
**A:** Yes! Check emails with the `Sympa-Processed` label in Gmail, or query your database.

---

## Support

If you encounter issues:

1. **Check execution logs** in Apps Script
2. **Check Edge Function logs** in Supabase Dashboard
3. **Review this documentation** for troubleshooting steps
4. **Contact support** with:
   - Error message from logs
   - Example email (with sensitive info redacted)
   - Steps you've already tried

---

## Next Steps

✅ Integration is working!

Now you can:
1. **Test moderation workflow:** Approve/reject annonces in admin panel
2. **Monitor for a week:** Ensure all emails are captured
3. **Adjust categories:** Update auto-categorization keywords
4. **Add UsersModerationTab:** To approve subscription requests

---

**Last Updated:** 2025-10-03
**Version:** 1.0.0
