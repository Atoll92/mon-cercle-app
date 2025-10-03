// Edge Function: process-sympa-email
// Purpose: Receive and parse Sympa moderation emails from Gmail Apps Script webhook
/// <reference types="https://esm.sh/@types/node@18/index.d.ts" />

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const REZOPROSPEC_NETWORK_ID = 'b4e51e21-de8f-4f5b-b35d-f98f6df27508'

interface EmailData {
  from: string
  to?: string
  subject: string
  body: string
  html?: string
  date: string
}

interface ParsedSympaData {
  authToken: string
  ticketId: string
  senderEmail: string
  senderName: string
  subject: string
  content: string
  category: string | null
  date: string
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (req.method !== 'POST') {
      throw new Error('Method not allowed')
    }

    console.log('📧 Received email webhook from Gmail Apps Script')

    const emailData: EmailData = await req.json()

    console.log(`Email from: ${emailData.from}`)
    console.log(`Subject: ${emailData.subject}`)

    // Parse Sympa moderation email
    const parsedData = parseSympaEmail(emailData)

    if (!parsedData) {
      console.warn('⚠️ Email is not a valid Sympa moderation email')
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Not a Sympa moderation email or missing required fields'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log(`✅ Parsed Sympa email:`)
    console.log(`   Ticket ID: ${parsedData.ticketId}`)
    console.log(`   AUTH Token: ${parsedData.authToken}`)
    console.log(`   Sender: ${parsedData.senderName} <${parsedData.senderEmail}>`)
    console.log(`   Category: ${parsedData.category || 'none'}`)

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Check if this ticket already exists (prevent duplicates)
    const { data: existing } = await supabase
      .from('annonces_moderation')
      .select('id')
      .eq('sympa_ticket_id', parsedData.ticketId)
      .single()

    if (existing) {
      console.log(`⚠️ Ticket ${parsedData.ticketId} already exists, skipping`)
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Ticket already exists',
          annonceId: existing.id,
          duplicate: true
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Insert into database
    const { data, error } = await supabase
      .from('annonces_moderation')
      .insert({
        network_id: REZOPROSPEC_NETWORK_ID,
        sender_email: parsedData.senderEmail,
        sender_name: parsedData.senderName,
        subject: parsedData.subject,
        content: parsedData.content,
        category: parsedData.category,
        status: 'pending',
        sympa_ticket_id: parsedData.ticketId,
        sympa_auth_token: parsedData.authToken,
        original_email_date: parsedData.date
      })
      .select()
      .single()

    if (error) {
      console.error('❌ Database error:', error)
      throw error
    }

    console.log(`✅ Successfully created annonce with ID: ${data.id}`)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Annonce created successfully',
        annonceId: data.id
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('❌ Error processing Sympa email:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Internal server error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

/**
 * Parse Sympa moderation email to extract required information
 */
function parseSympaEmail(email: EmailData): ParsedSympaData | null {
  const body = email.body

  console.log('🔍 Parsing email body...')

  // Extract AUTH token/hash from multiple formats:
  // Format 1: "AUTH 8d287915 ADD rezoprospec user@example.com"
  // Format 2: "DISTRIBUTE rezoprospec 2ef98fd2039fada878179fe92d6d9d77"
  let authToken: string | null = null

  // Try Format 1 (AUTH command)
  const authMatch = body.match(/AUTH\s+([a-z0-9]+)/i)
  if (authMatch) {
    authToken = authMatch[1]
  }

  // Try Format 2 (DISTRIBUTE/REJECT with hash)
  if (!authToken) {
    const distributeMatch = body.match(/(?:DISTRIBUTE|REJECT)\s+\w+\s+([a-z0-9]{32,})/i)
    if (distributeMatch) {
      authToken = distributeMatch[1]
    }
  }

  // Extract ticket ID from URL like: "https://lists.riseup.net/www/ticket/35136367739771"
  const ticketMatch = body.match(/ticket\/(\d+)/i)
  const ticketId = ticketMatch ? ticketMatch[1] : null

  // Extract sender email from multiple sources:
  // 1. From forwarded message header: "From: Name <email@example.com>"
  // 2. From ADD command: "ADD rezoprospec user@example.com"
  // 3. From beginning of email: "new message for list rezoprospec from email@example.com"
  let senderEmail: string | null = null

  // Try forwarded message format
  const forwardedFromMatch = body.match(/^From:\s*(?:.*?<)?([\w.+-]+@[\w.-]+\.\w+)/im)
  if (forwardedFromMatch) {
    senderEmail = forwardedFromMatch[1]
  }

  // Try ADD command format
  if (!senderEmail) {
    const addMatch = body.match(/ADD\s+\w+\s+([\w.+-]+@[\w.-]+\.\w+)/i)
    if (addMatch) {
      senderEmail = addMatch[1]
    }
  }

  // Try "new message from" format
  if (!senderEmail) {
    const newMessageMatch = body.match(/new message.*?from\s+([\w.+-]+@[\w.-]+\.\w+)/i)
    if (newMessageMatch) {
      senderEmail = newMessageMatch[1]
    }
  }

  // Validate required fields
  if (!authToken || !ticketId || !senderEmail) {
    console.warn('Missing required fields:')
    console.warn(`  AUTH token: ${authToken || 'MISSING'}`)
    console.warn(`  Ticket ID: ${ticketId || 'MISSING'}`)
    console.warn(`  Sender email: ${senderEmail || 'MISSING'}`)
    return null
  }

  // Extract original message subject (look for Subject: or Objet: in forwarded message)
  let subject = 'Message sans objet'
  const subjectMatch = body.match(/(?:Subject|Objet):\s*(.+?)(?:\n|$)/im)
  if (subjectMatch) {
    subject = subjectMatch[1].trim()
    // Remove any "Re:" or "Fwd:" prefixes
    subject = subject.replace(/^(?:Re|Fwd|TR):\s*/i, '').trim()
  }

  // Extract sender name from forwarded message header
  let senderName = senderEmail.split('@')[0] // Default to email username
  const nameMatch = body.match(/^(?:From|De):\s*(.+?)\s*[<\n]/im)
  if (nameMatch) {
    senderName = nameMatch[1].trim()
    // Clean up common email format "Name <email>" → "Name"
    senderName = senderName.replace(/[<>]/g, '').trim()
  }

  // Extract message content from forwarded message
  let content = 'Contenu du message à modérer'

  // DEBUG: Log the body to see structure
  console.log('📧 Full email body for content extraction:')
  console.log(body.substring(0, 1500)) // First 1500 chars
  console.log('--- END DEBUG ---')

  // Method 1: Look for content after forwarded message headers
  // The content is typically after the forwarded message delimiter and headers
  const forwardedSectionMatch = body.match(/---------- Forwarded message ----------(.+?)$/is)
  if (forwardedSectionMatch) {
    const forwardedBody = forwardedSectionMatch[1]
    console.log('✅ Found forwarded section, length:', forwardedBody.length)

    // Extract content after all headers (From, Date, Subject, To)
    const contentMatch = forwardedBody.match(/^(?:From|Date|Subject|To|De|Objet):.+?\n(?:(?:From|Date|Subject|To|De|Objet):.+?\n)*\n(.+)$/ims)
    if (contentMatch) {
      content = contentMatch[1].trim()
      console.log('✅ Extracted content via regex, length:', content.length)
    } else {
      console.log('❌ Content regex did not match, trying simpler pattern')
      // Simpler fallback: just get everything after the To: line
      const simpleMatch = forwardedBody.match(/To:.+?\n\n(.+)$/is)
      if (simpleMatch) {
        content = simpleMatch[1].trim()
        console.log('✅ Extracted via simple pattern, length:', content.length)
      }
    }
  } else {
    console.log('❌ No forwarded section found in email body')
  }

  // Fallback methods if forwarded section not found
  if (content === 'Contenu du message à modérer') {
    // Method 2: Extract content after "To: rezoprospec@lists.riseup.net" line
    const toLineMatch = body.match(/To:\s*rezoprospec@lists\.riseup\.net\s*[\r\n]+\s*[\r\n]+(.+?)(?:[\r\n]{2,}-{2,}|[\r\n]+Or:|$)/is)
    if (toLineMatch) {
      content = toLineMatch[1].trim()
      console.log('✅ Extracted content after To: line, length:', content.length)
    } else {
      // Method 3: Try generic "To:" followed by content
      const genericToMatch = body.match(/To:\s*.+?[\r\n]+\s*[\r\n]+(.+?)(?:[\r\n]{2,}-{2,}|[\r\n]+Or:|$)/is)
      if (genericToMatch) {
        content = genericToMatch[1].trim()
        console.log('✅ Extracted via generic To: pattern, length:', content.length)
      } else {
        // Method 4: Get everything after Subject: line with blank line
        const afterSubjectMatch = body.match(/Subject:\s*.+?[\r\n]+[\r\n]+(.+?)(?:[\r\n]{2,}-{2,}|[\r\n]+Or:|$)/is)
        if (afterSubjectMatch) {
          content = afterSubjectMatch[1].trim()
          console.log('✅ Extracted after Subject:, length:', content.length)
        } else {
          // Method 5: Look for quoted content (lines starting with >)
          const quotedLines = body
            .split('\n')
            .filter(line => line.trim().startsWith('>'))
            .map(line => line.replace(/^>\s*/, ''))
            .join('\n')
            .trim()

          if (quotedLines.length > 50) {
            content = quotedLines
            console.log('✅ Extracted quoted content, length:', content.length)
          }
        }
      }
    }
  }

  // Limit content length
  if (content.length > 5000) {
    content = content.substring(0, 5000) + '...'
  }

  // Auto-categorize based on subject and content
  const category = autoCategorize(subject + ' ' + content)

  return {
    authToken,
    ticketId,
    senderEmail,
    senderName,
    subject,
    content,
    category,
    date: email.date
  }
}

/**
 * Auto-categorize annonce based on keywords
 */
function autoCategorize(text: string): string | null {
  const lowerText = text.toLowerCase()

  // Immobilier
  if (/\b(appartement|logement|sous-loc|immobilier|location|loyer|studio|t2|t3|chambre|colocation)\b/i.test(lowerText)) {
    return 'immobilier'
  }

  // Ateliers
  if (/\b(atelier|workshop|formation|stage|training)\b/i.test(lowerText)) {
    return 'ateliers'
  }

  // Cours
  if (/\b(cours|leçon|professeur|enseignement|prof|particulier|soutien)\b/i.test(lowerText)) {
    return 'cours'
  }

  // Matériel
  if (/\b(vends|vend|matériel|équipement|matos|sono|instrument|micro|ampli)\b/i.test(lowerText)) {
    return 'materiel'
  }

  // Échange
  if (/\b(échange|troc|swap|contre|échangerais)\b/i.test(lowerText)) {
    return 'echange'
  }

  // Casting
  if (/\b(casting|audition|comédien|acteur|actrice|tournage|film|court-métrage|rôle)\b/i.test(lowerText)) {
    return 'casting'
  }

  // Dons
  if (/\b(don|donne|gratuit|offre|gratuitement|gratos)\b/i.test(lowerText)) {
    return 'dons'
  }

  // Annonces (catch-all for announcements)
  if (/\b(annonce|propose|cherche|recherche|demande)\b/i.test(lowerText)) {
    return 'annonces'
  }

  return null // No category detected
}
