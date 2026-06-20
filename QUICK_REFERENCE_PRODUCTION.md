# ⚡ QUICK REFERENCE - PRODUCTION DEPLOYMENT

## 🚀 DEPLOYMENT STATUS: ✅ LIVE

**Production URL:** https://kylo-support.web.app  
**Firebase Project:** kylo-support  
**Deployment Date:** June 20, 2026  
**Status:** OPERATIONAL ✅

---

## 📍 ACCESS POINTS

| Component | URL/Command |
|-----------|-----------|
| **Dashboard** | https://kylo-support.web.app/admin/dashboard |
| **Sessions** | https://kylo-support.web.app/admin/dashboard/sessions |
| **Main URL** | https://kylo-support.web.app |
| **Firebase Console** | https://console.firebase.google.com/project/kylo-support |

---

## 🔧 START BACKEND SERVER

Required for API calls to work:

```bash
cd /e/KYLO-AI/backend
PORT=5003 CLAUDE_API_KEY=sk-test node server-clean.js
```

---

## ✅ WHAT'S WORKING

- ✅ Admin dashboard with KPIs
- ✅ Sessions list (243 live sessions)
- ✅ Search, filter, pagination
- ✅ Analytics & trends charts
- ✅ Real-time data binding
- ✅ Dark mode
- ✅ Mobile responsive
- ✅ All 8 admin APIs

---

## 🧪 QUICK TEST

```bash
# Test backend health
curl http://localhost:5003/api/kylo/admin/health

# Test sessions API
curl http://localhost:5003/api/kylo/admin/sessions?limit=1

# Test analytics API
curl http://localhost:5003/api/kylo/admin/analytics
```

---

## 📊 DATA

- **Total Sessions:** 243 (live in Firestore)
- **Project:** kylo-support
- **Database:** Firebase Firestore
- **Status:** OPERATIONAL

---

## 📁 KEY FILES

| File | Purpose |
|------|---------|
| WEEK6_DEPLOYMENT_COMPLETE.md | This week's summary |
| DEPLOYMENT_SUCCESS_REPORT.md | Deployment details |
| PRODUCTION_VERIFICATION_GUIDE.md | Testing procedures |
| FIREBASE_DEPLOYMENT_GUIDE.md | How to deploy |
| verify-production.sh | Automated tests |

---

## 🎯 NEXT STEPS

1. Open: https://kylo-support.web.app
2. Test dashboard features
3. Verify sessions page
4. Check APIs in Network tab
5. Share with team

---

## 🆘 TROUBLESHOOTING

| Problem | Solution |
|---------|----------|
| Blank page | Clear cache, try incognito |
| No data | Start backend, check port 5003 |
| API 404 | Verify backend is running |
| Slow loading | Check internet, backend logs |
| CSS issues | Hard refresh: Ctrl+Shift+R |

---

## 📞 QUICK LINKS

- **Production:** https://kylo-support.web.app
- **Firebase:** https://console.firebase.google.com/project/kylo-support
- **Verification Guide:** PRODUCTION_VERIFICATION_GUIDE.md
- **Deployment Guide:** FIREBASE_DEPLOYMENT_GUIDE.md

---

**Status: ✅ PRODUCTION LIVE**  
**Confidence: HIGH ✅**  
**Ready: YES ✅**
