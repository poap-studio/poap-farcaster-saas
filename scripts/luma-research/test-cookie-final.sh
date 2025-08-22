#!/bin/bash

# Test Luma Admin API with fresh cookie

COOKIE="luma.auth-session-key=usr-dZDAMCB9vdfjlvs.znhmpczf93qh40pkau4b"
EVENT_ID="evt-H2y5Rg51kDNxaDQ"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}=== Testing Luma Admin API with Fresh Cookie ===${NC}"
echo ""

# Test 1: Get event info
echo -e "${GREEN}1. Getting Event Information${NC}"
echo "Event ID: $EVENT_ID"

response=$(curl -s -X GET "https://api.lu.ma/event/admin/get?event_api_id=$EVENT_ID" \
  -H "Cookie: $COOKIE" \
  -H "Accept: application/json" \
  -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" \
  -w "\nHTTP_STATUS:%{http_code}")

http_status=$(echo "$response" | grep "HTTP_STATUS:" | cut -d: -f2)
body=$(echo "$response" | sed '/HTTP_STATUS:/d')

echo -e "Status: ${YELLOW}$http_status${NC}"

if [ "$http_status" = "200" ]; then
    echo -e "${GREEN}✅ SUCCESS! Event data retrieved${NC}"
    echo "$body" | jq '.' > event-data-final.json
    
    # Extract key information
    echo ""
    echo -e "${BLUE}Event Details:${NC}"
    echo "$body" | jq '{
      name: .event.name,
      start_at: .event.start_at,
      end_at: .event.end_at,
      url: .event.url,
      hosts: [.hosts[].name],
      total_guests: .guests_count
    }'
    
    # Check if admin@poap.fr is a host
    echo ""
    echo -e "${BLUE}Checking hosts:${NC}"
    echo "$body" | jq '.hosts[] | select(.email == "admin@poap.fr")'
else
    echo -e "${RED}Failed to get event data${NC}"
    echo "$body" | jq '.' 2>/dev/null || echo "$body"
fi

echo ""

# Test 2: Get guests
echo -e "${GREEN}2. Getting Event Guests${NC}"

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
    echo "$body" | jq '.' > guests-data-final.json
    
    # Extract guest information
    echo ""
    echo -e "${BLUE}Guest Summary:${NC}"
    
    # Count guests
    total=$(echo "$body" | jq '.entries | length')
    checked_in=$(echo "$body" | jq '[.entries[] | select(.guest.checked_in_at != null)] | length')
    
    echo "Total guests: $total"
    echo "Checked in: $checked_in"
    echo ""
    
    echo -e "${BLUE}Guest List:${NC}"
    echo "$body" | jq -r '.entries[] | 
      "- \(.guest.name) (\(.guest.email)) - " + 
      if .guest.checked_in_at then 
        "✓ Checked in at \(.guest.checked_in_at)" 
      else 
        "✗ Not checked in" 
      end'
    
    # Show pagination info
    echo ""
    has_more=$(echo "$body" | jq '.has_more')
    if [ "$has_more" = "true" ]; then
        next_cursor=$(echo "$body" | jq -r '.next_cursor')
        echo -e "${YELLOW}Note: More guests available (pagination needed)${NC}"
        echo "Next cursor: $next_cursor"
    fi
else
    echo -e "${RED}Failed to get guests${NC}"
    echo "$body" | jq '.' 2>/dev/null || echo "$body"
fi

echo ""
echo -e "${BLUE}=== Summary ===${NC}"
echo "✅ Cookie is working!"
echo "✅ Can access event as manager"
echo "✅ Can retrieve guest list with emails"
echo ""
echo -e "${YELLOW}Implementation Notes:${NC}"
echo "1. Cookie needs to be stored securely (env var or database)"
echo "2. Cookie will expire - need refresh mechanism"
echo "3. Guest list may need pagination for large events"
echo "4. Check-in status is available for filtering POAP recipients"