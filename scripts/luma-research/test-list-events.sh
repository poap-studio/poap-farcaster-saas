#!/bin/bash

# Test listing all events for the authenticated user

COOKIE="luma.auth-session-key=usr-dZDAMCB9vdfjlvs.znhmpczf93qh40pkau4b"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}=== Testing Luma Event Listing ===${NC}"
echo ""

# Test 1: List all events
echo -e "${GREEN}1. Listing All Events${NC}"

response=$(curl -s -X GET "https://api.lu.ma/user/get-events-hosting" \
  -H "Cookie: $COOKIE" \
  -H "Accept: application/json" \
  -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" \
  -w "\nHTTP_STATUS:%{http_code}")

http_status=$(echo "$response" | grep "HTTP_STATUS:" | cut -d: -f2)
body=$(echo "$response" | sed '/HTTP_STATUS:/d')

echo -e "Status: ${YELLOW}$http_status${NC}"

if [ "$http_status" = "200" ]; then
    echo -e "${GREEN}✅ SUCCESS! Events retrieved${NC}"
    echo "$body" | jq '.' > all-events.json
    
    # Show event summary
    echo ""
    echo -e "${BLUE}Events Summary:${NC}"
    total=$(echo "$body" | jq '.entries | length')
    echo "Total events: $total"
    echo ""
    
    echo -e "${BLUE}Event List:${NC}"
    echo "$body" | jq -r '.entries[] | "- \(.event.name) (ID: \(.event.api_id)) - \(.event.start_at)"'
    
    # Look for our test event
    echo ""
    echo -e "${BLUE}Looking for evt-H2y5Rg51kDNxaDQ:${NC}"
    echo "$body" | jq '.entries[] | select(.event.api_id == "evt-H2y5Rg51kDNxaDQ")'
else
    echo -e "${RED}Failed to list events${NC}"
    echo "$body" | jq '.' 2>/dev/null || echo "$body"
fi

echo ""

# Test 2: Try different endpoint
echo -e "${GREEN}2. Testing Admin Event List${NC}"

response=$(curl -s -X GET "https://api.lu.ma/event/admin/list" \
  -H "Cookie: $COOKIE" \
  -H "Accept: application/json" \
  -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" \
  -w "\nHTTP_STATUS:%{http_code}")

http_status=$(echo "$response" | grep "HTTP_STATUS:" | cut -d: -f2)
body=$(echo "$response" | sed '/HTTP_STATUS:/d')

echo -e "Status: ${YELLOW}$http_status${NC}"

if [ "$http_status" = "200" ]; then
    echo "$body" | jq '.'
else
    echo -e "${RED}Admin list endpoint not available${NC}"
fi

echo ""

# Test 3: Try accessing a different event (owned by POAP Studio)
echo -e "${GREEN}3. Trying Event Owned by POAP Studio${NC}"
POAP_EVENT="evt-dFABGoCDVLecXHG"  # The one we found before

response=$(curl -s -X GET "https://api.lu.ma/event/admin/get?event_api_id=$POAP_EVENT" \
  -H "Cookie: $COOKIE" \
  -H "Accept: application/json" \
  -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" \
  -w "\nHTTP_STATUS:%{http_code}")

http_status=$(echo "$response" | grep "HTTP_STATUS:" | cut -d: -f2)
body=$(echo "$response" | sed '/HTTP_STATUS:/d')

echo -e "Status: ${YELLOW}$http_status${NC}"

if [ "$http_status" = "200" ]; then
    echo -e "${GREEN}✅ Can access POAP Studio owned event${NC}"
    echo "$body" | jq '{
      name: .event.name,
      api_id: .event.api_id,
      hosts: [.hosts[].name]
    }'
else
    echo -e "${RED}Cannot access this event either${NC}"
fi

echo ""
echo -e "${BLUE}=== Analysis ===${NC}"
echo "1. Cookie appears to be valid"
echo "2. Can likely only access events owned by the authenticated user"
echo "3. Being a co-host/manager may not grant API access"
echo "4. Need to verify which events are accessible"