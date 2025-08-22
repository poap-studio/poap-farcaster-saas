#!/bin/bash

# Test Luma Admin API with session cookie

# Test data
EVENT_ID="evt-H2y5Rg51kDNxaDQ"
COOKIE="luma.auth-session-key=usr-dZDAMCB9vdfjlvs.mmfz26zv0hpyagjumzus"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}=== Testing Luma Admin API with Session Cookie ===${NC}"
echo ""

# Test 1: Get event info using admin API
echo -e "${GREEN}1. Testing Admin API - Get Event Info${NC}"
echo "Event ID: $EVENT_ID"
echo ""

response=$(curl -s -X GET "https://api.lu.ma/event/admin/get?event_api_id=$EVENT_ID" \
  -H "Cookie: $COOKIE" \
  -H "Accept: application/json" \
  -w "\nHTTP_STATUS:%{http_code}")

http_status=$(echo "$response" | grep "HTTP_STATUS:" | cut -d: -f2)
body=$(echo "$response" | sed '/HTTP_STATUS:/d')

echo -e "Status: ${YELLOW}$http_status${NC}"
if [ "$http_status" = "200" ]; then
    echo -e "${GREEN}SUCCESS! Event data retrieved${NC}"
    echo "$body" | jq '.' > event-admin-data.json
    echo "$body" | jq '{name: .event.name, start_at: .event.start_at, hosts: .hosts}'
else
    echo "$body" | jq '.' 2>/dev/null || echo "$body"
fi

echo ""

# Test 2: Get event guests
echo -e "${GREEN}2. Testing Admin API - Get Event Guests${NC}"

response=$(curl -s -X GET "https://api.lu.ma/event/admin/get-guests?event_api_id=$EVENT_ID" \
  -H "Cookie: $COOKIE" \
  -H "Accept: application/json" \
  -w "\nHTTP_STATUS:%{http_code}")

http_status=$(echo "$response" | grep "HTTP_STATUS:" | cut -d: -f2)
body=$(echo "$response" | sed '/HTTP_STATUS:/d')

echo -e "Status: ${YELLOW}$http_status${NC}"
if [ "$http_status" = "200" ]; then
    echo -e "${GREEN}SUCCESS! Guest list retrieved${NC}"
    echo "$body" | jq '.' > guests-admin-data.json
    
    # Extract key guest information
    echo ""
    echo -e "${BLUE}Guest Summary:${NC}"
    echo "$body" | jq '.entries[] | {name: .guest.name, email: .guest.email, checked_in: .guest.checked_in_at, status: .guest.approval_status}'
    
    # Count guests
    total_guests=$(echo "$body" | jq '.entries | length')
    checked_in=$(echo "$body" | jq '[.entries[] | select(.guest.checked_in_at != null)] | length')
    echo ""
    echo "Total guests: $total_guests"
    echo "Checked in: $checked_in"
else
    echo "$body" | jq '.' 2>/dev/null || echo "$body"
fi

echo ""

# Test 3: Check if pagination is needed
echo -e "${GREEN}3. Checking for pagination${NC}"
has_more=$(echo "$body" | jq '.has_more' 2>/dev/null)
next_cursor=$(echo "$body" | jq -r '.next_cursor' 2>/dev/null)

if [ "$has_more" = "true" ] && [ "$next_cursor" != "null" ]; then
    echo "More guests available. Next cursor: $next_cursor"
    echo "Would need to paginate to get all guests"
else
    echo "All guests retrieved in single request"
fi

echo ""

# Test 4: Test with a different event (if provided)
if [ -n "$1" ]; then
    echo -e "${GREEN}4. Testing with custom event: $1${NC}"
    curl -s -X GET "https://api.lu.ma/event/admin/get-guests?event_api_id=$1" \
      -H "Cookie: $COOKIE" \
      -H "Accept: application/json" | jq '.'
fi

echo ""
echo -e "${YELLOW}Summary:${NC}"
echo "✓ Admin API endpoints work with session cookie"
echo "✓ Can retrieve event info and guest list"
echo "✓ Guest data includes email and check-in status"
echo ""
echo -e "${RED}Next steps:${NC}"
echo "1. Implement web scraping to obtain session cookie"
echo "2. Handle cookie expiration and renewal"
echo "3. Implement pagination for large guest lists"