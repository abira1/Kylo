# WhatsApp Integration - Deployment Checklist

## Frontend Completed ✅

### UI Components
- [x] WhatsApp.tsx - Complete setup form with credentials input
- [x] Setup guide sidebar with step-by-step instructions
- [x] Webhook URL display with copy button
- [x] Form validation and error handling
- [x] Test Connection button
- [x] Save Configuration button
- [x] Connection status indicator
- [x] Agent status dashboard (when connected)

### Styles & Responsiveness
- [x] Mobile-responsive design (1 col on mobile, 3 cols on desktop)
- [x] Dark mode support
- [x] Error message styling with icons
- [x] Loading states and spinners
- [x] Status badges and indicators

### Integration
- [x] Firebase Auth integration (user UID)
- [x] Real-time config subscription
- [x] Form population from saved config
- [x] Fetch API calls to backend

## Backend Completed ✅

### Services
- [x] whatsappConfigService.js - Encryption/decryption + Firebase storage
- [x] whatsappMessageService.js - Send messages to WhatsApp API
- [x] whatsappWebhookHandler.js - Process incoming messages
- [x] multiTenantService.js - Client isolation

### Handlers & Routes
- [x] whatsappRoutes.js - 5 API endpoints
  - POST /api/whatsapp/config/save - Save encrypted credentials
  - POST /api/whatsapp/config/test - Validate with Meta API
  - GET /api/webhooks/whatsapp/:clientId - Meta webhook verification
  - POST /api/webhooks/whatsapp/:clientId - Incoming message processing
  - GET /api/whatsapp/config/:clientId - Status endpoint

### Database
- [x] Firebase Firestore collections defined
- [x] whatsappConfigs/{clientId} - Encrypted credentials
- [x] whatsappSessions/{senderPhone} - Active sessions
- [x] agents/{clientId}/sessions/{sessionId} - Session state

### Security
- [x] AES-256-CBC encryption for tokens
- [x] Random IV for each encryption
- [x] Webhook token verification
- [x] Firebase access control ready

## Environment Variables ✅

### Frontend (.env.local)
- [x] VITE_WHATSAPP_WEBHOOK_URL=https://kylo-production.up.railway.app/api/webhooks/whatsapp
- [x] VITE_VERCEL_PROXY_URL=https://kylo-ai.vercel.app (already set)

### Backend (.env)
- [x] WHATSAPP_ENCRYPTION_KEY=<placeholder> ⚠️ **NEEDS GENERATION**

## Pre-Deployment Tasks

### 1. Generate Encryption Key ⚠️ CRITICAL
```bash
# Generate a 32-character random string for WHATSAPP_ENCRYPTION_KEY
# Run this in terminal:
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
# This generates a 32-char hex string
# Add it to backend/.env as: WHATSAPP_ENCRYPTION_KEY=<output>
```

### 2. Verify Firebase Setup
- [ ] Firestore database is active
- [ ] Security rules allow WhatsApp config storage
- [ ] Service account has proper permissions

### 3. Test Endpoints Locally
```bash
# Terminal 1: Start backend
cd backend && npm start

# Terminal 2: Test API endpoints
curl -X POST http://localhost:5001/api/whatsapp/config/test \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "test-user",
    "phoneNumberId": "1234567890123456",
    "businessAccountId": "9876543210",
    "webhookVerifyToken": "test-token",
    "apiAccessToken": "test-token"
  }'
```

### 4. Build Frontend
```bash
npm run build
```

### 5. Check for TypeScript Errors
```bash
npx tsc --noEmit
```

## Testing Checklist

### Unit Tests
- [ ] whatsappConfigService encryption/decryption
- [ ] whatsappWebhookHandler message processing
- [ ] whatsappMessageService API calls
- [ ] Form validation in WhatsApp.tsx

### Integration Tests
- [ ] Save config → verify Firebase storage → verify encryption
- [ ] Load config → verify decryption → verify form population
- [ ] Test Connection → verify Meta API validation
- [ ] Webhook verification → verify token matching
- [ ] Incoming message → verify session creation → verify response

