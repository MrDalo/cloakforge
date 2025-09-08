# Origin Validation Configuration for SolCloak

## Environment Variables for Origin Validation

To properly secure your API routes with origin validation, set these environment variables:

### Development

```bash
# Your local development URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Production

```bash
# Your production domain(s) where SolCloak will be deployed
NEXT_PUBLIC_APP_URL=https://solcloak.com

# If using Vercel, this is automatically set
NEXT_PUBLIC_VERCEL_URL=your-app-xyz.vercel.app
```

### Custom Domains (if you have multiple)

You can also pass custom allowed origins directly in the API route:

```typescript
await validateSecurity(request, {
  allowedOrigins: ['https://solcloak.com', 'https://app.solcloak.com', 'https://beta.solcloak.com'],
  skipForLocalhost: true,
})
```

## How Origin Validation Works

### ✅ Allowed Requests

- Requests from your configured domains
- Direct API calls (no origin header - Postman, mobile apps, etc.)
- Localhost in development mode

### ❌ Blocked Requests

- Requests from unauthorized domains
- Cross-origin requests from malicious sites
- Subdomain attacks (unless explicitly allowed)

## Security Benefits

- **Prevents IPFS quota abuse** from external sites
- **Protects against CSRF attacks**
- **Maintains privacy** (no user data collected)
- **Zero false positives** for legitimate usage

## Testing

Test your origin validation:

```bash
# Should work (from your domain)
curl -X POST https://yourdomain.com/api/ipfs/upload-file \
  -H "Origin: https://yourdomain.com" \
  -F "file=@image.png"

# Should be blocked (from unauthorized origin)
curl -X POST https://yourdomain.com/api/ipfs/upload-file \
  -H "Origin: https://malicious-site.com" \
  -F "file=@image.png"
```
