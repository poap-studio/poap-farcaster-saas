# Luma API Integration - Findings Summary

## ✅ What Works

### Authentication
- Session cookie authentication works perfectly
- Cookie format: `luma.auth-session-key=usr-{userId}.{sessionToken}`
- Cookie obtained via Puppeteer login script
- Admin API endpoints accessible at `https://api.lu.ma/event/admin/*`

### Data Access
- Can retrieve full event details for owned events
- Can access complete guest lists with:
  - Names and emails
  - Check-in status (`checked_in_at` field)
  - Registration timestamps
  - Approval status
  - Social media handles
  - Location data

### Guest Data Structure
```json
{
  "entries": [
    {
      "api_id": "gst-XLSsnu83BaPDmJA",
      "name": "Full Name",
      "email": "email@example.com",
      "checked_in_at": null,  // or timestamp if checked in
      "registered_at": "2024-10-02T19:12:40.789Z",
      "approval_status": "approved"
      // ... more fields
    }
  ],
  "has_more": false
}
```

## ❌ Limitations

### Event Access
- **Critical**: Can only access events where admin@poap.fr is the OWNER
- Being co-host or manager does NOT grant API access
- The test event (evt-H2y5Rg51kDNxaDQ) is not accessible because admin@poap.fr is only co-host

### Cookie Management
- Cookies expire (duration unknown, estimate ~7 days)
- Puppeteer with full browser won't work on Vercel
- Need alternative cookie refresh mechanism

## 🔧 Implementation Plan

### 1. Database Schema Updates
```sql
-- Add platform support
ALTER TABLE drops ADD COLUMN platform VARCHAR(50) DEFAULT 'farcaster';
ALTER TABLE drops ADD COLUMN luma_event_id VARCHAR(255);
ALTER TABLE drops ADD COLUMN delivery_method VARCHAR(50); -- 'manual' or 'automatic'
ALTER TABLE drops ADD COLUMN luma_event_url VARCHAR(500);
```

### 2. Cookie Management (Vercel-Compatible)

#### Option A: Manual Cookie Entry (Recommended)
- Admin interface to paste cookie
- Store in database with expiration tracking
- Email notifications when expired
- Clear instructions for obtaining cookie

#### Option B: External Cookie Service
- AWS Lambda with Puppeteer
- Scheduled refresh
- API endpoint for Vercel to fetch fresh cookie

### 3. UI/UX Changes

#### Dashboard
- Add platform dropdown when creating drops
- Show platform icon (Farcaster/Luma) on drop cards
- Different colors for different platforms

#### Luma Drop Creation Form
```typescript
interface LumaDropForm {
  eventUrl: string;        // User inputs Luma event URL
  deliveryMethod: 'manual' | 'automatic';
  emailSubject?: string;   // Custom email subject
  emailBody?: string;      // Custom email body
}
```

### 4. API Implementation

#### Event Validation
```typescript
async function validateLumaEvent(eventUrl: string) {
  const eventId = extractEventId(eventUrl);
  const cookie = await getLumaCookie();
  
  // Try to access event
  const response = await fetch(
    `https://api.lu.ma/event/admin/get?event_api_id=${eventId}`,
    { headers: { Cookie: cookie } }
  );
  
  if (response.status === 403) {
    throw new Error('You must be the event owner (not just co-host)');
  }
  
  return response.json();
}
```

#### Guest Retrieval
```typescript
async function getLumaGuests(eventId: string) {
  const cookie = await getLumaCookie();
  const allGuests = [];
  let cursor = null;
  
  do {
    const url = new URL('https://api.lu.ma/event/admin/get-guests');
    url.searchParams.set('event_api_id', eventId);
    if (cursor) url.searchParams.set('cursor', cursor);
    
    const response = await fetch(url, {
      headers: { Cookie: cookie }
    });
    
    const data = await response.json();
    allGuests.push(...data.entries);
    cursor = data.has_more ? data.next_cursor : null;
  } while (cursor);
  
  return allGuests;
}
```

## 🚀 Next Steps

1. **Immediate Action Required**:
   - User must make admin@poap.fr the OWNER (not just manager) of events
   - OR create events directly with admin@poap.fr account

2. **Development Priority**:
   - Implement manual cookie management UI
   - Add database schema changes
   - Create Luma drop creation form
   - Implement email sending for POAP delivery

3. **Testing**:
   - Create test event owned by admin@poap.fr
   - Test full flow: create drop → retrieve guests → send POAPs
   - Verify email delivery

## 📝 Important Notes

- The undocumented admin API is the only way to access guest emails
- Official API has stricter permissions and less functionality
- Cookie-based auth is fragile but necessary
- Consider implementing webhook support later for automatic check-in delivery