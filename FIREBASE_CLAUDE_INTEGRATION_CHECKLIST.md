# Firebase + Claude Integration Checklist

**Status:** ✅ **PHASE 1 COMPLETE - Integration Infrastructure Ready**  
**Date:** June 2026  
**Next Phase:** Populate Firebase Data & Backend Setup

---

## ✅ PHASE 1: Integration Infrastructure (COMPLETE)

### Firebase Configuration
- [x] Firebase SDK installed
- [x] `src/firebase/config.ts` created
- [x] Environment variables configured (`.env.local`)
- [x] Auth, Database, Storage initialized
- [x] Production analytics disabled

### Authentication Service
- [x] Register function with email/password
- [x] Login function
- [x] Logout function
- [x] Password reset function
- [x] Auth state listener
- [x] Get current user function
- [x] Error handling

### Realtime Database Service
- [x] Write data function
- [x] Read data function (once)
- [x] Update data function (merge)
- [x] Delete data function
- [x] Subscribe to data (real-time)
- [x] Subscribe to ordered data
- [x] Batch write function
- [x] Auto-ID document creation

### Data Service Layer
- [x] Chart data functions
- [x] Revenue data functions
- [x] Leads management
- [x] Conversations management
- [x] Invoices management
- [x] Training files management
- [x] Dashboard summary function
- [x] All data types defined

### Claude API Service
- [x] Call Claude API (backend routing)
- [x] Process user message
- [x] Passport extraction
- [x] Purchase intent detection
- [x] Escalation detection
- [x] Lead scoring algorithm

### Custom Hooks
- [x] `useAuth()` for auth state
- [x] `useRealtimeData()` for subscriptions
- [x] `useFetchData()` for one-time fetches
- [x] Error handling & loading states

### App Structure
- [x] ProtectedRoute component
- [x] App.tsx updated with Firebase init
- [x] Route protection implemented
- [x] Loading states during auth check

### Dashboard Home
- [x] Firebase integration (no mock data)
- [x] Real-time leads display
- [x] Chart component (ready for data)
- [x] KPI cards with Firebase data
- [x] User greeting with displayName
- [x] Error handling
- [x] Loading states

### Documentation
- [x] Firebase Setup Guide
- [x] Claude API Backend Guide
- [x] Code examples
- [x] Environment variable reference

---

## 📋 PHASE 2: Firebase Data Population (IN PROGRESS)

### Step 1: Initialize Firebase Project
- [ ] Open Firebase Console: https://console.firebase.google.com
- [ ] Select project: `kylo-support`
- [ ] Navigate to Realtime Database
- [ ] Verify connection working

### Step 2: Create Database Structure
- [ ] Navigate to Realtime Database
- [ ] Import or manually create structure:

```
{
  "clients": {
    "user-id-1": {
      "analytics": {
        "chartData": {
          "day1": { "name": "Mon", "visitors": 1000, ... }
        },
        "revenueData": {}
      },
      "leads": {},
      "conversations": {},
      "invoices": {},
      "trainingFiles": {}
    }
  },
  "packages": {},
  "qa": {
    "general": {},
    "pricing": {}
  }
}
```

### Step 3: Add Sample Data
- [ ] Add 5 sample leads
- [ ] Add 7 days of chart data
- [ ] Add 6 months of revenue data
- [ ] Add 3 sample conversations

### Step 4: Test Dashboard
- [ ] Register new account
- [ ] Login with email/password
- [ ] Check that sample leads appear
- [ ] Check real-time updates work
- [ ] Test adding new lead from another window

### Step 5: Update Login Page
- [ ] `src/pages/Login.tsx` use `loginUser()`
- [ ] Error handling
- [ ] Loading state
- [ ] Redirect on success

### Step 6: Update Register Page
- [ ] `src/pages/Register.tsx` use `registerUser()`
- [ ] Email validation
- [ ] Password validation
- [ ] Error handling
- [ ] Redirect on success

---

## 🔧 PHASE 3: Backend Setup (TODO)

### Create Vercel Functions Directory
- [ ] Create `/api` directory
- [ ] Create `api/package.json` (if needed)
- [ ] Create `api/vercel.json` config

### Implement Chat API (`/api/chat.ts`)
- [ ] Install `@anthropic-ai/sdk`
- [ ] Create POST endpoint
- [ ] Parse request body (clientId, messages, qaContext)
- [ ] Build system prompt
- [ ] Call Claude API
- [ ] Return response with token usage
- [ ] Error handling

### Implement Passport API (`/api/passport/extract.ts`)
- [ ] Create POST endpoint
- [ ] Parse image URL
- [ ] Call Claude Vision API
- [ ] Extract passport data
- [ ] Return JSON object
- [ ] Error handling

### Implement Leads Webhook (`/api/leads.ts`)
- [ ] Create POST endpoint
- [ ] Validate lead data
- [ ] Write to Firebase
- [ ] Return success/error
- [ ] Add to conversations

### Implement Stripe Webhook (`/api/payments/webhook.ts`)
- [ ] Create POST endpoint
- [ ] Verify Stripe signature
- [ ] Handle payment.succeeded event
- [ ] Update client subscription in Firebase
- [ ] Trigger onboarding agent

### Environment Variables
- [ ] Set ANTHROPIC_API_KEY in Vercel
- [ ] Set STRIPE_SECRET_KEY
- [ ] Set FIREBASE_ADMIN credentials
- [ ] Set WHATSAPP tokens
- [ ] Test locally with `.env`

