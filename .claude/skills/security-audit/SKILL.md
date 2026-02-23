---
name: security-audit
description: 'OWASP checklist, Web3 security patterns, wallet safety, and privacy-first design for CloakForge. Use when auditing security, reviewing sensitive code, or implementing auth flows.'
---

# Security Audit

## Privacy-First Principles

- No analytics, tracking, or cookies
- Stateless API — no sessions, no user accounts
- Wallet address is the only identifier
- Users always see what they're signing
- All user data stays in the browser/wallet

## Web3 Security Checklist

### Transaction Safety

- [ ] Amounts validated before signing prompt
- [ ] Addresses validated with `isValidSolanaAddress`
- [ ] Fee estimates accurate and displayed
- [ ] No hidden instructions in transaction bundles
- [ ] Authority checks before revoking/freezing

### Wallet Security

- [ ] No private keys in code (client or server)
- [ ] Wallet adapter used correctly (connect, disconnect, sign)
- [ ] Connection states handled (connected, disconnected, error)
- [ ] No sensitive data in browser storage

### Server Security

- [ ] `'server-only'` directive on all server-side files
- [ ] `rpcPrivateEndpoint` exclusively (never public RPC)
- [ ] Zod validation on all inputs
- [ ] Error messages don't leak internals

## OWASP Mitigations

| Risk                    | CloakForge Mitigation                      |
| ----------------------- | ------------------------------------------ |
| Injection               | Zod validation on all inputs               |
| Broken Auth             | Wallet-based auth, no sessions             |
| Sensitive Data Exposure | No user data stored                        |
| Broken Access Control   | Authority checks in Solana programs        |
| Security Misconfig      | Private RPC, strict CSP                    |
| XSS                     | React auto-escaping, no dangerouslySetHTML |
| Known Vulnerabilities   | Regular dependency audits                  |
| Insufficient Logging    | `getLogger()` for all operations           |

## Audit Process

1. Review `git diff` for security-relevant changes
2. Run through checklists above
3. Verify with `npm run lint:nowarn` and `npx tsc --noEmit`
4. Report using severity levels (🔴 Critical, 🟡 Important, 🟢 Minor)
