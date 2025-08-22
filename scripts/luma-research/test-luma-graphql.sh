#!/bin/bash

# Test Luma GraphQL API

API_KEY="secret-7273PN691wI808x3xG27EsR7u"
EVENT_ID="evt-H2y5Rg51kDNxaDQ"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}=== Testing Luma GraphQL API ===${NC}"
echo ""

# Test different GraphQL endpoints
test_graphql() {
    local url=$1
    local query=$2
    local description=$3
    
    echo -e "${GREEN}${description}${NC}"
    echo "URL: $url"
    
    response=$(curl -s -X POST "$url" \
      -H "Content-Type: application/json" \
      -H "x-api-key: $API_KEY" \
      -H "Authorization: Bearer $API_KEY" \
      -d "{\"query\":\"$query\"}" \
      -w "\nHTTP_STATUS:%{http_code}")
    
    http_status=$(echo "$response" | grep "HTTP_STATUS:" | cut -d: -f2)
    body=$(echo "$response" | sed '/HTTP_STATUS:/d')
    
    echo "Status: $http_status"
    echo "$body" | jq '.' 2>/dev/null || echo "$body"
    echo ""
}

# Test introspection query
introspection_query='{ __schema { types { name } } }'

test_graphql "https://api.lu.ma/graphql" "$introspection_query" "1. Testing api.lu.ma/graphql"
test_graphql "https://lu.ma/api/graphql" "$introspection_query" "2. Testing lu.ma/api/graphql"
test_graphql "https://api.lu.ma/gql" "$introspection_query" "3. Testing api.lu.ma/gql"
test_graphql "https://lu.ma/gql" "$introspection_query" "4. Testing lu.ma/gql"

# Test event query
event_query="{ event(id: \\\"$EVENT_ID\\\") { id name hosts { name email } } }"

echo -e "${YELLOW}Testing event queries${NC}"
test_graphql "https://api.lu.ma/graphql" "$event_query" "5. Testing event query on api.lu.ma/graphql"
test_graphql "https://lu.ma/api/graphql" "$event_query" "6. Testing event query on lu.ma/api/graphql"

# Test different auth methods with cookies
echo -e "${YELLOW}Testing with cookie-based auth${NC}"
echo "Attempting to get session cookie..."

# Try to authenticate and get a session
curl -s -c cookies.txt -X POST "https://lu.ma/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$USER_EMAIL\",\"api_key\":\"$API_KEY\"}" | jq '.' 2>/dev/null || echo "No login endpoint"

# Check if we got any cookies
if [ -f cookies.txt ]; then
    echo "Cookies saved. Testing with cookies..."
    curl -s -b cookies.txt "https://lu.ma/api/user" | jq '.' 2>/dev/null || echo "No user endpoint with cookies"
    rm cookies.txt
fi

echo ""
echo -e "${BLUE}Testing REST API patterns${NC}"

# Test different REST patterns
endpoints=(
    "https://lu.ma/api/event/$EVENT_ID"
    "https://lu.ma/api/events/$EVENT_ID"
    "https://lu.ma/api/v1/event/$EVENT_ID"
    "https://lu.ma/api/v1/events/$EVENT_ID"
    "https://api.lu.ma/event/$EVENT_ID"
    "https://api.lu.ma/events/$EVENT_ID"
)

for endpoint in "${endpoints[@]}"; do
    echo -n "Testing $endpoint... "
    status=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$endpoint" \
      -H "x-api-key: $API_KEY" \
      -H "Accept: application/json")
    
    if [ "$status" = "200" ]; then
        echo -e "${GREEN}SUCCESS! Status: $status${NC}"
        curl -s -X GET "$endpoint" \
          -H "x-api-key: $API_KEY" \
          -H "Accept: application/json" | jq '.'
        break
    else
        echo "Status: $status"
    fi
done