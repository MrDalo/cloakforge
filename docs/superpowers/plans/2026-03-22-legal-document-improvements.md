# Legal Document Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enhance CloakForge's Terms of Service and Privacy Policy with comprehensive legal protections, global regulatory compliance, and improved user experience components.

**Architecture:** Strategic enhancement approach maintaining existing document structure while adding critical legal protection sections, prohibited jurisdictions management, and user-friendly UI components. Uses environment variables for legal entity information and maintains separate data structures for Privacy Policy (flat) and Terms of Service (nested).

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS, Lucide React icons, React Hook Form, Zod validation

---

## Task 1: Legal Entity Configuration System

**Files:**
- Create: `src/lib/config/legalConfig.ts`
- Create: `.env.example`
- Test: `src/lib/config/__tests__/legalConfig.test.ts`

- [ ] **Step 1: Write failing test for legal config**

```typescript
// src/lib/config/__tests__/legalConfig.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { getLegalEntityInfo } from '../legalConfig'

describe('Legal Configuration', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('should return legal entity information when env vars are set', () => {
    process.env.LEGAL_ENTITY_NAME = 'Test Company s.r.o.'
    process.env.LEGAL_ENTITY_ADDRESS = 'Prague, Czech Republic'
    process.env.LEGAL_ENTITY_ICO = '12345678'
    process.env.LEGAL_CONTACT_EMAIL = 'legal@test.com'

    const result = getLegalEntityInfo()

    expect(result).toEqual({
      name: 'Test Company s.r.o.',
      address: 'Prague, Czech Republic',
      ico: '12345678',
      email: 'legal@test.com'
    })
  })

  it('should return placeholder values when env vars are missing in development', () => {
    process.env.NODE_ENV = 'development'
    delete process.env.LEGAL_ENTITY_NAME

    const result = getLegalEntityInfo()

    expect(result.name).toBe('[LEGAL_ENTITY_NAME required]')
  })

  it('should throw error in production when env vars are missing', () => {
    process.env.NODE_ENV = 'production'
    delete process.env.LEGAL_ENTITY_NAME

    expect(() => getLegalEntityInfo()).toThrow('Missing required legal entity information')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test src/lib/config/__tests__/legalConfig.test.ts`
Expected: FAIL with "Cannot find module '../legalConfig'"

- [ ] **Step 3: Create legal config implementation**

```typescript
// src/lib/config/legalConfig.ts
export interface LegalEntityInfo {
  name: string
  address: string
  ico: string
  email: string
}

export function getLegalEntityInfo(): LegalEntityInfo {
  const isProduction = process.env.NODE_ENV === 'production'

  const name = process.env.LEGAL_ENTITY_NAME
  const address = process.env.LEGAL_ENTITY_ADDRESS
  const ico = process.env.LEGAL_ENTITY_ICO
  const email = process.env.LEGAL_CONTACT_EMAIL

  // Validate all required fields are present
  const missingFields = []
  if (!name) missingFields.push('LEGAL_ENTITY_NAME')
  if (!address) missingFields.push('LEGAL_ENTITY_ADDRESS')
  if (!ico) missingFields.push('LEGAL_ENTITY_ICO')
  if (!email) missingFields.push('LEGAL_CONTACT_EMAIL')

  if (missingFields.length > 0) {
    if (isProduction) {
      throw new Error(`Missing required legal entity information: ${missingFields.join(', ')}`)
    }

    // Return placeholder values in development
    return {
      name: name || '[LEGAL_ENTITY_NAME required]',
      address: address || '[LEGAL_ENTITY_ADDRESS required]',
      ico: ico || '[LEGAL_ENTITY_ICO required]',
      email: email || '[LEGAL_CONTACT_EMAIL required]'
    }
  }

  return {
    name: name!,
    address: address!,
    ico: ico!,
    email: email!
  }
}
```

- [ ] **Step 4: Create environment variables example**

```bash
# .env.example

# Legal Entity Information (Required for production deployment)
LEGAL_ENTITY_NAME=Your Company Name s.r.o.
LEGAL_ENTITY_ADDRESS=Your Business Address, Prague, Czech Republic
LEGAL_ENTITY_ICO=Your Czech Business Registration Number
LEGAL_CONTACT_EMAIL=legal@yourcompany.com
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test src/lib/config/__tests__/legalConfig.test.ts`
Expected: PASS all tests

- [ ] **Step 6: Commit**

```bash
git add src/lib/config/legalConfig.ts .env.example src/lib/config/__tests__/legalConfig.test.ts
git commit -m "feat(legal): add legal entity configuration system

- Add getLegalEntityInfo function with environment variable support
- Include development fallback and production validation
- Document required environment variables in .env.example"
```

## Task 2: Prohibited Jurisdictions Data Structure

**Files:**
- Create: `src/lib/constants/prohibitedJurisdictions.ts`
- Test: `src/lib/constants/__tests__/prohibitedJurisdictions.test.ts`

- [ ] **Step 1: Write failing test for jurisdictions data**

```typescript
// src/lib/constants/__tests__/prohibitedJurisdictions.test.ts
import { describe, it, expect } from 'vitest'
import {
  prohibitedJurisdictions,
  isJurisdictionProhibited,
  getJurisdictionsByCategory
} from '../prohibitedJurisdictions'

describe('Prohibited Jurisdictions', () => {
  it('should contain all required jurisdiction categories', () => {
    expect(prohibitedJurisdictions).toHaveProperty('primary')
    expect(prohibitedJurisdictions).toHaveProperty('ofacSanctioned')
    expect(prohibitedJurisdictions).toHaveProperty('usStates')
    expect(prohibitedJurisdictions).toHaveProperty('cryptoProhibited')
  })

  it('should include key sanctioned countries', () => {
    const primary = prohibitedJurisdictions.primary
    expect(primary).toContain('China (People\'s Republic of China)')
    expect(primary).toContain('North Korea (Democratic People\'s Republic of Korea)')
    expect(primary).toContain('Iran (Islamic Republic of Iran)')
  })

  it('should correctly identify prohibited jurisdictions', () => {
    expect(isJurisdictionProhibited('China')).toBe(true)
    expect(isJurisdictionProhibited('Canada')).toBe(false)
    expect(isJurisdictionProhibited('New York')).toBe(true)
  })

  it('should return jurisdictions by category', () => {
    const primary = getJurisdictionsByCategory('primary')
    expect(Array.isArray(primary)).toBe(true)
    expect(primary.length).toBeGreaterThan(5)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test src/lib/constants/__tests__/prohibitedJurisdictions.test.ts`
Expected: FAIL with "Cannot find module '../prohibitedJurisdictions'"

- [ ] **Step 3: Create prohibited jurisdictions implementation**

```typescript
// src/lib/constants/prohibitedJurisdictions.ts
export interface ProhibitedJurisdictionsData {
  primary: string[]
  ofacSanctioned: string[]
  usStates: string[]
  cryptoProhibited: string[]
  lastUpdated: string
}

export const prohibitedJurisdictions: ProhibitedJurisdictionsData = {
  primary: [
    'China (People\'s Republic of China)',
    'North Korea (Democratic People\'s Republic of Korea)',
    'Iran (Islamic Republic of Iran)',
    'Syria (Syrian Arab Republic)',
    'Cuba (Republic of Cuba)',
    'Russia (Russian Federation)',
    'Belarus (Republic of Belarus)',
    'Myanmar (Burma)',
    'Venezuela (Bolivarian Republic of)',
    'Afghanistan (Islamic Emirate of)'
  ],
  ofacSanctioned: [
    'Crimea region of Ukraine',
    'Donetsk People\'s Republic (DNR)',
    'Luhansk People\'s Republic (LNR)',
    'Zaporizhzhia region of Ukraine (Russian-controlled areas)',
    'Kherson region of Ukraine (Russian-controlled areas)'
  ],
  usStates: [
    'New York (BitLicense requirements)',
    'Washington (money transmitter license requirements)',
    'Hawaii (regulatory uncertainty)'
  ],
  cryptoProhibited: [
    'Bangladesh',
    'Bolivia',
    'Ecuador',
    'Egypt (variable enforcement)',
    'Morocco',
    'Nepal',
    'Qatar',
    'Algeria',
    'Macedonia'
  ],
  lastUpdated: '2026-03-22'
}

export function isJurisdictionProhibited(jurisdiction: string): boolean {
  const allJurisdictions = [
    ...prohibitedJurisdictions.primary,
    ...prohibitedJurisdictions.ofacSanctioned,
    ...prohibitedJurisdictions.usStates,
    ...prohibitedJurisdictions.cryptoProhibited
  ]

  return allJurisdictions.some(item =>
    item.toLowerCase().includes(jurisdiction.toLowerCase()) ||
    jurisdiction.toLowerCase().includes(item.toLowerCase())
  )
}

export function getJurisdictionsByCategory(category: keyof Omit<ProhibitedJurisdictionsData, 'lastUpdated'>): string[] {
  return prohibitedJurisdictions[category]
}

export function getAllProhibitedJurisdictions(): string[] {
  return [
    ...prohibitedJurisdictions.primary,
    ...prohibitedJurisdictions.ofacSanctioned,
    ...prohibitedJurisdictions.usStates,
    ...prohibitedJurisdictions.cryptoProhibited
  ]
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test src/lib/constants/__tests__/prohibitedJurisdictions.test.ts`
Expected: PASS all tests

