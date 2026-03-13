---
name: accessibility
description: 'WCAG 2.1 AA compliance, semantic HTML, keyboard navigation, ARIA patterns, screen reader support, focus management, color contrast, and Web3/wallet UX accessibility for CloakForge. Use when: building any UI component or page, auditing accessibility of existing UI, fixing a11y lint errors or axe findings, reviewing transaction flows for screen reader support, improving keyboard navigation, handling wallet connection states accessibly, or ensuring form inputs meet accessibility standards.'
---

# Web3 Accessibility

WCAG 2.1 AA applies universally. Below are CloakForge-specific patterns layered on top.

## Quick Checklist

Run this before marking any UI work complete:

- [ ] Contrast ratio ≥ 4.5:1 for text, ≥ 3:1 for large text and UI components
- [ ] All interactive elements reachable and operable by keyboard (Tab, Enter, Space, Escape, arrow keys)
- [ ] Focus indicator visible at all times — never `outline: none` without a replacement
- [ ] No keyboard trap (except intentional modal traps with Escape to exit)
- [ ] All images have meaningful `alt` text (empty `alt=""` for decorative)
- [ ] Form fields have associated `<label>` or `aria-label`
- [ ] Error messages are programmatically associated with their field (`aria-describedby`)
- [ ] Dynamic content updates announced via `aria-live`
- [ ] Page has a logical heading hierarchy (`h1` → `h2` → `h3`)
- [ ] `npm run lint:nowarn` passes (eslint-plugin-jsx-a11y)

## Wallet Interactions

```tsx
// Wallet connection status — always announce state changes
<div aria-live="polite" aria-atomic="true" className="sr-only">
  {isConnected ? `Wallet connected: ${shortAddress}` : 'Wallet disconnected'}
</div>

// Connect button — clear label, not just an icon
<WalletConnectionButton aria-label="Connect Solana wallet" />

// Network badge — visible and readable
<span aria-label={`Network: ${network}`}>{network}</span>
```

Rules:
- `aria-live="polite"` for connection status, `"assertive"` only for critical errors
- Focus must return to the trigger element after wallet modal closes
- Handle "wallet not installed" with actionable guidance, not just a raw error

## Transaction State UX

```tsx
// Step progress — communicate current step to screen readers
<div role="status" aria-live="polite">
  Step {currentStep} of {totalSteps}: {stepLabel}
</div>

// Pending state — busy indicator
<button aria-busy={isPending} disabled={isPending}>
  {isPending ? 'Sending...' : 'Send Transaction'}
</button>

// Success/error — announce result
<div role="alert" aria-live="assertive">
  {error ? `Transaction failed: ${userFriendlyMessage}` : 'Transaction confirmed'}
</div>
```

Use `ExplorerLink` component for all Solana explorer links — it handles accessible link text automatically.

## Forms

- Use `CustomFormField` — it wires `aria-describedby` to error messages automatically
- Never rely on placeholder text as a label substitute
- Group related fields with `<fieldset>` + `<legend>` (e.g., recipient address + amount pairs)
- Show inline errors below the field, not only in a toast

```tsx
// Error association pattern (CustomFormField handles this)
<input
  id="recipient"
  aria-describedby="recipient-error"
  aria-invalid={!!errors.recipient}
/>
<p id="recipient-error" role="alert">{errors.recipient?.message}</p>
```

## Fee Display

- `FeeBreakdown` uses `<dl>` (description list) for semantic fee pairs
- SOL amounts: include unit in accessible label — `aria-label="0.005 SOL"`
- Distinguish estimated vs actual fees visually AND textually (not color alone)
- `InfoTooltip` for technical terms — ensure it is keyboard-focusable and dismissable with Escape

## Focus Management

```tsx
// After async operation — move focus to result
const resultRef = useRef<HTMLDivElement>(null)
useEffect(() => {
  if (txSignature) resultRef.current?.focus()
}, [txSignature])

// Modal open — trap focus inside; on close — return to trigger
// shadcn/ui Dialog handles this automatically
```

- Use `autoFocus` on the first interactive element in dialogs
- Restore focus to the triggering element when overlays close
- Skip links (`<a href="#main-content">Skip to main content</a>`) for long nav

## Error Recovery

- Never show raw Solana error codes — use `handleError()` from `@/lib/errors`
- Provide next steps: "Insufficient SOL balance. Add at least 0.01 SOL to continue."
- Preserve form state on errors — do not reset the form
- Use `InfoTooltip` for terms like "rent exemption" or "blockhash"

## Color and Visual

- Never convey information by color alone — pair with icon, text, or pattern
- Dark mode: test contrast in both modes (`dark:` variant)
- Loading states: spinner + text label, not spinner alone
- `LoadingSpinner` component includes `aria-label` prop — always set it

## Testing

```bash
# Lint catches common a11y issues
npm run lint:nowarn

# Manual keyboard test sequence
# Tab through every interactive element
# Activate buttons with Enter and Space
# Open/close modals with Escape
# Navigate forms with arrow keys where applicable
```

Browser tools:
- **axe DevTools** Chrome extension — run on every page before shipping
- **Lighthouse** accessibility audit (target score ≥ 90)
- **VoiceOver** (macOS: Cmd+F5) — test wallet connect flow and transaction steps
- **NVDA** (Windows) — cross-platform screen reader verification

For detailed WCAG criterion mapping and ARIA role reference, see [references/wcag-patterns.md](references/wcag-patterns.md).
