# KYLO-AI: STACK CORRECTION & AI SYSTEM SPECIFICATION

**Status:** CRITICAL CORRECTIONS TO PREVIOUS ANALYSIS  
**Prepared by:** Abir Hossain (User)  
**Date:** June 17, 2025

---

## ⚠️ IMPORTANT: PREVIOUS ANALYSIS WAS WRONG

The executive summary and implementation roadmap I created recommended **the wrong technology stack and missed the entire AI system**. 

This document provides the **correct, confirmed stack and all missing features**.

---

## 🏗️ CORRECT TECHNOLOGY STACK (Not NestJS + PostgreSQL)

### CONFIRMED STACK:

| Component | Technology | Why |
|-----------|-----------|-----|
| **Frontend** | React 18 + Vite + Tailwind CSS | Already built ✅ |
| **Backend** | Node.js Serverless Functions (Vercel) | Auto-scaling, zero ops |
| **Database** | Firebase Firestore (NoSQL) | Real-time listeners, multi-tenant security |
| **Authentication** | Firebase Auth (email + password) | Production-ready, no custom JWT needed |
| **File Storage** | Firebase Storage | Logo uploads, passport images |
| **Hosting** | Firebase Hosting + Vercel | Both used together |
| **CDN** | Vercel CDN | For embed widget JS file |
| **AI Engine** | Anthropic Claude API (claude-sonnet-4-6) | Core intelligence |
| **Payments** | Stripe (Checkout + Webhooks) | Subscription management |
| **WhatsApp** | Meta Cloud API (WhatsApp Business) | Real-time messaging |
| **Email** | Firebase or SendGrid | Optional notifications |

### STACK TO REMOVE:
- ❌ NestJS (replace with Express-style Vercel functions)
- ❌ PostgreSQL / AWS RDS (replace with Firebase Firestore)
- ❌ Docker / docker-compose (not needed)
- ❌ AWS EC2, CloudFront, S3 (replace with Vercel + Firebase)
- ❌ DataDog (replace with Firebase Analytics + Sentry free)
- ❌ Custom JWT implementation (replace with Firebase Auth SDK)

### WHY FIREBASE OVER POSTGRESQL:
1. **Real-time data listeners** - Dashboard updates live without polling
2. **No server management** - Free Spark plan covers early-stage usage
3. **Multi-tenant security** - Per-client data isolation via Firestore rules
4. **Production-ready auth** - Firebase Auth is battle-tested
5. **Scales automatically** - No infrastructure management needed

### WHY VERCEL SERVERLESS OVER NestJS + EC2:
1. **Zero infrastructure** - Auto-scales, no DevOps needed
2. **All functions in one place** - Claude calls, Stripe webhooks, WhatsApp webhooks
3. **Fast cold starts** - ~50-100ms for typical function
4. **Integrated with Vercel frontend** - Deploy everything from one repo
5. **Cost-effective** - Pay only for what you use, free tier available

---

## 🤖 THE AI SYSTEM (Completely Missing From Previous Plan)

**THIS IS THE ENTIRE PRODUCT.** Every response the chatbot gives comes from Claude API. This system must be designed and built as the core of the backend.

### How the AI System Works:

```
1. User sends message in chat widget
   ↓
2. POST /api/chat receives message
   ↓
3. Backend extracts keywords from message
   ↓
4. Query Firestore for matching Q&A entries
   - Global Q&A bank (/qa/{category}/*)
   - Client's own Q&A (/clients/{clientId}/qa/*)
   - Take top 6-8 results sorted by usageCount
   ↓
5. Build structured prompt:
   - System instructions + client branding
   - Q&A context (6-8 entries)
   - Conversation history (last 8 messages only)
   - Current user message
   ↓
6. Call Claude API with prompt + images cache
   ↓
7. Claude returns natural conversational response
   - Based ONLY on Q&A knowledge base
   - Temperature 0.7 (natural, not hallucinating)
   - Max 800 tokens (concise responses)
   ↓
8. Backend saves both messages to Firestore
   ↓
9. Return response to frontend
   - Include leadCaptureTrigger flag if needed
```

### Claude API Configuration:

