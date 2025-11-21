#!/bin/bash

# Test script for OG metadata serverless function
# Usage: ./test-og-meta.sh [invitation_code]

CODE=${1:-"5B1E7D90"}
URL="https://www.conclav.club"

echo "🧪 Testing OG Metadata for invitation code: $CODE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "📍 Test 1: Direct API route access"
echo "URL: $URL/api/invitation/$CODE"
echo "---"
RESPONSE=$(curl -s "$URL/api/invitation/$CODE")
if echo "$RESPONSE" | grep -q "X-OG-Function\|OG-META"; then
    echo "✅ Serverless function is responding!"
    echo "$RESPONSE" | grep -E "og:title|og:image" | head -3
else
    echo "❌ Still serving static HTML"
    echo "$RESPONSE" | grep -E "og:title|og:image" | head -3
fi
echo ""

echo "📍 Test 2: /join/:code route"
echo "URL: $URL/join/$CODE"
echo "---"
RESPONSE2=$(curl -s "$URL/join/$CODE")
if echo "$RESPONSE2" | grep -q "Join.*on Conclav" && ! echo "$RESPONSE2" | grep -q "Conclav micronetworks"; then
    echo "✅ Dynamic OG tags detected!"
    echo "$RESPONSE2" | grep -E "og:title|og:description|og:image" | head -5
else
    echo "❌ Still showing generic tags"
    echo "$RESPONSE2" | grep -E "og:title|og:description" | head -2
fi
echo ""

echo "📍 Test 3: Check custom headers"
echo "---"
HEADERS=$(curl -sI "$URL/api/invitation/$CODE")
if echo "$HEADERS" | grep -q "X-OG-Function"; then
    echo "✅ Custom headers found:"
    echo "$HEADERS" | grep "X-OG"
else
    echo "❌ No custom headers (function not invoked)"
fi
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Summary:"
if echo "$RESPONSE" | grep -q "OG-META" || echo "$HEADERS" | grep -q "X-OG-Function"; then
    echo "✅ Serverless function is working!"
    echo "   Next: Test with social media debuggers:"
    echo "   - https://developers.facebook.com/tools/debug/"
    echo "   - https://cards-dev.twitter.com/validator"
    echo "   - https://www.opengraph.xyz/"
else
    echo "⏳ Waiting for Vercel deployment..."
    echo "   Check Vercel dashboard for deployment status"
    echo "   Run this script again in 1-2 minutes"
fi
