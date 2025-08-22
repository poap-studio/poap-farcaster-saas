#!/bin/bash

# Test Luma API access as event manager

API_KEY="secret-7273PN691wI808x3xG27EsR7u"
BASE_URL="https://public-api.luma.com"
TEST_EVENT_ID="evt-H2y5Rg51kDNxaDQ"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}=== Testing Luma API Access as Manager ===${NC}"
echo "User: POAP Studio (admin@poap.fr)"
echo "Role: Manager with full manage access"
echo ""

# Function to make API calls
api_call() {
    local method=$1
    local endpoint=$2
    local params=$3
    local description=$4
    
    echo -e "${GREEN}${description}${NC}"
    
    if [ -n "$params" ]; then
        full_url="$BASE_URL$endpoint?$params"
    else
        full_url="$BASE_URL$endpoint"
    fi
    
    echo "URL: $full_url"
    
    response=$(curl -s -X $method "$full_url" \
      -H "x-luma-api-key: $API_KEY" \
      -H "Accept: application/json" \
      -w "\nHTTP_STATUS:%{http_code}")
    
    http_status=$(echo "$response" | grep "HTTP_STATUS:" | cut -d: -f2)
    body=$(echo "$response" | sed '/HTTP_STATUS:/d')
    
    echo -e "Status: ${YELLOW}$http_status${NC}"
    
    if [ "$http_status" = "200" ] || [ "$http_status" = "201" ]; then
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
        return 0
    else
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
        return 1
    fi
    echo ""
}

# 1. List all events (including managed ones)
echo -e "${BLUE}1. Listing ALL events (owned + managed)${NC}"
api_call GET "/v1/calendar/list-events" "" "List all events"

# 2. Try calendar-list-events endpoint
echo -e "${BLUE}2. Testing calendar-list-events endpoint${NC}"
api_call GET "/v1/calendar-list-events" "" "Alternative calendar list events"

# 3. Try to lookup the specific event
echo -e "${BLUE}3. Looking up specific event${NC}"
api_call GET "/v1/calendar/lookup-event" "event_api_id=$TEST_EVENT_ID" "Lookup event by ID"
api_call GET "/v1/calendar-lookup-event" "event_api_id=$TEST_EVENT_ID" "Alternative lookup"

# 4. Check if event now appears in the main list
echo -e "${BLUE}4. Checking if test event appears in calendar events${NC}"
echo "Looking for event ID: $TEST_EVENT_ID"
api_call GET "/v1/calendar/list-events" "" "Get all events" | jq '.entries[] | select(.event.api_id == "'$TEST_EVENT_ID'")'

# 5. Try event-get with correct parameter
echo -e "${BLUE}5. Testing event-get endpoint${NC}"
api_call GET "/v1/event-get" "event_api_id=$TEST_EVENT_ID" "Get event with event_api_id"

# 6. Once we have the event, try to get guests
echo -e "${BLUE}6. Getting event guests${NC}"
api_call GET "/v1/event/get-guests" "event_api_id=$TEST_EVENT_ID" "Get guests for test event"

# 7. Look for different user roles/permissions endpoints
echo -e "${BLUE}7. Checking user permissions${NC}"
api_call GET "/v1/user/permissions" "" "Check user permissions"
api_call GET "/v1/user/managed-events" "" "Get managed events"

echo ""
echo -e "${YELLOW}Note:${NC}"
echo "If the event still doesn't appear, it might be because:"
echo "1. The manager role needs time to propagate"
echo "2. The API might cache results"
echo "3. We need a different endpoint for managed events"