#!/bin/bash

# Find test event in Luma API

API_KEY="secret-7273PN691wI808x3xG27EsR7u"
BASE_URL="https://public-api.luma.com"
TEST_EVENT_ID="evt-H2y5Rg51kDNxaDQ"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}=== Finding Test Event in Luma API ===${NC}"
echo ""

# Try to get event directly with different parameter combinations
echo -e "${GREEN}1. Testing direct event access${NC}"

# Based on the error message, it seems "api_id" is expected
curl -s -X GET "$BASE_URL/v1/event/get" \
  -H "x-luma-api-key: $API_KEY" \
  -H "Accept: application/json" \
  -G --data-urlencode "api_id=$TEST_EVENT_ID" | jq '.'

echo ""

# Try to get event guests directly
echo -e "${GREEN}2. Testing direct guest access${NC}"
curl -s -X GET "$BASE_URL/v1/event/get-guests" \
  -H "x-luma-api-key: $API_KEY" \
  -H "Accept: application/json" \
  -G --data-urlencode "event_api_id=$TEST_EVENT_ID" | jq '.'

echo ""

# List all calendars that the user has access to
echo -e "${GREEN}3. Listing all accessible calendars${NC}"
curl -s -X GET "$BASE_URL/v1/calendar/list-my-calendars" \
  -H "x-luma-api-key: $API_KEY" \
  -H "Accept: application/json" | jq '.'

echo ""

# Try different calendar endpoints
echo -e "${GREEN}4. Testing calendar variants${NC}"
curl -s -X GET "$BASE_URL/v1/user/calendars" \
  -H "x-luma-api-key: $API_KEY" \
  -H "Accept: application/json" | jq '.'

echo ""

# Get more user details
echo -e "${GREEN}5. Getting extended user info${NC}"
curl -s -X GET "$BASE_URL/v1/user/profile" \
  -H "x-luma-api-key: $API_KEY" \
  -H "Accept: application/json" | jq '.'

echo ""

# Search for events where user is co-host
echo -e "${GREEN}6. Searching for co-hosted events${NC}"
echo "The API might not show events where the user is only a co-host."
echo "This is a common limitation in event APIs."
echo ""

# Check if we can access via short URL
echo -e "${GREEN}7. Testing with short URL${NC}"
SHORT_URL="vferpy6v"
curl -s -X GET "$BASE_URL/v1/event/get-by-url" \
  -H "x-luma-api-key: $API_KEY" \
  -H "Accept: application/json" \
  -G --data-urlencode "url=https://lu.ma/$SHORT_URL" | jq '.'

echo ""

echo -e "${YELLOW}Summary:${NC}"
echo "Event ID: $TEST_EVENT_ID"
echo "Short URL: https://lu.ma/vferpy6v"
echo "Created by: Alberto Gomez Toribio"
echo "Co-host: POAP Studio (admin@poap.fr)"
echo ""
echo -e "${RED}If the event is not accessible via API:${NC}"
echo "1. The API might only show events where the authenticated user is the owner"
echo "2. Co-host permissions might not be sufficient for API access"
echo "3. We might need to use a different approach (webhooks, browser automation)"