- [ ] **Step 5: Commit**

```bash
git add src/lib/constants/prohibitedJurisdictions.ts src/lib/constants/__tests__/prohibitedJurisdictions.test.ts
git commit -m "feat(legal): add prohibited jurisdictions data structure

- Include comprehensive list of restricted regions and sanctions
- Add utility functions for jurisdiction checking
- Categorize by type (primary, OFAC, US states, crypto-prohibited)"
```

## Task 3: TL;DR Summary Box Component

**Files:**
- Create: `src/components/common/TldrSummaryBox/TldrSummaryBox.tsx`
- Create: `src/components/common/TldrSummaryBox/index.ts`
- Test: `src/components/common/TldrSummaryBox/__tests__/TldrSummaryBox.test.tsx`

- [ ] **Step 1: Write failing test for TldrSummaryBox**

```typescript
// src/components/common/TldrSummaryBox/__tests__/TldrSummaryBox.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TldrSummaryBox } from '../TldrSummaryBox'

describe('TldrSummaryBox', () => {
  it('should render summary text', () => {
    const summaryText = 'This section explains user responsibilities'

    render(<TldrSummaryBox summary={summaryText} />)

    expect(screen.getByText(summaryText)).toBeInTheDocument()
    expect(screen.getByText('TL;DR')).toBeInTheDocument()
  })

  it('should apply different variants correctly', () => {
    const { rerender } = render(
      <TldrSummaryBox summary="Test" variant="warning" />
    )

    const container = screen.getByRole('region')
    expect(container).toHaveClass('border-warning')

    rerender(<TldrSummaryBox summary="Test" variant="info" />)
    expect(container).toHaveClass('border-primary')
  })

  it('should be accessible with proper ARIA attributes', () => {
    render(<TldrSummaryBox summary="Test summary" />)

    const container = screen.getByRole('region')
    expect(container).toHaveAttribute('aria-label', 'Summary')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test src/components/common/TldrSummaryBox/__tests__/TldrSummaryBox.test.tsx`
Expected: FAIL with "Cannot find module '../TldrSummaryBox'"

- [ ] **Step 3: Create TldrSummaryBox component**

```typescript
// src/components/common/TldrSummaryBox/TldrSummaryBox.tsx
'use client'

import { Info } from 'lucide-react'

interface TldrSummaryBoxProps {
  summary: string
  variant?: 'default' | 'warning' | 'info'
}

export const TldrSummaryBox = ({
  summary,
  variant = 'default'
}: TldrSummaryBoxProps): React.ReactNode => {
  const variantStyles = {
    default: 'border-secondary bg-secondary/5 text-secondary-foreground',
    warning: 'border-warning bg-warning/5 text-warning-foreground',
    info: 'border-primary bg-primary/5 text-primary-foreground'
  }

  const iconStyles = {
    default: 'text-secondary',
    warning: 'text-warning',
    info: 'text-primary'
  }

  return (
    <div
      className={`border-2 rounded-lg p-4 mb-6 ${variantStyles[variant]}`}
      role="region"
      aria-label="Summary"
    >
      <div className="flex items-start space-x-3">
        <Info className={`h-5 w-5 mt-0.5 ${iconStyles[variant]} flex-shrink-0`} />
        <div>
          <h3 className="font-semibold text-sm mb-2">TL;DR</h3>
          <p className="text-sm leading-relaxed">{summary}</p>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Create index file**

```typescript
// src/components/common/TldrSummaryBox/index.ts
export { TldrSummaryBox } from './TldrSummaryBox'
export type { TldrSummaryBoxProps } from './TldrSummaryBox'
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test src/components/common/TldrSummaryBox/__tests__/TldrSummaryBox.test.tsx`
Expected: PASS all tests

- [ ] **Step 6: Commit**

```bash
git add src/components/common/TldrSummaryBox/
git commit -m "feat(ui): add TldrSummaryBox component

- Create reusable summary box with TL;DR styling
- Support different variants (default, warning, info)
- Include proper accessibility attributes"
```

## Task 4: Risk Level Indicator Component

**Files:**
- Create: `src/components/common/RiskLevelIndicator/RiskLevelIndicator.tsx`
- Create: `src/components/common/RiskLevelIndicator/index.ts`
- Test: `src/components/common/RiskLevelIndicator/__tests__/RiskLevelIndicator.test.tsx`

- [ ] **Step 1: Write failing test for RiskLevelIndicator**

```typescript
// src/components/common/RiskLevelIndicator/__tests__/RiskLevelIndicator.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { RiskLevelIndicator } from '../RiskLevelIndicator'