### Manual Testing (requires actual Meta credentials)
- [ ] Create Meta Business Account
- [ ] Generate real API credentials
- [ ] Configure app in Meta Dashboard
- [ ] Enter credentials in KYLO-AI dashboard
- [ ] Test Connection button validation
- [ ] Send test message from WhatsApp
- [ ] Verify message received and processed
- [ ] Verify AI response sent back

## Deployment Steps

### Step 1: Update Environment Variables
```bash
# Local .env.local - already done ✓
# Backend Railway .env - needs WHATSAPP_ENCRYPTION_KEY added:

# Go to Railway dashboard > Project > Variables
# Add: WHATSAPP_ENCRYPTION_KEY=<generated-key>
```

### Step 2: Deploy Frontend
```bash
npm run build
npx firebase deploy --only hosting
```

### Step 3: Deploy Backend
```bash
cd backend
git add .
git commit -m "Add: WhatsApp Business API integration"
git push origin main
# Railway auto-deploys on push
```

### Step 4: Verify Production
```bash
# Test production endpoints
curl https://kylo-production.up.railway.app/api/whatsapp/config/test

# Check Firebase Firestore
# Verify whatsappConfigs collection exists
# Check security rules allow operations
```

### Step 5: Deploy to Firebase Hosting
Already completed if using `firebase deploy`

## Post-Deployment Verification

### Health Checks
- [ ] Frontend loads without errors
- [ ] WhatsApp Setup page is accessible
- [ ] Form inputs work correctly
- [ ] Buttons are clickable
- [ ] Navigation to WhatsApp page works

### API Verification
- [ ] POST /api/whatsapp/config/save returns 200
- [ ] POST /api/whatsapp/config/test returns validation results
- [ ] GET /api/webhooks/whatsapp/:clientId works
- [ ] POST /api/webhooks/whatsapp/:clientId processes messages
- [ ] GET /api/whatsapp/config/:clientId returns status

### Database Verification
- [ ] Firebase Firestore accessible
- [ ] whatsappConfigs collection created
- [ ] Config data properly encrypted
- [ ] Session data persisting

### Error Handling
- [ ] Invalid credentials show error message
- [ ] Network errors handled gracefully
- [ ] Missing fields show validation errors
- [ ] Token expiration handled

## Monitoring & Maintenance

### Daily Monitoring
- [ ] Check Firebase Firestore usage
- [ ] Monitor error logs
- [ ] Track message volume
- [ ] Verify all webhooks firing

### Weekly Checks
- [ ] Review API rate limits
- [ ] Check encryption key rotation requirements
- [ ] Verify session cleanup is working
- [ ] Monitor infrastructure costs

### Security Reviews
- [ ] Verify no plain-text tokens in logs
- [ ] Check encryption is working
- [ ] Review Firebase access patterns
- [ ] Audit user access

## Rollback Plan

If issues occur:

### Step 1: Disable WhatsApp Routes
Comment out in backend/server.js:
```javascript
// app.use('/api/whatsapp', whatsappRoutes);
```
Deploy backend

### Step 2: Revert Frontend
Firebase hosting rollback to previous version:
```bash
firebase hosting:disable
# Then re-enable with previous build
```

### Step 3: Clear Potentially Corrupted Data
If Firebase data is corrupted:
```bash
# Delete problematic collections in Firebase Console
# firestore > whatsappConfigs > Delete Collection
```

## Future Enhancements

- [ ] Implement message queueing for rate limiting
- [ ] Add image/document message support
- [ ] Implement automatic retry logic for Meta API failures
- [ ] Add webhook delivery retry mechanism
- [ ] Create dashboard analytics for WhatsApp conversations
- [ ] Implement session timeout and cleanup
- [ ] Add tool calling integration (OTP, document extraction)
- [ ] Support multiple phone numbers per client
- [ ] Add WhatsApp message templates
- [ ] Implement automatic session recovery

## Documentation

- [x] WHATSAPP_SETUP_GUIDE.md - User setup guide
- [x] This checklist document
- [ ] API documentation
- [ ] Database schema documentation
- [ ] Troubleshooting guide

---

**Status**: Ready for Deployment  
**Last Updated**: December 2024  
**Version**: 1.0