```javascript
{
  model: "claude-sonnet-4-6",
  max_tokens: 800,                    // Keeps responses concise, controls cost
  temperature: 0.7,                   // Natural but not hallucinating
  max_turns: 20,                      // Then redirect to human advisor
  context_window: "last 8 messages",  // Not full history
  prompt_caching: "ENABLED"           // Reduces input tokens by ~90%
}
```

### System Prompt Template:

```
You are {agentName}, a UAE business license advisor for {agencyName}.

STRICT RULE: Answer ONLY using the knowledge base provided below.

TONE: Be warm, natural, and conversational. Keep responses under 150 words.

BOUNDARY: If the answer is not in the knowledge base, respond:
"That is a great question — let me connect you with one of our advisors 
who can give you the exact details."

LEAD CAPTURE: After 3-4 conversational turns, naturally move toward 
capturing the user's contact information.

=== KNOWLEDGE BASE ===
{injected Q&A entries here}

=== CONVERSATION HISTORY ===
{last 8 messages injected here}

User message: {current message}
```

### Q&A Retrieval Logic:

```
1. Extract keywords from user message
   - Remove stop words (the, a, is, etc)
   - Lemmatize/normalize (talking → talk)
   
2. Query Firestore for matches:
   - /qa/{category} collections
   - WHERE keywords array-contains-any extracted terms
   - ALSO /clients/{clientId}/qa for client-specific Q&A
   - FILTER isActive === true only
   
3. Sort by usageCount descending
   - Most validated/used answers first
   
4. Take top 6-8 results
   
5. Inject into system prompt
```

### Lead Capture Trigger Logic:

```
TRIGGER 1: Turn Counter
- After 3 agent responses, flag next response to include:
  "By the way, would you like me to capture your details so we can
   follow up with the exact next steps?"

TRIGGER 2: Intent Keywords
- If user message contains ANY of these words:
  ready, apply, start, proceed, how do I begin, sign up, 
  register, cost for me, my business
- Immediately trigger lead capture in next response

RESULT:
- Backend sends response with flag: { triggerLeadCapture: true }
- Frontend renders inline Lead Capture Card (not modal, not redirect)
- Card has fields: name, phone, email
- On submit: POST /api/leads with captured data
```

### New API Endpoint:

```
POST /api/chat
  
Body: {
  message: "string",
  sessionId: "uuid",
  clientId: "string",
  conversationHistory: [
    { role: "user", content: "..." },
    { role: "agent", content: "..." }
  ]
}

Auth: Firebase JWT required (Bearer token)

Response: {
  reply: "string",
  sessionId: "uuid",
  triggerLeadCapture: boolean,
  messageId: "uuid",
  timestamp: "ISO string"
}
```

### Environment Variables Required:

```
ANTHROPIC_API_KEY=sk-ant-...  (server-side only, never expose)
```

---

## 📱 WHATSAPP INTEGRATION (Core Paid Feature)

This is a primary feature in the Pro plan. Real implementation required.

### How WhatsApp Works:

```
1. Customer sends WhatsApp message to agency's Business number
   ↓
2. Meta Cloud API POSTs to /api/whatsapp/webhook
   ↓
3. Backend verifies Stripe signature
   ↓
4. Backend finds agency by phone number
   ↓
5. Runs same Q&A + Claude AI flow as web chat
   ↓
6. Sends reply via Meta Cloud API within 2-3 seconds
   ↓
7. Stores conversation in Firestore
   ↓
8. Appears in client's WhatsApp dashboard tab
```

### API Endpoints Required:

```
GET /api/whatsapp/webhook
  Purpose: Meta calls this to verify webhook on setup
  Returns: hub.challenge if hub.verify_token matches
  
POST /api/whatsapp/webhook
  Purpose: Meta calls when customer sends message
  
  Process:
  1. Verify X-Hub-Signature-256 header
  2. Parse incoming message from entry.changes[0].value.messages[0]
  3. Get sender phone from messages[0].from
  4. Query Firestore: which client owns this phone?
  5. If type is "text" → Q&A + Claude flow
  6. If type is "image" → Passport OCR flow
  7. Send reply via Meta Cloud API
  8. Save conversation to /clients/{clientId}/whatsapp/{threadId}
  
  Returns: 200 OK immediately (Meta requires fast response)
```

