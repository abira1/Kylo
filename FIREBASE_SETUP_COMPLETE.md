# Firebase + Claude Integration Setup Guide

**Status:** Firebase Realtime Database & Authentication Connected  
**Last Updated:** June 2026  
**Frontend:** React 18 + TypeScript  
**Backend Services:** Firebase + Claude API

---

## ✅ What Has Been Completed

### 1. Firebase Configuration
- ✅ Firebase config file created (`src/firebase/config.ts`)
- ✅ Environment variables configured (`.env.local`)
- ✅ Firebase SDK installed (v12.15.0 already in package.json)

### 2. Firebase Services
- ✅ Authentication service (`src/firebase/auth.ts`)
  - Register/Login with email & password
  - Logout functionality
  - Password reset
  - Real-time auth state management

- ✅ Realtime Database service (`src/firebase/database.ts`)
  - CRUD operations
  - Real-time subscriptions
  - Batch writes
  - Ordered queries

### 3. Data Services
- ✅ Data service layer (`src/services/dataService.ts`)
  - Replaces all mockData
  - Firebase-backed data fetching
  - Real-time listeners
  - Lead, conversation, invoice, training file management

### 4. Claude API Service
- ✅ Claude service (`src/services/claudeApi.ts`)
  - Backend endpoint calling (not exposing API key in frontend)
  - Chat API integration
  - Passport OCR integration
  - Intent detection
  - Lead scoring

### 5. Custom Hooks
- ✅ `useAuth()` - Authentication state management
- ✅ `useRealtimeData()` - Real-time data subscription
- ✅ `useFetchData()` - One-time data fetching

### 6. Protected Routes
- ✅ `ProtectedRoute` component - Auth-based route protection
- ✅ App routing updated with auth guards

### 7. Dashboard Home Page
- ✅ Updated to use Firebase data instead of mock data
- ✅ Real-time leads & metrics updates
- ✅ Loading states & error handling

---

## 🚀 Next Steps to Complete Integration

### Step 1: Install Anthropic Package (Optional - Backend Only)
```bash
npm install @anthropic-ai/sdk
```

**Note:** The Claude API key should NEVER be in frontend code. Only install this in your backend/Vercel functions.

### Step 2: Update Login Page
Update `src/pages/Login.tsx` to use Firebase Auth:

```typescript
import { loginUser } from '../../firebase/auth';

async function handleLogin(email: string, password: string) {
  try {
    const user = await loginUser(email, password);
    // Redirect to dashboard
  } catch (error) {
    // Show error
  }
}
```

### Step 3: Update Register Page
Update `src/pages/Register.tsx` to use Firebase Auth:

```typescript
import { registerUser } from '../../firebase/auth';

async function handleRegister(email: string, password: string, name: string) {
  try {
    const user = await registerUser(email, password, name);
    // Redirect to dashboard
  } catch (error) {
    // Show error
  }
}
```

### Step 4: Initialize Firebase Data Structure
You need to populate your Firebase Realtime Database with the schema:

```
clients/
  ├── {clientId}/
  │   ├── analytics/
  │   │   ├── chartData
  │   │   └── revenueData
  │   ├── leads/
  │   ├── conversations/
  │   ├── invoices/
  │   └── trainingFiles/
  ├── packages/
  └── platform/
```

### Step 5: Backend Setup (Vercel Functions)
Create Vercel serverless functions for:
- `/api/chat` - Claude API integration
- `/api/passport/extract` - Claude Vision API
- `/api/payments/create` - Stripe integration
- `/api/whatsapp/webhook` - WhatsApp Cloud API

**Backend `.env.local`:**
```bash
ANTHROPIC_API_KEY=sk-ant-...
STRIPE_SECRET_KEY=sk_live_...
WHATSAPP_ACCESS_TOKEN=...
FIREBASE_ADMIN_SDK_KEY=...
```

### Step 6: Update Other Dashboard Pages
The same pattern used in Home.tsx should be applied to:
- `src/pages/dashboard/Leads.tsx`
- `src/pages/dashboard/Conversations.tsx`
- `src/pages/dashboard/Analytics.tsx`
- `src/pages/dashboard/Payments.tsx`
- `src/pages/dashboard/Training.tsx`

Replace mock data imports with Firebase subscriptions.

---

## 📝 Firebase Database Structure

### Collections Path
```
clients/{userId}/
├── analytics/chartData          ← 7 days of metrics
├── analytics/revenueData        ← Monthly revenue
├── leads/                       ← All captured leads
├── conversations/               ← Chat history
├── invoices/                    ← Payment records
└── trainingFiles/               ← Uploaded docs
```

### Data Models

