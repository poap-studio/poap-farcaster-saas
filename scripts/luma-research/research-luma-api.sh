#!/bin/bash

# Research Luma API - trying different approaches

API_KEY="secret-7273PN691wI808x3xG27EsR7u"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}=== Researching Luma API ===${NC}"
echo ""

# Try different base URLs and authentication methods
echo -e "${GREEN}1. Testing different base URLs${NC}"

# Test with lu.ma directly
echo "Testing lu.ma API..."
curl -s -X GET "https://lu.ma/api/v1/user" \
  -H "Authorization: Bearer ${API_KEY}" \
  -H "Accept: application/json" | jq '.' 2>/dev/null || echo "No response"

echo ""

# Test with api-key header instead
echo "Testing with x-api-key header..."
curl -s -X GET "https://api.lu.ma/user" \
  -H "x-api-key: ${API_KEY}" \
  -H "Accept: application/json" | jq '.' 2>/dev/null || echo "No response"

echo ""

# Test without version in path
echo "Testing without version..."
curl -s -X GET "https://api.lu.ma/user" \
  -H "Authorization: Bearer ${API_KEY}" \
  -H "Accept: application/json" | jq '.' 2>/dev/null || echo "No response"

echo ""

# Try GraphQL endpoint (many modern APIs use GraphQL)
echo -e "${GREEN}2. Testing GraphQL endpoint${NC}"
curl -s -X POST "https://api.lu.ma/graphql" \
  -H "Authorization: Bearer ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"query":"{ __schema { types { name } } }"}' | jq '.' 2>/dev/null || echo "No GraphQL"

echo ""

# Try to find API docs
echo -e "${GREEN}3. Checking for API documentation${NC}"
echo "Checking robots.txt for clues..."
curl -s https://lu.ma/robots.txt | grep -i api || echo "No API references in robots.txt"

echo ""

# Try common API patterns
echo -e "${GREEN}4. Testing common API patterns${NC}"

test_endpoint() {
    local url=$1
    local auth_header=$2
    echo -n "Testing $url... "
    status=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$url" -H "$auth_header")
    echo "Status: $status"
}

# Test various patterns
test_endpoint "https://api.lu.ma/api/user" "Authorization: Bearer ${API_KEY}"
test_endpoint "https://api.lu.ma/api/v1/user" "Authorization: Bearer ${API_KEY}"
test_endpoint "https://lu.ma/api/user" "Authorization: Bearer ${API_KEY}"
test_endpoint "https://lu.ma/api/v1/user" "Authorization: Bearer ${API_KEY}"

echo ""

# Check if there's OAuth flow
echo -e "${GREEN}5. Checking for OAuth endpoints${NC}"
curl -s -X POST "https://api.lu.ma/oauth/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials&client_id=${USER_EMAIL}&client_secret=${API_KEY}" | jq '.' 2>/dev/null || echo "No OAuth endpoint"

echo ""

echo -e "${YELLOW}Please create a test event and provide the URLs so we can test with real data.${NC}"