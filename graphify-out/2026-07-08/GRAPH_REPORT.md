# Graph Report - cloakforge  (2026-07-08)

## Corpus Check
- 747 files · ~263,439 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1938 nodes · 4962 edges · 126 communities (98 shown, 28 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 18 edges (avg confidence: 0.74)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d1da1fc9`
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
- Service Fees & Tool Config Provider
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
- Admin Transaction Row & Badges
- Blog Client & Hero
- Revoke Mint Authority Form
- Service Fee Extraction from Memo
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
- Wallet Tokens API Schema
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
- serviceMemo.ts
- index.ts
- MobileNavigationMenu.tsx
- .mcp.json
- useTransactionMultisender.ts
- ToolActionButton.tsx
- route.test.ts
- WalletMultiButtonSkeleton.tsx
- legalConfig.ts
- validateRequestBody
- CLAUDE.md

## God Nodes (most connected - your core abstractions)
1. `getLogger()` - 102 edges
2. `cn()` - 95 edges
3. `Card` - 48 edges
4. `CardContent` - 47 edges
5. `Button` - 39 edges
6. `AppError` - 39 edges
7. `getToolUIConfig()` - 34 edges
8. `createConnectionPair()` - 29 edges
9. `getServerConfig()` - 28 edges
10. `useToolConfig()` - 25 edges

## Surprising Connections (you probably didn't know these)
- `Raydium Liquidity Provider Implementation Plan` --references--> `useLiquidityProvider()`  [EXTRACTED]
  docs/superpowers/plans/2026-04-06-liquidity-provider-implementation.md → src/hooks/solana/useLiquidityProvider.ts
- `Comprehensive Liquidity Provider Unit Tests Plan` --references--> `useLiquidityProvider()`  [EXTRACTED]
  docs/superpowers/plans/2026-04-08-comprehensive-liquidity-provider-unit-tests.md → src/hooks/solana/useLiquidityProvider.ts
- `Raydium Liquidity Provider Design Spec` --references--> `useLiquidityProvider()`  [EXTRACTED]
  docs/superpowers/specs/2026-04-06-liquidity-provider-design.md → src/hooks/solana/useLiquidityProvider.ts
- `Legal Document Improvements Implementation Plan` --references--> `getLegalEntityInfo()`  [EXTRACTED]
  docs/superpowers/plans/2026-03-22-legal-document-improvements.md → src/lib/config/legalConfig.ts
- `Raydium Liquidity Provider Implementation Plan` --references--> `POST`  [EXTRACTED]
  docs/superpowers/plans/2026-04-06-liquidity-provider-implementation.md → src/app/api/solana/liquidity-provider/route.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **CloakForge legal document overhaul (privacy/terms, MiCA repositioning, imprint navigation)** — docs_superpowers_plans_2026_03_22_legal_document_improvements_plan, docs_superpowers_specs_2026_03_22_legal_document_improvements_design_spec, docs_superpowers_plans_2026_03_29_mica_compliance_implementation_plan, docs_superpowers_specs_2026_03_29_mica_compliance_design_spec, docs_superpowers_specs_2026_03_29_imprint_navigation_design_spec [INFERRED 0.75]
- **Raydium Liquidity Provider tool built via CloakForge 5-layer pattern, spec'd, implemented, and comprehensively tested** — docs_superpowers_specs_2026_04_06_liquidity_provider_design_spec, docs_superpowers_plans_2026_04_06_liquidity_provider_implementation_plan, docs_superpowers_plans_2026_04_08_comprehensive_liquidity_provider_unit_tests_plan, concept_5_layer_tool_architecture [INFERRED 0.85]
- **X logo component design and rollout across footer, form labels, and buttons** — docs_superpowers_specs_2026_03_29_x_logo_twitter_replacement_design_spec, docs_superpowers_plans_2026_03_29_x_logo_replacement_plan, src_components_common_xlogo_xlogo, src_components_common_globalfooter_footerdata_footerdata [INFERRED 0.85]

## Communities (126 total, 28 thin omitted)

### Community 0 - "Test Utilities & Mocks"
Cohesion: 0.13
Nodes (29): resetToDefaultMocks(), mockConnection, mockConnection, useBurnTokens(), useFreezeWallets(), useLiquidityProvider(), RevokeFreezeAuthorityParams, RevokeFreezeAuthorityRequest (+21 more)

### Community 1 - "Home & Tools Landing Pages"
Cohesion: 0.05
Nodes (44): Benefit, benefits, cardVariants, comparisonData, ComparisonRow, containerVariants, BenefitsGrid(), BottomCTA() (+36 more)

### Community 2 - "Admin Panel & Error Pages"
Cohesion: 0.08
Nodes (23): AdminPage(), LoadingSpinner(), ActionButtons(), ActionButtonsProps, ActionButtons(), ErrorDisplay(), FloatingElements(), NavigationCard() (+15 more)

### Community 3 - "Wallet UI & Info Tooltips"
Cohesion: 0.07
Nodes (30): InfoTooltip(), Props, Alert(), AlertDescription(), AlertTitle(), alertVariants, Avatar(), AvatarFallback() (+22 more)

### Community 4 - "Server Config & Tool Cache"
Cohesion: 0.19
Nodes (26): Transaction, getServerConfig(), getCachedToolConfig(), createConnectionPair(), BurnTokenParams, BurnTokenResult, createBurnTokenTransaction(), createBatchFreezeTransaction() (+18 more)

### Community 5 - "Admin Transactions & Pinata Upload"
Cohesion: 0.18
Nodes (14): config, logger, pinata, POST(), ApiRouteConfig, AppError, ERROR_MESSAGES, ErrorCode (+6 more)

### Community 6 - "Token Auditor Tool Page"
Cohesion: 0.11
Nodes (16): TokenAuditorPage(), TokenAuditorPageProps, BenefitsSection(), FAQSection(), HeroSection(), TokenAuditForm(), faqData, valueProps (+8 more)

### Community 7 - "Loading States"
Cohesion: 0.12
Nodes (12): InfoCard(), InfoCardProps, TableHeader(), features, trustReasons, FormFieldsProps, Card, CardContent (+4 more)

### Community 8 - "Number Fields & Wallet Tokens List"
Cohesion: 0.11
Nodes (32): Props, NumberField(), NumberFieldProps, ServiceFilterProps, AdvancedSettingsSectionProps, feeTierOptions, PoolConfigurationSectionProps, PoolTypeSectionProps (+24 more)

### Community 9 - "SPL Tokens & Transactions Tabs"
Cohesion: 0.24
Nodes (14): AdminTransactionsTableProps, FeeTableHeader(), ServiceFee, ServiceRow(), ServiceRowProps, Table, TableBody, TableCaption (+6 more)

### Community 10 - "Wallet Balance Query Hook"
Cohesion: 0.16
Nodes (16): TestPage(), mockGetBalance, TEST_ADDRESS, useGetBalanceQuery(), getConfig(), getSolanaPrice(), getWalletBalance(), lamportsToSol() (+8 more)

### Community 11 - "API Route Handlers (GET/POST)"
Cohesion: 0.11
Nodes (23): GET, logger, POST(), requestSchema, AnnouncementBanner(), AnnouncementBannerProps, AppLogger, getLogger() (+15 more)

### Community 12 - "Fee Breakdown & Confirmation Form"
Cohesion: 0.10
Nodes (29): AuthorityControlsForm(), AuthorityControlsFormProps, BasicInformationForm(), BasicInformationFormProps, FormSections(), FormSectionsProps, LogoUploadForm(), LogoUploadFormProps (+21 more)

### Community 13 - "Analytics Tab & Distribution Items"
Cohesion: 0.10
Nodes (25): BasicWalletInfo(), BasicWalletInfoProps, HeroSection(), HeroSectionProps, AnalyticsTab(), AnalyticsTabProps, DistributionItemProps, AnalyticsTabProps (+17 more)

### Community 14 - "Site Navigation Menus"
Cohesion: 0.18
Nodes (18): defaultNavigationItems, NavigationGroup, NavigationItem, othersNavigationItems, toolsNavigationItems, NavigationMenuItem(), NavigationMenuItemProps, OthersMenu() (+10 more)

### Community 15 - "Compliance & Data Collection Notices"
Cohesion: 0.10
Nodes (18): BackgroundElements(), BottomBadge(), ComplianceGrid(), DataCollectionNote(), DataPrivacyTable(), SecurityPrivacySection(), MinimalDataList(), ProtectedDataList() (+10 more)

### Community 16 - "Token Creator Page & Upload Tests"
Cohesion: 0.13
Nodes (12): tokenCreatorBenefitsConfig, FAQSection(), BackgroundElements(), HeroHeader(), HeroSection(), TokenCreationFormWrapper(), AuthorityControl, FAQ (+4 more)

### Community 17 - "Freeze Wallets Tool Page"
Cohesion: 0.14
Nodes (10): BenefitsSection(), freezeWalletsBenefitsConfig, FreezeForm(), FAQ, faqs, Feature, features, FreezeWalletsPage() (+2 more)

### Community 18 - "Burn Tokens Hook & Tests"
Cohesion: 0.11
Nodes (16): BurnTokensPage(), TokenCreationSuccessProps, mockConnection, BurnTokensParams, BurnTokensResult, UseBurnTokensReturn, BurnTokensRequest, ResponseStatus (+8 more)

### Community 19 - "Unfreeze Wallets Tool Page"
Cohesion: 0.12
Nodes (11): unfreezeWalletsBenefitsConfig, FAQSection(), HeroHeader(), HeroSection(), UnfreezeForm(), FAQ, faqs, Feature (+3 more)

### Community 20 - "Hero Section Background & CTAs"
Cohesion: 0.12
Nodes (16): logger, AdminTransactionsTable(), mockPublicKey, mockTransactionsData, VALID_AUTH, TransactionsData, TransactionsResponse, useAdminTransactionsQuery() (+8 more)

### Community 21 - "Error Boundaries"
Cohesion: 0.13
Nodes (12): Error(), ErrorProps, GlobalError(), GlobalErrorProps, ErrorActionButtons(), ErrorActionButtonsProps, ErrorPage(), ErrorPageProps (+4 more)

### Community 22 - "Wallet Info & Benefits Section"
Cohesion: 0.20
Nodes (7): BlogSearchAndFilterProps, Category, EmptyTokensStateProps, TokenAuditorErrorProps, ActionButtons(), Button, ButtonProps

### Community 23 - "Burn Tokens Form Components"
Cohesion: 0.21
Nodes (15): BurnAmountForm(), BurnAmountFormProps, BurnForm(), BurnFormProps, BurnTokensFormData, burnTokensFormSchema, ConfirmationForm(), ConfirmationFormProps (+7 more)

### Community 24 - "JSON/Log Upload API Routes"
Cohesion: 0.11
Nodes (17): config, jsonUploadSchema, pinata, POST, logRequestSchema, POST, POST, POST (+9 more)

### Community 25 - "Platform Features Grid"
Cohesion: 0.18
Nodes (16): FeaturesGrid(), PlatformFeatures(), Feature, features, Stat, stats, timelineData, TimelineStep (+8 more)

### Community 26 - "Liquidity Provider Benefits & FAQ"
Cohesion: 0.17
Nodes (12): liquidityProviderBenefitsConfig, liquidityProviderFAQ, FAQSection(), HeroSection(), benefits, features, createTestQueryClient(), CustomRenderOptions (+4 more)

### Community 27 - "Freeze Authority API Routes"
Cohesion: 0.12
Nodes (14): BatchFreezeResponse, POST, POST, UnsignedRevokeFreezeAuthorityResponse, POST, POST, UnsignedMultisenderResponse, FreezeWalletRequestSchema (+6 more)

### Community 28 - "Header Logo & Navigation"
Cohesion: 0.15
Nodes (12): MobileLogo(), MobileNavigationProps, WalletConnectionButton(), WalletMultiButton, Sheet(), SheetContent(), SheetDescription(), SheetFooter() (+4 more)

### Community 29 - "Root Layout & Global Footer"
Cohesion: 0.20
Nodes (12): GlobalFooter(), FooterBottom(), FooterBrand(), FooterLink, footerLinks, FooterSection, SocialLink, socialLinks (+4 more)

### Community 30 - "Multisender Tool Page"
Cohesion: 0.07
Nodes (20): BaseFeature, FeatureCard(), FeatureCardProps, FeatureWithBenefits, FeatureWithDetails, hasBenefits(), hasDetails(), UnifiedFeature (+12 more)

### Community 31 - "Tool Action Buttons & Config"
Cohesion: 0.14
Nodes (14): UnifiedActionButtons(), AdvancedSettingsSection(), FormSections(), FormSectionsProps, PoolConfigurationSection(), PoolTypeSection(), LiquidityProviderForm(), LiquidityProviderFormInput (+6 more)

### Community 32 - "Liquidity Provider Test Mocks"
Cohesion: 0.23
Nodes (13): MOCK_ADDRESSES, mockFormData, mockLiquidityProviderParams, mockLiquidityProviderParamsCLMM, mockLiquidityProviderRequest, mockLiquidityProviderRequestCLMM, mockLiquidityProviderResponse, FeeTier (+5 more)

### Community 34 - "Custom Form Field & File Upload"
Cohesion: 0.18
Nodes (9): DirectionOptions, FileInput, FileUploader, FileUploaderContent, FileUploaderContext, FileUploaderContextType, FileUploaderItem, FileUploaderProps (+1 more)

### Community 35 - "Announcement Banner & Contentful Client"
Cohesion: 0.17
Nodes (12): GET, bannerLogger, blogLogger, client, getSiteBanner(), serverConfig, SiteBanner, toolConfigLogger (+4 more)

### Community 36 - "Simple Card & Cost Optimization"
Cohesion: 0.06
Nodes (27): NotificationCard(), NotificationCardProps, SimpleCard(), SimpleCardProps, burnTokensFAQs, FAQSection(), BurnReason, burnReasons (+19 more)

### Community 37 - "Raydium Liquidity Provider Docs & Route"
Cohesion: 0.15
Nodes (19): 5-Layer Tool Architecture Pattern (Zod schema -> Page -> Hook -> API route -> Server utility), Raydium CPMM vs CLMM Pool Types - rationale: CPMM is simple full-range liquidity (default), CLMM is concentrated liquidity for capital efficiency, professional LPs need both, Raydium SDK v2 (@raydium-io/raydium-sdk-v2) Server-Side Pool Creation Integration - rationale: leverage official SDK for reliability, pool existence validation, fee-tier recommendations vs hand-rolled Raydium program calls, Raydium Liquidity Provider Implementation Plan, Comprehensive Liquidity Provider Unit Tests Plan, Raydium Liquidity Provider Design Spec, POST, CLMM_PROGRAM_ID (+11 more)

### Community 38 - "Connected Account Page"
Cohesion: 0.11
Nodes (5): HeroSectionLayout(), ConnectedAccountContent(), ConnectedAccountContentProps, ErrorWalletDataProps, Props

### Community 39 - "Token Dashboard & Liquidity Info"
Cohesion: 0.17
Nodes (15): mockTokenData, TokenData, TokenDashboardProps, LiquidityInfo(), LiquidityInfoProps, SecurityAnalysis(), SecurityAnalysisProps, TokenDetails() (+7 more)

### Community 40 - "Liquidity Pool Configuration Form"
Cohesion: 0.17
Nodes (13): MainContentTabsProps, TabsHeaderProps, formatAddress(), formatTimestamp(), getStatusDisplay(), getSuccessDisplay(), getTransactionIcon(), TransactionsTab() (+5 more)

### Community 41 - "Wallet Tokens Server Fetch & Metadata"
Cohesion: 0.07
Nodes (37): FeeBreakdownProps, getToolStyles(), TotalSection(), FeeCalculationResult, convertAddressToPublicKey(), convertPublicKeyToAddress(), shortenAddress(), AccountInfo (+29 more)

### Community 42 - "FAQ Items & Category Filter"
Cohesion: 0.25
Nodes (9): Category, CategoryFilter(), CategoryFilterProps, FAQ, FAQItem(), FAQItemProps, FAQSection(), FAQSectionProps (+1 more)

### Community 43 - "Token Selection Form"
Cohesion: 0.13
Nodes (33): ADR-0004, SelectedTokenDisplayProps, ManualTokenEntry(), TokenSelectionConfig, TokenSelectionForm(), TokenSelectionFormProps, TokenSelectionModeToggle(), BaseTokenFormData (+25 more)

### Community 44 - "Wallet Tokens Hook & Tests"
Cohesion: 0.12
Nodes (16): baseConfig, mockSignTransaction, mockWallet, BatchFreezeResponse, FreezeWalletsParams, FreezeWalletsRequest, FreezeWalletsResult, UseFreezeWalletsReturn (+8 more)

### Community 45 - "Unified Form Card Components"
Cohesion: 0.28
Nodes (10): GradientVariant, UnifiedActionButtonsProps, UnifiedFormCardProps, UnifiedFormHeaderProps, UnifiedFormWrapperProps, buttonVariants, gradientVariants, UnifiedFormHeader() (+2 more)

### Community 46 - "Freeze Token Validation & Fee Hook"
Cohesion: 0.33
Nodes (7): mockToolConfig, AdditionalFeeConfig, FeeBreakdownItem, FeeCalculationConfig, commonAdditionalFees, toolFeeConfigs, ToolId

### Community 47 - "Service Fees & Tool Config Provider"
Cohesion: 0.18
Nodes (10): fallbackServiceFees, mapToolConfigurationsToServiceFees(), TOOL_DISPLAY_MAP, useServiceFees(), ToolConfiguration, mockSetConfigs, ToolConfigProvider(), ToolConfigProviderProps (+2 more)

### Community 48 - "Tool Helpers & Config Registry"
Cohesion: 0.25
Nodes (10): BottomCTA(), ServiceShowcase(), SectionHeader(), ServiceCard(), ServiceCardProps, cardVariants, containerVariants, Service (+2 more)

### Community 49 - "Legal & MiCA Compliance Rationale"
Cohesion: 0.22
Nodes (13): Legal Entity Configuration via env vars - rationale: allow updating contact/business info without code changes, block prod deploy if missing, MiCA Infrastructure-Provider Positioning - rationale: resolve contradiction between 'we do not issue crypto-assets' language and the Token Creator tool by repositioning CloakForge as a non-CASP technical infrastructure/transaction-building provider, shifting compliance burden to users, Prohibited Jurisdictions Management - rationale: user-responsibility model without geo-blocking, demonstrates good-faith regulatory compliance while preserving non-custodial global access, Risk Level Indicator Pattern (high/medium/low) for DeFi tool risk communication, TL;DR Summary Box Pattern for legal document sections - rationale: improve readability/UX of dense legal language, Legal Document Improvements Implementation Plan, MiCA-Compliant Legal Positioning Implementation Plan, Legal Document Improvements Design Spec (+5 more)

### Community 50 - "Hero Section Layout & Heading"
Cohesion: 0.29
Nodes (4): AnimatedBackground(), AnimatedBackgroundProps, HeroHeadingProps, HeroSectionLayoutProps

### Community 51 - "Legal Notice Cards"
Cohesion: 0.19
Nodes (8): LegalNoticeCard(), LegalNoticeCardProps, LegalSection(), LegalSectionProps, imprintData, ImprintSectionData, PrivacySectionData, privacySectionsData

### Community 52 - "Terms of Service Content"
Cohesion: 0.24
Nodes (11): ContentSection(), FooterCTA(), ImportantNotice(), TermsContent(), TermsContentData, termsData, TermsSectionData, TermsList() (+3 more)

### Community 53 - "Tool Landing Pages (LP/Revoke Mint)"
Cohesion: 0.26
Nodes (4): benefitsConfig, revokeMintAuthorityFAQs, FAQSection(), HeroSection()

### Community 54 - "Blog Pages"
Cohesion: 0.19
Nodes (11): BlogPage(), metadata, BlogPostPage(), BlogPostPageProps, generateMetadata(), generateStaticParams(), renderOptions, RichTextRenderer() (+3 more)

### Community 55 - "Revoke Freeze Authority Tool Page"
Cohesion: 0.20
Nodes (8): revokeFreezeAuthorityBenefitsConfig, revokeFreezeAuthorityFAQs, FAQSection(), features, HeroSection(), trustReasons, RevokeFreezeAuthorityForm(), RevokeFreezeAuthorityPage()

### Community 56 - "Multisender Form & Confirmation"
Cohesion: 0.16
Nodes (14): SelectedTokenDisplay(), UnifiedFormCard(), UnifiedFormWrapper(), AccountInputForm(), AccountInputFormProps, ConfirmationForm(), ConfirmationFormProps, FormSections() (+6 more)

### Community 57 - "Multisender Token Validation & Metadata"
Cohesion: 0.24
Nodes (13): validateMultisenderToken(), deriveMetadataPDA(), fetchImageFromMetadataUri(), getToken2022Metadata(), getTokenMetadata(), getTokenMetadataWithBalance(), getTokensMetadata(), MetaplexMetadataAccount (+5 more)

### Community 58 - "Wallet Connection Buttons"
Cohesion: 0.30
Nodes (9): BaseWalletConnectionButton(), Props, BaseWalletMultiButton(), Props, WalletButton(), WalletButtonProps, LABELS, WalletMultiButton() (+1 more)

### Community 59 - "Account Input & Confirmation Form"
Cohesion: 0.19
Nodes (11): FeeBreakdown(), AccountInputForm(), AccountInputFormProps, ConfirmationForm(), ConfirmationFormProps, FormSections(), FormSectionsProps, defaultValues (+3 more)

### Community 60 - "Raydium Pool Creation V0 Tx Tests"
Cohesion: 0.14
Nodes (9): MOCK_CLMM_CONFIG_100, MOCK_CLMM_CONFIG_500, MOCK_CPMM_CONFIG, MOCK_WALLET, mockClmmCreatePool, mockCpmmCreatePool, mockGetMint, mockLegacyConnection (+1 more)

### Community 61 - "Privacy Policy Page"
Cohesion: 0.29
Nodes (4): PrivacyContentSection(), PrivacyFooterSection(), PrivacyHeroSection(), PrivacyPolicyPage()

### Community 62 - "XLogo & Authority Controls Form"
Cohesion: 0.18
Nodes (7): ExplorerLink(), clmmParams, cpmmParams, buildLiquidityRequest(), resolveTokenBAddress(), TOKEN_B_MINT_ADDRESSES, UseLiquidityProviderReturn

### Community 63 - "Admin Transaction Row & Badges"
Cohesion: 0.28
Nodes (12): TransactionData, ServiceFilter(), getServiceBadgeProps(), ServiceBadge(), TransactionRow(), TransactionRowProps, TransactionData, ServiceIdentifier (+4 more)

### Community 64 - "Blog Client & Hero"
Cohesion: 0.25
Nodes (4): BlogClientProps, BlogHeroProps, BlogPostsGridProps, BlogPost

### Community 65 - "Revoke Mint Authority Form"
Cohesion: 0.34
Nodes (9): ConfirmationForm(), ConfirmationFormProps, FormSections(), FormSectionsProps, defaultValues, RevokeMintAuthorityForm(), RevokeMintAuthorityFormData, revokeMintAuthorityFormSchema (+1 more)

### Community 66 - "Service Fee Extraction from Memo"
Cohesion: 0.29
Nodes (10): calculateServiceFee(), extractServiceFeeFromMemo(), extractServiceIdentifier(), extractServiceIdentifierFromMemo(), GET(), getPayerFromTransaction(), SignatureOptions, TransactionsData (+2 more)

### Community 67 - "Imprint Page"
Cohesion: 0.29
Nodes (4): ImprintContentSection(), ImprintFooterSection(), ImprintHeroSection(), ImprintPage()

### Community 68 - "Burn Reasons & Feature Highlights"
Cohesion: 0.17
Nodes (11): getAllToolConfigurations(), mockGetAllToolConfigurations, getCachedToolConfigurations(), isToolEnabled(), logger, AppProvider(), AppProviderProps, getQueryClient() (+3 more)

### Community 69 - "Terms of Service Page"
Cohesion: 0.31
Nodes (3): LegalHeroSection(), LegalHeroSectionProps, HeroSection()

### Community 70 - "Core Architecture Docs & Rationale"
Cohesion: 0.40
Nodes (10): Contentful Webhook + Next.js revalidateTag Cache Revalidation - rationale: long cacheLife('days') for low API cost, instant revalidation via webhook for freshness, Documentation Philosophy: KISS/DRY, exactly 4 core docs - rationale: prior 10+ overlapping docs left developers lost in the repo, AppError / SolanaError Error Handling System with getLogger and handleError, Hybrid Client/Server Architecture (client signs, server prepares via private RPC) - rationale: privacy-first, no server-held keys, no rate-limited public RPC on server, CloakForge Architecture Doc, Contentful Webhook Setup Doc, CloakForge Development Guide, CloakForge Documentation Index (+2 more)

### Community 71 - "Notification & Fee Calculation Notes"
Cohesion: 0.16
Nodes (7): DMSans, metadata, DesktopNavigation(), GlobalHeader(), Logo(), MobileNavigation(), NotificationProps

### Community 72 - "Raydium Pool Creation Tests"
Cohesion: 0.22
Nodes (7): MOCK_WALLET, mockClmmCreatePool, mockCpmmCreatePool, mockFetchClmmConfig, mockFetchCpmmConfig, mockGetMint, mockLegacyConnection

### Community 73 - "Balance Validation Tests"
Cohesion: 0.32
Nodes (6): makeConnection(), makeParams(), mockGetMinimumBalanceForRentExemptMint, walletPublicKey, GenericBalanceParams, GenericBalanceResult

### Community 74 - "Solana Test Helpers"
Cohesion: 0.36
Nodes (6): createMockMessageV0(), createMockRaydiumSDK(), createMockVersionedTransaction(), mockRaydiumSDK(), mockSolanaConnection(), TEST_ADDRESSES

### Community 75 - "XLogo Component & Twitter Rebrand Docs"
Cohesion: 0.33
Nodes (7): XLogo Reusable Component Pattern (sm/md/lg/number size variants via Next.js Image) - rationale: unify X/Twitter branding across footer, forms, buttons after Twitter->X rebrand, X Logo Twitter Icon Replacement Implementation Plan, Imprint Navigation Integration Design Spec, X Logo Twitter Icon Replacement Design Spec, footerData.ts (GlobalFooter), navigationData.ts (GlobalHeader), XLogo component

### Community 76 - "Token Creator Zod Schemas"
Cohesion: 0.29
Nodes (6): TokenCreatorApiData, tokenCreatorApiDataSchema, TokenCreatorFormData, tokenCreatorFormSchema, TokenDataBase, tokenDataBaseSchema

### Community 77 - "Wallet Tokens API Schema"
Cohesion: 0.33
Nodes (6): POST, WalletTokensRequest, walletTokensRequestSchema, WalletTokensResponse, ServerToolType, ServerWalletTokensResult

### Community 78 - "Fee Breakdown Component"
Cohesion: 0.37
Nodes (8): ConfirmationForm(), ConfirmationFormProps, FormSections(), FormSectionsProps, defaultValues, RevokeFreezeAuthorityFormData, revokeFreezeAuthorityFormSchema, validateRevokeFreezeAuthorityToken()

### Community 79 - "Solana Address Utilities"
Cohesion: 0.16
Nodes (9): mockGetLatestBlockhashLegacy, mockGetSignatureStatus, mockKitRpc, mockLegacyConnection, mockLogger, mockSend, addComputeBudgetInstructionsVersioned(), createTransaction() (+1 more)

### Community 115 - "serviceMemo.ts"
Cohesion: 0.23
Nodes (9): CreateMultisenderTransactionParams, CreateMultisenderTransactionResult, Recipient, addServiceMemo(), extractServiceUsageFromSignatures(), MEMO_PROGRAM_ID, TODO: Implement transaction parsing logic, SERVICE_IDENTIFIERS (+1 more)

### Community 116 - "index.ts"
Cohesion: 0.31
Nodes (6): BenefitsSectionConfig, BenefitsSectionProps, CTAConfig, ValueProp, burnTokensBenefitsConfig, freezeValueProps

### Community 117 - "MobileNavigationMenu.tsx"
Cohesion: 0.39
Nodes (6): MobileNavigationMenu(), MobileNavigationMenuProps, Accordion(), AccordionContent(), AccordionItem(), AccordionTrigger()

### Community 118 - ".mcp.json"
Cohesion: 0.33
Nodes (6): npx, /Users/daliborkralik/.local/share/uv/tools/graphifyy/bin/python, graphify, next-devtools, shadcn, solana

### Community 119 - "useTransactionMultisender.ts"
Cohesion: 0.29
Nodes (6): MultisenderParams, MultisenderRequest, MultisenderResult, Recipient, UnsignedMultisenderResponse, UseTransactionMultisenderReturn

### Community 120 - "ToolActionButton.tsx"
Cohesion: 0.53
Nodes (4): ToolActionButton, ToolActionButtonProps, useIsToolEnabled(), useToolConfiguration()

### Community 121 - "route.test.ts"
Cohesion: 0.40
Nodes (3): makeFormDataRequest(), mockPinataUpload, FormData

## Knowledge Gaps
- **372 isolated node(s):** `solana`, `/Users/daliborkralik/.local/share/uv/tools/graphifyy/bin/python`, `graphify`, `CustomRenderOptions`, `stableConnection` (+367 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **28 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Wallet UI & Info Tooltips` to `Custom Form Field & File Upload`, `Admin Panel & Error Pages`, `WalletMultiButtonSkeleton.tsx`, `Token Dashboard & Liquidity Info`, `Loading States`, `Number Fields & Wallet Tokens List`, `SPL Tokens & Transactions Tabs`, `Liquidity Pool Configuration Form`, `Unified Form Card Components`, `Site Navigation Menus`, `Freeze Wallets Tool Page`, `index.ts`, `MobileNavigationMenu.tsx`, `Wallet Info & Benefits Section`, `Multisender Form & Confirmation`, `Wallet Connection Buttons`, `Header Logo & Navigation`, `Root Layout & Global Footer`?**
  _High betweenness centrality (0.116) - this node is a cross-community bridge._
- **Why does `getLogger()` connect `API Route Handlers (GET/POST)` to `Test Utilities & Mocks`, `Admin Panel & Error Pages`, `Server Config & Tool Cache`, `Admin Transactions & Pinata Upload`, `Token Auditor Tool Page`, `SPL Tokens & Transactions Tabs`, `Wallet Balance Query Hook`, `Fee Breakdown & Confirmation Form`, `Freeze Wallets Tool Page`, `Burn Tokens Hook & Tests`, `Unfreeze Wallets Tool Page`, `Hero Section Background & CTAs`, `Error Boundaries`, `Burn Tokens Form Components`, `JSON/Log Upload API Routes`, `Announcement Banner & Contentful Client`, `Raydium Liquidity Provider Docs & Route`, `Wallet Tokens Server Fetch & Metadata`, `Token Selection Form`, `Wallet Tokens Hook & Tests`, `Freeze Token Validation & Fee Hook`, `Revoke Freeze Authority Tool Page`, `Multisender Form & Confirmation`, `Multisender Token Validation & Metadata`, `Account Input & Confirmation Form`, `Revoke Mint Authority Form`, `Service Fee Extraction from Memo`, `Burn Reasons & Feature Highlights`, `Balance Validation Tests`, `Fee Breakdown Component`, `Solana Address Utilities`, `serviceMemo.ts`, `useTransactionMultisender.ts`?**
  _High betweenness centrality (0.108) - this node is a cross-community bridge._
- **Why does `Button` connect `Wallet Info & Benefits Section` to `Home & Tools Landing Pages`, `Admin Panel & Error Pages`, `Simple Card & Cost Optimization`, `Connected Account Page`, `Loading States`, `Token Dashboard & Liquidity Info`, `Liquidity Pool Configuration Form`, `FAQ Items & Category Filter`, `API Route Handlers (GET/POST)`, `Token Selection Form`, `Analytics Tab & Distribution Items`, `SPL Tokens & Transactions Tabs`, `Tool Helpers & Config Registry`, `index.ts`, `Error Boundaries`, `ToolActionButton.tsx`, `Header Logo & Navigation`, `Admin Transaction Row & Badges`?**
  _High betweenness centrality (0.051) - this node is a cross-community bridge._
- **What connects `solana`, `/Users/daliborkralik/.local/share/uv/tools/graphifyy/bin/python`, `graphify` to the rest of the system?**
  _380 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Test Utilities & Mocks` be split into smaller, more focused modules?**
  _Cohesion score 0.13363363363363365 - nodes in this community are weakly interconnected._
- **Should `Home & Tools Landing Pages` be split into smaller, more focused modules?**
  _Cohesion score 0.05403348554033485 - nodes in this community are weakly interconnected._
- **Should `Admin Panel & Error Pages` be split into smaller, more focused modules?**
  _Cohesion score 0.08333333333333333 - nodes in this community are weakly interconnected._