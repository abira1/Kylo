# Deploy to Vercel - Detailed Step-by-Step Guide

## What We're Doing
We're deploying a **CORS proxy** on Vercel (free) that will:
1. Accept requests from your frontend (https://kylo-support.web.app)
2. Forward them to your Railway backend (https://kylo-production.up.railway.app)
3. Add proper CORS headers so the browser accepts the response
4. Return the response to your frontend

This **bypasses Railway's CORS filtering** because:
- ✅ Frontend → Vercel = same domain (no CORS needed)
- ✅ Vercel → Railway = server-to-server (no CORS enforcement)

---

## Step-by-Step Instructions

### Step 1: Create Vercel Account (2 minutes)
1. Open browser and go to **https://vercel.com**
2. Click **"Sign Up"** in top right
3. Choose **"GitHub"** authentication (easiest)
4. Authorize Vercel to access your GitHub
5. Complete signup - you now have a FREE account ✅

### Step 2: Create New Vercel Project (1 minute)
1. Go to **https://vercel.com/dashboard**
2. Click **"Add New..."** → **"Project"**
3. Find and select the **"abira1/Kylo"** repository from the list
4. Click **"Import"**

### Step 3: Configure Vercel Project (1 minute)
In the Import Project screen:

**Project Name:** (keep default: `Kylo`)

**Framework Preset:** Select **"Other"** or **"Next.js"** (doesn't matter for this)

**Root Directory:** Leave empty (default is correct)

**Environment Variables:** Leave empty (we don't need any)

Click **"Deploy"** and wait 30-60 seconds...

### Step 4: Get Your Vercel URL (30 seconds)
Once deployment completes:
1. You'll see "✅ Congratulations! Your project is ready"
2. Click on the **"Visit"** button OR
3. Your URL will be shown: `https://kylo-[random].vercel.app`

**Save this URL** - you'll need it in the next step!

Example: `https://kylo-b7x2k8m9.vercel.app`

### Step 5: Test the Proxy Works
In your terminal, replace `YOUR_VERCEL_URL` with your actual URL:

```bash
curl -X POST https://YOUR_VERCEL_URL/api/chat \
  -H "Content-Type: application/json" \
  -d '{"clientId":"test","conversationId":"test123","messages":[{"role":"user","content":"hello"}]}'
```

**Expected response:** AI response from Claude (NOT a CORS error!) ✅

### Step 6: Update Frontend API Endpoint
1. Open **src/services/claudeApi.ts**
2. Find the `getApiBaseUrl()` function
3. Replace with your Vercel URL:

```typescript
function getApiBaseUrl(): string {
  const isLocalhost = typeof window !== 'undefined' && (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.includes('5173')
  );
  
  if (isLocalhost) {
    return 'http://localhost:5001';
  }
  
  // Use Vercel proxy
  return 'https://kylo-b7x2k8m9.vercel.app';  // ← Replace with YOUR URL
}
```

### Step 7: Rebuild and Deploy Frontend
```bash
npm run build
firebase deploy --only hosting
```

### Step 8: Test in Browser 🎉
1. Go to **https://kylo-support.web.app**
2. Try typing a message in the chatbot
3. Should respond with AI response (NO "Backend Connection Error"!)

---

## Troubleshooting

### "Failed to fetch" Error in Console
- Check that your Vercel URL is correct in `claudeApi.ts`
- Verify the URL is deployed (visit it in browser - should show 404 page)

### "Bad Request" or 405 Error
- Vercel may need a deployment update
- Run: `git add . && git commit -m "Update: Add Vercel proxy" && git push`
- Wait 30 seconds for Vercel to redeploy

### Still Getting CORS Error
- Hard refresh browser: `Ctrl+Shift+R`
- Clear browser cache
- Check if `api/chat.js` exists in your repository

---

## Cost Summary
- **Vercel:** FREE (up to 100 invocations/day, which is way more than you need)
- **Railway:** Still $5/month (backend only)
- **Firebase:** Free (hosting only)
- **Total:** Still just $5/month! 🚀

---

## How Long Does This Take?
- Create Vercel account: **2 minutes**
- Import project: **1 minute**
- Configure & deploy: **2 minutes**
- Update frontend: **2 minutes**
- Redeploy Firebase: **3 minutes**
- **Total: ~10 minutes** ✅

---

## Next Steps After Testing
If chatbot works:
1. Push changes to GitHub: `git push`
2. Vercel auto-deploys (no action needed)
3. Test live: https://kylo-support.web.app
4. You're done! System is fully operational 🎉

If issues:
- Check browser console (F12) for error messages
- Check Vercel dashboard for deployment logs
- Verify `api/chat.js` file is in repository
