// MUST ALWAYS BE DEPLOYED WITH "npx supabase functions deploy mailin-webhook-raw --no-verify-jwt"

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const REZOPROSPEC_NETWORK_ID = 'b4e51e21-de8f-4f5b-b35d-f98f6df27508'

// Decode quoted-printable content with charset support
function decodeQuotedPrintable(str: string, charset: string = 'utf-8'): string {
  try {
    // First handle soft line breaks (=\r?\n)
    let decoded = str.replace(/=\r?\n/g, '')

    // Replace quoted-printable sequences with their byte values
    decoded = decoded.replace(/=([0-9A-F]{2})/gi, (match, hex) => {
      return String.fromCharCode(parseInt(hex, 16))
    })

    // Now we have a string where each character represents a byte
    // Convert it to a proper string based on charset
    const bytes = new Uint8Array(decoded.length)
    for (let i = 0; i < decoded.length; i++) {
      bytes[i] = decoded.charCodeAt(i)
    }

    // Normalize charset name
    const normalizedCharset = charset.toLowerCase().replace(/[^a-z0-9]/g, '')

    // Map common charset names to TextDecoder names
    let decoderCharset = 'utf-8'
    if (normalizedCharset === 'windows1252' || normalizedCharset === 'cp1252' || normalizedCharset === 'iso88591') {
      decoderCharset = 'windows-1252'
    } else if (normalizedCharset === 'utf8' || normalizedCharset === 'utf-8') {
      decoderCharset = 'utf-8'
    } else if (normalizedCharset === 'iso88592') {
      decoderCharset = 'iso-8859-2'
    }

    // Decode with appropriate charset
    const decoder = new TextDecoder(decoderCharset, { fatal: false })
    return decoder.decode(bytes)
  } catch (e) {
    return str
  }
}

// Decode RFC 2047 encoded words in headers (e.g., =?UTF-8?Q?Test_mod=C3=A9ration?=)
function decodeEncodedWord(str: string): string {
  try {
    return str.replace(/=\?([^?]+)\?([BQ])\?([^?]+)\?=/gi, (match, charset, encoding, encoded) => {
      if (encoding.toUpperCase() === 'Q') {
        // Q-encoding (quoted-printable for headers)
        // First replace underscores with spaces
        let qEncoded = encoded.replace(/_/g, ' ')

        // Replace quoted-printable sequences with their byte values
        qEncoded = qEncoded.replace(/=([0-9A-F]{2})/gi, (match, hex) => {
          return String.fromCharCode(parseInt(hex, 16))
        })

        // Convert string of bytes to proper UTF-8 string
        const bytes = new Uint8Array(qEncoded.length)
        for (let i = 0; i < qEncoded.length; i++) {
          bytes[i] = qEncoded.charCodeAt(i)
        }

        // Decode as UTF-8
        const decoder = new TextDecoder('utf-8', { fatal: false })
        return decoder.decode(bytes)
      } else if (encoding.toUpperCase() === 'B') {
        // B-encoding (base64)
        // Decode base64 then handle as UTF-8
        const binaryString = atob(encoded)
        const bytes = new Uint8Array(binaryString.length)
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i)
        }
        const decoder = new TextDecoder('utf-8', { fatal: false })
        return decoder.decode(bytes)
      }
      return match
    })
  } catch (e) {
    return str
  }
}

// Extract Sympa moderation key from the moderation message
function extractSympaKey(text: string): string | null {
  // Look for DISTRIBUTE or REJECT URLs with the key
  const match = text.match(/(?:DISTRIBUTE|REJECT)\s+[\w-]+\s+([a-f0-9]{32})/i)
  return match ? match[1] : null
}

// Parse email headers into a map
function parseEmailHeaders(headerText: string): Map<string, string> {
  const headers = new Map<string, string>()
  const lines = headerText.split('\n')
  let currentHeader = ''
  let currentValue = ''

  for (const line of lines) {
    if (line.match(/^[A-Za-z-]+:\s/)) {
      // New header
      if (currentHeader) {
        headers.set(currentHeader.toLowerCase(), currentValue.trim())
      }
      const colonIndex = line.indexOf(':')
      currentHeader = line.substring(0, colonIndex)
      currentValue = line.substring(colonIndex + 1).trim()
    } else if (line.match(/^\s+/)) {
      // Continuation of previous header
      currentValue += ' ' + line.trim()
    }
  }

  if (currentHeader) {
    headers.set(currentHeader.toLowerCase(), currentValue.trim())
  }

  return headers
}