### Sending a WhatsApp Reply:

```javascript
POST https://graph.facebook.com/v18.0/{WHATSAPP_PHONE_NUMBER_ID}/messages

Headers: {
  Authorization: Bearer {WHATSAPP_ACCESS_TOKEN}
}

Body: {
  messaging_product: "whatsapp",
  to: "{senderPhoneNumber}",
  type: "text",
  text: { body: "{agentResponse}" }
}
```

### Firestore Collection:

```
/clients/{clientId}/whatsapp/{threadId}
  threadId, contactNumber, contactName, messages[],
  lastMessageAt, leadCaptured (bool), messageCount
```

### Environment Variables:

```
WHATSAPP_ACCESS_TOKEN=...
WHATSAPP_VERIFY_TOKEN=my_custom_verify_token_string
WHATSAPP_PHONE_NUMBER_ID=1234567890
```

---

## 🛂 PASSPORT OCR (Core Feature - Completely Missing)

Claude API vision capability reads passport images and extracts all personal data. This is a primary product feature.

### How It Works:

```
1. User uploads passport image in web chat
   OR sends photo on WhatsApp
   
2. Image received as base64 (web) or URL (WhatsApp)
   
3. POST /api/passport/extract
   
4. Backend calls Claude API with:
   - Image (vision capability)
   - Structured extraction prompt
   
5. Claude returns clean JSON with all fields
   
6. Fields validated (required: fullName, passportNumber, nationality)
   
7. Structured data saved to:
   /clients/{clientId}/passports/{leadId}
   
8. Raw image DISCARDED immediately
   (never stored on server or Firebase)
   
9. Client dashboard shows extracted data in lead card
```

### Claude API Call for OCR:

```javascript
{
  model: "claude-sonnet-4-6",
  max_tokens: 500,
  messages: [{
    role: "user",
    content: [
      {
        type: "image",
        source: {
          type: "base64",
          media_type: "image/jpeg",
          data: base64String
        }
      },
      {
        type: "text",
        text: `Extract all information from this passport. 
               Return ONLY valid JSON with these exact keys:
               fullName, passportNumber, nationality, dateOfBirth,
               issueDate, expiryDate, gender, placeOfBirth,
               issuingCountry, mrz1, mrz2.
               Use null for any field not visible.
               No other text, just the JSON.`
      }
    ]
  }]
}
```

### Fields Extracted and Stored:

```
fullName, passportNumber, nationality, dateOfBirth, issueDate,
expiryDate, gender, placeOfBirth, issuingCountry, mrz1, mrz2,
extractedAt (timestamp), extractedBy ("claude-sonnet-4-6")
```

### API Endpoint:

```
POST /api/passport/extract
  
Body: {
  imageBase64: "string",
  mediaType: "image/jpeg",
  clientId: "string",
  leadId: "string"
}

Auth: Firebase JWT required

Returns: {
  extracted passport fields object,
  extractedAt: "ISO string",
  success: boolean
}
```

### Security Rules:

```
- Only owning client can read their passport collection
- No public read
- No cross-client read
- Enforced by Firestore rules
```

---

## 💳 PAYMENT INTEGRATION (Specific Implementation)

Payments are triggered inside chat conversations, not a simple checkout page.

### How Payments Work:

```
1. Claude detects clear buying intent in conversation
   
2. Backend creates Stripe Checkout Session
   
3. Backend returns checkout URL to frontend
   
4. Frontend renders Payment Link Card in chat
   (not a redirect, stays in conversation)
   
5. User clicks Pay Now → opens Stripe Checkout in new tab
   
6. User completes payment on Stripe's hosted page
   
7. Stripe fires webhook to POST /api/payments/webhook
   
8. Backend verifies Stripe signature
   
9. Backend saves payment record to Firestore
   
10. Backend triggers Post-Purchase Onboarding Agent
```

### API Endpoints:

