// Edge Function: check-sympa-config
// Purpose: Debug function to check Sympa moderation configuration
/// <reference types="https://esm.sh/@types/node@18/index.d.ts" />

Deno.serve(async () => {
  const config = {
    RESEND_API_KEY: Deno.env.get('RESEND_API_KEY') ? '✅ Set' : '❌ Not set',
    FROM_EMAIL: Deno.env.get('FROM_EMAIL') || '❌ Not set (will default to: noreply@your-domain.com)',
    SYMPA_COMMAND_EMAIL: Deno.env.get('SYMPA_COMMAND_EMAIL') || 'sympa@lists.riseup.net (default)',
    SYMPA_LIST_NAME: 'rezoprospec',
    instructions: {
      issue: 'If FROM_EMAIL is not set or wrong, moderation commands will fail',
      solution: 'Set FROM_EMAIL to mailer@doublegeste.com in Supabase secrets',
      command: 'supabase secrets set FROM_EMAIL=mailer@doublegeste.com'
    }
  }

  return new Response(JSON.stringify(config, null, 2), {
    headers: { 'Content-Type': 'application/json' }
  })
})
