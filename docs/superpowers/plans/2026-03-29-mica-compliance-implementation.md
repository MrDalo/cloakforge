# MiCA-Compliant Legal Positioning Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform CloakForge Terms of Service from potentially MiCA non-compliant to bulletproof regulatory compliance by repositioning as technical infrastructure provider.

**Architecture:** Modify existing termsData.ts structure to add new sections and enhance existing ones, maintaining TypeScript interfaces while strategically repositioning legal language from denial-first to positive infrastructure positioning.

**Tech Stack:** TypeScript, Lucide React icons, existing Terms of Service component architecture

---

### Task 1: Add New Technical Architecture Section

**Files:**
- Modify: `src/components/pages/TermsOfServicePage/ContentSection/termsData.ts:1-398`

- [ ] **Step 1: Import Server icon for new section**

Add Server icon to existing imports at the top:

```typescript
import {
  Shield,
  Scale,
  FileText,
  AlertTriangle,
  Lock,
  Clock,
  Globe,
  Mail,
  UserCheck,
  Ban,
  Gavel,
  ServerCrash,
  Coins,
  Server, // Add this line
  type LucideIcon,
} from 'lucide-react'
```

- [ ] **Step 2: Add technical architecture section after service-description**

Insert new section after line 76 (after service-description section ends):

```typescript
  {
    id: 'technical-architecture',
    title: 'Technical Architecture and Infrastructure Role',
    icon: Server,
    content: {
      type: 'list',
      description: 'CloakForge operates as a technical interface layer that connects users directly to blockchain networks:',
      items: [
        'Users interact directly with native Solana protocols and smart contracts through our interface',
        'We do not deploy, control, or manage smart contracts on behalf of users',
        'Token creation utilizes Solana\'s native Token Program and Metadata Program directly',
        'We provide transaction building and interface functionality only',
        'All blockchain operations are executed between the user\'s wallet and the network',
        'Our fee (0.1 SOL) is embedded as a standard transfer instruction within user-signed transactions',
      ],
    },
  },
```

- [ ] **Step 3: Verify TypeScript compilation**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Test rendering in browser**

Run: `npm run dev`
Navigate to: `http://localhost:3001/legal/terms-of-service`
Expected: New "Technical Architecture and Infrastructure Role" section appears after "Nature of the Service"

- [ ] **Step 5: Commit technical architecture addition**

```bash
git add src/components/pages/TermsOfServicePage/ContentSection/termsData.ts
git commit -m "feat(legal): add technical architecture section for MiCA compliance

- Establishes CloakForge as technical infrastructure provider
- Documents direct user-blockchain interaction model
- Clarifies transaction building vs issuance role"
```

### Task 2: Restructure MiCA Section with Positive Positioning

**Files:**
- Modify: `src/components/pages/TermsOfServicePage/ContentSection/termsData.ts:95-112`

- [ ] **Step 1: Replace existing mica-positioning section content**

Replace the existing mica-positioning section (lines 95-112) with new positive positioning:

```typescript
  {
    id: 'mica-positioning',
    title: 'MiCA and Crypto Regulatory Positioning',
    icon: Gavel,
    content: {
      type: 'list',
      description:
        'For purposes of EU crypto regulation, including Regulation (EU) 2023/1114 on markets in crypto-assets ("MiCA"), and similar laws in other jurisdictions, CloakForge operates as follows:',
      items: [
        'We operate as a technical infrastructure provider and software interface only',
        'We provide tools that enable direct user interaction with public blockchain protocols',
        'Users create, configure, and deploy tokens through direct interaction with Solana\'s native protocols via our interface',
        'We provide transaction building tools - users maintain full control and execute all operations through their own wallets',
        'We do not intentionally hold ourselves out as a crypto-asset service provider (CASP)',
        'We do not prepare, approve, verify, or publish crypto-asset white papers for users',
        'Any token or crypto-asset created using our interface is created solely by the user through direct blockchain interaction',
        'All compliance obligations relating to token creation, issuance, marketing, disclosure, consumer protection, anti-money laundering, sanctions, securities laws, or MiCA remain solely with the user',
      ],
    },
  },
```

