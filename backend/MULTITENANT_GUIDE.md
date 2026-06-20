# Multi-Tenant Architecture Implementation Guide

## 📋 Overview

This implementation adds **multi-tenant support** to KYLO-AI, allowing:
- Multiple clients to use the same Claude API instance
- Each client has their own dashboard, knowledge base, and chatbot
- Conversations stored per-client in Firestore
- Global + client-specific knowledge bases

## 🏗️ Architecture

```
ONE Claude API Key
        ↓
    Backend Router (server-clean.js)
        ↓
Multiple Clients (each with clientId)
        ↓
Firebase Firestore (per-client storage)
```

## 📁 Files Created/Modified

### Backend Files Created
- `backend/services/firebaseService.js` - Firebase operations
- `backend/services/multiTenantService.js` - Multi-tenant logic
- `backend/routes/knowledgeBase.js` - KB management routes
- `backend/setup-firebase.js` - Initialize Firebase data
- `backend/test-multitenant.js` - API tests

### Backend Files Modified
- `backend/server-clean.js` - Multi-tenant chat endpoint
- `backend/package.json` - Added firebase-admin

### Frontend Files Modified
- `src/services/claudeApi.ts` - Multi-tenant API calls

### Configuration Updated
- `backend/.env` - Firebase configuration

## 🚀 Quick Start

### Step 1: Install Dependencies
```bash
cd backend
npm install
```

### Step 2: Setup Firebase Service Account

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (kylo-support)
3. Go to **Project Settings** → **Service Accounts**
4. Click **Generate New Private Key**
5. Save as `backend/kylo-firebase-key.json`

### Step 3: Initialize Firestore Data
```bash
cd backend
node setup-firebase.js
```

This creates:
- Global knowledge base
- 2 test clients (client_test_001, client_ecommerce_001)
- Sample Q&A for each client

### Step 4: Start Backend Server
```bash
cd backend
npm run dev
```

Expected output:
```
[STARTUP] Anthropic imported
[STARTUP] Creating client...
[STARTUP] Client created successfully
[FIREBASE] Initialized successfully

🚀 Multi-tenant server running on port 5000
```

### Step 5: Run Tests
In a new terminal:
```bash
cd backend
node test-multitenant.js
```

## 📡 API Endpoints

### 1. Chat Endpoint (Multi-tenant)
**POST** `/api/chat`

Request:
```json
{
  "clientId": "client_test_001",
  "conversationId": "conv_001",
  "messages": [
    { "role": "user", "content": "Hello!" }
  ],
  "qaContext": []
}
```

Response:
```json
{
  "message": "Hi! How can I help?",
  "usage": {
    "inputTokens": 150,
    "outputTokens": 20
  },
  "clientId": "client_test_001",
  "conversationId": "conv_001"
}
```

### 2. Get Conversation History
**GET** `/api/conversations/:clientId/:conversationId`

Response:
```json
{
  "messages": [
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." }
  ],
  "clientId": "client_test_001",
  "conversationId": "conv_001"
}
```

### 3. Get Client Knowledge Base
**GET** `/api/clients/:clientId/kb`

Response:
```json
{
  "faqs": [
    {
      "id": "faq_001",
      "question": "What is your support hours?",
      "answer": "24/7 support available",
      "category": "support"
    }
  ]
}
```

### 4. Add/Update KB Item
**POST** `/api/clients/:clientId/kb`

Request:
```json
{
  "id": "faq_custom_001",
  "question": "Your question?",
  "answer": "Your answer",
  "category": "custom"
}
```

### 5. Delete KB Item
**DELETE** `/api/clients/:clientId/kb/:itemId`

## 🗄️ Firestore Schema

```
firestore/
├── clients/
│   ├── client_test_001/
│   │   ├── name: "Test Support Company"
│   │   ├── displayName: "Test Support Bot"
│   │   ├── plan: "pro"
│   │   ├── email: "test@example.com"
│   │   ├── mobile: "+971501234567"
│   │   └── systemPromptAddition: "Optional custom instructions"
│   │
│   └── client_ecommerce_001/
│       ├── name: "E-Commerce Store"
│       └── ...
│
├── knowledgeBases/
│   ├── global/
│   │   └── faqs: [ ... ]
│   │
│   ├── client_test_001/
│   │   └── faqs: [ ... ]
│   │
│   └── client_ecommerce_001/
│       └── faqs: [ ... ]
│
└── conversations/
    ├── client_test_001/
    │   ├── chats/
    │   │   ├── conv_001/ { messages: [...] }
    │   │   └── conv_002/ { messages: [...] }
    │   │
    │   └── client_ecommerce_001/
    │       ├── chats/
    │       │   ├── conv_shop_001/ { messages: [...] }
    │       │   └── ...
```