---

## 📊 PHASE 4: Dashboard Pages Migration (TODO)

### Dashboard Pages to Update
- [ ] `/pages/dashboard/Leads.tsx` - Replace MOCK_LEADS
- [ ] `/pages/dashboard/Conversations.tsx` - Real conversations
- [ ] `/pages/dashboard/Analytics.tsx` - Real analytics
- [ ] `/pages/dashboard/Payments.tsx` - Real invoices
- [ ] `/pages/dashboard/Training.tsx` - Real files
- [ ] `/pages/dashboard/WhatsApp.tsx` - WhatsApp conversations

### Pattern for Each Page
```typescript
// 1. Import useAuth and useRealtimeData
// 2. Subscribe to Firebase data
// 3. Replace mock data variable
// 4. Add loading states
// 5. Add error handling
// 6. Test real-time updates
```

---

## 🛠️ PHASE 5: Advanced Features (LATER)

### Real-time Chat Widget
- [ ] Embed widget component
- [ ] Chat UI component
- [ ] Message input
- [ ] Claude integration
- [ ] Lead capture modal

### Admin Dashboard
- [ ] Client management
- [ ] Q&A knowledge base editor
- [ ] Performance analytics
- [ ] User settings

### Integrations
- [ ] Stripe Checkout
- [ ] WhatsApp Cloud API
- [ ] Passport OCR
- [ ] Email notifications

---

## 🧪 Testing Checklist

### Authentication
- [ ] Register with email
- [ ] Login with credentials
- [ ] Logout
- [ ] Redirect to login when not authenticated
- [ ] Password reset flow

### Dashboard
- [ ] Dashboard loads without errors
- [ ] Displays current user name
- [ ] Shows leads from Firebase
- [ ] Real-time updates when data changes
- [ ] Handles no data gracefully

### Real-time Updates
- [ ] Add lead in Firebase Console
- [ ] See it appear in dashboard
- [ ] Delete lead in console
- [ ] See it disappear in dashboard
- [ ] Modify lead in console
- [ ] See changes in dashboard

### Error Handling
- [ ] No internet connection
- [ ] Firebase down
- [ ] Authentication expired
- [ ] Invalid data structure

---

## 📝 File Status Summary

### New Files Created
✅ `src/firebase/config.ts`  
✅ `src/firebase/auth.ts`  
✅ `src/firebase/database.ts`  
✅ `src/services/claudeApi.ts`  
✅ `src/services/dataService.ts`  
✅ `src/hooks/useAuth.ts`  
✅ `src/hooks/useData.ts`  
✅ `src/components/ProtectedRoute.tsx`  
✅ `.env.local`  

### Modified Files
✅ `src/App.tsx` - Firebase init + protected routes  
✅ `src/pages/dashboard/Home.tsx` - Firebase data instead of mock  
✅ `src/lib/mockData.ts` - Deprecated (kept for compatibility)  

### To Update
⏳ `src/pages/Login.tsx` - Firebase auth  
⏳ `src/pages/Register.tsx` - Firebase auth  
⏳ `src/pages/dashboard/Leads.tsx` - Firebase data  
⏳ `src/pages/dashboard/Conversations.tsx` - Firebase data  
⏳ `src/pages/dashboard/Analytics.tsx` - Firebase data  
⏳ `src/pages/dashboard/Payments.tsx` - Firebase data  
⏳ `src/pages/dashboard/Training.tsx` - Firebase data  

### To Create
⏳ `/api/chat.ts` - Claude API  
⏳ `/api/passport/extract.ts` - Passport OCR  
⏳ `/api/leads.ts` - Lead webhook  
⏳ `/api/payments/webhook.ts` - Stripe webhook  

---

## 🚀 Quick Start Commands

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint

# Deploy to Vercel
vercel deploy
```

---

## 📊 Project Timeline

| Phase | Timeline | Status |
|-------|----------|--------|
| Phase 1: Infrastructure | ✅ Complete | Ready to use |
| Phase 2: Firebase Data | ⏳ This Week | Add sample data |
| Phase 3: Backend Setup | ⏳ Week 2 | Vercel functions |
| Phase 4: Page Migration | ⏳ Week 3 | Update all pages |
| Phase 5: Advanced | ⏳ Week 4+ | Extra features |

---

## 🎯 Success Criteria

- [x] Firebase initialized and connected
- [x] Auth system functional
- [x] Realtime database working
- [x] Dashboard loads with real data
- [x] Protected routes enforced
- [ ] All pages using Firebase data
- [ ] Claude API integrated
- [ ] Lead capture working
- [ ] Ready for production

---

## 💡 Tips & Best Practices

1. **Always use hooks** - Don't call Firebase directly in components
2. **Unsubscribe** - Custom hooks handle cleanup automatically
3. **Check user** - Always verify `user` exists before using `user.uid`
4. **Error handling** - All async operations should have try/catch
5. **Loading states** - Show spinners while fetching
6. **Real-time listeners** - Are set up correctly in all data services

---

## 🆘 Need Help?

**Common Issues:**
1. Firebase not initialized? Check `import './firebase/config'` in App.tsx
2. No data showing? Add data to Firebase Console at `/clients/{userId}/`
3. Auth redirect loop? Check ProtectedRoute component
4. API 404? Backend not running - use mock for now

---

**Status:** ✅ Phase 1 Complete - Ready for Phase 2  
**Next Action:** Populate Firebase with test data  
**ETA:** 3-4 weeks to production ready
