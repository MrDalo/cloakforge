# Schema Extension Template

## Standard Files

```
src/lib/schemas/{schemaFile}.ts                  # Extend existing schema
src/components/pages/{Tool}Page/{Tool}Form/      # Update form fields
```

## Agent Task Order

1. **Backend Agent** - Extend schemas with new fields
2. **Frontend Agent** - Add form fields and validation
3. **Tester Agent** - Schema and form validation tests
4. **Reviewer Agent** - Type safety and consistency audit

## Standard Patterns

- Zod schema extensions maintain backward compatibility
- Form fields use `CustomFormField` component
- Consistent validation error messages
- TypeScript types auto-generated from schemas
