// Local test for the OG serverless function logic
// Run with: node test-og-function.js

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://etoxvocwsktguoddmgcu.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const APP_URL = process.env.VITE_APP_URL || 'https://www.conclav.club';

async function testOGFunction(code, userAgent) {
  console.log('\n=== Testing OG Function ===');
  console.log(`Code: ${code}`);
  console.log(`User-Agent: ${userAgent}`);

  // Check if it's a bot/crawler
  const isCrawler = /bot|crawler|spider|crawling|facebookexternalhit|Twitterbot|LinkedInBot|WhatsApp|Slackbot|Discordbot|Telegram|facebot|ia_archiver/i.test(userAgent);
  console.log(`Is Crawler: ${isCrawler}`);

  if (!isCrawler) {
    console.log('✅ Would redirect to: /?redirect=/join/' + code);
    return;
  }

  // For crawlers, fetch network data
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/network_invitation_links?code=eq.${code.toUpperCase()}&is_active=eq.true&select=*,networks!inner(id,name,description,logo_url,background_image_url)`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
      }
    );

    const data = await response.json();

    if (!data || data.length === 0) {
      console.log('❌ Invitation not found or inactive');
      return;
    }

    const invitation = data[0];
    const network = invitation.networks;
    console.log('\n✅ Network found:');
    console.log(`  Name: ${network.name}`);
    console.log(`  Description: ${network.description?.substring(0, 80)}...`);
    console.log(`  Logo URL: ${network.logo_url}`);

    // Check logo size
    if (network.logo_url) {
      const logoResponse = await fetch(network.logo_url, { method: 'HEAD' });
      const size = parseInt(logoResponse.headers.get('content-length') || '0');
      const sizeKB = (size / 1024).toFixed(2);
      console.log(`  Logo Size: ${sizeKB} KB ${size < 300000 ? '✅' : '❌ (too large for WhatsApp)'}`);
    }

    console.log('\n✅ OG Tags would show:');
    console.log(`  og:title = "Join ${network.name} on Conclav"`);
    console.log(`  og:description = "${network.description?.replace(/<[^>]*>/g, '').substring(0, 80)}..."`);
    console.log(`  og:image = "${network.logo_url}"`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Test cases
(async () => {
  await testOGFunction('5B1E7D90', 'facebookexternalhit/1.0');
  await testOGFunction('5B1E7D90', 'WhatsApp/2.0');
  await testOGFunction('5B1E7D90', 'Mozilla/5.0 (regular browser)');

  console.log('\n=== Test Complete ===\n');
})();
