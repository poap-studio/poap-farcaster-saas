#!/bin/bash

# Test Official Luma API
# Base URL: https://public-api.luma.com
# Auth: x-luma-api-key header

API_KEY="secret-7273PN691wI808x3xG27EsR7u"
BASE_URL="https://public-api.luma.com"
EVENT_ID="evt-H2y5Rg51kDNxaDQ"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}=== Testing Official Luma API ===${NC}"
echo "Base URL: $BASE_URL"
echo "API Key: ${API_KEY:0:20}..."
echo ""

# Function to make API calls
api_call() {
    local method=$1
    local endpoint=$2
    local data=$3
    local description=$4
    
    echo -e "${GREEN}${description}${NC}"
    echo "$method $BASE_URL$endpoint"
    
    if [ -z "$data" ]; then
        response=$(curl -s -X $method "$BASE_URL$endpoint" \
          -H "x-luma-api-key: $API_KEY" \
          -H "Accept: application/json" \
          -w "\nHTTP_STATUS:%{http_code}")
    else
        response=$(curl -s -X $method "$BASE_URL$endpoint" \
          -H "x-luma-api-key: $API_KEY" \
          -H "Content-Type: application/json" \
          -H "Accept: application/json" \
          -d "$data" \
          -w "\nHTTP_STATUS:%{http_code}")
    fi
    
    http_status=$(echo "$response" | grep "HTTP_STATUS:" | cut -d: -f2)
    body=$(echo "$response" | sed '/HTTP_STATUS:/d')
    
    echo -e "Status: ${YELLOW}$http_status${NC}"
    echo "$body" | jq '.' 2>/dev/null || echo "$body"
    echo ""
    
    return $([ "$http_status" = "200" ] || [ "$http_status" = "201" ])
}

# Test authentication
echo -e "${BLUE}1. Testing Authentication${NC}"
api_call GET "/v1/user/get-self" "" "Get authenticated user info"

# Test event endpoints
echo -e "${BLUE}2. Testing Event Endpoints${NC}"
api_call GET "/v1/event/get?api_id=$EVENT_ID" "" "Get event by ID"

# Try alternative event ID formats
api_call GET "/v1/event/get?event_id=$EVENT_ID" "" "Get event with event_id parameter"
api_call GET "/v1/events/$EVENT_ID" "" "Get event with ID in path"

# Test getting event guests
echo -e "${BLUE}3. Testing Guest Management${NC}"
api_call GET "/v1/event/list-guests?api_id=$EVENT_ID" "" "List event guests"
api_call GET "/v1/event/guests?api_id=$EVENT_ID" "" "Alternative guests endpoint"

# Test calendar endpoints
echo -e "${BLUE}4. Testing Calendar Endpoints${NC}"
api_call GET "/v1/calendar/list-events" "" "List all events"
api_call GET "/v1/calendars" "" "List calendars"

# Test entity lookup
echo -e "${BLUE}5. Testing Entity Lookup${NC}"
api_call POST "/v1/entity/lookup" '{"entity_id":"'$EVENT_ID'"}' "Lookup event entity"

# Extract and display key information
echo -e "${BLUE}Summary:${NC}"
echo "If authentication works, we should be able to:"
echo "1. Get event details including hosts"
echo "2. List event guests with check-in status"
echo "3. Verify admin@poap.fr is a co-host"
echo "4. Get attendee emails for POAP delivery"