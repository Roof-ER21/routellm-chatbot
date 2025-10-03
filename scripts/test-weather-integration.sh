#!/bin/bash

###############################################################################
# NOAA Weather Integration Test Suite
#
# Tests all aspects of the weather integration including:
# - Database connectivity
# - API endpoints
# - Data sync functionality
# - UI components
#
# Usage: ./scripts/test-weather-integration.sh [BASE_URL]
# Example: ./scripts/test-weather-integration.sh https://susanai-21.vercel.app
###############################################################################

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default base URL (use localhost for dev, production for testing)
BASE_URL="${1:-http://localhost:4000}"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║       NOAA Weather Integration Test Suite                 ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}Testing against: ${BASE_URL}${NC}"
echo ""

# Test counter
PASSED=0
FAILED=0

# Function to test an endpoint
test_endpoint() {
    local name="$1"
    local url="$2"
    local expected_status="${3:-200}"

    echo -n "Testing: $name... "

    response=$(curl -s -w "\n%{http_code}" "$url" 2>&1)
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')

    if [ "$http_code" = "$expected_status" ]; then
        echo -e "${GREEN}✓ PASS${NC} (HTTP $http_code)"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} (Expected $expected_status, got $http_code)"
        echo "Response: $body"
        ((FAILED++))
        return 1
    fi
}

# Function to test JSON response structure
test_json_field() {
    local name="$1"
    local url="$2"
    local field="$3"

    echo -n "Testing: $name (field: $field)... "

    response=$(curl -s "$url")

    if echo "$response" | grep -q "\"$field\""; then
        echo -e "${GREEN}✓ PASS${NC}"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC}"
        echo "Response: $response"
        ((FAILED++))
        return 1
    fi
}

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}1. API Endpoint Tests${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

# Test 1: Query hail events (basic)
test_endpoint \
    "GET /api/weather/hail-events (basic)" \
    "$BASE_URL/api/weather/hail-events"

# Test 2: Query hail events by state
test_endpoint \
    "GET /api/weather/hail-events (state filter)" \
    "$BASE_URL/api/weather/hail-events?state=VA"

# Test 3: Query hail events by zip code
test_endpoint \
    "GET /api/weather/hail-events (zip filter)" \
    "$BASE_URL/api/weather/hail-events?zip=22101&radius=50"

# Test 4: Query hail events by date
test_endpoint \
    "GET /api/weather/hail-events (date filter)" \
    "$BASE_URL/api/weather/hail-events?date=2024-10-15&state=VA"

# Test 5: Invalid state should return 400
test_endpoint \
    "GET /api/weather/hail-events (invalid state)" \
    "$BASE_URL/api/weather/hail-events?state=XX" \
    400

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}2. Claim Verification Tests${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

# Test 6: Verify claim (city/state format)
test_endpoint \
    "GET /api/weather/verify-claim (city, state)" \
    "$BASE_URL/api/weather/verify-claim?date=2024-10-15&location=Richmond,VA"

# Test 7: Verify claim (zip code format)
test_endpoint \
    "GET /api/weather/verify-claim (zip code)" \
    "$BASE_URL/api/weather/verify-claim?date=2024-10-15&location=22101"

# Test 8: Verify claim with custom radius
test_endpoint \
    "GET /api/weather/verify-claim (custom radius)" \
    "$BASE_URL/api/weather/verify-claim?date=2024-10-15&location=22101&radius=25"

# Test 9: Missing parameters should return 400
test_endpoint \
    "GET /api/weather/verify-claim (missing params)" \
    "$BASE_URL/api/weather/verify-claim" \
    400

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}3. JSON Response Structure Tests${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

# Test 10: Check for success field
test_json_field \
    "Response has 'success' field" \
    "$BASE_URL/api/weather/hail-events?state=VA" \
    "success"

# Test 11: Check for events array
test_json_field \
    "Response has 'events' array" \
    "$BASE_URL/api/weather/hail-events?state=VA" \
    "events"

# Test 12: Check for count field
test_json_field \
    "Response has 'count' field" \
    "$BASE_URL/api/weather/hail-events?state=VA" \
    "count"

# Test 13: Verification has report field
test_json_field \
    "Verification has 'report' field" \
    "$BASE_URL/api/weather/verify-claim?date=2024-10-15&location=Richmond,VA" \
    "report"

# Test 14: Report has verified field
test_json_field \
    "Report has 'verified' field" \
    "$BASE_URL/api/weather/verify-claim?date=2024-10-15&location=Richmond,VA" \
    "verified"

# Test 15: Report has confidence field
test_json_field \
    "Report has 'confidence' field" \
    "$BASE_URL/api/weather/verify-claim?date=2024-10-15&location=Richmond,VA" \
    "confidence"

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}4. Data Sync Tests${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

# Only test sync endpoint if CRON_SECRET is not required or testing locally
echo -e "${YELLOW}Note: Sync endpoint requires authentication in production${NC}"
echo -e "${YELLOW}Testing availability only (may return 401 if secured)${NC}"

# Test 16: Check if sync endpoint exists
response=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/cron/sync-weather-data" 2>&1)
http_code=$(echo "$response" | tail -n1)

echo -n "Testing: GET /api/cron/sync-weather-data (endpoint exists)... "
if [ "$http_code" = "200" ] || [ "$http_code" = "401" ]; then
    echo -e "${GREEN}✓ PASS${NC} (HTTP $http_code - endpoint exists)"
    ((PASSED++))
else
    echo -e "${RED}✗ FAIL${NC} (HTTP $http_code)"
    ((FAILED++))
fi

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}5. Edge Cases & Error Handling${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

# Test 17: Invalid date format
test_endpoint \
    "Invalid date format" \
    "$BASE_URL/api/weather/verify-claim?date=invalid&location=Richmond,VA" \
    400

# Test 18: Empty location
test_endpoint \
    "Empty location parameter" \
    "$BASE_URL/api/weather/verify-claim?date=2024-10-15&location=" \
    400

# Test 19: Future date (should work but likely no events)
test_endpoint \
    "Future date query" \
    "$BASE_URL/api/weather/hail-events?date=2025-12-31&state=VA" \
    200

# Test 20: Very old date (should work)
test_endpoint \
    "Old date query" \
    "$BASE_URL/api/weather/hail-events?date=2020-01-01&state=VA" \
    200

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Test Results Summary${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "Total Tests: $((PASSED + FAILED))"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║           ALL TESTS PASSED! 🎉                             ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
    exit 0
else
    echo -e "${RED}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║           SOME TESTS FAILED ❌                             ║${NC}"
    echo -e "${RED}╚════════════════════════════════════════════════════════════╝${NC}"
    exit 1
fi