```
POST /api/payments/create
  
Body: {
  priceId: "string",
  clientId: "string",
  sessionId: "string",
  customerEmail: "string"
}

Auth: Firebase JWT required

Returns: {
  checkoutUrl: "https://checkout.stripe.com/pay/..."
}

---

POST /api/payments/webhook
  
Purpose: Stripe calls this when payment succeeds

Process:
  1. Verify Stripe-Signature header
  2. Handle payment_intent.succeeded event
  3. Extract metadata: clientId, sessionId, leadId
  4. Save to /clients/{clientId}/payments/{paymentId}
  5. Update lead status to "contacted"
  6. Trigger Post-Purchase Onboarding Agent
  
Returns: 200 OK immediately
```

### Firestore Payment Document:

```
/clients/{clientId}/payments/{paymentId}
  paymentId, leadId, sessionId, stripePaymentIntentId,
  amount, currency, status, createdAt, completedAt
```

### Environment Variables:

```
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

---

## 🎓 POST-PURCHASE ONBOARDING AGENT (Completely Missing)

When payment is confirmed, an AI agent automatically guides customer through onboarding. No human trigger.

### How It Works:

```
1. Stripe webhook confirms payment_intent.succeeded
   
2. Backend identifies customer session and channel (web or WhatsApp)
   
3. Backend calls POST /api/onboarding/start
   
4. Onboarding agent sends welcome:
   "Congratulations {name}! Your payment is confirmed.
    I will now guide you through the next steps to complete
    your license application."
   
5. Agent requests passport copy (if not already submitted)
   
6. Agent requests business activity details
   
7. Agent confirms all documents received
   
8. Agent notifies agency owner application is ready
```

**Important:** This is a scripted linear flow, not free conversation. Claude generates each message naturally but with tightly constrained system prompt following the script.

### API Endpoint:

```
POST /api/onboarding/start
  
Body: {
  clientId: "string",
  sessionId: "uuid",
  leadId: "uuid",
  channel: "web" | "whatsapp"
}

Auth: Internal call from payments webhook only (no external auth)

Returns: {
  started: true
}
```

---

## 🔗 EMBED WIDGET SYSTEM (Completely Missing)

Agencies deploy KYLO on their website via a vanilla JS file hosted on Vercel CDN.

### How It Works:

```
Agency pastes on their website:
<script src="cdn.kylo.ae/widget.js" 
        data-client="CLIENT_ID" defer></script>

When page loads:
1. widget.js reads data-client attribute
2. Makes GET request to /api/branding/{clientId}
3. Receives: agent name, logo URL, primary color
4. Injects chat button and panel HTML into page DOM
5. Applies agency branding dynamically
6. Widget is live and fully functional
```

### The Widget File:

```
Location: /widget/public/embed.js
Requirements:
- Vanilla JavaScript only (no React, no dependencies)
- Under 10KB minified and gzipped
- Must work on any website (WordPress, Webflow, etc.)
- Hosted on Vercel CDN
```

### Hosted Chat Page:

```
URL: chat.kylo.ae/{clientId}
Full-page version of chat widget
Same React component, different container
Hosted on Firebase Hosting or Vercel
```

### API Endpoint:

```
GET /api/branding/:clientId
  
Auth: Public (no JWT — widget loads before user logs in)

Returns: {
  agentName: "string",
  logoURL: "string",
  primaryColor: "string",
  agencyName: "string"
}

Cache: 5 minutes (reduce Firestore reads)
```

---

## 🗄️ FIREBASE FIRESTORE STRUCTURE (Replace PostgreSQL Schema)

Complete multi-tenant structure for KYLO.

### Collections:

```
/clients/{clientId}
  clientId, agencyName, email, packageId, status (active|paused),
  branding.agentName, branding.logoURL, branding.primaryColor,
  stripeAccountId, whatsappNumber, whatsappPhoneNumberId,
  whatsappAccessToken (encrypted), createdAt, lastActive

/clients/{clientId}/leads/{leadId}
  leadId, clientId, name, phone, email, sourceURL, sessionId,
  capturedAt, status (new|contacted|closed), conversationId,
  channel (web|whatsapp)

/clients/{clientId}/conversations/{sessionId}
  sessionId, clientId, channel, startedAt, endedAt,
  messageCount, leadCaptured (bool), paymentTriggered (bool),
  status (completed|abandoned)

