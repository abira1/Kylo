# 🎯 WEEK 6 ACTION PLAN - Admin Dashboard APIs

## Summary
**Status:** Phase 1 ✅ COMPLETE | Cache Infrastructure ✅ COMPLETE | Server ✅ WORKING
**Next:** Build 8 Admin APIs to enable admin dashboard functionality
**Estimated Time:** 2-3 days of development
**Blocking:** Can't test admin features until these APIs exist

---

## Critical Path to Production

```
TODAY (Wed) - Fix server port issue + verify cache
  ✅ Cache tests: 19/19 passing
  ✅ Server starts successfully
  ✅ All backend services running

TOMORROW (Thu) - Begin admin API development
  ⏳ Create GET /api/kylo/admin/sessions
  ⏳ Create GET /api/kylo/admin/sessions/{id}
  ⏳ Create PATCH /api/kylo/admin/sessions/{id}
  ⏳ Create GET /api/kylo/admin/sessions/{id}/transcript

FRIDAY - Continue admin APIs
  ⏳ Create POST /api/kylo/admin/escalate/{id}
  ⏳ Create GET /api/kylo/admin/analytics
  ⏳ Create GET /api/kylo/admin/analytics/trends
  ⏳ Create POST /api/kylo/admin/export/sessions

NEXT WEEK - Admin UI + Testing
  ⏳ Connect frontend to new APIs
  ⏳ Build admin session list
  ⏳ Build session details view
  ⏳ End-to-end testing
  ⏳ Performance validation
```

---

## 8 Required Admin APIs

### 1️⃣ List All Sessions
```
GET /api/kylo/admin/sessions
Query Parameters:
  - status: "active" | "paused" | "escalated" | "completed" (optional)
  - startDate: ISO string (optional)
  - endDate: ISO string (optional)
  - searchTerm: phone/email/name (optional)
  - page: number (default 1)
  - limit: number (default 20)

Response:
{
  sessions: [
    {
      sessionId: "sess-123",
      phoneNumber: "+971501234567",
      status: "active",
      currentStep: 5,
      createdAt: "2026-06-20T10:00:00Z",
      updatedAt: "2026-06-20T10:15:00Z",
      lastMessage: "What is your business name?"
    }
  ],
  total: 150,
  page: 1,
  pages: 8
}
```

**Implementation:**
```javascript
// Query Firestore with filters
const query = sessionsCollection();
if (filters.status) query = query.where('status', '==', filters.status);
if (filters.startDate) query = query.where('createdAt', '>=', new Date(filters.startDate));
const snapshot = await query.orderBy('createdAt', 'desc').limit(limit).get();
return snapshot.docs.map(doc => ({ sessionId: doc.id, ...doc.data() }));
```

---

### 2️⃣ Get Session Details
```
GET /api/kylo/admin/sessions/{id}

Response:
{
  sessionId: "sess-123",
  phoneNumber: "+971501234567",
  status: "active",
  currentStep: 5,
  language: "en",
  createdAt: "2026-06-20T10:00:00Z",
  updatedAt: "2026-06-20T10:15:00Z",
  
  collectedFields: {
    firstName: "John",
    lastName: "Doe",
    email: "john@example.com",
    businessName: "Tech Solutions LLC",
    // ... all 20+ fields
  },
  
  documents: {
    passport: { status: "pending", extractedData: {...} },
    visa: { status: "extracted", extractedData: {...} },
    // ... etc
  },
  
  escalations: [
    {
      reason: "Document verification failed",
      createdAt: "2026-06-20T10:10:00Z",
      assignedTo: "admin@kylo.ai"
    }
  ]
}
```

**Implementation:**
```javascript
const sessionDoc = await sessionsCollection().doc(sessionId).get();
if (!sessionDoc.exists) throw new Error('Session not found');
return sessionDoc.data();
```

---

### 3️⃣ Update Session
```
PATCH /api/kylo/admin/sessions/{id}

Request Body:
{
  adminNotes: "Customer needs visa extension help",
  tags: ["urgent", "visa-issue"],
  priority: "high"
}

Response:
{
  success: true,
  sessionId: "sess-123",
  updated: true
}
```

**Implementation:**
```javascript
await sessionsCollection().doc(sessionId).update({
  adminNotes: body.adminNotes,
  tags: body.tags,
  priority: body.priority,
  updatedBy: adminId,
  updatedAt: new Date()
});
```

