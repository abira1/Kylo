# WhatsApp Integration - Step-by-Step Completion Guide

## Phase 1: Generate & Configure Encryption Key (5 minutes)

### Step 1.1: Generate 32-Character Encryption Key

**On your local machine:**

Open terminal and run:
```bash
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

**Output example:**
```
3a7f2b9e1c4d6a8f3e5b7c2d9a1f4e6b
```

✅ **Copy this 32-character string** (it will be unique each time)

### Step 1.2: Add to Local Backend

Edit `backend/.env`:
```bash
nano backend/.env
# or use VS Code to edit the file
```

Add this line:
```
WHATSAPP_ENCRYPTION_KEY=3a7f2b9e1c4d6a8f3e5b7c2d9a1f4e6b
```

Replace `3a7f2b9e...` with your generated key from Step 1.1

**Save the file** (Ctrl+S or Cmd+S)

### Step 1.3: Verify Local Configuration

Test it works locally:
```bash
cd backend
npm start
```

Watch for output like:
```
✓ WhatsApp service initialized
Server running on port 5001
```

**Stop the server** (Ctrl+C)

### Step 1.4: Add to Railway Production

1. Go to https://railway.app/dashboard
2. Click your project name: `kylo-production`
3. Click the **Variables** tab
4. Click **Add Variable**
5. Fill in:
   - **Name:** `WHATSAPP_ENCRYPTION_KEY`
   - **Value:** `3a7f2b9e1c4d6a8f3e5b7c2d9a1f4e6b` (your generated key)
6. Click **Add**
7. Click **Deploy** button
8. Wait for green checkmark ✓

**Verify:**
```bash
curl https://kylo-production.up.railway.app/api/health
# Should return 200 OK
```

---

## Phase 2: Client Gets Meta Credentials (15 minutes)

### Step 2.1: Create Meta Business Account

1. Go to https://business.facebook.com
2. Click **Create New Account**
3. Fill in business details:
   - Business name: `Your Business Name`
   - Business email: `your-email@company.com`
   - Business type: `Service Provider` or `Retail`
4. Click **Create Account**
5. Verify via email

### Step 2.2: Create WhatsApp Business App

1. In Business Manager, go to **Apps** (left sidebar)
2. Click **Create App**
3. Choose **Business** app type
4. Fill in:
   - App Name: `KYLO WhatsApp Integration`
   - App Purpose: `Customer Service`
5. Click **Create App**

### Step 2.3: Add WhatsApp Product

1. In your app dashboard, search for **WhatsApp** in the Products list
2. Click **Set Up** next to WhatsApp
3. Choose **Cloud API** option
4. Click **Get Started**

### Step 2.4: Get Phone Number ID

1. In WhatsApp settings, go to **API Setup**
2. Under "Phone Numbers", you'll see your business phone number
3. **Copy the Phone Number ID** (16-digit number like: `1234567890123456`)
4. **Save this** - you'll need it soon

### Step 2.5: Get Business Account ID

1. In WhatsApp settings, go to **Business Accounts**
2. You'll see your business account listed
3. **Copy the Business Account ID** (like: `9876543210`)
4. **Save this**

### Step 2.6: Generate API Access Token

1. Go to **Settings** (left sidebar) → **Users and Roles**
2. Under **System Users**, create a new system user:
   - Name: `kylo-api-user`
   - Role: `Admin`
3. Click **Generate New Token**
4. Select permissions:
   - ✓ `whatsapp_business_messaging`
   - ✓ `whatsapp_business_account`
5. Select token validity: **60 days** or **Never expire**
6. Click **Generate Token**
7. **Copy the entire token** (it starts with `EABC...`)
8. **SAVE THIS SAFELY** - you won't see it again

**You now have:**
- ✅ Phone Number ID
- ✅ Business Account ID  
- ✅ API Access Token

---

## Phase 3: Client Configures in Dashboard (10 minutes)

### Step 3.1: Client Logs into KYLO Dashboard

1. Go to https://kylo-support.web.app
2. Click **Login**
3. Enter credentials
4. Click **Dashboard** (top navigation)

### Step 3.2: Navigate to WhatsApp Setup

1. In dashboard sidebar, click **WhatsApp**
2. You should see the setup form with 4 fields

### Step 3.3: Fill Phone Number ID

1. **Field:** "Phone Number ID"
2. **Value:** `1234567890123456` (from Step 2.4)
3. Click in the field and paste

### Step 3.4: Fill Business Account ID

1. **Field:** "Business Account ID"
2. **Value:** `9876543210` (from Step 2.5)
3. Paste the value

### Step 3.5: Create Webhook Verify Token

1. **Field:** "Webhook Verify Token"
2. **Create a random string** (only you will use this):
   ```
   kylo_webhook_2024_$(date +%s)_secret
   ```
   Example: `kylo_webhook_2024_1703001234_secret`
3. Or just use: `kylo_secure_webhook_token`
4. Type it in the field
5. **Remember this token** - you'll need it for Meta settings

### Step 3.6: Fill API Access Token

1. **Field:** "API Access Token"
2. **Value:** `EABC...` (from Step 2.6)
3. Paste the full token
4. Note: The field shows as password (dots) for security

### Step 3.7: Test Connection

1. Click **"Test Connection"** button
2. Wait 3-5 seconds
3. You should see: ✅ **"WhatsApp connection verified!"**

If you see ❌ error:
- Verify all values are copied correctly (no extra spaces)
- Check API token hasn't expired
- Ensure Phone Number ID is numeric only

### Step 3.8: Save Configuration

1. Click **"Save Configuration"** button
2. Wait 2-3 seconds
3. You should see: ✅ **"WhatsApp configuration saved successfully!"**

The form will now show a green **"Connected"** badge in top right.

---

## Phase 4: Configure Webhook in Meta App (10 minutes)

### Step 4.1: Get Webhook URL from KYLO Dashboard

1. Still in KYLO dashboard WhatsApp page
2. Look at **Setup Guide** section (left sidebar)
3. Find **"Webhook URL"** section
4. **Click the copy button** (📋 icon)
5. Webhook URL is copied to clipboard
6. It looks like: `https://kylo-support.web.app/api/webhooks/whatsapp/user-uid-123`

