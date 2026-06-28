# KYLO-AI Dashboard Index & Structure Map

## Overview
Complete architectural index of client and admin dashboards for the KYLO-AI platform. This document provides a single reference for all dashboard pages, components, APIs, and their relationships.

---

## 📊 DASHBOARD STRUCTURE

### Two Separate Dashboard Systems

#### 1. **CLIENT DASHBOARD** (User-facing)
- **Base URL:** `/dashboard/*`
- **Protected by:** `ProtectedRoute` (requires authenticated user)
- **Layout Component:** `src/components/DashboardLayout.tsx`
- **Authentication:** Firebase Auth (email/password)
- **Purpose:** Manage client's AI chatbot instance, leads, conversations, settings

#### 2. **ADMIN DASHBOARD** (Platform management)
- **Base URL:** `/admin/dashboard/*`
- **Protected by:** `ProtectedRoute` with `isAdmin={true}`
- **Layout Component:** `src/components/AdminDashboardLayout.tsx`
- **Authentication:** Admin login at `/admin`
- **Purpose:** Manage all clients, sessions, analytics, knowledge base

---

## 🎯 CLIENT DASHBOARD PAGES

### Page Structure: `src/pages/dashboard/`

| Page | File | Route | Purpose | API Used |
|------|------|-------|---------|----------|
| **Home** | `Home.tsx` | `/dashboard` | Main overview, quick stats | Client-specific APIs |
| **Embed** | `Embed.tsx` | `/dashboard/embed` | Web widget setup & configuration | — |
| **Leads** | `Leads.tsx` | `/dashboard/leads` | Captured lead management | `adminApiService.getLeads()` |
| **Conversations** | `Conversations.tsx` | `/dashboard/conversations` | Chat history & transcripts | Chat APIs |
| **WhatsApp** | `WhatsApp.tsx` | `/dashboard/whatsapp` | WhatsApp integration setup | WhatsApp APIs |
| **WhatsApp Setup** | `WhatsAppSetup.tsx` | — | WhatsApp onboarding flow | — |
| **Training** | `Training.tsx` | `/dashboard/training` | KB training & QA management | Training APIs |
| **Analytics** | `Analytics.tsx` | `/dashboard/analytics` | Performance metrics & insights | Analytics APIs |
| **Payments** | `Payments.tsx` | `/dashboard/payments` | Subscription & billing info | Stripe APIs |
| **Settings** | `Settings.tsx` | `/dashboard/settings` | Account & workspace settings | Settings APIs |

### Navigation Items (Client)
```
DashboardLayout.tsx defines:
- Home (Overview icon)
- Embed (Code icon)
- Leads (Users icon)
- Conversations (MessageCircle icon)
- WhatsApp (MessageCircle icon)
- Training (BookOpen icon)
- Analytics (BarChart3 icon)
- Payments (CreditCard icon)
- Settings (Settings icon)
```

---

## ⚙️ ADMIN DASHBOARD PAGES

### Page Structure: `src/pages/admin/`

| Page | File | Route | Purpose | API Used |
|------|------|-------|---------|----------|
| **Home (Overview)** | `Home.tsx` | `/admin/dashboard` | Platform KPIs & analytics | `adminApiService.getAnalytics()` |
| **Sessions** | `Sessions.tsx` | `/admin/dashboard/sessions` | All user sessions management | `adminApiService.getSessions()` |
| **Clients** | `Clients.tsx` | `/admin/dashboard/clients` | Client account management | Client admin APIs |
| **Knowledge** | `Knowledge.tsx` | `/admin/dashboard/knowledge` | Global KB management | Knowledge admin APIs |
| **Packages** | `Packages.tsx` | `/admin/dashboard/packages` | Subscription tiers & billing | Packages admin APIs |
| **Analytics** | `Analytics.tsx` | `/admin/dashboard/analytics` | Platform-wide analytics | `adminApiService.getTrends()` |
| **Settings** | `Settings.tsx` | `/admin/dashboard/settings` | Admin configuration | Settings admin APIs |
| **Home (Legacy)** | `Home_Old.tsx` | — | Deprecated - do not use | — |

### Navigation Items (Admin)
```
AdminDashboardLayout.tsx defines (NAV_ITEMS):
1. Overview (/admin/dashboard) → LayoutDashboard icon
2. Sessions (/admin/dashboard/sessions) → Users icon
3. Client Accounts (/admin/dashboard/clients) → Users icon
4. Knowledge Base (/admin/dashboard/knowledge) → BookOpen icon
5. Packages & Billing (/admin/dashboard/packages) → CreditCard icon
6. Platform Analytics (/admin/dashboard/analytics) → BarChart3 icon
7. Settings (/admin/dashboard/settings) → Settings icon
```

