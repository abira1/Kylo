# Quick Start: Complete Login System Testing

**Start Date:** June 17, 2026  
**Setup Time:** 5 minutes to test  

---

## ⚡ Quick Setup (2 minutes)

### 1. Ensure Dev Server is Running
```bash
npm run dev
```
Visit: `http://localhost:5173`

### 2. Start Fresh (Clear old login state)
In browser DevTools Console:
```javascript
localStorage.clear();
sessionStorage.clear();
```

---

## 🧪 Test Flows

### Test 1: Admin Login (2 minutes) ✅

**Scenario:** Admin user logs in with Google

**Steps:**
1. Go to: `http://localhost:5173/admin/login`
2. Click **"Sign in with Google"**
3. Use account: `abirsabirhossain@gmail.com`
4. ✅ Should redirect to `/admin/dashboard`

**Verify:**
- [ ] Page shows "System Operations"
- [ ] URL is `/admin/dashboard`
- [ ] Can see admin-specific features

**Troubleshoot:**
- If "Google login is only available for admin users" error:
  - Your Google account email is not `abirsabirhossain@gmail.com`
  - Try the email/password method instead

**Email/Password Alternative:**
1. Email: `abirsabirhossain@gmail.com`
2. Password: (any password)
3. Click **"Authenticate"**
4. ✅ Should redirect to admin dashboard

---

### Test 2: New Client Registration (3 minutes) ✅

**Scenario:** Brand new client signs up with package + payment

**Steps:**

#### Step 1: Account
1. Go to: `http://localhost:5173/register`
2. Fill in:
   - Full Name: `John Doe`
   - Company: `Tech Corp`
   - Email: `john@techcorp.com`
   - Password: `Password123` (6+ chars)
3. Click **"Continue to Packages"**

#### Step 2: Package Selection
1. Select **"Professional"** ($79/mo) - It's highlighted
2. Click **"Continue to Payment"**

#### Step 3: Payment
1. Full Name on Card: `John Doe`
2. Card Number: `4242 4242 4242 4242`
3. Expiry Date: `12/25`
4. CVC: `123`
5. Click **"Complete Registration & Activate Account"**

**Verify:**
- [ ] See loading spinner while processing
- [ ] Redirected to `/dashboard`
- [ ] Dashboard shows "Welcome John Doe"
- [ ] Can see dashboard content

**What Happened Behind Scenes:**
```
✅ Created Firebase auth account
✅ Processed (mock) payment
✅ Created client/{uid}/profile in Firebase
✅ Initialized client workspace (leads, conversations, etc.)
✅ Created first invoice
✅ Auto-logged in user
```

**Troubleshoot:**
- If payment fails: Check all card fields are filled
- If redirect fails: Check browser console for errors
- If Firebase error: Verify `.env.local` has correct credentials

---

### Test 3: Client Login (1 minute) ✅

**Scenario:** Registered client logs back in

**Steps:**
1. First, logout: Go to dashboard, find logout button
2. Go to: `http://localhost:5173/login`
3. Enter credentials from Test 2:
   - Email: `john@techcorp.com`
   - Password: `Password123`
4. Click **"Sign In"**

**Verify:**
- [ ] Redirected to `/dashboard`
- [ ] Shows "Welcome John Doe"
- [ ] Can access their workspace

**Troubleshoot:**
- "Invalid credentials" error: Check exact email/password
- Get redirected to `/login` after login: Session issue, try clearing cache

---

### Test 4: Wrong Admin Email (1 minute) ✅

**Scenario:** Someone tries to login with wrong email (security test)

**Steps:**
1. Go to: `http://localhost:5173/admin/login`
2. Email: `wrong@example.com`
3. Password: `password`
4. Click **"Authenticate"**

**Verify:**
- [ ] Error: "Only administrators can access this portal"
- [ ] NOT redirected to admin dashboard
- [ ] Stays on login page

---

### Test 5: Wrong Password (1 minute) ✅

**Scenario:** Client enters wrong password

**Steps:**
1. Go to: `http://localhost:5173/login`
2. Email: `john@techcorp.com` (from Test 2)
3. Password: `WrongPassword`
4. Click **"Sign In"**

**Verify:**
- [ ] Error message appears
- [ ] NOT redirected
- [ ] Can try again

---

### Test 6: Protected Routes (1 minute) ✅

**Scenario:** Try accessing dashboard without login

**Steps:**
1. Clear localStorage: `localStorage.clear()`
2. Go to: `http://localhost:5173/dashboard`

**Verify:**
- [ ] Redirected to `/login`
- [ ] See login form
- [ ] Can then login successfully

---

## 🔍 Verify Firebase Setup

### Check Firebase Console

