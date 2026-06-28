# CRM Integration - Railway Deployment Guide

## ✅ Current Setup
You're already running your backend on **Railway** at:
```
https://kylo-production.up.railway.app
```

---

## 🚀 Deploying CRM to Railway (3 Steps)

### **STEP 1: Get Zoho OAuth Credentials**

Go to: **https://accounts.zoho.com/developerconsole**

1. Sign in / Create account
2. Click **"Add Client"** or **"Create Application"**
3. Select: **Server-based Applications**
4. Fill in:
   - **App Name:** `KYLO CRM Integration`
   - **Homepage URL:** `https://kylo-support.web.app`
   - **Authorized Redirect URIs:**
     ```
     https://kylo-production.up.railway.app/api/crm/oauth/callback
     ```
   - **Description:** Lead management CRM integration

5. **Copy these values:**
   - Client ID (looks like: `1000.abcdef...`)
   - Client Secret (long random string)

---

### **STEP 2: Add CRM Environment Variables to Railway**

1. Go to: **https://railway.app/dashboard**
2. Select your **kylo-production** project
3. Click on the **Node.js service** (Backend)
4. Go to **"Variables"** tab
5. Add these new variables:

| Variable Name | Value | How to Get |
|---------------|-------|-----------|
| `ZOHO_CLIENT_ID` | `1000.xxxxx...` | From Zoho Step 1 |
| `ZOHO_CLIENT_SECRET` | Your secret | From Zoho Step 1 |
| `CRM_TOKEN_MASTER_KEY` | `69ccaa0d5b7ad30cb68d994add40112a94de1dc9e4c03eab94e0dcc0edd065f4` | Already generated |

**Important:** After adding variables, Railway automatically redeploys!

---

### **STEP 3: Redeploy & Test**

1. Watch Railway dashboard for deployment
2. Wait for "Deployment successful" message
3. Test the connection:

```bash
# Test backend is running
curl https://kylo-production.up.railway.app/api/health

# Test CRM routes exist
curl https://kylo-production.up.railway.app/api/crm/connection
# Should return: {"error":"clientId is required"}  (this is good!)
```

---

## 📋 **What's Already Done**

✅ **Backend Files Created:**
- `backend/routes/crm.js` - 7 CRM endpoints
- `backend/services/crmTokenService.js` - Token encryption
- `backend/integrations/adapters/ZohoCrmAdapter.js` - Zoho API client
- `backend/utils/encryption.js` - AES-256 encryption

✅ **Frontend Deployed:**
- `src/components/CrmIntegrationPanel.tsx` - Live on Firebase
- `src/services/crmService.ts` - API wrapper ready
- `src/pages/dashboard/Settings.tsx` - Integrations tab visible

✅ **Environment Configured:**
- `backend/.env` - CRM variables ready
- `.env.production` - Updated to use Railway URL
- `CRM_TOKEN_MASTER_KEY` - Generated

---

## 🔄 **Complete Integration Flow**

After you complete the 3 steps:

```
User goes to Settings → Integrations tab
        ↓
Clicks "Connect Zoho"
        ↓
Selects region (USA, Europe, India, etc.)
        ↓
Redirected to: Zoho login screen
        ↓
User logs in & grants permission to KYLO
        ↓
Zoho redirects back to:
https://kylo-production.up.railway.app/api/crm/oauth/callback?code=XXX&state=YYY
        ↓
Backend exchanges code for tokens
        ↓
Tokens encrypted & stored in Firestore
        ↓
Field schema fetched & cached
        ↓
User sees: "✓ Zoho CRM Connected"
        ↓
User can now:
- View leads from Zoho
- Create new leads
- Sync whenever needed
```

---

## 📊 **Architecture**

