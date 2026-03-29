# X Logo Twitter Icon Replacement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all Twitter icons from Lucide-react with custom X logo image component across the CloakForge application.

**Architecture:** Create reusable XLogo component using Next.js Image optimization, replace Twitter icons in footer social links, form field labels, and token detail buttons while maintaining existing size hierarchy.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS, Vitest

---

## File Structure

**New Files:**
- `src/components/common/XLogo/index.tsx` - Main XLogo component with size variants
- `src/components/common/XLogo/XLogo.test.tsx` - Unit tests for component

**Modified Files:**
- `src/components/common/GlobalFooter/footerData.ts` - Replace Twitter import with XLogo component reference
- `src/components/common/GlobalFooter/FooterBrand.tsx` - Handle component-based social icons
- `src/components/pages/TokenCreatorPage/TokenCreationForm/OptionalLinksForm.tsx` - Replace form field Twitter icon
- `src/components/pages/TokenAuditorPage/TokenDashboard/TokenDetails.tsx` - Replace button Twitter icon

## Implementation Tasks

### Task 1: Create XLogo Component with Tests

**Files:**
- Create: `src/components/common/XLogo/index.tsx`
- Create: `src/components/common/XLogo/XLogo.test.tsx`

- [ ] **Step 1: Write failing tests for XLogo component**

```typescript
// src/components/common/XLogo/XLogo.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { XLogo } from './index'

describe('XLogo', () => {
  it('should render with default size', () => {
    render(<XLogo />)
    const image = screen.getByRole('img', { name: /x/i })
    expect(image).toBeInTheDocument()
  })

  it('should render with small size', () => {
    render(<XLogo size="sm" />)
    const image = screen.getByRole('img', { name: /x/i })
    expect(image).toHaveClass('h-4', 'w-4')
  })

  it('should render with medium size', () => {
    render(<XLogo size="md" />)
    const image = screen.getByRole('img', { name: /x/i })
    expect(image).toHaveClass('h-5', 'w-5')
  })

  it('should render with large size', () => {
    render(<XLogo size="lg" />)
    const image = screen.getByRole('img', { name: /x/i })
    expect(image).toHaveClass('h-6', 'w-6')
  })

  it('should render with custom number size', () => {
    render(<XLogo size={32} />)
    const image = screen.getByRole('img', { name: /x/i })
    expect(image).toHaveStyle({ width: '32px', height: '32px' })
  })

  it('should apply custom className', () => {
    render(<XLogo className="custom-class" />)
    const image = screen.getByRole('img', { name: /x/i })
    expect(image).toHaveClass('custom-class')
  })

  it('should use custom alt text', () => {
    render(<XLogo alt="Custom X Logo" />)
    const image = screen.getByRole('img', { name: /custom x logo/i })
    expect(image).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- src/components/common/XLogo/XLogo.test.tsx`
Expected: FAIL with "Cannot resolve module './index'"

- [ ] **Step 3: Create XLogo component implementation**

```typescript
// src/components/common/XLogo/index.tsx
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface XLogoProps {
  size?: 'sm' | 'md' | 'lg' | number
  className?: string
  alt?: string
}

const sizeMap = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
} as const

export const XLogo = ({ size = 'md', className, alt = 'X' }: XLogoProps): React.ReactNode => {
  if (typeof size === 'number') {
    return (
      <Image
        src="/x-logo-black.png"
        alt={alt}
        width={size}
        height={size}
        className={cn('object-contain', className)}
        style={{ width: `${size}px`, height: `${size}px` }}
      />
    )
  }

  return (
    <div className={cn(sizeMap[size], 'relative', className)}>
      <Image
        src="/x-logo-black.png"
        alt={alt}
        fill
        className="object-contain"
        sizes="24px"
      />
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/components/common/XLogo/XLogo.test.tsx`
Expected: All tests PASS

- [ ] **Step 5: Type check and lint**

