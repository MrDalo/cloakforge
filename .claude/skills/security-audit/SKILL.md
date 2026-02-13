---
name: security-audit
description: 'OWASP checklist, Web3 security patterns, wallet safety, and privacy-first design for CloakForge. Use when auditing security, reviewing sensitive code, or implementing auth flows.'
---

# Security Audit Skill

## Privacy-First Principles

- **No data collection**: No analytics, tracking, or cookies
- **Stateless API**: No session storage, no user accounts
- **Wallet-based identity**: Wallet address is the only identifier
- **Transaction transparency**: Users always see what they're signing
- **No server-side user data**: All user data stays in the browser/wallet

## Web3 Security Checklist

### Transaction Safety

- [ ] Transaction amounts validated before signing prompt
- [ ] Destination addresses validated with `isValidSolanaAddress`
- [ ] Transaction simulation shown to user before signing
- [ ] Fee estimates accurate and displayed clearly
- [ ] No hidden instructions in transaction bundles
- [ ] Proper authority checks before revoking/freezing

### Wallet Security

- [ ] No private keys in code (client or server)
- [ ] Wallet adapter used correctly (connect, disconnect, sign)
- [ ] Wallet connection state handled (connected, disconnected, error)
- [ ] Auto-disconnect on page navigation considered
- [ ] No sensitive data in browser storage (localStorage, sessionStorage)

### Server Security

- [ ] `'server-only'` directive on all server-side files
- [ ] `rpcPrivateEndpoint` used exclusively (never public RPC)
- [ ] Input validated with Zod schemas (never trust client input)
- [ ] Error messages don't leak internal details
- [ ] No CORS misconfigurations

## OWASP Top 10 — Web3 Context

| #   | Risk                      | CloakForge Mitigation                           |
| --- | ------------------------- | ----------------------------------------------- |
| 1   | Injection                 | Zod validation on all inputs                    |
| 2   | Broken Auth               | Wallet-based auth, no sessions                  |
| 3   | Sensitive Data Exposure   | No user data stored                             |
| 4   | XXE                       | No XML processing                               |
| 5   | Broken Access Control     | Authority checks in Solana programs             |
| 6   | Security Misconfiguration | Private RPC, strict CSP                         |
| 7   | XSS                       | React auto-escaping, no dangerouslySetInnerHTML |
| 8   | Insecure Deserialization  | Zod schema validation                           |
| 9   | Known Vulnerabilities     | Regular dependency audits                       |
| 10  | Insufficient Logging      | `getLogger()` for all operations                |

## Audit Process

1. **Scan**: Review `git diff` for security-relevant changes
2. **Check**: Run through the checklist above
3. **Test**: Verify with `npm run lint:nowarn` and type checking
4. **Report**: Use severity levels (🔴 Critical, 🟡 Important, 🟢 Minor)
