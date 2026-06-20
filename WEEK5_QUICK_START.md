# Phase 2 Week 5 - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Install Dependencies (1 minute)
```bash
cd e:/KYLO-AI/backend
npm install
```

This will install:
- `redis` - Redis client
- `bull` - Job queue (for Week 6)
- All other dependencies

---

### Step 2: Start Redis Server (1 minute)

**Option A: Docker (Recommended)**
```bash
docker run -d -p 6379:6379 --name kylo-redis redis:7-alpine
# Verify it's running:
docker ps | grep kylo-redis
```

**Option B: Direct Installation**
```bash
# macOS
brew install redis
redis-server

# Linux (Ubuntu/Debian)
sudo apt-get install redis-server
redis-server

# Windows (Chocolatey)
choco install redis-64
redis-server
```

**Option C: Redis Cloud (Production)**
1. Sign up at https://app.redis.com/
2. Create a database
3. Update `.env` with Redis connection details

### Step 3: Verify Redis Connection (1 minute)
```bash
# In a new terminal, test the connection:
redis-cli ping
# Should output: PONG
```

---

### Step 4: Run Cache Tests (1 minute)
```bash
cd e:/KYLO-AI/backend
node test-week5-cache.js
```

**Expected Output**:
```
PHASE 2, WEEK 5 - CACHE INTEGRATION TEST SUITE

GROUP 1: BASIC CACHE OPERATIONS
✅ CACHE-1: Set and retrieve value
✅ CACHE-2: Delete cached value
✅ CACHE-3: Check if key exists
✅ CACHE-4: TTL functionality

GROUP 2: SESSION CACHING
✅ CACHE-5: Cache session data
✅ CACHE-6: Retrieve cached session
✅ CACHE-7: Update cached session
✅ CACHE-8: Delete cached session

GROUP 3: CACHE STATISTICS
✅ CACHE-9: Track cache statistics
✅ CACHE-10: Calculate hit rate
✅ CACHE-11: Reset cache statistics

GROUP 4: CACHE TTL & EXPIRATION
✅ CACHE-12: Short TTL (session)
✅ CACHE-13: Long TTL (step prompt)
✅ CACHE-14: Immediate expiration

GROUP 5: CACHE CONSISTENCY
✅ CACHE-15: OTP data caching
✅ CACHE-16: User profile caching
✅ CACHE-17: Step prompt caching
✅ CACHE-18: Webhook message deduplication
✅ CACHE-19: Cache invalidation

✅ Passed: 19
❌ Failed: 0
📊 Total: 19
📈 Coverage: 100.0%

✅ ALL CACHE TESTS PASSED
Cache layer is ready for production use
```

---

### Step 5: Start Backend Server (1 minute)
```bash
cd e:/KYLO-AI/backend
PORT=5002 CLAUDE_API_KEY=sk-test node server-clean.js
```

**Expected Output**:
```
[REDIS] Connected to Redis
[FIREBASE] Initialized successfully
[SERVER] Listening on port 5002
[SERVICES] All services loaded (9 services)
```

---

### Step 6: Test With Comprehensive Suite (Optional)
```bash
# In another terminal:
cd e:/KYLO-AI/backend
node test-week4-comprehensive.js
```

This will verify all Phase 1 tests still pass with caching enabled.

---

## 🎯 Expected Performance Improvement

### Before Caching:
```
Session Retrieve:  ~1142ms
Session Create:    ~1537ms
Throughput:        15 req/sec (50 concurrent)
Cache Hit Rate:    0% (no cache)
```

### After Caching:
```
Session Retrieve:  ~10-50ms (CACHE HIT) - 95% faster! 🚀
                   ~1142ms (CACHE MISS then cache)
Session Create:    ~200ms (with caching overhead)
Throughput:        100+ req/sec (50 concurrent) - 6-7x faster! 🚀
Cache Hit Rate:    >80% after 5 minutes stabilization
```

---

## 📊 Verify Cache is Working

### Check Cache Statistics
```bash
node -e "const cache = require('./services/cacheService'); console.log(cache.management.getStats())"
```

**Output Example**:
```
{
  hits: 45,
  misses: 12,
  sets: 57,
  deletes: 3,
  total: 57,
  hitRate: '78.95%',
  timestamp: '2024-06-20T10:30:45.123Z'
}
```

### Monitor Redis in Real-Time
```bash
redis-cli MONITOR
# Then run tests in another terminal to see commands
```

### Check Redis Memory Usage
```bash
redis-cli INFO memory
```

