#!/bin/bash

# Test Luma private/internal API patterns

API_KEY="secret-7273PN691wI808x3xG27EsR7u"
EVENT_ID="evt-H2y5Rg51kDNxaDQ"
USER_EMAIL="admin@poap.fr"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}=== Testing Luma Private API Patterns ===${NC}"
echo ""

# Test internal API patterns
echo -e "${GREEN}1. Testing internal API endpoints${NC}"

test_endpoint() {
    local url=$1
    local method=${2:-GET}
    local data=$3
    
    echo -n "Testing $method $url... "
    
    if [ -z "$data" ]; then
        response=$(curl -s -X $method "$url" \
          -H "Authorization: Bearer $API_KEY" \
          -H "x-api-key: $API_KEY" \
          -H "Accept: application/json" \
          -w "\nHTTP_STATUS:%{http_code}")
    else
        response=$(curl -s -X $method "$url" \
          -H "Authorization: Bearer $API_KEY" \
          -H "x-api-key: $API_KEY" \
          -H "Content-Type: application/json" \
          -H "Accept: application/json" \
          -d "$data" \
          -w "\nHTTP_STATUS:%{http_code}")
    fi
    
    http_status=$(echo "$response" | grep "HTTP_STATUS:" | cut -d: -f2)
    body=$(echo "$response" | sed '/HTTP_STATUS:/d')
    
    echo "Status: $http_status"
    
    if [ "$http_status" = "200" ] || [ "$http_status" = "201" ]; then
        echo -e "${GREEN}SUCCESS!${NC}"
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
        return 0
    fi
    
    if [ "$http_status" != "404" ]; then
        echo "$body" | jq '.' 2>/dev/null || echo "$body" | head -5
    fi
    
    return 1
}

# Test common internal API patterns
endpoints=(
    "https://api.lu.ma/internal/events/$EVENT_ID"
    "https://api.lu.ma/private/events/$EVENT_ID"
    "https://api.lu.ma/admin/events/$EVENT_ID"
    "https://api.lu.ma/v2/events/$EVENT_ID"
    "https://api.lu.ma/api/v2/events/$EVENT_ID"
    "https://app.lu.ma/api/events/$EVENT_ID"
    "https://lu.ma/_api/events/$EVENT_ID"
    "https://lu.ma/.netlify/functions/event?id=$EVENT_ID"
)

for endpoint in "${endpoints[@]}"; do
    test_endpoint "$endpoint" && break
done

# Test Luma API with different authentication
echo ""
echo -e "${GREEN}2. Testing with API key as password${NC}"
curl -s -u "$USER_EMAIL:$API_KEY" "https://api.lu.ma/events/$EVENT_ID" | jq '.' 2>/dev/null || echo "No response"

# Test direct event management endpoint
echo ""
echo -e "${GREEN}3. Testing event management endpoints${NC}"
test_endpoint "https://lu.ma/event/manage/$EVENT_ID/api"
test_endpoint "https://lu.ma/api/event/manage/$EVENT_ID"
test_endpoint "https://api.lu.ma/manage/events/$EVENT_ID"

# Test Zapier/webhook style endpoints
echo ""
echo -e "${GREEN}4. Testing integration endpoints${NC}"
test_endpoint "https://api.lu.ma/hooks/events/$EVENT_ID"
test_endpoint "https://api.lu.ma/integrations/events/$EVENT_ID"
test_endpoint "https://api.lu.ma/zapier/events/$EVENT_ID"

# Test with different headers
echo ""
echo -e "${GREEN}5. Testing with application-specific headers${NC}"
curl -s -X GET "https://api.lu.ma/events/$EVENT_ID" \
  -H "X-Luma-API-Key: $API_KEY" \
  -H "X-Luma-User: $USER_EMAIL" \
  -H "Accept: application/json" | jq '.' 2>/dev/null || echo "No response"

# Test guest list endpoint patterns
echo ""
echo -e "${GREEN}6. Testing guest list endpoints${NC}"
test_endpoint "https://api.lu.ma/events/$EVENT_ID/guests"
test_endpoint "https://api.lu.ma/events/$EVENT_ID/attendees"
test_endpoint "https://api.lu.ma/events/$EVENT_ID/registrations"
test_endpoint "https://lu.ma/api/event/$EVENT_ID/guests"

# Check if the API might require a different format
echo ""
echo -e "${GREEN}7. Testing with short code instead of event ID${NC}"
SHORT_CODE="vferpy6v"
test_endpoint "https://api.lu.ma/events/$SHORT_CODE"
test_endpoint "https://lu.ma/api/events/$SHORT_CODE"

echo ""
echo -e "${YELLOW}Summary:${NC}"
echo "If none of these work, Luma might:"
echo "1. Use a completely different API structure"
echo "2. Require OAuth or session-based authentication"
echo "3. Use webhooks exclusively for integrations"
echo "4. Have IP restrictions or require special access"