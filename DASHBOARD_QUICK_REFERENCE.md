# Dashboard Architecture - Quick Reference

## 🗺️ SYSTEM ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────┐
│                    KYLO-AI Dashboard System                      │
└─────────────────────────────────────────────────────────────────┘

                         React 18 + TypeScript
                    Vite + Tailwind + Framer Motion
                              │
                ┌─────────────┴─────────────┐
                │                           │
         ┌──────▼──────┐            ┌──────▼──────┐
         │  App.tsx    │            │   Routes    │
         │  (routing)  │            │ Management  │
         └──────┬──────┘            └─────────────┘
                │
        ┌───────┴────────┐
        │                │
   ┌────▼────────┐  ┌───▼────────────┐
   │  /dashboard │  │  /admin/dash   │
   │  (Client)   │  │  (Platform)    │
   └────┬────────┘  └───┬────────────┘
        │                │
   ┌────▼──────────┐ ┌──▼────────────────┐
   │DashboardLayout│ │AdminDashboardLayout
   │  9 nav items  │ │   7 nav items     │
   └────┬──────────┘ └──┬────────────────┘
        │                │
   ┌────▼──────────┐ ┌──▼────────────────┐
   │ 9 Client Pages│ │ 7 Admin Pages     │
   │ (pages/       │ │ (pages/admin/)    │
   │  dashboard/)  │ │                   │
   └────┬──────────┘ └──┬────────────────┘
        │                │
        └────────┬───────┘
                 │
         ┌───────▼─────────┐
         │  adminApiService │
         │  8 Functions     │
         └───────┬─────────┘
                 │
         ┌───────▼──────────┐
         │  Backend API     │
         │ /api/kylo/admin/ │
         └──────────────────┘
```

---

## 📑 CLIENT DASHBOARD STRUCTURE

### Pages & Relationships
```
DashboardLayout
├── Navigation (9 items)
│   ├── Home (Overview) ───→ src/pages/dashboard/Home.tsx
│   ├── Embed (Setup) ───→ src/pages/dashboard/Embed.tsx
│   ├── Leads ───→ src/pages/dashboard/Leads.tsx
│   ├── Conversations ───→ src/pages/dashboard/Conversations.tsx
│   ├── WhatsApp ───→ src/pages/dashboard/WhatsApp.tsx
│   │   └── Setup flow ───→ WhatsAppSetup.tsx
│   ├── Training ───→ src/pages/dashboard/Training.tsx
│   ├── Analytics ───→ src/pages/dashboard/Analytics.tsx
│   ├── Payments ───→ src/pages/dashboard/Payments.tsx
│   └── Settings ───→ src/pages/dashboard/Settings.tsx
│
└── Top Bar
    ├── Search
    ├── Theme toggle (Light/Dark)
    └── User menu (Profile, Logout)
```

---

## ⚙️ ADMIN DASHBOARD STRUCTURE

### Pages & Relationships
```
AdminDashboardLayout
├── Navigation (7 items)
│   ├── Overview ───→ src/pages/admin/Home.tsx
│   │   ├── Uses: adminApiService.getAnalytics()
│   │   └── Displays: 4 KPI cards + 30-day trends
│   ├── Sessions ───→ src/pages/admin/Sessions.tsx
│   │   ├── Uses: adminApiService.getSessions()
│   │   ├── Features: Search, filter, pagination
│   │   └── Modal: Session details + escalation
│   ├── Client Accounts ───→ src/pages/admin/Clients.tsx
│   ├── Knowledge Base ───→ src/pages/admin/Knowledge.tsx
│   ├── Packages & Billing ───→ src/pages/admin/Packages.tsx
│   ├── Platform Analytics ───→ src/pages/admin/Analytics.tsx
│   │   └── Uses: adminApiService.getTrends()
│   └── Settings ───→ src/pages/admin/Settings.tsx
│
└── Top Bar (same as client)
    ├── Search
    ├── Theme toggle
    └── Admin menu
```

---

## 🔌 API INTEGRATION MAP

### adminApiService.ts → Backend Flow

```
Frontend Component
        │
        ▼
adminApiService.ts
        │
    ┌───┴────────────────────────────────────┐
    │                                        │
    ▼                                        ▼
getSessions()                          getAnalytics()
    │                                        │
    ▼                                        ▼
GET /api/kylo/admin/sessions          GET /api/kylo/admin/analytics
    │                                        │
    ▼                                        ▼
Backend (Node.js)                     Backend (Node.js)
    │                                        │
    ▼                                        ▼
