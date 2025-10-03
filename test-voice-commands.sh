#!/bin/bash

# Voice Command System Test Script
# Tests all 7 command types against the Voice Command API

BASE_URL="http://localhost:4000"
API_ENDPOINT="${BASE_URL}/api/voice/command"
SUGGESTIONS_ENDPOINT="${BASE_URL}/api/voice/suggestions"

echo "=================================================="
echo "Voice Command System - Comprehensive Test Suite"
echo "=================================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Test function
test_command() {
    local name=$1
    local transcript=$2
    local expected_type=$3

    echo -e "${BLUE}Testing: $name${NC}"
    echo "Transcript: \"$transcript\""

    response=$(curl -s -X POST "$API_ENDPOINT" \
        -H 'Content-Type: application/json' \
        -d "{\"transcript\": \"$transcript\"}")

    command_type=$(echo "$response" | jq -r '.command.type')
    action=$(echo "$response" | jq -r '.result.action')
    success=$(echo "$response" | jq -r '.success')

    if [ "$command_type" = "$expected_type" ] && [ "$success" = "true" ]; then
        echo -e "${GREEN}✓ PASS${NC} - Type: $command_type, Action: $action"
    else
        echo -e "${RED}✗ FAIL${NC} - Expected: $expected_type, Got: $command_type"
        echo "Full response: $response"
    fi

    echo ""
}

# 1. Test DOCUMENT command
echo -e "${YELLOW}=== Test 1: DOCUMENT Command ===${NC}"
test_command "Document hail damage" \
    "Susan, document hail damage" \
    "DOCUMENT"

# 2. Test CITE command
echo -e "${YELLOW}=== Test 2: CITE Command ===${NC}"
test_command "Cite IRC flashing code" \
    "Susan, cite IRC flashing code" \
    "CITE"

# 3. Test DRAFT command
echo -e "${YELLOW}=== Test 3: DRAFT Command ===${NC}"
test_command "Draft State Farm appeal" \
    "Susan, draft State Farm appeal letter" \
    "DRAFT"

# 4. Test ANALYZE command
echo -e "${YELLOW}=== Test 4: ANALYZE Command ===${NC}"
test_command "Analyze photo" \
    "Susan, analyze photo" \
    "ANALYZE"

# 5. Test HELP command
echo -e "${YELLOW}=== Test 5: HELP Command ===${NC}"
test_command "Help with measurements" \
    "Susan, help with roof measurements" \
    "HELP"

# 6. Test EMERGENCY command
echo -e "${YELLOW}=== Test 6: EMERGENCY Command ===${NC}"
test_command "Emergency assistance" \
    "Susan, emergency" \
    "EMERGENCY"

# 7. Test QUERY command (no wake word)
echo -e "${YELLOW}=== Test 7: QUERY Command ===${NC}"
test_command "General query" \
    "What are common hail damage indicators" \
    "QUERY"

# 8. Test variations without wake word
echo -e "${YELLOW}=== Test 8: Variations (No Wake Word) ===${NC}"
test_command "Document without wake word" \
    "document wind damage" \
    "DOCUMENT"

test_command "Code citation variant" \
    "what is the code for roof ventilation" \
    "CITE"

# 9. Test GET status endpoint
echo -e "${YELLOW}=== Test 9: System Status ===${NC}"
echo -e "${BLUE}Testing: GET /api/voice/command${NC}"
status=$(curl -s "$API_ENDPOINT")
system_status=$(echo "$status" | jq -r '.status')

if [ "$system_status" = "active" ]; then
    echo -e "${GREEN}✓ PASS${NC} - System status: $system_status"
    echo "Supported commands: $(echo "$status" | jq -r '.supportedCommands | join(", ")')"
else
    echo -e "${RED}✗ FAIL${NC} - System not active"
fi
echo ""

# 10. Test suggestions endpoint
echo -e "${YELLOW}=== Test 10: Command Suggestions ===${NC}"
echo -e "${BLUE}Testing: GET /api/voice/suggestions${NC}"
suggestions=$(curl -s "$SUGGESTIONS_ENDPOINT")
suggestion_count=$(echo "$suggestions" | jq -r '.suggestions | length')

if [ "$suggestion_count" -gt 0 ]; then
    echo -e "${GREEN}✓ PASS${NC} - Retrieved $suggestion_count suggestions"
    echo "Sample suggestions:"
    echo "$suggestions" | jq -r '.suggestions[:3] | .[]' | sed 's/^/  - /'
else
    echo -e "${RED}✗ FAIL${NC} - No suggestions returned"
fi
echo ""

# Summary
echo "=================================================="
echo "Test Suite Complete"
echo "=================================================="
echo ""
echo "To test with custom transcripts:"
echo ""
echo "  curl -X POST $API_ENDPOINT \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -d '{\"transcript\": \"Your command here\"}'"
echo ""
echo "For suggestions:"
echo ""
echo "  curl -X GET $SUGGESTIONS_ENDPOINT | jq '.'"
echo ""
