# Contentful Webhook Setup for Instant Cache Revalidation

## Overview

CloakForge uses **long cache durations** (`cacheLife('days')`) for optimal performance, but **instantly revalidates** when content changes in Contentful via webhooks.

This gives you:
- ✅ **Efficient caching** - Server checks once per day (1,440x reduction vs. per-minute)
- ✅ **Instant updates** - Content propagates immediately when you publish in Contentful
- ✅ **Optimal costs** - Minimal Contentful API calls, reduced hosting costs
- ✅ **Best UX** - Users get cached pages instantly + fresh content when it matters

## How It Works

```
Contentful CMS → Webhook → Your API → revalidateTag('tool-configs') → Next.js Cache Cleared → Fresh Content
```

**Timeline:**
1. **You publish** tool config changes in Contentful
2. **Contentful sends** webhook to your API endpoint
3. **Your API calls** `revalidateTag('tool-configs', 'max')`
4. **Next.js marks** tagged data as stale
5. **Next visitor** triggers background refresh
6. **Fresh content** served on subsequent requests

## Setup Guide

### Step 1: Generate Webhook Secret

Generate a secure random string for webhook authentication:

```bash
# macOS/Linux
openssl rand -base64 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Copy the output, you'll need it in the next steps.

### Step 2: Add Environment Variable

Add to your `.env.local`:

```bash
CONTENTFUL_REVALIDATE_SECRET=<paste_your_generated_secret_here>
```

**Important**: Keep this secret secure! It prevents unauthorized cache invalidation.

### Step 3: Configure Contentful Webhook

1. **Open Contentful**
   - Go to your space
   - Navigate to **Settings > Webhooks**

2. **Create New Webhook**
   - Click **Add Webhook**
   - Name: `CloakForge Cache Revalidation`

3. **Configure URL**
   ```
   https://your-domain.com/api/revalidate/contentful?secret=YOUR_SECRET_HERE
   ```
   Replace:
   - `your-domain.com` with your production domain
   - `YOUR_SECRET_HERE` with the secret you generated in Step 1

4. **Select Triggers**
   - ✅ Entry.publish
   - ✅ Entry.unpublish  
   - ✅ Entry.delete

5. **Add Content Type Filter** (Optional but recommended)
   - Click **Add filter**
   - Content type equals `toolConfiguration`
   - This prevents unnecessary revalidations for blog posts

6. **Save Webhook**

### Step 4: Test the Webhook

#### Method 1: Manual Test via GET Request

```bash
curl "https://your-domain.com/api/revalidate/contentful?secret=YOUR_SECRET_HERE"
```

Expected response:
```json
{
  "status": "success",
  "status_code": 200,
  "error_message": "",
  "data": {
    "revalidated": true,
    "timestamp": 1699999999999
  }
}
```

#### Method 2: Test via Contentful

1. Go to any tool configuration entry in Contentful
2. Make a small change
3. Click **Publish**
4. Check your server logs for:
   ```
   Contentful webhook received
   Cache revalidation triggered
   ```

### Step 5: Verify Cache Behavior

1. **Visit your site** - Pages load instantly (cached)
2. **Update tool config in Contentful**
3. **Publish changes**
4. **Refresh your site** - See updated content immediately

## Monitoring

### Check Webhook Delivery

In Contentful:
1. Go to **Settings > Webhooks**
2. Click on your webhook
3. View **Activity log** tab
4. Check for:
   - ✅ Green checkmarks (successful)
   - ❌ Red X (failures - check your secret)

### Check Server Logs

Your API logs will show:

```
[INFO] Contentful webhook received {
  contentType: "toolConfiguration",
  action: "Entry.publish"
}
[INFO] Cache revalidation triggered {
  tag: "tool-configs",
  profile: "max",
  timestamp: "2025-11-12T10:00:00Z"
}
```

## Troubleshooting

### Webhook Returns 401 Unauthorized

**Problem**: Secret mismatch

**Solution**:
1. Verify `CONTENTFUL_REVALIDATE_SECRET` is set in your production environment
2. Ensure the secret in webhook URL matches exactly
3. Check for extra spaces or URL encoding issues

### Webhook Returns 500 Error

**Problem**: Server error processing webhook

**Solution**:
1. Check server logs for detailed error
2. Verify environment variables are set
3. Ensure API route is deployed

### Changes Not Appearing Immediately

**Expected Behavior**: Changes appear on **next page visit** after webhook fires.

**Why?** We use `revalidateTag('tool-configs', 'max')` which:
- Marks cached data as **stale**
- **Next visitor** triggers background refresh
- Fresh content served on **subsequent requests**

This is **stale-while-revalidate** - users never wait for fresh data!

**To force immediate update** (not recommended for production):
```typescript
// Change in route.ts
revalidateTag('tool-configs', { expire: 0 })  // Immediate expiration
```

### Webhook Not Firing

**Checklist**:
- [ ] Webhook URL is correct (production domain)
- [ ] Triggers are configured (Entry.publish, etc.)
- [ ] Content type filter matches (if set)
- [ ] Webhook is **Active** in Contentful
- [ ] Firewall/security allows Contentful IPs

## Advanced Configuration

### Multiple Cache Tags

If you want granular control:

```typescript
// toolConfigCache.ts
async function getToolConfigurationsFromCache() {
  'use cache'
  cacheLife('days')
  cacheTag('tool-configs', 'contentful-data')  // Multiple tags
  // ...
}

// Revalidate specific tags
revalidateTag('tool-configs', 'max')  // Just tool configs
revalidateTag('contentful-data', 'max')  // All Contentful data
```

### Different Revalidation Strategies

```typescript
// Stale-while-revalidate (recommended)
revalidateTag('tool-configs', 'max')

// Immediate expiration (for critical updates)
revalidateTag('tool-configs', { expire: 0 })

// Custom profile (if defined in next.config.ts)
revalidateTag('tool-configs', 'hours')
```

### Revalidate Multiple Routes

```typescript
// In webhook handler
revalidateTag('tool-configs', 'max')  // Revalidate tool configs
revalidatePath('/', 'layout')  // Revalidate entire app
```

## Security Best Practices

1. **Use strong secrets** - 32+ character random strings
2. **HTTPS only** - Never use HTTP for webhook endpoints
3. **Validate payload** - Check webhook source (coming from Contentful)
4. **Rate limiting** - Consider rate limiting webhook endpoint
5. **Logging** - Monitor webhook activity for suspicious patterns

## Cost Optimization

### Before Webhook Setup
- Cache duration: 1 minute
- Contentful API calls: ~1,440/day
- Server checks: Every minute
- Cost: HIGH 💰💰💰

### After Webhook Setup  
- Cache duration: 1 day
- Contentful API calls: ~1/day + on-demand
- Server checks: Once per day + on publish
- Cost: MINIMAL ✅

**Savings**: ~99% reduction in API calls and server load!

## References

- [Next.js cacheTag Documentation](https://nextjs.org/docs/app/api-reference/functions/cacheTag)
- [Next.js revalidateTag Documentation](https://nextjs.org/docs/app/api-reference/functions/revalidateTag)
- [Contentful Webhooks Guide](https://www.contentful.com/developers/docs/webhooks/)

## Support

If you encounter issues:
1. Check server logs for errors
2. Verify webhook delivery in Contentful
3. Test with manual GET request
4. Review environment variables