/clients/{clientId}/messages/{messageId}
  messageId, sessionId, role (user|agent), content,
  timestamp, qaTriggered (questionId or null), responseTimeMs

/clients/{clientId}/users/{userId}
  userId, sessionId, device, browser, firstSeen,
  lastSeen, totalSessions, leadCaptured (bool)

/clients/{clientId}/passports/{leadId}
  All 11 extracted fields + extractedAt + extractedBy

/clients/{clientId}/payments/{paymentId}
  paymentId, leadId, sessionId, stripePaymentIntentId,
  amount, currency, status, createdAt, completedAt

/clients/{clientId}/whatsapp/{threadId}
  threadId, contactNumber, contactName, lastMessage,
  lastMessageAt, messageCount, leadCaptured (bool)

/qa/{category}/{questionId}
  questionId, category, question, answer, keywords (array),
  isActive (bool), createdBy, createdAt, usageCount

/packages/{packageId}
  packageId, name, conversationLimit, features (array),
  priceAED, isActive

/platform/stats
  totalAgencies, totalConversations, totalLeads, updatedAt
```

### Firestore Security Rules (Critical):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Clients can only read/write their own data
    match /clients/{clientId} {
      allow read, write: if request.auth.uid == clientId;
      
      // All subcollections same rule
      match /{document=**} {
        allow read, write: if request.auth.uid == clientId;
      }
    }
    
    // Q&A global: read by all authenticated, write by admin only
    match /qa/{document=**} {
      allow read: if request.auth != null;
      allow write: if request.auth.token.role == 'admin';
    }
    
    // Passport data: client owner read-only
    match /clients/{clientId}/passports/{document=**} {
      allow read: if request.auth.uid == clientId;
      allow write: if false;  // Backend writes only
    }
    
    // Admin access requires custom claim
    match /{document=**} {
      allow read, write: if request.auth.token.role == 'admin';
    }
  }
}
```

---

## 🔐 FIREBASE AUTH SETUP (Replace Custom JWT)

Do not build custom JWT. Firebase Auth handles everything.

### Configuration:

```
- Enable Email/Password sign-in method in Firebase Console
- Admin accounts get custom claim: role === "admin"
  (Set via Firebase Admin SDK, never client-side)
- Client accounts created by admin using Admin SDK
  createUser() — no self-registration page
- On client creation: create /clients/{uid} document
  with initial branding and package data
```

### Setting Admin Custom Claim (Server-side):

```javascript
const admin = require('firebase-admin');
await admin.auth().setCustomUserClaims(uid, { role: 'admin' });
```

### Protecting API Endpoints:

```javascript
// Every endpoint (except /api/branding and /api/whatsapp/webhook)
const token = req.headers.authorization?.split('Bearer ')[1];
const decoded = await admin.auth().verifyIdToken(token);
const clientId = decoded.uid;
const isAdmin = decoded.role === 'admin';

// Enforce: only access own data
if (!isAdmin && clientId !== req.query.clientId) {
  return res.status(403).json({ error: 'Forbidden' });
}
```

### Admin Panel Route Protection:

```
/admin route → checks role === "admin"
/dashboard routes → checks authenticated user
/login redirect if not authenticated
```

---

## 📋 COMPLETE API ENDPOINTS LIST

**All Vercel Serverless Functions Required:**

```
AUTHENTICATION & SETUP:
  POST /api/auth/create-client     Create new agency (admin only)
  GET  /api/branding/:clientId     Public branding config

CHAT AI SYSTEM:
  POST /api/chat                   Q&A + Claude + save

PASSPORT OCR:
  POST /api/passport/extract       Claude vision extract

WHATSAPP:
  GET  /api/whatsapp/webhook       Meta webhook verify
  POST /api/whatsapp/webhook       Incoming messages

PAYMENTS:
  POST /api/payments/create        Stripe Checkout Session
  POST /api/payments/webhook       Stripe confirmation

ONBOARDING:
  POST /api/onboarding/start       Post-purchase onboarding

Q&A MANAGEMENT:
  GET  /api/qa/:clientId           Fetch client Q&A
  POST /api/qa                     Add Q&A (admin/client)
  PUT  /api/qa/:id                 Update Q&A
  DELETE /api/qa/:id               Delete Q&A

LEADS:
  POST /api/leads                  Save captured lead
  GET  /api/leads/:clientId        Fetch client leads

ANALYTICS:
  GET  /api/analytics/:clientId    Client analytics summary
```

