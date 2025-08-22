#!/bin/bash

# Test getting guests for POAP Studio owned event

COOKIE="luma.auth-session-key=usr-dZDAMCB9vdfjlvs.znhmpczf93qh40pkau4b"
EVENT_ID="evt-dFABGoCDVLecXHG"  # POAP Studio owned event

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}=== Testing Guest List for POAP Studio Event ===${NC}"
echo ""

# Get guests with full response
echo -e "${GREEN}Getting Guest List${NC}"
echo "Event ID: $EVENT_ID"

response=$(curl -s -X GET "https://api.lu.ma/event/admin/get-guests?event_api_id=$EVENT_ID" \
  -H "Cookie: $COOKIE" \
  -H "Accept: application/json" \
  -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" \
  -w "\nHTTP_STATUS:%{http_code}")

http_status=$(echo "$response" | grep "HTTP_STATUS:" | cut -d: -f2)
body=$(echo "$response" | sed '/HTTP_STATUS:/d')

echo -e "Status: ${YELLOW}$http_status${NC}"

if [ "$http_status" = "200" ]; then
    echo -e "${GREEN}✅ SUCCESS! Guest list retrieved${NC}"
    echo "$body" | jq '.' > poap-event-guests.json
    
    # Analyze structure
    echo ""
    echo -e "${BLUE}Response Structure:${NC}"
    echo "$body" | jq 'keys'
    
    echo ""
    echo -e "${BLUE}First Entry Structure:${NC}"
    echo "$body" | jq '.entries[0] | keys' 2>/dev/null || echo "No entries"
    
    echo ""
    echo -e "${BLUE}Sample Entry:${NC}"
    echo "$body" | jq '.entries[0]' 2>/dev/null || echo "No entries"
    
    # Show full response for debugging
    echo ""
    echo -e "${BLUE}Full Response (first 1000 chars):${NC}"
    echo "$body" | head -c 1000
    echo "..."
    
else
    echo -e "${RED}Failed to get guests${NC}"
    echo "$body" | jq '.' 2>/dev/null || echo "$body"
fi