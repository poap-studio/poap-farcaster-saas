#!/bin/bash

# Explore Luma Events API

API_KEY="secret-7273PN691wI808x3xG27EsR7u"
BASE_URL="https://public-api.luma.com"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Function to make API calls
api_call() {
    local method=$1
    local endpoint=$2
    local data=$3
    
    if [ -z "$data" ]; then
        curl -s -X $method "$BASE_URL$endpoint" \
          -H "x-luma-api-key: $API_KEY" \
          -H "Accept: application/json"
    else
        curl -s -X $method "$BASE_URL$endpoint" \
          -H "x-luma-api-key: $API_KEY" \
          -H "Content-Type: application/json" \
          -H "Accept: application/json" \
          -d "$data"
    fi
}

echo -e "${BLUE}=== Exploring Luma Events API ===${NC}"
echo ""

# Get calendars for the user
echo -e "${GREEN}1. Finding user calendars${NC}"
api_call GET "/v1/calendar/list-managed" | jq '.'
echo ""

# Get a specific calendar
echo -e "${GREEN}2. Getting calendar details${NC}"
CALENDAR_ID="cal-TtxU741HCEBKCCe"
api_call GET "/v1/calendar/get?calendar_api_id=$CALENDAR_ID" | jq '.'
echo ""

# Test with a known event
echo -e "${GREEN}3. Testing with known event${NC}"
KNOWN_EVENT_ID="evt-dFABGoCDVLecXHG"
echo "Event ID: $KNOWN_EVENT_ID"
api_call GET "/v1/event/get?event_api_id=$KNOWN_EVENT_ID" | jq '.'
echo ""

# Get event hosts
echo -e "${GREEN}4. Getting event hosts${NC}"
api_call GET "/v1/event/list-hosts?event_api_id=$KNOWN_EVENT_ID" | jq '.'
echo ""

# Get event guests
echo -e "${GREEN}5. Getting event guests${NC}"
api_call GET "/v1/event/list-guests?event_api_id=$KNOWN_EVENT_ID" | jq '.'
echo ""

# Search for our test event
echo -e "${GREEN}6. Searching for test event${NC}"
echo "Looking for event with ID containing 'H2y5Rg51kDNxaDQ'..."
api_call GET "/v1/calendar/list-events?calendar_api_id=$CALENDAR_ID" | jq '.entries[] | select(.event.api_id | contains("H2y5"))'
echo ""

# Try to get event by URL
echo -e "${GREEN}7. Testing URL-based lookup${NC}"
api_call POST "/v1/entity/lookup-by-url" '{"url":"https://lu.ma/vferpy6v"}' | jq '.'
echo ""

# List all calendars the user has access to
echo -e "${GREEN}8. List all accessible calendars${NC}"
api_call GET "/v1/user/list-calendars" | jq '.'
echo ""

echo -e "${YELLOW}Summary:${NC}"
echo "- We can authenticate as POAP Studio (admin@poap.fr)"
echo "- The parameter for event operations is 'event_api_id'"
echo "- The test event might be in a different calendar or not accessible"