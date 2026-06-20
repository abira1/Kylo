# Quick Reference: Multi-Tenant Setup

## ✅ What's Been Implemented

### Backend
- ✅ Firebase service (`firebaseService.js`)
- ✅ Multi-tenant service (`multiTenantService.js`)
- ✅ KB routes (`knowledgeBase.js`)
- ✅ Updated server (`server-clean.js`)
- ✅ Firebase setup script
- ✅ API test script

### Frontend
- ✅ Updated API service (`claudeApi.ts`)
- ✅ Conversation ID generation
- ✅ Multi-tenant functions

### Configuration
- ✅ Updated `package.json` with firebase-admin
- ✅ Updated `.env` with Firebase config

## 🔄 How It Works

```
User sends message with clientId
        ↓
Backend loads client + KB from Firestore
        ↓
Builds system prompt with client context
        ↓
Calls Claude API (same key, different context)
        ↓
Saves conversation to Firestore (per-client)
        ↓
Returns response to frontend
```

## 📋 Setup Checklist

- [ ] Download Firebase service account key → `backend/kylo-firebase-key.json`
- [ ] Run `node setup-firebase.js` (creates test data)
- [ ] Start backend: `npm run dev`
- [ ] Run tests: `node test-multitenant.js`
- [ ] Check Firestore Console for created data

## 🧪 Test Clients Available

```
client_test_001
├── Name: Test Support Company
├── Display: Test Support Bot
└── KB: Support FAQs

client_ecommerce_001
├── Name: E-Commerce Store
├── Display: Shop Assistant
└── KB: Shipping/Product FAQs
```

## 🔌 API Calls (from Frontend)

```typescript
// 1. Generate conversation ID
const convId = generateConversationId();

// 2. Send message
const response = await callClaudeAPI(
  'client_test_001',
  convId,
  [{ role: 'user', content: 'Hello!' }]
);

// 3. Get KB
const kb = await getClientKB('client_test_001');

// 4. Add KB item
await upsertKBItem('client_test_001', {
  id: 'faq_new',
  question: 'Q?',
  answer: 'A'
});
```

## 🐛 Common Issues

| Issue | Solution |
|-------|----------|
| "Client not found" | Run `node setup-firebase.js` |
| "Cannot find firebase-admin" | Run `npm install` in backend |
| "Connection refused" | Start backend with `npm run dev` |
| Service account error | Download from Firebase Console |

## 📊 Firestore Collections

| Collection | Purpose |
|-----------|---------|
| `clients/{clientId}` | Client info (name, plan, etc) |
| `knowledgeBases/global` | Shared KB for all clients |
| `knowledgeBases/{clientId}` | Client-specific KB |
| `conversations/{clientId}/chats` | Client conversations |

## 🎯 Next Phase

When ready, we'll build:
1. Frontend KB management dashboard
2. Client management interface
3. API authentication
4. Usage analytics

For now, you can:
- Test with curl/API tools
- Manually manage KB via Firestore Console
- Develop frontend components

---

**Questions?** Check `MULTITENANT_GUIDE.md` for detailed information