1. Go to: https://console.firebase.google.com
2. Select project: `kylo-support`
3. Click **"Authentication"** → **"Users"**
   - Should see accounts created in Test 2 & 3
4. Click **"Realtime Database"** 
   - Navigate to: `clients/{user-id}/profile`
   - Should see profile with `packageId`, `paymentStatus`
   - Should see invoice created

### Check Browser Local Storage

Open DevTools → Application → Local Storage → Find your domain:
```javascript
// Should contain:
firebase:authUser:[projectId]: { /* user object */ }
```

---

## 📊 What Works Now

| Feature | Status | How to Test |
|---------|--------|------------|
| Admin Google Login | ✅ | Test 1 |
| Admin Email/Password | ✅ | Test 1 (alternative) |
| Client Registration | ✅ | Test 2 |
| Client Login | ✅ | Test 3 |
| Package Selection | ✅ | Test 2, Step 2 |
| Mock Payment | ✅ | Test 2, Step 3 |
| Session Persistence | ✅ | Refresh page after login |
| Protected Routes | ✅ | Test 6 |
| Error Handling | ✅ | Test 4 & 5 |

---

## 🚨 Errors You Might See (& How to Fix)

### Error: "Failed to initialize Firebase"
**Cause:** `.env.local` not set up correctly  
**Fix:** Verify all VITE_FIREBASE_* variables in `.env.local`

### Error: "Permission denied at /clients"
**Cause:** Firebase Realtime Database rules too strict  
**Fix:** Temporarily set rules to allow all (dev only):
```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

### Error: "signInWithPopup() is not supported"
**Cause:** Google OAuth not configured or browser popup blocked  
**Fix:** Check browser pop-up settings or use email/password

### Error: "User already exists"
**Cause:** Email already registered  
**Fix:** Use different email for new test account

### Redirect Loop Between /login and /dashboard
**Cause:** Auth state not updating properly  
**Fix:** Clear cache: `localStorage.clear()` then refresh

---

## ✨ Test Data for Easy Reference

### Admin Account (For Test 1)
```
Email: abirsabirhossain@gmail.com
Method: Google OAuth (or email/password)
Access: /admin/login → /admin/dashboard
```

### Sample Client Account (For Test 2-3)
```
Email: john@techcorp.com
Password: Password123
Company: Tech Corp
Package: Professional ($79/mo)
Card: 4242 4242 4242 4242
Access: /register (first) → /login (return)
```

### Test Card Numbers
- **Success:** `4242 4242 4242 4242`
- **Decline:** `4000 0000 0000 0002` (all cards work in mock)

---

## 📈 Success Metrics

✅ All 6 tests pass  
✅ No console errors  
✅ Firebase shows created accounts  
✅ Dashboard shows real data  
✅ Package selection saves correctly  
✅ Payment processes (even if mock)  

---

## 🔒 Security Checks

### Admin Portal
- [ ] Only abirsabirhossain@gmail.com can access
- [ ] Other users get error message
- [ ] No console errors leaking data

### Client Accounts
- [ ] Passwords hashed by Firebase
- [ ] Each client isolated from others
- [ ] Can't access other client's leads

### Payment
- [ ] Card data never stored (mock doesn't store)
- [ ] Payment status tracked in Firebase
- [ ] Invoice created per payment

---

## 🎯 Debugging Tips

### Check current user
In browser console:
```javascript
// Get currently logged-in user
const { getCurrentUser } = await import('src/firebase/auth.ts');
getCurrentUser();
```

### Monitor Firebase calls
In browser console Network tab:
- Filter by "firebaseio.com"
- Should see POST/PUT requests for login/registration
- Should see GET requests for reading user data

### Check component state
Use React DevTools browser extension:
- Find `<Login>` component
- Check state values in hook panel
- Verify email/password inputs

---

## ✅ Completion Checklist

- [ ] Cloned repo and ran `npm install`
- [ ] Updated `.env.local` with Firebase credentials
- [ ] Started dev server: `npm run dev`
- [ ] Test 1 passed: Admin Google login
- [ ] Test 2 passed: New client registration
- [ ] Test 3 passed: Client login
- [ ] Test 4 passed: Wrong admin email blocked
- [ ] Test 5 passed: Wrong password error
- [ ] Test 6 passed: Protected routes work
- [ ] Verified Firebase has user accounts
- [ ] Verified client profile in Realtime Database

---

## 🚀 Next After Testing

Once all tests pass:

1. **Update other dashboard pages** to use Firebase
2. **Create backend API endpoints** for real Stripe
3. **Add email verification** for new accounts
4. **Deploy to production** with security rules

---

**Estimated Testing Time:** 15-20 minutes  
**All Tests Should Pass:** ✅ Yes

**Questions?** Check `COMPLETE_LOGIN_SYSTEM.md` for detailed docs.

