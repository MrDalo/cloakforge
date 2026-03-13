---
name: security-audit
description: OWASP checklist, Web3 security patterns, wallet safety, and privacy-first design for CloakForge. Use when auditing security vulnerabilities, reviewing sensitive code, implementing authentication flows, analyzing transaction security, conducting security assessments for Web3 features, or investigating potential security risks.
---

# Security Audit

Comprehensive security assessment framework for CloakForge's Web3 application.

## Security Audit Process

### 1. Pre-Audit Setup
```bash
# Run security-focused linting
npm run lint:security

# Check for known vulnerabilities
npm audit --audit-level moderate

# Review recent git changes
git diff --name-only HEAD~5
```

### 2. Systematic Security Review

Follow the audit checklist systematically, documenting findings with severity levels.

### 3. Remediation & Verification

Fix critical issues immediately, plan important issues, track minor issues.

## Privacy-First Principles

### Core Privacy Rules
- ✅ No analytics, tracking, or cookies
- ✅ Stateless API — no sessions, no user accounts
- ✅ Wallet address is the only identifier
- ✅ Users always see what they're signing
- ✅ All user data stays in browser/wallet

### Privacy Verification
```typescript
// Verify no sensitive data in logs
logger.info('Transaction prepared', {
  tool: 'burn-tokens',
  // DO NOT log: wallet addresses, amounts, private data
})

// Verify no user data persistence
// Server-side files should only process, never store
```

## Web3 Security Checklist

### Transaction Safety
- [ ] **Amounts validated** before signing prompt shows
- [ ] **Addresses validated** with `isValidSolanaAddress`
- [ ] **Fee estimates accurate** and clearly displayed to user
- [ ] **No hidden instructions** in transaction bundles
- [ ] **Authority checks** before revoking/freezing operations
- [ ] **Transaction preview** shows all operations clearly

### Wallet Security
- [ ] **No private keys** in code (client or server)
- [ ] **Wallet adapter** used correctly (connect, disconnect, sign)
- [ ] **Connection states** handled (connected, disconnected, error)
- [ ] **No sensitive data** in localStorage or sessionStorage
- [ ] **Graceful fallbacks** when wallet not installed

### Server Security
- [ ] **'server-only' directive** on all server-side files
- [ ] **rpcPrivateEndpoint** used exclusively (never public RPC)
- [ ] **Zod validation** on all API inputs
- [ ] **Error messages** don't leak internal information
- [ ] **Rate limiting** on API endpoints
- [ ] **CORS properly configured** for production

## OWASP Top 10 Mitigations

| OWASP Risk | CloakForge Mitigation | Verification |
|------------|----------------------|--------------|
| **Injection** | Zod validation on all inputs | Check schema coverage |
| **Broken Auth** | Wallet-based auth, no sessions | Verify no session storage |
| **Sensitive Data** | No user data stored server-side | Audit data flows |
| **XXE** | No XML processing | N/A for current stack |
| **Access Control** | Authority checks in Solana programs | Review transaction logic |
| **Security Misconfig** | Private RPC, strict CSP | Check config files |
| **XSS** | React auto-escaping | Avoid dangerouslySetHTML |
| **Deserialization** | No unsafe deserialization | Review data parsing |
| **Components** | Regular dependency audits | npm audit schedule |
| **Logging** | Structured logging via getLogger() | Review log contents |

## Solana-Specific Security

### Transaction Security
```typescript
// Verify transaction contents before signing
const instructions = transaction.instructions
expect(instructions).toHaveLength(expectedCount)
expect(instructions[0].programId).toEqual(expectedProgram)
```

### Authority Management
```typescript
// Always verify authority before operations
if (tokenAccount.authority !== walletPublicKey) {
  throw new SolanaError('Insufficient authority')
}
```

## Security Testing

### Automated Security Checks
```bash
# Dependency vulnerability scan
npm audit

# Type safety verification
npx tsc --noEmit --strict

# Security-focused linting
npm run lint -- --ext .ts,.tsx --rule security/*
```

### Manual Security Testing
- **Input validation**: Test edge cases, malformed inputs
- **Error handling**: Verify no sensitive data in error messages
- **Access control**: Test unauthorized operations
- **Transaction review**: Manually verify transaction contents

## Incident Response

### Security Issue Classification

| Level | Response Time | Action |
|-------|---------------|---------|
| 🔴 **Critical** | Immediate | Stop deployment, fix immediately |
| 🟡 **Important** | < 24 hours | Plan fix, communicate risk |
| 🟢 **Minor** | < 1 week | Track in backlog |

## Security Audit Checklist

- [ ] Privacy principles verified (no tracking, no data storage)
- [ ] Web3 security checklist completed
- [ ] OWASP mitigations in place
- [ ] Solana-specific security verified
- [ ] Dependencies scanned for vulnerabilities
- [ ] Error handling doesn't leak sensitive data
- [ ] All findings documented with severity levels
- [ ] Remediation plan created for important+ issues