### Step 4.2: Go to Meta App Configuration

1. Go back to https://developers.facebook.com
2. Select your app from top dropdown
3. Go to **WhatsApp** → **Configuration** (left sidebar)
4. Find **"Webhooks"** section

### Step 4.3: Set Webhook URL

1. Click **"Edit"** button in Webhooks section
2. **Callback URL field:** Paste the webhook URL from Step 4.1
3. **Verify Token field:** Enter the token from Step 3.5
   - Example: `kylo_secure_webhook_token`
4. Click **"Verify and Save"**

Meta will send a verification request to your webhook - if KYLO dashboard accepted it, this will succeed ✓

### Step 4.4: Subscribe to Webhook Events

1. Still in **Configuration** section
2. Find **"Subscribe to webhook fields"** section
3. Click **"Manage"**
4. Select these checkboxes:
   - ✓ `messages` (for incoming messages)
   - ✓ `message_status` (for delivery status)
   - ✓ `message_template_status_update` (for templates)
5. Click **"Save"**

### Step 4.5: Verify Webhook is Active

1. Back in KYLO dashboard (refresh the page)
2. Check top right - should still show **"Connected"** badge
3. You should see **"WhatsApp Agent Status"** section at bottom with:
   - Status: `Active`
   - Messages Today: `0`
   - Active Sessions: `0`

---

## Phase 5: Test End-to-End (5 minutes)

### Step 5.1: Send Test Message

1. On your phone, open WhatsApp
2. Find your business WhatsApp number (from Step 2.4)
3. Start a conversation
4. Type a test message: `"Hello, can you help me?"`
5. Send it

### Step 5.2: Check for Response

1. Wait 3-5 seconds
2. You should receive a response from your AI agent
3. The response should use your agent's system prompt

**Example flow:**
```
You: "Hello, can you help me?"
Agent: "Hi! I'm your AI assistant. How can I help you today?"
```

### Step 5.3: Test Multi-Step Interaction

1. If you have a form/questionnaire configured:
   - Send first message: `"I need help with visa application"`
   - Agent should ask first question
   - Answer the question
   - Agent should ask next question
   - Continue until form is complete

### Step 5.4: Check Dashboard Metrics

1. Go to KYLO dashboard WhatsApp page
2. **WhatsApp Agent Status** section should now show:
   - Status: `Active`
   - Messages Today: `1` (your test message)
   - Active Sessions: `1` (your conversation)

---

## Phase 6: Verify Logging & Monitoring (5 minutes)

### Step 6.1: Check Backend Logs

```bash
# On your local machine, in backend folder:
tail -f server-output.txt

# You should see logs like:
[WhatsApp Webhook] Received message from 1234567890
[WhatsApp Agent] Processing: "Hello, can you help me?"
[Claude API] Response: "Hi! I'm your AI assistant..."
[WhatsApp Message] Sending response to 1234567890
```

