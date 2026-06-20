# Week 2 Services - Configuration & Setup Guide

## Quick Reference: Environment Variables Required

### Email Service Configuration

#### Option 1: SendGrid (Recommended for Production)
```bash
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=SG.your-sendgrid-api-key-here
EMAIL_FROM=noreply@kylo.ai
EMAIL_REPLY_TO=support@kylo.ai
```

**How to Get:**
1. Create account at https://sendgrid.com
2. Go to Settings → API Keys
3. Create new API Key with "Mail Send" permission
4. Copy key to `SENDGRID_API_KEY`

#### Option 2: SMTP (Self-hosted or Gmail)
```bash
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=your-email@gmail.com
EMAIL_REPLY_TO=support@example.com
```

**For Gmail:**
1. Enable 2FA on Gmail account
2. Go to myaccount.google.com/apppasswords
3. Create app password for "Mail"
4. Use 16-character password as `SMTP_PASSWORD`

---

### WhatsApp Service Configuration

#### Setup Steps

```bash
WHATSAPP_BUSINESS_ACCOUNT_ID=123456789
WHATSAPP_PHONE_NUMBER_ID=102xxx
WHATSAPP_ACCESS_TOKEN=EAAxxxxx
WHATSAPP_VERIFY_TOKEN=kylo-verify-token-secret
```

**How to Get:**
1. Register at https://www.meta.com/en/developers/
2. Create Business Account
3. Set up WhatsApp Business API
4. Generate Access Token (Business Token)
5. Get Phone Number ID from Business Phone Numbers section

**Webhook Setup:**
- Webhook URL: `https://your-domain.com/api/kylo/webhook/whatsapp`
- Verify Token: Same as `WHATSAPP_VERIFY_TOKEN`
- Subscribe to messages webhook

---

### Document Extraction

**Note:** Uses Claude API key already configured

```bash
# CLAUDE_API_KEY (already set)
# Opus model automatically used for vision extraction
```

---

### Team Notifications

```bash
TEAM_ESCALATION_EMAIL=escalations@kylo.ai
# Email address where escalations are sent
# Can be team inbox or individual email
```

---

### Development / Production Environment

```bash
NODE_ENV=development  # for dev mode with mock responses
# or
NODE_ENV=production   # for real API calls
```

---

## Testing Each Service

### Test Email Service

```bash
# Create test file: test-email.js
const emailService = require('./services/emailService');

(async () => {
  const result = await emailService.sendOTPEmail(
    'your-email@example.com',
    '123456',
    'en'
  );
  console.log('Email sent:', result);
})();

# Run:
node test-email.js
```

### Test WhatsApp Service

```bash
# Create test file: test-whatsapp.js
const whatsappService = require('./services/whatsappService');

(async () => {
  const result = await whatsappService.sendTextMessage(
    '+971501234567',
    'Hello from KYLO AI!',
    'en'
  );
  console.log('WhatsApp sent:', result);
})();

# Run:
node test-whatsapp.js
```

### Test Document Extractor

```bash
# Create test file: test-docs.js
const documentExtractor = require('./services/documentExtractor');

(async () => {
  // Use a real image URL (or upload to Firebase Cloud Storage first)
  const result = await documentExtractor.extractPassportData(
    'https://example.com/passport.jpg'
  );
  console.log('Extraction result:', result);
})();

# Run:
node test-docs.js
```

---

## Integration Testing Flow

### Full OTP + Extraction + Escalation

```bash
# 1. Initialize Session
POST http://localhost:5002/api/kylo/session/init
{
  "clientId": "test-client",
  "cspId": "as-ai-1",
  "phoneNumber": "+971501234567",
  "jurisdiction": "UAE"
}

# 2. Send OTP (triggers email + WhatsApp)
POST http://localhost:5002/api/kylo/otp/send
{
  "sessionId": "session_xxx",
  "phoneNumber": "+971501234567",
  "email": "user@example.com",
  "language": "en"
}

# 3. Get OTP from email/WhatsApp, verify it
POST http://localhost:5002/api/otp/verify
{
  "sessionId": "session_xxx",
  "otpCode": "123456"
}

# 4. Extract document (requires image URL)
# Tool executor calls documentExtractor via Claude

# 5. Escalate if needed
# Tool executor calls emailService + whatsappService
```