Run: `npx tsc --noEmit && npm run lint:nowarn`
Expected: No errors or warnings

- [ ] **Step 6: Commit XLogo component**

```bash
git add src/components/common/XLogo/
git commit -m "feat: add reusable XLogo component with size variants

- Support sm (16px), md (20px), lg (24px) preset sizes
- Support custom pixel dimensions
- Optimized Next.js Image component
- Full test coverage for all size variants

Co-Authored-By: Claude Sonnet 4 <noreply@anthropic.com>"
```

### Task 2: Update Footer to Use XLogo Component

**Files:**
- Modify: `src/components/common/GlobalFooter/footerData.ts`
- Modify: `src/components/common/GlobalFooter/FooterBrand.tsx`

- [ ] **Step 1: Update footerData.ts to reference XLogo component**

```typescript
// src/components/common/GlobalFooter/footerData.ts
import { MessageCircle, type LucideIcon } from 'lucide-react'
import { type ReactNode } from 'react'
import { XLogo } from '@/components/common/XLogo'

export interface FooterLink {
  name: string
  href: string
}

export interface FooterSection {
  product: FooterLink[]
  resources: FooterLink[]
  company: FooterLink[]
  users: FooterLink[]
}

export interface SocialLink {
  name: string
  icon: LucideIcon | (() => ReactNode)
  href: string
}

export const footerLinks: FooterSection = {
  product: [
    { name: 'Token Creator', href: '/tools/token-creator' },
    { name: 'Create Liquidity', href: '/tools/create-liquidity' },
    { name: 'Burn Tokens', href: '/tools/burn-tokens' },
    { name: 'Revoke Mint Authority', href: '/tools/revoke-mint-authority' },
    { name: 'Revoke Freeze Authority', href: '/tools/revoke-freeze-authority' },
    { name: 'Freeze Wallets', href: '/tools/freeze-wallets' },
    { name: 'Unfreeze Wallets', href: '/tools/unfreeze-wallets' },
    { name: 'Transaction Multisender', href: '/tools/multisender' },
    { name: 'Token Auditor', href: '/tools/token-auditor' },
  ],
  resources: [
    { name: 'Documentation', href: '/docs' },
    { name: 'Tutorials', href: '/tutorials' },
    { name: 'Blog', href: '/blog' },
    { name: 'Community', href: '/community' },
    { name: 'Support Center', href: '/support' },
  ],
  company: [
    { name: 'About Us', href: '/about' },
    { name: 'Privacy Policy', href: '/privacy-policy' },
    { name: 'Terms of Service', href: '/terms-of-service' },
    { name: 'Imprint', href: '/imprint' },
    { name: 'Contact', href: '/contact' },
    { name: 'Status', href: '/status' },
  ],
  users: [
    { name: 'Bug Reports', href: '/bugs' },
    { name: 'Feature Requests', href: '/features' },
    { name: 'Feedback', href: '/feedback' },
  ],
}

export const socialLinks: SocialLink[] = [
  {
    name: 'X',
    icon: () => <XLogo size="md" />,
    href: 'https://twitter.com/cloakforge'
  },
  {
    name: 'Discord',
    icon: MessageCircle,
    href: 'https://discord.gg/cloakforge'
  },
]
```

- [ ] **Step 2: Update FooterBrand.tsx to handle component-based icons**

