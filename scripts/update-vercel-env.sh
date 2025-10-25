#!/bin/bash

# Script to update Vercel environment variables
# Run: bash scripts/update-vercel-env.sh

echo "🚀 Updating Vercel Environment Variables..."
echo ""

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Login to Vercel (if not already logged in)
echo "🔐 Checking Vercel authentication..."
vercel whoami || vercel login

echo ""
echo "📝 Setting environment variables..."
echo ""

# Gemini API Key
vercel env add GEMINI_API_KEY production <<< "AIzaSyAtJUqQHsXvv7E0KoBcry1PNnPFj2B2xhk"
vercel env add GEMINI_API_KEY preview <<< "AIzaSyAtJUqQHsXvv7E0KoBcry1PNnPFj2B2xhk"
vercel env add GEMINI_API_KEY development <<< "AIzaSyAtJUqQHsXvv7E0KoBcry1PNnPFj2B2xhk"

# Site URL
vercel env add NEXT_PUBLIC_SITE_URL production <<< "https://lionsofzion.io"
vercel env add NEXT_PUBLIC_SITE_URL preview <<< "https://lionsofzion.io"
vercel env add NEXT_PUBLIC_SITE_URL development <<< "http://localhost:3000"

# Vercel KV (Upstash Redis)
vercel env add KV_URL production <<< "rediss://default:AXLRAAIncDI1OGMzNDM5Mzc3NjI0MjlkOGMzMjczZWI3YWM4Y2MyM3AyMjkzOTM@measured-werewolf-29393.upstash.io:6379"
vercel env add KV_URL preview <<< "rediss://default:AXLRAAIncDI1OGMzNDM5Mzc3NjI0MjlkOGMzMjczZWI3YWM4Y2MyM3AyMjkzOTM@measured-werewolf-29393.upstash.io:6379"
vercel env add KV_URL development <<< "rediss://default:AXLRAAIncDI1OGMzNDM5Mzc3NjI0MjlkOGMzMjczZWI3YWM4Y2MyM3AyMjkzOTM@measured-werewolf-29393.upstash.io:6379"

vercel env add KV_REST_API_URL production <<< "https://measured-werewolf-29393.upstash.io"
vercel env add KV_REST_API_URL preview <<< "https://measured-werewolf-29393.upstash.io"
vercel env add KV_REST_API_URL development <<< "https://measured-werewolf-29393.upstash.io"

vercel env add KV_REST_API_TOKEN production <<< "AXLRAAIncDI1OGMzNDM5Mzc3NjI0MjlkOGMzMjczZWI3YWM4Y2MyM3AyMjkzOTM"
vercel env add KV_REST_API_TOKEN preview <<< "AXLRAAIncDI1OGMzNDM5Mzc3NjI0MjlkOGMzMjczZWI3YWM4Y2MyM3AyMjkzOTM"
vercel env add KV_REST_API_TOKEN development <<< "AXLRAAIncDI1OGMzNDM5Mzc3NjI0MjlkOGMzMjczZWI3YWM4Y2MyM3AyMjkzOTM"

vercel env add KV_REST_API_READ_ONLY_TOKEN production <<< "AnLRAAIgcDKJegwy9q9h-ZmqthuqghHpcGzrnc-xiggBFqLp2lldpQ"
vercel env add KV_REST_API_READ_ONLY_TOKEN preview <<< "AnLRAAIgcDKJegwy9q9h-ZmqthuqghHpcGzrnc-xiggBFqLp2lldpQ"
vercel env add KV_REST_API_READ_ONLY_TOKEN development <<< "AnLRAAIgcDKJegwy9q9h-ZmqthuqghHpcGzrnc-xiggBFqLp2lldpQ"

vercel env add REDIS_URL production <<< "rediss://default:AXLRAAIncDI1OGMzNDM5Mzc3NjI0MjlkOGMzMjczZWI3YWM4Y2MyM3AyMjkzOTM@measured-werewolf-29393.upstash.io:6379"
vercel env add REDIS_URL preview <<< "rediss://default:AXLRAAIncDI1OGMzNDM5Mzc3NjI0MjlkOGMzMjczZWI3YWM4Y2MyM3AyMjkzOTM@measured-werewolf-29393.upstash.io:6379"
vercel env add REDIS_URL development <<< "rediss://default:AXLRAAIncDI1OGMzNDM5Mzc3NjI0MjlkOGMzMjczZWI3YWM4Y2MyM3AyMjkzOTM@measured-werewolf-29393.upstash.io:6379"

echo ""
echo "✅ Environment variables updated!"
echo ""
echo "📋 Next steps:"
echo "1. Add BLOB_READ_WRITE_TOKEN manually in Vercel Dashboard"
echo "2. Go to: https://vercel.com/lionsteam/newlihunt/settings/environment-variables"
echo "3. Connect Blob store: https://vercel.com/lionsteam/newlihunt/stores"
echo "4. Redeploy: vercel --prod"
echo ""