---

## 🔧 Troubleshooting

### Issue: "Error: Redis connection refused"
**Solution**: Redis is not running
```bash
# Check if Redis is running
redis-cli ping

# If not running:
docker run -d -p 6379:6379 redis:latest
# OR
redis-server
```

### Issue: "Tests show cache misses but no hits"
**Solution**: Cache TTL may have expired, or hitting different keys
```bash
# Check cache contents
redis-cli KEYS '*'
# This shows all cached keys

# Check specific key
redis-cli GET 'session:session_id_here'
```

### Issue: "Port 6379 already in use"
**Solution**: Change Redis port or stop existing process
```bash
# Use different port
redis-server --port 6380

# Then update .env:
REDIS_PORT=6380
```

### Issue: "Tests pass but server doesn't cache"
**Solution**: Make sure cacheService is imported in all places
```bash
# Verify import is in sessionManagerService:
grep "require.*cache" backend/services/sessionManagerService.js
# Should output: const cache = require('./cacheService');
```

---

## 📈 Performance Testing

### Run Performance Comparison
```bash
cd backend
node test-week5-performance-baseline.js
```

This will show:
- Response times with and without cache
- Cache hit rate improvement
- Throughput improvement
- Memory usage impact

### Run Load Testing
```bash
# Test with 50 concurrent sessions
node test-week4-comprehensive.js

# Watch cache statistics
redis-cli INFO stats
```

---

## 🎉 Success Criteria

✅ **Cache Setup is Successful When**:

1. Redis server running and responding to `redis-cli ping`
2. `npm install` completes without errors
3. `test-week5-cache.js` shows 19/19 PASSING
4. Backend server starts with "[REDIS] Connected to Redis"
5. Cache statistics show >0 hits after running tests
6. `test-week4-comprehensive.js` still passes (48/48)

---

## 📝 What's Cached

### Session Data (5-10 min TTL)
- Caches full session object after creation
- Updated on every step change
- Automatically expires after 10 minutes of inactivity
- ~95% cache hit rate expected

### OTP Data (5 min TTL)
- Verification attempts per phone number
- Expires after 5 minutes
- ~70% cache hit rate expected

### Step Prompts (24 hour TTL)
- Application step descriptions
- Long TTL since rarely change
- ~95% cache hit rate expected

### User Profiles (1 hour TTL)
- User preferences and data
- 1 hour expiration
- ~75% cache hit rate expected

### Webhook Messages (5 min TTL)
- Recent message IDs for deduplication
- 5 minute dedup window
- Prevents processing same message twice

---

## 🚀 Next Steps (Phase 2, Week 6)

After cache verification:

1. **Async Email/WhatsApp** (Week 6)
   - Move email sending to background jobs
   - Move WhatsApp to background jobs
   - Non-blocking API responses
   - Expected: 94% improvement

2. **Admin Dashboard APIs** (Week 6)
   - Session list/filter endpoints
   - Session detail endpoint
   - Manual escalation endpoint
   - Real-time metrics endpoint

3. **Admin Dashboard UI** (Week 6)
   - Session management interface
   - Real-time monitoring
   - Analytics charts

---

## 📞 Need Help?

### Check Logs
```bash
# Server logs
tail -f e:/KYLO-AI/backend/server.log

# Redis logs
tail -f /usr/local/var/log/redis.log  # macOS
journalctl -u redis-server -f         # Linux
```

### Test Individual Components
```bash
# Test Redis client only
node -e "const r = require('./redis-client'); console.log(r.isConnected())"

# Test cache service only
node -e "const c = require('./services/cacheService'); console.log(c.management.getStatus())"

# Test cache with actual data
node test-week5-cache.js
```

### Debug Cache Issues
```bash
# Enable verbose logging
DEBUG=redis:* node server-clean.js

# Monitor all Redis commands
redis-cli MONITOR
```

---

## ✅ Checklist

Before proceeding to Week 6:

- [ ] Redis server installed and running
- [ ] `npm install` completed successfully
- [ ] `test-week5-cache.js` shows 19/19 PASSING
- [ ] Cache statistics show >50% hit rate
- [ ] Backend server starts successfully
- [ ] `test-week4-comprehensive.js` still passes (48/48)
- [ ] Performance improvement measured
- [ ] Documentation reviewed
- [ ] Ready for async jobs implementation

---

**Ready to begin Phase 2, Week 5 Performance Optimization!** 🎯

Start with: `npm install` then `redis-server` then `node test-week5-cache.js`