---

## 🔌 API SERVICE LAYER

### Admin API Service
**Location:** `src/services/adminApiService.ts`

#### Implemented Functions

| Function | Endpoint | Method | Purpose | Return Type |
|----------|----------|--------|---------|-------------|
| `getSessions()` | `/api/kylo/admin/sessions` | GET | List all sessions | `Session[]` |
| `getSession(id)` | `/api/kylo/admin/sessions/{id}` | GET | Get session details | `Session` |
| `updateSession(id, data)` | `/api/kylo/admin/sessions/{id}` | PATCH | Update session status/tags | `Session` |
| `getSessionTranscript(id)` | `/api/kylo/admin/sessions/{id}/transcript` | GET | Get chat transcript | `Message[]` |
| `escalateSession(id, reason)` | `/api/kylo/admin/escalate/{id}` | POST | Escalate to human | `{ success: boolean }` |
| `getAnalytics()` | `/api/kylo/admin/analytics` | GET | Get KPI summary | `AnalyticsSummary` |
| `getTrends(days)` | `/api/kylo/admin/analytics/trends` | GET | Get 30-day trends | `TrendsResponse` |
| `exportSessions(filter)` | `/api/kylo/admin/export/sessions` | POST | Export as CSV | Blob |

#### Data Types
```typescript
interface Session {
  sessionId: string;
  phoneNumber: string;
  status: 'active' | 'resolved' | 'escalated' | 'abandoned';
  currentStep: number;
  createdAt: string;
  updatedAt: string;
  lastMessage: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  tags: string[];
}

interface AnalyticsSummary {
  totalSessions: number;
  activeSessions: number;
  resolvedCount: number;
  averageResolutionTime: number;
  topIssues: { issue: string; count: number }[];
}

interface TrendsResponse {
  dates: string[];
  sessions: number[];
  resolved: number[];
  escalated: number[];
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}
```

---

## 🗂️ COMPONENT HIERARCHY

### Layout Components
```
src/components/
├── AdminDashboardLayout.tsx      ← Admin sidebar + navigation
│   ├── Navigation menu (7 items)
│   ├── Top bar (search, theme toggle, user menu)
│   └── Mobile responsive sidebar
├── DashboardLayout.tsx            ← Client sidebar + navigation
│   ├── Navigation menu (9 items)
│   ├── Top bar (search, theme toggle, user menu)
│   └── Mobile responsive sidebar
├── ProtectedRoute.tsx             ← Route protection (auth guard)
└── ThemeProvider.tsx              ← Dark/Light theme context
```

### UI Components
```
src/components/ui/
├── accordion.tsx                  ← Collapsible sections
├── container-scroll-animation.tsx ← Scroll animations
├── grid-card.tsx                  ← Card grid layout
├── grid-pattern.tsx               ← Background pattern
├── hero-section.tsx               ← Landing hero
├── landing-sections.tsx           ← Landing page sections
├── navbar.tsx                     ← Navigation bar
├── navigation-menu.tsx            ← Mobile nav menu
├── pricing.tsx                    ← Pricing display
├── shape-landing-hero.tsx         ← Hero shapes
├── sheet.tsx                      ← Side panel/sheet
└── shine-border.tsx               ← Border animation
```

---

## 🔄 ROUTING STRUCTURE

### App.tsx Route Organization

```
/                              → Landing page
/login                         → Client login
/register                      → Client registration
/admin                         → Admin login
/admin/dashboard               → AdminDashboardLayout (protected)
  ├── /                        → AdminHome (KPI overview)
  ├── /sessions                → AdminSessions (session list & management)
  ├── /clients                 → AdminClients (client accounts)
  ├── /knowledge               → AdminKnowledge (KB management)
  ├── /packages                → AdminPackages (billing & subscriptions)
  ├── /analytics               → AdminAnalytics (platform analytics)
  └── /settings                → AdminSettings (admin config)
/dashboard                     → DashboardLayout (protected)
  ├── /                        → Home (client overview)
  ├── /embed                   → Embed (widget setup)
  ├── /leads                   → Leads (lead management)
  ├── /conversations           → Conversations (chat history)
  ├── /whatsapp                → WhatsApp (integration setup)
  ├── /training                → Training (KB training)
  ├── /analytics               → Analytics (client analytics)
  ├── /payments                → Payments (billing)
  └── /settings                → Settings (account settings)
/*                             → 404 → redirect to /
```

