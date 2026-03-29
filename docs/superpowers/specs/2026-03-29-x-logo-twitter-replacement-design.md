# X Logo Twitter Icon Replacement Design

## Overview

Replace all Twitter icons from Lucide-react with the custom X logo image (`/public/x-logo-black.png`) across the CloakForge application while maintaining consistent sizing and visual hierarchy.

## Context

**Current State**: 3 locations use Twitter icon from Lucide-react:
- Footer social links (`GlobalFooter/footerData.ts`)
- Token creator form labels (`OptionalLinksForm.tsx`)
- Token auditor buttons (`TokenDetails.tsx`)

**Goal**: Unified X branding using custom logo image with size-appropriate rendering.

## Architecture

### XLogo Component

**Location**: `src/components/common/XLogo/index.tsx`

**Interface**:
```typescript
interface XLogoProps {
  size?: 'sm' | 'md' | 'lg' | number
  className?: string
  alt?: string
}
```

**Size Mapping**:
- `sm` → 16px (`h-4 w-4`) - form labels, buttons
- `md` → 20px (`h-5 w-5`) - footer social links
- `lg` → 24px (`h-6 w-6`) - future use
- `number` → custom pixel dimensions

**Implementation**: Next.js Image component with proper optimization and responsive sizing.

## Migration Plan

### Phase 1: Component Creation
1. Create reusable XLogo component
2. Unit tests for size variants
3. Accessibility compliance

### Phase 2: Footer Migration
1. Update `footerData.ts` to reference XLogo component
2. Modify `FooterBrand.tsx` to handle component-based social icons
3. Test footer rendering with `md` size

### Phase 3: Form Migration
1. Replace Twitter imports in `OptionalLinksForm.tsx`
2. Update form field labels with `sm` size XLogo
3. Ensure form field visual consistency

### Phase 4: Token Details Migration
1. Replace Twitter imports in `TokenDetails.tsx`
2. Update button icons with `sm` size XLogo
3. Test button interaction states

### Phase 5: Cleanup
1. Remove unused Twitter imports from all files
2. Verify no remaining Lucide Twitter references
3. Visual regression testing

## Error Handling

- **Image Load Failure**: Fallback to alt text display
- **Invalid Size Props**: Console warning, fallback to `md` size
- **Missing Image**: Graceful degradation with placeholder

## Testing Strategy

**Unit Tests**:
- Component renders with all size variants
- Props validation and fallbacks
- Accessibility attributes

**Integration Tests**:
- Footer social links functionality
- Form field label rendering
- Token detail button interactions

**Visual Tests**:
- Consistent sizing across contexts
- Brand alignment with design system
- Responsive behavior validation

## Success Criteria

1. All Twitter icons replaced with X logo image
2. Consistent visual hierarchy maintained
3. No regression in functionality
4. Zero accessibility violations
5. Clean removal of unused imports
6. Component reusable for future X logo needs

## Implementation Notes

- Maintain existing size relationships (footer larger than forms)
- Preserve hover states and interaction behaviors
- Follow existing component patterns in `/components/common/`
- Use TypeScript strict mode compliance
- Include proper Next.js Image optimization