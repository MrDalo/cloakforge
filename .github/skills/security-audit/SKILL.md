# Security Audit Skill

This skill provides security review patterns for CloakForge, combining OWASP web security with Solana/Web3-specific security concerns.

## When to Use

Use this skill when reviewing code for security vulnerabilities, designing wallet interactions, auditing Solana transaction logic, or reviewing authentication flows.

## Web3 Security Checklist

### 1. Private Key Safety
- [ ] Private keys NEVER leave the user's wallet
- [ ] Server NEVER has access to signing keys
- [ ] No private keys in code, logs, or environment variables
- [ ] Transaction signing happens client-side only

### 2. Transaction Safety
- [ ] Service memo placed FIRST in instruction list
- [ ] Fee transfer placed SECOND in instruction list
- [ ] Balance pre-checked before transaction building
- [ ] Transaction simulated before submission (`simulateTransaction`)
- [ ] Ownership validated for authority operations (mint/freeze revoke)
- [ ] No unintended authority transfers
- [ ] Authority operations are clearly marked as irreversible in UI

### 3. RPC Security
- [ ] Server-side uses private RPC only (`getServerConfig().rpcPrivateEndpoint`)
- [ ] Private RPC endpoint never exposed to client
- [ ] No RPC URL in client-side code or environment
- [ ] Rate limiting considerations for public RPC on client

### 4. Input Validation
- [ ] All Solana addresses validated with `isValidSolanaAddress`
- [ ] All amounts validated (positive, within balance, correct decimals)
- [ ] All API inputs validated with Zod schemas
- [ ] Token mint addresses verified against token registry
- [ ] Recipient addresses validated before multi-send

### 5. Privacy First
- [ ] Zero user data stored server-side
- [ ] No tracking, analytics, or cookies
- [ ] No wallet address logging (or if logged, anonymized)
- [ ] IPFS metadata uploads don't contain PII
- [ ] No server-side session storage

## OWASP Web Security Checklist

### Injection
- [ ] Zod schemas validate all external inputs
- [ ] No raw user input in SQL/NoSQL queries
- [ ] Content Security Policy headers configured
- [ ] XSS prevention in rendered content (Contentful rich text)

### Broken Access Control
- [ ] API routes validate request origin
- [ ] Server functions marked `'server-only'`
- [ ] No unauthorized access to admin endpoints
- [ ] Deny by default — explicitly grant access

### Security Misconfiguration
- [ ] `.env.local` is gitignored
- [ ] No default credentials in codebase
- [ ] Error messages don't leak implementation details
- [ ] Stack traces not exposed to users
- [ ] Dependencies up to date (`npm audit`)

### Cryptographic Failures
- [ ] HTTPS in production
- [ ] No sensitive data in URLs or client-side logs
- [ ] Pinata JWT kept server-side only
- [ ] Contentful tokens kept server-side only

## Solana-Specific Attack Vectors

### Transaction Manipulation
```
Risk: Attacker modifies transaction instructions before signing
Mitigation: 
- Build transactions server-side with validated inputs
- Client verifies transaction contents before signing
- Use simulation to verify expected behavior
```

### Front-Running
```
Risk: Attacker sees pending transaction and submits competing one
Mitigation:
- Use private RPC for transaction preparation
- Set appropriate priority fees
- Use skip-preflight judiciously
```

### Phishing
```
Risk: User connects wallet to malicious site
Mitigation:
- Clear wallet connection UI with domain verification
- Clear transaction descriptions before signing
- Display human-readable transaction details
```

### Token Account Attacks
```
Risk: Attacker creates spam token accounts
Mitigation:
- Validate token mint addresses
- Filter known spam tokens in UI
- Verify token metadata from trusted sources
```

## Input Validation Rules

```
ALL user input is untrusted. Validate:
- Solana addresses: isValidSolanaAddress() + PublicKey construction
- Amounts: positive number, within balance, correct decimals
- Token mints: valid address + exists on-chain
- Strings: max length, no injection characters
- Files: IPFS uploads validated for type and size
```

## Security Headers

```
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'; connect-src 'self' https://*.solana.com
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
```

## Environment Variable Security

| Variable | Side | Secret? |
|----------|------|---------|
| `NEXT_PUBLIC_SOLANA_NETWORK` | Client | No |
| `NEXT_PUBLIC_RPC_URL` | Client | No |
| `RPC_PRIVATE_ENDPOINT` | Server | **YES** |
| `CONTENTFUL_SPACE_ID` | Server | **YES** |
| `CONTENTFUL_ACCESS_TOKEN` | Server | **YES** |
| `PINATA_JWT` | Server | **YES** |
| `NEXT_PUBLIC_PINATA_GATEWAY_URL` | Client | No |
| `SERVICE_FEE_WALLET` | Server | Semi-public |

## Quick Security Review

Before merging any code:
1. No secrets in code or commits
2. All Solana addresses validated
3. Server uses private RPC only
4. No user data stored
5. Zod schemas on all API inputs
6. Error messages are generic (no stack traces)
7. Transaction instruction order correct (memo → fee → tool)
8. Authority operations confirmed as irreversible in UI