- [ ] **Step 2: Verify TypeScript compilation**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Test updated MiCA section rendering**

Navigate to: `http://localhost:3001/legal/terms-of-service`
Expected: MiCA section now leads with positive infrastructure positioning instead of denials

- [ ] **Step 4: Commit MiCA section restructuring**

```bash
git add src/components/pages/TermsOfServicePage/ContentSection/termsData.ts
git commit -m "feat(legal): restructure MiCA section with positive positioning

- Lead with infrastructure provider role instead of denials
- Remove problematic 'do not issue crypto-assets' language
- Emphasize user direct blockchain interaction model
- Maintain regulatory compliance stance"
```

### Task 3: Enhance Service Description Section

**Files:**
- Modify: `src/components/pages/TermsOfServicePage/ContentSection/termsData.ts:62-76`

- [ ] **Step 1: Replace service-description section content**

Replace the existing service-description section (lines 62-76) with enhanced positioning:

```typescript
  {
    id: 'service-description',
    title: 'Nature of the Service',
    icon: FileText,
    content: {
      type: 'list',
      description: 'CloakForge is a non-custodial software interface and transaction building platform that:',
      items: [
        'Provides technical tools for building transactions that interact with public blockchain networks, including Solana',
        'Enables users to construct and prepare blockchain transactions through our interface, which users execute via their own wallets',
        'Operates as technical infrastructure connecting user interfaces to blockchain protocols',
        'Processes transaction building requests without custody of user funds, crypto-assets, private keys, seed phrases, or accounts',
        'Relies on third-party infrastructure such as wallet providers, hosting providers, CDNs, and blockchain RPC providers',
        'Is provided on an "as is" and "as available" basis with all operations executed by users through direct blockchain interaction',
      ],
    },
  },
```

- [ ] **Step 2: Verify TypeScript compilation**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Test enhanced service description**

Navigate to: `http://localhost:3001/legal/terms-of-service`
Expected: "Nature of the Service" section now emphasizes transaction building platform role

- [ ] **Step 4: Commit service description enhancement**

```bash
git add src/components/pages/TermsOfServicePage/ContentSection/termsData.ts
git commit -m "feat(legal): enhance service description with infrastructure positioning

- Emphasize transaction building platform role
- Clarify user wallet execution model
- Strengthen technical infrastructure positioning"
```

### Task 4: Add New Token Creation User Responsibilities Section

**Files:**
- Modify: `src/components/pages/TermsOfServicePage/ContentSection/termsData.ts` (after user-responsibilities section)

- [ ] **Step 1: Find insertion point after user-responsibilities section**

Locate the end of the user-responsibilities section (around line 163) and prepare to insert new section before token-responsibility section.

- [ ] **Step 2: Insert token creation user authority section**

Add new section after user-responsibilities section ends:

```typescript
  {
    id: 'token-creation-user-authority',
    title: 'Token Creation and User Authority',
    icon: AlertTriangle,
    iconVariant: 'warning',
    content: {
      type: 'list',
      description: 'When using our transaction building tools for token-related operations:',
      items: [
        'You are the sole creator, controller, and responsible party for any tokens created through our interface',
        'You interact directly with Solana blockchain protocols through your own wallet and credentials',
        'You maintain complete authority over token parameters, metadata, and all blockchain operations',
        'You are responsible for all legal compliance, including securities laws, consumer protection, tax obligations, and MiCA requirements in your jurisdiction',
        'We do not review, approve, endorse, or take responsibility for any tokens created using our tools',
        'You must ensure all token creation activities comply with applicable laws and regulations',
      ],
    },
  },
```