**Lead**
```typescript
{
  id: string;
  name: string;
  email: string;
  company: string;
  status: 'Qualified' | 'New' | 'Contacted' | 'Won' | 'Lost';
  source: 'Website Widget' | 'WhatsApp' | 'Landing Page' | 'Other';
  score: number;           // 0-100
  date: ISO8601 string;    // When captured
}
```

**Conversation**
```typescript
{
  id: string;
  visitorName: string;
  status: 'Active' | 'Closed' | 'Waiting';
  lastMessage: string;
  time: string;
  channel: 'Website' | 'WhatsApp' | 'Email';
  messages: Message[];
}
```

**Message**
```typescript
{
  sender: 'bot' | 'user';
  text: string;
  time: string;
}
```

---

## 🔑 Environment Variables

### Frontend (`.env.local`) - ALREADY SET
```bash
VITE_FIREBASE_API_KEY=AIzaSyATz0TN-8tvTeohWcJBSbnVwRvVvj5UT3Y
VITE_FIREBASE_AUTH_DOMAIN=kylo-support.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://kylo-support-default-rtdb...
VITE_FIREBASE_PROJECT_ID=kylo-support
VITE_FIREBASE_STORAGE_BUCKET=kylo-support.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=991192517952
VITE_FIREBASE_APP_ID=1:991192517952:web:2d3429fd5b65b62b95fea5
VITE_FIREBASE_MEASUREMENT_ID=G-G8KMECZ0Y0

VITE_APP_URL=http://localhost:5173
VITE_API_BASE_URL=http://localhost:3000
```

### Backend (Vercel functions `.env`)
```bash
ANTHROPIC_API_KEY=sk-ant-api03-DBHMOIYo_y-kEN3Trpw3wHpBmPtvk68e...
STRIPE_SECRET_KEY=sk_live_...
FIREBASE_PROJECT_ID=kylo-support
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY=...
```

---

## 🧪 Testing Firebase Connection

### Test Authentication
1. Go to `/register`
2. Create a new account with email/password
3. Should redirect to `/dashboard`
4. Check Firebase Console → Authentication tab

### Test Realtime Database
1. Add test data in Firebase Console:
   - Path: `clients/{your-uid}/leads`
   - Data: Lead object
2. Dashboard should show the lead in real-time

---

## 🐛 Common Issues & Solutions

### Issue: "Firebase is not initialized"
**Solution:** Make sure `import './firebase/config'` is at the top of App.tsx

### Issue: "Cannot read property 'uid' of null"
**Solution:** User might not be authenticated. Check:
1. Is the route protected with `<ProtectedRoute>`?
2. Is `useAuth()` returning a valid user?

### Issue: "No data showing in dashboard"
**Solution:**
1. Check Firebase Console for data in `/clients/{userId}/leads`
2. Check browser console for subscription errors
3. Verify user UID matches the path

### Issue: "API call to /api/chat fails"
**Solution:** Backend not running yet. For now, skip Claude integration.

---

## 🚀 Starting the App

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Navigate to http://localhost:5173
```

---

## 📚 Files Modified

**New Files:**
- `src/firebase/config.ts` - Firebase initialization
- `src/firebase/auth.ts` - Authentication service
- `src/firebase/database.ts` - Realtime Database service
- `src/services/claudeApi.ts` - Claude API service
- `src/services/dataService.ts` - Data service layer
- `src/hooks/useAuth.ts` - Auth hook
- `src/hooks/useData.ts` - Data hooks
- `src/components/ProtectedRoute.tsx` - Protected route component
- `.env.local` - Environment variables

**Modified Files:**
- `src/App.tsx` - Added Firebase init, protected routes
- `src/pages/dashboard/Home.tsx` - Replaced mock data with Firebase
- `src/lib/mockData.ts` - Deprecated (kept for compatibility)

---

## ✨ What's Ready to Use

### Frontend Components
- ✅ Firebase Auth (register, login, logout)
- ✅ Protected routes
- ✅ Real-time data subscriptions
- ✅ User display (name, email)
- ✅ Dashboard metrics from real leads

### Firebase Features
- ✅ Authentication (email/password)
- ✅ Realtime Database
- ✅ Auto-unsubscribe on component unmount
- ✅ Error handling & loading states

---

## 🔜 Coming Next

1. **Backend Setup**
   - Vercel functions for Claude API
   - Stripe payment flow
   - WhatsApp webhook handler

2. **More Dashboard Pages**
   - Update Leads, Conversations, Analytics pages
   - Add real-time updates

3. **Claude API Integration**
   - Q&A retrieval logic
   - Lead capture triggers
   - Passport OCR

4. **Advanced Features**
   - Offline support
   - Data caching
   - Performance optimizations

---

## 📞 Support

For issues:
1. Check browser console for errors
2. Check Firebase Console for data issues
3. Verify `.env.local` has all required variables
4. Check network tab for API failures

---

**Status:** Ready for Development  
**Next Phase:** Backend API setup
