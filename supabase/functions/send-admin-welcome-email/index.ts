// Edge function to send welcome emails to new network admins
// Triggered 5 days after network creation to help them set up their network
/// <reference types="https://esm.sh/@types/node@18/index.d.ts" />

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const APP_URL = Deno.env.get('APP_URL') || 'https://conclav.club'
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'Conclav <noreply@conclav.network>'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Email translations
const translations = {
  en: {
    subject: (networkName: string) => `Ready to grow ${networkName}? Here's how to invite your first members!`,
    greeting: (adminName: string) => `Hi ${adminName}!`,
    intro: (networkName: string) => `It's been a few days since you created <strong>${networkName}</strong> on Conclav, and we're excited to help you get started!`,
    buildCommunity: `Building a great community starts with inviting the right people. Here are three easy ways to bring your first members on board:`,

    // Method 1: Public Link
    method1Title: `Share a Public Invitation Link`,
    method1Desc: `Create a shareable link that anyone can use to join your network. Perfect for posting on social media or sharing in group chats.`,
    method1Steps: [
      `Go to your network settings`,
      `Click on "Invitation Links"`,
      `Create a new link and share it anywhere!`
    ],

    // Method 2: Email Invitations
    method2Title: `Send Email Invitations`,
    method2Desc: `Invite specific people directly by email. They'll receive a personalized invitation to join your network.`,
    method2Steps: [
      `Go to your network settings`,
      `Click on "Invite Members"`,
      `Enter email addresses and send invitations`
    ],

    // Method 3: QR Code
    method3Title: `Use a QR Code`,
    method3Desc: `Generate a QR code that people can scan to instantly join. Great for events, meetups, or printed materials.`,
    method3Steps: [
      `Create an invitation link (see method 1)`,
      `Click the QR code icon next to your link`,
      `Download and share the QR code`
    ],

    tip: `Pro tip: Start small! Invite 5-10 people you trust to help you shape the community before opening it up wider.`,

    cta: `Open My Network`,

    closing: `We're here to help you succeed. If you have any questions, just reply to this email!`,
    signature: `The Conclav Team`,

    footerNote: `You're receiving this email because you created a network on Conclav. If you no longer wish to receive these emails, you can manage your notification preferences in your account settings.`
  },
  fr: {
    subject: (networkName: string) => `Prêt à développer ${networkName} ? Voici comment inviter vos premiers membres !`,
    greeting: (adminName: string) => `Bonjour ${adminName} !`,
    intro: (networkName: string) => `Cela fait quelques jours que vous avez créé <strong>${networkName}</strong> sur Conclav, et nous sommes ravis de vous aider à démarrer !`,
    buildCommunity: `Construire une belle communauté commence par inviter les bonnes personnes. Voici trois façons simples d'accueillir vos premiers membres :`,

    // Method 1: Public Link
    method1Title: `Partagez un lien d'invitation public`,
    method1Desc: `Créez un lien partageable que tout le monde peut utiliser pour rejoindre votre réseau. Parfait pour les réseaux sociaux ou les groupes de discussion.`,
    method1Steps: [
      `Allez dans les paramètres de votre réseau`,
      `Cliquez sur "Liens d'invitation"`,
      `Créez un nouveau lien et partagez-le partout !`
    ],

    // Method 2: Email Invitations
    method2Title: `Envoyez des invitations par email`,
    method2Desc: `Invitez des personnes spécifiques directement par email. Elles recevront une invitation personnalisée pour rejoindre votre réseau.`,
    method2Steps: [
      `Allez dans les paramètres de votre réseau`,
      `Cliquez sur "Inviter des membres"`,
      `Entrez les adresses email et envoyez les invitations`
    ],

    // Method 3: QR Code
    method3Title: `Utilisez un QR Code`,
    method3Desc: `Générez un QR code que les gens peuvent scanner pour rejoindre instantanément. Idéal pour les événements, les rencontres ou les supports imprimés.`,
    method3Steps: [
      `Créez un lien d'invitation (voir méthode 1)`,
      `Cliquez sur l'icône QR code à côté de votre lien`,
      `Téléchargez et partagez le QR code`
    ],

    tip: `Astuce : Commencez petit ! Invitez 5 à 10 personnes de confiance pour vous aider à façonner la communauté avant de l'ouvrir plus largement.`,

    cta: `Ouvrir mon réseau`,

    closing: `Nous sommes là pour vous aider à réussir. Si vous avez des questions, répondez simplement à cet email !`,
    signature: `L'équipe Conclav`,

    footerNote: `Vous recevez cet email car vous avez créé un réseau sur Conclav. Si vous ne souhaitez plus recevoir ces emails, vous pouvez gérer vos préférences de notification dans les paramètres de votre compte.`
  }
}

type Language = 'en' | 'fr'

function getTranslations(lang: string) {
  return translations[lang as Language] || translations.fr
}

