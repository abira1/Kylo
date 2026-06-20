#!/bin/bash
# Production Verification Script
# Purpose: Verify KYLO-AI Admin Dashboard production deployment
# Usage: bash verify-production.sh

echo "🔍 KYLO-AI Production Verification"
echo "=================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROD_URL="https://kylo-support.web.app"
ADMIN_URL="$PROD_URL/admin/dashboard"
SESSIONS_URL="$PROD_URL/admin/dashboard/sessions"
BACKEND_URL="http://localhost:5003"

# Test counters
PASSED=0
FAILED=0

# Helper function to test
test_endpoint() {
    local name=$1
    local url=$2
    local expected_status=$3
    
    echo -n "Testing $name... "
    response=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null)
    
    if [ "$response" = "$expected_status" ]; then
        echo -e "${GREEN}✅ PASS${NC} (HTTP $response)"
        ((PASSED++))
    else
        echo -e "${RED}❌ FAIL${NC} (Expected $expected_status, got $response)"
        ((FAILED++))
    fi
}

# Helper function for API test
test_api() {
    local name=$1
    local endpoint=$2
    local expected_field=$3
    
    echo -n "Testing $name... "
    response=$(curl -s "$BACKEND_URL$endpoint" 2>/dev/null)
    
    if echo "$response" | grep -q "$expected_field"; then
        echo -e "${GREEN}✅ PASS${NC}"
        ((PASSED++))
    else
        echo -e "${RED}❌ FAIL${NC}"
        ((FAILED++))
    fi
}

# Test Production URLs
echo "📌 Production URL Tests"
echo "━━━━━━━━━━━━━━━━━━━━━"
test_endpoint "Main URL" "$PROD_URL" "200"
test_endpoint "Admin Dashboard" "$ADMIN_URL" "200"
test_endpoint "Sessions Page" "$SESSIONS_URL" "200"
echo ""

# Test Backend API (if running)
if nc -z localhost 5003 2>/dev/null; then
    echo "🔗 Backend API Tests"
    echo "━━━━━━━━━━━━━━━━━━━"
    test_api "Health Check" "/api/kylo/admin/health" "status"
    test_api "Sessions List" "/api/kylo/admin/sessions" "sessions"
    test_api "Analytics" "/api/kylo/admin/analytics" "summary"
    echo ""
else
    echo -e "${YELLOW}⚠️  Backend not running on port 5003 (skipping API tests)${NC}"
    echo ""
fi

# Performance Tests
echo "⚡ Performance Tests"
echo "━━━━━━━━━━━━━━━━━━━"

# Test response time for main URL
echo -n "Testing Main URL Response Time... "
start_time=$(date +%s%N)
curl -s -o /dev/null "$PROD_URL" 2>/dev/null
end_time=$(date +%s%N)
response_time=$(( (end_time - start_time) / 1000000 ))
echo -e "${GREEN}${response_time}ms${NC}"
echo ""

# Connectivity Tests
echo "🌐 Connectivity Tests"
echo "━━━━━━━━━━━━━━━━━━━━"

# Check internet connectivity
echo -n "Internet Connection... "
if ping -c 1 google.com &> /dev/null; then
    echo -e "${GREEN}✅ Connected${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ No Connection${NC}"
    ((FAILED++))
fi

# Check DNS resolution
echo -n "DNS Resolution (kylo-support.web.app)... "
if nslookup kylo-support.web.app &> /dev/null; then
    echo -e "${GREEN}✅ Resolved${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ Failed${NC}"
    ((FAILED++))
fi

echo ""

# Summary
echo "📊 Test Summary"
echo "━━━━━━━━━━━━━━━━━━━━"
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed! Production is operational.${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed. Check the results above.${NC}"
    exit 1
fi
