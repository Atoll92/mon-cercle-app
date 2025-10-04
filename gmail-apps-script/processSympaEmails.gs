/**
 * Gmail Apps Script for Sympa Email Processing
 *
 * This script monitors your Gmail inbox for Sympa moderation emails,
 * parses them, and sends them to your Supabase Edge Function for processing.
 *
 * Setup Instructions:
 * 1. Go to https://script.google.com
 * 2. Create a new project
 * 3. Copy this code into the script editor
 * 4. Update the configuration constants below
 * 5. Save and authorize the script
 * 6. Set up a time-based trigger (every 5 minutes)
 *
 * Author: Claude AI
 * Date: 2025-10-03
 */

// ============================================
// CONFIGURATION - UPDATE THESE VALUES
// ============================================

// Your Supabase project URL and Edge Function endpoint
const SUPABASE_WEBHOOK_URL = 'https://etoxvocwsktguoddmgcu.supabase.co/functions/v1/process-sympa-email';

// Your Supabase Anon Key (safe to use in Apps Script)
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY_HERE';

// Gmail label for Sympa moderation emails
const GMAIL_LABEL = 'Sympa-Moderation';

// Gmail label for processed emails
const PROCESSED_LABEL = 'Sympa-Processed';

// Gmail label for failed processing
const FAILED_LABEL = 'Sympa-Failed';

// Maximum number of emails to process per run (to avoid timeout)
const MAX_EMAILS_PER_RUN = 10;

// Admin email for error notifications (optional)
const ADMIN_EMAIL = ''; // Leave empty to disable error emails

// ============================================
// MAIN PROCESSING FUNCTION
// ============================================

/**
 * Main function to process Sympa moderation emails
 * This function is called by the time-based trigger
 */
