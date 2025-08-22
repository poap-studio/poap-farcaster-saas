# Luma Integration Research Summary

## Key Findings

### 1. API Investigation Results
- **No Traditional REST API**: Luma does not expose a public REST API at `api.lu.ma`
- **Authentication Issues**: The provided API key (`secret-7273PN691wI808x3xG27EsR7u`) does not work with standard API authentication patterns
- **Management Interface**: Events have a web-based management interface at `/event/manage/{eventId}`

### 2. Event Data Structure
From the public event page (https://lu.ma/vferpy6v):
- **Event ID**: `evt-H2y5Rg51kDNxaDQ`
- **Short Code**: `vferpy6v`
- **Organizers**: 
  - Alberto Gomez Toribio
  - POAP Studio (likely admin@poap.fr)
- **Event Date**: 2025-08-22T17:00:00.000+02:00 to 18:00:00.000+02:00
- **Attendees**: 
  - 1 checked in: lucas@poap.fr
  - 1 "going" but not checked in (not eligible for POAP)

### 3. Management Interface Tabs
The event management page shows these sections:
- Overview
- **Guests** (likely where we can get attendee data)
- Registration
- Blasts (email campaigns)
- Insights
- More

### 4. URL Patterns
- **Public Event**: `https://lu.ma/{shortCode}`
- **Management**: `https://lu.ma/event/manage/{eventId}`
- **Direct Link**: `https://lu.ma/{shortCode}?tk={token}`

## Integration Approaches

Since there's no public API, we have three main options:

### Option 1: Web Scraping with Session Authentication
**Pros:**
- Direct access to all event data
- Can verify co-hosts
- Can get attendee lists and check-in status

**Cons:**
- Fragile (breaks if Luma changes their UI)
- Requires maintaining session cookies
- May violate Luma's terms of service

**Implementation:**
1. Create session with email/password or API key
2. Navigate to `/event/manage/{eventId}/guests`
3. Parse HTML to extract attendee data
4. Check for admin@poap.fr in co-hosts

### Option 2: Webhook-Based Integration
**Pros:**
- Real-time notifications for check-ins
- Official integration method
- More stable than scraping

**Cons:**
- Requires webhook setup for each event
- May not provide historical data
- Need to investigate webhook configuration

**Implementation:**
1. Set up webhook endpoint in our app
2. Configure Luma to send check-in events
3. Process webhooks to send POAP emails

### Option 3: Browser Automation (Puppeteer/Playwright)
**Pros:**
- Can handle JavaScript-rendered content
- Simulate real user interactions
- Access to all data visible in UI

**Cons:**
- Resource intensive
- Slower than API calls
- Complex to deploy and maintain

## Recommended Approach

Given the constraints, I recommend a **hybrid approach**:

1. **For event creation/validation**:
   - Use browser automation to:
     - Extract event details
     - Verify admin@poap.fr is co-host
     - Get initial attendee count

2. **For POAP delivery**:
   - Option 1 (Manual): Add a "Send POAPs" button that triggers browser automation to get final attendee list
   - Option 2 (Automatic): Set up webhooks for real-time check-in notifications

## Environment Variables Needed

```bash
# Luma Integration
LUMA_API_KEY=secret-7273PN691wI808x3xG27EsR7u
LUMA_USER_EMAIL=admin@poap.fr
LUMA_USER_PASSWORD=<password_if_needed>
LUMA_WEBHOOK_SECRET=<webhook_signature_secret>
```

## Next Steps

1. **Test webhook functionality**:
   - Set up ngrok tunnel
   - Configure webhook in Luma (if possible)
   - Document webhook payload structure

2. **Prototype browser automation**:
   - Create Puppeteer script to login and extract event data
   - Test co-host verification
   - Extract attendee emails

3. **Design database schema**:
   - Add `platform` field to drops table
   - Add Luma-specific fields (eventId, shortCode)
   - Store attendee delivery status

## Questions for Implementation

1. How does Luma handle webhook configuration? Is it per-event or account-wide?
2. Can we use the API key for any authentication, or do we need username/password?
3. Should we store Luma event data locally or fetch it on-demand?
4. How do we handle POAP delivery failures and retries?

## Test Event Data

- **Event URL**: https://lu.ma/vferpy6v
- **Management URL**: https://lu.ma/event/manage/evt-H2y5Rg51kDNxaDQ
- **Event ID**: evt-H2y5Rg51kDNxaDQ
- **Co-host confirmed**: admin@poap.fr (as POAP Studio)
- **Test attendee**: lucas@poap.fr (checked in)