- [ ] **Step 3: Verify TypeScript compilation**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Test new token creation section rendering**

Navigate to: `http://localhost:3001/legal/terms-of-service`
Expected: New "Token Creation and User Authority" section appears with warning icon

- [ ] **Step 5: Commit token creation user authority section**

```bash
git add src/components/pages/TermsOfServicePage/ContentSection/termsData.ts
git commit -m "feat(legal): add dedicated token creation user authority section

- Establish user as sole creator and controller
- Emphasize direct blockchain interaction
- Clarify user compliance responsibilities
- Separate token creation from general platform use"
```

### Task 5: Enhance Fees and Payments Section

**Files:**
- Modify: `src/components/pages/TermsOfServicePage/ContentSection/termsData.ts:131-148`

- [ ] **Step 1: Replace fees section content**

Replace the existing fees section (lines 131-148) with enhanced embedded fee explanation:

```typescript
  {
    id: 'fees',
    title: 'Fees and Payments',
    icon: Coins,
    content: {
      type: 'list',
      description: 'Your use of our transaction building tools involves blockchain fees that are embedded in the transactions you execute:',
      items: [
        'Our transaction building tools include a service fee (such as 0.1 SOL for token creation) embedded as a standard transfer instruction within the blockchain transaction',
        'This fee is processed as part of the blockchain transaction you sign and execute through your own wallet',
        'You maintain full visibility and control - all fees are displayed in the transaction preview before you sign',
        'By signing a transaction, you authorize and execute all transfers and fee payments reflected in that transaction',
        'Blockchain network fees, validator fees, priority fees, and similar charges are separate network costs beyond our control',
        'All blockchain transactions, once signed and submitted by you, are final and irreversible',
        'We may update our service fees by modifying the transaction building parameters reflected in our interface',
      ],
    },
  },
```

- [ ] **Step 2: Verify TypeScript compilation**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Test enhanced fees section**

Navigate to: `http://localhost:3001/legal/terms-of-service`
Expected: Fees section now emphasizes embedded blockchain transaction model

- [ ] **Step 4: Commit fees section enhancement**

```bash
git add src/components/pages/TermsOfServicePage/ContentSection/termsData.ts
git commit -m "feat(legal): enhance fees section with embedded transaction model

- Clarify fees as embedded blockchain operations
- Emphasize user visibility and control
- Document transaction building fee structure"
```

### Task 6: Final Integration Testing and Validation

**Files:**
- Test: `src/components/pages/TermsOfServicePage/ContentSection/termsData.ts`

- [ ] **Step 1: Run full TypeScript compilation check**

Run: `npx tsc --noEmit`
Expected: No errors across entire project

- [ ] **Step 2: Run linting check**

Run: `npm run lint:nowarn`
Expected: No warnings or errors

- [ ] **Step 3: Test complete Terms of Service page**

Navigate to: `http://localhost:3001/legal/terms-of-service`
Verify all sections render properly:
- Technical Architecture section appears after Nature of Service
- MiCA section uses positive positioning
- Token Creation User Authority section exists with warning styling
- Enhanced service description and fees sections display correctly

- [ ] **Step 4: Verify section ordering and flow**

Check that sections flow logically:
1. Acceptance of Terms
2. Eligibility
3. Nature of the Service (enhanced)
4. Technical Architecture (new)
5. Regulatory Positioning
6. MiCA and Crypto Regulatory Positioning (restructured)
7. Non-Custodial Nature
8. Fees and Payments (enhanced)
9. User Responsibilities
10. Token Creation and User Authority (new)
11. [remaining sections...]

- [ ] **Step 5: Final commit with comprehensive description**

