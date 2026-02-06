# Accessibility Skill

This skill provides WCAG 2.1 AA compliance patterns for CloakForge's Web3 interface.

## When to Use

Use this skill when building UI components, reviewing accessibility, or improving the user experience for assistive technology users — especially for Web3 wallet interactions.

## WCAG 2.1 AA Quick Reference

### Perceivable

#### Text Alternatives
- All `<img>` elements have `alt` text (empty `alt=""` for decorative)
- Icons used as controls have accessible labels
- Wallet address displays have full address in `aria-label`
- Network badges convey information in text, not just color

#### Color & Contrast
- **Normal text**: contrast ratio ≥ 4.5:1
- **Large text** (18pt/14pt bold): contrast ratio ≥ 3:1
- **UI components**: contrast ratio ≥ 3:1 against background
- Information never conveyed by color alone (transaction status, network indicator)
- CloakForge uses dark mode — verify contrast in both themes

#### Fee Displays
- Format as human-readable: `0.001 SOL` not `1000000 lamports`
- Include dollar equivalent when available
- Clear breakdown of service fee vs network fee

### Operable

#### Keyboard Access
- All interactive elements reachable via Tab
- Logical focus order (matches visual layout)
- Visible focus indicators (especially in dark mode)
- No keyboard traps
- Custom widgets follow ARIA keyboard patterns:

```
Component             Keys
────────────────      ──────────────────────
WalletConnectButton   Enter, Space
ToolActionButton      Enter, Space (disabled when wallet not connected)
TokenSelector         Arrow keys, Enter, Escape
FAQ Accordion         Enter/Space (toggle), Arrow keys (navigate)
Form fields           Tab (next), Shift+Tab (prev)
Dialog/Modal          Escape (close), Tab (trap focus inside)
Toast notifications   Auto-dismiss, Escape to close
```

#### Focus Management
- Skip navigation link for tool pages
- Focus moves to form when wallet connects
- Focus returns to trigger when closing wallet modal
- Focus trapping inside dialog modals (wallet connect, confirmation)
- Focus on error message when form validation fails

### Understandable

#### Forms
```html
<!-- ✅ Associated labels -->
<label for="tokenMint">Token Address</label>
<input id="tokenMint" type="text" required aria-describedby="tokenMint-hint" />
<span id="tokenMint-hint">Enter the SPL token mint address</span>

<!-- ✅ Error messages -->
<input id="amount" aria-invalid="true" aria-describedby="amount-error" />
<span id="amount-error" role="alert">Amount exceeds wallet balance</span>
```

- Every input has a visible `<label>` or `aria-label`
- Required fields indicated (not just with color)
- Error messages specific and adjacent to field
- Solana-specific errors translated to user-friendly language

#### Transaction States
```html
<!-- Pending wallet approval -->
<div role="status" aria-live="polite">
  Waiting for wallet approval...
</div>

<!-- Transaction submitted -->
<div role="status" aria-live="polite">
  Transaction submitted. Confirming...
</div>

<!-- Success -->
<div role="status" aria-live="polite">
  Transaction confirmed! <a href="explorer-link">View on Explorer</a>
</div>

<!-- Error -->
<div role="alert" aria-live="assertive">
  Transaction failed: Insufficient SOL balance
</div>
```

### Robust

#### Semantic HTML
```html
<!-- ✅ Use semantic elements -->
<nav> for tool navigation
<main> for tool content
<form> for tool forms
<button> for actions (not <div onClick>)
<a href> for explorer links (not <span onClick>)
<table> for token lists and fee breakdowns
<h1>-<h6> in hierarchy (no skipping levels)
```

#### ARIA Rules
1. **Don't use ARIA if native HTML works** — `<button>` over `<div role="button">`
2. **All ARIA roles need required properties** — `role="checkbox"` needs `aria-checked`
3. **Interactive ARIA needs keyboard support** — custom components need key handlers
4. **Wallet state communicated** — connected/disconnected via `aria-label`

#### Live Regions
```html
<!-- Balance updates -->
<div aria-live="polite" aria-atomic="true">Balance: 1.5 SOL</div>

<!-- Transaction progress -->
<div role="status" aria-live="polite">Confirming transaction...</div>

<!-- Error alerts -->
<div role="alert" aria-live="assertive">Wallet disconnected</div>
```

## Web3-Specific A11y Patterns

### Wallet Connection Button
```tsx
<button
  aria-label={connected ? `Wallet connected: ${truncatedAddress}` : 'Connect Wallet'}
  aria-expanded={menuOpen}
>
  {connected ? truncatedAddress : 'Connect Wallet'}
</button>
```

### Token Amount Display
```tsx
<span aria-label={`${amount} ${symbol}, approximately $${usdValue}`}>
  {formatAmount(amount)} {symbol}
</span>
```

### Transaction Confirmation Dialog
```tsx
<Dialog aria-labelledby="confirm-title" aria-describedby="confirm-desc">
  <h2 id="confirm-title">Confirm Transaction</h2>
  <p id="confirm-desc">
    You are about to burn {amount} {symbol}. This action is irreversible.
  </p>
  <Button>Confirm in Wallet</Button>
  <Button>Cancel</Button>
</Dialog>
```

## Testing Approaches

### Automated
- eslint-plugin-jsx-a11y (already available via eslint-config-next)
- Lighthouse accessibility audit
- axe-core for unit tests (if test infra added)

### Manual
- Tab through entire tool flow — all controls reachable?
- Screen reader test (VoiceOver on Mac): wallet connect → form fill → submit → confirm
- Zoom to 200% — tool forms still usable?
- Keyboard-only: complete a token burn without mouse

## Component Checklist

For every interactive component, verify:
- [ ] Has accessible name (label, aria-label, or aria-labelledby)
- [ ] Keyboard operable (correct key bindings)
- [ ] Focus visible (especially in dark mode)
- [ ] Meets contrast requirements
- [ ] State communicated (connected, pending, disabled)
- [ ] Works with screen reader
- [ ] Solana-specific: addresses have full value accessible, amounts human-readable