```
┌──────────────────────────────────────────┐
│  Frontend: kylo-support.web.app (Firebase)
│  - React UI with CrmIntegrationPanel
│  - crmService.ts API wrapper
└────────────┬─────────────────────────────┘
             │ /api/crm/... requests
             ↓
┌──────────────────────────────────────────┐
│  Backend: kylo-production.up.railway.app
│  - Express server-clean.js
│  - backend/routes/crm.js (7 endpoints)
│  - ZohoCrmAdapter integration
│  - Token encryption & storage
└────────────┬─────────────────────────────┘
             │ OAuth redirects & API calls
             ↓
┌──────────────────────────────────────────┐
│  Zoho CRM (OAuth + API)
│  - OAuth 2.0 authorization
│  - Lead CRUD operations
│  - Field schema discovery
└──────────────────────────────────────────┘

Also stores in:
     ↓
┌──────────────────────────────────────────┐
│  Firebase Firestore
│  - connections/{clientId}
│  - Encrypted refresh tokens
│  - Field mappings
└──────────────────────────────────────────┘
```

---

## ✨ **Testing After Deployment**

### 1. Backend Endpoints Test
```bash
# These should all return JSON (not 404)
curl https://kylo-production.up.railway.app/api/crm/connection
curl https://kylo-production.up.railway.app/api/crm/fields
curl https://kylo-production.up.railway.app/api/health
```

### 2. OAuth Flow Test
- Go to: https://kylo-support.web.app/dashboard/settings
- Click **Integrations** tab
- Click **Connect Zoho**
- Select region
- You should be redirected to Zoho login
- After authorizing, you should see "Connected ✓"

### 3. Connection Status Test
- Should show: Provider, Region, Last Sync time
- Should have "Sync Now" and "Disconnect" buttons

### 4. Error Scenarios
- **Invalid Zoho credentials:** Should show error banner
- **Network failure:** Should show retry option
- **Revoked token:** Should prompt to reconnect

---

## 🛠️ **Troubleshooting**

### Problem: "Redirect URI mismatch" error
**Solution:** The redirect URI in Zoho must match exactly:
- ✅ Correct: `https://kylo-production.up.railway.app/api/crm/oauth/callback`
- ❌ Wrong: `http://` (needs https)
- ❌ Wrong: Missing `/api/crm/oauth/callback` path
- ❌ Wrong: Extra spaces or trailing slash

### Problem: 404 on CRM routes
**Solution:** 
- Verify Railway has redeployed (check dashboard)
- Verify backend is running (test /api/health)
- Check Railway logs for errors

### Problem: "Invalid client_id or client_secret"
**Solution:**
- Double-check values in Zoho console (copy again)
- Make sure no extra spaces
- Verify in Railway Variables tab (refresh page)

### Problem: OAuth redirects to home page
**Solution:**
- Backend not accessible
- Check CRM routes are mounted (Line 814 in server-clean.js)
- Verify Railway deployment succeeded

---

## 📞 **Quick Reference**

| Item | Value |
|------|-------|
| **Frontend URL** | https://kylo-support.web.app |
| **Backend URL** | https://kylo-production.up.railway.app |
| **Settings Path** | /dashboard/settings → Integrations tab |
| **OAuth Callback** | /api/crm/oauth/callback |
| **Zoho Console** | https://accounts.zoho.com/developerconsole |
| **Railway Dashboard** | https://railway.app/dashboard |
| **Encryption Key** | 69ccaa0d5b7ad... (already set) |

---

## 🎉 **What's Next**

After successful CRM deployment:

1. ✅ Test Zoho connection with your actual Zoho account
2. ✅ Verify tokens are encrypted in Firestore
3. ✅ Test fetching leads from Zoho
4. ✅ Integrate leads into Leads.tsx dashboard
5. ✅ Add lead creation form with Zoho field mapping
6. ✅ Test multi-region support (US, EU, India, etc.)

---

**Status:** ✅ Ready to deploy! You have 3 easy steps.

**Time Required:** ~15 minutes total
- Zoho setup: 5 min
- Railway config: 5 min  
- Testing: 5 min
