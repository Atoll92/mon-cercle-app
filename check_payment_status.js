// Quick script to check if payment was recorded in database
// Run with: node check_payment_status.js

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://etoxvocwsktguoddmgcu.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || 'YOUR_SERVICE_KEY_HERE';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkPaymentStatus() {
  console.log('Checking recent network subscriptions...\n');

  // Check networks with stripe customer IDs
  const { data: networks, error } = await supabase
    .from('networks')
    .select('id, name, subscription_status, subscription_plan, stripe_customer_id, stripe_subscription_id, created_at, updated_at')
    .not('stripe_customer_id', 'is', null)
    .order('updated_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('Error fetching networks:', error);
    return;
  }

  if (!networks || networks.length === 0) {
    console.log('No networks with Stripe subscriptions found.');
    return;
  }

  console.log(`Found ${networks.length} network(s) with Stripe subscriptions:\n`);

  networks.forEach((network, index) => {
    console.log(`${index + 1}. ${network.name}`);
    console.log(`   ID: ${network.id}`);
    console.log(`   Status: ${network.subscription_status || 'N/A'}`);
    console.log(`   Plan: ${network.subscription_plan || 'N/A'}`);
    console.log(`   Stripe Customer: ${network.stripe_customer_id || 'N/A'}`);
    console.log(`   Stripe Subscription: ${network.stripe_subscription_id || 'N/A'}`);
    console.log(`   Created: ${new Date(network.created_at).toLocaleString()}`);
    console.log(`   Updated: ${new Date(network.updated_at).toLocaleString()}`);
    console.log('');
  });

  // Check the most recent one
  const latestNetwork = networks[0];
  if (latestNetwork.subscription_status === 'active') {
    console.log('✅ Latest payment appears successful!');
    console.log(`   Network "${latestNetwork.name}" has an active ${latestNetwork.subscription_plan} subscription.`);
  } else {
    console.log('⚠️  Latest network subscription status:', latestNetwork.subscription_status);
    console.log('   This might indicate the webhook hasn\'t processed yet or there was an issue.');
  }
}

checkPaymentStatus().catch(console.error);
