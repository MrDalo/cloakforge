# Imprint Navigation Integration Design

## Overview
Add Imprint navigation links to header navigation, mobile navigation, and footer navigation, placing them alongside existing Terms of Service and Privacy Policy links for consistent legal document grouping.

## Background
The Imprint page already exists at `/src/app/imprint/page.tsx`. This design focuses on integrating navigation links across all navigation components to provide consistent access to legal information.

## Current State Analysis
- **Footer**: Legal links (Privacy Policy, Terms of Service) are in the "company" section of `footerData.ts`
- **Header**: Legal links are in the "Others" dropdown menu in `navigationData.ts`
- **Mobile**: Uses the same `othersNavigationItems` data as desktop header navigation
- **Route**: `/imprint` route already available and functional

## Design Requirements

### 1. Footer Navigation Integration
**File**: `src/components/common/GlobalFooter/footerData.ts`
- **Location**: Line 44 (between Terms of Service and Contact)
- **Implementation**: Add `{ name: 'Imprint', href: '/imprint' }` to company section
- **Rationale**: Maintains logical grouping of legal documents

### 2. Header/Mobile Navigation Integration
**File**: `src/components/common/GlobalHeader/navigationData.ts`
- **Location**: Line 119 (after Privacy Policy in othersNavigationItems)
- **Icon**: FileText (imported from lucide-react)
- **Implementation**: Add complete navigation item with title, href, description, and icon
- **Description**: "Legal information and company details"
- **Rationale**: FileText icon provides clear visual indication of document nature

### 3. Icon Import Update
**File**: `src/components/common/GlobalHeader/navigationData.ts`
- **Location**: Line 1 (extend existing lucide-react import)
- **Implementation**: Add `FileText` to import statement
- **Rationale**: Required for new Imprint navigation item

## Implementation Details

### Footer Data Structure
```typescript
company: [
  { name: 'About Us', href: '/about' },
  { name: 'Privacy Policy', href: '/privacy-policy' },
  { name: 'Terms of Service', href: '/terms-of-service' },
  { name: 'Imprint', href: '/imprint' },          // NEW
  { name: 'Contact', href: '/contact' },
  { name: 'Status', href: '/status' },
]
```

### Header Navigation Data Structure
```typescript
othersNavigationItems: NavigationGroup[] = [
  {
    title: 'Others',
    items: [
      {
        title: 'Blog',
        href: '/blog',
        description: 'Tutorials and insights about Solana development',
        icon: BookOpen,
      },
      {
        title: 'Terms of Service',
        href: '/terms-of-service',
        description: 'Read our terms of service',
        icon: Scale,
      },
      {
        title: 'Privacy Policy',
        href: '/privacy-policy',
        description: 'Read our privacy policy',
        icon: Shield,
      },
      {
        title: 'Imprint',                          // NEW
        href: '/imprint',
        description: 'Legal information and company details',
        icon: FileText,
      },
    ],
  },
]
```

### Import Statement Update
```typescript
import {
  Coins, Droplets, Flame, Shield, Lock, UserX, Send, Scale,
  ScanEye, BookOpen, RefreshCw, FileText              // NEW
} from 'lucide-react'
```

## Success Criteria
1. Imprint link appears in footer "company" section
2. Imprint link appears in header "Others" dropdown menu
3. Imprint link appears in mobile navigation "Others" section
4. All links navigate to `/imprint` route successfully
5. FileText icon displays correctly in header/mobile navigation
6. No existing navigation functionality is disrupted
7. Consistent styling with existing legal document links

## Technical Considerations
- **No breaking changes**: Only additive modifications to existing data structures
- **Consistent placement**: Legal documents grouped together in all navigation contexts
- **Icon choice**: FileText provides clear visual context while remaining distinct from existing icons
- **Mobile compatibility**: Automatic inheritance through shared data structure
- **Accessibility**: Follows existing navigation patterns for screen reader compatibility

## Files to Modify
1. `src/components/common/GlobalFooter/footerData.ts` - Add footer link
2. `src/components/common/GlobalHeader/navigationData.ts` - Add header/mobile link and icon import

## Risk Assessment
- **Low risk**: Only data additions to existing, well-tested navigation structures
- **No component logic changes**: Modifications limited to configuration data
- **Backward compatible**: No removal or modification of existing links