---

### 4️⃣ Get Conversation Transcript
```
GET /api/kylo/admin/sessions/{id}/transcript

Response:
{
  sessionId: "sess-123",
  messages: [
    {
      messageId: "msg-1",
      sender: "system",
      text: "Welcome! Let's start your business license application",
      timestamp: "2026-06-20T10:00:00Z",
      step: 1
    },
    {
      messageId: "msg-2",
      sender: "user",
      text: "Sure, I'm ready to start",
      timestamp: "2026-06-20T10:00:30Z"
    },
    // ... all messages in chronological order
  ],
  totalMessages: 47
}
```

**Implementation:**
```javascript
const sessionDoc = await sessionsCollection().doc(sessionId).get();
const messages = sessionDoc.data().conversationHistory || [];
return { sessionId, messages, totalMessages: messages.length };
```

---

### 5️⃣ Manual Escalation
```
POST /api/kylo/admin/escalate/{id}

Request Body:
{
  reason: "Document verification failed",
  assignedTo: "admin@kylo.ai",
  notes: "Customer unable to provide valid visa document"
}

Response:
{
  success: true,
  escalationId: "esc-456",
  sessionId: "sess-123",
  escalatedAt: "2026-06-20T10:20:00Z"
}
```

**Implementation:**
```javascript
// Update session status
await sessionsCollection().doc(sessionId).update({
  status: 'escalated',
  escalationTracking: {
    reason: body.reason,
    assignedTo: body.assignedTo,
    notes: body.notes,
    escalatedAt: new Date(),
    escalatedBy: adminId
  }
});

// Log to escalations collection
await escalationsCollection().add({
  sessionId,
  reason: body.reason,
  assignedTo: body.assignedTo,
  notes: body.notes,
  escalatedAt: new Date()
});
```

---

### 6️⃣ Get Analytics
```
GET /api/kylo/admin/analytics

Response:
{
  summary: {
    totalSessions: 250,
    activeSessions: 45,
    completedSessions: 180,
    escalatedSessions: 25,
    successRate: 72,  // percentage
    averageStepsCompleted: 12.5
  },
  
  byStatus: {
    active: 45,
    completed: 180,
    escalated: 25,
    paused: 0
  },
  
  byday: {
    "2026-06-20": 42,
    "2026-06-19": 38,
    "2026-06-18": 35,
    // ... last 30 days
  },
  
  topIssues: [
    { reason: "Document verification failed", count: 12 },
    { reason: "Visa status unclear", count: 8 },
    { reason: "Business address invalid", count: 5 }
  ]
}
```

**Implementation:**
```javascript
const allSessions = await sessionsCollection().get();
const sessions = allSessions.docs.map(d => d.data());

const stats = {
  totalSessions: sessions.length,
  activeSessions: sessions.filter(s => s.status === 'active').length,
  completedSessions: sessions.filter(s => s.status === 'completed').length,
  // ... calculate rest
};

// Calculate daily stats, top issues, etc.
return stats;
```

---

### 7️⃣ Analytics Trends
```
GET /api/kylo/admin/analytics/trends?period=30

Response:
{
  period: "30days",
  data: [
    {
      date: "2026-05-21",
      sessionsCreated: 5,
      sessionsCompleted: 2,
      escalations: 1,
      conversionRate: 40
    },
    // ... 30 days of data
  ],
  
  trend: {
    direction: "up",     // "up" | "down" | "stable"
    percentChange: 15,   // compared to previous period
    momentum: "positive" // indicates growth
  }
}
```

**Implementation:**
```javascript
// Query sessions grouped by date
const startDate = new Date();
startDate.setDate(startDate.getDate() - period);

const sessions = await sessionsCollection()
  .where('createdAt', '>=', startDate)
  .orderBy('createdAt')
  .get();

// Group by date and calculate metrics
const dailyData = {};
sessions.docs.forEach(doc => {
  const date = doc.data().createdAt.toISOString().split('T')[0];
  if (!dailyData[date]) dailyData[date] = { created: 0, completed: 0, escalated: 0 };
  dailyData[date].created++;
  if (doc.data().status === 'completed') dailyData[date].completed++;
  // ... etc
});
```

---

