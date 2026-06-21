# 🔴 CRITICAL: Railway Deployment Issue - MANUAL RESTART REQUIRED

## Problem Summary
Railway is running **cached old code** and NOT pulling new commits from GitHub despite multiple pushes. This is blocking all new API endpoints (leads, conversations, file upload).

## How We Know
- ✅ New code was committed and pushed to GitHub
- ❌ `/api/health` endpoint still returns OLD response format (shows `claudeApiConfigured` field)
- ❌ New `diagnostic` field added to code is ABSENT from response
- **Conclusion**: Railway container hasn't restarted since old code was deployed

## Immediate Solution: Manual Restart on Railway Dashboard

### Step 1: Go to Railway Dashboard
```
https://railway.app/dashboard
```

### Step 2: Find Your Project
- Look for: **kylo-production** (or "Kylo" project)
- Click to open project details

### Step 3: Find Deployment Logs
- Click on the **Node.js service** (or "Backend" service)
- Look for "Deployments" tab or "Logs" section
- **Check for errors** - are there failed builds?

### Step 4: Manual Redeploy
- Look for a **"Redeploy"** or **"Deploy"** button
- Click it to force a fresh build/deployment
- Watch the logs - wait for:
  ```
  ✓ Build complete
  ✓ Deployment successful
  ```

### Step 5: Verify Deployment Worked
Once Railway shows "Deployment successful", test:

```bash
# This should show: "diagnostic": "THIS_IS_SERVER_CLEAN_JS_LATEST"
curl https://kylo-production.up.railway.app/api/health

# This should return 200 OK with JSON (not 404 HTML error)
curl https://kylo-production.up.railway.app/api/leads/test-client-id
```

---

## What to Look for in Railway Dashboard

### ✅ GOOD SIGNS (deployment working)
- Build says "✓ Build succeeded" or "✓ Complete"
- Service status shows "Running" (green)
- Logs show: "🚀 DIAGNOSTIC: server-clean.js loaded at [timestamp]"

### ❌ BAD SIGNS (deployment failed)
- Build shows "✗ Build failed"
- Service status shows "Crashed" or "Failed" (red)
- Error messages in logs about missing dependencies or syntax errors
- Service status stuck in "Building..." for more than 5 minutes

---

## If Manual Redeploy Doesn't Work

### Option 1: Check GitHub Integration
1. In Railway, go to **Settings** → **GitHub Integration**
2. Verify the **abira1/Kylo** repository is connected
3. Make sure Railway has permission to read branches
4. Try disconnecting and reconnecting

### Option 2: Check Environment Variables
1. In Railway, go to **Variables** tab
2. Verify `CLAUDE_API_KEY` is set (shouldn't be empty)
3. Verify all Firebase environment variables are present
4. Ensure no quotes around values

### Option 3: Manually Trigger Rebuild
- Make a dummy commit to force GitHub webhook:
```bash
cd e:/KYLO-AI
echo "# Rebuild trigger" >> .gitignore
git add .gitignore
git commit -m "Trigger Railway rebuild"
git push origin master
```
- Then wait 30-60 seconds and check Railway dashboard for new build

### Option 4: Contact Railway Support
- If nothing works, Railway support can force restart containers
- Go to https://railway.app → Help/Support

---

## Once Deployment Is Fixed

Test these endpoints (all should return 200 OK):
```bash
# Health check with diagnostic field
curl https://kylo-production.up.railway.app/api/health

# Should return list of leads (or empty array if none yet)
curl https://kylo-production.up.railway.app/api/leads/test-client

# Upload endpoint should accept file
curl -X POST https://kylo-production.up.railway.app/api/upload \
  -H "Content-Type: application/json" \
  -d '{"clientId":"test","fileName":"test.txt"}'

# Conversations endpoint
curl https://kylo-production.up.railway.app/api/conversations/test-client
```

---

## Full Production URL
```
https://kylo-production.up.railway.app
```

**Frontend will automatically use this URL** (from VITE_API_BASE_URL=/api in production build)
