# KYLO-AI Quick Deployment Guide

## TL;DR: Deploy in 5 Minutes

### Prerequisites
- GitHub account
- Railway.app account (free tier available)
- Vercel account (free tier available)
- Firebase project
- Anthropic API key

### Step 1: Deploy Backend to Railway (5 min)

```bash
# 1. Go to https://railway.app
# 2. Click "New Project" → "Deploy from GitHub"
# 3. Select your KYLO-AI repository
# 4. Select Root Directory: /backend

# 5. Add Environment Variables (Railway Dashboard → Variables):
PORT=3000
ANTHROPIC_API_KEY=sk-ant-xxxx...
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY_ID=your-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@xxx.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your-client-id
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
FIREBASE_AUTH_PROVIDER_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
FIREBASE_CLIENT_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/...
NODE_ENV=production

# 6. Railway deploys automatically
# 7. Get your URL from Railway Dashboard
#    Expected format: https://kylo-ai-api-prod.railway.app
```

### Step 2: Deploy Frontend to Vercel (3 min)

```bash
# 1. Go to https://vercel.com
# 2. Click "New Project" → "Import Git Repository"
# 3. Select your KYLO-AI repository
# 4. Set Build Command: npm run build
# 5. Set Start Command: npm run preview

# 6. Add Environment Variables:
VITE_API_BASE_URL=https://kylo-ai-api-prod.railway.app
VITE_FIREBASE_API_KEY=AIzaSyxxxx...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=xxxxxxxxxxxx
VITE_FIREBASE_APP_ID=1:xxxxxxxxxxxx:web:xxxxxxxxxxxx
VITE_APP_URL=https://kylo-ai.vercel.app

# 7. Click Deploy
# 8. Vercel automatically deploys
#    Your URL: https://kylo-ai.vercel.app
```

### Step 3: Verify Deployment (2 min)

```bash
# Test backend health
curl https://kylo-ai-api-prod.railway.app/api/health

# Test frontend is up
# Open https://kylo-ai.vercel.app in browser

# Test chat endpoint
curl -X POST https://kylo-ai-api-prod.railway.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "test_user",
    "conversationId": "test_conv",
    "messages": [{"role": "user", "content": "Hello"}],
    "qaContext": {}
  }'
```

## Getting Required Keys

### Firebase Service Account
1. Go to: https://console.firebase.google.com
2. Select your project
3. Settings (gear icon) → Service Accounts
4. Click "Generate New Private Key"
5. Save the JSON file
6. Copy-paste the values into Railway environment variables

### Anthropic API Key
1. Go to: https://console.anthropic.com
2. Click "API Keys"
3. Create new key
4. Copy and paste into Railway environment variables

## Environment Variables Mapping

| Variable | Source | Railway | Vercel |
|----------|--------|---------|--------|
| `ANTHROPIC_API_KEY` | console.anthropic.com | ✓ | - |
| Firebase keys | console.firebase.google.com | ✓ | ✓ |
| `VITE_API_BASE_URL` | Your Railway URL | - | ✓ |
| `VITE_APP_URL` | Your Vercel URL | - | ✓ |

## Troubleshooting

### "API connection error"
- Verify `VITE_API_BASE_URL` in Vercel env matches your Railway URL
- Ensure Railway deployment succeeded (check Railway logs)

### "Cannot find module"
- Run `npm install` locally first
- Check Node version matches (Railway uses latest stable by default)

### "Firebase error: Permission denied"
- Check Firebase rules in `firestore.rules`
- Verify Firestore is in read/write mode for development
- For production, set strict rules

### "Anthropic API error"
- Verify API key is correct
- Check API quota at console.anthropic.com
- Ensure key has no restrictions

## Custom Domain (Optional)

### Add Custom Domain to Vercel
1. Vercel Dashboard → Settings → Domains
2. Enter your domain (e.g., kylo-ai.com)
3. Add DNS records as shown
4. Update `VITE_APP_URL=https://kylo-ai.com`

### Add Custom Domain to Railway
1. Railway Dashboard → Settings → Domains
2. Add custom domain
3. Point DNS records to Railway
4. Update `VITE_API_BASE_URL=https://api.kylo-ai.com` (or use same domain)

## Auto-Deployment

Both Vercel and Railway auto-deploy on GitHub push:
1. Make changes locally
2. `git push` to main branch
3. Platforms auto-build and deploy (2-5 minutes)
4. No manual deployment needed after initial setup

## Rollback

If something breaks:

**Vercel**: Deployments tab → Select previous version → Redeploy
**Railway**: Deployments tab → Select previous version → Redeploy

## Cost Estimate (Monthly)

| Service | Free Tier | Cost |
|---------|-----------|------|
| Vercel Frontend | ✓ | $0 |
| Railway Backend | Partial | $5-20 (depends on usage) |
| Firebase Firestore | Partial | $0-5 (free tier covers most uses) |
| Anthropic API | Pay-as-you-go | Depends on usage (~$0.003 per 1M input tokens) |

**Total**: ~$5-25/month for small deployments

## Next Steps

1. ✅ Deployment complete
2. Monitor logs for errors
3. Test all features in production
4. Set up backup strategy
5. Configure custom domain (optional)
6. Add monitoring/alerting
7. Implement rate limiting
8. Add admin authentication to KB upload

---

**Documentation**: See `DEPLOYMENT_GUIDE.md` for detailed instructions
**Status**: Ready for Production 🚀
