/**
 * Migration Utility: Encrypt Existing Direct Messages
 *
 * This utility encrypts all existing plaintext direct messages in the database.
 * Run this ONCE after deploying the encryption feature.
 *
 * Usage:
 * 1. Import this file in your admin panel or create a temporary page
 * 2. Call migrateAllMessages() with appropriate permissions
 * 3. Monitor progress in the console
 * 4. Remove this utility after migration is complete
 *
 * @module migrateMessagesToEncryption
 */

import { supabase } from '../supabaseclient';
import { encryptMessage, isEncrypted, encryptMetadata } from './messageEncryption';

/**
 * Migrates all direct messages to encrypted format
 * Processes messages in batches to avoid overwhelming the database
 *
 * @param {number} batchSize - Number of messages to process at once (default: 50)
 * @returns {Promise<object>} Migration results with success/error counts
 */
export async function migrateAllMessages(batchSize = 50) {
  console.log('🔐 Starting migration of direct messages to encrypted format...');

  const results = {
    total: 0,
    encrypted: 0,
    skipped: 0,
    errors: 0,
    errorDetails: []
  };

  try {
    // Step 1: Get all conversations
    const { data: conversations, error: convError } = await supabase
      .from('direct_conversations')
      .select('id, participants');

    if (convError) {
      throw new Error(`Failed to fetch conversations: ${convError.message}`);
    }

    console.log(`📊 Found ${conversations.length} conversations to process`);

    // Step 2: Process each conversation
    for (const conversation of conversations) {
      console.log(`\n🔄 Processing conversation ${conversation.id}...`);

      try {
        // Fetch all messages for this conversation
        const { data: messages, error: msgError } = await supabase
          .from('direct_messages')
          .select('id, content, media_metadata')
          .eq('conversation_id', conversation.id);

        if (msgError) {
          console.error(`❌ Error fetching messages for conversation ${conversation.id}:`, msgError);
          results.errors++;
          results.errorDetails.push({
            conversationId: conversation.id,
            error: msgError.message
          });
          continue;
        }

        if (!messages || messages.length === 0) {
          console.log(`  ℹ️  No messages in this conversation`);
          continue;
        }

        results.total += messages.length;
        console.log(`  📝 Found ${messages.length} messages`);

        // Process messages in batches
        for (let i = 0; i < messages.length; i += batchSize) {
          const batch = messages.slice(i, i + batchSize);
          console.log(`  🔐 Encrypting batch ${Math.floor(i / batchSize) + 1} (${batch.length} messages)...`);

          await Promise.all(
            batch.map(async (message) => {
              try {
                // Skip if already encrypted
                if (isEncrypted(message.content)) {
                  console.log(`    ⏭️  Message ${message.id} already encrypted, skipping`);
                  results.skipped++;
                  return;
                }

                // Encrypt the content
                const encryptedContent = await encryptMessage(
                  message.content,
                  conversation.participants
                );

                // Encrypt metadata if it exists
                let encryptedMetadata = message.media_metadata;
                if (message.media_metadata && Object.keys(message.media_metadata).length > 0) {
                  encryptedMetadata = await encryptMetadata(
                    message.media_metadata,
                    conversation.participants
                  );
                }

                // Update the message
                const { error: updateError } = await supabase
                  .from('direct_messages')
                  .update({
                    content: encryptedContent,
                    media_metadata: encryptedMetadata
                  })
                  .eq('id', message.id);

                if (updateError) {
                  throw updateError;
                }

                console.log(`    ✅ Message ${message.id} encrypted successfully`);
                results.encrypted++;
              } catch (error) {
                console.error(`    ❌ Failed to encrypt message ${message.id}:`, error);
                results.errors++;
                results.errorDetails.push({
                  messageId: message.id,
                  conversationId: conversation.id,
                  error: error.message
                });
              }
            })
          );

          // Small delay between batches to avoid rate limiting
          if (i + batchSize < messages.length) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }

        console.log(`  ✅ Conversation ${conversation.id} processed`);
      } catch (error) {
        console.error(`❌ Error processing conversation ${conversation.id}:`, error);
        results.errors++;
        results.errorDetails.push({
          conversationId: conversation.id,
          error: error.message
        });
      }
    }

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('🎉 MIGRATION COMPLETE');
    console.log('='.repeat(60));
    console.log(`📊 Total messages processed: ${results.total}`);
    console.log(`✅ Successfully encrypted: ${results.encrypted}`);
    console.log(`⏭️  Skipped (already encrypted): ${results.skipped}`);
    console.log(`❌ Errors: ${results.errors}`);

    if (results.errorDetails.length > 0) {
      console.log('\n⚠️  Error Details:');
      results.errorDetails.forEach((detail, index) => {
        console.log(`  ${index + 1}. ${JSON.stringify(detail)}`);
      });
    }

    return results;
  } catch (error) {
    console.error('❌ Fatal error during migration:', error);
    throw error;
  }
}

/**
 * Migrates messages for a specific conversation only
 * Useful for testing or fixing specific conversations
 *
 * @param {string} conversationId - ID of the conversation to migrate
 * @returns {Promise<object>} Migration results
 */
