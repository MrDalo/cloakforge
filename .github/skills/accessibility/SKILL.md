---
name: accessibility
description: "WCAG 2.1 AA compliance, semantic HTML, keyboard navigation, and screen reader support for CloakForge. Use when building UI, auditing accessibility, or fixing a11y issues."
---

# Accessibility Skill

## WCAG 2.1 AA Requirements

### Perceivable
- [ ] Text alternatives for images (`alt` attributes)
- [ ] Color contrast 4.5:1 for normal text, 3:1 for large
- [ ] Content doesn't rely solely on color
- [ ] Responsive up to 400% zoom

### Operable
- [ ] All functionality via keyboard
- [ ] No keyboard traps
- [ ] Focus indicators visible
- [ ] Skip navigation links
- [ ] Sufficient time for interactions (no auto-timeouts during TX)

### Understandable
- [ ] Language attribute on `<html>`
- [ ] Consistent navigation
- [ ] Error messages identify the field and suggest fix
- [ ] Labels on all form inputs

### Robust
- [ ] Valid HTML
- [ ] ARIA used correctly (not overused)
- [ ] Compatible with screen readers (VoiceOver, NVDA)

## Web3 Accessibility

### Wallet Interactions
- Announce wallet connection status to screen readers (`aria-live`)
- Keyboard-accessible wallet connect button
- Clear focus management after wallet modal closes

### Transaction Flows
- Progress indicators during transaction (signing, sending, confirming)
- Success/error announcements via `aria-live="polite"`
- Explorer links with descriptive text (not "click here")

### Common Components
- `InfoTooltip`: keyboard-accessible, screen reader text
- `ExplorerLink`: descriptive link text with address preview
- `FeeBreakdown`: table with proper headers
- `LoadingSpinner`: `aria-label="Loading"` and `role="status"`

## Testing Tools

- Axe DevTools (browser extension)
- VoiceOver (macOS)
- Keyboard-only navigation test
- Lighthouse accessibility audit