---

## 🎨 THEMING & STYLING

### Theme System
- **Provider:** `ThemeProvider.tsx` (React Context)
- **Colors:** 
  - Light mode: White backgrounds, slate grays
  - Dark mode: `navy-950`, `navy-800`, `navy-600`
- **Tailwind CSS:** All components use Tailwind classes
- **Framework:** Framer Motion for animations

### Theme Toggle
- Located in dashboard top bars (Sun/Moon icons)
- Persists across sessions
- Smooth transitions with Tailwind `transition-colors duration-300`

---

## 🔐 AUTHENTICATION & PROTECTION

### Protected Routes
```typescript
<ProtectedRoute isAdmin={true}>
  <AdminDashboardLayout />
</ProtectedRoute>

<ProtectedRoute>  // isAdmin defaults to false
  <DashboardLayout />
</ProtectedRoute>
```

### Auth Flow
1. **Client:** Login → Firebase Auth → `/dashboard`
2. **Admin:** Login → Admin Auth → `/admin/dashboard`
3. **Guest:** Redirect to `/` (Landing)

---

## 📱 RESPONSIVE DESIGN

### Breakpoints (Tailwind)
- Desktop (md+): Sidebar visible
- Tablet/Mobile (< md): Hamburger menu
- Mobile-specific: Sheet component for navigation

### Layout Behavior
```
Desktop (md+):          Tablet/Mobile:
┌──────┬────────┐     ┌────────────┐
│Sidebar│ Content│     │ ☰ Content  │
└──────┴────────┘     └────────────┘
```

---

## 🚀 KEY FILES & DEPENDENCIES

### Critical Files to Update
| File | Purpose | Impact |
|------|---------|--------|
| `src/App.tsx` | Route definitions | **HIGH** - All routing goes through here |
| `src/components/AdminDashboardLayout.tsx` | Admin nav items | **HIGH** - Admin menu structure |
| `src/components/DashboardLayout.tsx` | Client nav items | **HIGH** - Client menu structure |
| `src/services/adminApiService.ts` | API calls | **MEDIUM** - Add/modify endpoints here |
| `src/pages/admin/*.tsx` | Admin pages | **LOW** - Individual page updates |
| `src/pages/dashboard/*.tsx` | Client pages | **LOW** - Individual page updates |

### NPM Dependencies
```json
{
  "react": "^18.x",
  "react-router-dom": "^6.x",
  "firebase": "^9.x",
  "framer-motion": "^10.x",
  "tailwindcss": "^3.x",
  "lucide-react": "^latest"
}
```

---

## 📋 CHECKLIST FOR DASHBOARD UPDATES

### Adding a New Admin Page
- [ ] Create `src/pages/admin/NewPage.tsx`
- [ ] Add import to `src/App.tsx`
- [ ] Add route in Admin routes section
- [ ] Add nav item to `NAV_ITEMS` in `AdminDashboardLayout.tsx`
- [ ] Create API service functions in `adminApiService.ts` if needed
- [ ] Update this index

### Adding a New Client Page
- [ ] Create `src/pages/dashboard/NewPage.tsx`
- [ ] Add import to `src/App.tsx`
- [ ] Add route in Dashboard routes section
- [ ] Update `DashboardLayout.tsx` navigation
- [ ] Create service functions if needed
- [ ] Update this index

### Updating API Endpoints
- [ ] Update function in `adminApiService.ts`
- [ ] Update types (interfaces) if needed
- [ ] Update page components that use the endpoint
- [ ] Test with backend API
- [ ] Update this index

---

## 📊 Current Status (June 28, 2026)

### Admin Dashboard - 100% Ready
- ✅ 7 pages fully implemented
- ✅ 8 API endpoints connected
- ✅ Real-time data binding
- ✅ Search & filter functionality
- ✅ Export capabilities
- ✅ Responsive design

### Client Dashboard - Active Development
- ✅ 9 pages implemented
- ✅ Lead management functional
- ✅ Analytics display
- ✅ Responsive design
- ⏳ Integration testing ongoing

---

## 🔗 Related Documentation
- `WEEK6_IMPLEMENTATION_SUMMARY.md` - Integration details
- `QUICK_START_ADMIN_FRONTEND.md` - Quick start guide
- `FRONTEND_INTEGRATION_COMPLETE.md` - Integration checklist
- `WEEK6_TESTING_GUIDE.md` - Testing procedures

---

**Last Updated:** June 28, 2026
**Maintained By:** AI Agent
**Status:** Complete & Ready for Updates
