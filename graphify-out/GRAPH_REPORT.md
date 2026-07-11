# Graph Report - cloakforge  (2026-07-11)

## Corpus Check
- 742 files · ~267,421 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3452 nodes · 5907 edges · 283 communities (214 shown, 69 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 7 edges (avg confidence: 0.54)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a76d5fdc`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Test Utilities & Mocks
- Home & Tools Landing Pages
- Admin Panel & Error Pages
- Wallet UI & Info Tooltips
- Server Config & Tool Cache
- Admin Transactions & Pinata Upload
- Token Auditor Tool Page
- Loading States
- Number Fields & Wallet Tokens List
- SPL Tokens & Transactions Tabs
- Wallet Balance Query Hook
- API Route Handlers (GET/POST)
- Fee Breakdown & Confirmation Form
- Analytics Tab & Distribution Items
- Site Navigation Menus
- Compliance & Data Collection Notices
- Token Creator Page & Upload Tests
- Freeze Wallets Tool Page
- Burn Tokens Hook & Tests
- Unfreeze Wallets Tool Page
- Hero Section Background & CTAs
- Error Boundaries
- Wallet Info & Benefits Section
- Burn Tokens Form Components
- JSON/Log Upload API Routes
- Platform Features Grid
- Liquidity Provider Benefits & FAQ
- Freeze Authority API Routes
- Header Logo & Navigation
- Root Layout & Global Footer
- Multisender Tool Page
- Tool Action Buttons & Config
- Liquidity Provider Test Mocks
- BigNumber (BN) Utility Types
- Custom Form Field & File Upload
- Announcement Banner & Contentful Client
- Simple Card & Cost Optimization
- Raydium Liquidity Provider Docs & Route
- Connected Account Page
- Token Dashboard & Liquidity Info
- Liquidity Pool Configuration Form
- Wallet Tokens Server Fetch & Metadata
- FAQ Items & Category Filter
- Token Selection Form
- Wallet Tokens Hook & Tests
- Unified Form Card Components
- Freeze Token Validation & Fee Hook
- route.ts
- Tool Helpers & Config Registry
- Legal & MiCA Compliance Rationale
- Hero Section Layout & Heading
- Legal Notice Cards
- Terms of Service Content
- Tool Landing Pages (LP/Revoke Mint)
- Blog Pages
- Revoke Freeze Authority Tool Page
- Multisender Form & Confirmation
- Multisender Token Validation & Metadata
- Wallet Connection Buttons
- Account Input & Confirmation Form
- Raydium Pool Creation V0 Tx Tests
- Privacy Policy Page
- XLogo & Authority Controls Form
- createRaydiumPool.ts
- Blog Client & Hero
- Revoke Mint Authority Form
- TransactionRow.tsx
- Imprint Page
- Burn Reasons & Feature Highlights
- Terms of Service Page
- Core Architecture Docs & Rationale
- Notification & Fee Calculation Notes
- Raydium Pool Creation Tests
- Balance Validation Tests
- Solana Test Helpers
- XLogo Component & Twitter Rebrand Docs
- Token Creator Zod Schemas
- FormSections.tsx
- Fee Breakdown Component
- Solana Address Utilities
- Legal Footer
- Contentful Client Tests
- JSON Upload Route Tests
- Token List Route Tests
- Layout with Metadata (1)
- Create API Route Test Utility
- Route Test (logger mocks)
- Route Test (generic body)
- Route Test (generic body) 2
- Route Test (generic body) 3
- Layout with Metadata (2)
- Layout with Metadata (3)
- Layout with Metadata (4)
- Layout with Metadata (5)
- Liquidity Provider Layout
- Layout with Metadata (6)
- Layout with Metadata (7)
- Layout with Metadata (8)
- Layout with Metadata (9)
- Layout with Metadata (10)
- Layout with Metadata (11)
- Solana API Route Test Utility
- Logger Mock Utilities
- Barrel Export (isolated)
- Barrel Export (isolated) 2
- Scroll Restoration Hook (isolated)
- serviceMemo.ts
- index.ts
- MobileNavigationMenu.tsx
- .mcp.json
- useTransactionMultisender.ts
- components.ts
- route.test.ts
- WalletMultiButtonSkeleton.tsx
- legalConfig.ts
- validateRequestBody
- CLAUDE.md
- CloakForge Documentation
- Imprint Navigation Integration Design
- CloakForge Troubleshooting Guide
- CloakForge AI Instructions
- 🎯 CloakForge Prompt Structure Template
- toolTypes.ts
- CloakForge — Project Memory
- X Logo Twitter Icon Replacement Design
- Planning Templates — New Feature Reference
- Legal Document Improvements Implementation Plan
- File Structure Overview
- Step 3: Manual Review Checklist
- Layer Examples — New Tool Reference
- CloakForge Development Guide
- CloakForge Tool Implementation Guide
- Step 3: Manual Review Checklist
- Agent Team
- Mock Patterns for CloakForge
- TDD Examples for CloakForge
- Testing Strategy
- backend.agent.md
- tester.agent.md
- What It Checks
- Performance Optimization
- File Structure
- Raydium Liquidity Provider Tool Design Specification
- Key Patterns
- WCAG 2.1 AA Requirements
- Component Architecture
- index.ts
- frontend.agent.md
- 5-Layer Workflow
- Implementation Tasks
- Testing Strategy
- Solana Patterns Skill
- /new-feature
- Performance Optimization Checklist
- Solana Testing Patterns — Reference
- MiCA-Compliant Legal Positioning Implementation Plan
- useLiquidityProvider.ts
- Format
- Key Patterns
- Workflow
- Review Checklist
- Performance Skill
- Security Audit Skill
- useWalletTokensForTool.ts
- /orchestrate
- Types
- Solana Patterns
- Conventional Commits
- Testing Strategy Skill
- frontend.md
- testing.md
- init_skill.py
- package_skill
- Actions
- Project State
- page.tsx
- docs.agent.md
- solana.md
- Superpowers Usage Control
- orchestrator.agent.md
- transactions.test.ts
- benefitsData.ts
- backend.md
- /dispatch
- docs.agent.md
- AppProvider.tsx
- NotificationCard.tsx
- mcp.json
- docs.md
- /fix-bug
- /init
- Solana RPC Optimization Checklist
- Bundle Optimization Checklist
- Core Web Vitals Optimization
- Performance Audit Process
- Common Performance Issues
- /refactor
- Output Patterns
- Workflow Patterns
- /status
- Schema-First TDD
- cleanup.sh
- monitor.agent.md
- page.tsx
- index.tsx
- /commit
- /optimize
- Performance Testing Checklist
- Post-Optimization Verification
- Image Optimization Checklist
- Next.js 16 Caching Optimization
- Solana RPC Optimization
- Bundle Optimization
- /pr
- /review-code
- /test-file
- API Route Mocking with MSW
- Solana RPC Mocking
- CloakForge Testing Patterns
- Priority Matrix
- next.config.ts
- svgr.d.ts
- check-review-verdict.sh
- check-task-log.sh
- lint-changed.sh
- pre-commit.sh
- quality-gate.sh
- next-env.d.ts
- postcss.config.mjs
- tailwind.config.ts
- 5-Layer Tool Architecture Pattern (Zod schema -> Page -> Hook -> API route -> Server utility)
- Documentation Philosophy: KISS/DRY, exactly 4 core docs - rationale: prior 10+ overlapping docs left developers lost in the repo
- AppError / SolanaError Error Handling System with getLogger and handleError
- Hybrid Client/Server Architecture (client signs, server prepares via private RPC) - rationale: privacy-first, no server-held keys, no rate-limited public RPC on server
- MiCA Infrastructure-Provider Positioning - rationale: resolve contradiction between 'we do not issue crypto-assets' language and the Token Creator tool by repositioning CloakForge as a non-CASP technical infrastructure/transaction-building provider, shifting compliance burden to users
- Prohibited Jurisdictions Management - rationale: user-responsibility model without geo-blocking, demonstrates good-faith regulatory compliance while preserving non-custodial global access
- Raydium CPMM vs CLMM Pool Types - rationale: CPMM is simple full-range liquidity (default), CLMM is concentrated liquidity for capital efficiency, professional LPs need both
- Raydium SDK v2 (@raydium-io/raydium-sdk-v2) Server-Side Pool Creation Integration - rationale: leverage official SDK for reliability, pool existence validation, fee-tier recommendations vs hand-rolled Raydium program calls
- Risk Level Indicator Pattern (high/medium/low) for DeFi tool risk communication
- TL;DR Summary Box Pattern for legal document sections - rationale: improve readability/UX of dense legal language
- CloakForge Architecture Doc
- Contentful Webhook Setup Doc
- CloakForge Documentation Index
- Comprehensive Liquidity Provider Unit Tests Plan
- Legal Document Improvements Design Spec
- Imprint Navigation Integration Design Spec
- MiCA-Compliant Legal Positioning Design Spec
- X Logo Twitter Icon Replacement Design Spec
- Raydium Liquidity Provider Design Spec
- footerData.ts (GlobalFooter)
- navigationData.ts (GlobalHeader)
- ProhibitedJurisdictionsChecker component
- RiskLevelIndicator component
- TldrSummaryBox component
- XLogo component
- prohibitedJurisdictions.ts constants/utilities
- createRaydiumPosition.test.ts
- route.ts
- TokenItem.tsx
- ToolActionButton.tsx

## God Nodes (most connected - your core abstractions)
1. `getLogger()` - 96 edges
2. `cn()` - 93 edges
3. `Card` - 46 edges
4. `CardContent` - 45 edges
5. `Task Log` - 42 edges
6. `AppError` - 37 edges
7. `Button` - 35 edges
8. `getServerConfig()` - 26 edges
9. `createConnectionPair()` - 25 edges
10. `useToolConfig()` - 23 edges

## Surprising Connections (you probably didn't know these)
- `createWrapper()` --references--> `react`  [EXTRACTED]
  src/hooks/queries/__tests__/useAdminTransactionsQuery.test.ts → package.json
- `createWrapper()` --references--> `react`  [EXTRACTED]
  src/hooks/queries/__tests__/useGetBalanceQuery.test.ts → package.json
- `useFormField()` --references--> `react`  [EXTRACTED]
  src/components/ui/form.tsx → package.json
- `createWrapper()` --references--> `react`  [EXTRACTED]
  src/hooks/queries/__tests__/useWalletTokensForTool.test.ts → package.json
- `wrapper()` --references--> `react`  [EXTRACTED]
  src/hooks/solana/__tests__/useLiquidityProvider.comprehensive.test.ts → package.json

## Import Cycles
- None detected.

## Communities (283 total, 69 thin omitted)

### Community 0 - "Test Utilities & Mocks"
Cohesion: 0.06
Nodes (60): ExplorerLink(), mockConnection, mockConnection, mockConnection, baseConfig, mockSignTransaction, mockWallet, BurnTokensParams (+52 more)

### Community 1 - "Home & Tools Landing Pages"
Cohesion: 0.36
Nodes (6): createMockMessageV0(), createMockRaydiumSDK(), createMockVersionedTransaction(), mockRaydiumSDK(), mockSolanaConnection(), TEST_ADDRESSES

### Community 2 - "Admin Panel & Error Pages"
Cohesion: 0.08
Nodes (23): AdminPage(), LoadingSpinner(), ActionButtons(), ActionButtonsProps, ActionButtons(), ErrorDisplay(), FloatingElements(), NavigationCard() (+15 more)

### Community 3 - "Wallet UI & Info Tooltips"
Cohesion: 0.06
Nodes (31): BenefitsSectionProps, Alert(), AlertDescription(), AlertTitle(), alertVariants, Avatar(), AvatarFallback(), AvatarImage() (+23 more)

### Community 4 - "Server Config & Tool Cache"
Cohesion: 0.12
Nodes (39): Transaction, getServerConfig(), mockGetAllToolConfigurations, getCachedToolConfig(), isToolEnabled(), logger, createConnectionPair(), BurnTokenParams (+31 more)

### Community 5 - "Admin Transactions & Pinata Upload"
Cohesion: 0.12
Nodes (21): config, logger, pinata, POST(), ApiRouteConfig, AppError, ERROR_MESSAGES, ErrorCode (+13 more)

### Community 6 - "Token Auditor Tool Page"
Cohesion: 0.06
Nodes (28): TokenAuditorPage(), TokenAuditorPageProps, BaseFeature, FeatureCard(), FeatureCardProps, FeatureWithBenefits, FeatureWithDetails, hasBenefits() (+20 more)

### Community 7 - "Loading States"
Cohesion: 0.09
Nodes (19): InfoCard(), InfoCardProps, LegalNoticeCardProps, EmptyTokensStateProps, TableHeader(), features, trustReasons, features (+11 more)

### Community 8 - "Number Fields & Wallet Tokens List"
Cohesion: 0.11
Nodes (19): InfoTooltip(), Props, BurnAmountFormProps, AdvancedSettingsSection(), AdvancedSettingsSectionProps, FormSections(), FormSectionsProps, feeTierOptions (+11 more)

### Community 9 - "SPL Tokens & Transactions Tabs"
Cohesion: 0.24
Nodes (13): AdminTransactionsTableProps, FeeTableHeader(), ServiceFee, ServiceRow(), ServiceRowProps, Table, TableBody, TableCaption (+5 more)

### Community 10 - "Wallet Balance Query Hook"
Cohesion: 0.13
Nodes (22): TestPage(), MultisenderForm(), createWrapper(), mockGetBalance, TEST_ADDRESS, useGetBalanceQuery(), getConfig(), convertAddressToPublicKey() (+14 more)

### Community 11 - "API Route Handlers (GET/POST)"
Cohesion: 0.09
Nodes (28): GET, logger, POST(), requestSchema, Error(), ErrorProps, GlobalError(), GlobalErrorProps (+20 more)

### Community 12 - "Fee Breakdown & Confirmation Form"
Cohesion: 0.25
Nodes (7): FormSections(), FormSectionsProps, defaultValues, MultisenderFormData, MultisenderFormSchema, RecipientsInput(), RecipientsInputProps

### Community 13 - "Analytics Tab & Distribution Items"
Cohesion: 0.08
Nodes (27): BasicWalletInfoProps, HeroSection(), HeroSectionProps, AnalyticsTab(), AnalyticsTabProps, DistributionItemProps, MainContentTabsProps, TabsHeaderProps (+19 more)

### Community 14 - "Site Navigation Menus"
Cohesion: 0.14
Nodes (23): MobileNavigationMenuProps, defaultNavigationItems, NavigationGroup, NavigationItem, othersNavigationItems, toolsNavigationItems, NavigationMenuItem(), NavigationMenuItemProps (+15 more)

### Community 15 - "Compliance & Data Collection Notices"
Cohesion: 0.10
Nodes (18): BackgroundElements(), BottomBadge(), ComplianceGrid(), DataCollectionNote(), DataPrivacyTable(), SecurityPrivacySection(), MinimalDataList(), ProtectedDataList() (+10 more)

### Community 16 - "Token Creator Page & Upload Tests"
Cohesion: 0.11
Nodes (13): makeFormDataRequest(), mockPinataUpload, BackgroundElements(), HeroHeader(), HeroSection(), TokenCreationFormWrapper(), AuthorityControl, FAQ (+5 more)

### Community 17 - "Freeze Wallets Tool Page"
Cohesion: 0.13
Nodes (11): ValueProp, freezeValueProps, freezeWalletsBenefitsConfig, FreezeForm(), FAQ, faqs, Feature, features (+3 more)

### Community 18 - "Burn Tokens Hook & Tests"
Cohesion: 0.16
Nodes (12): POST, TokenCreationSuccessProps, TokenCreatorRequestSchema, BurnTokensRequest, ResponseStatus, CreateTokenTransactionParams, CreateTokenTransactionResult, TokenCreatorApiData (+4 more)

### Community 19 - "Unfreeze Wallets Tool Page"
Cohesion: 0.12
Nodes (11): unfreezeWalletsBenefitsConfig, FAQSection(), HeroHeader(), HeroSection(), UnfreezeForm(), FAQ, faqs, Feature (+3 more)

### Community 20 - "Hero Section Background & CTAs"
Cohesion: 0.03
Nodes (61): dependencies, axios, babel-plugin-react-compiler, class-variance-authority, clsx, contentful, @contentful/rich-text-react-renderer, @contentful/rich-text-types (+53 more)

### Community 21 - "Error Boundaries"
Cohesion: 0.17
Nodes (8): ErrorActionButtons(), ErrorActionButtonsProps, ErrorPage(), ErrorPageProps, ErrorDisplay(), ErrorDisplayProps, ErrorFloatingElements(), TroubleshootingCard()

### Community 22 - "Wallet Info & Benefits Section"
Cohesion: 0.04
Nodes (48): devDependencies, baseline-browser-mapping, eslint, @eslint/compat, eslint-config-next, eslint-config-prettier, @eslint/js, eslint-plugin-prettier (+40 more)

### Community 23 - "Burn Tokens Form Components"
Cohesion: 0.23
Nodes (11): BurnAmountForm(), BurnForm(), BurnFormProps, BurnTokensFormData, burnTokensFormSchema, ConfirmationForm(), ConfirmationFormProps, EmptyTokensState() (+3 more)

### Community 24 - "JSON/Log Upload API Routes"
Cohesion: 0.04
Nodes (45): [2025-01-21] docs(all): Optimize all 4 documentation files for AI agent context reduction, [2025-07-21] docs(all): Strip verbose junk from 3 docs files that were bloated by prior session, [2026-03-08] feat(agentic): Enhanced agentic workflow architecture, [2026-03-29] feat(privacy): replace privacy policy data with comprehensive legal content, [2026-03-29] feat(ui): Add Imprint legal page, [2026-03-29] feat(ui): Replace Terms of Service data with comprehensive legal content, [2026-03-31] feat(legal): add dedicated token creation user authority section, [2026-03-31] feat(legal): Add technical architecture section for MiCA compliance (+37 more)

### Community 25 - "Platform Features Grid"
Cohesion: 0.18
Nodes (16): BackgroundElements(), CTAButtons(), HeroBadge(), HeroContent(), Feature, features, OrbitItem, orbitItems (+8 more)

### Community 26 - "Liquidity Provider Benefits & FAQ"
Cohesion: 0.17
Nodes (12): liquidityProviderBenefitsConfig, liquidityProviderFAQ, FAQSection(), HeroSection(), benefits, features, createTestQueryClient(), CustomRenderOptions (+4 more)

### Community 27 - "Freeze Authority API Routes"
Cohesion: 0.11
Nodes (17): POST, POST, POST, UnsignedRevokeFreezeAuthorityResponse, POST, UnsignedMultisenderResponse, BurnTokensRequestSchema, LiquidityProviderRequestData (+9 more)

### Community 28 - "Header Logo & Navigation"
Cohesion: 0.10
Nodes (19): react, MobileLogo(), MobileNavigationProps, MobileNavigationMenu(), WalletConnectionButton(), WalletMultiButton, BasicWalletInfo(), DialogContent() (+11 more)

### Community 29 - "Root Layout & Global Footer"
Cohesion: 0.28
Nodes (9): GlobalFooter(), FooterBottom(), FooterBrand(), FooterLink, footerLinks, FooterSection, SocialLink, socialLinks (+1 more)

### Community 30 - "Multisender Tool Page"
Cohesion: 0.12
Nodes (9): multisenderBenefitsConfig, HeroHeader(), HeroSection(), FAQ, faqs, Feature, features, ValueProp (+1 more)

### Community 31 - "Tool Action Buttons & Config"
Cohesion: 0.06
Nodes (32): 1. **File Loading Discipline**, 1. **Reference-Based Briefs**, 2. **Negative Constraints (Critical)**, 2. **Shell Command Chains**, 3. **Batched Operations**, 3. **Structured Outputs Only**, Agent Task Sizing, Bug Fixing (+24 more)

### Community 32 - "Liquidity Provider Test Mocks"
Cohesion: 0.06
Nodes (31): Agent Debug Success Criteria, Backend Debug Patterns, Before Agent Dispatch, Common Debug Agent Briefs, Context Reset Pattern, Debug Cost Optimization, Debug Quality Gates, Debugging Agent Specialization (+23 more)

### Community 34 - "Custom Form Field & File Upload"
Cohesion: 0.08
Nodes (31): Props, DirectionOptions, FileInput, FileUploader, FileUploaderContent, FileUploaderContext, FileUploaderContextType, FileUploaderItem (+23 more)

### Community 35 - "Announcement Banner & Contentful Client"
Cohesion: 0.17
Nodes (12): GET, bannerLogger, blogLogger, client, getSiteBanner(), serverConfig, SiteBanner, toolConfigLogger (+4 more)

### Community 36 - "Simple Card & Cost Optimization"
Cohesion: 0.14
Nodes (13): SimpleCard(), SimpleCardProps, BottomCTA(), containerVariants, CostOptimizationSection(), containerVariants, FeeBreakdownSection(), FeeTable() (+5 more)

### Community 37 - "Raydium Liquidity Provider Docs & Route"
Cohesion: 0.21
Nodes (14): MOCK_ADDRESSES, mockFormData, mockLiquidityProviderParams, mockLiquidityProviderParamsCLMM, mockLiquidityProviderRequest, mockLiquidityProviderRequestCLMM, mockLiquidityProviderResponse, FeeTier (+6 more)

### Community 38 - "Connected Account Page"
Cohesion: 0.12
Nodes (5): HeroSectionLayout(), ConnectedAccountContent(), ConnectedAccountContentProps, ErrorWalletDataProps, Props

### Community 39 - "Token Dashboard & Liquidity Info"
Cohesion: 0.16
Nodes (16): sizeMap, XLogo(), XLogoProps, mockTokenData, TokenData, TokenDashboardProps, LiquidityInfo(), LiquidityInfoProps (+8 more)

### Community 40 - "Liquidity Pool Configuration Form"
Cohesion: 0.06
Nodes (30): 1. **Cost Optimization**, 2. **Advanced Coordination**, 3. **Quality Automation**, 4. **Dynamic Skill Integration**, Agent Status Monitoring, Agentic Optimization Rules, 🎉 Benefits Achieved, 📁 Complete Agent Ecosystem (+22 more)

### Community 41 - "Wallet Tokens Server Fetch & Metadata"
Cohesion: 0.20
Nodes (17): shortenAddress(), AccountInfo, applyToolSpecificFilter(), createFallbackMetadata(), deriveMetadataPDA(), extractToken2022Metadata(), fetchImageFromMetadataUri(), fetchMintAuthoritiesBatch() (+9 more)

### Community 42 - "FAQ Items & Category Filter"
Cohesion: 0.21
Nodes (10): Category, CategoryFilter(), CategoryFilterProps, FAQ, FAQItem(), FAQItemProps, FAQSection(), FAQSectionProps (+2 more)

### Community 43 - "Token Selection Form"
Cohesion: 0.10
Nodes (34): ADR-0004, ManualTokenEntry(), TokenSelectionConfig, TokenSelectionForm(), TokenSelectionFormProps, TokenSelectionModeToggle(), BaseTokenFormData, ManualTokenEntryProps (+26 more)

### Community 44 - "Wallet Tokens Hook & Tests"
Cohesion: 0.06
Nodes (30): 1. **Task Analysis** (30 seconds maximum), 2. **Skill Loading** (Load in dependency order), 3. **Execution** (Follow loaded skills precisely), Advanced Skill Integration, Anti-Patterns, Code Quality Tasks, Context-Aware Skill Parameters, Core Capability (+22 more)

### Community 45 - "Unified Form Card Components"
Cohesion: 0.25
Nodes (12): GradientVariant, UnifiedActionButtonsProps, UnifiedFormCardProps, UnifiedFormHeaderProps, UnifiedFormWrapperProps, buttonVariants, UnifiedActionButtons(), gradientVariants (+4 more)

### Community 46 - "Freeze Token Validation & Fee Hook"
Cohesion: 0.30
Nodes (8): mockToolConfig, AdditionalFeeConfig, FeeBreakdownItem, FeeCalculationConfig, useFeeCalculation(), commonAdditionalFees, toolFeeConfigs, ToolId

### Community 47 - "route.ts"
Cohesion: 0.09
Nodes (23): calculateServiceFee(), extractServiceFeeFromMemo(), extractServiceIdentifier(), extractServiceIdentifierFromMemo(), GET(), getPayerFromTransaction(), SignatureOptions, TransactionData (+15 more)

### Community 48 - "Tool Helpers & Config Registry"
Cohesion: 0.06
Nodes (30): Business Context, Business Risks, Conclusion, Core Strategy, Design Approach: Strategic Enhancement, Enhanced Existing Sections, Enhanced Existing Sections, Executive Summary (+22 more)

### Community 50 - "Hero Section Layout & Heading"
Cohesion: 0.20
Nodes (6): AnimatedBackground(), AnimatedBackgroundProps, HeroHeadingProps, HeroSectionLayoutProps, revokeMintAuthorityFAQs, FAQSection()

### Community 51 - "Legal Notice Cards"
Cohesion: 0.19
Nodes (9): LegalNoticeCard(), LegalSection(), LegalSectionProps, imprintData, ImprintSectionData, PrivacySectionData, privacySectionsData, TermsSectionProps (+1 more)

### Community 52 - "Terms of Service Content"
Cohesion: 0.07
Nodes (23): LegalFooter(), LegalFooterProps, LegalHeroSection(), LegalHeroSectionProps, ImprintContentSection(), ImprintFooterSection(), ImprintHeroSection(), ImprintPage() (+15 more)

### Community 53 - "Tool Landing Pages (LP/Revoke Mint)"
Cohesion: 0.19
Nodes (7): BenefitsSection(), BenefitsSectionConfig, CTAConfig, burnTokensBenefitsConfig, benefitsConfig, HeroSection(), tokenCreatorBenefitsConfig

### Community 54 - "Blog Pages"
Cohesion: 0.07
Nodes (29): Advanced Configuration, After Webhook Setup, Before Webhook Setup, Changes Not Appearing Immediately, Check Server Logs, Check Webhook Delivery, Contentful Webhook Setup for Instant Cache Revalidation, Cost Optimization (+21 more)

### Community 55 - "Revoke Freeze Authority Tool Page"
Cohesion: 0.28
Nodes (5): revokeFreezeAuthorityBenefitsConfig, revokeFreezeAuthorityFAQs, FAQSection(), HeroSection(), RevokeFreezeAuthorityPage()

### Community 56 - "Multisender Form & Confirmation"
Cohesion: 0.24
Nodes (7): AccountInputForm(), AccountInputFormProps, FormSections(), FormSectionsProps, FreezeFormSchema, TokenData, defaultValues

### Community 57 - "Multisender Token Validation & Metadata"
Cohesion: 0.11
Nodes (18): config, jsonUploadSchema, pinata, POST, logRequestSchema, POST, BatchFreezeResponse, POST (+10 more)

### Community 58 - "Wallet Connection Buttons"
Cohesion: 0.30
Nodes (9): BaseWalletConnectionButton(), Props, BaseWalletMultiButton(), Props, WalletButton(), WalletButtonProps, LABELS, WalletMultiButton() (+1 more)

### Community 59 - "Account Input & Confirmation Form"
Cohesion: 0.32
Nodes (5): AccountInputForm(), FormSections(), FormSectionsProps, defaultValues, UnfreezeWalletsFormSchema

### Community 60 - "Raydium Pool Creation V0 Tx Tests"
Cohesion: 0.14
Nodes (9): MOCK_CLMM_CONFIG_100, MOCK_CLMM_CONFIG_500, MOCK_CPMM_CONFIG, MOCK_WALLET, mockClmmCreatePool, mockCpmmCreatePool, mockGetMint, mockLegacyConnection (+1 more)

### Community 61 - "Privacy Policy Page"
Cohesion: 0.07
Nodes (28): 1. **Cost-Conscious Task Decomposition**, 2. **Advanced State Management**, 3. **Multi-Agent Orchestration Patterns**, 4. **Quality Gate Automation**, Advanced State Updates, Advanced Workflow Patterns, Agent Efficiency Tracking, Agent Task Failures (+20 more)

### Community 62 - "XLogo & Authority Controls Form"
Cohesion: 0.17
Nodes (14): BackgroundElements(), CTAButtons(), PlatformFeature, platformFeatures, QuickStat, quickStats, CTAHeader(), CTASection() (+6 more)

### Community 63 - "createRaydiumPool.ts"
Cohesion: 0.13
Nodes (20): POST, openPositionRequestSchema, CLMM_PROGRAM_ID, ClmmPositionRangeParams, computeClmmPositionRange(), CPMM_POOL_FEE_ACC, CPMM_PROGRAM_ID, CreateRaydiumPoolParams (+12 more)

### Community 64 - "Blog Client & Hero"
Cohesion: 0.18
Nodes (6): BlogClientProps, BlogHeroProps, BlogPostsGridProps, BlogSearchAndFilterProps, Category, BlogPost

### Community 65 - "Revoke Mint Authority Form"
Cohesion: 0.40
Nodes (6): FormSections(), FormSectionsProps, defaultValues, RevokeMintAuthorityForm(), RevokeMintAuthorityFormData, revokeMintAuthorityFormSchema

### Community 66 - "TransactionRow.tsx"
Cohesion: 0.18
Nodes (16): FeeBreakdown(), FeeBreakdownProps, getToolStyles(), TotalSection(), ServiceFilter(), getServiceBadgeProps(), ServiceBadge(), TransactionRow() (+8 more)

### Community 67 - "Imprint Page"
Cohesion: 0.07
Nodes (27): About Skills, Anatomy of a Skill, Assets (`assets/`), Body, Bundled Resources (optional), Concise is Key, Core Principles, Frontmatter (+19 more)

### Community 68 - "Burn Reasons & Feature Highlights"
Cohesion: 0.08
Nodes (24): 1. **Agent Performance Tracking**, 2. **System Health Monitoring**, 3. **Quality Metrics Dashboard**, Agent Performance Alerts, Agent Performance Analysis, Agent Performance Report, Alert Systems, Core Responsibilities (+16 more)

### Community 69 - "Terms of Service Page"
Cohesion: 0.06
Nodes (36): 1. Token Creator, 2. Token Burner, 3. Multi-Sender, 4. Authority Management, 5. Portfolio Tracker, Adding New Tools, Available Scripts, 🎯 Available Tools (+28 more)

### Community 71 - "Notification & Fee Calculation Notes"
Cohesion: 0.16
Nodes (8): sonner, DMSans, metadata, DesktopNavigation(), GlobalHeader(), Logo(), MobileNavigation(), NotificationProps

### Community 72 - "Raydium Pool Creation Tests"
Cohesion: 0.22
Nodes (7): MOCK_WALLET, mockClmmCreatePool, mockCpmmCreatePool, mockFetchClmmConfig, mockFetchCpmmConfig, mockGetMint, mockLegacyConnection

### Community 73 - "Balance Validation Tests"
Cohesion: 0.18
Nodes (16): FeaturesGrid(), PlatformFeatures(), Feature, features, Stat, stats, timelineData, TimelineStep (+8 more)

### Community 74 - "Solana Test Helpers"
Cohesion: 0.08
Nodes (23): 1. New Technical Architecture Section, 2. Restructured MiCA Section, 3. New Token Creation User Responsibilities Section, 4. Enhanced Service Description Section, 5. Enhanced Fees and Payments Section, Business Benefits, Business Continuity, Compliance Benefits (+15 more)

### Community 76 - "Token Creator Zod Schemas"
Cohesion: 0.29
Nodes (6): TokenCreatorApiData, tokenCreatorApiDataSchema, TokenCreatorFormData, tokenCreatorFormSchema, TokenDataBase, tokenDataBaseSchema

### Community 77 - "FormSections.tsx"
Cohesion: 0.16
Nodes (15): AuthorityControlsForm(), AuthorityControlsFormProps, BasicInformationForm(), BasicInformationFormProps, FormSections(), FormSectionsProps, OptionalLinksForm(), TokenCreationForm() (+7 more)

### Community 78 - "Fee Breakdown Component"
Cohesion: 0.32
Nodes (8): ConfirmationForm(), ConfirmationFormProps, FormSections(), FormSectionsProps, defaultValues, RevokeFreezeAuthorityForm(), RevokeFreezeAuthorityFormData, revokeFreezeAuthorityFormSchema

### Community 79 - "Solana Address Utilities"
Cohesion: 0.09
Nodes (22): 1. **Parallel Execution Strategy**, 1. **Token Budget Management**, 2. **Anti-Patterns to Avoid**, 2. **Context Minimization**, 3. **Efficient Delegation**, 3. **Quality Gate Orchestration**, 4. **Memory-Driven Coordination**, Agent Communication Protocol (+14 more)

### Community 80 - "Legal Footer"
Cohesion: 0.09
Nodes (21): ARIA Roles for CloakForge Patterns, Common a11y Lint Errors (eslint-plugin-jsx-a11y), CSS Utilities, Dropdown / Select, Form Submission, Keyboard Interaction Patterns, Modal / Dialog, Screen Reader Announcements — CloakForge Specifics (+13 more)

### Community 104 - "Barrel Export (isolated)"
Cohesion: 0.09
Nodes (21): Hotfix Release, Release Process, Release Workflow, Tagging Convention, Versioning, Before Opening, Branch Naming, Branching Strategy (+13 more)

### Community 105 - "Barrel Export (isolated) 2"
Cohesion: 0.09
Nodes (22): 1. Pre-Audit Setup, 2. Systematic Security Review, 3. Remediation & Verification, Authority Management, Automated Security Checks, Core Privacy Rules, Incident Response, Manual Security Testing (+14 more)

### Community 112 - "Scroll Restoration Hook (isolated)"
Cohesion: 0.09
Nodes (22): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+14 more)

### Community 115 - "serviceMemo.ts"
Cohesion: 0.10
Nodes (19): API Routes (`src/app/api/solana/{tool}/route.ts`), Client Hooks (`src/hooks/solana/use{Tool}.ts`), Code Review Checklists by File Type, Common Findings Reference, Page Components (`src/components/pages/{Tool}Page/`), Server-Side Utilities (`src/lib/solana/server-side/`), Test Files (`__tests__/`), Zod Schemas (`src/lib/schemas/`) (+11 more)

### Community 116 - "index.ts"
Cohesion: 0.10
Nodes (18): Caching Patterns (Next.js 16), Data Fetching in Server Components, Error Boundaries, Loading UI, Page Architecture Pattern, Route Handler Caching, Server Component and Caching Patterns, Server vs Client Component Rules (+10 more)

### Community 117 - "MobileNavigationMenu.tsx"
Cohesion: 0.18
Nodes (16): formatAddress(), formatTimestamp(), getStatusDisplay(), getSuccessDisplay(), getTransactionIcon(), TransactionsTab(), ServiceFilterProps, Select() (+8 more)

### Community 118 - ".mcp.json"
Cohesion: 0.33
Nodes (6): /Users/daliborkralik/.local/share/uv/tools/graphifyy/bin/python, npx, graphify, next-devtools, shadcn, solana

### Community 119 - "useTransactionMultisender.ts"
Cohesion: 0.10
Nodes (19): 1. Complete Token Operation Examples, 2. Authority Management, 3. Deduplication Nonce, 4. Dynamic Priority Fee, 5. Blockhash Refresh (Client), 6. Token Program Detection, 7. SOL Balance Validation, Burn Tokens (+11 more)

### Community 120 - "components.ts"
Cohesion: 0.25
Nodes (10): BottomCTA(), ServiceShowcase(), SectionHeader(), ServiceCard(), ServiceCardProps, cardVariants, containerVariants, Service (+2 more)

### Community 121 - "route.test.ts"
Cohesion: 0.11
Nodes (17): aliases, components, hooks, lib, ui, utils, iconLibrary, rsc (+9 more)

### Community 122 - "WalletMultiButtonSkeleton.tsx"
Cohesion: 0.18
Nodes (10): fallbackServiceFees, mapToolConfigurationsToServiceFees(), TOOL_DISPLAY_MAP, useServiceFees(), ToolConfiguration, mockSetConfigs, ToolConfigProvider(), ToolConfigProviderProps (+2 more)

### Community 124 - "validateRequestBody"
Cohesion: 0.12
Nodes (17): Caching (Next.js 16), CloakForge Architecture, Component Patterns, Core Conventions, Data Flow, Error Flow, Hybrid Architecture, Mission (+9 more)

### Community 126 - "CloakForge Documentation"
Cohesion: 0.12
Nodes (17): 1. **KISS (Keep It Simple)**, 2. **DRY (Don't Repeat Yourself)**, 3. **Clear Purpose**, 4. **Developer-First**, 5. **Maintainability**, CloakForge Documentation, Core Documentation, 🎓 Documentation Philosophy (+9 more)

### Community 127 - "Imprint Navigation Integration Design"
Cohesion: 0.12
Nodes (16): 1. Footer Navigation Integration, 2. Header/Mobile Navigation Integration, 3. Icon Import Update, Background, Current State Analysis, Design Requirements, Files to Modify, Footer Data Structure (+8 more)

### Community 128 - "CloakForge Troubleshooting Guide"
Cohesion: 0.12
Nodes (17): CloakForge Troubleshooting Guide, Common Issues, Debugging Strategies, Error Handling System, Error Pattern by Layer, ESLint Warnings, Form Validation Not Working, Logging System (+9 more)

### Community 129 - "CloakForge AI Instructions"
Cohesion: 0.12
Nodes (16): 🧭 1.110 Agent Workflow, ✅ Accuracy First (Reduce Hallucination), 🤖 Agent Team, 🚫 Anti-Patterns, 🏛 Architecture & Patterns, CloakForge AI Instructions, 💻 Coding Conventions, Cost and Quality Gates (+8 more)

### Community 130 - "🎯 CloakForge Prompt Structure Template"
Cohesion: 0.12
Nodes (17): 🎯 Best Practices, 🎯 CloakForge Prompt Structure Template, ✅ DO, ❌ DON'T, Example 1: Bug Fix, Example 2: New Feature, Example 3: Quick Fix, 📚 Example Prompts (+9 more)

### Community 131 - "toolTypes.ts"
Cohesion: 0.18
Nodes (12): getStaleTimeForTool(), getToolConfig(), getToolDisplayName(), isValidToolType(), TOOL_CONFIGS, ToolConfig, AUTHORITY_REQUIRED_TOOLS, CoreToolType (+4 more)

### Community 132 - "CloakForge — Project Memory"
Cohesion: 0.12
Nodes (15): Advanced Agent Capabilities, Anti-Patterns, Boundaries, CloakForge — Project Memory, Commands, Context, Conventions, Core Orchestration Principles (+7 more)

### Community 133 - "X Logo Twitter Icon Replacement Design"
Cohesion: 0.12
Nodes (15): Architecture, Context, Error Handling, Implementation Notes, Migration Plan, Overview, Phase 1: Component Creation, Phase 2: Footer Migration (+7 more)

### Community 134 - "Planning Templates — New Feature Reference"
Cohesion: 0.13
Nodes (14): 1. Full-Stack Feature Plan Template, 2. UI-Only Feature Plan Template, 3. Solana Tool Feature Plan Template, 4. Validation Checklists, 5. Integration Patterns, Adding Service Identifier, Adding to Navigation, Adding Tool Config (+6 more)

### Community 135 - "Legal Document Improvements Implementation Plan"
Cohesion: 0.13
Nodes (14): Legal Document Improvements Implementation Plan, Summary, Task 10: Legal Entity Information Integration, Task 11: Add ProhibitedJurisdictionsChecker to Terms Page, Task 12: Final Integration and Testing, Task 1: Legal Entity Configuration System, Task 2: Prohibited Jurisdictions Data Structure, Task 3: TL;DR Summary Box Component (+6 more)

### Community 136 - "File Structure Overview"
Cohesion: 0.13
Nodes (14): File Structure Overview, Raydium Liquidity Provider Implementation Plan, Success Criteria, Task 10: Integration Testing and Verification, Task 1: Install Dependencies and Setup Base Structure, Task 2: Create API Schema and Configuration, Task 3: Create Form Schema and Validation, Task 4: Create Server-side Raydium Integration (+6 more)

### Community 137 - "Step 3: Manual Review Checklist"
Cohesion: 0.14
Nodes (13): Correctness, Patterns & Conventions, Performance, Review Process, Scope Constraints, Security (Critical for Web3), Solana Safety, Source-of-Truth Order (+5 more)

### Community 138 - "Layer Examples — New Tool Reference"
Cohesion: 0.14
Nodes (13): 1. Layer 1: Types & Zod Schema, 2. Layer 2: Server Utility, 3. Layer 3: API Route, 4. Layer 4: Client Hook, 5. Layer 5: UI Components, Add to `src/lib/schemas/apiSchemas.ts`, Add to `src/types/api.ts` (response type), Contents (+5 more)

### Community 139 - "CloakForge Development Guide"
Cohesion: 0.14
Nodes (14): CloakForge Development Guide, Code Standards, Common Tasks, Component Patterns, Environment Config, Forms (React Hook Form 8 + Zod 4), Git Workflow, Project Structure (+6 more)

### Community 140 - "CloakForge Tool Implementation Guide"
Cohesion: 0.14
Nodes (14): 5-Layer Architecture, CloakForge Tool Implementation Guide, Common Patterns, Implementation Checklist, Layer 1: Zod Schema, Layer 2: Page Component, Layer 3: Hook, Layer 4: API Route (+6 more)

### Community 141 - "Step 3: Manual Review Checklist"
Cohesion: 0.14
Nodes (13): Correctness, Patterns & Conventions, Performance, Review Process, Security (Critical for Web3), Solana Safety, Source-of-Truth Order, Step 1: Gather Context (+5 more)

### Community 142 - "Agent Team"
Cohesion: 0.15
Nodes (12): Agent Team, Agent Team, Cost-Conscious Execution, File Locations, Handoffs, How to Use, Orchestration Flow, Prompt Files (+4 more)

### Community 143 - "Mock Patterns for CloakForge"
Cohesion: 0.15
Nodes (13): Complete Wallet Mock, Component Testing Helpers, Custom Render with Providers, Error Handling Mocks, Form Testing Mocks, Logger Mocking, Mock Patterns for CloakForge, React Hook Form Mocking (+5 more)

### Community 144 - "TDD Examples for CloakForge"
Cohesion: 0.15
Nodes (13): API Route TDD, Component TDD, Green: Add validation, Green: Add validation, Green: Implement loading state, Green: Implement transaction building, Hook TDD, Red: Test error handling (+5 more)

### Community 145 - "Testing Strategy"
Cohesion: 0.15
Nodes (13): Coverage Targets, Detailed Patterns, Essential Mocks, Implementation Checklist, Implementation Order, Mock Patterns Reference, Mocking Strategy, Red-Green-Refactor Cycle (+5 more)

### Community 146 - "backend.agent.md"
Cohesion: 0.17
Nodes (11): API Route Pattern, Cost Optimization, Efficient Context Loading, Key Rules, Output Format, Pre-Implementation Checks, Scope Constraints, Server Utility Pattern (+3 more)

### Community 147 - "tester.agent.md"
Cohesion: 0.17
Nodes (11): File Conventions, Mocking Patterns, Output Format, Scope Constraints, Source-of-Truth Order, TDD Workflow, Test Commands, Test Pyramid (+3 more)

### Community 148 - "What It Checks"
Cohesion: 0.17
Nodes (11): 1. **Agent Teams Configuration**, 2. **Agent Definitions**, 3. **State Management**, 4. **Skills Integration**, 5. **Hooks & Automation**, /agentic-status, Common Issues, Output Format (+3 more)

### Community 149 - "Performance Optimization"
Cohesion: 0.17
Nodes (12): Caching Strategy, Code Splitting, Core Web Vitals Targets, Detailed Optimization Guide, Images, Key Metrics to Track, Monitoring Tools, Next.js 16 Performance Patterns (+4 more)

### Community 150 - "File Structure"
Cohesion: 0.17
Nodes (11): Comprehensive Liquidity Provider Unit Tests Implementation Plan, File Structure, Self-Review, Task 1: Test Infrastructure Setup, Task 2: API Endpoint Unit Tests, Task 3: React Component Unit Tests, Task 4: Form Components Unit Tests, Task 5: Schema and Type Validation Tests (+3 more)

### Community 151 - "Raydium Liquidity Provider Tool Design Specification"
Cohesion: 0.17
Nodes (11): Architecture Overview, Component Structure, Context, Critical Files to Modify, Data Schema, Error Handling & Validation, Raydium Liquidity Provider Tool Design Specification, Reusable Functions & Utilities (+3 more)

### Community 152 - "Key Patterns"
Cohesion: 0.17
Nodes (11): Browser Validation, Component Architecture, Conventions, Forms, Hooks, Key Patterns, Output Format, React 19 + Next.js 16 Rules (+3 more)

### Community 153 - "WCAG 2.1 AA Requirements"
Cohesion: 0.17
Nodes (11): Accessibility Skill, Common Components, Operable, Perceivable, Robust, Testing Tools, Transaction Flows, Understandable (+3 more)

### Community 154 - "Component Architecture"
Cohesion: 0.17
Nodes (11): 5-Layer Tool Pattern, Common Components (check FIRST), Component Architecture, File Conventions, Forms, Frontend Patterns Skill, Next.js 16 App Router, React 19 Features (+3 more)

### Community 155 - "index.ts"
Cohesion: 0.18
Nodes (9): burnTokensFAQs, FAQSection(), BurnReason, burnReasons, Feature, FeatureHighlights(), features, HeroBackground() (+1 more)

### Community 156 - "frontend.agent.md"
Cohesion: 0.18
Nodes (10): Common Components (in `src/components/common/`), Context Management, Cost Optimization, Efficient Task Scoping, Key Rules, Output Format, Scope Constraints, Stack (+2 more)

### Community 157 - "5-Layer Workflow"
Cohesion: 0.18
Nodes (10): 5-Layer Workflow, Checklist, Clarify Before Building, Common Issues, Layer 1: Types & Schemas, Layer 2: Server Utility, Layer 3: API Route, Layer 4: Client Hook (+2 more)

### Community 158 - "Implementation Tasks"
Cohesion: 0.18
Nodes (10): Completion Criteria, File Structure, Implementation Tasks, Task 1: Create XLogo Component with Tests, Task 2: Update Footer to Use XLogo Component, Task 3: Update Token Creator Form to Use XLogo, Task 4: Update Token Auditor to Use XLogo, Task 5: Clean Up Unused Twitter Imports (+2 more)

### Community 159 - "Testing Strategy"
Cohesion: 0.18
Nodes (10): File Conventions, Mocking Patterns, Output Format, Source-of-Truth Order, TDD Workflow, Test Commands, Test Pyramid, Testing Strategy (+2 more)

### Community 160 - "Solana Patterns Skill"
Cohesion: 0.18
Nodes (10): Client Side (hooks), Error Handling, Hybrid Client/Server Model, Key Rules, Server Side (API + utilities), Solana Patterns Skill, Testing, Token Operations (+2 more)

### Community 161 - "/new-feature"
Cohesion: 0.20
Nodes (9): Conventions checklist (per file), Definition of Done, /new-feature, Phase structure, Step 1: Research (before planning), Step 2: Clarify (if ambiguous), Step 3: Plan (phased), Step 4: Implement (+1 more)

### Community 162 - "Performance Optimization Checklist"
Cohesion: 0.20
Nodes (8): Key Performance Indicators, Measurement Tools, Monitoring & Metrics, Ongoing Monitoring, Performance Bottleneck Identification, Performance Budget, Performance Optimization Checklist, Pre-Optimization Assessment

### Community 163 - "Solana Testing Patterns — Reference"
Cohesion: 0.20
Nodes (9): 1. Server Utility Tests, 2. API Route Tests, 3. Hook Tests, 4. Schema Tests, 5. Mock Setups, Contents, Solana Testing Patterns — Reference, Standard Hook Mock Block (+1 more)

### Community 164 - "MiCA-Compliant Legal Positioning Implementation Plan"
Cohesion: 0.20
Nodes (9): MiCA-Compliant Legal Positioning Implementation Plan, Self-Review, Task 1: Add New Technical Architecture Section, Task 2: Restructure MiCA Section with Positive Positioning, Task 3: Enhance Service Description Section, Task 4: Add New Token Creation User Responsibilities Section, Task 5: Enhance Fees and Payments Section, Task 6: Final Integration Testing and Validation (+1 more)

### Community 165 - "useLiquidityProvider.ts"
Cohesion: 0.21
Nodes (8): clmmParams, cpmmParams, buildLiquidityRequest(), resolveTokenBAddress(), signSendAndConfirm(), TOKEN_B_MINT_ADDRESSES, useLiquidityProvider(), UseLiquidityProviderReturn

### Community 166 - "Format"
Cohesion: 0.22
Nodes (8): ADR-001: Hybrid Client/Server Transaction Model, ADR-002: 5-Layer Tool Architecture, ADR-003: Privacy-First No-Data-Collection, ADR-004: React Compiler — No Manual Memoization, ADR-005: Agent Team Architecture for Claude Code, ADR-006: VersionedTransaction (v0) Without Address Lookup Tables, Architecture Decisions, Format

### Community 167 - "Key Patterns"
Cohesion: 0.22
Nodes (8): API Route Pattern, Critical Rules, Hybrid Client/Server Model, Key Patterns, Output Format, Server-Side Transaction Preparation, Solana Conventions, Source-of-Truth Order

### Community 168 - "Workflow"
Cohesion: 0.22
Nodes (8): CloakForge Tool Pattern, Phase 1: Discovery, Phase 2: Alignment, Phase 3: Design, Phase 4: Refinement, Rules, Source-of-Truth Order, Workflow

### Community 169 - "Review Checklist"
Cohesion: 0.22
Nodes (8): Code Review Skill, Correctness, Patterns, Performance, Review Checklist, Review Verdict, Security (Web3-Critical), Severity Levels

### Community 170 - "Performance Skill"
Cohesion: 0.22
Nodes (8): Bundle Optimization, Cache Components, Core Web Vitals, Image Optimization, Next.js 16 Caching, Performance Skill, Solana RPC Optimization, Static vs Dynamic

### Community 171 - "Security Audit Skill"
Cohesion: 0.22
Nodes (8): Audit Process, OWASP Top 10 (Web3 Context), Privacy-First Principles, Security Audit Skill, Server Security, Transaction Safety, Wallet Security, Web3 Security Checklist

### Community 172 - "useWalletTokensForTool.ts"
Cohesion: 0.28
Nodes (14): mockPublicKey, mockTokens, fetchWalletTokensForTool(), useWalletTokensForAll(), useWalletTokensForBurnTool(), useWalletTokensForFreezeWallets(), useWalletTokensForLiquidityProvider(), useWalletTokensForRevokeFreezeAuthority() (+6 more)

### Community 173 - "/orchestrate"
Cohesion: 0.25
Nodes (7): Agent Team Workflow, Cost Optimization, /orchestrate, Orchestrator Agent Responsibilities, Process, Usage Example, When to Use

### Community 174 - "Types"
Cohesion: 0.25
Nodes (7): `api <tool-name>`, `component <Name>`, `hook <useName>`, Rules, /scaffold, `tool <tool-name>`, Types

### Community 175 - "Solana Patterns"
Cohesion: 0.25
Nodes (7): API Route, Client Hook Flow, Error Codes, Solana Patterns, Testing, Token Operations Quick Reference, Transaction Building (Server-Side)

### Community 176 - "Conventional Commits"
Cohesion: 0.25
Nodes (7): Branching, Conventional Commits, Examples, Git Workflow Skill, PR Guidelines, Scopes, Types

### Community 177 - "Testing Strategy Skill"
Cohesion: 0.25
Nodes (7): File Conventions, Mocking Patterns, TDD Workflow, Test Commands, Test Pyramid, Testing Strategy Skill, What to Test

### Community 178 - "frontend.md"
Cohesion: 0.29
Nodes (6): Common Components (check FIRST before creating), Component Architecture (5-Layer Tool Pattern), Forms, React 19 + Next.js 16 Rules, State Management, Styling

### Community 179 - "testing.md"
Cohesion: 0.29
Nodes (6): File Conventions, Mocking Patterns, TDD Workflow, Test Pyramid, What NOT to Test, What to Test

### Community 180 - "init_skill.py"
Cohesion: 0.38
Nodes (6): init_skill(), main(), # TODO: Add actual script logic here, Convert hyphenated skill name to Title Case for display., Initialize a new skill directory with template SKILL.md.      Args:         skil, title_case_skill_name()

### Community 181 - "package_skill"
Cohesion: 0.38
Nodes (5): main(), package_skill(), Package a skill folder into a .skill file.      Args:         skill_path: Path t, Basic validation of a skill, validate_skill()

### Community 182 - "Actions"
Cohesion: 0.29
Nodes (6): Actions, No argument, Notes, `off`, `on`, /team

### Community 183 - "Project State"
Cohesion: 0.29
Nodes (6): Active Branches, Completed Features, Current Sprint, In Progress, Known Issues, Project State

### Community 185 - "page.tsx"
Cohesion: 0.19
Nodes (11): BlogPage(), metadata, BlogPostPage(), BlogPostPageProps, generateMetadata(), generateStaticParams(), renderOptions, RichTextRenderer() (+3 more)

### Community 186 - "docs.agent.md"
Cohesion: 0.33
Nodes (5): Allowed Documents, Output Format, Rules, Scope Constraints, Style

### Community 187 - "solana.md"
Cohesion: 0.33
Nodes (5): Client-Side Flow (hooks), Error Handling, Key Rules, Server-Side Flow (API + utilities), Transaction Building

### Community 188 - "Superpowers Usage Control"
Cohesion: 0.33
Nodes (5): Examples, Override Default Superpowers Behavior, Priority Order, Superpowers Usage Control, This Rule Overrides

### Community 189 - "orchestrator.agent.md"
Cohesion: 0.33
Nodes (5): Core Workflow, Routing Policy, Rules, Session Guidance, Subagent Brief Contract

### Community 190 - "transactions.test.ts"
Cohesion: 0.18
Nodes (8): mockGetLatestBlockhashLegacy, mockGetSignatureStatus, mockKitRpc, mockLegacyConnection, mockLogger, mockSend, createTransaction(), getFreshBlockhash()

### Community 191 - "benefitsData.ts"
Cohesion: 0.21
Nodes (9): Benefit, benefits, cardVariants, comparisonData, ComparisonRow, containerVariants, BenefitsGrid(), ComparisonRowComponent() (+1 more)

### Community 192 - "backend.md"
Cohesion: 0.40
Nodes (4): API Route Template, Critical Rules, Hybrid Client/Server Model, Server Utility Template

### Community 193 - "/dispatch"
Cohesion: 0.40
Nodes (4): /dispatch, Principles, Process, Rules

### Community 194 - "docs.agent.md"
Cohesion: 0.40
Nodes (4): Documentation Style, Rules, Source-of-Truth Documents, Workflow

### Community 195 - "AppProvider.tsx"
Cohesion: 0.24
Nodes (8): getAllToolConfigurations(), getCachedToolConfigurations(), AppProvider(), AppProviderProps, getQueryClient(), makeQueryClient(), QueryProvider(), NOTE: Avoid useState when initializing the query client if you don't

### Community 196 - "NotificationCard.tsx"
Cohesion: 0.29
Nodes (5): NotificationCard(), NotificationCardProps, FeeCalculationNote(), ImportantNotes(), NetworkFeeNote()

### Community 197 - "mcp.json"
Cohesion: 0.50
Nodes (4): npx, next-devtools, shadcn, solana

### Community 198 - "docs.md"
Cohesion: 0.50
Nodes (3): Allowed Documents, Rules, Style

### Community 199 - "/fix-bug"
Cohesion: 0.50
Nodes (3): /fix-bug, Process, Systematic Debugging Checklist

### Community 200 - "/init"
Cohesion: 0.50
Nodes (3): Gather Context, /init, Present Overview

### Community 201 - "Solana RPC Optimization Checklist"
Cohesion: 0.50
Nodes (4): Batch Operations, Caching Strategy, Connection Management, Solana RPC Optimization Checklist

### Community 202 - "Bundle Optimization Checklist"
Cohesion: 0.50
Nodes (4): Bundle Optimization Checklist, Client Boundary Optimization, Code Splitting, Import Optimization

### Community 203 - "Core Web Vitals Optimization"
Cohesion: 0.50
Nodes (4): Core Web Vitals Optimization, Cumulative Layout Shift (CLS) < 0.1, Interaction to Next Paint (INP) < 200ms, Largest Contentful Paint (LCP) < 2.5s

### Community 204 - "Performance Audit Process"
Cohesion: 0.50
Nodes (4): 1. Measure Current State, 2. Identify Bottlenecks, 3. Apply Optimizations, Performance Audit Process

### Community 205 - "Common Performance Issues"
Cohesion: 0.50
Nodes (4): Bundle Bloat, Common Performance Issues, RPC Overhead, Unnecessary Re-renders

### Community 206 - "/refactor"
Cohesion: 0.50
Nodes (3): Process, /refactor, Rules

### Community 207 - "Output Patterns"
Cohesion: 0.50
Nodes (3): Examples Pattern, Output Patterns, Template Pattern

### Community 208 - "Workflow Patterns"
Cohesion: 0.50
Nodes (3): Conditional Workflows, Sequential Workflows, Workflow Patterns

### Community 209 - "/status"
Cohesion: 0.50
Nodes (3): Gather, Report, /status

### Community 210 - "Schema-First TDD"
Cohesion: 0.50
Nodes (4): Green: Implement schema validation, Red: Write failing schema test, Refactor: Extract validation logic, Schema-First TDD

### Community 211 - "cleanup.sh"
Cohesion: 0.83
Nodes (3): safe_remove_dir(), safe_remove_file(), cleanup.sh script

### Community 212 - "monitor.agent.md"
Cohesion: 0.50
Nodes (3): Checks, Output Format, Responsibilities

### Community 213 - "page.tsx"
Cohesion: 0.28
Nodes (5): BottomCTA(), ComparisonTable(), BenefitsSection(), SectionHeader(), PricingSection()

### Community 214 - "index.tsx"
Cohesion: 0.42
Nodes (5): LiquidityProviderForm(), LiquidityProviderFormInput, LiquidityProviderFormData, LiquidityProviderFormSchema, positiveNumericString

### Community 217 - "Performance Testing Checklist"
Cohesion: 0.67
Nodes (3): Automated Testing, Manual Testing, Performance Testing Checklist

### Community 218 - "Post-Optimization Verification"
Cohesion: 0.67
Nodes (3): Documentation, Post-Optimization Verification, Re-measurement

### Community 219 - "Image Optimization Checklist"
Cohesion: 0.67
Nodes (3): Image Formats, Image Optimization Checklist, Next.js Image Component

### Community 220 - "Next.js 16 Caching Optimization"
Cohesion: 0.67
Nodes (3): Next.js 16 Caching Optimization, Route-Level Caching, Server Component Caching

### Community 221 - "Solana RPC Optimization"
Cohesion: 0.67
Nodes (3): Batch Operations, Smart Caching, Solana RPC Optimization

### Community 222 - "Bundle Optimization"
Cohesion: 0.67
Nodes (3): Bundle Optimization, Client Boundary Optimization, Tree Shaking

### Community 227 - "API Route Mocking with MSW"
Cohesion: 0.67
Nodes (3): API Route Mocking with MSW, Dynamic Response Mocking, Setup MSW Server

### Community 228 - "Solana RPC Mocking"
Cohesion: 0.67
Nodes (3): Mock Connection, Mock Specific RPC Methods, Solana RPC Mocking

### Community 229 - "CloakForge Testing Patterns"
Cohesion: 0.67
Nodes (3): API Route Testing, CloakForge Testing Patterns, Solana Transaction Testing

### Community 230 - "Priority Matrix"
Cohesion: 0.67
Nodes (3): High Priority (Must Test), Medium Priority (Should Test), Priority Matrix

### Community 278 - "createRaydiumPosition.test.ts"
Cohesion: 0.22
Nodes (5): MOCK_WALLET, mockGetMint, mockGetPoolInfoFromRpc, mockLegacyConnection, mockOpenPositionFromLiquidity

### Community 279 - "route.ts"
Cohesion: 0.33
Nodes (6): POST, WalletTokensRequest, walletTokensRequestSchema, WalletTokensResponse, ServerToolType, ServerWalletTokensResult

### Community 280 - "TokenItem.tsx"
Cohesion: 0.40
Nodes (5): SelectedTokenDisplayProps, TokenItem(), TokenItemProps, ServerTokenMetadata, ServerTokenWithMetadata

### Community 281 - "ToolActionButton.tsx"
Cohesion: 0.53
Nodes (4): ToolActionButton, ToolActionButtonProps, useIsToolEnabled(), useToolConfiguration()

## Knowledge Gaps
- **1506 isolated node(s):** `name`, `version`, `private`, `dev`, `dev:debug` (+1501 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **69 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Wallet UI & Info Tooltips` to `Custom Form Field & File Upload`, `Admin Panel & Error Pages`, `Token Dashboard & Liquidity Info`, `Loading States`, `SPL Tokens & Transactions Tabs`, `Unified Form Card Components`, `Site Navigation Menus`, `Analytics Tab & Distribution Items`, `Legal Notice Cards`, `Tool Landing Pages (LP/Revoke Mint)`, `MobileNavigationMenu.tsx`, `Wallet Connection Buttons`, `Header Logo & Navigation`?**
  _High betweenness centrality (0.046) - this node is a cross-community bridge._
- **Why does `dependencies` connect `Hero Section Background & CTAs` to `Header Logo & Navigation`, `Wallet Info & Benefits Section`, `Notification & Fee Calculation Notes`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._
- **Why does `react` connect `Header Logo & Navigation` to `Wallet Balance Query Hook`, `Hero Section Background & CTAs`, `route.ts`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._
- **What connects `NOTE: This file should not be edited`, `name`, `version` to the rest of the system?**
  _1529 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Test Utilities & Mocks` be split into smaller, more focused modules?**
  _Cohesion score 0.06138841078600115 - nodes in this community are weakly interconnected._
- **Should `Admin Panel & Error Pages` be split into smaller, more focused modules?**
  _Cohesion score 0.08333333333333333 - nodes in this community are weakly interconnected._
- **Should `Wallet UI & Info Tooltips` be split into smaller, more focused modules?**
  _Cohesion score 0.06140350877192982 - nodes in this community are weakly interconnected._