```typescript
// src/components/common/GlobalFooter/FooterBrand.tsx
'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import { socialLinks } from './footerData'

export const FooterBrand = (): React.ReactNode => (
  <motion.div initial={{ opacity: 0, y: 20 }} transition={{ duration: 0.6 }} viewport={{ once: true }} whileInView={{ opacity: 1, y: 0 }}>
    <div className='mb-6 flex items-center'>
      <div className='relative mr-3 flex size-10 items-center justify-center overflow-hidden rounded-lg'>
        <Image alt='CloakForge' className='h-full w-full object-contain' fill sizes='40px' src='/cloakforge-logo-without-rectangle.webp' />
      </div>
      <span className='text-xl'>CloakForge</span>
    </div>
    <p className='text-muted-foreground mb-6 leading-relaxed'>
      Professional Solana token management tools built for developers, creators, and projects.
    </p>

    <div className='flex space-x-4'>
      {socialLinks.map((social) => {
        const IconComponent = typeof social.icon === 'function' ? social.icon : social.icon
        return (
          <motion.a
            className='bg-muted hover:bg-primary hover:text-primary-foreground flex h-10 w-10 items-center justify-center rounded-lg transition-all duration-300'
            href={social.href}
            key={social.name}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            {typeof social.icon === 'function' ? (
              <IconComponent />
            ) : (
              <IconComponent className='h-5 w-5' />
            )}
          </motion.a>
        )
      })}
    </div>
  </motion.div>
)
```

- [ ] **Step 3: Test footer rendering**

Run: `npm run dev`
Navigate to: `http://localhost:3001`
Expected: Footer displays X logo instead of Twitter icon with correct size (20px)

- [ ] **Step 4: Type check and lint**

Run: `npx tsc --noEmit && npm run lint:nowarn`
Expected: No errors or warnings

- [ ] **Step 5: Commit footer update**

```bash
git add src/components/common/GlobalFooter/
git commit -m "feat: replace Twitter icon with X logo in footer

- Update footerData.ts to use XLogo component function
- Modify FooterBrand.tsx to handle component-based icons
- Social links now display custom X logo at md size (20px)

Co-Authored-By: Claude Sonnet 4 <noreply@anthropic.com>"
```

### Task 3: Update Token Creator Form to Use XLogo

**Files:**
- Modify: `src/components/pages/TokenCreatorPage/TokenCreationForm/OptionalLinksForm.tsx`

- [ ] **Step 1: Replace Twitter import with XLogo in OptionalLinksForm**

```typescript
// src/components/pages/TokenCreatorPage/TokenCreationForm/OptionalLinksForm.tsx
'use client'

import { type UseFormReturn } from 'react-hook-form'
import { Globe, MessageCircle } from 'lucide-react'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { XLogo } from '@/components/common/XLogo'
import { type TokenCreatorFormData } from './tokenCreatorFormSchema'

interface OptionalLinksFormProps {
  form: UseFormReturn<TokenCreatorFormData>
}

export const OptionalLinksForm = ({ form }: OptionalLinksFormProps): React.ReactNode => (
  <div className='space-y-6'>
    <h3 className='flex items-center space-x-2 text-lg font-medium'>
      <Globe className='text-primary h-5 w-5' />
      <span>Optional Links</span>
    </h3>

    <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
      <FormField
        control={form.control}
        name='website'
        render={({ field }) => (
          <FormItem>
            <FormLabel className='flex items-center space-x-2'>
              <Globe className='h-4 w-4' />
              <span>Website</span>
            </FormLabel>
            <FormControl>
              <Input className='bg-input-background focus:border-primary border-2' placeholder='https://mytoken.com' {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name='twitter'
        render={({ field }) => (
          <FormItem>
            <FormLabel className='flex items-center space-x-2'>
              <XLogo size="sm" />
              <span>Twitter/X</span>
            </FormLabel>
            <FormControl>
              <Input
                className='bg-input-background focus:border-primary border-2'
                placeholder='@mytoken or https://x.com/mytoken'
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name='telegram'
        render={({ field }) => (
          <FormItem>
            <FormLabel className='flex items-center space-x-2'>
              <MessageCircle className='h-4 w-4' />
              <span>Telegram</span>
            </FormLabel>
            <FormControl>
              <Input
                className='bg-input-background focus:border-primary border-2'
                placeholder='@mytoken or https://t.me/mytoken'
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name='discord'
        render={({ field }) => (
          <FormItem>
            <FormLabel className='flex items-center space-x-2'>
              <MessageCircle className='h-4 w-4' />
              <span>Discord</span>
            </FormLabel>
            <FormControl>
              <Input
                className='bg-input-background focus:border-primary border-2'
                placeholder='https://discord.gg/invite-code'
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  </div>
)
```

