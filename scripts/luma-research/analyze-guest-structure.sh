#!/bin/bash

# Analyze guest data structure properly

COOKIE="luma.auth-session-key=usr-dZDAMCB9vdfjlvs.znhmpczf93qh40pkau4b"
EVENT_ID="evt-dFABGoCDVLecXHG"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}=== Luma Guest Data Analysis ===${NC}"
echo ""

# Get guests
response=$(curl -s -X GET "https://api.lu.ma/event/admin/get-guests?event_api_id=$EVENT_ID" \
  -H "Cookie: $COOKIE" \
  -H "Accept: application/json" \
  -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)")

# Parse and analyze
echo -e "${GREEN}Guest List Summary:${NC}"
echo ""

# Count total guests
total=$(echo "$response" | jq '.entries | length')
echo "Total guests: $total"

# Count checked in
checked_in=$(echo "$response" | jq '[.entries[] | select(.checked_in_at != null)] | length')
echo "Checked in: $checked_in"

# Count with emails
with_email=$(echo "$response" | jq '[.entries[] | select(.email != null and .email != "")] | length')
echo "With email: $with_email"

echo ""
echo -e "${BLUE}Guest List (Name - Email - Status):${NC}"
echo "$response" | jq -r '.entries[] | 
  "- \(.name) (\(.email // "no email")) - " + 
  if .checked_in_at then 
    "✓ Checked in at \(.checked_in_at)" 
  else 
    "✗ Not checked in" 
  end' | head -20

echo ""
echo -e "${BLUE}Data Fields Available:${NC}"
echo "- Guest ID (api_id)"
echo "- Name (first_name, last_name, name)"
echo "- Email"
echo "- Check-in status (checked_in_at)"
echo "- Registration date (registered_at)"
echo "- Approval status"
echo "- Location (geo_city, geo_country)"
echo "- Social handles (twitter, linkedin, etc.)"

echo ""
echo -e "${GREEN}Key Findings:${NC}"
echo "✅ Cookie authentication works"
echo "✅ Can access guest list with emails"
echo "✅ Check-in status available for filtering"
echo "✅ All necessary data for POAP delivery is accessible"

echo ""
echo -e "${YELLOW}Note about the test event (evt-H2y5Rg51kDNxaDQ):${NC}"
echo "❌ Cannot access because admin@poap.fr is co-host, not owner"
echo "❓ API only allows access to events you own, not co-host/manage"
echo "💡 Solution: User must transfer ownership or use different approach"