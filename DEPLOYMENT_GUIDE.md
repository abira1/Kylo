# KYLO-AI Deployment Guide

## Overview
This document outlines how to deploy KYLO-AI to production. The system has two components:
1. **Frontend**: React + Vite app (deployed on Vercel)
2. **Backend**: Express.js API (can be deployed on Vercel or separate Node.js host)

## Current State
- ✅ Frontend builds successfully
- ✅ Backend runs locally on port 5001
- ✅ KB upload feature implemented and tested
- ✅ Claude integration working
- ✅ Firebase integration complete

## Deployment Options

### Option 1: Vercel (Recommended for simplicity)
Deploy both frontend and backend on Vercel.

#### Frontend Deployment
1. Push code to GitHub (if not already done)
2. Connect GitHub repo to Vercel project
3. Set environment variables in Vercel dashboard:
   ```
   VITE_API_BASE_URL=https://kylo-ai.vercel.app/api
   VITE_FIREBASE_API_KEY=<your-key>
   VITE_FIREBASE_AUTH_DOMAIN=<your-domain>
   VITE_FIREBASE_PROJECT_ID=<your-project>
   VITE_FIREBASE_STORAGE_BUCKET=<your-bucket>
   VITE_FIREBASE_MESSAGING_SENDER_ID=<your-id>
   VITE_FIREBASE_APP_ID=<your-app-id>
   VITE_APP_URL=https://kylo-ai.vercel.app
   ```
4. Vercel will auto-deploy on GitHub push

#### Backend as Vercel Functions
Convert `backend/server-clean.js` to serverless functions:
- Create `api/` directory in root
- Split endpoints into separate function files (e.g., `api/chat.js`, `api/health.js`)
- Reference: https://vercel.com/docs/functions/serverless-functions

**Current Limitation**: The standalone Express server structure would need refactoring to use Vercel Functions.

### Option 2: Railway or Render (Recommended for full backend)
Deploy Express backend on a Node.js host.

#### Steps
1. Create account on Railway.app or Render.com
2. Connect GitHub repo
3. Set environment variables:
   ```
   PORT=5001
   ANTHROPIC_API_KEY=<your-key>
   NODE_ENV=production
   FIREBASE_PROJECT_ID=<your-project>
   FIREBASE_PRIVATE_KEY_ID=<your-key-id>
   FIREBASE_PRIVATE_KEY=<your-private-key>
   FIREBASE_CLIENT_EMAIL=<your-email>
   FIREBASE_CLIENT_ID=<your-client-id>
   FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
   FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
   FIREBASE_AUTH_PROVIDER_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
   FIREBASE_CLIENT_CERT_URL=<your-cert-url>
   ```
4. Deploy from GitHub
5. Update `VITE_API_BASE_URL` in frontend to: `https://<your-railway-url>`

### Option 3: Traditional VPS (Full Control)
Deploy on your own server (AWS EC2, DigitalOcean, etc.).

## Recommended Approach: Option 2 (Railway)

### Step-by-Step for Railway Deployment

1. **Sign up on Railway.app**
   - Create account and GitHub connection

2. **Create Project**
   - Select "Deploy from GitHub"
   - Choose the KYLO-AI repository
   - Select `/backend` as the deployment directory

3. **Configure Environment**
   - Set variables as shown above
   - Add Firebase service account JSON contents

4. **Deploy**
   - Railway auto-deploys on GitHub push
   - Get your production URL (e.g., `https://kylo-ai-prod.railway.app`)

5. **Update Frontend**
   - Add Vercel environment variable:
     ```
     VITE_API_BASE_URL=https://kylo-ai-prod.railway.app
     ```
   - Redeploy frontend on Vercel

## Environment Variables

### Firebase Service Account
Generate at: https://console.firebase.google.com
- Project Settings → Service Accounts → Generate new private key
- Store the JSON file securely

### Anthropic API Key
- Get from: https://console.anthropic.com/account/keys
- Keep secret, never commit to repository

## Testing Post-Deployment

1. **Health Check**
   ```bash
   curl https://your-api-domain/api/health
   ```
   Expected: `{"status":"ok","claudeApiConfigured":true}`

2. **Chat Endpoint**
   ```bash
   curl -X POST https://your-api-domain/api/chat \
     -H "Content-Type: application/json" \
     -d '{
       "clientId": "test_user",
       "conversationId": "test_conv_001",
       "messages": [{"role": "user", "content": "Hello"}],
       "qaContext": {}
     }'
   ```

3. **KB Upload**
   ```bash
   curl -X POST https://your-api-domain/api/admin/kb/upload \
     -F "file=@knowledge.txt"
   ```

## Custom Domain Setup

1. **Get a domain** from GoDaddy, Namecheap, etc.
2. **Point domain to your hosting**:
   - For Vercel: Add custom domain in Vercel dashboard
   - For Railway: Use CNAME to `railway.app` DNS

3. **Update .env files**:
   ```
   VITE_APP_URL=https://yourdomain.com
   VITE_API_BASE_URL=https://api.yourdomain.com (or same domain if routed)
   ```

## Database Backup

Firebase Firestore is managed by Google. Ensure backups are enabled:
1. Firebase Console → Firestore → Backups
2. Enable regular backups (if using Blaze plan)

## Monitoring & Logs

- **Vercel**: Deployment tab → Function logs
- **Railway**: Railway dashboard → Deployments → Logs
- **Firebase**: Firebase Console → Firestore → Monitoring

## Troubleshooting

### "API connection error" in frontend
- Check `VITE_API_BASE_URL` is set correctly
- Verify backend is running and accessible
- Check CORS settings in backend

### "Client not found" error
- This is expected for new clients
- Auto-provisioning should create the client automatically
- Check Firebase rules allow writes

### Knowledge base not loading
- Verify KB upload endpoint returns success
- Check Firestore `knowledgeBases/global` collection exists
- Ensure documents array is properly formatted

## Next Steps

1. Choose deployment platform (recommended: Railway for backend)
2. Set up production Firebase project
3. Generate Anthropic API key
4. Configure environment variables
5. Deploy and test
6. Set up custom domain
7. Monitor logs and performance

---

**Support**: Check the accompanying documentation files for more details on specific components.
