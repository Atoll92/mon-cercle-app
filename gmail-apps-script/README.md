# Gmail Apps Script for Sympa Email Processing

This folder contains the Google Apps Script code for automatically processing Sympa moderation emails.

## 📁 Files

- **[processSympaEmails.gs](./processSympaEmails.gs)** - Main Apps Script code
- **[test-email-template.txt](./test-email-template.txt)** - Test email templates

## 🚀 Quick Start

1. **Create new Apps Script project** at [script.google.com](https://script.google.com)
2. **Copy the code** from `processSympaEmails.gs`
3. **Paste** into the Apps Script editor
4. **Update configuration** constants at the top:
   ```javascript
   const SUPABASE_WEBHOOK_URL = 'your-supabase-url/functions/v1/process-sympa-email';
   const SUPABASE_ANON_KEY = 'your-anon-key';
   ```
5. **Run** `setupTrigger` function to create the timer
6. **Done!** Script runs every 5 minutes automatically

## 📖 Full Documentation

- **Quick Start:** [../GMAIL_SYMPA_QUICKSTART.md](../GMAIL_SYMPA_QUICKSTART.md)
- **Detailed Setup:** [../GMAIL_SYMPA_SETUP.md](../GMAIL_SYMPA_SETUP.md)
- **Integration Guide:** [../SYMPA_INTEGRATION.md](../SYMPA_INTEGRATION.md)

## ✨ Features

✅ Automatic email monitoring (every 5 minutes)
✅ Intelligent email parsing
✅ Duplicate detection
✅ Error handling and notifications
✅ Auto-categorization
✅ Detailed logging

## 🧪 Testing

Use the built-in test functions:

```javascript
// Test with mock email
testWithMockEmail()

// Test with real email from inbox
testWithRealEmail()

// Manual processing
processSympaEmails()
```

## 🔧 Configuration Options

### Adjust Processing Frequency

Change trigger interval:
1. Apps Script → Triggers → Edit trigger
2. Change from "Every 5 minutes" to your preference
3. Save

### Adjust Batch Size

Edit this constant:
```javascript
const MAX_EMAILS_PER_RUN = 10; // Process max 10 emails per run
```

### Enable/Disable Error Emails

```javascript
const ADMIN_EMAIL = 'your-email@example.com'; // Or '' to disable
```

## 📊 Monitoring

### Check Execution Logs

1. Apps Script → **Executions** (list icon)
2. Click any execution to see detailed logs
3. Look for success/error messages

### Check Gmail Labels

- **Sympa-Moderation** - Incoming emails
- **Sympa-Processed** - Successfully processed
- **Sympa-Failed** - Failed to parse (needs review)

## 🐛 Troubleshooting

### Script Not Running

**Check:**
1. Trigger is created (clock icon → Triggers)
2. Script is authorized (run manually first)
3. No execution errors (Executions tab)

### Parsing Errors

**Check:**
1. Execution log for specific error
2. Email format matches expected pattern
3. Edge Function logs in Supabase

### Email Not Labeled

**Check:**
1. Gmail filter is created
2. Filter criteria matches email
3. Label name is exactly "Sympa-Moderation"

## 🔐 Security

- **Anon Key is safe** to use in Apps Script (it's designed for client-side use)
- Script only has **read access** to Gmail (via OAuth)
- No passwords or secrets are stored in the script
- All communication is over HTTPS

## 📈 Performance

- **1 second** per email average
- **10 emails/run** = 10 seconds
- **12 runs/hour** = 2 minutes/hour
- **24 hours** = 48 minutes/day (well within 90 min quota)

## 🔄 Updates

To update the script:

1. Edit code in Apps Script editor
2. Save
3. Changes take effect immediately on next trigger run

## 🗑️ Cleanup

To remove the integration:

1. Run `removeTriggers()` function
2. Delete the Apps Script project
3. Remove Gmail labels (optional)

## 🆘 Support

If you encounter issues:

1. Check execution logs for errors
2. Review test email templates
3. Verify configuration constants
4. Check full documentation
5. Contact support with error details

---

**Last Updated:** 2025-10-03
**Version:** 1.0.0
