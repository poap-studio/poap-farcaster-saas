#!/bin/bash

# Luma API Explorer Script
# This script explores various Luma API endpoints to understand the API structure

API_KEY="secret-7273PN691wI808x3xG27EsR7u"
BASE_URL="https://api.lu.ma"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}=== Luma API Explorer ===${NC}"
echo ""

# Function to make API call and pretty print
api_call() {
    local method=$1
    local endpoint=$2
    local data=$3
    
    echo -e "${GREEN}${method} ${endpoint}${NC}"
    
    if [ -z "$data" ]; then
        response=$(curl -s -X ${method} "${BASE_URL}${endpoint}" \
          -H "Authorization: Bearer ${API_KEY}" \
          -H "Content-Type: application/json" \
          -w "\nHTTP_STATUS:%{http_code}")
    else
        response=$(curl -s -X ${method} "${BASE_URL}${endpoint}" \
          -H "Authorization: Bearer ${API_KEY}" \
          -H "Content-Type: application/json" \
          -d "${data}" \
          -w "\nHTTP_STATUS:%{http_code}")
    fi
    
    http_status=$(echo "$response" | grep "HTTP_STATUS:" | cut -d: -f2)
    body=$(echo "$response" | sed '/HTTP_STATUS:/d')
    
    echo -e "Status: ${YELLOW}${http_status}${NC}"
    echo "$body" | jq '.' 2>/dev/null || echo "$body"
    echo ""
}

# Test various API endpoints
echo -e "${BLUE}1. Testing Authentication and User Endpoints${NC}"
api_call GET "/v1/user"
api_call GET "/v1/me"
api_call GET "/v1/users/me"

echo -e "${BLUE}2. Testing Event Endpoints${NC}"
# We'll need to test with a real event ID
echo "To test event endpoints, we need a real event ID."
echo "Common patterns to try:"
echo "  - /v1/events/{event_id}"
echo "  - /v1/event/{event_id}"
echo "  - /v1/events/{event_id}/details"
echo ""

echo -e "${BLUE}3. Testing API Documentation Endpoints${NC}"
api_call GET "/v1"
api_call GET "/v1/docs"
api_call GET "/docs"
api_call GET "/swagger"

echo -e "${BLUE}4. Testing Common Patterns${NC}"
api_call GET "/v1/events"
api_call GET "/v1/users"
api_call GET "/v1/organizations"

# Create a webhook test script
cat > scripts/luma-research/test-webhooks.js << 'EOF'
const express = require('express');
const app = express();
app.use(express.json());

const PORT = 3001;

// Log all incoming requests
app.use((req, res, next) => {
    console.log(`\n=== ${new Date().toISOString()} ===`);
    console.log(`${req.method} ${req.path}`);
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    next();
});

// Webhook endpoint
app.post('/webhook/luma', (req, res) => {
    console.log('\n🎯 Luma Webhook Received!');
    console.log('Event Type:', req.headers['x-luma-event'] || 'Unknown');
    console.log('Payload:', JSON.stringify(req.body, null, 2));
    
    // Save to file for analysis
    const fs = require('fs');
    const filename = `webhook-${Date.now()}.json`;
    fs.writeFileSync(filename, JSON.stringify({
        headers: req.headers,
        body: req.body,
        timestamp: new Date().toISOString()
    }, null, 2));
    console.log(`Saved to ${filename}`);
    
    res.status(200).json({ received: true });
});

app.listen(PORT, () => {
    console.log(`\n🚀 Webhook test server running on http://localhost:${PORT}`);
    console.log('Webhook URL: http://localhost:${PORT}/webhook/luma');
    console.log('\nUse ngrok to expose this to the internet:');
    console.log(`ngrok http ${PORT}`);
});
EOF

echo -e "${GREEN}Created webhook test server at scripts/luma-research/test-webhooks.js${NC}"

# Create a documentation file
cat > scripts/luma-research/luma-api-findings.md << 'EOF'
# Luma API Research Findings

## Event ID Extraction Patterns

1. **Management URL**: `https://lu.ma/event/manage/evt-{eventId}`
   - Example: `https://lu.ma/event/manage/evt-H2y5Rg51kDNxaDQ`
   - Extract pattern: `/event/manage/(evt-[a-zA-Z0-9]+)`

2. **Short URL**: `https://lu.ma/{shortCode}`
   - Example: `https://lu.ma/vferpy6v`
   - Extract pattern: `lu\.ma/([a-zA-Z0-9]+)$`

## API Authentication

- **Method**: Bearer token in Authorization header
- **Header**: `Authorization: Bearer {API_KEY}`

## Known Endpoints

### User/Authentication
- [ ] GET /v1/user
- [ ] GET /v1/me
- [ ] GET /v1/users/me

### Events
- [ ] GET /v1/events/{event_id}
- [ ] GET /v1/event/{event_id}
- [ ] GET /v1/events/{event_id}/hosts
- [ ] GET /v1/events/{event_id}/attendees
- [ ] GET /v1/events/{event_id}/registrations

### Webhooks
- [ ] Check-in events
- [ ] Registration events
- [ ] Event updates

## Event Data Structure

```json
{
  // To be filled after testing
}
```

## Attendee Data Structure

```json
{
  // To be filled after testing
}
```

## Webhook Payload Structure

```json
{
  // To be filled after testing
}
```

## Environment Variables Needed

- `LUMA_API_KEY`: API key for authentication
- `LUMA_USER_EMAIL`: Email of the user (admin@poap.fr)
- `LUMA_WEBHOOK_SECRET`: (if webhooks use signing)

## Notes

- Co-host verification: Need to check if admin@poap.fr is a co-host
- Check-in webhooks: Need to test real-time notifications
- Attendee data: Need to verify what information is available

EOF

echo -e "${GREEN}Created documentation at scripts/luma-research/luma-api-findings.md${NC}"

echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Create a test event on Luma and share the URLs"
echo "2. Run: ./test-luma-api.sh <event_url>"
echo "3. Test webhooks with ngrok and test-webhooks.js"
echo "4. Update luma-api-findings.md with results"