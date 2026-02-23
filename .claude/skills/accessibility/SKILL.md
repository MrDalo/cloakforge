---
name: accessibility
description: 'WCAG 2.1 AA compliance, semantic HTML, keyboard navigation, screen reader support, and Web3 UX patterns for CloakForge. Use when building UI, auditing accessibility, or fixing a11y issues.'
---

# Web3 Accessibility

Standard WCAG 2.1 AA applies (contrast ≥ 4.5:1, keyboard nav, ARIA roles). Below are CloakForge-specific patterns.

## Wallet Interactions

- `aria-live="polite"` for wallet connection status changes
- Keyboard-accessible wallet connect/disconnect buttons
- Clear focus management during wallet prompts
- Screen reader announcements for transaction states

## Transaction UX

- Progress indicators with `aria-busy` and `aria-live`
- Step-by-step transaction flow with clear state communication
- Error recovery guidance (not just "transaction failed")
- `ExplorerLink` component provides accessible Solana explorer links

## Fee Display

- `FeeBreakdown` uses semantic table or description list
- SOL amounts with proper formatting and units
- Estimated vs actual fees clearly distinguished

## Wallet-Native UX

- Connection state always visible
- Network (mainnet/devnet) clearly displayed
- Disconnect option easily accessible
- Handle wallet not installed gracefully

## Error Recovery

- Never show raw error codes to users
- Provide actionable recovery steps
- Preserve form state on errors
- `InfoTooltip` for technical terminology

## Testing

- Axe DevTools extension + Lighthouse accessibility audit
- Keyboard-only testing (Tab through all interactive elements)
- VoiceOver (macOS) or NVDA (Windows)
- `npm run lint:nowarn` catches a11y issues via eslint-plugin-jsx-a11y