### Step 6.2: Check Firebase Firestore

1. Go to Firebase Console: https://console.firebase.google.com
2. Select project: `kylo-support`
3. Go to **Firestore Database**
4. You should see new collections:
   - **whatsappConfigs** → Contains your encrypted credentials
   - **whatsappSessions** → Contains active conversation sessions
   - **agents** → Contains conversation history

### Step 6.3: Verify Encryption

1. In Firestore, open `whatsappConfigs/{your-user-id}`
2. Check the fields:
   - `phoneNumberId` - should be **encrypted** (not plain text)
   - `apiAccessToken` - should be **encrypted** (not plain text)
   - `webhookVerifyToken` - should be **encrypted**

You should NOT see your actual tokens, only encrypted strings like:
```
iv:xxxxxxxxxxxxx,encryptedData:yyyyyyyyyyyy
```

---

## Phase 7: Production Deployment (5 minutes)

### Step 7.1: Commit Changes to Git

```bash
cd /e/KYLO-AI
git add .
git commit -m "feat: Add WhatsApp Business API integration with encryption"
git push origin master
```

### Step 7.2: Verify Railway Deployment

1. Go to https://railway.app/dashboard
2. Click `kylo-production` project
3. Watch the **Deployments** tab
4. Should see green ✓ for latest deployment
5. Check logs for any errors

### Step 7.3: Test Production Endpoints

```bash
# Test the webhook endpoint
curl https://kylo-production.up.railway.app/api/health

# Should return 200 OK
```

### Step 7.4: Deploy Frontend

```bash
npm run build
firebase deploy --only hosting
```

Watch for:
```
✔ Deploy complete!
Hosting URL: https://kylo-support.web.app
```

---

## Phase 8: Troubleshooting (As Needed)

### Issue: "Connection test failed"

**Check:**
1. API token hasn't expired (regenerate in Meta)
2. Phone Number ID is correct (no spaces or dashes)
3. Business Account ID is correct
4. Meta app is in development/production mode

**Fix:**
1. Regenerate a new API token in Meta
2. Re-enter credentials in KYLO dashboard
3. Click Test Connection again

### Issue: "Messages not arriving in WhatsApp"

**Check:**
1. Webhook URL is correct (copy again from dashboard)
2. Webhook token matches exactly (case-sensitive)
3. Meta app shows "Webhook Subscribed" status
4. Check backend logs for webhook processing errors

**Fix:**
```bash
# Restart backend
cd backend
npm start
```

### Issue: "Agent not responding"

**Check:**
1. Firebase Firestore accessible
2. Claude API key configured on backend
3. Agent session created in Firestore

**Fix:**
```bash
# Check logs
tail backend/server-output.txt

# Look for errors like:
# ERROR: Firebase connection failed
# ERROR: Claude API error
```

### Issue: "Form not populated after saving"

**Check:**
1. Firebase real-time sync working
2. User UID is correct
3. Document in Firestore under correct clientId

**Fix:**
1. Hard refresh browser (Ctrl+F5)
2. Log out and log back in
3. Check Firebase Firestore permissions

---

## Success Checklist ✅

- [ ] Encryption key generated and saved (local + Railway)
- [ ] Client created Meta Business Account
- [ ] Client got Phone Number ID, Business Account ID, API Token
- [ ] Client filled KYLO dashboard form
- [ ] Test Connection succeeded
- [ ] Save Configuration succeeded
- [ ] Webhook configured in Meta app
- [ ] Webhook events subscribed (messages, message_status)
- [ ] Test message sent from WhatsApp
- [ ] AI response received within 5 seconds
- [ ] Dashboard shows correct metrics
- [ ] Firestore shows encrypted credentials
- [ ] Backend logs show successful processing
- [ ] Production deployment completed
- [ ] All endpoints responding 200 OK

---

## Next Advanced Features (Optional)

Once everything is working:

**Coming Soon:**
- [ ] Implement message queueing for high volume
- [ ] Add image/document message support
- [ ] Enable tool calling (OTP, document extraction)
- [ ] Create WhatsApp-specific analytics
- [ ] Implement automatic session recovery
- [ ] Add team collaboration features

---

**Total Time:** ~50 minutes from start to sending first test message  
**Difficulty:** Easy - mostly copy/paste configuration  
**Support:** If stuck, check backend logs first, then Firebase console

