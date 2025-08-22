#!/bin/bash

# Test Luma public API endpoints (no auth required)

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}=== Testing Luma Public API ===${NC}"
echo ""

# Function to extract different types of event IDs from URLs
extract_event_ids() {
    local url=$1
    
    # Pattern 1: Management URL - evt-xxx format
    if [[ $url =~ /event/manage/(evt-[a-zA-Z0-9]+) ]]; then
        echo "Event ID (management): ${BASH_REMATCH[1]}"
    fi
    
    # Pattern 2: Short URL - alphanumeric code
    if [[ $url =~ lu\.ma/([a-zA-Z0-9]+)$ ]]; then
        echo "Short code: ${BASH_REMATCH[1]}"
    fi
    
    # Pattern 3: Event URL with slug
    if [[ $url =~ lu\.ma/event/([a-zA-Z0-9-]+) ]]; then
        echo "Event slug: ${BASH_REMATCH[1]}"
    fi
}

# Test public event data fetching
test_public_event() {
    local identifier=$1
    local type=$2
    
    echo -e "${GREEN}Testing public data for $type: $identifier${NC}"
    
    # Try different public endpoints
    echo "1. Testing lu.ma direct..."
    curl -s "https://lu.ma/$identifier" | grep -o '<title>[^<]*</title>' | head -1
    echo ""
    
    echo "2. Testing OG meta tags..."
    curl -s "https://lu.ma/$identifier" | grep -E 'property="og:|name="twitter:' | head -5
    echo ""
    
    echo "3. Testing JSON-LD data..."
    curl -s "https://lu.ma/$identifier" | grep -o '<script type="application/ld+json">[^<]*</script>' | sed 's/<[^>]*>//g' | jq '.' 2>/dev/null || echo "No JSON-LD found"
    echo ""
}

# Test API endpoint for public event data
test_api_endpoints() {
    local identifier=$1
    
    echo -e "${YELLOW}Testing potential API endpoints for: $identifier${NC}"
    
    endpoints=(
        "https://api.lu.ma/public/event/$identifier"
        "https://api.lu.ma/event/$identifier"
        "https://lu.ma/api/event/$identifier"
        "https://lu.ma/api/public/event/$identifier"
        "https://api.lu.ma/public/v1/event/$identifier"
        "https://lu.ma/public/api/event/$identifier"
    )
    
    for endpoint in "${endpoints[@]}"; do
        echo -n "Testing $endpoint... "
        response=$(curl -s -o /dev/null -w "%{http_code}" "$endpoint")
        echo "Status: $response"
        
        if [ "$response" = "200" ]; then
            echo "SUCCESS! Found working endpoint"
            curl -s "$endpoint" | jq '.' 2>/dev/null || curl -s "$endpoint"
            break
        fi
    done
}

# Main script
if [ $# -eq 0 ]; then
    echo -e "${RED}Usage: $0 <luma_event_url>${NC}"
    echo "Examples:"
    echo "  $0 https://lu.ma/vferpy6v"
    echo "  $0 https://lu.ma/event/manage/evt-H2y5Rg51kDNxaDQ"
    exit 1
fi

EVENT_URL=$1
echo -e "${BLUE}Analyzing URL: $EVENT_URL${NC}"
extract_event_ids "$EVENT_URL"
echo ""

# Extract identifiers
SHORT_CODE=""
EVENT_ID=""

if [[ $EVENT_URL =~ lu\.ma/([a-zA-Z0-9]+)$ ]]; then
    SHORT_CODE="${BASH_REMATCH[1]}"
fi

if [[ $EVENT_URL =~ /event/manage/(evt-[a-zA-Z0-9]+) ]]; then
    EVENT_ID="${BASH_REMATCH[1]}"
fi

# Test with short code if available
if [ ! -z "$SHORT_CODE" ]; then
    test_public_event "$SHORT_CODE" "short code"
    test_api_endpoints "$SHORT_CODE"
fi

# Test with event ID if available
if [ ! -z "$EVENT_ID" ]; then
    test_public_event "$EVENT_ID" "event ID"
    test_api_endpoints "$EVENT_ID"
fi

echo ""
echo -e "${BLUE}Next: Test with API key once we understand the public structure${NC}"