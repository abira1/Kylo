# CRM Integration - Backend Deployment Guide

## 📋 Complete Deployment Steps

This guide walks you through deploying the KYLO backend with Zoho CRM integration to Vercel.

---

## ✅ **STEP 1: Get Zoho OAuth Credentials**

### 1. Create Zoho Developer Account
1. Go to: **https://accounts.zoho.com/developerconsole**
2. Sign in with your Zoho account (or create one)
3. Click **"Add Client"** or **"Create Application"**
4. Select: **Server-based Applications**

### 2. Register Your Backend Application
- **App Name:** `KYLO CRM Integration`
- **Homepage URL:** `https://kylo-support.web.app`
- **Authorized Redirect URIs:** 
  - Development: `http://localhost:5001/api/crm/oauth/callback`
  - Production: `https://YOUR_BACKEND_DOMAIN.com/api/crm/oauth/callback`
  - (We'll update this after backend is deployed)
- **Description:** CRM integration for lead management

### 3. Copy Credentials
After creating the app, you'll see:
- **Client ID** (starts with `1000.`)
- **Client Secret** (long string)

**Save these securely!** You'll need them in Step 4.

---

## 🔑 **STEP 2: Prepare Environment Variables**

Your backend needs these environment variables configured:

```
ZOHO_CLIENT_ID=1000.abcdef123456789...
ZOHO_CLIENT_SECRET=your_client_secret_here
CRM_TOKEN_MASTER_KEY=69ccaa0d5b7ad30cb68d994add40112a94de1dc9e4c03eab94e0dcc0edd065f4
CLAUDE_API_KEY=sk-ant-your-claude-api-key
FIREBASE_SERVICE_ACCOUNT_PATH=./kylo-firebase-key.json
```

**Current Status:**
- ✅ `CRM_TOKEN_MASTER_KEY` - Already generated in `backend/.env`
- ❓ `ZOHO_CLIENT_ID` - You need to get from Zoho Developer Console
- ❓ `ZOHO_CLIENT_SECRET` - You need to get from Zoho Developer Console
- ✅ `CLAUDE_API_KEY` - Already in your environment
- ✅ `FIREBASE_SERVICE_ACCOUNT_PATH` - Already configured

---

## 🚀 **STEP 3: Deploy Backend to Vercel**

### Option A: Deploy from CLI (Recommended)

```bash
# 1. Install Vercel CLI (if not already installed)
npm install -g vercel

# 2. Go to backend directory
cd backend

# 3. Deploy to Vercel
vercel --prod

# 4. When prompted:
# - Project name: kylo-backend (or your choice)
# - Framework: Node.js
# - Build command: (leave blank, we don't build)
# - Output directory: (leave blank)
```

### Option B: Deploy from GitHub

1. Push your code to GitHub
2. Go to **https://vercel.com**
3. Click **"Import Project"**
4. Select your GitHub repo
5. Set the root directory to: `backend/`
6. Configure environment variables (see Step 4)
7. Click **Deploy**

---

## 🔐 **STEP 4: Configure Environment Variables in Vercel**

After deploying, Vercel gives you a backend URL: `https://kylo-backend-xxxxx.vercel.app`

### Set Vercel Environment Variables

1. Go to: **https://vercel.com/dashboard**
2. Select your backend project
3. Click **Settings** → **Environment Variables**
4. Add these variables:

| Variable | Value | Type |
|----------|-------|------|
| `ZOHO_CLIENT_ID` | `1000.xxxxx...` (from Step 1) | Secret |
| `ZOHO_CLIENT_SECRET` | Your secret (from Step 1) | Secret |
| `CRM_TOKEN_MASTER_KEY` | `69ccaa0d5b7ad...` | Secret |
| `CLAUDE_API_KEY` | Your Claude API key | Secret |
| `FIREBASE_SERVICE_ACCOUNT_PATH` | `./kylo-firebase-key.json` | Plain |
| `NODE_ENV` | `production` | Plain |

**IMPORTANT:** Use **"Secret"** type for sensitive values so they're encrypted.

---

## 🔄 **STEP 5: Update Zoho Redirect URI**

Now that your backend is deployed, update the authorized redirect URI:

1. Go back to: **https://accounts.zoho.com/developerconsole**
2. Select your application
3. Find **Authorized Redirect URIs**
4. Change it to: `https://YOUR_BACKEND_URL/api/crm/oauth/callback`
   - Example: `https://kylo-backend-abc123.vercel.app/api/crm/oauth/callback`

---

## 📍 **STEP 6: Update Frontend Backend URL**

Now update your frontend to point to the deployed backend:

1. Edit `.env.production`:
```bash
VITE_API_BASE_URL=https://YOUR_BACKEND_URL
# Example: VITE_API_BASE_URL=https://kylo-backend-abc123.vercel.app
```

2. Edit `src/services/crmService.ts`:
```typescript
const API_BASE = process.env.VITE_API_BASE_URL + '/api/crm';
// Or hardcode for production:
const API_BASE = 'https://YOUR_BACKEND_URL/api/crm';
```

3. Rebuild and redeploy frontend:
```bash
npm run build
firebase deploy --only hosting
```

---

## 🧪 **STEP 7: Test the Integration**

### 1. Local Testing
```bash
# Start backend locally
cd backend
npm start

# In another terminal, start frontend
npm run dev

# Go to: http://localhost:5173/dashboard/settings
# Click Integrations tab → Connect Zoho
```

### 2. Verify OAuth Flow
- Select region (USA, Europe, etc.)
- You should be redirected to Zoho login
- After authorizing, you should see "Connected ✓"
- Check browser console for any errors

### 3. Check Backend Logs
```bash
# Vercel dashboard shows logs in real-time
# Look for success: "[CRM_ROUTES] OAuth callback completed successfully"
```

---

## 🐛 **Troubleshooting**

### Problem: "Redirect URI mismatch" error
**Solution:** The redirect URI in your code must match exactly what's registered in Zoho. Check for:
- Trailing slashes
- Protocol (http vs https)
- Domain case sensitivity

### Problem: "Invalid client_id or client_secret"
**Solution:** 
- Verify you copied the credentials correctly from Zoho
- Make sure there are no extra spaces
- Check that they're set in Vercel environment variables

### Problem: "Authorization code is invalid or expired"
**Solution:**
- Auth codes expire after 10 minutes
- Try the flow again
- Check server time is correct

### Problem: CRM routes return 404
**Solution:**
- Verify backend is deployed and running
- Check the API URL in crmService.ts matches backend URL
- Look at browser Network tab to see actual requests

---

## 📊 **Architecture After Deployment**

```
┌─────────────────────────────────────────┐
│  Frontend (kylo-support.web.app)        │
│  - React + TypeScript                   │
│  - CrmIntegrationPanel component        │
│  - crmService.ts wrapper                │
└────────────┬────────────────────────────┘
             │ /api/crm/... requests
             ↓
┌─────────────────────────────────────────┐
│  Backend (kylo-backend-xxx.vercel.app)  │
│  - Express server-clean.js              │
│  - backend/routes/crm.js (7 endpoints)  │
│  - backend/integrations/ZohoCrmAdapter  │
│  - Encrypted token storage in Firestore │
└────────────┬────────────────────────────┘
             │ OAuth redirects & API calls
             ↓
┌─────────────────────────────────────────┐
│  Zoho CRM                               │
│  - OAuth 2.0 authorization              │
│  - Lead CRUD operations                 │
│  - Field schema discovery               │
└─────────────────────────────────────────┘
             
             Also accesses:
             ↓
┌─────────────────────────────────────────┐
│  Firebase Firestore                     │
│  - connections/{clientId}               │
│  - Encrypted refresh tokens             │
│  - Field mappings                       │
└─────────────────────────────────────────┘
```

---

## ✨ **After Deployment - What Works**

✅ **User Perspective:**
1. User goes to Settings → Integrations
2. Clicks "Connect Zoho"
3. Selects region (USA, Europe, India, etc.)
4. Redirected to Zoho login
5. Authorizes access
6. Returns to dashboard with "Connected ✓"
7. Can sync leads, see connection status

✅ **Backend Perspective:**
- Securely encrypts refresh token
- Stores in Firestore with client-specific keys
- Auto-refreshes access tokens before expiry
- Fetches Zoho field schema for dynamic forms
- Ready to create/update leads

---

## 📞 **Support**

If you encounter issues:

1. **Check Vercel logs:**
   - Dashboard → Backend Project → Deployments → Recent → Logs

2. **Check browser console:**
   - F12 → Console tab for frontend errors

3. **Test API directly:**
   ```bash
   curl "https://YOUR_BACKEND_URL/api/crm/oauth/authorize?provider=zoho&region=.com&clientId=test-user"
   ```

4. **Verify environment variables:**
   - Vercel Dashboard → Settings → Environment Variables
   - Confirm values are set (not empty)

---

## 🎉 **Next Steps**

After successful backend deployment:

1. ✅ Test the Zoho connection flow end-to-end
2. ✅ Verify tokens are encrypted in Firestore
3. ✅ Test lead fetching from Zoho
4. ✅ Update Leads.tsx to display CRM leads
5. ✅ Add lead creation form with Zoho fields
6. ✅ Test multi-region support (change region in Zoho console)

---

**Backend Deployment Status:** Ready to deploy! 🚀

Current files ready:
- ✅ backend/routes/crm.js (7 endpoints)
- ✅ backend/services/crmTokenService.js (token management)
- ✅ backend/integrations/adapters/ZohoCrmAdapter.js (Zoho client)
- ✅ backend/utils/encryption.js (token encryption)
- ✅ backend/vercel.json (Vercel configuration)
