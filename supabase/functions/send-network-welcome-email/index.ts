// Edge function to send welcome emails to admins who just created a network
// Includes trial information and pricing details
// Emphasizes privacy-first approach
/// <reference types="https://esm.sh/@types/node@18/index.d.ts" />

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const APP_URL = Deno.env.get('APP_URL') || 'https://conclav.club'
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'Conclav <noreply@conclav.network>'
const BCC_EMAIL = 'arthur.boval@gmail.com'
const REPLY_TO_EMAIL = 'arthur.boval@gmail.com'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function generateEmailHTML(
  adminName: string,
  networkName: string,
  networkId: string
): string {
  const networkUrl = `${APP_URL}/network/${networkId}`

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bienvenue sur Conclav - ${networkName}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5; color: #333;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">

          <!-- Header with logo and warm welcome -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px 12px 0 0;">
              <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="-125 -125 250 250" style="margin-bottom: 16px;">
                <defs>
                  <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#ffffff" stop-opacity="1"></stop>
                    <stop offset="100%" stop-color="#e8eaf6" stop-opacity="1"></stop>
                  </linearGradient>
                </defs>
                <circle cx="0" cy="0" r="35" fill="url(#logo-gradient)"></circle>
                <g fill="url(#logo-gradient)" opacity="0.9">
                  <circle cx="70.00" cy="0.00" r="20"></circle>
                  <circle cx="43.64" cy="54.72" r="20"></circle>
                  <circle cx="-15.57" cy="68.24" r="20"></circle>
                  <circle cx="-63.06" cy="30.37" r="20"></circle>
                  <circle cx="-63.06" cy="-30.37" r="20"></circle>
                  <circle cx="-15.57" cy="-68.24" r="20"></circle>
                  <circle cx="43.64" cy="-54.72" r="20"></circle>
                </g>
                <g fill="#ffffff" opacity="0.7">
                  <circle cx="85.59" cy="41.21" r="10"></circle>
                  <circle cx="21.13" cy="92.61" r="10"></circle>
                  <circle cx="-59.23" cy="74.27" r="10"></circle>
                  <circle cx="-95.00" cy="0" r="10"></circle>
                  <circle cx="-59.23" cy="-74.27" r="10"></circle>
                  <circle cx="21.13" cy="-92.61" r="10"></circle>
                  <circle cx="85.59" cy="-41.21" r="10"></circle>
                </g>
              </svg>
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">
                Bienvenue sur Conclav !
              </h1>
            </td>
          </tr>

          <!-- Personal greeting -->
          <tr>
            <td style="padding: 30px 40px 20px;">
              <p style="margin: 0; color: #1a1a1a; font-size: 18px; line-height: 1.6;">
                Bonjour ${adminName},
              </p>
            </td>
          </tr>

          <!-- Main message -->
          <tr>
            <td style="padding: 0 40px 25px;">
              <p style="margin: 0 0 16px; color: #4a4a4a; font-size: 16px; line-height: 1.7;">
                Merci d'avoir choisi Conclav pour créer <strong style="color: #1976d2;">${networkName}</strong>.
              </p>
              <p style="margin: 0; color: #4a4a4a; font-size: 16px; line-height: 1.7;">
                Nous sommes sincèrement ravis de vous accueillir dans notre communauté d'administrateurs qui, comme vous, ont fait le choix d'un espace numérique respectueux de la vie privée.
              </p>
            </td>
          </tr>

          <!-- Trial info box -->
          <tr>
            <td style="padding: 0 40px 25px;">
              <table role="presentation" style="width: 100%; background-color: #e3f2fd; border-radius: 8px; border-left: 4px solid #1976d2;">
                <tr>
                  <td style="padding: 20px;">
                    <h3 style="margin: 0 0 12px; color: #1565c0; font-size: 17px; font-weight: 600;">
                      Votre période d'essai gratuit
                    </h3>
                    <p style="margin: 0; color: #4a4a4a; font-size: 15px; line-height: 1.6;">
                      Vous bénéficiez d'un <strong>essai gratuit de 14 jours</strong> pour explorer toutes les fonctionnalités de Conclav sans engagement. Prenez le temps de configurer votre réseau, d'inviter vos premiers membres et de découvrir ce que nous avons construit pour vous.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Pricing info -->
          <tr>
            <td style="padding: 0 40px 25px;">
              <table role="presentation" style="width: 100%; background-color: #f5f5f5; border-radius: 8px;">
                <tr>
                  <td style="padding: 20px;">
                    <h3 style="margin: 0 0 12px; color: #1a1a1a; font-size: 17px; font-weight: 600;">
                      Après l'essai : 14 € / mois
                    </h3>
                    <p style="margin: 0; color: #4a4a4a; font-size: 15px; line-height: 1.6;">
                      À la fin de votre période d'essai, le <strong>forfait Community</strong> est proposé à <strong>14 € par mois</strong> pour votre réseau (jusqu'à 200 membres inclus).
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Privacy manifesto -->
          <tr>
            <td style="padding: 0 40px 25px;">
              <table role="presentation" style="width: 100%; background-color: #e8f5e9; border-radius: 8px; border-left: 4px solid #4caf50;">
                <tr>
                  <td style="padding: 20px;">
                    <h3 style="margin: 0 0 12px; color: #2e7d32; font-size: 17px; font-weight: 600;">
                      Notre engagement : zéro compromis sur votre vie privée
                    </h3>
                    <p style="margin: 0 0 12px; color: #4a4a4a; font-size: 15px; line-height: 1.6;">
                      Chez Conclav, nous avons fait un choix clair et assumé :
                    </p>
                    <ul style="margin: 0; padding-left: 20px; color: #4a4a4a; font-size: 15px; line-height: 1.8;">
                      <li><strong>Aucune publicité</strong> – jamais</li>
                      <li><strong>Aucune vente de données</strong> – vos données vous appartiennent</li>
                      <li><strong>Aucun tracking</strong> – nous ne surveillons pas vos membres</li>
                      <li><strong>Aucun algorithme manipulateur</strong> conçu pour créer de l'addiction, nous respectons le temps d'attention de vos membres</li>
                    </ul>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Transparency note -->
          <tr>
            <td style="padding: 0 40px 25px;">
              <p style="margin: 0; color: #4a4a4a; font-size: 15px; line-height: 1.7; font-style: italic;">
                Ce modèle a un coût. Sur les grandes plateformes « gratuites », c'est vous le produit. Ici, c'est différent : le prix que vous payez nous permet de rester indépendants, de vous offrir un service de qualité et de ne jamais avoir à compromettre nos valeurs.
              </p>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td style="padding: 10px 40px 30px;" align="center">
              <a href="${networkUrl}"
                 style="display: inline-block; background-color: #1976d2; color: #ffffff; text-decoration: none; padding: 16px 36px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 2px 4px rgba(25, 118, 210, 0.3);">
                Accéder à ${networkName}
              </a>
            </td>
          </tr>

          <!-- Closing -->
          <tr>
            <td style="padding: 0 40px 15px;">
              <p style="margin: 0; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                Si vous avez la moindre question, n'hésitez pas à répondre directement à cet email. Nous sommes une petite équipe et nous lisons tous les messages personnellement.
              </p>
            </td>
          </tr>

          <!-- Signature -->
          <tr>
            <td style="padding: 15px 40px 40px;">
              <p style="margin: 0 0 4px; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                À très bientôt,
              </p>
              <p style="margin: 0; color: #1a1a1a; font-size: 16px; font-weight: 500; line-height: 1.6;">
                L'équipe Conclav 😊
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px; background-color: #f8f9fa; border-radius: 0 0 12px 12px;">
              <p style="margin: 0; color: #999; font-size: 12px; line-height: 1.5; text-align: center;">
                Vous recevez cet email car vous venez de créer un réseau sur Conclav.<br>
                <a href="${APP_URL}" style="color: #1976d2; text-decoration: none;">conclav.club</a>
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
    let body: {
      testEmail?: string
      testName?: string
      testNetworkName?: string
      // For actual sends
      adminEmail?: string
      adminName?: string
      networkName?: string
      networkId?: string
    } = {}

    try {
      body = await req.json()
    } catch {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid JSON body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // TEST MODE: Send a test email to a specific address
    if (body.testEmail) {
      console.log(`Test mode: Sending welcome email to ${body.testEmail}`)

      const testName = body.testName || 'Admin'
      const testNetworkName = body.testNetworkName || 'Mon Réseau Test'
      const subject = `Bienvenue sur Conclav - ${testNetworkName} a été créé !`

      const emailHTML = generateEmailHTML(testName, testNetworkName, 'test-network-id')

      const resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${RESEND_API_KEY}`
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: body.testEmail,
          bcc: BCC_EMAIL,
          reply_to: REPLY_TO_EMAIL,
          subject: subject,
          html: emailHTML
        })
      })

      const resendData = await resendResponse.json()

      if (resendResponse.status >= 400) {
        console.error('Failed to send test email:', resendData)
        return new Response(
          JSON.stringify({ success: false, error: resendData.message || 'Email send failed', details: resendData }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log(`Test email sent successfully to ${body.testEmail}`)
      return new Response(
        JSON.stringify({ success: true, message: `Test email sent to ${body.testEmail}`, data: resendData }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // PRODUCTION MODE: Send to actual admin
    if (body.adminEmail && body.networkName && body.networkId) {
      const adminName = body.adminName || body.adminEmail.split('@')[0]
      const subject = `Bienvenue sur Conclav - ${body.networkName} a été créé !`

      const emailHTML = generateEmailHTML(adminName, body.networkName, body.networkId)

      console.log(`Sending welcome email to ${body.adminEmail} for network "${body.networkName}"`)

      const resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${RESEND_API_KEY}`
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: body.adminEmail,
          bcc: BCC_EMAIL,
          reply_to: REPLY_TO_EMAIL,
          subject: subject,
          html: emailHTML
        })
      })

      const resendData = await resendResponse.json()

      if (resendResponse.status >= 400) {
        console.error(`Failed to send email for network ${body.networkId}:`, resendData)
        return new Response(
          JSON.stringify({ success: false, error: resendData.message || 'Email send failed', details: resendData }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log(`Welcome email sent successfully for network "${body.networkName}"`)
      return new Response(
        JSON.stringify({
          success: true,
          message: `Welcome email sent to ${body.adminEmail}`,
          data: resendData
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Missing required parameters. Use testEmail for test mode, or adminEmail/networkName/networkId for production.'
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in send-network-welcome-email:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
