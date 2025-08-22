#!/bin/bash

# Test different methods to access Luma event

API_KEY="secret-7273PN691wI808x3xG27EsR7u"
BASE_URL="https://public-api.luma.com"
TEST_EVENT_ID="evt-H2y5Rg51kDNxaDQ"
SHORT_CODE="vferpy6v"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}=== Testing Different Event Access Methods ===${NC}"
echo ""

# Test with POST request for event get
echo -e "${GREEN}1. Testing POST method for event get${NC}"
curl -s -X POST "$BASE_URL/v1/event/get" \
  -H "x-luma-api-key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"event_api_id":"'$TEST_EVENT_ID'"}' | jq '.'

echo ""

# Test with different parameter formats
echo -e "${GREEN}2. Testing URL-encoded parameters${NC}"
curl -s -X GET "$BASE_URL/v1/event/get" \
  -H "x-luma-api-key: $API_KEY" \
  -H "Accept: application/json" \
  --data-urlencode "event_api_id=$TEST_EVENT_ID" | jq '.'

echo ""

# Check if we need to specify calendar
echo -e "${GREEN}3. Checking calendars accessible by user${NC}"
echo "Looking for calendars where user might be manager..."
curl -s -X GET "$BASE_URL/v1/user/list-calendars" \
  -H "x-luma-api-key: $API_KEY" | jq '.'

echo ""

# Try to get event through calendar endpoint with both IDs
echo -e "${GREEN}4. Testing with calendar context${NC}"
# Using the calendar ID from the other events
CALENDAR_ID="cal-TtxU741HCEBKCCe"
curl -s -X GET "$BASE_URL/v1/calendar/get-event" \
  -H "x-luma-api-key: $API_KEY" \
  -G --data-urlencode "calendar_api_id=$CALENDAR_ID" \
  --data-urlencode "event_api_id=$TEST_EVENT_ID" | jq '.'

echo ""

# Check webhook configuration
echo -e "${GREEN}5. Checking webhook endpoints${NC}"
curl -s -X GET "$BASE_URL/v1/event/webhooks" \
  -H "x-luma-api-key: $API_KEY" \
  -G --data-urlencode "event_api_id=$TEST_EVENT_ID" | jq '.'

echo ""

# List all available endpoints
echo -e "${GREEN}6. Testing event listing with filters${NC}"
curl -s -X GET "$BASE_URL/v1/calendar/list-events" \
  -H "x-luma-api-key: $API_KEY" \
  -G --data-urlencode "include_managed=true" | jq '.'

echo ""

echo -e "${YELLOW}Summary of findings:${NC}"
echo "1. User: POAP Studio (admin@poap.fr) - ID: usr-dZDAMCB9vdfjlvs"
echo "2. Event: $TEST_EVENT_ID (https://lu.ma/$SHORT_CODE)"
echo "3. Role: Manager with full manage access"
echo "4. Problem: Event not accessible via API despite manager role"
echo ""
echo -e "${RED}Conclusion:${NC}"
echo "The Luma API appears to have a limitation where:"
echo "- Only events CREATED by the API user are accessible"
echo "- Manager/co-host permissions are not sufficient for API access"
echo "- This is a common pattern in event APIs for security reasons"
echo ""
echo -e "${BLUE}Alternative approaches needed:${NC}"
echo "1. Have events created by admin@poap.fr from the start"
echo "2. Use webhooks for real-time updates (if accessible)"
echo "3. Use browser automation for existing events"
echo "4. Transfer ownership (if possible) instead of manager role"