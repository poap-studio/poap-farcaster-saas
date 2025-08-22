#!/bin/bash

# Luma login script using curl

EMAIL="admin@poap.fr"
PASSWORD='!q*g%@TP7w^q'
BASE_URL="https://lu.ma"
API_URL="https://api.lu.ma"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}=== Luma Login Script ===${NC}"
echo ""

# Create cookie jar
COOKIE_JAR="luma-cookies.txt"
rm -f $COOKIE_JAR

# Step 1: Get initial page and CSRF token
echo -e "${GREEN}1. Getting login page...${NC}"
curl -s -c $COOKIE_JAR -b $COOKIE_JAR \
  -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" \
  "$BASE_URL/signin" > signin-page.html

echo "Initial cookies saved"

# Step 2: Try login via API
echo -e "${GREEN}2. Attempting login via API...${NC}"

# First, try the email step
echo "Sending email..."
response=$(curl -s -c $COOKIE_JAR -b $COOKIE_JAR \
  -X POST "$API_URL/auth/start" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "Origin: https://lu.ma" \
  -H "Referer: https://lu.ma/signin" \
  -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" \
  -d "{\"email\":\"$EMAIL\"}" \
  -w "\nHTTP_STATUS:%{http_code}")

http_status=$(echo "$response" | grep "HTTP_STATUS:" | cut -d: -f2)
body=$(echo "$response" | sed '/HTTP_STATUS:/d')

echo "Status: $http_status"
echo "$body" | jq '.' 2>/dev/null || echo "$body" | head -5

# Step 3: Try password submission
echo -e "${GREEN}3. Sending password...${NC}"
response=$(curl -s -c $COOKIE_JAR -b $COOKIE_JAR \
  -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "Origin: https://lu.ma" \
  -H "Referer: https://lu.ma/signin" \
  -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" \
  -w "\nHTTP_STATUS:%{http_code}")

http_status=$(echo "$response" | grep "HTTP_STATUS:" | cut -d: -f2)
body=$(echo "$response" | sed '/HTTP_STATUS:/d')

echo "Status: $http_status"
echo "$body" | jq '.' 2>/dev/null || echo "$body" | head -5

# Step 4: Check cookies
echo -e "${GREEN}4. Checking cookies...${NC}"
if [ -f $COOKIE_JAR ]; then
    echo "Cookies in jar:"
    cat $COOKIE_JAR | grep -E "luma|auth|session" | grep -v "^#"
    
    # Extract auth cookie
    AUTH_COOKIE=$(grep "luma.auth-session-key" $COOKIE_JAR | awk '{print $6"="$7}' | tail -1)
    
    if [ -n "$AUTH_COOKIE" ]; then
        echo ""
        echo -e "${GREEN}✅ Auth cookie found: $AUTH_COOKIE${NC}"
        
        # Test the cookie
        echo ""
        echo -e "${BLUE}5. Testing cookie with admin API...${NC}"
        TEST_EVENT="evt-H2y5Rg51kDNxaDQ"
        
        curl -s -X GET "$API_URL/event/admin/get?event_api_id=$TEST_EVENT" \
          -H "Cookie: $AUTH_COOKIE" \
          -H "Accept: application/json" | jq '.' 2>/dev/null || echo "Failed to get event"
    else
        echo -e "${RED}No auth cookie found${NC}"
    fi
else
    echo "No cookie jar created"
fi

# Cleanup
rm -f signin-page.html

echo ""
echo -e "${YELLOW}Note:${NC}"
echo "If login failed, Luma might require:"
echo "1. JavaScript execution (use Puppeteer)"
echo "2. Additional security headers"
echo "3. CAPTCHA verification"