describe('RiskLevelIndicator', () => {
  it('should render high risk indicator with correct styling', () => {
    render(<RiskLevelIndicator level="high" />)

    expect(screen.getByText('High Risk')).toBeInTheDocument()
    const indicator = screen.getByRole('status')
    expect(indicator).toHaveClass('bg-destructive/10')
  })

  it('should render medium risk indicator', () => {
    render(<RiskLevelIndicator level="medium" />)

    expect(screen.getByText('Medium Risk')).toBeInTheDocument()
    const indicator = screen.getByRole('status')
    expect(indicator).toHaveClass('bg-warning/10')
  })

  it('should render low risk indicator', () => {
    render(<RiskLevelIndicator level="low" />)

    expect(screen.getByText('Low Risk')).toBeInTheDocument()
    const indicator = screen.getByRole('status')
    expect(indicator).toHaveClass('bg-secondary/10')
  })

  it('should be accessible with proper attributes', () => {
    render(<RiskLevelIndicator level="high" />)

    const indicator = screen.getByRole('status')
    expect(indicator).toHaveAttribute('aria-label', 'Risk level: High')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test src/components/common/RiskLevelIndicator/__tests__/RiskLevelIndicator.test.tsx`
Expected: FAIL with "Cannot find module '../RiskLevelIndicator'"

- [ ] **Step 3: Create RiskLevelIndicator component**

```typescript
// src/components/common/RiskLevelIndicator/RiskLevelIndicator.tsx
'use client'

import { AlertTriangle, AlertCircle, Info } from 'lucide-react'

export interface RiskLevelIndicatorProps {
  level: 'high' | 'medium' | 'low'
  className?: string
}

export const RiskLevelIndicator = ({
  level,
  className = ''
}: RiskLevelIndicatorProps): React.ReactNode => {
  const riskConfig = {
    high: {
      label: 'High Risk',
      icon: AlertTriangle,
      bgClass: 'bg-destructive/10 border-destructive/20',
      textClass: 'text-destructive',
      iconClass: 'text-destructive'
    },
    medium: {
      label: 'Medium Risk',
      icon: AlertCircle,
      bgClass: 'bg-warning/10 border-warning/20',
      textClass: 'text-warning',
      iconClass: 'text-warning'
    },
    low: {
      label: 'Low Risk',
      icon: Info,
      bgClass: 'bg-secondary/10 border-secondary/20',
      textClass: 'text-secondary',
      iconClass: 'text-secondary'
    }
  }

  const config = riskConfig[level]
  const Icon = config.icon

  return (
    <div
      className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-full border ${config.bgClass} ${className}`}
      role="status"
      aria-label={`Risk level: ${config.label.split(' ')[0]}`}
    >
      <Icon className={`h-4 w-4 ${config.iconClass}`} />
      <span className={`text-sm font-medium ${config.textClass}`}>
        {config.label}
      </span>
    </div>
  )
}
```

- [ ] **Step 4: Create index file**

```typescript
// src/components/common/RiskLevelIndicator/index.ts
export { RiskLevelIndicator } from './RiskLevelIndicator'
export type { RiskLevelIndicatorProps } from './RiskLevelIndicator'
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test src/components/common/RiskLevelIndicator/__tests__/RiskLevelIndicator.test.tsx`
Expected: PASS all tests

- [ ] **Step 6: Commit**

```bash
git add src/components/common/RiskLevelIndicator/
git commit -m "feat(ui): add RiskLevelIndicator component

- Create visual risk level indicator with high/medium/low variants
- Include appropriate icons and color coding
- Add accessibility attributes for screen readers"
```

## Task 5: Enhanced Privacy Policy Data Structure

**Files:**
- Modify: `src/components/pages/PrivacyPolicyPage/ContentSection/privacyData.ts`

- [ ] **Step 1: Write test for enhanced privacy data structure**

```typescript
// Add to existing test file or create new test
// src/components/pages/PrivacyPolicyPage/ContentSection/__tests__/privacyData.test.ts
import { describe, it, expect } from 'vitest'
import { privacySectionsData, type PrivacySectionData } from '../privacyData'

describe('Enhanced Privacy Data', () => {
  it('should include TL;DR summaries for complex sections', () => {
    const sectionsWithSummaries = privacySectionsData.filter(section => section.tldrSummary)
    expect(sectionsWithSummaries.length).toBeGreaterThan(3)
  })

  it('should have risk levels for applicable sections', () => {
    const sectionsWithRisk = privacySectionsData.filter(section => section.riskLevel)
    expect(sectionsWithRisk.length).toBeGreaterThan(1)
  })

  it('should include blockchain transparency warning with high risk', () => {
    const blockchainSection = privacySectionsData.find(s => s.id === 'blockchain-transparency')
    expect(blockchainSection).toBeDefined()
    expect(blockchainSection?.riskLevel).toBe('high')
  })

  it('should have lastUpdated timestamps', () => {
    const updatedSections = privacySectionsData.filter(section => section.lastUpdated)
    expect(updatedSections.length).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test src/components/pages/PrivacyPolicyPage/ContentSection/__tests__/privacyData.test.ts`
Expected: FAIL due to missing properties

- [ ] **Step 3: Enhance privacy data interface**

```typescript
// Update src/components/pages/PrivacyPolicyPage/ContentSection/privacyData.ts
import { Shield, Database, Eye, Lock, Clock, Globe, Mail, UserCheck, Server, FileText, type LucideIcon } from 'lucide-react'

export interface PrivacySectionData {
  id: string
  title: string
  description: string
  listItems: string[]
  icon: LucideIcon
  iconVariant?: 'primary' | 'secondary' | 'warning'
  tldrSummary?: string
  riskLevel?: 'high' | 'medium' | 'low'
  lastUpdated?: string
}

export const privacySectionsData: PrivacySectionData[] = [
  {
    id: 'overview',
    title: 'Privacy Overview',
    description: 'CloakForge is built with privacy as a fundamental principle. This policy explains our privacy-first approach and what information we do and do not collect.',
    listItems: [],
    icon: Shield,
    tldrSummary: 'We are privacy-first and collect zero user data.',
    riskLevel: 'low',
    lastUpdated: '2026-03-22'
  },
  {
    id: 'no-data-collection',
    title: 'Zero Data Collection',
    description: 'We do not collect, store, or track:',
    listItems: [
      'Personal identifying information',
      'Wallet addresses or transaction history',
      'Browsing behavior or usage patterns',
      'IP addresses or location data',
      'Cookies for tracking purposes',
      'Any form of analytics or telemetry',
    ],
    icon: Database,
    tldrSummary: 'We literally collect nothing - no personal info, no tracking, no analytics.',
    riskLevel: 'low',
    lastUpdated: '2026-03-22'
  },
  {
    id: 'client-side',
    title: 'Client-Side Operations',
    description: 'All operations are performed locally in your browser:',
    listItems: [
      'Transactions are built and signed on your device',
      'Private keys never leave your wallet',
      'No server-side storage of user data',
      'Direct blockchain interaction through your wallet',
      'All data processing happens client-side',
    ],
    icon: Lock,
    tldrSummary: 'Everything happens in your browser - we never see your keys or data.',
    riskLevel: 'low',
    lastUpdated: '2026-03-22'
  },
  {
    id: 'third-party-services',
    title: 'Third-Party Services',
    description: 'We use these external services with privacy considerations:',
    listItems: [
      'Solana RPC nodes for blockchain communication',
      'Vercel for hosting (no user data transmitted)',
      'GitHub for open-source code repository',
      'No third-party analytics or tracking services',
    ],
    icon: Globe,
    tldrSummary: 'We use minimal third-party services and none of them get your personal data.',
    riskLevel: 'medium',
    lastUpdated: '2026-03-22'
  },
  {
    id: 'wallet-privacy',
    title: 'Wallet Privacy',
    description: 'Your wallet interactions:',
    listItems: [
      'You maintain full control over wallet connections',
      'We cannot access your wallet without explicit permission',
      'Transaction signing happens entirely in your wallet',
      'We do not store wallet addresses or connection states',
      'Disconnection removes all traces of interaction',
    ],
    icon: UserCheck,
    tldrSummary: 'Your wallet, your control - we never access it without permission.',
    riskLevel: 'low',
    lastUpdated: '2026-03-22'
  },
  {
    id: 'blockchain-transparency',
    title: 'Blockchain Transparency',
    description: 'While CloakForge respects your privacy, remember that blockchain transactions are public and permanent. Anyone can view transaction details on blockchain explorers.',
    listItems: [],
    icon: Eye,
    tldrSummary: 'WARNING: All blockchain transactions are public and permanent.',
    riskLevel: 'high',
    lastUpdated: '2026-03-22'
  },
  {
    id: 'local-storage',
    title: 'Local Storage',
    description: 'We may use browser local storage for:',
    listItems: [
      'User interface preferences (theme, settings)',
      'Temporary transaction state during signing',
      'No personal or identifying information stored',
      'Data remains on your device only',
      'Clearing browser data removes all stored information',
    ],
    icon: Server,
    tldrSummary: 'Only UI preferences stored locally - no personal info.',
    riskLevel: 'low',
    lastUpdated: '2026-03-22'
  },
  {
    id: 'no-cookies',
    title: 'No Tracking Cookies',
    description: 'We do not use cookies for tracking, analytics, or advertising. Any technical cookies used are strictly necessary for the application to function.',
    listItems: [],
    icon: Shield,
    tldrSummary: 'No tracking cookies - only essential technical ones.',
    riskLevel: 'low',
    lastUpdated: '2026-03-22'
  },
  {
    id: 'open-source',
    title: 'Open Source Transparency',
    description: 'Our commitment to transparency:',
    listItems: [
      'All source code is publicly available',
      'No hidden tracking or data collection code',
      'Community can verify our privacy claims',
      'Regular security audits and reviews',
    ],
    icon: FileText,
    tldrSummary: 'Our code is public - you can verify we do what we say.',
    riskLevel: 'low',
    lastUpdated: '2026-03-22'
  },
  {
    id: 'policy-changes',
    title: 'Policy Changes',
    description: 'Updates to this privacy policy:',
    listItems: [
      'Changes will be posted on this page',
      'Material changes will be clearly highlighted',
      'Continued use implies acceptance',
      'Users are encouraged to review periodically',
    ],
    icon: Clock,
    tldrSummary: 'We will notify you of important privacy policy changes.',
    riskLevel: 'low',
    lastUpdated: '2026-03-22'
  },
  {
    id: 'contact',
    title: 'Contact Information',
    description: 'For privacy-related inquiries:',
    listItems: [
      'Email: [INSERT EMAIL]',
      'GitHub Issues: [INSERT GITHUB URL]',
      'We respond to privacy concerns promptly',
      'No personal information required to contact us',
    ],
    icon: Mail,
    tldrSummary: 'Contact us for privacy questions - no personal info needed.',
    riskLevel: 'low',
    lastUpdated: '2026-03-22'
  },
]
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test src/components/pages/PrivacyPolicyPage/ContentSection/__tests__/privacyData.test.ts`
Expected: PASS all tests

- [ ] **Step 5: Commit**

```bash
git add src/components/pages/PrivacyPolicyPage/ContentSection/privacyData.ts src/components/pages/PrivacyPolicyPage/ContentSection/__tests__/privacyData.test.ts
git commit -m "enhance(privacy): add TL;DR summaries and risk levels to privacy policy

- Add tldrSummary field to all sections for better UX
- Include riskLevel indicators for user awareness
- Add lastUpdated timestamps for transparency
- Highlight high-risk blockchain transparency warning"
```

## Task 6: Enhanced Terms of Service Data Structure

**Files:**
- Modify: `src/components/pages/TermsOfServicePage/ContentSection/termsData.ts`

- [ ] **Step 1: Write test for enhanced terms data structure**

```typescript
// Create src/components/pages/TermsOfServicePage/ContentSection/__tests__/termsData.test.ts
import { describe, it, expect } from 'vitest'
import { termsData } from '../termsData'

describe('Enhanced Terms of Service Data', () => {
  it('should include prohibited jurisdictions section', () => {
    const prohibitedSection = termsData.find(s => s.id === 'prohibited-jurisdictions')
    expect(prohibitedSection).toBeDefined()
    expect(prohibitedSection?.content.type).toBe('list')
  })

  it('should include enhanced user warranties section', () => {
    const warrantiesSection = termsData.find(s => s.id === 'enhanced-warranties')
    expect(warrantiesSection).toBeDefined()
  })

  it('should include DeFi-specific risks section', () => {
    const defiRisksSection = termsData.find(s => s.id === 'defi-risks')
    expect(defiRisksSection).toBeDefined()
    expect(defiRisksSection?.riskLevel).toBe('high')
  })

  it('should include regulatory compliance section', () => {
    const regulatorySection = termsData.find(s => s.id === 'regulatory-compliance')
    expect(regulatorySection).toBeDefined()
  })

  it('should have TL;DR summaries for complex sections', () => {
    const sectionsWithSummaries = termsData.filter(section => section.tldrSummary)
    expect(sectionsWithSummaries.length).toBeGreaterThan(5)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test src/components/pages/TermsOfServicePage/ContentSection/__tests__/termsData.test.ts`
Expected: FAIL due to missing sections and properties

- [ ] **Step 3: Enhance terms data interface and add new sections**

```typescript
// Update src/components/pages/TermsOfServicePage/ContentSection/termsData.ts
import { Shield, Scale, FileText, AlertTriangle, Lock, Clock, Globe, Mail, UserCheck, type LucideIcon } from 'lucide-react'

export interface TermsContentData {
  type: 'text' | 'list'
  text?: string
  description?: string
  items?: string[]
}

export interface TermsSectionData {
  id: string
  title: string
  icon: LucideIcon
  iconVariant?: 'default' | 'destructive' | 'warning'
  content: TermsContentData
  tldrSummary?: string
  riskLevel?: 'high' | 'medium' | 'low'
  lastUpdated?: string
}

export const termsData: TermsSectionData[] = [
  {
    id: 'acceptance',
    title: 'Acceptance of Terms',
    icon: UserCheck,
    content: {
      type: 'text',
      text: 'These Terms constitute a legally binding agreement between you and the operator of CloakForge ("the Service"). By accessing or using the Service, you agree to be bound by these Terms. If you do not agree, you must not use the Service.',
    },
    tldrSummary: 'Using CloakForge means you agree to these terms.',
    riskLevel: 'low',
    lastUpdated: '2026-03-22'
  },
  {
    id: 'eligibility',
    title: 'Eligibility',
    icon: UserCheck,
    content: {
      type: 'list',
      description: 'By using the Service, you represent and warrant that:',
      items: [
        'You are at least 18 years old',
        'You have the legal capacity to enter into these Terms',
        'You are not located in a jurisdiction where use of the Service is prohibited',
        'You are not subject to sanctions or listed on restricted party lists',
        'Your use complies with all applicable laws and regulations',
      ],
    },
    tldrSummary: 'You must be 18+, legally capable, and not in a restricted location.',
    riskLevel: 'medium',
    lastUpdated: '2026-03-22'
  },
  {
    id: 'prohibited-jurisdictions',
    title: 'Prohibited Jurisdictions',
    icon: AlertTriangle,
    iconVariant: 'destructive',
    content: {
      type: 'list',
      description: 'The Service cannot be used by residents or individuals located in:',
      items: [
        'China (People\'s Republic of China)',
        'North Korea (Democratic People\'s Republic of Korea)',
        'Iran (Islamic Republic of Iran)',
        'Syria (Syrian Arab Republic)',
        'Cuba (Republic of Cuba)',
        'Russia (Russian Federation)',
        'Belarus (Republic of Belarus)',
        'Myanmar (Burma)',
        'Venezuela (Bolivarian Republic of)',
        'Afghanistan (Islamic Emirate of)',
        'OFAC sanctioned territories including Crimea, DNR, LNR',
        'US states with restrictive crypto regulations (NY, WA, HI)',
        'Any jurisdiction where cryptocurrency use is prohibited',
        'This list is subject to change based on evolving regulations'
      ]
    },
    tldrSummary: 'Cannot be used in sanctioned countries or restricted jurisdictions.',
    riskLevel: 'high',
    lastUpdated: '2026-03-22'
  },
  {
    id: 'enhanced-warranties',
    title: 'Enhanced User Warranties',
    icon: Shield,
    content: {
      type: 'list',
      description: 'You warrant and represent that:',
      items: [
        'You are not on any sanctions list (OFAC, UN, EU, etc.)',
        'You understand the regulatory status of tokens in your jurisdiction',
        'You have sufficient knowledge of DeFi risks and blockchain technology',
        'You will not use the Service for money laundering or terrorist financing',
        'Any tokens you create comply with applicable securities laws',
        'You are responsible for all tax obligations related to your use'
      ]
    },
    tldrSummary: 'You promise you are legally compliant and understand the risks.',
    riskLevel: 'high',
    lastUpdated: '2026-03-22'
  },
  {
    id: 'service-description',
    title: 'Service Description',
    icon: FileText,
    content: {
      type: 'list',
      description: 'CloakForge is a non-custodial Web3 interface that:',
      items: [
        'Enables interaction with blockchain networks (e.g., Solana)',
        'Provides tools such as token creation, burning, liquidity management, and authority revocation',
        'Operates as a client-side interface using third-party infrastructure (e.g., RPC providers, hosting)',
        'Does not custody, control, or store user funds, private keys, or assets',
        'Is provided on an "as is" and "as available" basis',
      ],
    },
    tldrSummary: 'We provide DeFi tools but never control your funds or keys.',
    riskLevel: 'medium',
    lastUpdated: '2026-03-22'
  },
  {
    id: 'defi-risks',
    title: 'DeFi-Specific Risks',
    icon: AlertTriangle,
    iconVariant: 'warning',
    content: {
      type: 'list',
      description: 'DeFi and blockchain operations carry significant risks:',
      items: [
        'Token burning permanently destroys tokens and cannot be undone',
        'Authority revocation cannot be reversed and may affect token functionality',
        'Liquidity operations may result in impermanent loss',
        'Transaction multisender operations may have partial failures',
        'Smart contract interactions may fail or behave unexpectedly',
        'MEV (Maximal Extractable Value) may affect your transactions',
        'Network congestion may cause failed or expensive transactions',
        'Regulatory changes may affect token legal status'
      ]
    },
    tldrSummary: 'DeFi operations are risky and often irreversible - understand before acting.',
    riskLevel: 'high',
    lastUpdated: '2026-03-22'
  },
  {
    id: 'regulatory-compliance',
    title: 'Regulatory Compliance Framework',
    icon: Scale,
    content: {
      type: 'list',
      description: 'Regulatory compliance requirements:',
      items: [
        'Tokens created may be subject to securities laws in your jurisdiction',
        'You are responsible for KYC/AML compliance where required',
        'Tax reporting obligations are solely your responsibility',
        'We may cooperate with regulators and law enforcement',
        'Service availability may change due to regulatory requirements',
        'Professional legal advice is recommended for complex operations'
      ]
    },
    tldrSummary: 'You are responsible for regulatory and tax compliance in your jurisdiction.',
    riskLevel: 'high',
    lastUpdated: '2026-03-22'
  },
  {
    id: 'non-custodial',
    title: 'Non-Custodial Nature',
    icon: Lock,
    content: {
      type: 'list',
      description: 'You acknowledge and agree that:',
      items: [
        'You retain full control over your wallet and private keys',
        'We do not access, store, or recover private keys or seed phrases',
        'Transactions are signed and executed by your wallet',
        'We cannot reverse, cancel, or modify blockchain transactions',
        'Loss of wallet access may result in permanent loss of funds',
      ],
    },
    tldrSummary: 'Your keys, your crypto - we cannot help with lost wallets.',
    riskLevel: 'high',
    lastUpdated: '2026-03-22'
  },
  // Continue with existing sections, adding tldrSummary and riskLevel to each...
  {
    id: 'user-responsibilities',
    title: 'User Responsibilities',
    icon: Shield,
    content: {
      type: 'list',
      description: 'You are solely responsible for:',
      items: [
        'Securing your wallet, private keys, and credentials',
        'Reviewing and approving all transactions before signing',
        'Understanding blockchain and DeFi risks',
        'Ensuring legality of your actions in your jurisdiction',
        'Any activity conducted through your wallet',
        'Compliance with applicable tax and regulatory requirements'
      ],
    },
    tldrSummary: 'You are responsible for security, legality, and understanding risks.',
    riskLevel: 'high',
    lastUpdated: '2026-03-22'
  },
  {
    id: 'prohibited-uses',
    title: 'Prohibited Uses',
    icon: AlertTriangle,
    iconVariant: 'destructive',
    content: {
      type: 'list',
      description: 'You agree not to use the Service for:',
      items: [
        'Any unlawful or fraudulent activity',
        'Money laundering, terrorist financing, or sanctions evasion',
        'Creating deceptive, malicious, or scam tokens',
        'Violating intellectual property rights',
        'Attempting to exploit, disrupt, or damage the Service',
        'Market manipulation or wash trading',
        'Creating tokens that violate securities laws'
      ],
    },
    tldrSummary: 'No illegal activities, scams, or market manipulation.',
    riskLevel: 'high',
    lastUpdated: '2026-03-22'
  },
  // Add remaining sections with enhancements...
  // (Continue with all existing sections, adding the new fields)
]
```

- [ ] **Step 4: Complete remaining sections with enhancements**

```typescript
// Add remaining sections to complete the array:
{
  id: 'financial-disclaimer',
  title: 'No Financial or Investment Advice',
  icon: AlertTriangle,
  iconVariant: 'warning',
  content: {
    type: 'list',
    description: 'You acknowledge that:',
    items: [
      'The Service does not provide financial, investment, or legal advice',
      'Nothing constitutes a recommendation or endorsement',
      'All actions are performed at your own risk',
      'You are solely responsible for evaluating risks',
    ],
  },
  tldrSummary: 'We give no financial advice - you decide everything at your own risk.',
  riskLevel: 'high',
  lastUpdated: '2026-03-22'
},
{
  id: 'no-reliance',
  title: 'No Reliance',
  icon: AlertTriangle,
  iconVariant: 'warning',
  content: {
    type: 'text',
    text: 'You acknowledge that you do not rely on the Service or any information provided by it as a substitute for independent judgment. You are solely responsible for your decisions and actions.',
  },
  tldrSummary: 'Don\'t rely on us for decisions - use your own judgment.',
  riskLevel: 'high',
  lastUpdated: '2026-03-22'
},
{
  id: 'risks',
  title: 'Risks',
  icon: AlertTriangle,
  iconVariant: 'warning',
  content: {
    type: 'list',
    description: 'Use of the Service involves significant risks, including:',
    items: [
      'Total loss of funds',
      'Smart contract vulnerabilities or bugs',
      'Irreversible blockchain transactions',
      'Market volatility',
      'Regulatory uncertainty',
      'Network failures or congestion',
    ],
  },
  tldrSummary: 'High risk of losing everything - blockchain is dangerous.',
  riskLevel: 'high',
  lastUpdated: '2026-03-22'
},
{
  id: 'third-party',
  title: 'Third-Party Services',
  icon: Globe,
  content: {
    type: 'list',
    description: 'The Service relies on third-party providers:',
    items: [
      'Blockchain networks (e.g., Solana)',
      'RPC providers (e.g., Alchemy)',
      'Hosting providers (e.g., Vercel)',
      'Wallet providers',
      'We are not responsible for their performance, security, or availability',
    ],
  },
  tldrSummary: 'We use third-party services that we don\'t control.',
  riskLevel: 'medium',
  lastUpdated: '2026-03-22'
},
{
  id: 'fees',
  title: 'Fees',
  icon: Scale,
  content: {
    type: 'list',
    description: 'Fees may apply:',
    items: [
      'Blockchain network fees are external and not controlled by us',
      'Platform fees may be displayed before execution',
      'Transactions are non-refundable once confirmed',
      'Fee structures may change at any time',
    ],
  },
  tldrSummary: 'Network fees apply and transactions are non-refundable.',
  riskLevel: 'medium',
  lastUpdated: '2026-03-22'
},
{
  id: 'no-warranties',
  title: 'No Warranties',
  icon: Shield,
  content: {
    type: 'list',
    description: 'The Service is provided without warranties:',
    items: [
      'No guarantee of uninterrupted or error-free operation',
      'No guarantee of accuracy or reliability',
      'The Service may be modified or discontinued at any time',
      'Use is at your sole risk',
    ],
  },
  tldrSummary: 'No promises - use at your own risk.',
  riskLevel: 'high',
  lastUpdated: '2026-03-22'
},
{
  id: 'limitation-liability',
  title: 'Limitation of Liability',
  icon: Shield,
  content: {
    type: 'text',
    text: 'To the maximum extent permitted by applicable law, we disclaim all liability for any loss, damage, or claim arising from your use of the Service, including loss of funds, data, or assets.',
  },
  tldrSummary: 'We are not liable for any losses or damages you suffer.',
  riskLevel: 'high',
  lastUpdated: '2026-03-22'
},
{
  id: 'indemnification',
  title: 'Indemnification',
  icon: Shield,
  content: {
    type: 'text',
    text: 'You agree to indemnify and hold harmless the operator of CloakForge from any claims, damages, or losses arising from your use of the Service or violation of these Terms.',
  },
  tldrSummary: 'You protect us from legal claims related to your use.',
  riskLevel: 'medium',
  lastUpdated: '2026-03-22'
},
{
  id: 'termination',
  title: 'Termination',
  icon: AlertTriangle,
  content: {
    type: 'list',
    description: 'We reserve the right to:',
    items: [
      'Restrict or terminate access at any time',
      'Modify or discontinue the Service without notice',
      'Take action in case of misuse or abuse',
    ],
  },
  tldrSummary: 'We can terminate your access at any time.',
  riskLevel: 'medium',
  lastUpdated: '2026-03-22'
},
{
  id: 'force-majeure',
  title: 'Force Majeure',
  icon: Globe,
  content: {
    type: 'text',
    text: 'We are not liable for failures or delays caused by events beyond our control, including network issues, blockchain failures, cyberattacks, or regulatory changes.',
  },
  tldrSummary: 'We\'re not responsible for things outside our control.',
  riskLevel: 'medium',
  lastUpdated: '2026-03-22'
},
{
  id: 'modifications',
  title: 'Changes to Terms',
  icon: Clock,
  content: {
    type: 'list',
    description: 'We may update these Terms:',
    items: ['Changes will be posted on this page', 'Continued use implies acceptance', 'Users should review periodically'],
  },
  tldrSummary: 'We can change these terms - check back regularly.',
  riskLevel: 'low',
  lastUpdated: '2026-03-22'
},
{
  id: 'governing-law',
  title: 'Governing Law',
  icon: Globe,
  content: {
    type: 'text',
    text: 'These Terms are governed by the laws of the Czech Republic. Any disputes shall be resolved by the competent courts of the Czech Republic.',
  },
  tldrSummary: 'Czech law applies, Czech courts handle disputes.',
  riskLevel: 'low',
  lastUpdated: '2026-03-22'
}
// Note: Contact section will be handled in Task 10 with dynamic content
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test src/components/pages/TermsOfServicePage/ContentSection/__tests__/termsData.test.ts`
Expected: PASS all tests

- [ ] **Step 6: Commit**

```bash
git add src/components/pages/TermsOfServicePage/ContentSection/termsData.ts src/components/pages/TermsOfServicePage/ContentSection/__tests__/termsData.test.ts
git commit -m "enhance(terms): add comprehensive legal protections and UX improvements

- Add prohibited jurisdictions section with comprehensive list
- Include enhanced user warranties and DeFi-specific risks
- Add regulatory compliance framework section
- Enhance all sections with TL;DR summaries and risk levels
- Update lastUpdated timestamps for transparency"
```

## Task 7: Prohibited Jurisdictions Checker Component

**Files:**
- Create: `src/components/common/ProhibitedJurisdictionsChecker/ProhibitedJurisdictionsChecker.tsx`
- Create: `src/components/common/ProhibitedJurisdictionsChecker/index.ts`
- Test: `src/components/common/ProhibitedJurisdictionsChecker/__tests__/ProhibitedJurisdictionsChecker.test.tsx`

- [ ] **Step 1: Write failing test for ProhibitedJurisdictionsChecker**

```typescript
// src/components/common/ProhibitedJurisdictionsChecker/__tests__/ProhibitedJurisdictionsChecker.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProhibitedJurisdictionsChecker } from '../ProhibitedJurisdictionsChecker'

// Mock the jurisdictions data
vi.mock('../../../lib/constants/prohibitedJurisdictions', () => ({
  getAllProhibitedJurisdictions: () => [
    'China (People\'s Republic of China)',
    'North Korea (Democratic People\'s Republic of Korea)',
    'New York (BitLicense requirements)'
  ],
  isJurisdictionProhibited: (jurisdiction: string) => {
    const prohibited = ['china', 'north korea', 'new york']
    return prohibited.some(p => jurisdiction.toLowerCase().includes(p))
  }
}))

describe('ProhibitedJurisdictionsChecker', () => {
  it('should render search input and jurisdictions list', () => {
    render(<ProhibitedJurisdictionsChecker />)

    expect(screen.getByPlaceholderText(/search jurisdictions/i)).toBeInTheDocument()
    expect(screen.getByText('China (People\'s Republic of China)')).toBeInTheDocument()
  })

  it('should filter jurisdictions based on search input', async () => {
    const user = userEvent.setup()
    render(<ProhibitedJurisdictionsChecker />)

    const searchInput = screen.getByPlaceholderText(/search jurisdictions/i)
    await user.type(searchInput, 'china')

    expect(screen.getByText('China (People\'s Republic of China)')).toBeInTheDocument()
    expect(screen.queryByText('North Korea')).not.toBeInTheDocument()
  })

  it('should show no results message when no matches', async () => {
    const user = userEvent.setup()
    render(<ProhibitedJurisdictionsChecker />)

    const searchInput = screen.getByPlaceholderText(/search jurisdictions/i)
    await user.type(searchInput, 'canada')

    expect(screen.getByText(/no jurisdictions found/i)).toBeInTheDocument()
  })

  it('should be accessible with proper labels', () => {
    render(<ProhibitedJurisdictionsChecker />)

    const searchInput = screen.getByLabelText(/search prohibited jurisdictions/i)
    expect(searchInput).toBeInTheDocument()

    const list = screen.getByRole('list')
    expect(list).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test src/components/common/ProhibitedJurisdictionsChecker/__tests__/ProhibitedJurisdictionsChecker.test.tsx`
Expected: FAIL with "Cannot find module '../ProhibitedJurisdictionsChecker'"

- [ ] **Step 3: Create ProhibitedJurisdictionsChecker component**

```typescript
// src/components/common/ProhibitedJurisdictionsChecker/ProhibitedJurisdictionsChecker.tsx
'use client'

import { useState } from 'react'
import { Search, MapPin } from 'lucide-react'
import { getAllProhibitedJurisdictions } from '@/lib/constants/prohibitedJurisdictions'

export interface ProhibitedJurisdictionsCheckerProps {
  className?: string
}

export const ProhibitedJurisdictionsChecker = ({
  className = ''
}: ProhibitedJurisdictionsCheckerProps): React.ReactNode => {
  const [searchTerm, setSearchTerm] = useState('')
  const allJurisdictions = getAllProhibitedJurisdictions()

  // Filter jurisdictions based on search term
  const filteredJurisdictions = !searchTerm
    ? allJurisdictions
    : allJurisdictions.filter(jurisdiction =>
        jurisdiction.toLowerCase().includes(searchTerm.toLowerCase())
      )

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="relative">
        <label htmlFor="jurisdiction-search" className="sr-only">
          Search prohibited jurisdictions
        </label>
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          id="jurisdiction-search"
          type="text"
          placeholder="Search jurisdictions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="border rounded-lg bg-background">
        <div className="p-3 border-b bg-muted/50">
          <h4 className="font-medium text-sm flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Prohibited Jurisdictions ({filteredJurisdictions.length})
          </h4>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {filteredJurisdictions.length > 0 ? (
            <ul role="list" className="divide-y divide-border">
              {filteredJurisdictions.map((jurisdiction, index) => (
                <li key={index} className="p-3 text-sm">
                  {jurisdiction}
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-4 text-center text-muted-foreground text-sm">
              No jurisdictions found matching "{searchTerm}"
            </div>
          )}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        This list is subject to change based on evolving regulations and sanctions.
        Users are responsible for verifying current legal status in their jurisdiction.
      </p>
    </div>
  )
}
```

- [ ] **Step 4: Create index file**

```typescript
// src/components/common/ProhibitedJurisdictionsChecker/index.ts
export { ProhibitedJurisdictionsChecker } from './ProhibitedJurisdictionsChecker'
export type { ProhibitedJurisdictionsCheckerProps } from './ProhibitedJurisdictionsChecker'
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test src/components/common/ProhibitedJurisdictionsChecker/__tests__/ProhibitedJurisdictionsChecker.test.tsx`
Expected: PASS all tests

- [ ] **Step 6: Commit**

```bash
git add src/components/common/ProhibitedJurisdictionsChecker/
git commit -m "feat(ui): add ProhibitedJurisdictionsChecker component

- Create interactive jurisdictions search and filter
- Include comprehensive list with search functionality
- Add accessibility attributes and responsive design
- Show dynamic count and disclaimer text"
```

## Task 8: Update Privacy Policy Component to Use Enhanced Data

**Files:**
- Modify: `src/components/pages/PrivacyPolicyPage/ContentSection/PrivacyContentSection.tsx`

- [ ] **Step 1: Write test for enhanced privacy component**

```typescript
// Create or update test file
// src/components/pages/PrivacyPolicyPage/ContentSection/__tests__/PrivacyContentSection.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PrivacyContentSection } from '../PrivacyContentSection'

describe('Enhanced PrivacyContentSection', () => {
  it('should render TL;DR summary boxes', () => {
    render(<PrivacyContentSection />)

    expect(screen.getAllByText('TL;DR')).toHaveLength(expect.any(Number))
    expect(screen.getByText(/We literally collect nothing/)).toBeInTheDocument()
  })

  it('should render risk level indicators', () => {
    render(<PrivacyContentSection />)

    expect(screen.getByText('High Risk')).toBeInTheDocument()
    expect(screen.getAllByText('Low Risk')).toHaveLength(expect.any(Number))
  })

  it('should render blockchain transparency warning prominently', () => {
    render(<PrivacyContentSection />)

    expect(screen.getByText(/WARNING: All blockchain transactions are public/)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test src/components/pages/PrivacyPolicyPage/ContentSection/__tests__/PrivacyContentSection.test.tsx`
Expected: FAIL due to missing TL;DR and risk indicators

- [ ] **Step 3: Update PrivacyContentSection to use new components**

```typescript
// Update src/components/pages/PrivacyPolicyPage/ContentSection/PrivacyContentSection.tsx
'use client'

import { motion } from 'framer-motion'
import { Lock } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { LegalNoticeCard } from '@/components/common/LegalNoticeCard'
import { LegalSection } from '@/components/common/LegalSection'
import { TldrSummaryBox } from '@/components/common/TldrSummaryBox'
import { RiskLevelIndicator } from '@/components/common/RiskLevelIndicator'
import { privacySectionsData } from './privacyData'

export const PrivacyContentSection = (): React.ReactNode => (
  <section className='px-6 py-16'>
    <div className='container mx-auto max-w-4xl'>
      {/* Privacy Promise */}
      <LegalNoticeCard
        content="CloakForge operates with zero data collection. We don't track, store, or monitor your activities. Your interactions are directly with the Solana blockchain, ensuring complete privacy and anonymity."
        icon={Lock}
        title='Our Privacy Promise'
        variant='info'
      />

      {/* Main Privacy Document */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        whileInView={{ opacity: 1, y: 0 }}
      >
        <Card className='border-border hover:border-secondary/20 border-2 transition-all duration-300'>
          <CardContent className='p-8 md:p-12'>
            {privacySectionsData.map((section, index) => (
              <div key={section.id}>
                <div className="mb-6">
                  {/* Section Header with Risk Level */}
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-medium flex items-center space-x-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                        section.iconVariant === 'warning'
                          ? 'bg-warning/80 text-warning-foreground/80'
                          : section.iconVariant === 'primary'
                          ? 'bg-primary/10 text-primary'
                          : 'bg-secondary/10 text-secondary'
                      }`}>
                        <section.icon className='h-5 w-5' />
                      </div>
                      <span>{section.title}</span>
                    </h2>
                    {section.riskLevel && (
                      <RiskLevelIndicator level={section.riskLevel} />
                    )}
                  </div>

                  {/* TL;DR Summary */}
                  {section.tldrSummary && (
                    <TldrSummaryBox
                      summary={section.tldrSummary}
                      variant={section.riskLevel === 'high' ? 'warning' : 'info'}
                    />
                  )}

                  {/* Section Content */}
                  <LegalSection
                    description={section.description}
                    icon={section.icon}
                    iconVariant={section.iconVariant}
                    listItems={section.listItems}
                    title={section.title}
                  />

                  {/* Last Updated */}
                  {section.lastUpdated && (
                    <p className="text-xs text-muted-foreground mt-4">
                      Last updated: {section.lastUpdated}
                    </p>
                  )}
                </div>

                {index < privacySectionsData.length - 1 && <Separator className='my-8' />}
              </div>
            ))}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  </section>
)
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test src/components/pages/PrivacyPolicyPage/ContentSection/__tests__/PrivacyContentSection.test.tsx`
Expected: PASS all tests

- [ ] **Step 5: Commit**

```bash
git add src/components/pages/PrivacyPolicyPage/ContentSection/PrivacyContentSection.tsx src/components/pages/PrivacyPolicyPage/ContentSection/__tests__/PrivacyContentSection.test.tsx
git commit -m "enhance(privacy-ui): integrate TL;DR summaries and risk indicators

- Add TldrSummaryBox components for improved readability
- Include RiskLevelIndicator for user awareness
- Show last updated timestamps for transparency
- Improve visual hierarchy and accessibility"
```

## Task 9: Update Terms of Service Component to Use Enhanced Data

**Files:**
- Modify: `src/components/pages/TermsOfServicePage/ContentSection/TermsContent.tsx`

- [ ] **Step 1: Write failing test for enhanced TermsContent component**

```typescript
// Create or update test file
// src/components/pages/TermsOfServicePage/ContentSection/__tests__/TermsContent.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TermsContent } from '../TermsContent'

describe('Enhanced TermsContent', () => {
  it('should render TL;DR summary boxes', () => {
    render(<TermsContent />)

    expect(screen.getAllByText('TL;DR')).toHaveLength(expect.any(Number))
    expect(screen.getByText(/Using CloakForge means you agree/)).toBeInTheDocument()
  })

  it('should render risk level indicators', () => {
    render(<TermsContent />)

    expect(screen.getByText('High Risk')).toBeInTheDocument()
    expect(screen.getAllByText('Low Risk')).toHaveLength(expect.any(Number))
  })

  it('should render last updated timestamps', () => {
    render(<TermsContent />)

    expect(screen.getAllByText(/Updated: 2026-03-22/)).toHaveLength(expect.any(Number))
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test src/components/pages/TermsOfServicePage/ContentSection/__tests__/TermsContent.test.tsx`
Expected: FAIL due to missing TL;DR and risk indicators

- [ ] **Step 3: Update TermsContent component to use new data structure**

```typescript
// Update src/components/pages/TermsOfServicePage/ContentSection/TermsContent.tsx
'use client'

import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { TermsSection } from './TermsSection'
import { TermsList } from './TermsList'
import { TldrSummaryBox } from '@/components/common/TldrSummaryBox'
import { RiskLevelIndicator } from '@/components/common/RiskLevelIndicator'
import { termsData } from './termsData'

export const TermsContent = (): React.ReactNode => (
  <motion.div initial={{ opacity: 0, y: 30 }} transition={{ duration: 0.8 }} viewport={{ once: true }} whileInView={{ opacity: 1, y: 0 }}>
    <Card className='border-border hover:border-primary/20 border-2 transition-all duration-300'>
      <CardContent className='p-8 md:p-12'>
        {termsData.map((section, index) => (
          <div key={section.id} className="mb-8">
            {/* TL;DR Summary */}
            {section.tldrSummary && (
              <TldrSummaryBox
                summary={section.tldrSummary}
                variant={section.riskLevel === 'high' ? 'warning' : 'info'}
              />
            )}

            {/* Risk Level Indicator */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                {section.riskLevel && (
                  <RiskLevelIndicator level={section.riskLevel} />
                )}
              </div>
              {section.lastUpdated && (
                <span className="text-xs text-muted-foreground">
                  Updated: {section.lastUpdated}
                </span>
              )}
            </div>

            <TermsSection
              icon={section.icon}
              iconVariant={section.iconVariant}
              sectionNumber={index + 1}
              title={section.title}
            >
              {section.content.type === 'text' ? (
                <p className='text-muted-foreground leading-relaxed'>{section.content.text}</p>
              ) : (
                <TermsList description={section.content.description} items={section.content.items || []} />
              )}
            </TermsSection>

            {index < termsData.length - 1 && <hr className="border-border my-8" />}
          </div>
        ))}
      </CardContent>
    </Card>
  </motion.div>
)
```

- [ ] **Step 2: Run build to verify component integration**

Run: `npm run build`
Expected: Successful build with no TypeScript errors

- [ ] **Step 3: Run tests to verify functionality**

Run: `npm test src/components/pages/TermsOfServicePage/`
Expected: PASS all tests

- [ ] **Step 4: Commit**

```bash
git add src/components/pages/TermsOfServicePage/ContentSection/TermsContent.tsx
git commit -m "enhance(terms-ui): integrate TL;DR summaries and risk indicators

- Add TldrSummaryBox components for improved user experience
- Include RiskLevelIndicator for risk awareness
- Display last updated timestamps
- Maintain existing TermsSection structure compatibility"
```

## Task 10: Legal Entity Information Integration

**Files:**
- Modify: `src/components/pages/TermsOfServicePage/ContentSection/termsData.ts`
- Modify: `src/components/pages/PrivacyPolicyPage/ContentSection/privacyData.ts`

- [ ] **Step 1: Write test for legal entity integration**

```typescript
// Add to existing test file
// src/lib/config/__tests__/legalConfig.test.ts (update existing file)
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { getLegalEntityInfo } from '../legalConfig'

describe('Legal Entity Integration', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv }
    process.env.LEGAL_ENTITY_NAME = 'CloakForge s.r.o.'
    process.env.LEGAL_ENTITY_ADDRESS = 'Prague, Czech Republic'
    process.env.LEGAL_ENTITY_ICO = '12345678'
    process.env.LEGAL_CONTACT_EMAIL = 'legal@cloakforge.com'
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('should format contact information correctly', () => {
    const info = getLegalEntityInfo()

    expect(info.name).toBe('CloakForge s.r.o.')
    expect(info.address).toBe('Prague, Czech Republic')
    expect(info.ico).toBe('12345678')
    expect(info.email).toBe('legal@cloakforge.com')
  })
})
```

- [ ] **Step 2: Run test to verify current state**

Run: `npm test src/lib/config/__tests__/legalConfig.test.ts`
Expected: PASS

- [ ] **Step 3: Create helper function for contact information formatting**

```typescript
// Add to src/lib/config/legalConfig.ts
export function formatContactInformation(): string[] {
  try {
    const info = getLegalEntityInfo()
    return [
      `Name: ${info.name}`,
      `Address: ${info.address}`,
      `IČO: ${info.ico}`,
      `Email: ${info.email}`
    ]
  } catch (error) {
    // Fallback for build-time when env vars may not be available
    return [
      'Name: [LEGAL_ENTITY_NAME required]',
      'Address: [LEGAL_ENTITY_ADDRESS required]',
      'IČO: [LEGAL_ENTITY_ICO required]',
      'Email: [LEGAL_CONTACT_EMAIL required]'
    ]
  }
}
```

- [ ] **Step 4: Update terms data to use dynamic contact information with build-time safety**

```typescript
// Update the contact section in src/components/pages/TermsOfServicePage/ContentSection/termsData.ts
import { formatContactInformation } from '@/lib/config/legalConfig'

// Add this section to the termsData array:
{
  id: 'contact',
  title: 'Contact Information',
  icon: Mail,
  content: {
    type: 'list',
    description: 'Service operator:',
    items: formatContactInformation()
  },
  tldrSummary: 'Contact information for legal and support inquiries.',
  riskLevel: 'low',
  lastUpdated: '2026-03-22'
}
```

- [ ] **Step 5: Update privacy data to use dynamic contact information with build-time safety**

```typescript
// Update the contact section in src/components/pages/PrivacyPolicyPage/ContentSection/privacyData.ts
import { getLegalEntityInfo } from '@/lib/config/legalConfig'

function getPrivacyContactEmail(): string {
  try {
    return getLegalEntityInfo().email
  } catch (error) {
    return '[LEGAL_CONTACT_EMAIL required]'
  }
}

// Update the contact section in the privacySectionsData array:
{
  id: 'contact',
  title: 'Contact Information',
  description: 'For privacy-related inquiries:',
  listItems: [
    `Email: ${getPrivacyContactEmail()}`,
    'GitHub Issues: https://github.com/[username]/cloakforge/issues',
    'We respond to privacy concerns promptly',
    'No personal information required to contact us',
  ],
  icon: Mail,
  tldrSummary: 'Contact us for privacy questions - no personal info needed.',
  riskLevel: 'low',
  lastUpdated: '2026-03-22'
}
```

- [ ] **Step 6: Run build to verify integration**

Run: `npm run build`
Expected: Successful build

- [ ] **Step 7: Run tests to verify functionality**

Run: `npm test`
Expected: PASS all tests

- [ ] **Step 8: Commit**

```bash
git add src/lib/config/legalConfig.ts src/components/pages/TermsOfServicePage/ContentSection/termsData.ts src/components/pages/PrivacyPolicyPage/ContentSection/privacyData.ts
git commit -m "integrate(legal): add dynamic legal entity information

- Connect legal documents to environment variable configuration
- Add formatContactInformation helper function
- Update contact sections to use dynamic legal entity data
- Ensure production deployment validation works correctly"
```

## Task 11: Add ProhibitedJurisdictionsChecker to Terms Page

**Files:**
- Modify: `src/components/pages/TermsOfServicePage/ContentSection/ContentSection.tsx`

- [ ] **Step 1: Update ContentSection to include jurisdictions checker**

```typescript
// Update src/components/pages/TermsOfServicePage/ContentSection/ContentSection.tsx
'use client'

import { ImportantNotice } from './ImportantNotice'
import { TermsContent } from './TermsContent'
import { FooterCTA } from './FooterCTA'
import { ProhibitedJurisdictionsChecker } from '@/components/common/ProhibitedJurisdictionsChecker'

export const ContentSection = (): React.ReactNode => (
  <section className='px-6 py-16'>
    <div className='container mx-auto max-w-4xl'>
      <ImportantNotice />

      {/* Add Prohibited Jurisdictions Checker */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4">Check Jurisdiction Restrictions</h3>
        <ProhibitedJurisdictionsChecker />
      </div>

      <TermsContent />
      <FooterCTA />
    </div>
  </section>
)
```

- [ ] **Step 2: Write test for updated ContentSection**

```typescript
// Create or update test file
// src/components/pages/TermsOfServicePage/ContentSection/__tests__/ContentSection.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ContentSection } from '../ContentSection'

// Mock the ProhibitedJurisdictionsChecker component
vi.mock('../../../../common/ProhibitedJurisdictionsChecker', () => ({
  ProhibitedJurisdictionsChecker: () => (
    <div data-testid="prohibited-jurisdictions-checker">Jurisdictions Checker</div>
  )
}))

describe('ContentSection', () => {
  it('should render all section components', () => {
    render(<ContentSection />)

    expect(screen.getByText(/Check Jurisdiction Restrictions/)).toBeInTheDocument()
    expect(screen.getByTestId('prohibited-jurisdictions-checker')).toBeInTheDocument()
  })

  it('should render components in correct order', () => {
    render(<ContentSection />)

    const section = screen.getByRole('region')
    const children = Array.from(section.children)

    // Should have notice, jurisdictions checker, content, and footer
    expect(children).toHaveLength(4)
  })
})
```

- [ ] **Step 3: Run test to verify it passes**

Run: `npm test src/components/pages/TermsOfServicePage/ContentSection/__tests__/ContentSection.test.tsx`
Expected: PASS all tests

- [ ] **Step 4: Run build to verify integration**

Run: `npm run build`
Expected: Successful build

- [ ] **Step 5: Commit**

```bash
git add src/components/pages/TermsOfServicePage/ContentSection/ContentSection.tsx src/components/pages/TermsOfServicePage/ContentSection/__tests__/ContentSection.test.tsx
git commit -m "feat(terms): add prohibited jurisdictions checker to terms page

- Integrate ProhibitedJurisdictionsChecker component
- Add section header for jurisdiction restrictions
- Improve user experience with interactive jurisdiction lookup
- Maintain component order and accessibility"
```

## Task 12: Final Integration and Testing

**Files:**
- Test: All components integration
- Update: Build scripts validation

- [ ] **Step 1: Run comprehensive test suite**

Run: `npm test`
Expected: PASS all tests

- [ ] **Step 2: Run type checking**

Run: `npx tsc --noEmit`
Expected: No TypeScript errors

- [ ] **Step 3: Run build with environment validation**

```bash
# Test production build validation
LEGAL_ENTITY_NAME="Test Company" LEGAL_ENTITY_ADDRESS="Test Address" LEGAL_ENTITY_ICO="12345" LEGAL_CONTACT_EMAIL="test@test.com" npm run build
```
Expected: Successful build

- [ ] **Step 4: Test development fallback behavior**

```bash
# Test development mode with missing env vars
npm run build
```
Expected: Build succeeds with placeholder values

- [ ] **Step 5: Run lint checks**

Run: `npm run lint:nowarn`
Expected: Zero lint warnings

- [ ] **Step 6: Verify all new components are accessible**

Check that all new components have proper accessibility attributes:
- TldrSummaryBox uses role="region"
- RiskLevelIndicator uses role="status"
- ProhibitedJurisdictionsChecker uses proper labels

- [ ] **Step 7: Final commit**

```bash
git add .
git commit -m "complete(legal): finalize legal document improvements implementation

- All components integrated and tested
- Environment variable validation working
- TL;DR summaries and risk indicators functional
- Prohibited jurisdictions checker operational
- Full test coverage and accessibility compliance
- Ready for production deployment with legal entity configuration"
```

## Summary

This implementation plan provides:

✅ **Legal Protection**: Enhanced disclaimers, user warranties, comprehensive risk disclosures
✅ **Regulatory Compliance**: Prohibited jurisdictions, regulatory frameworks, sanctions compliance
✅ **User Experience**: TL;DR summaries, risk indicators, interactive jurisdictions checker
✅ **Technical Integration**: Environment variable system, enhanced data structures, accessibility
✅ **Global Coverage**: Comprehensive jurisdictions list, regulatory acknowledgments
✅ **Maintainability**: Modular components, clear interfaces, comprehensive testing

**Post-Implementation Requirements:**
1. Configure environment variables with actual legal entity information
2. Set up monthly review cycle for prohibited jurisdictions updates
3. Monitor regulatory changes for compliance updates
4. Review legal language with qualified counsel for jurisdiction-specific requirements

The implementation follows TDD principles, maintains existing component compatibility, and provides comprehensive legal protection while improving user experience.