export async function migrateConversation(conversationId) {
  console.log(`🔐 Migrating conversation ${conversationId}...`);

  const results = {
    total: 0,
    encrypted: 0,
    skipped: 0,
    errors: 0,
    errorDetails: []
  };

  try {
    // Get conversation participants
    const { data: conversation, error: convError } = await supabase
      .from('direct_conversations')
      .select('participants')
      .eq('id', conversationId)
      .single();

    if (convError) {
      throw new Error(`Failed to fetch conversation: ${convError.message}`);
    }

    // Fetch all messages
    const { data: messages, error: msgError } = await supabase
      .from('direct_messages')
      .select('id, content, media_metadata')
      .eq('conversation_id', conversationId);

    if (msgError) {
      throw new Error(`Failed to fetch messages: ${msgError.message}`);
    }

    if (!messages || messages.length === 0) {
      console.log('ℹ️  No messages to migrate');
      return results;
    }

    results.total = messages.length;
    console.log(`📝 Found ${messages.length} messages`);

    // Process each message
    for (const message of messages) {
      try {
        // Skip if already encrypted
        if (isEncrypted(message.content)) {
          console.log(`⏭️  Message ${message.id} already encrypted, skipping`);
          results.skipped++;
          continue;
        }

        // Encrypt the content
        const encryptedContent = await encryptMessage(
          message.content,
          conversation.participants
        );

        // Encrypt metadata if it exists
        let encryptedMetadata = message.media_metadata;
        if (message.media_metadata && Object.keys(message.media_metadata).length > 0) {
          encryptedMetadata = await encryptMetadata(
            message.media_metadata,
            conversation.participants
          );
        }

        // Update the message
        const { error: updateError } = await supabase
          .from('direct_messages')
          .update({
            content: encryptedContent,
            media_metadata: encryptedMetadata
          })
          .eq('id', message.id);

        if (updateError) {
          throw updateError;
        }

        console.log(`✅ Message ${message.id} encrypted successfully`);
        results.encrypted++;
      } catch (error) {
        console.error(`❌ Failed to encrypt message ${message.id}:`, error);
        results.errors++;
        results.errorDetails.push({
          messageId: message.id,
          error: error.message
        });
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ CONVERSATION MIGRATION COMPLETE');
    console.log('='.repeat(60));
    console.log(`📊 Total messages: ${results.total}`);
    console.log(`✅ Encrypted: ${results.encrypted}`);
    console.log(`⏭️  Skipped: ${results.skipped}`);
    console.log(`❌ Errors: ${results.errors}`);

    return results;
  } catch (error) {
    console.error('❌ Error migrating conversation:', error);
    throw error;
  }
}

/**
 * Dry run - checks how many messages need encryption without modifying anything
 *
 * @returns {Promise<object>} Statistics about messages that need encryption
 */
export async function checkMigrationStatus() {
  console.log('📊 Checking migration status...');

  const stats = {
    totalConversations: 0,
    totalMessages: 0,
    encryptedMessages: 0,
    plaintextMessages: 0,
    conversationsNeedingMigration: []
  };

  try {
    // Get all conversations
    const { data: conversations, error: convError } = await supabase
      .from('direct_conversations')
      .select('id, participants');

    if (convError) {
      throw new Error(`Failed to fetch conversations: ${convError.message}`);
    }

    stats.totalConversations = conversations.length;

    // Check each conversation
    for (const conversation of conversations) {
      const { data: messages, error: msgError } = await supabase
        .from('direct_messages')
        .select('id, content')
        .eq('conversation_id', conversation.id);

      if (msgError) {
        console.error(`Error fetching messages for conversation ${conversation.id}:`, msgError);
        continue;
      }

      if (!messages || messages.length === 0) continue;

      stats.totalMessages += messages.length;

      let needsMigration = false;
      messages.forEach(msg => {
        if (isEncrypted(msg.content)) {
          stats.encryptedMessages++;
        } else {
          stats.plaintextMessages++;
          needsMigration = true;
        }
      });

      if (needsMigration) {
        stats.conversationsNeedingMigration.push({
          id: conversation.id,
          totalMessages: messages.length,
          plaintextCount: messages.filter(m => !isEncrypted(m.content)).length
        });
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 MIGRATION STATUS');
    console.log('='.repeat(60));
    console.log(`Total conversations: ${stats.totalConversations}`);
    console.log(`Total messages: ${stats.totalMessages}`);
    console.log(`✅ Encrypted messages: ${stats.encryptedMessages} (${((stats.encryptedMessages / stats.totalMessages) * 100).toFixed(1)}%)`);
    console.log(`⚠️  Plaintext messages: ${stats.plaintextMessages} (${((stats.plaintextMessages / stats.totalMessages) * 100).toFixed(1)}%)`);
    console.log(`🔄 Conversations needing migration: ${stats.conversationsNeedingMigration.length}`);

    if (stats.conversationsNeedingMigration.length > 0) {
      console.log('\nConversations with plaintext messages:');
      stats.conversationsNeedingMigration.forEach((conv, index) => {
        console.log(`  ${index + 1}. ${conv.id} - ${conv.plaintextCount}/${conv.totalMessages} plaintext`);
      });
    }

    return stats;
  } catch (error) {
    console.error('❌ Error checking migration status:', error);
    throw error;
  }
}
