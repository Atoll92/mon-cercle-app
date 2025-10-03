#!/usr/bin/env node

/**
 * Test script for Sympa Edge Function
 * Usage: node test-sympa-edge-function.js <annonce-id>
 */

import { createClient } from '@supabase/supabase-js';

// Load from environment or use defaults
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'YOUR_ANON_KEY';

if (!SUPABASE_URL || SUPABASE_URL === 'YOUR_SUPABASE_URL') {
  console.error('❌ Error: SUPABASE_URL not set');
  console.log('Set VITE_SUPABASE_URL environment variable or edit this file');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testModerateAnnonce(annonceId) {
  console.log(`\n🧪 Testing Sympa moderation for annonce: ${annonceId}\n`);

  try {
    // First, fetch the annonce to see what we're working with
    console.log('📋 Fetching annonce details...');
    const { data: annonce, error: fetchError } = await supabase
      .from('annonces_moderation')
      .select('*')
      .eq('id', annonceId)
      .single();

    if (fetchError) {
      console.error('❌ Failed to fetch annonce:', fetchError);
      return;
    }

    if (!annonce) {
      console.error('❌ Annonce not found');
      return;
    }

    console.log('✅ Annonce found:');
    console.log(`   - Sender: ${annonce.sender_name} (${annonce.sender_email})`);
    console.log(`   - Subject: ${annonce.subject}`);
    console.log(`   - Status: ${annonce.status}`);
    console.log(`   - Has Sympa data: ${annonce.sympa_ticket_id ? 'Yes' : 'No'}`);
    if (annonce.sympa_ticket_id) {
      console.log(`   - Ticket ID: ${annonce.sympa_ticket_id}`);
    }

    // Call the Edge Function
    console.log('\n📧 Invoking Sympa moderation Edge Function...');
    const { data, error } = await supabase.functions.invoke('sympa-moderate-message', {
      body: {
        annonceId: annonceId,
        action: 'approved'
      }
    });

    if (error) {
      console.error('\n❌ Edge Function returned an error:');
      console.error('   Status:', error.status);
      console.error('   Message:', error.message);

      if (error.context) {
        console.error('   Context:', JSON.stringify(error.context, null, 2));
      }

      // Try to parse the error body
      if (error.context?.body) {
        try {
          const errorBody = typeof error.context.body === 'string'
            ? JSON.parse(error.context.body)
            : error.context.body;
          console.error('   Detailed error:', errorBody.error);
        } catch (e) {
          console.error('   Raw error body:', error.context.body);
        }
      }

      return;
    }

    console.log('\n✅ Edge Function succeeded:');
    console.log(JSON.stringify(data, null, 2));

    // Verify the update in the database
    console.log('\n🔍 Verifying database update...');
    const { data: updated, error: verifyError } = await supabase
      .from('annonces_moderation')
      .select('status, synced_to_sympa, sympa_command')
      .eq('id', annonceId)
      .single();

    if (verifyError) {
      console.error('❌ Failed to verify update:', verifyError);
      return;
    }

    console.log('✅ Database updated:');
    console.log(`   - Status: ${updated.status}`);
    console.log(`   - Synced to Sympa: ${updated.synced_to_sympa}`);
    if (updated.sympa_command) {
      console.log(`   - Command sent: ${updated.sympa_command}`);
    }

  } catch (error) {
    console.error('\n❌ Unexpected error:', error.message);
    console.error(error);
  }
}

// Get annonce ID from command line or use test ID
const annonceId = process.argv[2];

if (!annonceId) {
  console.log('Usage: node test-sympa-edge-function.js <annonce-id>');
  console.log('\nTo get an annonce ID, run this SQL query:');
  console.log('  SELECT id, sender_name, subject FROM annonces_moderation LIMIT 5;');
  process.exit(1);
}

testModerateAnnonce(annonceId);
