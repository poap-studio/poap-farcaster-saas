#!/bin/bash

# Test Luma API with correct endpoints

API_KEY="secret-7273PN691wI808x3xG27EsR7u"
BASE_URL="https://public-api.luma.com"
TEST_EVENT_ID="evt-H2y5Rg51kDNxaDQ"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}=== Testing Luma API with Correct Endpoints ===${NC}"
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
    echo "$body" | jq '.' 2>/dev/null || echo "$body"
    echo ""
}

# Test different parameter names for event ID
echo -e "${BLUE}1. Testing Event Get with Different Parameters${NC}"
api_call GET "/v1/event/get" "event_api_id=$TEST_EVENT_ID" "Get event with event_api_id"
api_call GET "/v1/event/get" "api_id=$TEST_EVENT_ID" "Get event with api_id"
api_call GET "/v1/event/get" "id=$TEST_EVENT_ID" "Get event with id"

# Test with a known working event
KNOWN_EVENT="evt-dFABGoCDVLecXHG"
echo -e "${BLUE}2. Testing with Known Event from List${NC}"
api_call GET "/v1/event/get" "event_api_id=$KNOWN_EVENT" "Get known event details"

# Get guests for known event
echo -e "${BLUE}3. Testing Guest Endpoints${NC}"
api_call GET "/v1/event/get-guests" "event_api_id=$KNOWN_EVENT" "Get guests for known event"

# Test getting hosts
echo -e "${BLUE}4. Testing Host Information${NC}"
# Since we got event details, let's check if hosts are included

# Try to find our test event in different ways
echo -e "${BLUE}5. Searching for Test Event${NC}"
echo "Checking if test event is in the calendar..."
curl -s -X GET "$BASE_URL/v1/calendar/list-events" \
  -H "x-luma-api-key: $API_KEY" \
  -H "Accept: application/json" | jq '.entries[] | select(.event.url | contains("vferpy6v"))'

echo ""

# Check if we need different permissions
echo -e "${BLUE}6. Checking Permissions${NC}"
echo "Current user: POAP Studio (admin@poap.fr)"
echo "User ID: usr-dZDAMCB9vdfjlvs"
echo ""
echo "The test event might require:"
echo "- Being created by this API user"
echo "- Different access permissions"
echo "- Being in a specific calendar"

# Test URL patterns
echo -e "${BLUE}7. Testing URL Patterns${NC}"
# Extract from the known event URL format
echo "Known event URL: https://lu.ma/7njxvnl7"
echo "Test event URL: https://lu.ma/vferpy6v"
echo ""
echo "The test event might not be accessible via API because:"
echo "1. It was created by a different user (Alberto Gomez Toribio)"
echo "2. API user (POAP Studio) might only be a co-host, not owner"
echo "3. API might only show events created via API"