- [ ] **Step 2: Test form rendering**

Run: `npm run dev`
Navigate to: `http://localhost:3001/tools/token-creator`
Expected: Twitter/X field label shows X logo instead of Twitter icon at small size (16px)

- [ ] **Step 3: Type check and lint**

Run: `npx tsc --noEmit && npm run lint:nowarn`
Expected: No errors or warnings

- [ ] **Step 4: Commit form update**

```bash
git add src/components/pages/TokenCreatorPage/TokenCreationForm/OptionalLinksForm.tsx
git commit -m "feat: replace Twitter icon with X logo in token creator form

- Remove Twitter import from Lucide-react
- Add XLogo component with sm size (16px) for form field label
- Maintains consistent visual hierarchy with other form icons

Co-Authored-By: Claude Sonnet 4 <noreply@anthropic.com>"
```

### Task 4: Update Token Auditor to Use XLogo

**Files:**
- Modify: `src/components/pages/TokenAuditorPage/TokenDashboard/TokenDetails.tsx`

- [ ] **Step 1: Replace Twitter import with XLogo in TokenDetails**

```typescript
// src/components/pages/TokenAuditorPage/TokenDashboard/TokenDetails.tsx
'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import { Info, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { XLogo } from '@/components/common/XLogo'
import { type TokenData } from '../tokenAuditorData'

interface TokenDetailsProps {
  tokenData: TokenData
}

export const TokenDetails = ({ tokenData }: TokenDetailsProps): React.ReactNode => (
  <motion.div animate={{ opacity: 1, x: 0 }} initial={{ opacity: 0, x: -30 }} transition={{ duration: 0.8 }}>
    <Card className='border-border border-2'>
      <CardHeader className='from-primary/5 to-secondary/5 border-border border-b bg-gradient-to-r'>
        <CardTitle className='flex items-center space-x-2'>
          <Info className='text-primary h-5 w-5' />
          <span>Token Information</span>
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-6 p-6'>
        {/* Token Logo and Basic Info */}
        <div className='flex items-center space-x-4'>
          <Image
            alt={tokenData.name}
            className='border-border h-16 w-16 rounded-full border-2'
            height={64}
            src={tokenData.metadata.image?.trim() || '/token-fallback.svg'}
            width={64}
          />
          <div>
            <h3 className='text-xl font-medium'>{tokenData.name}</h3>
            <p className='text-muted-foreground'>{tokenData.symbol}</p>
          </div>
        </div>

        {/* Description */}
        <div>
          <Label className='text-sm font-medium'>Description</Label>
          <p className='text-muted-foreground mt-1 text-sm leading-relaxed'>{tokenData.metadata.description}</p>
        </div>

        {/* Technical Details */}
        <div className='grid grid-cols-2 gap-4'>
          <div>
            <Label className='text-sm font-medium'>Decimals</Label>
            <p className='text-sm'>{tokenData.decimals}</p>
          </div>
          <div>
            <Label className='text-sm font-medium'>Total Supply</Label>
            <p className='text-sm'>{tokenData.supply}</p>
          </div>
        </div>

        {/* Social Links */}
        {(tokenData.metadata.website || tokenData.metadata.twitter || tokenData.metadata.telegram) && (
          <div>
            <Label className='mb-2 block text-sm font-medium'>Links</Label>
            <div className='flex space-x-2'>
              {tokenData.metadata.website && (
                <Button asChild size='sm' variant='outline'>
                  <a href={tokenData.metadata.website} rel='noopener noreferrer' target='_blank'>
                    <Globe className='mr-1 h-4 w-4' />
                    Website
                  </a>
                </Button>
              )}
              {tokenData.metadata.twitter && (
                <Button asChild size='sm' variant='outline'>
                  <a href={tokenData.metadata.twitter} rel='noopener noreferrer' target='_blank'>
                    <XLogo size="sm" className='mr-1' />
                    Twitter
                  </a>
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  </motion.div>
)
```

