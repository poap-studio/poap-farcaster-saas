#!/bin/bash

# Luma API Research Script
# This script tests various Luma API endpoints to understand the structure

# API credentials (will be environment variables in production)
API_KEY="secret-7273PN691wI808x3xG27EsR7u"
USER_EMAIL="admin@poap.fr"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Luma API Research ===${NC}"
echo -e "${YELLOW}API Key: ${API_KEY}${NC}"
echo -e "${YELLOW}User Email: ${USER_EMAIL}${NC}"
echo ""

# Function to extract event ID from URLs
extract_event_id() {
    local url=$1
    local event_id=""
    
    # Pattern 1: https://lu.ma/event/manage/evt-H2y5Rg51kDNxaDQ
    if [[ $url =~ /event/manage/(evt-[a-zA-Z0-9]+) ]]; then
        event_id="${BASH_REMATCH[1]}"
    # Pattern 2: https://lu.ma/vferpy6v
    elif [[ $url =~ lu\.ma/([a-zA-Z0-9]+)$ ]]; then
        event_id="${BASH_REMATCH[1]}"
    fi
    
    echo "$event_id"
}

# Test URL extraction
echo -e "${GREEN}1. Testing URL Pattern Extraction${NC}"
test_url1="https://lu.ma/event/manage/evt-H2y5Rg51kDNxaDQ"
test_url2="https://lu.ma/vferpy6v"

echo "URL 1: $test_url1"
echo "Extracted ID: $(extract_event_id "$test_url1")"
echo ""
echo "URL 2: $test_url2"
echo "Extracted ID: $(extract_event_id "$test_url2")"
echo ""

# Test basic API authentication
echo -e "${GREEN}2. Testing API Authentication${NC}"
echo "Testing with API key in header..."
curl -s -X GET "https://api.lu.ma/v1/user" \
  -H "Authorization: Bearer ${API_KEY}" \
  -H "Content-Type: application/json" | jq '.'

echo ""

# Test getting user info
echo -e "${GREEN}3. Testing User Info Endpoint${NC}"
curl -s -X GET "https://api.lu.ma/v1/me" \
  -H "Authorization: Bearer ${API_KEY}" \
  -H "Content-Type: application/json" | jq '.'

echo ""

# Function to test event info
test_event_info() {
    local event_id=$1
    echo -e "${GREEN}4. Testing Event Info for ID: ${event_id}${NC}"
    
    # Try different endpoint patterns
    echo "Trying /v1/events/${event_id}..."
    curl -s -X GET "https://api.lu.ma/v1/events/${event_id}" \
      -H "Authorization: Bearer ${API_KEY}" \
      -H "Content-Type: application/json" | jq '.'
    
    echo ""
    echo "Trying /v1/event/${event_id}..."
    curl -s -X GET "https://api.lu.ma/v1/event/${event_id}" \
      -H "Authorization: Bearer ${API_KEY}" \
      -H "Content-Type: application/json" | jq '.'
}

# Function to check co-hosts
check_cohosts() {
    local event_id=$1
    echo -e "${GREEN}5. Checking Co-hosts for Event: ${event_id}${NC}"
    
    # Try to get event details including co-hosts
    curl -s -X GET "https://api.lu.ma/v1/events/${event_id}/hosts" \
      -H "Authorization: Bearer ${API_KEY}" \
      -H "Content-Type: application/json" | jq '.'
}

# Function to get attendees
get_attendees() {
    local event_id=$1
    echo -e "${GREEN}6. Getting Attendees for Event: ${event_id}${NC}"
    
    # Try different patterns for attendees
    echo "Trying /v1/events/${event_id}/attendees..."
    curl -s -X GET "https://api.lu.ma/v1/events/${event_id}/attendees" \
      -H "Authorization: Bearer ${API_KEY}" \
      -H "Content-Type: application/json" | jq '.'
    
    echo ""
    echo "Trying /v1/events/${event_id}/registrations..."
    curl -s -X GET "https://api.lu.ma/v1/events/${event_id}/registrations" \
      -H "Authorization: Bearer ${API_KEY}" \
      -H "Content-Type: application/json" | jq '.'
}

# Main execution
echo -e "${BLUE}Please provide an event URL to test:${NC}"
echo "Examples:"
echo "  - https://lu.ma/event/manage/evt-H2y5Rg51kDNxaDQ"
echo "  - https://lu.ma/vferpy6v"

# Save this for manual testing
echo ""
echo -e "${YELLOW}To test a specific event, run:${NC}"
echo "./test-luma-api.sh <event_url>"
echo ""

# If an argument is provided, test that event
if [ $# -eq 1 ]; then
    EVENT_URL=$1
    EVENT_ID=$(extract_event_id "$EVENT_URL")
    
    if [ -z "$EVENT_ID" ]; then
        echo -e "${RED}Error: Could not extract event ID from URL${NC}"
        exit 1
    fi
    
    echo -e "${BLUE}Testing event: ${EVENT_ID}${NC}"
    test_event_info "$EVENT_ID"
    check_cohosts "$EVENT_ID"
    get_attendees "$EVENT_ID"
fi