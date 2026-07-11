---
name: security-audit
description: "OWASP checklist, Web3 security patterns, wallet safety, and privacy-first design for CloakForge. Use when auditing security, reviewing sensitive code, or implementing auth flows."
---

# Security Audit Skill

## Privacy-First Principles

- **No user data collection** — no analytics, no tracking, no cookies
- **No server-side storage of user data** — stateless API
- **Wallet-based identity only** — no email, no accounts
- **Transaction transparency** — show exactly what will be signed

## Web3 Security Checklist

### Transaction Safety
- [ ] Transaction preview shown before signing
- [ ] Fee breakdown displayed
- [ ] Amounts validated against user input
- [ ] Destination addresses validated
- [ ] Authority changes are explicit and warned

### Wallet Security
- [ ] Never request or store private keys
- [ ] Never simulate wallet signing
- [ ] Wallet connection via standard adapter
- [ ] Disconnect handling (cleanup state)

### Server Security
- [ ] `'server-only'` directive on all server utilities
- [ ] `rpcPrivateEndpoint` never exposed to client
- [ ] Input validation with Zod on all API routes
- [ ] Rate limiting on sensitive endpoints
- [ ] No secrets in error messages or logs

## OWASP Top 10 (Web3 Context)

1. **Injection**: Zod validation on all inputs
2. **Broken Auth**: Wallet signature verification
3. **Sensitive Data**: No server-side user data storage
4. **XXE**: JSON-only API (no XML)
5. **Broken Access Control**: Wallet-based ownership verification
6. **Misconfiguration**: Environment validation at startup
7. **XSS**: React auto-escaping, no `dangerouslySetInnerHTML`
8. **Deserialization**: Typed Zod parsing, no raw JSON.parse
9. **Known Vulnerabilities**: Regular `npm audit`
10. **Logging**: Structured logging via `getLogger()`, no PII

## Audit Process

1. Review all server-side code paths
2. Verify transaction building logic
3. Check for exposed secrets or endpoints
4. Validate input handling on all API routes
5. Review error messages for information leakage
