# MiCA-Compliant Legal Positioning Design

**Date:** 2026-03-29
**Project:** CloakForge Terms of Service Enhancement
**Objective:** Transform legal positioning from potential MiCA non-compliance to bulletproof regulatory compliance

## Executive Summary

CloakForge currently faces a potential MiCA compliance issue: the Terms of Service claim "We do not issue crypto-assets" while providing a Token Creator tool and other token management functionality. This design addresses the issue through strategic legal restructuring that positions CloakForge as a **technical infrastructure provider** rather than a crypto-asset service provider.

## Current State Analysis

**Business Model:** Hybrid model with pure infrastructure approach
- **Fee Structure:** Transaction-embedded fees (0.1 SOL per token creation)
- **Platform Relationship:** Pure infrastructure - users interact directly with Solana contracts
- **Technical Architecture:** Non-custodial, transaction building interface

**Legal Risk:** Current MiCA section language creates contradiction with platform functionality

**Available Tools:**
- Token Creator, Burn Tokens, Create Liquidity
- Freeze/Unfreeze Wallets, Authority Revocation
- Token Auditor, Transaction Multisender

## Design Strategy

**Core Positioning Transformation:**
```
FROM: "We do not issue crypto-assets" (denial-first approach)
TO: "We provide transaction building tools" (positive infrastructure positioning)
```

**Legal Architecture:**
1. **Early Infrastructure Establishment** → Technical Architecture section
2. **Positive MiCA Positioning** → Lead with what we ARE, not what we're NOT
3. **User Authority Emphasis** → Dedicated token creation responsibility section
4. **Technical Clarity** → Enhanced service descriptions
5. **Transparent Fee Model** → Embedded blockchain transaction explanation

## Implementation Specification

### 1. New Technical Architecture Section

**Position:** Insert after "Nature of the Service", before "Regulatory Positioning"

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

**Strategic Purpose:** Establishes technical foundation before regulatory claims

### 2. Restructured MiCA Section

**Current Issue:** Leads with denials that contradict platform functionality
**Solution:** Lead with positive infrastructure positioning

```typescript
{
  id: 'mica-positioning',
  title: 'MiCA and Crypto Regulatory Positioning',
  icon: Gavel,
  content: {
    type: 'list',
    description: 'For purposes of EU crypto regulation, including Regulation (EU) 2023/1114 on markets in crypto-assets ("MiCA"), and similar laws in other jurisdictions, CloakForge operates as follows:',
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

**Key Changes:**
- ✅ Removed problematic "We do not issue crypto-assets" language
- ✅ Leads with positive infrastructure positioning
- ✅ Clarifies user-blockchain interaction model
- ✅ Maintains regulatory compliance stance

### 3. New Token Creation User Responsibilities Section

**Position:** After "User Responsibilities", before "Prohibited Uses"

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

**Strategic Purpose:** Dedicated section establishing user ownership and control

### 4. Enhanced Service Description Section

**Enhancement:** Strengthen infrastructure positioning and technical clarity

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

**Key Enhancements:**
- **"Transaction building platform"** - clarifies technical role
- **"Users execute via their own wallets"** - emphasizes user control
- **"Technical infrastructure connecting"** - reinforces positioning
- **"Direct blockchain interaction"** - supports compliance stance

### 5. Enhanced Fees and Payments Section

**Enhancement:** Clarify embedded transaction model for regulatory transparency

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

**Key Benefits:**
- **Embedded blockchain operation** - shows normal transaction structure
- **User visibility and control** - transparency emphasis
- **Technical accuracy** - reflects actual fee implementation

## Compliance Benefits

### MiCA Compliance Strengthening
- ✅ **Infrastructure Provider Positioning** - clear non-CASP stance
- ✅ **User Direct Interaction** - eliminates intermediary concerns
- ✅ **Technical Transparency** - shows actual blockchain architecture
- ✅ **User Authority Emphasis** - establishes user as responsible party
- ✅ **No Issuance Claims** - removes contradictory language

### Regulatory Risk Mitigation
- ✅ **Multi-jurisdictional Coverage** - not just EU-specific
- ✅ **Defensive but Professional** - strong protection without paranoia
- ✅ **Comprehensive User Responsibilities** - clear liability allocation
- ✅ **Technical Architecture Documentation** - supports infrastructure claims

### Business Benefits
- ✅ **Maintains Professional Tone** - doesn't alienate users
- ✅ **Supports Business Model** - aligns with pure infrastructure approach
- ✅ **Scalable Framework** - supports additional tools and features
- ✅ **Self-Contained Legal Strategy** - comprehensive without counsel dependency

## Implementation Requirements

### Technical Implementation
1. **Update termsData.ts** - modify existing sections and add new ones
2. **Maintain existing TypeScript interfaces** - no structural changes required
3. **Update section ordering** - insert new sections in strategic positions
4. **Test rendering** - verify all new content displays properly

### Content Management
1. **Version control** - commit changes with clear documentation
2. **Effective date handling** - coordinate with existing terms update process
3. **User notification** - follow existing terms change notification process

### Review Process
1. **Internal consistency check** - ensure all sections align
2. **Technical accuracy verification** - confirm platform architecture claims
3. **Regulatory positioning audit** - verify MiCA compliance improvements

## Success Criteria

### Legal Compliance
- [ ] MiCA contradiction resolved
- [ ] Infrastructure positioning established throughout document
- [ ] User responsibility clearly allocated
- [ ] Technical architecture transparently documented

### Business Continuity
- [ ] Professional tone maintained
- [ ] User experience not degraded
- [ ] Business model accurately reflected
- [ ] Scalability preserved for future tools

### Risk Mitigation
- [ ] Regulatory exposure minimized
- [ ] Liability appropriately allocated
- [ ] Technical claims supportable
- [ ] Multi-jurisdictional coverage adequate

## Next Steps

1. **User review and approval** of this specification
2. **Implementation planning** via writing-plans skill
3. **Technical implementation** of termsData.ts changes
4. **Testing and verification** of updated legal content
5. **Deployment coordination** with existing terms update process

---

**This specification provides a comprehensive, self-contained legal strategy that transforms CloakForge's regulatory positioning from potentially non-compliant to defensively compliant while maintaining professional presentation and business viability.**