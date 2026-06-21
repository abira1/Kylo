# WhatsApp Integration - Quick Start (for developers)

## Critical: Generate Encryption Key

**BEFORE DEPLOYING**, you must generate a 32-character encryption key:

### On Your Local Machine:
```bash
# Option 1: Node.js (recommended)
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"

# Output will be something like:
# 3a7f2b9e1c4d6a8f3e5b7c2d9a1f4e6b

# Copy this 32-character string
```

### Add to Backend Environment

**For Local Development** (backend/.env):
```
WHATSAPP_ENCRYPTION_KEY=3a7f2b9e1c4d6a8f3e5b7c2d9a1f4e6b
```

**For Railway Production** (Railway Dashboard):
1. Go to https://railway.app/dashboard
2. Click on your project → kylo-production
3. Go to Variables tab
4. Add new variable:
   - **Name**: WHATSAPP_ENCRYPTION_KEY
   - **Value**: <paste the 32-char key generated above>
5. Click Deploy to apply changes

⚠️ **IMPORTANT**: Use the SAME key in both local and production. This ensures configurations remain decryptable if moved between environments.

## Test Local Setup (5 minutes)

### 1. Start Backend
```bash
cd e:/KYLO-AI/backend
npm install  # if not already done
npm start
# Output should show: "Server running on port 5001"
```

### 2. Test Encryption Service
```bash
node -e "
const service = require('./services/whatsappConfigService');
const test = 'hello123';
const encrypted = service.encrypt(test);
console.log('Encrypted:', encrypted);
const decrypted = service.decrypt(encrypted);
console.log('Decrypted:', decrypted);
console.log('Match:', test === decrypted);
"
```

Expected output:
```
Encrypted: ****encrypted string****
Decrypted: hello123
Match: true
```

### 3. Test Config Save API
```bash
curl -X POST http://localhost:5001/api/whatsapp/config/save \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "test-user-123",
    "phoneNumberId": "1234567890123456",
    "businessAccountId": "9876543210",
    "webhookVerifyToken": "test-webhook-token",
    "apiAccessToken": "EABC123456789"
  }'
```

Expected response:
```json
{
  "success": true,
  "message": "Configuration saved successfully"
}
```

### 4. Verify Firebase Storage
1. Open Firebase Console: https://console.firebase.google.com
2. Go to Firestore Database
3. Check collection: `whatsappConfigs`
4. You should see a document with ID: `test-user-123`
5. Verify tokens are encrypted (not plain text)

## Test Frontend Setup (5 minutes)

### 1. Start Frontend Dev Server
```bash
cd e:/KYLO-AI
npm run dev
# Opens http://localhost:5173
```

### 2. Navigate to WhatsApp Setup
1. Click login (use test account or your Firebase credentials)
2. Go to Dashboard
3. Click "WhatsApp" in sidebar
4. You should see the WhatsApp Setup form

### 3. Fill Form & Save
1. Enter test credentials:
   - Phone Number ID: `1234567890123456`
   - Business Account ID: `9876543210`
   - Webhook Verify Token: `test-token-12345`
   - API Access Token: `EABCTestToken123`
