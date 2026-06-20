#!/bin/bash
# Quick Fix: Enable Chatbot on Production
# This script shows how to fix the backend connection error

echo "🔧 KYLO-AI PRODUCTION FIX"
echo "========================"
echo ""

# Current Status
echo "📊 Current Status:"
echo "   ✅ Frontend: Deployed to Firebase"
echo "   ✅ Backend: Running on localhost:5001"
echo "   ❌ Issue: Frontend can't reach localhost from cloud"
echo ""

# Quick Fix Option 1
echo "🚀 QUICK FIX #1: Deploy Backend to Vercel"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Install Vercel CLI:"
echo "   npm install -g vercel"
echo ""
echo "2. Login:"
echo "   vercel login"
echo ""
echo "3. Go to backend:"
echo "   cd /e/KYLO-AI/backend"
echo ""
echo "4. Create vercel.json:"
cat > /e/KYLO-AI/backend/vercel.json << 'EOF'
{
  "version": 2,
  "builds": [
    {
      "src": "server-clean.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "server-clean.js"
    }
  ]
}
EOF
echo "   ✅ vercel.json created"
echo ""
echo "5. Deploy:"
echo "   cd /e/KYLO-AI/backend && vercel --prod"
echo ""
echo "   Note: This will ask for your API key, save it as secret"
echo "   Command: vercel env add CLAUDE_API_KEY"
echo ""

# Quick Fix Option 2
echo ""
echo "🚀 QUICK FIX #2: Rebuild with Production Config"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "After deploying backend to Vercel, get the URL:"
echo "   Example: https://kylo-backend.vercel.app"
echo ""
echo "Then update .env.local:"
echo "   VITE_API_BASE_URL=https://kylo-backend.vercel.app"
echo ""
echo "Rebuild frontend:"
echo "   npm run build"
echo ""
echo "Redeploy:"
echo "   firebase deploy --only hosting"
echo ""

# Quick Fix Option 3 (Fastest for testing)
echo ""
echo "⚡ QUICK FIX #3: For Local Testing"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Just run locally for now:"
echo "   cd /e/KYLO-AI"
echo "   npm run dev"
echo ""
echo "Then open: http://localhost:5173"
echo ""
echo "Backend must be running:"
echo "   cd /e/KYLO-AI/backend"
echo "   PORT=5001 CLAUDE_API_KEY=sk-ant-xxxxx node server-clean.js"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Choose one solution above and follow the steps"
echo ""
