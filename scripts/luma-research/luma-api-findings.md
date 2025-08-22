# Luma API Research Findings

## Current Status

### Authentication
- API Key: `secret-7273PN691wI808x3xG27EsR7u`
- User: `admin@poap.fr`
- Base URL: `https://api.lu.ma`

### Discovered Authentication Issues
1. The API recognizes `x-api-key` header (returns 401 "You are not signed in" instead of 404)
2. Various authentication methods tested:
   - `x-api-key: {API_KEY}` → 401
   - `X-Api-Key: {API_KEY}` → 401
   - `Authorization: Bearer {API_KEY}` → 401
   - `Authorization: ApiKey {API_KEY}` → 401
   - Raw API key in Authorization → 401

This suggests the API key might be:
- Invalid or expired
- Requires additional authentication steps
- Needs to be used with specific endpoints only

## Event URL Patterns

### Pattern 1: Management URL
- Format: `https://lu.ma/event/manage/evt-{eventId}`
- Example: `https://lu.ma/event/manage/evt-H2y5Rg51kDNxaDQ`
- Regex: `/event/manage/(evt-[a-zA-Z0-9]+)`

### Pattern 2: Short URL
- Format: `https://lu.ma/{shortCode}`
- Example: `https://lu.ma/vferpy6v`
- Regex: `lu\.ma/([a-zA-Z0-9]+)$`

## Tested Endpoints (All returned 404 or 401)

### User/Authentication
- `/user` - 401 "You are not signed in"
- `/me` - 404
- `/account` - 404
- `/profile` - 404
- `/v1/user` - 404
- `/v1/me` - 404

### Events
- `/events` - 404
- `/calendar-events` - 404
- `/hosted-events` - 404

### Other
- `/auth/session` - 404
- `/oauth/token` - 404
- `/graphql` - 404

## Environment Variables Needed

```bash
# Luma API Configuration
LUMA_API_KEY=          # API key for authentication
LUMA_USER_EMAIL=       # Email of the user (admin@poap.fr)
LUMA_WEBHOOK_SECRET=   # Secret for webhook signature validation (if applicable)
```

## Next Steps

1. **Need real event data** to test:
   - Event information retrieval
   - Co-host verification
   - Attendee list access
   - Check-in status

2. **Webhook testing** with ngrok:
   - Registration webhooks
   - Check-in webhooks
   - Event update webhooks

3. **API Documentation**:
   - Need to find proper API documentation
   - Might need to contact Luma support for API access details

## Scripts Created

1. `test-luma-api.sh` - Basic API testing with event URLs
2. `explore-luma-api.sh` - Explores different API endpoints
3. `research-luma-api.sh` - Tests different authentication methods
4. `test-luma-auth.sh` - Comprehensive auth testing
5. `test-luma-public-api.sh` - Tests public endpoints (no auth)
6. `webhook-server.js` - Express server for webhook testing

## Pending Investigation

- [ ] Correct API authentication method
- [ ] Event data structure
- [ ] Co-host verification endpoint
- [ ] Attendee list endpoint
- [ ] Check-in webhook format
- [ ] Email sending integration for POAPs

## Notes

- The API seems to exist but authentication is failing
- Might need OAuth flow instead of API key
- Could require session-based authentication
- Need to verify if the provided API key is valid