- [ ] **Step 2: Test token auditor rendering**

Run: `npm run dev`
Navigate to: `http://localhost:3001/tools/token-auditor`
Expected: Twitter button shows X logo instead of Twitter icon at small size (16px)

- [ ] **Step 3: Type check and lint**

Run: `npx tsc --noEmit && npm run lint:nowarn`
Expected: No errors or warnings

- [ ] **Step 4: Commit token auditor update**

```bash
git add src/components/pages/TokenAuditorPage/TokenDashboard/TokenDetails.tsx
git commit -m "feat: replace Twitter icon with X logo in token auditor

- Remove Twitter import from Lucide-react
- Add XLogo component with sm size (16px) for Twitter button
- Maintains button functionality with updated branding

Co-Authored-By: Claude Sonnet 4 <noreply@anthropic.com>"
```

### Task 5: Clean Up Unused Twitter Imports

**Files:**
- Verify: All files that previously imported Twitter from Lucide-react

- [ ] **Step 1: Search for remaining Twitter imports**

Run: `grep -r "import.*Twitter.*from.*lucide-react" src/`
Expected: No matches found

- [ ] **Step 2: Search for remaining Twitter references**

Run: `grep -r "Twitter.*className" src/`
Expected: No matches found (should only find text references like "Twitter" labels)

- [ ] **Step 3: Run full test suite**

Run: `npm test`
Expected: All tests pass including new XLogo component tests

- [ ] **Step 4: Type check and lint final verification**

Run: `npx tsc --noEmit && npm run lint:nowarn`
Expected: No errors or warnings

- [ ] **Step 5: Visual verification test**

Run: `npm run dev`
Test URLs:
- `http://localhost:3001` (footer)
- `http://localhost:3001/tools/token-creator` (form)
- `http://localhost:3001/tools/token-auditor` (token details)
Expected: All locations show X logo with appropriate sizing

- [ ] **Step 6: Final commit**

```bash
git add -A
git commit -m "docs: complete X logo Twitter icon replacement

- All Twitter icons from Lucide-react successfully replaced
- XLogo component provides consistent branding across app
- Footer (md/20px), forms (sm/16px), buttons (sm/16px) sizing maintained
- Zero remaining Twitter icon dependencies

Co-Authored-By: Claude Sonnet 4 <noreply@anthropic.com>"
```

## Testing Checklist

**Unit Tests:**
- [ ] XLogo component renders all size variants correctly
- [ ] XLogo component handles custom dimensions
- [ ] XLogo component applies custom className and alt text

**Integration Tests:**
- [ ] Footer social links display X logo at correct size
- [ ] Token creator form Twitter field shows X logo
- [ ] Token auditor Twitter button shows X logo
- [ ] All hover states and interactions work correctly

**Visual Tests:**
- [ ] X logo maintains brand consistency across contexts
- [ ] Sizing hierarchy preserved (footer > forms/buttons)
- [ ] Dark mode compatibility verified
- [ ] Responsive behavior validated on mobile

**Performance Tests:**
- [ ] Next.js Image optimization working correctly
- [ ] No console errors or warnings
- [ ] Bundle size impact minimal (< 5KB increase)

## Completion Criteria

✅ **Functionality:** All Twitter icons replaced with X logo component
✅ **Testing:** Component tests pass, integration verified
✅ **Performance:** No regressions, optimized image loading
✅ **Accessibility:** Proper alt text and ARIA compliance
✅ **Maintainability:** Reusable component pattern established
✅ **Documentation:** Implementation matches design specification