---

## Troubleshooting

### Email Not Sending

1. **Check Provider:** `echo $EMAIL_PROVIDER`
2. **Check API Key:** Verify SENDGRID_API_KEY is valid
3. **Check SMTP:** If using SMTP, verify credentials in email client first
4. **Check Console:** Look for `[EMAIL_SERVICE]` logs
5. **Dev Mode:** If unconfigured, emails are logged to console only

### WhatsApp Not Sending

1. **Check Credentials:** `echo $WHATSAPP_ACCESS_TOKEN`
2. **Check Phone ID:** Verify format (usually 102xxx)
3. **Test Mode:** Use development mode first (mock responses)
4. **Check Webhook:** Verify webhook URL is publicly accessible
5. **Check Phone:** Ensure phone number is in correct format (+971XXXXXXXXX)

### Document Extraction Issues

1. **Image URL:** Ensure URL is publicly accessible
2. **Image Format:** JPEG, PNG, WebP supported
3. **Model Access:** Verify Claude Opus access in API key settings
4. **Timeout:** Vision API calls take ~3 seconds

---

## Production Deployment Checklist

- [ ] SendGrid API key configured
- [ ] Email templates created in SendGrid dashboard
- [ ] WhatsApp Business Account approved
- [ ] WhatsApp templates pre-approved
- [ ] Webhook URL publicly accessible & verified
- [ ] TEAM_ESCALATION_EMAIL set to actual team email
- [ ] NODE_ENV set to 'production'
- [ ] Rate limiting enabled
- [ ] Monitoring/logging configured
- [ ] SMTP fallback tested
- [ ] Load testing completed (100+ sessions)
- [ ] All templates tested with real data

---

## Architecture: Service Flow

```
User WhatsApp Message
          ↓
[WhatsApp Webhook Handler]
          ↓
[Session Retriever]
          ↓
[Claude Haiku - Chat]
          ↓
[Tool Executor Router]
    ↙    ↓    ↘
  OTP   DOC   EMAIL/WHATSAPP
[OTP Service] → [Email Service] → SendGrid/SMTP
                 [WhatsApp Service] → Meta API
                 [Document Extractor] → Claude Vision

Session State Updated ← All steps logged in Firestore
```

---

## Cost Estimates

### Per-Session Costs

| Component | Cost | Notes |
|-----------|------|-------|
| Claude Haiku Chat | $0.0005 | Multiple turns |
| OTP Email | $0.00001 | SendGrid rate |
| WhatsApp Message | $0.0035 | Meta rate |
| Document Extraction | $0.0015 | Claude Vision/image |
| **Total/Session** | **~$0.006** | ~0.6 cents |

### Monthly Estimates

| Volume | Cost | Notes |
|--------|------|-------|
| 1,000 sessions | ~$6 | Testing |
| 10,000 sessions | ~$60 | Small pilot |
| 100,000 sessions | ~$600 | Growth phase |
| 1,000,000 sessions | ~$6,000 | Production |

---

## Support & Debugging

### Enable Debug Logging

```javascript
// In server-clean.js
process.env.DEBUG = 'kylo:*';
```

### View Service Logs

```bash
# All OTP logs
grep -r "OTP_SERVICE" server.log

# All Email logs
grep -r "EMAIL_SERVICE" server.log

# All WhatsApp logs
grep -r "WHATSAPP_SERVICE" server.log
```

### Test Specific Endpoint

```bash
# Check health
curl http://localhost:5002/api/kylo/health

# View session state
curl http://localhost:5002/api/kylo/session/{sessionId}

# Verify webhook
curl -X GET http://localhost:5002/api/kylo/webhook/whatsapp \
  -H "hub.challenge=test123" \
  -H "hub.verify_token=kylo-verify-token"
```

---

**Created:** Phase 1, Week 2  
**Status:** Ready for credential configuration  
**Next:** Week 3 webhook and step engine implementation
