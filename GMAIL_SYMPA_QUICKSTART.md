# Gmail + Sympa Integration - Quick Start

⏱️ **Setup time:** 15-20 minutes

This guide gets you up and running with automatic Sympa email processing using Gmail.

---

## ✅ Prerequisites Checklist

Before starting, make sure you have:

- [ ] Gmail account with Sympa moderation emails
- [ ] Supabase account with project created
- [ ] Edge Function deployed (`process-sympa-email`)
- [ ] Your Supabase Anon Key handy

---

## 🚀 Quick Setup (5 Steps)

### Step 1: Create Gmail Labels (2 minutes)

In Gmail, create these labels:
1. `Sympa-Moderation`
2. `Sympa-Processed`
3. `Sympa-Failed`

**How:** Settings → Labels → Create new label

---

### Step 2: Set Up Gmail Filter (2 minutes)

1. Gmail search box → Filter icon
2. **From:** `rezoprospec-request@lists.riseup.net`
3. **Subject:** `rezoprospec`
4. Create filter → Apply label: `Sympa-Moderation`

---

### Step 3: Create Apps Script (3 minutes)

1. Go to **[script.google.com](https://script.google.com)**
2. New Project → Name it "Sympa Email Processor"
3. Copy code from [`gmail-apps-script/processSympaEmails.gs`](./gmail-apps-script/processSympaEmails.gs)
4. Paste and **Save**

---

### Step 4: Configure Script (3 minutes)

Update these lines at the top of the script:

```javascript
const SUPABASE_WEBHOOK_URL = 'https://etoxvocwsktguoddmgcu.supabase.co/functions/v1/process-sympa-email';
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY_HERE'; // Get from Supabase Dashboard → Settings → API
const ADMIN_EMAIL = 'your-email@gmail.com'; // Optional
```

**Save again!**

---

### Step 5: Authorize & Set Up Trigger (5 minutes)

#### 5.1 Authorize the Script

1. Select function: `processSympaEmails`
2. Click **Run** (▶️)
3. Click **Review permissions** → **Advanced** → **Go to... (unsafe)**
4. Click **Allow**

#### 5.2 Create Trigger

**Easy method:**
1. Select function: `setupTrigger`
2. Click **Run** (▶️)
3. Done! ✅

**Manual method:**
1. Click clock icon → **+ Add Trigger**
2. Function: `processSympaEmails` | Time-driven | Minutes timer | Every 5 minutes
3. Save

---

## 🧪 Test It! (5 minutes)

### Quick Test with Mock Data

1. Select function: `testWithMockEmail`
2. Click **Run** (▶️)
3. Check logs: Should see "✅ Successfully processed"
4. **Verify in database:**
   ```sql
   SELECT * FROM annonces_moderation
   WHERE sympa_ticket_id = '35136367739771';
   ```

### Test with Real Email

1. Forward a Sympa email to your Gmail
2. Wait 5 minutes (or run `processSympaEmails` manually)
3. Check email: Should be marked **Read** with `Sympa-Processed` label
4. Check database for new entry

---

## 🎯 Configure Sympa (Final Step)

Update your Riseup Sympa list to send moderation emails to your Gmail:

1. Log into [lists.riseup.net](https://lists.riseup.net)
2. Your list → **Admin** → **List owners**
3. Change owner email to your Gmail
4. Save

**Alternative:** Set up email forwarding from current address to Gmail

---

## ✅ Success Checklist

You're done when:

- [ ] Gmail filter automatically labels Sympa emails
- [ ] Apps Script runs every 5 minutes (check Triggers tab)
- [ ] Test email appears in database
- [ ] Processed emails get marked as read with label
- [ ] You can see new annonces in admin panel

---

## 🔍 Monitoring

### Check Script Execution

- Go to [script.google.com](https://script.google.com)
- Open your project
- Click **Executions** (list icon) → See recent runs

### Check Gmail Labels

- `Sympa-Moderation` → New emails waiting to process
- `Sympa-Processed` → Successfully processed
- `Sympa-Failed` → Need manual review

### Check Database

```sql
-- Recent annonces
SELECT
  sender_name,
  subject,
  category,
  status,
  synced_to_sympa,
  created_at
FROM annonces_moderation
ORDER BY created_at DESC
LIMIT 10;

-- Processing stats
SELECT
  status,
  COUNT(*) as count
FROM annonces_moderation
GROUP BY status;
```

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| "Label not found" error | Create `Sympa-Moderation` label in Gmail |
| Script doesn't run | Check Triggers tab, ensure trigger is created |
| Emails not processing | Check Gmail filter, verify label is applied |
| Parse errors | Check execution log for details, may need to adjust parser |
| Nothing in database | Verify Supabase URL and Anon Key in script |

---

## 📚 Full Documentation

For detailed documentation, see:
- **[GMAIL_SYMPA_SETUP.md](./GMAIL_SYMPA_SETUP.md)** - Complete setup guide
- **[SYMPA_INTEGRATION.md](./SYMPA_INTEGRATION.md)** - Full integration docs
- **[test-email-template.txt](./gmail-apps-script/test-email-template.txt)** - Test email templates

---

## 🎉 You're Done!

Your Sympa emails will now automatically appear in your admin panel for moderation.

**Next steps:**
1. Monitor for a few days to ensure it's working
2. Adjust category keywords if needed
3. Add UsersModerationTab for subscription management

---

## 💡 Pro Tips

1. **Check logs weekly** - Apps Script → Executions
2. **Clean up test data** - Delete test annonces after testing
3. **Adjust trigger interval** - Change to 10-15 min if you receive few emails
4. **Set up error notifications** - Configure `ADMIN_EMAIL` to get alerts
5. **Backup your script** - Copy/paste code to a local file

---

**Need help?** Check the full documentation or contact support.

**Last Updated:** 2025-10-03
