# WCAG Patterns Reference

## WCAG 2.1 AA Criteria Quick Map

| Criterion | Level | What to Check |
| --------- | ----- | ------------- |
| 1.1.1 Non-text Content | A | All images, icons, charts have alt text |
| 1.3.1 Info and Relationships | A | Semantic HTML — lists, headings, tables, fieldsets |
| 1.3.3 Sensory Characteristics | A | Instructions don't rely solely on shape, color, or position |
| 1.4.1 Use of Color | A | Color not the only visual means of conveying info |
| 1.4.3 Contrast (Minimum) | AA | 4.5:1 normal text, 3:1 large text (≥ 18pt or ≥ 14pt bold) |
| 1.4.11 Non-text Contrast | AA | UI components and focus indicators ≥ 3:1 |
| 2.1.1 Keyboard | A | All functionality available via keyboard |
| 2.1.2 No Keyboard Trap | A | Focus can always be moved away (except intentional modal traps) |
| 2.4.3 Focus Order | A | Focus sequence preserves meaning and operability |
| 2.4.7 Focus Visible | AA | Keyboard focus indicator always visible |
| 3.1.1 Language of Page | A | `<html lang="en">` set |
| 3.3.1 Error Identification | A | Errors described in text, not color only |
| 3.3.2 Labels or Instructions | A | All form inputs labeled |
| 4.1.2 Name, Role, Value | A | All UI components have accessible name and role |
| 4.1.3 Status Messages | AA | Status messages use `role="status"` or `aria-live` |

## ARIA Roles for CloakForge Patterns

| Pattern | Role / Attribute | Notes |
| ------- | ---------------- | ----- |
| Transaction progress | `role="status"` + `aria-live="polite"` | Step updates |
| Critical error | `role="alert"` + `aria-live="assertive"` | Wallet errors, TX failures |
| Loading button | `aria-busy="true"` + `disabled` | Prevent double-submit |
| Invalid field | `aria-invalid="true"` | Paired with `aria-describedby` pointing to error |
| Tooltip trigger | `aria-describedby` pointing to tooltip id | InfoTooltip pattern |
| Icon-only button | `aria-label` with descriptive text | Never rely on icon alone |
| Modal dialog | `role="dialog"` + `aria-modal="true"` + `aria-labelledby` | shadcn Dialog handles this |
| Tab panel | `role="tablist"`, `role="tab"`, `role="tabpanel"` | shadcn Tabs handles this |

## Keyboard Interaction Patterns

### Modal / Dialog
- `Tab` / `Shift+Tab` — cycle focus within modal only
- `Escape` — close modal, return focus to trigger
- shadcn `Dialog` implements this automatically

### Dropdown / Select
- `Enter` / `Space` — open
- `Arrow keys` — navigate options
- `Escape` — close without selecting
- `Home` / `End` — first/last option

### Form Submission
- `Enter` in any field — submit (if single-action form)
- Disable submit button with `aria-busy` during submission
- Move focus to success message or first error after submit

### Tabs
- `Arrow keys` (left/right) — navigate tabs
- `Tab` — move into tab panel content
- shadcn `Tabs` implements this automatically

## Screen Reader Announcements — CloakForge Specifics

```tsx
// Pattern: Hidden live region for status announcements
// Place once in layout, update content to trigger announcement
const [announcement, setAnnouncement] = useState('')

<div aria-live="polite" aria-atomic="true" className="sr-only">
  {announcement}
</div>

// Trigger announcements:
setAnnouncement('Transaction sent. Waiting for confirmation.')
setAnnouncement('Transaction confirmed. View on Solana Explorer.')
setAnnouncement('Error: Insufficient SOL balance for fees.')
```

## CSS Utilities

```css
/* Visually hidden but accessible to screen readers */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
/* Tailwind equivalent: className="sr-only" */

/* Focus ring — never remove, enhance instead */
.focus-visible:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
```

## Common a11y Lint Errors (eslint-plugin-jsx-a11y)

| Error | Fix |
| ----- | --- |
| `img-redundant-alt` | Remove "image of" or "photo of" from alt text |
| `alt-text` | Add meaningful alt or `alt=""` for decorative |
| `label` | Associate `<label htmlFor>` or add `aria-label` |
| `interactive-supports-focus` | Use `<button>` not `<div onClick>` |
| `click-events-have-key-events` | Add `onKeyDown` handler to `<div onClick>` |
| `anchor-is-valid` | Use `<button>` for actions, `<a href>` for navigation |
| `no-autofocus` | Only suppress if intentional (e.g., modal first field) |
