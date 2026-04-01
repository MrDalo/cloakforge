# UI Component Template

## Standard Files

```
src/components/pages/{Component}Page/index.tsx   # Page component
src/components/pages/{Component}Page/{Component}Form/  # Form
src/hooks/solana/use{Component}.ts               # Hook integration
```

## Agent Task Order

1. **Frontend Agent** - Create page and form components
2. **Frontend Agent** - Create/update hook for API integration
3. **Tester Agent** - Component and hook tests
4. **Reviewer Agent** - UI/UX and accessibility audit

## Standard Patterns

- React Hook Form + Zod validation
- Uses existing common components from `src/components/common/`
- Mobile-first responsive design
- Dark mode support via `dark:` variants