Firestore (Firebase)                  Firestore (Firebase)
```

### All 8 API Functions

```
┌─────────────────────────────────────┬──────────────┬──────────────┐
│ Function                            │ Endpoint     │ Used By      │
├─────────────────────────────────────┼──────────────┼──────────────┤
│ getSessions()                       │ GET /        │ Sessions.tsx │
│ getSession(id)                      │ GET /{id}    │ Sessions     │
│ updateSession(id, data)             │ PATCH /{id}  │ Sessions     │
│ getSessionTranscript(id)            │ GET /{id}/tx │ Sessions     │
│ escalateSession(id, reason)         │ POST escalate│ Sessions     │
│ getAnalytics()                      │ GET /analytics
│ getTrends(days)                     │ GET /trends  │ Analytics    │
│ exportSessions(filter)              │ POST /export │ Sessions     │
└─────────────────────────────────────┴──────────────┴──────────────┘
```

---

## 🎯 DATA FLOW EXAMPLE

### Example: Loading Admin Home Page

```
1. User visits /admin/dashboard/
                    │
                    ▼
2. ProtectedRoute checks isAdmin=true
                    │
                    ▼
3. AdminDashboardLayout renders
   ├── Sidebar with NAV_ITEMS
   └── <Outlet /> placeholder
                    │
                    ▼
4. AdminHome.tsx mounts
   ├── useEffect runs on mount
   └── Calls: adminApiService.getAnalytics()
                    │
                    ▼
5. API Request
   └── fetch('/api/kylo/admin/analytics')
                    │
                    ▼
6. Backend responds with:
   {
     totalSessions: 243,
     activeSessions: 15,
     resolvedCount: 228,
     averageResolutionTime: 2.3,
     topIssues: [...]
   }
                    │
                    ▼
7. Component state updates
   ├── 4 KPI cards render with data
   ├── LineChart with 30-day trends
   ├── Top issues list
   └── Status breakdown
                    │
                    ▼
8. User sees dashboard
```

---

## 🔄 UPDATE FLOW GUIDE

### When Backend Changes

```
Backend API Changes
        │
        ▼
Update adminApiService.ts
        │
        ├─→ Change endpoint URL
        ├─→ Update function signature
        └─→ Update response types
                │
                ▼
Update Components That Use It
        │
        ├─→ AdminHome.tsx
        ├─→ Sessions.tsx
        ├─→ Analytics.tsx
        └─→ Update API calls
                │
                ▼
Test Changes
        │
        ├─→ Verify console logs
        ├─→ Check data displays
        └─→ Test error handling
                │
                ▼
Update This Index
        │
        └─→ Sync documentation
```

### When Adding New Admin Feature

```
1. Create new page: src/pages/admin/NewFeature.tsx
2. Add to App.tsx routes
3. Add to NAV_ITEMS in AdminDashboardLayout
4. Add API functions to adminApiService.ts (if needed)
5. Update DASHBOARD_INDEX.md
6. Test routing & navigation
7. Test data display
```

---

## 🎨 COMPONENT COMPOSITION

### Typical Admin Page Structure

```typescript
// AdminPage.tsx
import React, { useEffect, useState } from 'react';
import { adminApiService } from '../../services/adminApiService';

export function AdminNewPage() {
  const [data, setData] = useState<DataType[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 1. Fetch data on mount
  useEffect(() => {
    fetchData();
  }, []);
  
  const fetchData = async () => {
    try {
      setLoading(true);
      const result = await adminApiService.getNewPageData();
      setData(result);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // 2. Render content
  if (loading) return <LoadingSpinner />;
  
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Feature Title</h1>
      </div>
      
      {/* Filters */}
      <div className="flex gap-4">
        <input placeholder="Search..." />
        <select>Filter options</select>
      </div>
      
      {/* Content Grid/List */}
      <div className="grid gap-4">
        {data.map(item => (
          <Card key={item.id} data={item} />
        ))}
      </div>
    </div>
  );
}
```

---

## 🚀 QUICK START COMMANDS

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Deploy to Firebase
firebase deploy --only hosting

# Deploy to Vercel
vercel deploy

# Run TypeScript check
npm run type-check
```

---

## ✅ IMPORTANT NOTES

### DO ✅
- Update DASHBOARD_INDEX.md when adding pages
- Keep type definitions in adminApiService.ts
- Use ProtectedRoute for all protected pages
- Add error handling to all API calls
- Test responsive design on mobile
- Maintain consistent styling with Tailwind

### DON'T ❌
- Hardcode API URLs (use `API_BASE` constant)
- Create duplicate navigation configurations
- Remove or rename routes without updating App.tsx
- Use inconsistent styling/colors
- Skip error handling in components
- Forget to update documentation

---

## 🆘 TROUBLESHOOTING

| Issue | Solution |
|-------|----------|
| Page not showing in navigation | Check NAV_ITEMS in layout file |
| Route not working | Verify route in App.tsx |
| API returns 404 | Check endpoint URL and backend |
| Data not displaying | Check browser console for errors |
| Styling looks broken | Run `npm run build` to rebuild Tailwind |

---

**Last Updated:** June 28, 2026
**Maintained By:** AI Agent
**Status:** Ready for Development & Updates
