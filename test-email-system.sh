#!/bin/bash

# Email System Test Script
# Tests all email functionality endpoints

echo "======================================"
echo "Susan AI-21 Email System Test"
echo "======================================"
echo ""

# Configuration
BASE_URL="http://localhost:4000"
TEST_EMAIL="test@example.com"
REP_NAME="Test User"

echo "Testing against: $BASE_URL"
echo ""

# Test 1: Check email send API is available
echo "Test 1: Checking email send API..."
response=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/email/send")
if [ "$response" == "200" ]; then
  echo "✅ Email send API is available"
else
  echo "❌ Email send API returned $response"
fi
echo ""

# Test 2: Check email history API is available
echo "Test 2: Checking email history API..."
response=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/email/history")
if [ "$response" == "200" ]; then
  echo "✅ Email history API is available"
else
  echo "❌ Email history API returned $response"
fi
echo ""

# Test 3: Send a test email
echo "Test 3: Sending test email..."
response=$(curl -s -X POST "$BASE_URL/api/email/send" \
  -H "Content-Type: application/json" \
  -d "{
    \"to\": \"$TEST_EMAIL\",
    \"subject\": \"Test Email from Susan AI-21\",
    \"body\": \"This is a test email to verify the email system is working correctly.\",
    \"repName\": \"$REP_NAME\",
    \"templateName\": \"Test\"
  }")

if echo "$response" | grep -q '"success":true'; then
  echo "✅ Test email sent successfully"
  echo "Response: $response"
else
  echo "❌ Test email failed"
  echo "Response: $response"
fi
echo ""

# Test 4: Get email history
echo "Test 4: Getting email history..."
response=$(curl -s "$BASE_URL/api/email/history?limit=5")
if echo "$response" | grep -q '"success":true'; then
  echo "✅ Email history retrieved successfully"
  count=$(echo "$response" | grep -o '"count":[0-9]*' | grep -o '[0-9]*')
  echo "Total emails in history: $count"
else
  echo "❌ Email history retrieval failed"
  echo "Response: $response"
fi
echo ""

# Test 5: Check template generation API
echo "Test 5: Checking template generation API..."
response=$(curl -s -X POST "$BASE_URL/api/templates/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "input": "I need to appeal a partial denial for storm damage"
  }')

if echo "$response" | grep -q '"success":true'; then
  echo "✅ Template generation working"
  template=$(echo "$response" | grep -o '"template":"[^"]*"' | head -1 | cut -d'"' -f4)
  echo "Generated template: $template"
else
  echo "❌ Template generation failed"
  echo "Response: $response"
fi
echo ""

# Summary
echo "======================================"
echo "Test Summary"
echo "======================================"
echo ""
echo "✅ = Passed | ❌ = Failed"
echo ""
echo "Next Steps:"
echo "1. Check your test email inbox at $TEST_EMAIL"
echo "2. Verify email has Roof-ER branding"
echo "3. Test the UI by clicking 'Generate Email' in the app"
echo ""
echo "For more details, see:"
echo "- EMAIL_SYSTEM_DOCUMENTATION.md"
echo "- EMAIL_IMPLEMENTATION_SUMMARY.md"
echo ""