---

## 🔑 ENVIRONMENT VARIABLES (Complete List)

```bash
# Anthropic (Claude AI) — Server-side only
ANTHROPIC_API_KEY=sk-ant-api03-...

# Firebase Admin — Server-side only
FIREBASE_PROJECT_ID=kylo-ai-prod
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-...@kylo-ai-prod.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Firebase Client — Safe to expose with VITE_ prefix
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=kylo-ai-prod.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=kylo-ai-prod
VITE_FIREBASE_STORAGE_BUCKET=kylo-ai-prod.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# WhatsApp / Meta
WHATSAPP_ACCESS_TOKEN=EAABsbCS...
WHATSAPP_VERIFY_TOKEN=my_custom_verify_token_string
WHATSAPP_PHONE_NUMBER_ID=1234567890

# App URLs
VITE_APP_URL=https://kylo.ae
VITE_WIDGET_CDN_URL=https://cdn.kylo.ae/widget.js
```

---

## ✅ WHAT THE PREVIOUS ANALYSIS GOT RIGHT

These parts remain valid:

- ✅ Frontend quality assessment accurate — UI is production-ready
- ✅ All data hardcoded and needs replacing with real API calls
- ✅ Need for error handling and error boundaries in React
- ✅ Need for environment configuration (.env files)
- ✅ Security concern about no auth on routes
- ✅ Phased approach (foundation first, features second)
- ✅ Need for CORS configuration on API endpoints
- ✅ Replace mockData.ts with real API service layer
- ✅ Sentry for error tracking is good

---

## 🔄 REVISED PHASE PLAN (Corrected Scope)

### PHASE 1 — FOUNDATION (Weeks 1-4):
- Firebase project setup (Firestore, Auth, Storage, Hosting)
- Firebase Admin SDK in Vercel functions
- Authentication: Firebase Auth + admin claims
- Firestore collections and security rules
- API skeleton with auth middleware
- Replace mockData.ts with service layer

### PHASE 2 — CORE AI + CHAT SYSTEM (Weeks 5-8):
- Claude API integration (/api/chat)
- Q&A knowledge base retrieval logic
- System prompt template with client branding
- Prompt caching setup
- Lead capture trigger logic
- Real-time Firestore writes
- Connect dashboard screens to live Firestore data

### PHASE 3 — INTEGRATIONS (Weeks 9-12):
- Passport OCR endpoint
- Stripe payment flow (create + webhook)
- Post-purchase onboarding agent
- WhatsApp Cloud API webhook
- Embed widget vanilla JS file
- Public branding API endpoint

### PHASE 4 — TESTING + LAUNCH (Weeks 13-16):
- Firebase security rules audit
- All API endpoints E2E testing
- Mobile responsive QA
- Vercel production deployment
- Firebase Hosting setup
- Custom domain configuration
- Admin account creation for Julian
- Documentation and handoff

---

## 📌 SUMMARY: THREE CRITICAL THINGS

### 1. REPLACE THE STACK
✅ Firebase Firestore (not PostgreSQL)  
✅ Vercel Serverless Functions (not NestJS)  
✅ Firebase Auth (not custom JWT)  
✅ Claude API (core intelligence)  
✅ Stripe + Meta Cloud API  

### 2. ADD THE AI SYSTEM
The Q&A retrieval, Claude integration, system prompts, lead capture triggers, and prompt caching **must be core backend design** — not afterthoughts.

### 3. ADD MISSING FEATURES
Passport OCR, Post-Purchase Onboarding, Embed Widget, WhatsApp full implementation, Q&A knowledge base — **all required before starting**.

---

**This document is the source of truth. All previous recommendations about NestJS, PostgreSQL, and AWS are invalidated. Build from this specification.**