## 🧪 Testing

### Test with curl
```bash
# Test 1: Health check
curl http://localhost:5000/api/health

# Test 2: Chat with test client
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "client_test_001",
    "conversationId": "conv_001",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'

# Test 3: Get KB
curl http://localhost:5000/api/clients/client_test_001/kb

# Test 4: Add KB item
curl -X POST http://localhost:5000/api/clients/client_test_001/kb \
  -H "Content-Type: application/json" \
  -d '{
    "id": "test_faq",
    "question": "Test question?",
    "answer": "Test answer",
    "category": "test"
  }'
```

### Run Automated Tests
```bash
cd backend
node test-multitenant.js
```

## 🔧 Frontend Integration

The frontend `claudeApi.ts` service has been updated to support multi-tenant:

```typescript
// Generate conversation ID
const convId = generateConversationId();

// Call Claude API
const response = await callClaudeAPI(
  'client_test_001',  // clientId
  convId,             // conversationId
  messages,           // conversation history
  qaContext           // optional additional KB
);

// Fetch KB
const kb = await getClientKB('client_test_001');

// Add KB item
await upsertKBItem('client_test_001', {
  id: 'faq_custom',
  question: 'Q?',
  answer: 'A',
  category: 'custom'
});

// Delete KB item
await deleteKBItem('client_test_001', 'faq_custom');
```

## 🔐 Security Considerations

### Current Implementation
- ✅ Firebase Admin SDK validates client exists
- ⚠️ No API key/token authentication yet
- ⚠️ No rate limiting
- ⚠️ No request validation

### TODO: Add to Production
1. API Key authentication
   ```javascript
   // Add to environment
   KYLO_API_KEYS=client_test_001:sk-api-key-123,client_ecommerce_001:sk-api-key-456
   
   // Validate in middleware
   if (!validateApiKey(clientId, apiKey)) {
     return res.status(401).json({ error: 'Invalid API key' });
   }
   ```

2. Rate limiting per client
3. Request validation middleware
4. Firestore security rules

## 📊 Database Costs

### Firebase Firestore Pricing
- **Read**: $0.06 per 100,000 reads
- **Write**: $0.18 per 100,000 writes
- **Delete**: $0.02 per 100,000 deletes
- **Storage**: $0.18 per GB/month

### Example Monthly Costs (100 active clients)
- 1K messages/day × 100 clients = 100K messages/day
- Each message = ~5 read/write ops
- 500K ops/day = ~15M ops/month
- **Cost**: ~$27/month for Firestore
- **Plus**: Claude API costs (~$0.01-0.05 per message)

## 🚨 Troubleshooting

### Error: "Firebase service account not found"
**Solution**: Download and save `kylo-firebase-key.json` in backend folder

### Error: "Client not found: client_xyz"
**Solution**: Run `node setup-firebase.js` to create test clients

### Error: "Cannot find module 'firebase-admin'"
**Solution**: Run `npm install` in backend folder

### Backend won't start
**Solution**: Check `.env` file has `CLAUDE_API_KEY` set

### Tests fail with "ECONNREFUSED"
**Solution**: Ensure backend is running (`npm run dev`)

## 📈 Next Steps

1. **Add Frontend KB Management UI**
   - Create dashboard page for KB management
   - CRUD operations for Q&A pairs

2. **Add Client Management**
   - Admin dashboard to create/manage clients
   - Per-client settings and customization

3. **Add Authentication**
   - API key validation per client
   - User authentication for dashboard

4. **Add Monitoring**
   - Message usage tracking
   - Analytics dashboard

5. **Add CSP Agent Integration**
   - Integrate UAE business license flow
   - Support for multiple agent types

## 📚 Resources

- [Firebase Admin SDK](https://firebase.google.com/docs/database/admin/start)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Claude API Documentation](https://docs.anthropic.com/)
- [Express.js Documentation](https://expressjs.com/)

## 💬 Questions?

Refer to the detailed comments in:
- `backend/services/firebaseService.js`
- `backend/services/multiTenantService.js`
- `backend/routes/knowledgeBase.js`
- `src/services/claudeApi.ts`

---

**Implementation Status**: ✅ Backend Multi-Tenant Core Complete
**Next**: Frontend KB Management UI