function processSympaEmails() {
  Logger.log('🚀 Starting Sympa email processing...');

  try {
    // Get or create labels
    const label = GmailApp.getUserLabelByName(GMAIL_LABEL);
    if (!label) {
      Logger.log(`❌ Label "${GMAIL_LABEL}" not found. Please create it first.`);
      return;
    }

    const processedLabel = getOrCreateLabel(PROCESSED_LABEL);
    const failedLabel = getOrCreateLabel(FAILED_LABEL);

    // Get threads with Sympa-Moderation label
    const threads = label.getThreads(0, MAX_EMAILS_PER_RUN);

    if (threads.length === 0) {
      Logger.log('✅ No new Sympa emails to process');
      return;
    }

    Logger.log(`📧 Found ${threads.length} thread(s) with ${GMAIL_LABEL} label`);

    let successCount = 0;
    let failCount = 0;
    let duplicateCount = 0;

    // Process each thread
    threads.forEach(thread => {
      const messages = thread.getMessages();

      messages.forEach(message => {
        // Skip messages that already have Sympa-Processed or Sympa-Failed label
        const labels = message.getThread().getLabels().map(l => l.getName());
        Logger.log(`📋 Message "${message.getSubject()}" has labels: ${labels.join(', ')}`);

        if (labels.includes(PROCESSED_LABEL) || labels.includes(FAILED_LABEL)) {
          Logger.log(`⏭️ Skipping already processed message: "${message.getSubject()}"`);
          return;
        }

        try {
          Logger.log(`\n📨 Processing: "${message.getSubject()}"`);

          // Extract actual subject from raw MIME content (forwarded message has the real subject)
          const rawContent = message.getRawContent();
          let actualSubject = '';

          // Extract ALL Subject: lines (including continuation lines with leading whitespace)
          const subjectMatch = rawContent.match(/Subject:\s*([^\r\n]+(?:\r?\n[ \t][^\r\n]+)*)/gi);
          if (subjectMatch && subjectMatch.length > 1) {
            // Take the LAST subject (from forwarded message)
            actualSubject = subjectMatch[subjectMatch.length - 1]
              .replace(/^Subject:\s*/i, '')
              .replace(/\r?\n[ \t]+/g, ' ')  // Join continuation lines
              .trim();

            Logger.log('📧 Raw extracted subject:', actualSubject);

            // Decode MIME encoded subjects (=?UTF-8?Q?...?= or =?UTF-8?B?...?=)
            if (actualSubject.includes('=?')) {
              actualSubject = actualSubject.replace(/=\?([^?]+)\?([QB])\?([^?]+)\?=/gi, (match, charset, encoding, encoded) => {
                try {
                  if (encoding.toUpperCase() === 'Q') {
                    // Quoted-printable
                    return encoded.replace(/_/g, ' ').replace(/=([0-9A-F]{2})/gi, (m, hex) =>
                      String.fromCharCode(parseInt(hex, 16))
                    );
                  } else if (encoding.toUpperCase() === 'B') {
                    // Base64
                    const bytes = Utilities.base64Decode(encoded);
                    return Utilities.newBlob(bytes).getDataAsString('UTF-8');
                  }
                } catch (e) {
                  Logger.log('⚠️ MIME decode error:', e);
                  return match;  // Return original if decode fails
                }
                return match;
              });
            }

            Logger.log('✅ Extracted actual subject:', actualSubject);
          }

          const emailData = {
            from: message.getFrom(),
            to: message.getTo(),
            subject: actualSubject || message.getSubject(),
            date: message.getDate().toISOString(),
            body: message.getPlainBody(),
            html: message.getBody()
          };

          // Send to Supabase Edge Function
          const response = sendToSupabase(emailData);

          if (response.success) {
            if (response.duplicate) {
              Logger.log(`⚠️ Duplicate ticket, skipping`);
              duplicateCount++;
            } else {
              Logger.log(`✅ Successfully processed, Annonce ID: ${response.annonceId}`);
              successCount++;
            }

            // Mark as processed
            message.markRead();
            thread.addLabel(processedLabel);
          } else {
            Logger.log(`❌ Failed: ${response.error}`);
            failCount++;

            // Mark as failed for manual review
            thread.addLabel(failedLabel);

            // Send error notification if configured
            if (ADMIN_EMAIL) {
              sendErrorNotification(message, response.error);
            }
          }

        } catch (error) {
          Logger.log(`❌ Error processing message: ${error}`);
          failCount++;
          thread.addLabel(failedLabel);

          if (ADMIN_EMAIL) {
            sendErrorNotification(message, error.toString());
          }
        }
      });
    });

    // Log summary
    Logger.log(`\n📊 Processing Summary:`);
    Logger.log(`   ✅ Success: ${successCount}`);
    Logger.log(`   ⚠️  Duplicates: ${duplicateCount}`);
    Logger.log(`   ❌ Failed: ${failCount}`);
    Logger.log(`   📧 Total: ${successCount + duplicateCount + failCount}`);

  } catch (error) {
    Logger.log(`❌ Fatal error: ${error}`);

    if (ADMIN_EMAIL) {
      MailApp.sendEmail({
        to: ADMIN_EMAIL,
        subject: '❌ Sympa Email Processing Failed',
        body: `Fatal error in processSympaEmails:\n\n${error}\n\nStack trace:\n${error.stack || 'N/A'}`
      });
    }
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Send email data to Supabase Edge Function
 */
function sendToSupabase(emailData) {
  try {
    const options = {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      payload: JSON.stringify(emailData),
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(SUPABASE_WEBHOOK_URL, options);
    const statusCode = response.getResponseCode();
    const responseText = response.getContentText();

    Logger.log(`   Response status: ${statusCode}`);

    if (statusCode === 200) {
      return JSON.parse(responseText);
    } else {
      const errorData = JSON.parse(responseText);
      return {
        success: false,
        error: errorData.error || `HTTP ${statusCode}`
      };
    }

  } catch (error) {
    Logger.log(`   ❌ HTTP Error: ${error}`);
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * Get existing label or create if it doesn't exist
 */
function getOrCreateLabel(labelName) {
  let label = GmailApp.getUserLabelByName(labelName);
  if (!label) {
    Logger.log(`Creating label: ${labelName}`);
    label = GmailApp.createLabel(labelName);
  }
  return label;
}

/**
 * Send error notification email to admin
 */
function sendErrorNotification(message, error) {
  try {
    MailApp.sendEmail({
      to: ADMIN_EMAIL,
      subject: '⚠️ Sympa Email Parse Failed',
      body: `Failed to process Sympa email:\n\nSubject: ${message.getSubject()}\nFrom: ${message.getFrom()}\nDate: ${message.getDate()}\n\nError: ${error}\n\nPlease review the email manually in Gmail (label: ${FAILED_LABEL})`
    });
  } catch (e) {
    Logger.log(`Failed to send error notification: ${e}`);
  }
}

// ============================================
// TRIGGER SETUP FUNCTION
// ============================================

/**
 * One-time function to set up the time-based trigger
 * Run this manually once to create the trigger
 */
function setupTrigger() {
  // Delete existing triggers to avoid duplicates
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'processSympaEmails') {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  // Create new trigger to run every 5 minutes
  ScriptApp.newTrigger('processSympaEmails')
    .timeBased()
    .everyMinutes(5)
    .create();

  Logger.log('✅ Trigger created successfully');
  Logger.log('The script will now run every 5 minutes automatically');
}

/**
 * Function to remove all triggers (for cleanup)
 */
function removeTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'processSympaEmails') {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  Logger.log('✅ All triggers removed');
}

// ============================================
// TEST FUNCTIONS
// ============================================

/**
 * Test function to manually process a single email
 * Use this to test with a real Sympa email in your inbox
 */
function testWithRealEmail() {
  Logger.log('🧪 Testing with real email...');

  const label = GmailApp.getUserLabelByName(GMAIL_LABEL);
  if (!label) {
    Logger.log(`❌ Label "${GMAIL_LABEL}" not found`);
    return;
  }

  const threads = label.getThreads(0, 1);
  if (threads.length === 0) {
    Logger.log('❌ No emails found with label');
    return;
  }

  const message = threads[0].getMessages()[0];
  Logger.log(`Testing with: "${message.getSubject()}"`);

  // Extract actual subject from raw MIME content
  const rawContent = message.getRawContent();
  let actualSubject = '';

  // Extract ALL Subject: lines (including continuation lines with leading whitespace)
  const subjectMatch = rawContent.match(/Subject:\s*([^\r\n]+(?:\r?\n[ \t][^\r\n]+)*)/gi);
  if (subjectMatch && subjectMatch.length > 1) {
    // Take the LAST subject (from forwarded message)
    actualSubject = subjectMatch[subjectMatch.length - 1]
      .replace(/^Subject:\s*/i, '')
      .replace(/\r?\n[ \t]+/g, ' ')  // Join continuation lines
      .trim();

    Logger.log('📧 Raw extracted subject:', actualSubject);

    // Decode MIME encoded subjects (=?UTF-8?Q?...?= or =?UTF-8?B?...?=)
    if (actualSubject.includes('=?')) {
      actualSubject = actualSubject.replace(/=\?([^?]+)\?([QB])\?([^?]+)\?=/gi, (match, charset, encoding, encoded) => {
        try {
          if (encoding.toUpperCase() === 'Q') {
            // Quoted-printable
            return encoded.replace(/_/g, ' ').replace(/=([0-9A-F]{2})/gi, (m, hex) =>
              String.fromCharCode(parseInt(hex, 16))
            );
          } else if (encoding.toUpperCase() === 'B') {
            // Base64
            const bytes = Utilities.base64Decode(encoded);
            return Utilities.newBlob(bytes).getDataAsString('UTF-8');
          }
        } catch (e) {
          Logger.log('⚠️ MIME decode error:', e);
          return match;  // Return original if decode fails
        }
        return match;
      });
    }

    Logger.log('✅ Extracted actual subject from raw MIME:', actualSubject);
  } else {
    Logger.log('❌ Could not find multiple Subject: lines in raw content');
    Logger.log('Subject matches found:', subjectMatch ? subjectMatch.length : 0);
  }

  const emailData = {
    from: message.getFrom(),
    to: message.getTo(),
    subject: actualSubject || message.getSubject(), // Use extracted subject or fallback to Gmail subject
    date: message.getDate().toISOString(),
    body: message.getPlainBody(),
    html: message.getBody()
  };

  Logger.log('\n📤 Sending to Edge Function:');
  Logger.log('URL:', SUPABASE_WEBHOOK_URL);
  Logger.log('ANON_KEY configured?', SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY_HERE');
  Logger.log('ANON_KEY (first 50 chars):', SUPABASE_ANON_KEY.substring(0, 50) + '...');
  Logger.log('Body length:', emailData.body.length);
  Logger.log('Body contains "Forwarded message"?', emailData.body.includes('Forwarded message'));
  Logger.log('Body contains "---------- Forwarded"?', emailData.body.includes('---------- Forwarded'));

  const response = sendToSupabase(emailData);
  Logger.log('\n📥 Response:', JSON.stringify(response, null, 2));
}

/**
 * Test function with mock Sympa email data
 */
function testWithMockEmail() {
  Logger.log('🧪 Testing with mock email...');

  const mockEmail = {
    from: 'sympa@lists.riseup.net',
    to: 'admin@example.com',
    subject: 'Message for list rezoprospec moderation',
    date: new Date().toISOString(),
    body: `Cher propriétaire de la liste rezoprospec,

Un utilisateur a demandé à être abonné à votre liste. Pour consulter toutes
les demandes en attente, veuillez cliquer sur ce lien :

https://lists.riseup.net/www/ticket/35136367739771

Vous pouvez également valider cette demande en envoyant un message à
sympa@lists.riseup.net avec comme objet :
AUTH 8d287915 ADD rezoprospec contact@librevoixmarseille.com`,
    html: ''
  };

  Logger.log('Mock email:', JSON.stringify(mockEmail, null, 2));

  const response = sendToSupabase(mockEmail);
  Logger.log('Response:', JSON.stringify(response, null, 2));
}
