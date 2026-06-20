#!/bin/bash

# 🧪 COMPREHENSIVE E2E TEST SUITE
# Tests: Backend APIs, Frontend Routes, Features

set -e

BASE_URL="http://localhost:5173"
API_BASE="http://localhost:5003/api/kylo/admin"

echo "╔════════════════════════════════════════════════════════╗"
echo "║       KYLO-AI E2E TESTING SUITE                         ║"
echo "║       Testing Frontend + Backend Integration            ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASS_COUNT=0
FAIL_COUNT=0

# Helper functions
test_passed() {
    echo -e "${GREEN}✅ PASS${NC}: $1"
    ((PASS_COUNT++))
}

test_failed() {
    echo -e "${RED}❌ FAIL${NC}: $1"
    ((FAIL_COUNT++))
}

echo "═══════════════════════════════════════════════════════════"
echo "PHASE 1: BACKEND API TESTS"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Test 1: Health Check
echo "Test 1: Backend Health Check..."
HEALTH=$(curl -s "$API_BASE/health")
if echo "$HEALTH" | grep -q "ok"; then
    test_passed "Backend health check"
else
    test_failed "Backend health check"
fi
echo ""

# Test 2: Sessions Endpoint
echo "Test 2: Sessions List Endpoint..."
SESSIONS=$(curl -s "$API_BASE/sessions?limit=5")
if echo "$SESSIONS" | grep -q "sessions"; then
    test_passed "Sessions list returned"
    TOTAL=$(echo "$SESSIONS" | grep -o '"total":[0-9]*' | head -1)
    echo "         Data: $TOTAL"
else
    test_failed "Sessions list endpoint"
fi
echo ""

# Test 3: Analytics Endpoint
echo "Test 3: Analytics Summary Endpoint..."
ANALYTICS=$(curl -s "$API_BASE/analytics")
if echo "$ANALYTICS" | grep -q "totalSessions"; then
    test_passed "Analytics summary returned"
    TOTAL=$(echo "$ANALYTICS" | grep -o '"totalSessions":[0-9]*')
    echo "         Data: $TOTAL"
else
    test_failed "Analytics endpoint"
fi
echo ""

# Test 4: Analytics Trends
echo "Test 4: Analytics Trends Endpoint..."
TRENDS=$(curl -s "$API_BASE/analytics/trends?period=30")
if echo "$TRENDS" | grep -q '"data"'; then
    test_passed "Analytics trends returned"
else
    test_failed "Analytics trends endpoint"
fi
echo ""

echo "═══════════════════════════════════════════════════════════"
echo "PHASE 2: FRONTEND ROUTE TESTS"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Test 5: Landing Page
echo "Test 5: Landing Page Route..."
LANDING=$(curl -s "$BASE_URL/")
if echo "$LANDING" | grep -q "root"; then
    test_passed "Landing page loads"
else
    test_failed "Landing page route"
fi
echo ""

# Test 6: Admin Dashboard Route
echo "Test 6: Admin Dashboard Route..."
DASHBOARD=$(curl -s "$BASE_URL/admin/dashboard" 2>&1)
if echo "$DASHBOARD" | grep -q "root"; then
    test_passed "Admin dashboard page loads"
else
    test_failed "Admin dashboard route"
fi
echo ""

# Test 7: Admin Sessions Route
echo "Test 7: Admin Sessions Route..."
SESSIONS_PAGE=$(curl -s "$BASE_URL/admin/dashboard/sessions" 2>&1)
if echo "$SESSIONS_PAGE" | grep -q "root"; then
    test_passed "Admin sessions page loads"
else
    test_failed "Admin sessions route"
fi
echo ""

echo "═══════════════════════════════════════════════════════════"
echo "PHASE 3: PERFORMANCE TESTS"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Test 8: Frontend Load Time
echo "Test 8: Frontend Page Load Time..."
START=$(date +%s%N | cut -b1-13)
curl -s "$BASE_URL/" > /dev/null
END=$(date +%s%N | cut -b1-13)
LOAD_TIME=$((END - START))
if [ $LOAD_TIME -lt 3000 ]; then
    test_passed "Frontend loads in ${LOAD_TIME}ms (< 3000ms)"
else
    test_failed "Frontend load time ${LOAD_TIME}ms (expected < 3000ms)"
fi
echo ""

# Test 9: API Response Time
echo "Test 9: API Response Time..."
START=$(date +%s%N | cut -b1-13)
curl -s "$API_BASE/sessions?limit=1" > /dev/null
END=$(date +%s%N | cut -b1-13)
API_TIME=$((END - START))
if [ $API_TIME -lt 1000 ]; then
    test_passed "API responds in ${API_TIME}ms (< 1000ms)"
else
    test_failed "API response time ${API_TIME}ms (expected < 1000ms)"
fi
echo ""

echo "═══════════════════════════════════════════════════════════"
echo "PHASE 4: DATA VALIDATION TESTS"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Test 10: Sessions Data Structure
echo "Test 10: Sessions Data Structure..."
SESSIONS=$(curl -s "$API_BASE/sessions?limit=1")
if echo "$SESSIONS" | grep -q '"phoneNumber"'; then
    test_passed "Sessions contain phoneNumber field"
else
    test_failed "Sessions missing required fields"
fi
echo ""

# Test 11: Analytics Data Structure
echo "Test 11: Analytics Data Structure..."
ANALYTICS=$(curl -s "$API_BASE/analytics")
if echo "$ANALYTICS" | grep -q '"successRate"'; then
    test_passed "Analytics contain successRate field"
else
    test_failed "Analytics missing required fields"
fi
echo ""

echo "═══════════════════════════════════════════════════════════"
echo "PHASE 5: ERROR HANDLING TESTS"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Test 12: Invalid Route
echo "Test 12: Invalid Route Handling..."
INVALID=$(curl -s "$BASE_URL/invalid-route" 2>&1)
# Should still return HTML (not 404 page due to SPA routing)
if echo "$INVALID" | grep -q "root"; then
    test_passed "SPA routing handles invalid routes"
else
    test_failed "Invalid route handling"
fi
echo ""

# Test 13: API Error Handling
echo "Test 13: API 404 Handling..."
ERROR=$(curl -s "$API_BASE/nonexistent" 2>&1)
# Should return some response (API should exist)
if [ ! -z "$ERROR" ]; then
    test_passed "API returns response"
else
    test_failed "API error handling"
fi
echo ""

echo "═══════════════════════════════════════════════════════════"
echo "TEST SUMMARY"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo -e "✅ Passed: ${GREEN}$PASS_COUNT${NC}"
echo -e "❌ Failed: ${RED}$FAIL_COUNT${NC}"
echo ""

if [ $FAIL_COUNT -eq 0 ]; then
    echo -e "${GREEN}🎉 ALL TESTS PASSED!${NC}"
    exit 0
else
    echo -e "${RED}⚠️  SOME TESTS FAILED${NC}"
    exit 1
fi