2. Click "Test Connection" (will fail with fake token - that's OK)
3. Click "Save Configuration"
4. Check browser console for any errors

### 4. Verify Form Population
1. Refresh the page
2. Form should auto-populate with saved values (from Firebase real-time sync)
3. Password fields should show masked ●●●●●

## Deploy to Railway (10 minutes)

### Prerequisites
- Git repository set up
- Railway CLI installed (optional, can use GUI)
- Backend .env with WHATSAPP_ENCRYPTION_KEY

### Steps

**1. Update .env in repository:**
```bash
# backend/.env
WHATSAPP_ENCRYPTION_KEY=<your-generated-key>
```

**2. Commit changes:**
```bash
cd backend
git add .
git commit -m "Add: WhatsApp integration with encryption key"
git push origin main
```

**3. Railway auto-deploys** (watch Railway dashboard)
- Deployment should start automatically
- Wait for "Build successful" ✓
- Check logs for any errors

**4. Verify deployment:**
```bash
# Test production endpoint
curl https://kylo-production.up.railway.app/api/whatsapp/config/test \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{...}'
```

## Deploy Frontend to Firebase Hosting

```bash
npm run build

# Check build output
# Should see: Successfully packaged functions

firebase deploy --only hosting

# Output should show:
# ✔ Deploy complete!
# 🎉 Hosting URL: https://kylo-support.web.app
```

## Test with Real Meta Credentials (requires setup in Meta)

### 1. Create Meta Business Account
- Go to https://business.facebook.com
- Set up WhatsApp Business API app

### 2. Get Real Credentials
- Phone Number ID: from WhatsApp app settings
- Business Account ID: from Account Details
- API Access Token: generate in System User settings

### 3. Configure in KYLO-AI
1. Dashboard → WhatsApp Setup
2. Enter real credentials
3. Click "Test Connection"
4. Should show: "✅ WhatsApp connection verified!"

### 4. Set Up Webhook in Meta App
1. Copy webhook URL from dashboard
2. In Meta app settings:
   - Go to WhatsApp → Configuration
   - Paste webhook URL
   - Paste webhook verify token (same one from form)
   - Subscribe to: messages, message_status

### 5. Send Test Message
1. Start a conversation with your business WhatsApp number
2. Send a test message
3. Should receive AI response within seconds

## Troubleshooting

### "Failed to save configuration"
- Check backend is running: `curl http://localhost:5001/health`
- Check Firebase credentials in backend .env
- Check browser network tab for actual error

### "Connection test failed"
- Verify API Access Token is correct
- Check if token has expired (regenerate in Meta)
- Verify Phone Number ID format (should be digits only)

### Form doesn't populate after save
- Check Firebase real-time sync is working
- Open Firebase Console → Firestore → whatsappConfigs
- Verify document exists with correct clientId (your user UID)

### Webhook not receiving messages
- Check webhook URL is accessible (test with curl GET)
- Verify webhook token matches Meta app settings exactly
- Check Firebase Firestore has sufficient write quota
- Review backend logs for webhook processing errors

### Encryption errors
- Verify WHATSAPP_ENCRYPTION_KEY is set in .env
- Check key is exactly 32 characters
- Verify key is same in local and production
- Check for special characters in key

## Common Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| "Invalid token" in console | API token expired or incorrect | Regenerate token in Meta Business Account |
| Form shows "Loading..." forever | Firebase connection issue | Check Firebase config in src/firebase/config.ts |
| "CORS error" when saving | Backend not accessible | Check Vercel proxy URL or backend URL |
| Encrypted data unreadable | Wrong encryption key | Regenerate and use same key everywhere |
| Webhook 401 Unauthorized | Token verification failed | Verify webhook token matches exactly in Meta |

## Performance Notes

- Encryption/decryption: ~1ms per operation
- Firebase write: ~50-200ms (network dependent)
- Meta API validation: ~200-500ms
- Webhook processing: ~100-300ms
- Message delivery: < 2 seconds (typical)

## Security Best Practices

✅ **DO:**
- Rotate encryption key every 90 days
- Use environment variables (never commit keys)
- Validate all webhook signatures
- Use HTTPS only
- Limit API token permissions

❌ **DON'T:**
- Log or display API tokens
- Share encryption keys
- Commit .env files to Git
- Use weak webhook tokens
- Allow CORS from *.anything

## Next Steps

After setup is working:

1. **Integrate with agent system** - Connect to your AI agent logic
2. **Add tool calling** - OTP verification, document extraction
3. **Implement rate limiting** - Handle high message volumes
4. **Add analytics dashboard** - Track conversation metrics
5. **Create backup system** - Encrypt & store session history

---

**Questions?** Check:
- [WHATSAPP_SETUP_GUIDE.md](./WHATSAPP_SETUP_GUIDE.md) - User guide
- [WHATSAPP_DEPLOYMENT_CHECKLIST.md](./WHATSAPP_DEPLOYMENT_CHECKLIST.md) - Full checklist
- Backend logs: `backend/server-output.txt`

**Version**: 1.0  
**Last Updated**: December 2024
