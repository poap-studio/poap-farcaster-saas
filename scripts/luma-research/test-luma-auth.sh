#!/bin/bash

# Test Luma authentication methods

API_KEY="secret-7273PN691wI808x3xG27EsR7u"
USER_EMAIL="admin@poap.fr"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}=== Testing Luma Authentication Methods ===${NC}"
echo ""

# Function to test authentication
test_auth() {
    local endpoint=$1
    local method=$2
    local header_name=$3
    local header_value=$4
    local description=$5
    
    echo -e "${GREEN}${description}${NC}"
    echo "Endpoint: $endpoint"
    echo "Header: $header_name: ${header_value:0:20}..."
    
    response=$(curl -s -X $method "$endpoint" \
      -H "$header_name: $header_value" \
      -H "Accept: application/json" \
      -w "\nHTTP_STATUS:%{http_code}")
    
    http_status=$(echo "$response" | grep "HTTP_STATUS:" | cut -d: -f2)
    body=$(echo "$response" | sed '/HTTP_STATUS:/d')
    
    echo "Status: $http_status"
    echo "$body" | jq '.' 2>/dev/null || echo "$body"
    echo ""
}

# Test different authentication methods on api.lu.ma
BASE_URL="https://api.lu.ma"

echo -e "${YELLOW}Testing api.lu.ma endpoints${NC}"
test_auth "$BASE_URL/user" "GET" "x-api-key" "$API_KEY" "1. Using x-api-key header"
test_auth "$BASE_URL/user" "GET" "X-Api-Key" "$API_KEY" "2. Using X-Api-Key header (capitalized)"
test_auth "$BASE_URL/user" "GET" "Authorization" "Bearer $API_KEY" "3. Using Bearer token"
test_auth "$BASE_URL/user" "GET" "Authorization" "ApiKey $API_KEY" "4. Using ApiKey prefix"
test_auth "$BASE_URL/user" "GET" "Authorization" "$API_KEY" "5. Using raw API key in Authorization"

# Test with user email in headers
echo -e "${YELLOW}Testing with user email${NC}"
test_auth "$BASE_URL/user" "GET" "x-api-key" "$API_KEY" "6. With x-user-email header" \
  -H "x-user-email: $USER_EMAIL"

# Test session-based auth
echo -e "${YELLOW}Testing session creation${NC}"
echo "Attempting to create session..."
curl -s -X POST "$BASE_URL/auth/session" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d "{\"email\":\"$USER_EMAIL\",\"api_key\":\"$API_KEY\"}" | jq '.' 2>/dev/null || echo "No session endpoint"

echo ""

# Test different endpoints that might work
echo -e "${YELLOW}Testing various endpoint patterns${NC}"
endpoints=(
    "/me"
    "/account"
    "/profile"
    "/events"
    "/calendar-events"
    "/hosted-events"
)

for endpoint in "${endpoints[@]}"; do
    echo -n "Testing $endpoint... "
    status=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$BASE_URL$endpoint" -H "x-api-key: $API_KEY")
    echo "Status: $status"
done

echo ""
echo -e "${BLUE}Summary:${NC}"
echo "The 'x-api-key' header seems to be recognized (returns 'not signed in' instead of 404)"
echo "This suggests we need either:"
echo "1. A different authentication method"
echo "2. Additional headers or parameters"
echo "3. To test with actual event endpoints using real event IDs"
echo ""
echo -e "${RED}Please create a test event and provide the URLs to continue testing.${NC}"