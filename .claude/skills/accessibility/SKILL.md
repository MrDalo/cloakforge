---
name: accessibility
description: 'WCAG 2.1 AA compliance, semantic HTML, keyboard navigation, screen reader support, and Web3 UX patterns for CloakForge. Use when building UI, auditing accessibility, or fixing a11y issues.'
---

# Accessibility Skill

## WCAG 2.1 AA Compliance

### Perceivable

- [ ] Text alternatives for non-text content (`alt`, `aria-label`)
- [ ] Captions/transcripts for multimedia
- [ ] Color contrast ratio ≥ 4.5:1 (normal text), ≥ 3:1 (large text)
- [ ] Content readable at 200% zoom
- [ ] No color-only indicators (use icons + text + color)

### Operable

- [ ] All functionality via keyboard (Tab, Enter, Escape, Arrow keys)
- [ ] Visible focus indicators on all interactive elements
- [ ] Skip navigation link for main content
- [ ] No keyboard traps
- [ ] Sufficient time for interactions (no auto-timeouts < 20s)

### Understandable

- [ ] Consistent navigation across pages
- [ ] Form labels associated with inputs
- [ ] Error messages descriptive and specific
- [ ] Instructions provided for complex forms
- [ ] Language attribute on `<html>`

### Robust

- [ ] Valid HTML structure
- [ ] ARIA roles used correctly (landmarks, live regions)
- [ ] Custom components meet ARIA patterns
- [ ] Works across browsers and assistive technologies

## Web3 Accessibility

### Wallet Interactions

- `aria-live="polite"` for wallet connection status changes
- Keyboard-accessible wallet connect/disconnect buttons
- Clear focus management during wallet prompts
- Screen reader announcements for transaction states

### Transaction UX

- Progress indicators with `aria-busy` and `aria-live`
- Clear step-by-step transaction flow
- Error recovery guidance (not just "transaction failed")
- `ExplorerLink` component provides accessible Solana explorer links

### Fee Display

- `FeeBreakdown` component uses semantic table or description list
- SOL amounts with proper formatting and units
- Estimated vs actual fees clearly distinguished

## Web3 UX Principles

### Privacy-First UX

- No data collection notices needed (nothing collected)
- Transparent about what wallet data is used
- Clear indication of read-only vs write operations

### Wallet-Native UX

- Connection state always visible
- Network (mainnet/devnet) clearly displayed
- Disconnect option easily accessible
- Handle wallet not installed gracefully

### Error Recovery

- Never show raw error codes to users
- Provide actionable recovery steps
- Link to TROUBLESHOOTING.md patterns
- Preserve form state on errors

### Progressive Disclosure

- Show basic options first, advanced behind toggles
- `InfoTooltip` for technical terminology
- Collapsible sections for detailed information

## Testing Tools

- Axe DevTools browser extension
- Keyboard-only testing (Tab through all interactive elements)
- VoiceOver (macOS) or NVDA (Windows)
- Lighthouse accessibility audit
- `npm run lint:nowarn` catches some a11y issues via eslint-plugin-jsx-a11y