function generateEmailHTML(
  adminName: string,
  networkName: string,
  networkId: string,
  language: string
): string {
  const t = getTranslations(language)
  const networkUrl = `${APP_URL}/network/${networkId}`

  return `
<!DOCTYPE html>
<html lang="${language}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${t.subject(networkName)}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center;">
              <h1 style="margin: 0; color: #1a1a1a; font-size: 24px; font-weight: 600;">
                ${t.greeting(adminName)}
              </h1>
            </td>
          </tr>

          <!-- Intro -->
          <tr>
            <td style="padding: 0 40px 20px;">
              <p style="margin: 0; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                ${t.intro(networkName)}
              </p>
            </td>
          </tr>

          <!-- Build Community -->
          <tr>
            <td style="padding: 0 40px 30px;">
              <p style="margin: 0; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                ${t.buildCommunity}
              </p>
            </td>
          </tr>

          <!-- Method 1: Public Link -->
          <tr>
            <td style="padding: 0 40px 25px;">
              <table role="presentation" style="width: 100%; background-color: #f8f9fa; border-radius: 8px; border-left: 4px solid #4CAF50;">
                <tr>
                  <td style="padding: 20px;">
                    <h3 style="margin: 0 0 10px; color: #1a1a1a; font-size: 16px; font-weight: 600;">
                      🔗 ${t.method1Title}
                    </h3>
                    <p style="margin: 0 0 15px; color: #666; font-size: 14px; line-height: 1.5;">
                      ${t.method1Desc}
                    </p>
                    <ol style="margin: 0; padding-left: 20px; color: #666; font-size: 14px; line-height: 1.8;">
                      ${t.method1Steps.map(step => `<li>${step}</li>`).join('')}
                    </ol>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Method 2: Email Invitations -->
          <tr>
            <td style="padding: 0 40px 25px;">
              <table role="presentation" style="width: 100%; background-color: #f8f9fa; border-radius: 8px; border-left: 4px solid #2196F3;">
                <tr>
                  <td style="padding: 20px;">
                    <h3 style="margin: 0 0 10px; color: #1a1a1a; font-size: 16px; font-weight: 600;">
                      ✉️ ${t.method2Title}
                    </h3>
                    <p style="margin: 0 0 15px; color: #666; font-size: 14px; line-height: 1.5;">
                      ${t.method2Desc}
                    </p>
                    <ol style="margin: 0; padding-left: 20px; color: #666; font-size: 14px; line-height: 1.8;">
                      ${t.method2Steps.map(step => `<li>${step}</li>`).join('')}
                    </ol>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Method 3: QR Code -->
          <tr>
            <td style="padding: 0 40px 25px;">
              <table role="presentation" style="width: 100%; background-color: #f8f9fa; border-radius: 8px; border-left: 4px solid #FF9800;">
                <tr>
                  <td style="padding: 20px;">
                    <h3 style="margin: 0 0 10px; color: #1a1a1a; font-size: 16px; font-weight: 600;">
                      📱 ${t.method3Title}
                    </h3>
                    <p style="margin: 0 0 15px; color: #666; font-size: 14px; line-height: 1.5;">
                      ${t.method3Desc}
                    </p>
                    <ol style="margin: 0; padding-left: 20px; color: #666; font-size: 14px; line-height: 1.8;">
                      ${t.method3Steps.map(step => `<li>${step}</li>`).join('')}
                    </ol>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Pro Tip -->
          <tr>
            <td style="padding: 0 40px 30px;">
              <table role="presentation" style="width: 100%; background-color: #e8f5e9; border-radius: 8px;">
                <tr>
                  <td style="padding: 15px 20px;">
                    <p style="margin: 0; color: #2e7d32; font-size: 14px; line-height: 1.5;">
                      💡 ${t.tip}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td style="padding: 0 40px 30px;" align="center">
              <a href="${networkUrl}"
                 style="display: inline-block; background-color: #1976d2; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;">
                ${t.cta}
              </a>
            </td>
          </tr>

          <!-- Closing -->
          <tr>
            <td style="padding: 0 40px 20px;">
              <p style="margin: 0; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                ${t.closing}
              </p>
            </td>
          </tr>

          <!-- Signature -->
          <tr>
            <td style="padding: 0 40px 40px;">
              <p style="margin: 0; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                ${t.signature}
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px; background-color: #f8f9fa; border-radius: 0 0 12px 12px;">
              <p style="margin: 0; color: #999; font-size: 12px; line-height: 1.5; text-align: center;">
                ${t.footerNote}
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Check for test mode
    let body: { testEmail?: string; testName?: string; testNetworkName?: string; testLanguage?: string } = {}
    try {
      body = await req.json()
    } catch {
      // No body or invalid JSON, proceed with normal processing
    }

    // TEST MODE: Send a test email to a specific address
    if (body.testEmail) {
      console.log(`🧪 Test mode: Sending welcome email to ${body.testEmail}`)

      const testName = body.testName || 'Admin'
      const testNetworkName = body.testNetworkName || 'Test Network'
      const testLanguage = body.testLanguage || 'fr'
      const t = getTranslations(testLanguage)

      const emailHTML = generateEmailHTML(testName, testNetworkName, 'test-network-id', testLanguage)

      const resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${RESEND_API_KEY}`
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: body.testEmail,
          subject: t.subject(testNetworkName),
          html: emailHTML
        })
      })

      const resendData = await resendResponse.json()

      if (resendResponse.status >= 400) {
        return new Response(
          JSON.stringify({ success: false, error: resendData.message || 'Email send failed', details: resendData }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ success: true, message: `Test email sent to ${body.testEmail}`, data: resendData }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('🎉 Starting admin welcome email processing...')

    // Find networks created 5 days ago that haven't received the welcome email yet
    const fiveDaysAgo = new Date()
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5)
    const fiveDaysAgoStart = new Date(fiveDaysAgo)
    fiveDaysAgoStart.setHours(0, 0, 0, 0)
    const fiveDaysAgoEnd = new Date(fiveDaysAgo)
    fiveDaysAgoEnd.setHours(23, 59, 59, 999)

    console.log(`📅 Looking for networks created on ${fiveDaysAgo.toISOString().split('T')[0]}`)

    // Get networks that need welcome emails
    const { data: networks, error: networksError } = await supabase
      .from('networks')
      .select('id, name, created_by, created_at')
      .eq('admin_welcome_email_sent', false)
      .gte('created_at', fiveDaysAgoStart.toISOString())
      .lte('created_at', fiveDaysAgoEnd.toISOString())

    if (networksError) {
      throw new Error(`Failed to fetch networks: ${networksError.message}`)
    }

    if (!networks || networks.length === 0) {
      console.log('📭 No networks need welcome emails today')
      return new Response(
        JSON.stringify({ success: true, message: 'No networks need welcome emails', processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`📧 Found ${networks.length} networks needing welcome emails`)

    let successCount = 0
    let errorCount = 0
    const results: Array<{ networkId: string; networkName: string; success: boolean; error?: string }> = []

    for (const network of networks) {
      try {
        // Get the admin profile for this network
        const { data: adminProfile, error: profileError } = await supabase
          .from('profiles')
          .select('id, full_name, contact_email, preferred_language, user_id')
          .eq('network_id', network.id)
          .eq('role', 'admin')
          .single()

        if (profileError || !adminProfile) {
          console.log(`⚠️ No admin profile found for network ${network.id}`)
          results.push({ networkId: network.id, networkName: network.name, success: false, error: 'No admin profile found' })
          errorCount++
          continue
        }

        // Get email from profile or auth.users
        let adminEmail = adminProfile.contact_email

        if (!adminEmail && adminProfile.user_id) {
          // Try to get email from auth.users
          const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(adminProfile.user_id)
          if (!authError && authUser?.user?.email) {
            adminEmail = authUser.user.email
          }
        }

        if (!adminEmail) {
          console.log(`⚠️ No email found for admin of network ${network.id}`)
          results.push({ networkId: network.id, networkName: network.name, success: false, error: 'No admin email found' })
          errorCount++
          continue
        }

        const adminName = adminProfile.full_name || adminEmail.split('@')[0]
        const language = adminProfile.preferred_language || 'fr'
        const t = getTranslations(language)

        // Generate and send email
        const emailHTML = generateEmailHTML(adminName, network.name, network.id, language)

        console.log(`📤 Sending welcome email to ${adminEmail} for network "${network.name}" in ${language}`)

        const resendResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${RESEND_API_KEY}`
          },
          body: JSON.stringify({
            from: FROM_EMAIL,
            to: adminEmail,
            subject: t.subject(network.name),
            html: emailHTML
          })
        })

        const resendData = await resendResponse.json()

        if (resendResponse.status >= 400) {
          console.error(`❌ Failed to send email for network ${network.id}:`, resendData)

          // Log the failure
          await supabase.from('admin_welcome_email_log').insert({
            network_id: network.id,
            network_name: network.name,
            admin_email: adminEmail,
            language,
            success: false,
            error_message: resendData.message || 'Email send failed'
          })

          results.push({ networkId: network.id, networkName: network.name, success: false, error: resendData.message || 'Email send failed' })
          errorCount++
          continue
        }

        // Mark network as having received the welcome email
        const { error: updateError } = await supabase
          .from('networks')
          .update({ admin_welcome_email_sent: true })
          .eq('id', network.id)

        if (updateError) {
          console.error(`⚠️ Email sent but failed to update network ${network.id}:`, updateError)
        }

        // Log the success
        await supabase.from('admin_welcome_email_log').insert({
          network_id: network.id,
          network_name: network.name,
          admin_email: adminEmail,
          language,
          success: true
        })

        console.log(`✅ Welcome email sent successfully for network "${network.name}"`)
        results.push({ networkId: network.id, networkName: network.name, success: true })
        successCount++

      } catch (networkError) {
        console.error(`❌ Error processing network ${network.id}:`, networkError)
        results.push({
          networkId: network.id,
          networkName: network.name,
          success: false,
          error: networkError instanceof Error ? networkError.message : 'Unknown error'
        })
        errorCount++
      }
    }

    console.log(`🎉 Finished processing. Success: ${successCount}, Errors: ${errorCount}`)

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${networks.length} networks`,
        processed: successCount,
        errors: errorCount,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Error in send-admin-welcome-email:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