```bash
git add .
git commit -m "feat(legal): complete MiCA-compliant Terms of Service transformation

SUMMARY:
- Transform from denial-first to positive infrastructure positioning
- Establish CloakForge as technical interface provider, not asset issuer
- Remove contradictory 'do not issue crypto-assets' language
- Add comprehensive user authority sections for token operations

CHANGES:
- Add Technical Architecture section establishing infrastructure role
- Restructure MiCA section with positive positioning
- Enhance Service Description with transaction building emphasis
- Add dedicated Token Creation User Authority section
- Enhance Fees section with embedded transaction model

COMPLIANCE BENEFITS:
- Resolves MiCA contradiction with Token Creator functionality
- Establishes clear non-CASP positioning under EU regulations
- Documents user direct blockchain interaction model
- Provides defensive but professional legal framework

Co-Authored-By: Claude Sonnet 4 <noreply@anthropic.com>"
```

### Task 7: Documentation Update

**Files:**
- Create: `docs/legal/mica-compliance-implementation-notes.md`

- [ ] **Step 1: Document implementation summary**

Create documentation file:

```markdown
# MiCA Compliance Implementation Summary

**Date:** 2026-03-29
**Objective:** Resolve MiCA compliance contradiction in Terms of Service

## Changes Implemented

### 1. Technical Architecture Section (New)
- **Purpose:** Establish infrastructure provider positioning before regulatory claims
- **Key Message:** Users interact directly with Solana protocols via our interface
- **Position:** After "Nature of the Service", before regulatory sections

### 2. MiCA Section Restructuring
- **Change:** Lead with positive positioning instead of denials
- **Removed:** Problematic "We do not issue crypto-assets" language
- **Added:** Clear infrastructure provider and user direct interaction language

### 3. Enhanced Service Description
- **Enhancement:** Stronger "transaction building platform" positioning
- **Emphasis:** User wallet execution and technical infrastructure role

### 4. Token Creation User Authority Section (New)
- **Purpose:** Dedicated section establishing user ownership and control
- **Position:** After general user responsibilities, before prohibited uses
- **Styling:** Warning icon to emphasize importance

### 5. Enhanced Fees Section
- **Clarification:** Embedded blockchain transaction model
- **Transparency:** User visibility and control emphasis

## Compliance Benefits

- ✅ Resolves MiCA contradiction with platform functionality
- ✅ Establishes clear non-CASP positioning under EU regulations
- ✅ Documents technical architecture supporting compliance claims
- ✅ Allocates legal responsibility appropriately to users
- ✅ Maintains professional tone while providing strong legal protection

## Technical Implementation

- **File Modified:** `src/components/pages/TermsOfServicePage/ContentSection/termsData.ts`
- **Interface Changes:** None - used existing TypeScript structure
- **Icon Added:** Server icon for technical architecture section
- **Testing:** Manual browser testing at http://localhost:3001/legal/terms-of-service

## Risk Mitigation Achieved

- **Regulatory Risk:** Clear infrastructure provider positioning vs crypto-asset service provider
- **Business Risk:** Language aligns with actual platform functionality and business model
- **Legal Risk:** Comprehensive user responsibility allocation and limitation of liability
- **Operational Risk:** No changes to core platform functionality or user experience
```

- [ ] **Step 2: Commit documentation**

```bash
git add docs/legal/mica-compliance-implementation-notes.md
git commit -m "docs(legal): add MiCA compliance implementation summary

Document the complete transformation from potentially non-compliant
to defensively compliant Terms of Service positioning."
```

## Self-Review

**1. Spec coverage:**
- ✅ Technical Architecture section - Task 1
- ✅ Restructured MiCA section - Task 2
- ✅ Enhanced Service Description - Task 3
- ✅ Token Creation User Responsibilities - Task 4
- ✅ Enhanced Fees section - Task 5
- ✅ Integration testing - Task 6
- ✅ Documentation - Task 7

**2. Placeholder scan:** No TBD, TODO, or placeholder content found. All code blocks contain complete implementation.

**3. Type consistency:** All section objects use consistent `TermsSectionData` interface structure with id, title, icon, and content properties. Icon imports and content structure match existing patterns.