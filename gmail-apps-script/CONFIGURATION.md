# Gmail Apps Script Configuration

## 📋 Quick Copy-Paste Values

Use these values when setting up the Apps Script:

### Supabase Configuration

```javascript
// Edge Function URL
const SUPABASE_WEBHOOK_URL = 'https://etoxvocwsktguoddmgcu.supabase.co/functions/v1/process-sympa-email';

// Supabase Anon Key (safe for client-side use)
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0b3h2b2N3c2t0Z3VvZGRtZ2N1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQzNzI4NDEsImV4cCI6MjA1OTk0ODg0MX0.v4n_fZE09kg1qOK8J3mqxB166M22YJu5dr7Kr9YqOVk';
```

### Gmail Labels

```javascript
// Gmail label for incoming Sympa emails
const GMAIL_LABEL = 'Sympa-Moderation';

// Gmail label for successfully processed emails
const PROCESSED_LABEL = 'Sympa-Processed';

// Gmail label for failed emails (manual review needed)
const FAILED_LABEL = 'Sympa-Failed';
```

### Optional: Admin Notifications

```javascript
// Your email for error notifications (or leave empty to disable)
const ADMIN_EMAIL = ''; // Example: 'admin@example.com'
```

---

## 🔧 Full Configuration Template

Copy this entire block and paste it at the top of your Apps Script:

```javascript
// ============================================
// CONFIGURATION
// ============================================

const SUPABASE_WEBHOOK_URL = 'https://etoxvocwsktguoddmgcu.supabase.co/functions/v1/process-sympa-email';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0b3h2b2N3c2t0Z3VvZGRtZ2N1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQzNzI4NDEsImV4cCI6MjA1OTk0ODg0MX0.v4n_fZE09kg1qOK8J3mqxB166M22YJu5dr7Kr9YqOVk';

const GMAIL_LABEL = 'Sympa-Moderation';
const PROCESSED_LABEL = 'Sympa-Processed';
const FAILED_LABEL = 'Sympa-Failed';

const MAX_EMAILS_PER_RUN = 10;
const ADMIN_EMAIL = ''; // Optional: your email for error notifications
```

---

## ✅ Verification Checklist

After pasting the configuration:

- [ ] `SUPABASE_WEBHOOK_URL` matches your Supabase project URL
- [ ] `SUPABASE_ANON_KEY` is copied correctly (long JWT token)
- [ ] `GMAIL_LABEL` matches the label you created in Gmail
- [ ] `ADMIN_EMAIL` is set (optional) or left empty
- [ ] Saved the script (Ctrl/Cmd + S)

---

## 🧪 Test Configuration

Run this test to verify your configuration:

```javascript
function testConfiguration() {
  // Test 1: Verify labels exist
  const label = GmailApp.getUserLabelByName(GMAIL_LABEL);
  if (!label) {
    Logger.log('❌ GMAIL_LABEL not found. Create it in Gmail first.');
    return false;
  }
  Logger.log('✅ Gmail label found: ' + GMAIL_LABEL);

  // Test 2: Test Supabase connection
  const mockEmail = {
    from: 'test@example.com',
    subject: 'Test',
    body: 'AUTH test123 ADD rezoprospec test@example.com\nhttps://lists.riseup.net/www/ticket/123456',
    date: new Date().toISOString()
  };

  try {
    const options = {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + SUPABASE_ANON_KEY
      },
      payload: JSON.stringify(mockEmail),
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(SUPABASE_WEBHOOK_URL, options);
    const statusCode = response.getResponseCode();

    if (statusCode === 200 || statusCode === 400) {
      Logger.log('✅ Supabase connection successful');
      Logger.log('Response: ' + response.getContentText());
      return true;
    } else {
      Logger.log('❌ Supabase returned status: ' + statusCode);
      Logger.log('Response: ' + response.getContentText());
      return false;
    }
  } catch (error) {
    Logger.log('❌ Connection error: ' + error);
    return false;
  }
}
```

**How to run:**
1. Paste this function in your Apps Script
2. Select `testConfiguration` from the function dropdown
3. Click **Run** (▶️)
4. Check logs (Ctrl/Cmd + Enter)

---

## 🔐 Security Notes

### Is the Anon Key Safe to Use Here?

✅ **YES** - The Anon Key is designed for client-side use and is safe to include in:
- Web applications
- Mobile apps
- Apps Script (like this)

**Why it's safe:**
- Row Level Security (RLS) protects your data
- Key has limited permissions
- Cannot access sensitive operations
- Can be regenerated if compromised

### What NOT to Include

❌ **NEVER** include these in Apps Script:
- `SUPABASE_SERVICE_ROLE_KEY` (service role key)
- Database passwords
- Private API keys
- User passwords

---

## 🔄 Updating Configuration

If you need to change configuration later:

1. Open your Apps Script project at [script.google.com](https://script.google.com)
2. Update the values at the top
3. **Save** (Ctrl/Cmd + S)
4. Changes take effect on next trigger run (no redeployment needed)

---

## 📊 Advanced Configuration

### Adjust Processing Frequency

To process more/less frequently:

1. Go to **Triggers** (clock icon)
2. Click the three dots (⋮) on your trigger
3. Click **Edit**
4. Change interval (1, 5, 10, 15, or 30 minutes)
5. Save

### Adjust Batch Size

Process more emails per run:

```javascript
const MAX_EMAILS_PER_RUN = 20; // Default is 10
```

### Add Custom Filtering

Skip certain emails:

```javascript
// In processSympaEmails() function, add:
if (!message.getSubject().includes('rezoprospec')) {
  Logger.log('Skipping non-rezoprospec email');
  return;
}
```

---

## 🆘 Troubleshooting

### "Authorization required" error

**Solution:** Re-run the script manually and re-authorize:
1. Select function `processSympaEmails`
2. Click **Run**
3. Follow authorization prompts

### "Label not found" error

**Solution:** Create the label in Gmail:
1. Go to Gmail → Settings → Labels
2. Create new label: `Sympa-Moderation`
3. Run script again

### "Failed to fetch" error

**Solution:** Check Supabase URL and key:
1. Verify URL matches your project
2. Verify Anon Key is copied correctly
3. Run `testConfiguration()` function

---

## 📚 Related Documentation

- **[README.md](./README.md)** - Apps Script overview
- **[GMAIL_SYMPA_QUICKSTART.md](../GMAIL_SYMPA_QUICKSTART.md)** - Quick setup guide
- **[GMAIL_SYMPA_SETUP.md](../GMAIL_SYMPA_SETUP.md)** - Detailed setup guide

---

**Last Updated:** 2025-10-03