// Extract sender name and email from From header
function parseFromHeader(from: string): { name?: string, email: string } {
  const match = from.match(/^(.+?)\s*<([^>]+)>/)
  if (match) {
    return { name: match[1].replace(/^["']|["']$/g, '').trim(), email: match[2] }
  }
  return { email: from.trim() }
}

// Extract charset from Content-Type header
function extractCharset(contentType: string): string {
  const match = contentType.match(/charset=["']?([^"';\s]+)["']?/i)
  return match ? match[1] : 'utf-8'
}

/**
 * Convert HTML to plain text
 */
function htmlToText(html: string): string {
  // Remove script and style elements
  let text = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
  text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')

  // Replace <br> and <p> tags with newlines
  text = text.replace(/<br\s*\/?>/gi, '\n')
  text = text.replace(/<\/p>/gi, '\n\n')
  text = text.replace(/<p[^>]*>/gi, '')

  // Replace <div> and <li> tags with newlines
  text = text.replace(/<\/div>/gi, '\n')
  text = text.replace(/<div[^>]*>/gi, '')
  text = text.replace(/<\/li>/gi, '\n')
  text = text.replace(/<li[^>]*>/gi, '• ')

  // Remove all other HTML tags
  text = text.replace(/<[^>]+>/g, '')

  // Decode HTML entities
  text = text.replace(/&nbsp;/g, ' ')
  text = text.replace(/&amp;/g, '&')
  text = text.replace(/&lt;/g, '<')
  text = text.replace(/&gt;/g, '>')
  text = text.replace(/&quot;/g, '"')
  text = text.replace(/&#39;/g, "'")
  text = text.replace(/&([a-z]+);/gi, '') // Remove other entities

  // Clean up multiple newlines and spaces
  text = text.replace(/\n\s*\n\s*\n/g, '\n\n')
  text = text.replace(/[ \t]+/g, ' ')

  return text.trim()
}

/**
 * Auto-categorize annonce based on keywords
 * For Rezoprospec network (b4e51e21-de8f-4f5b-b35d-f98f6df27508),
 * only 'general', 'logement', and 'espaces_de_travail' are valid categories
 */
function autoCategorize(text: string): string | null {
  const lowerText = text.toLowerCase()

  // Logement (housing/real estate)
  if (/\b(appartement|logement|sous-loc|immobilier|location|loyer|studio|t1|t2|t3|t4|chambre|colocation|maison|bail|louer)\b/i.test(lowerText)) {
    return 'logement'
  }

  // Espaces de travail (workspaces/offices/workshops - physical places to work)
  if (/\b(atelier|workshop|bureau|office|espace de travail|coworking|co-working|local|locaux|showroom|salle|espace|studio|lieu de travail|open space|openspace)\b/i.test(lowerText)) {
    return 'espaces_de_travail'
  }

  // Default to 'general' for everything else
  return 'general'
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Check content type - we only handle multipart/form-data
    const contentType = req.headers.get('content-type') || ''
    if (!contentType.includes('multipart/form-data')) {
      console.error('ERROR: Invalid content type. Expected multipart/form-data, got:', contentType)
      return new Response(
        JSON.stringify({
          error: 'Invalid content type',
          message: 'Expected multipart/form-data'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    // Extract raw email from form data
    const formData = await req.formData()
    let rawEmail = ''
    for (const [key, value] of formData.entries()) {
      if (key === 'message' || key === 'raw' || key === 'email') {
        rawEmail = value.toString()
        break
      }
    }

    if (!rawEmail) {
      console.error('ERROR: No email content found in form data')
      return new Response(
        JSON.stringify({
          error: 'No email content found',
          message: 'Expected message, raw, or email field in form data'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    if (rawEmail) {

      // Normalize line endings to handle both \r\n and \n
      const normalizedEmail = rawEmail.replace(/\r\n/g, '\n')

      // Variables to store extracted data
      let sympaKey: string | null = null
      let originalSender = { email: '', name: '' }
      let originalSubject = ''
      let originalPlainContent = ''
      let originalHtmlContent = ''

      // Try to identify MIME boundaries
      const boundaryMatch = normalizedEmail.match(/boundary="?([^"\s]+)"?/i)
      if (boundaryMatch) {
        // Split by boundary
        const boundary = boundaryMatch[1]
        const parts = normalizedEmail.split(`--${boundary}`)

        for (const [index, part] of parts.entries()) {
          if (part.trim() && !part.startsWith('--')) {
            // Get headers and body of this part
            const headerEndIndex = part.indexOf('\n\n')
            const headers = headerEndIndex > -1 ? part.substring(0, headerEndIndex) : part
            const body = headerEndIndex > -1 ? part.substring(headerEndIndex + 2) : ''

            // Check if this is the moderation message (first text/plain)
            if (headers.includes('Content-Type: TEXT/PLAIN') && !sympaKey) {
              sympaKey = extractSympaKey(body)
            }

            // Check if this is an embedded message
            if (headers.includes('message/rfc822')) {

              // Parse the embedded message
              const embeddedHeaderEnd = body.indexOf('\n\n')
              if (embeddedHeaderEnd > -1) {
                const embeddedHeaders = body.substring(0, embeddedHeaderEnd)
                const embeddedBody = body.substring(embeddedHeaderEnd + 2)

                // Parse headers
                const headerMap = parseEmailHeaders(embeddedHeaders)

                // Extract sender
                const fromHeader = headerMap.get('from')
                if (fromHeader) {
                  const sender = parseFromHeader(fromHeader)
                  originalSender.email = sender.email
                  originalSender.name = sender.name ? decodeEncodedWord(sender.name) : ''
                }

                // Extract subject
                const subjectHeader = headerMap.get('subject')
                if (subjectHeader) {
                  originalSubject = decodeEncodedWord(subjectHeader)
                }

                // Look for boundary in the Content-Type header of the embedded message
                const embeddedContentType = headerMap.get('content-type') || ''
                let embeddedBoundary: string | null = null

                // Extract boundary from Content-Type header
                const boundaryFromHeader = embeddedContentType.match(/boundary=["']?([^"'\s;]+)["']?/i)
                if (boundaryFromHeader) {
                  embeddedBoundary = boundaryFromHeader[1]
                }

                // If we have a boundary, parse the multipart content
                if (embeddedBoundary) {
                  const embeddedParts = embeddedBody.split(`--${embeddedBoundary}`)

                  for (const [partIndex, embPart] of embeddedParts.entries()) {
                    if (embPart.trim() && !embPart.startsWith('--')) {
                      const embPartHeaderEnd = embPart.indexOf('\n\n')
                      const embPartHeaders = embPartHeaderEnd > -1 ? embPart.substring(0, embPartHeaderEnd) : embPart
                      let embPartBody = embPartHeaderEnd > -1 ? embPart.substring(embPartHeaderEnd + 2) : ''

                      // Parse headers for this part
                      const partHeaderMap = parseEmailHeaders(embPartHeaders)
                      const contentType = partHeaderMap.get('content-type') || ''
                      const transferEncoding = partHeaderMap.get('content-transfer-encoding') || ''
                      const charset = extractCharset(contentType)

                      // Debug logging
                      console.log(`Part content-type: ${contentType}`)
                      console.log(`Part charset: ${charset}`)
                      console.log(`Part transfer-encoding: ${transferEncoding}`)
                      console.log(`Raw body first 200 chars: ${embPartBody.substring(0, 200)}`)

                      // Check if body looks like base64 regardless of what the header says
                      const looksLikeBase64 = /^[A-Za-z0-9+/\s=]+$/.test(embPartBody.substring(0, 500).replace(/[\r\n]/g, ''))

                      // Decode based on transfer encoding (or detected encoding)
                      if (looksLikeBase64 && embPartBody.length > 50) {
                        // If it looks like base64, decode as base64
                        console.log('Content appears to be base64 encoded, decoding as base64...')
                        try {
                          const cleanBase64 = embPartBody.replace(/\s/g, '')
                          const binaryString = atob(cleanBase64)
                          // Convert binary string using the declared charset
                          const bytes = new Uint8Array(binaryString.length)
                          for (let i = 0; i < binaryString.length; i++) {
                            bytes[i] = binaryString.charCodeAt(i)
                          }

                          // Use appropriate decoder based on charset
                          const normalizedCharset = charset.toLowerCase().replace(/[^a-z0-9]/g, '')
                          let decoderCharset = 'utf-8'
                          if (normalizedCharset === 'windows1252' || normalizedCharset === 'cp1252' || normalizedCharset === 'iso88591') {
                            decoderCharset = 'windows-1252'
                          }

                          const decoder = new TextDecoder(decoderCharset, { fatal: false })
                          embPartBody = decoder.decode(bytes)
                        } catch (e) {
                          console.error('Failed to decode as base64, falling back to original decoding:', e)
                          // Fall back to the declared encoding
                          if (transferEncoding.toLowerCase().includes('quoted-printable')) {
                            embPartBody = decodeQuotedPrintable(embPartBody, charset)
                          }
                        }
                      } else if (transferEncoding.toLowerCase().includes('quoted-printable')) {
                        embPartBody = decodeQuotedPrintable(embPartBody, charset)
                      } else if (transferEncoding.toLowerCase().includes('base64')) {
                        try {
                          const cleanBase64 = embPartBody.replace(/\s/g, '')
                          const binaryString = atob(cleanBase64)
                          // Convert binary string using the declared charset
                          const bytes = new Uint8Array(binaryString.length)
                          for (let i = 0; i < binaryString.length; i++) {
                            bytes[i] = binaryString.charCodeAt(i)
                          }

                          // Use appropriate decoder based on charset
                          const normalizedCharset = charset.toLowerCase().replace(/[^a-z0-9]/g, '')
                          let decoderCharset = 'utf-8'
                          if (normalizedCharset === 'windows1252' || normalizedCharset === 'cp1252' || normalizedCharset === 'iso88591') {
                            decoderCharset = 'windows-1252'
                          }

                          const decoder = new TextDecoder(decoderCharset, { fatal: false })
                          embPartBody = decoder.decode(bytes)
                        } catch (e) {
                          console.error('Failed to decode base64 content')
                        }
                      } else if (transferEncoding.toLowerCase() === '8bit' || transferEncoding.toLowerCase() === '7bit' || !transferEncoding) {
                        // For 8bit, 7bit, or no encoding, the content might need charset conversion
                        // If charset is Windows-1252, we need to convert it
                        if (charset.toLowerCase().includes('windows-1252') || charset.toLowerCase().includes('iso-8859')) {
                          try {
                            // The string is likely already in the wrong encoding
                            // Convert each character code to a byte and decode with proper charset
                            const bytes = new Uint8Array(embPartBody.length)
                            for (let i = 0; i < embPartBody.length; i++) {
                              bytes[i] = embPartBody.charCodeAt(i) & 0xFF
                            }

                            const normalizedCharset = charset.toLowerCase().replace(/[^a-z0-9]/g, '')
                            let decoderCharset = 'utf-8'
                            if (normalizedCharset === 'windows1252' || normalizedCharset === 'cp1252' || normalizedCharset === 'iso88591') {
                              decoderCharset = 'windows-1252'
                            }

                            const decoder = new TextDecoder(decoderCharset, { fatal: false })
                            embPartBody = decoder.decode(bytes)
                          } catch (e) {
                            console.error('Failed to convert charset:', e)
                          }
                        }
                      }

                      // Store content based on type
                      if (contentType.includes('text/plain')) {
                        originalPlainContent = embPartBody.trim()
                      } else if (contentType.includes('text/html')) {
                        originalHtmlContent = embPartBody.trim()
                      }
                    }
                  }
                } else {
                  // No multipart boundary found

                  // Check if there's a Content-Transfer-Encoding header in the embedded message headers
                  const transferEncoding = headerMap.get('content-transfer-encoding') || ''
                  const contentType = headerMap.get('content-type') || ''
                  const charset = extractCharset(contentType)
                  let decodedBody = embeddedBody

                  console.log(`Single-part content-type: ${contentType}`)
                  console.log(`Single-part charset: ${charset}`)
                  console.log(`Single-part transfer-encoding: ${transferEncoding}`)
                  console.log(`Single-part raw body first 200 chars: ${embeddedBody.substring(0, 200)}`)

                  if (transferEncoding.toLowerCase().includes('quoted-printable')) {
                    decodedBody = decodeQuotedPrintable(embeddedBody, charset)
                  } else if (transferEncoding.toLowerCase().includes('base64')) {
                    try {
                      const cleanBase64 = embeddedBody.replace(/\s/g, '')
                      const binaryString = atob(cleanBase64)
                      // Convert binary string using the declared charset
                      const bytes = new Uint8Array(binaryString.length)
                      for (let i = 0; i < binaryString.length; i++) {
                        bytes[i] = binaryString.charCodeAt(i)
                      }

                      // Use appropriate decoder based on charset
                      const normalizedCharset = charset.toLowerCase().replace(/[^a-z0-9]/g, '')
                      let decoderCharset = 'utf-8'
                      if (normalizedCharset === 'windows1252' || normalizedCharset === 'cp1252' || normalizedCharset === 'iso88591') {
                        decoderCharset = 'windows-1252'
                      }

                      const decoder = new TextDecoder(decoderCharset, { fatal: false })
                      decodedBody = decoder.decode(bytes)
                    } catch (e) {
                      console.error('Failed to decode base64 content')
                    }
                  } else if (transferEncoding.toLowerCase() === '8bit' || transferEncoding.toLowerCase() === '7bit' || !transferEncoding) {
                    // For 8bit, 7bit, or no encoding, the content might need charset conversion
                    // If charset is Windows-1252, we need to convert it
                    if (charset.toLowerCase().includes('windows-1252') || charset.toLowerCase().includes('iso-8859')) {
                      try {
                        // The string is likely already in the wrong encoding
                        // Convert each character code to a byte and decode with proper charset
                        const bytes = new Uint8Array(decodedBody.length)
                        for (let i = 0; i < decodedBody.length; i++) {
                          bytes[i] = decodedBody.charCodeAt(i) & 0xFF
                        }

                        const normalizedCharset = charset.toLowerCase().replace(/[^a-z0-9]/g, '')
                        let decoderCharset = 'utf-8'
                        if (normalizedCharset === 'windows1252' || normalizedCharset === 'cp1252' || normalizedCharset === 'iso88591') {
                          decoderCharset = 'windows-1252'
                        }

                        const decoder = new TextDecoder(decoderCharset, { fatal: false })
                        decodedBody = decoder.decode(bytes)
                      } catch (e) {
                        console.error('Failed to convert charset:', e)
                      }
                    }
                  }

                  // Check content type
                  if (contentType.includes('text/html')) {
                    originalHtmlContent = decodedBody.trim()
                  } else {
                    originalPlainContent = decodedBody.trim()
                  }
                }
              }
            }
          }
        }
      }

      // Check if we have the required data to save
      if (!originalSender.email) {
        console.warn('⚠️ No sender email found, skipping database save')
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Missing sender email'
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          }
        )
      }

      // Use plain text content, or convert HTML to text, fall back to subject if no content
      let content = originalPlainContent
      if (!content && originalHtmlContent) {
        content = htmlToText(originalHtmlContent)
      }
      if (!content) {
        content = originalSubject || 'Contenu du message à modéré'
      }

      // Use subject, fall back to first line of content if no subject
      const subject = originalSubject || content.split('\n')[0].substring(0, 150) || 'Message sans objet'

      // Auto-categorize based on subject and content
      const category = autoCategorize(subject + ' ' + content)

      // Create Supabase client
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      const supabase = createClient(supabaseUrl, supabaseKey)

      // Insert into database
      const { data, error } = await supabase
        .from('annonces_moderation')
        .insert({
          network_id: REZOPROSPEC_NETWORK_ID,
          sender_email: originalSender.email,
          sender_name: originalSender.name || originalSender.email.split('@')[0],
          subject: subject,
          content: content.substring(0, 20000), // Limit to 20000 chars
          category: category,
          status: 'pending',
          sympa_ticket_id: '0', // No ticket ID for direct emails
          sympa_auth_token: sympaKey || '', // Use extracted key if available
          original_email_date: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        console.error('❌ Database error:', error)
        throw error
      }

      console.log(`✅ Successfully created annonce with ID: ${data.id}`)
      console.log(`   From: ${originalSender.name} <${originalSender.email}>`)
      console.log(`   Subject: ${subject}`)
      console.log(`   Category: ${category || 'none'}`)

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
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: 'No email content to process'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )

  } catch (error) {
    console.error('ERROR processing raw webhook:', error)
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})