# 🚂 RAILWAY DEPLOYMENT - STEP BY STEP GUIDE

**Difficulty:** Easy  
**Time:** ~5 minutes  
**Result:** Public backend URL for your chatbot  

---

## 📋 CHECKLIST BEFORE STARTING

```
✅ GitHub account ready
✅ Your repo: https://github.com/abira1/Kylo
✅ Anthropic API key ready (from console.anthropic.com)
✅ Railway.app account (will create below)
```

---

## 🚀 STEP 1: Visit Railway.app

**Go to:** https://railway.app

You should see this:
```
┌─────────────────────────────────────┐
│  Welcome to Railway                 │
│                                     │
│  [Deploy Now] button                │
└─────────────────────────────────────┘
```

**Click:** "Deploy Now" button

---

## 🔓 STEP 2: Login with GitHub

**You'll see:**
```
┌─────────────────────────────────────┐
│ Deploy from Git repository          │
│                                     │
│ [Login with GitHub] button          │
└─────────────────────────────────────┘
```

**Click:** "Login with GitHub"

**Then:**
- Authorize Railway to access your GitHub repos
- Click "Authorize railway-app"

---

## 📦 STEP 3: Select Your Repository

**After login, you'll see:**
```
┌─────────────────────────────────────┐
│ Choose a repository                 │
│                                     │
│ [abira1/Kylo]  ← Select this        │
│ [other repos...]                    │
└─────────────────────────────────────┘
```

**Click:** "abira1/Kylo"

---

## 📂 STEP 4: Select Folder

**Railway will ask:**
```
Which folder contains your app?

┌─────────────────────────────────────┐
│ Root (./)                           │
│ backend/  ← SELECT THIS             │
│ src/                                │
└─────────────────────────────────────┘
```

**Click:** "backend/" folder

**Why?** Because the backend server code is in backend/server-clean.js

---

## ⚙️ STEP 5: Configure Deployment

**Railway will show project settings:**

```
Project: Kylo
Branch: main (leave as is)
Root Directory: backend/ (already set)
```

**Click:** "Continue"

---

## 🔑 STEP 6: Add Environment Variables

**You'll see a form like:**
```
┌─────────────────────────────────────┐
│ Environment Variables               │
│                                     │
│ Variable Name: CLAUDE_API_KEY       │
│ Variable Value: [text field]        │
│                                     │
│ [+ Add Variable]                    │
└─────────────────────────────────────┘
```

**DO THIS:**

1. Click in the "Variable Value" field
2. Paste your Anthropic API key:
   ```
   sk-ant-[your-actual-key-from-console.anthropic.com]
   ```
3. Click "Add Variable"

**Where to get API key?**
- Go to: https://console.anthropic.com/account/keys
- Click "Create Key"
- Copy the key that starts with "sk-ant-"
- Paste it here

---

## 🚀 STEP 7: Deploy

**You'll see:**
```
┌─────────────────────────────────────┐
│ Ready to Deploy!                    │
│                                     │
│ Project: Kylo Backend               │
│ Repo: abira1/Kylo (main)            │
│ Folder: backend/                    │
│ Env Vars: CLAUDE_API_KEY set ✓      │
│                                     │
│ [Deploy Now]                        │
└─────────────────────────────────────┘
```

**Click:** "Deploy Now"

**Wait:** Railway will start building (~2-3 minutes)

You'll see:
```
Building...
Deploying...
Starting services...
✓ Deployment complete!
```

---

## 🔗 STEP 8: Get Your Backend URL

**After deployment succeeds, you'll see:**

```
┌─────────────────────────────────────┐
│ Deployment Complete!                │
│                                     │
│ Project URL:                        │
│ https://kylo-backend.railway.app    │
│                                     │
│ [Copy URL] button                   │
└─────────────────────────────────────┘
```

**IMPORTANT:** Copy this URL! You'll need it next.

Example URLs you might see:
- https://kylo-backend.railway.app
- https://kylo-api-prod.railway.app
- https://kylo-backend-prod.railway.app

**Copy the exact URL shown**

---

## ✅ STEP 9: Verify Backend is Working

**Test your backend URL:**

```bash
curl https://[your-railway-url]/api/health

# Expected response:
# {"status":"ok",...}

# Or test chatbot endpoint:
curl -X POST https://[your-railway-url]/api/chat \
  -H "Content-Type: application/json" \
  -d '{"clientId":"test","conversationId":"test","messages":[{"role":"user","content":"hi"}]}'
```

**If you see a response (not 404), backend is working!** ✓

---

## 📋 NEXT: Update Frontend Config

**After you have the Railway URL:**

1. Open: `/e/KYLO-AI/.env.local`
2. Find: `VITE_API_BASE_URL=http://localhost:5001`
3. Replace with: `VITE_API_BASE_URL=https://your-railway-url`

Example:
```
VITE_API_BASE_URL=https://kylo-backend.railway.app
```

4. Save file
5. Rebuild frontend: `npm run build`
6. Redeploy: `firebase deploy --only hosting`

---

## 🎊 SUMMARY

| Step | Action | Time |
|------|--------|------|
| 1 | Visit railway.app | 30s |
| 2 | Login with GitHub | 1m |
| 3 | Select Kylo repo | 30s |
| 4 | Select backend folder | 30s |
| 5 | Configure settings | 1m |
| 6 | Add CLAUDE_API_KEY | 1m |
| 7 | Deploy | 2-3m |
| 8 | Copy URL | 30s |
| 9 | Test backend | 1m |
| **Total** | | **~9 minutes** |

---

## 🆘 TROUBLESHOOTING

**Build fails with "PORT already in use":**
- Railway handles port assignment automatically
- The error is usually just a warning
- Check logs to see if service started

**Getting 404 error:**
- Wait a few seconds for Railway to fully start
- Check URL is correct (copy from Railway dashboard)
- Verify CLAUDE_API_KEY is set

**Deployment stuck:**
- Railway sometimes takes time
- Check the logs in Railway dashboard
- If stuck > 10 min, cancel and redeploy

**Can't access /api/health:**
- Make sure you used the correct URL
- Check URL ends without trailing /
- Try: `https://your-url/api/health` (GET request)

---

## ✨ ONCE DEPLOYED

**Your backend URL is:** `https://kylo-backend.railway.app` (example)

**Next steps:**
1. Update frontend .env.local
2. Rebuild: `npm run build`
3. Redeploy: `firebase deploy --only hosting`
4. Test production: https://kylo-support.web.app
5. Chatbot should work! 🎉

---

**Ready? Start with Step 1: https://railway.app**

**When you have the URL, let me know and I'll help you update the frontend! 🚀**