### 8️⃣ Export Sessions
```
POST /api/kylo/admin/export/sessions

Request Body:
{
  format: "csv" | "json" | "xlsx",
  filters: {
    status: "completed",
    startDate: "2026-06-01",
    endDate: "2026-06-30",
    tags: ["successful"]
  }
}

Response:
{
  downloadUrl: "https://kylo-ai.s3.amazonaws.com/exports/sessions-2026-06-20.csv",
  expiresIn: 3600,  // seconds
  fileName: "sessions-2026-06-20.csv",
  rowCount: 45
}
```

**Implementation:**
```javascript
// 1. Query sessions with filters
const sessions = await sessionsCollection()
  .where('status', '==', filters.status)
  .where('createdAt', '>=', new Date(filters.startDate))
  .get();

// 2. Format data
const data = sessions.docs.map(doc => ({
  sessionId: doc.id,
  phoneNumber: doc.data().phoneNumber,
  status: doc.data().status,
  // ... include relevant fields
}));

// 3. Convert to CSV/JSON/XLSX
const csv = convertToCSV(data);

// 4. Upload to S3
const fileName = `exports/sessions-${new Date().toISOString()}.csv`;
await uploadToS3(fileName, csv);

// 5. Return signed URL
const signedUrl = await getSignedUrl(fileName);
```

---

## Implementation Order (Recommended)

```
Priority 1 (APIs 1-2): Session data retrieval
  - GET /sessions - needed for admin list view
  - GET /sessions/{id} - needed for admin details view

Priority 2 (API 3): Session management
  - PATCH /sessions/{id} - needed to add notes/tags

Priority 3 (API 4-5): Conversation access + escalation
  - GET /sessions/{id}/transcript - needed to show chat
  - POST /admin/escalate - needed to escalate issues

Priority 4 (APIs 6-7): Analytics
  - GET /admin/analytics - dashboard summary
  - GET /admin/analytics/trends - charts and trends

Priority 5 (API 8): Export
  - POST /admin/export/sessions - for reporting/data download
```

---

## Code Structure to Add

### Create new file: `backend/routes/admin.js`
```javascript
const express = require('express');
const admin = require('firebase-admin');
const { db } = require('../services/firebaseService');

const router = express.Router();

// Auth middleware - verify admin user
async function verifyAdmin(req, res, next) {
  // TODO: Implement admin auth verification
  // Check Firebase ID token, verify user role
  next();
}

// Apply to all routes
router.use(verifyAdmin);

// 1. List sessions
router.get('/sessions', async (req, res) => { /* ... */ });

// 2. Get session details
router.get('/sessions/:id', async (req, res) => { /* ... */ });

// 3. Update session
router.patch('/sessions/:id', async (req, res) => { /* ... */ });

// 4. Get transcript
router.get('/sessions/:id/transcript', async (req, res) => { /* ... */ });

// 5. Escalate
router.post('/escalate/:id', async (req, res) => { /* ... */ });

// 6. Analytics
router.get('/analytics', async (req, res) => { /* ... */ });

// 7. Trends
router.get('/analytics/trends', async (req, res) => { /* ... */ });

// 8. Export
router.post('/export/sessions', async (req, res) => { /* ... */ });

module.exports = router;
```

### Update: `backend/server-clean.js`
```javascript
// Add to imports
const adminRoutes = require('./routes/admin');

// Add to app setup (after existing routes)
app.use('/api/kylo/admin', adminRoutes);
```

---

## Testing the APIs

```bash
# List sessions
curl -X GET "http://localhost:5003/api/kylo/admin/sessions?status=active" \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Get session details
curl -X GET "http://localhost:5003/api/kylo/admin/sessions/sess-123" \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Update session
curl -X PATCH "http://localhost:5003/api/kylo/admin/sessions/sess-123" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{"adminNotes":"Needs review","tags":["urgent"]}'

# Get transcript
curl -X GET "http://localhost:5003/api/kylo/admin/sessions/sess-123/transcript" \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Get analytics
curl -X GET "http://localhost:5003/api/kylo/admin/analytics" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

---

## Success Criteria for Week 6

✅ All 8 APIs created and tested
✅ Responses match documented format
✅ Proper error handling implemented
✅ Admin authentication added
✅ Frontend connected to APIs
✅ Admin dashboard shows real data
✅ Session management working
✅ Escalation system functional

---

**Week 6 Estimated Effort:** 2-3 days development + 1-2 days frontend integration
**Target Completion:** End of next week (June 27, 2026)
**Production Launch:** Early July 2026
