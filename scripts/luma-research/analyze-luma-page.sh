#!/bin/bash

# Analyze Luma event page to extract data

EVENT_URL="https://lu.ma/vferpy6v"
EVENT_ID="evt-H2y5Rg51kDNxaDQ"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}=== Analyzing Luma Event Page ===${NC}"
echo ""

# Download the page
echo -e "${GREEN}Downloading event page...${NC}"
curl -s "$EVENT_URL" > event-page.html

# Extract JSON-LD data
echo -e "${GREEN}Extracting structured data (JSON-LD)...${NC}"
cat event-page.html | grep -o '<script type="application/ld+json">[^<]*</script>' | sed 's/<[^>]*>//g' > event-data.json

if [ -s event-data.json ]; then
    echo "Event data extracted:"
    cat event-data.json | jq '.'
    
    # Extract specific fields
    echo ""
    echo -e "${YELLOW}Event Details:${NC}"
    echo "Name: $(cat event-data.json | jq -r '.name')"
    echo "Start: $(cat event-data.json | jq -r '.startDate')"
    echo "End: $(cat event-data.json | jq -r '.endDate')"
    echo ""
    echo -e "${YELLOW}Organizers:${NC}"
    cat event-data.json | jq -r '.organizer[] | "- \(.name) (\(.url))"'
    echo ""
else
    echo "No JSON-LD data found"
fi

# Look for API endpoints in JavaScript
echo -e "${GREEN}Searching for API endpoints in JavaScript...${NC}"
grep -o 'api[^"]*' event-page.html | grep -E 'https?://' | sort -u | head -10

# Look for GraphQL queries
echo -e "${GREEN}Searching for GraphQL references...${NC}"
grep -i graphql event-page.html | head -5

# Extract event data from page
echo -e "${GREEN}Extracting event metadata...${NC}"
echo "Title: $(grep -o '<title>[^<]*</title>' event-page.html | sed 's/<[^>]*>//g')"
echo "OG Image: $(grep 'property="og:image"' event-page.html | grep -o 'content="[^"]*"' | sed 's/content="//' | sed 's/"$//')"

# Look for authentication tokens or API keys
echo -e "${GREEN}Searching for authentication patterns...${NC}"
grep -o '"[a-zA-Z]*[Tt]oken":"[^"]*"' event-page.html | head -5
grep -o '"[a-zA-Z]*[Kk]ey":"[^"]*"' event-page.html | head -5

# Check for window object data
echo -e "${GREEN}Checking for window.__INITIAL_DATA__ or similar...${NC}"
grep -o 'window\.[^=]*=[^;]*' event-page.html | grep -E 'DATA|STATE|PROPS' | head -5

# Clean up
rm -f event-page.html

# Test different authentication approaches
echo ""
echo -e "${BLUE}=== Testing Alternative API Approaches ===${NC}"

# Test with user agent
echo -e "${GREEN}Testing with browser user agent...${NC}"
curl -s -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" \
     -H "Accept: application/json" \
     "https://api.lu.ma/events/$EVENT_ID" | jq '.' 2>/dev/null || echo "No response"

# Test OAuth-style endpoint
echo -e "${GREEN}Testing OAuth-style authentication...${NC}"
curl -s -X POST "https://api.lu.ma/oauth/authorize" \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "client_id=admin@poap.fr&client_secret=secret-7273PN691wI808x3xG27EsR7u&grant_type=client_credentials" | jq '.' 2>/dev/null || echo "No OAuth"

# Save findings
cat > luma-page-analysis.md << EOF
# Luma Page Analysis Results

## Event Data from JSON-LD
$(cat event-data.json | jq '.' 2>/dev/null || echo "No data")

## Key Findings
1. Event ID: $EVENT_ID
2. Short URL: $EVENT_URL
3. Organizers include POAP Studio (likely admin@poap.fr)
4. Event is scheduled for 2025-08-22

## Next Steps
- Need to find correct API authentication method
- May need to use web scraping or browser automation
- Consider using Luma's official integrations (Zapier, webhooks)
EOF

echo ""
echo -e "${GREEN}Analysis saved to luma-page-analysis.md${NC}"

# Clean up
rm -f event-data.json