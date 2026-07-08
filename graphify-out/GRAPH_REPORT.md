# Graph Report - .  (2026-07-08)

## Corpus Check
- Large corpus: 760 files · ~263,291 words. Semantic extraction will be expensive (many Claude tokens). Consider running on a subfolder.

## Summary
- 1929 nodes · 4954 edges · 115 communities (91 shown, 24 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 18 edges (avg confidence: 0.74)
- Token cost: 224,802 input · 0 output

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
- `Raydium Liquidity Provider Implementation Plan` --references--> `POST`  [EXTRACTED]
  docs/superpowers/plans/2026-04-06-liquidity-provider-implementation.md → src/app/api/solana/liquidity-provider/route.ts
- `Comprehensive Liquidity Provider Unit Tests Plan` --references--> `POST`  [EXTRACTED]
  docs/superpowers/plans/2026-04-08-comprehensive-liquidity-provider-unit-tests.md → src/app/api/solana/liquidity-provider/route.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **CloakForge legal document overhaul (privacy/terms, MiCA repositioning, imprint navigation)** — docs_superpowers_plans_2026_03_22_legal_document_improvements_plan, docs_superpowers_specs_2026_03_22_legal_document_improvements_design_spec, docs_superpowers_plans_2026_03_29_mica_compliance_implementation_plan, docs_superpowers_specs_2026_03_29_mica_compliance_design_spec, docs_superpowers_specs_2026_03_29_imprint_navigation_design_spec [INFERRED 0.75]
- **Raydium Liquidity Provider tool built via CloakForge 5-layer pattern, spec'd, implemented, and comprehensively tested** — docs_superpowers_specs_2026_04_06_liquidity_provider_design_spec, docs_superpowers_plans_2026_04_06_liquidity_provider_implementation_plan, docs_superpowers_plans_2026_04_08_comprehensive_liquidity_provider_unit_tests_plan, concept_5_layer_tool_architecture [INFERRED 0.85]
- **X logo component design and rollout across footer, form labels, and buttons** — docs_superpowers_specs_2026_03_29_x_logo_twitter_replacement_design_spec, docs_superpowers_plans_2026_03_29_x_logo_replacement_plan, src_components_common_xlogo_xlogo, src_components_common_globalfooter_footerdata_footerdata [INFERRED 0.85]

## Communities (115 total, 24 thin omitted)

### Community 0 - "Test Utilities & Mocks"
Cohesion: 0.06
Nodes (57): TestPage(), ExplorerLink(), Transaction, resetToDefaultMocks(), mockConnection, mockConnection, baseConfig, mockSignTransaction (+49 more)

### Community 1 - "Home & Tools Landing Pages"
Cohesion: 0.06
Nodes (38): BottomCTA(), ServiceShowcase(), SectionHeader(), ServiceCard(), ServiceCardProps, cardVariants, containerVariants, Service (+30 more)

### Community 2 - "Admin Panel & Error Pages"
Cohesion: 0.07
Nodes (32): AdminPage(), ActionButtons(), ErrorDisplay(), FloatingElements(), NavigationCard(), NavigationCardProps, NavigationTool, navigationToolsData (+24 more)

### Community 3 - "Wallet UI & Info Tooltips"
Cohesion: 0.06
Nodes (31): InfoTooltip(), Props, Alert(), AlertDescription(), AlertTitle(), alertVariants, Avatar(), AvatarFallback() (+23 more)

### Community 4 - "Server Config & Tool Cache"
Cohesion: 0.12
Nodes (39): getServerConfig(), mockGetAllToolConfigurations, getCachedToolConfig(), isToolEnabled(), logger, createConnectionPair(), BurnTokenParams, BurnTokenResult (+31 more)

### Community 5 - "Admin Transactions & Pinata Upload"
Cohesion: 0.09
Nodes (26): config, logger, pinata, POST(), AdminTransactionsTable(), mockPublicKey, mockTransactionsData, VALID_AUTH (+18 more)

### Community 6 - "Token Auditor Tool Page"
Cohesion: 0.07
Nodes (28): TokenAuditorPage(), TokenAuditorPageProps, BaseFeature, FeatureCard(), FeatureCardProps, FeatureWithBenefits, FeatureWithDetails, hasBenefits() (+20 more)

### Community 7 - "Loading States"
Cohesion: 0.09
Nodes (15): InfoCard(), InfoCardProps, DistributionItemProps, TableHeader(), features, trustReasons, features, trustReasons (+7 more)

### Community 8 - "Number Fields & Wallet Tokens List"
Cohesion: 0.15
Nodes (20): NumberField(), NumberFieldProps, ExtendedWalletTokensListProps, AccountInputFormProps, ConfirmationFormProps, FormSectionsProps, FreezeFormData, AdvancedSettingsSectionProps (+12 more)

### Community 9 - "SPL Tokens & Transactions Tabs"
Cohesion: 0.15
Nodes (25): AnalyticsTab(), SPLTokensTab(), SPLTokensTab(), formatAddress(), formatTimestamp(), getStatusDisplay(), getSuccessDisplay(), getTransactionIcon() (+17 more)

### Community 10 - "Wallet Balance Query Hook"
Cohesion: 0.11
Nodes (20): ConnectedAccountContent(), mockGetBalance, TEST_ADDRESS, useGetBalanceQuery(), getSolanaPrice(), getWalletBalance(), lamportsToSol(), solToLamports() (+12 more)

### Community 11 - "API Route Handlers (GET/POST)"
Cohesion: 0.10
Nodes (24): logger, GET, logger, POST(), requestSchema, BurnTokensPage(), RevokeMintAuthorityForm(), AppLogger (+16 more)

### Community 12 - "Fee Breakdown & Confirmation Form"
Cohesion: 0.12
Nodes (23): FeeBreakdown(), ConfirmationForm(), ConfirmationFormProps, FormSections(), FormSectionsProps, defaultValues, RevokeFreezeAuthorityForm(), RevokeFreezeAuthorityFormData (+15 more)

### Community 13 - "Analytics Tab & Distribution Items"
Cohesion: 0.09
Nodes (20): AnalyticsTab(), AnalyticsTabProps, DistributionItemProps, AnalyticsTabProps, MainContentTabsProps, TabsHeaderProps, SPLTokensTabProps, SPLTokensTabProps (+12 more)

### Community 14 - "Site Navigation Menus"
Cohesion: 0.14
Nodes (23): MobileNavigationMenuProps, defaultNavigationItems, NavigationGroup, NavigationItem, othersNavigationItems, toolsNavigationItems, NavigationMenuItem(), NavigationMenuItemProps (+15 more)

### Community 15 - "Compliance & Data Collection Notices"
Cohesion: 0.10
Nodes (18): BackgroundElements(), BottomBadge(), ComplianceGrid(), DataCollectionNote(), DataPrivacyTable(), SecurityPrivacySection(), MinimalDataList(), ProtectedDataList() (+10 more)

### Community 16 - "Token Creator Page & Upload Tests"
Cohesion: 0.09
Nodes (16): makeFormDataRequest(), mockPinataUpload, tokenCreatorBenefitsConfig, FAQSection(), BackgroundElements(), HeroHeader(), HeroSection(), TokenCreationForm() (+8 more)

### Community 17 - "Freeze Wallets Tool Page"
Cohesion: 0.11
Nodes (14): ValueProp, freezeValueProps, freezeWalletsBenefitsConfig, FreezeFormSchema, TokenData, defaultValues, FreezeForm(), FAQ (+6 more)

### Community 18 - "Burn Tokens Hook & Tests"
Cohesion: 0.12
Nodes (18): mockConnection, BurnTokensParams, BurnTokensResult, UseBurnTokensReturn, UseTokenCreatorReturn, uploadFileToIPFS(), uploadJSONToIPFS(), apiClient() (+10 more)

### Community 19 - "Unfreeze Wallets Tool Page"
Cohesion: 0.12
Nodes (11): unfreezeWalletsBenefitsConfig, FAQSection(), HeroHeader(), HeroSection(), UnfreezeForm(), FAQ, faqs, Feature (+3 more)

### Community 20 - "Hero Section Background & CTAs"
Cohesion: 0.18
Nodes (16): BackgroundElements(), CTAButtons(), HeroBadge(), HeroContent(), Feature, features, OrbitItem, orbitItems (+8 more)

### Community 21 - "Error Boundaries"
Cohesion: 0.13
Nodes (12): Error(), ErrorProps, GlobalError(), GlobalErrorProps, ErrorActionButtons(), ErrorActionButtonsProps, ErrorPage(), ErrorPageProps (+4 more)

### Community 22 - "Wallet Info & Benefits Section"
Cohesion: 0.14
Nodes (13): BenefitsSectionProps, BasicWalletInfo(), BasicWalletInfoProps, HeroSection(), HeroSectionProps, EmptyTokensStateProps, TokenAuditorErrorProps, Badge() (+5 more)

### Community 23 - "Burn Tokens Form Components"
Cohesion: 0.15
Nodes (18): ActionButtons(), ActionButtonsProps, BurnAmountForm(), BurnAmountFormProps, BurnForm(), BurnFormProps, BurnTokensFormData, burnTokensFormSchema (+10 more)

### Community 24 - "JSON/Log Upload API Routes"
Cohesion: 0.11
Nodes (18): config, jsonUploadSchema, pinata, POST, logRequestSchema, POST, POST, POST (+10 more)

### Community 25 - "Platform Features Grid"
Cohesion: 0.18
Nodes (16): FeaturesGrid(), PlatformFeatures(), Feature, features, Stat, stats, timelineData, TimelineStep (+8 more)

### Community 26 - "Liquidity Provider Benefits & FAQ"
Cohesion: 0.16
Nodes (12): liquidityProviderBenefitsConfig, liquidityProviderFAQ, FAQSection(), HeroSection(), benefits, features, createTestQueryClient(), CustomRenderOptions (+4 more)

### Community 27 - "Freeze Authority API Routes"
Cohesion: 0.11
Nodes (17): BatchFreezeResponse, POST, POST, UnsignedRevokeFreezeAuthorityResponse, POST, UnsignedRevokeMintAuthorityResponse, POST, FreezeWalletRequestSchema (+9 more)

### Community 28 - "Header Logo & Navigation"
Cohesion: 0.11
Nodes (16): DesktopNavigation(), Logo(), MobileLogo(), MobileNavigation(), MobileNavigationProps, MobileNavigationMenu(), WalletConnectionButton(), WalletMultiButton (+8 more)

### Community 29 - "Root Layout & Global Footer"
Cohesion: 0.15
Nodes (13): DMSans, metadata, GlobalFooter(), FooterBottom(), FooterBrand(), FooterLink, footerLinks, FooterSection (+5 more)

### Community 30 - "Multisender Tool Page"
Cohesion: 0.12
Nodes (9): multisenderBenefitsConfig, HeroHeader(), HeroSection(), FAQ, faqs, Feature, features, ValueProp (+1 more)

### Community 31 - "Tool Action Buttons & Config"
Cohesion: 0.16
Nodes (15): ToolActionButton, ToolActionButtonProps, useIsToolEnabled(), useToolConfiguration(), AdvancedSettingsSection(), FormSections(), FormSectionsProps, PoolConfigurationSection() (+7 more)

### Community 32 - "Liquidity Provider Test Mocks"
Cohesion: 0.16
Nodes (16): clmmParams, cpmmParams, MOCK_ADDRESSES, mockFormData, mockLiquidityProviderParams, mockLiquidityProviderParamsCLMM, mockLiquidityProviderRequest, mockLiquidityProviderRequestCLMM (+8 more)

### Community 34 - "Custom Form Field & File Upload"
Cohesion: 0.12
Nodes (14): ADR-0004, Props, DirectionOptions, FileInput, FileUploader, FileUploaderContent, FileUploaderContext, FileUploaderContextType (+6 more)

### Community 35 - "Announcement Banner & Contentful Client"
Cohesion: 0.13
Nodes (14): GET, AnnouncementBanner(), AnnouncementBannerProps, bannerLogger, blogLogger, client, getSiteBanner(), serverConfig (+6 more)

### Community 36 - "Simple Card & Cost Optimization"
Cohesion: 0.14
Nodes (13): SimpleCard(), SimpleCardProps, BottomCTA(), containerVariants, CostOptimizationSection(), containerVariants, FeeBreakdownSection(), FeeTable() (+5 more)

### Community 37 - "Raydium Liquidity Provider Docs & Route"
Cohesion: 0.15
Nodes (18): 5-Layer Tool Architecture Pattern (Zod schema -> Page -> Hook -> API route -> Server utility), Raydium CPMM vs CLMM Pool Types - rationale: CPMM is simple full-range liquidity (default), CLMM is concentrated liquidity for capital efficiency, professional LPs need both, Raydium SDK v2 (@raydium-io/raydium-sdk-v2) Server-Side Pool Creation Integration - rationale: leverage official SDK for reliability, pool existence validation, fee-tier recommendations vs hand-rolled Raydium program calls, Raydium Liquidity Provider Implementation Plan, Comprehensive Liquidity Provider Unit Tests Plan, Raydium Liquidity Provider Design Spec, POST, CLMM_PROGRAM_ID (+10 more)

### Community 38 - "Connected Account Page"
Cohesion: 0.13
Nodes (4): HeroSectionLayout(), ConnectedAccountContentProps, ErrorWalletDataProps, Props

### Community 39 - "Token Dashboard & Liquidity Info"
Cohesion: 0.19
Nodes (13): TokenData, ActionButtons(), TokenDashboardProps, LiquidityInfo(), LiquidityInfoProps, SecurityAnalysis(), SecurityAnalysisProps, TokenDetails() (+5 more)

### Community 40 - "Liquidity Pool Configuration Form"
Cohesion: 0.19
Nodes (14): ServiceFilterProps, feeTierOptions, PoolConfigurationSectionProps, tokenBOptions, TokenPairSectionProps, Select(), SelectContent(), SelectItem() (+6 more)

### Community 41 - "Wallet Tokens Server Fetch & Metadata"
Cohesion: 0.18
Nodes (18): AccountInfo, applyToolSpecificFilter(), createFallbackMetadata(), deriveMetadataPDA(), extractToken2022Metadata(), fetchImageFromMetadataUri(), fetchMintAuthoritiesBatch(), fetchTokenAccountsBatch() (+10 more)

### Community 42 - "FAQ Items & Category Filter"
Cohesion: 0.20
Nodes (10): Category, CategoryFilter(), CategoryFilterProps, FAQ, FAQItem(), FAQItemProps, FAQSection(), FAQSectionProps (+2 more)

### Community 43 - "Token Selection Form"
Cohesion: 0.27
Nodes (14): SelectedTokenDisplayProps, ManualTokenEntry(), TokenSelectionConfig, TokenSelectionForm(), TokenSelectionFormProps, TokenSelectionModeToggle(), BaseTokenFormData, ManualTokenEntryProps (+6 more)

### Community 44 - "Wallet Tokens Hook & Tests"
Cohesion: 0.27
Nodes (15): WalletTokensList(), mockPublicKey, mockTokens, fetchWalletTokensForTool(), useWalletTokensForAll(), useWalletTokensForBurnTool(), useWalletTokensForFreezeWallets(), useWalletTokensForLiquidityProvider() (+7 more)

### Community 45 - "Unified Form Card Components"
Cohesion: 0.25
Nodes (12): GradientVariant, UnifiedActionButtonsProps, UnifiedFormCardProps, UnifiedFormHeaderProps, UnifiedFormWrapperProps, buttonVariants, UnifiedActionButtons(), gradientVariants (+4 more)

### Community 46 - "Freeze Token Validation & Fee Hook"
Cohesion: 0.20
Nodes (12): AccountInputForm(), ConfirmationForm(), FormSections(), validateFreezeToken(), mockToolConfig, AdditionalFeeConfig, FeeBreakdownItem, FeeCalculationConfig (+4 more)

### Community 47 - "Service Fees & Tool Config Provider"
Cohesion: 0.18
Nodes (10): fallbackServiceFees, mapToolConfigurationsToServiceFees(), TOOL_DISPLAY_MAP, useServiceFees(), ToolConfiguration, mockSetConfigs, ToolConfigProvider(), ToolConfigProviderProps (+2 more)

### Community 48 - "Tool Helpers & Config Registry"
Cohesion: 0.18
Nodes (12): getStaleTimeForTool(), getToolConfig(), getToolDisplayName(), isValidToolType(), TOOL_CONFIGS, ToolConfig, AUTHORITY_REQUIRED_TOOLS, CoreToolType (+4 more)

### Community 49 - "Legal & MiCA Compliance Rationale"
Cohesion: 0.16
Nodes (15): Legal Entity Configuration via env vars - rationale: allow updating contact/business info without code changes, block prod deploy if missing, MiCA Infrastructure-Provider Positioning - rationale: resolve contradiction between 'we do not issue crypto-assets' language and the Token Creator tool by repositioning CloakForge as a non-CASP technical infrastructure/transaction-building provider, shifting compliance burden to users, Prohibited Jurisdictions Management - rationale: user-responsibility model without geo-blocking, demonstrates good-faith regulatory compliance while preserving non-custodial global access, Risk Level Indicator Pattern (high/medium/low) for DeFi tool risk communication, TL;DR Summary Box Pattern for legal document sections - rationale: improve readability/UX of dense legal language, Legal Document Improvements Implementation Plan, MiCA-Compliant Legal Positioning Implementation Plan, Legal Document Improvements Design Spec (+7 more)

### Community 50 - "Hero Section Layout & Heading"
Cohesion: 0.18
Nodes (7): AnimatedBackground(), AnimatedBackgroundProps, HeroHeadingProps, HeroSectionLayoutProps, revokeMintAuthorityFAQs, FAQSection(), tokenCreatorFAQs

### Community 51 - "Legal Notice Cards"
Cohesion: 0.19
Nodes (8): LegalNoticeCard(), LegalNoticeCardProps, LegalSection(), LegalSectionProps, imprintData, ImprintSectionData, PrivacySectionData, privacySectionsData

### Community 52 - "Terms of Service Content"
Cohesion: 0.25
Nodes (10): FooterCTA(), ImportantNotice(), TermsContent(), TermsContentData, termsData, TermsSectionData, TermsList(), TermsListProps (+2 more)

### Community 53 - "Tool Landing Pages (LP/Revoke Mint)"
Cohesion: 0.20
Nodes (6): BenefitsSection(), BenefitsSectionConfig, CTAConfig, burnTokensBenefitsConfig, benefitsConfig, HeroSection()

### Community 54 - "Blog Pages"
Cohesion: 0.19
Nodes (11): BlogPage(), metadata, BlogPostPage(), BlogPostPageProps, generateMetadata(), generateStaticParams(), renderOptions, RichTextRenderer() (+3 more)

### Community 55 - "Revoke Freeze Authority Tool Page"
Cohesion: 0.28
Nodes (5): revokeFreezeAuthorityBenefitsConfig, revokeFreezeAuthorityFAQs, FAQSection(), HeroSection(), RevokeFreezeAuthorityPage()

### Community 56 - "Multisender Form & Confirmation"
Cohesion: 0.22
Nodes (12): SelectedTokenDisplay(), FormSections(), FormSectionsProps, ConfirmationForm(), ConfirmationFormProps, defaultValues, MultisenderForm(), MultisenderFormData (+4 more)

### Community 57 - "Multisender Token Validation & Metadata"
Cohesion: 0.24
Nodes (13): validateMultisenderToken(), deriveMetadataPDA(), fetchImageFromMetadataUri(), getToken2022Metadata(), getTokenMetadata(), getTokenMetadataWithBalance(), getTokensMetadata(), MetaplexMetadataAccount (+5 more)

### Community 58 - "Wallet Connection Buttons"
Cohesion: 0.30
Nodes (9): BaseWalletConnectionButton(), Props, BaseWalletMultiButton(), Props, WalletButton(), WalletButtonProps, LABELS, WalletMultiButton() (+1 more)

### Community 59 - "Account Input & Confirmation Form"
Cohesion: 0.23
Nodes (10): AccountInputForm(), AccountInputFormProps, ConfirmationForm(), ConfirmationFormProps, FormSections(), FormSectionsProps, defaultValues, UnfreezeWalletsFormData (+2 more)

### Community 60 - "Raydium Pool Creation V0 Tx Tests"
Cohesion: 0.14
Nodes (9): MOCK_CLMM_CONFIG_100, MOCK_CLMM_CONFIG_500, MOCK_CPMM_CONFIG, MOCK_WALLET, mockClmmCreatePool, mockCpmmCreatePool, mockGetMint, mockLegacyConnection (+1 more)

### Community 61 - "Privacy Policy Page"
Cohesion: 0.29
Nodes (4): PrivacyContentSection(), PrivacyFooterSection(), PrivacyHeroSection(), PrivacyPolicyPage()

### Community 62 - "XLogo & Authority Controls Form"
Cohesion: 0.22
Nodes (9): sizeMap, XLogo(), XLogoProps, AuthorityControlsFormProps, BasicInformationFormProps, FormSectionsProps, LogoUploadFormProps, OptionalLinksFormProps (+1 more)

### Community 63 - "Admin Transaction Row & Badges"
Cohesion: 0.33
Nodes (10): ServiceFilter(), getServiceBadgeProps(), ServiceBadge(), TransactionRow(), TransactionRowProps, TransactionData, ServiceIdentifier, formatServiceIdentifier() (+2 more)

### Community 64 - "Blog Client & Hero"
Cohesion: 0.18
Nodes (6): BlogClientProps, BlogHeroProps, BlogPostsGridProps, BlogSearchAndFilterProps, Category, BlogPost

### Community 65 - "Revoke Mint Authority Form"
Cohesion: 0.36
Nodes (8): ConfirmationForm(), ConfirmationFormProps, FormSections(), FormSectionsProps, defaultValues, RevokeMintAuthorityFormData, revokeMintAuthorityFormSchema, validateRevokeMintAuthorityToken()

### Community 66 - "Service Fee Extraction from Memo"
Cohesion: 0.26
Nodes (11): calculateServiceFee(), extractServiceFeeFromMemo(), extractServiceIdentifier(), extractServiceIdentifierFromMemo(), GET(), getPayerFromTransaction(), SignatureOptions, TransactionData (+3 more)

### Community 67 - "Imprint Page"
Cohesion: 0.32
Nodes (4): ImprintContentSection(), ImprintFooterSection(), ImprintHeroSection(), ImprintPage()

### Community 68 - "Burn Reasons & Feature Highlights"
Cohesion: 0.29
Nodes (7): BurnReason, burnReasons, Feature, FeatureHighlights(), features, HeroBackground(), HeroSection()

### Community 69 - "Terms of Service Page"
Cohesion: 0.27
Nodes (4): LegalHeroSection(), LegalHeroSectionProps, ContentSection(), HeroSection()

### Community 70 - "Core Architecture Docs & Rationale"
Cohesion: 0.40
Nodes (10): Contentful Webhook + Next.js revalidateTag Cache Revalidation - rationale: long cacheLife('days') for low API cost, instant revalidation via webhook for freshness, Documentation Philosophy: KISS/DRY, exactly 4 core docs - rationale: prior 10+ overlapping docs left developers lost in the repo, AppError / SolanaError Error Handling System with getLogger and handleError, Hybrid Client/Server Architecture (client signs, server prepares via private RPC) - rationale: privacy-first, no server-held keys, no rate-limited public RPC on server, CloakForge Architecture Doc, Contentful Webhook Setup Doc, CloakForge Development Guide, CloakForge Documentation Index (+2 more)

### Community 71 - "Notification & Fee Calculation Notes"
Cohesion: 0.29
Nodes (5): NotificationCard(), NotificationCardProps, FeeCalculationNote(), ImportantNotes(), NetworkFeeNote()

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
Cohesion: 0.40
Nodes (5): POST, WalletTokensRequest, walletTokensRequestSchema, WalletTokensResponse, ServerWalletTokensResult

### Community 78 - "Fee Breakdown Component"
Cohesion: 0.47
Nodes (4): FeeBreakdownProps, getToolStyles(), TotalSection(), FeeCalculationResult

### Community 79 - "Solana Address Utilities"
Cohesion: 0.53
Nodes (4): convertAddressToPublicKey(), convertPublicKeyToAddress(), shortenAddress(), NOTE: The try/catch in isValidSolanaAddress (catch → return false) cannot be

## Knowledge Gaps
- **369 isolated node(s):** `CustomRenderOptions`, `stableConnection`, `mockWalletAdapter`, `mockDisconnectedWallet`, `mockLiquidityProviderRequestCLMM` (+364 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **24 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `getLogger()` connect `API Route Handlers (GET/POST)` to `Test Utilities & Mocks`, `Admin Panel & Error Pages`, `Server Config & Tool Cache`, `Admin Transactions & Pinata Upload`, `Token Auditor Tool Page`, `Number Fields & Wallet Tokens List`, `SPL Tokens & Transactions Tabs`, `Wallet Balance Query Hook`, `Fee Breakdown & Confirmation Form`, `Freeze Wallets Tool Page`, `Burn Tokens Hook & Tests`, `Unfreeze Wallets Tool Page`, `Error Boundaries`, `Burn Tokens Form Components`, `JSON/Log Upload API Routes`, `Custom Form Field & File Upload`, `Announcement Banner & Contentful Client`, `Raydium Liquidity Provider Docs & Route`, `Wallet Tokens Server Fetch & Metadata`, `Token Selection Form`, `Wallet Tokens Hook & Tests`, `Freeze Token Validation & Fee Hook`, `Multisender Form & Confirmation`, `Multisender Token Validation & Metadata`, `Account Input & Confirmation Form`, `Revoke Mint Authority Form`, `Service Fee Extraction from Memo`, `Balance Validation Tests`?**
  _High betweenness centrality (0.114) - this node is a cross-community bridge._
- **Why does `cn()` connect `Wallet UI & Info Tooltips` to `Custom Form Field & File Upload`, `Loading States`, `Number Fields & Wallet Tokens List`, `Token Dashboard & Liquidity Info`, `Liquidity Pool Configuration Form`, `SPL Tokens & Transactions Tabs`, `Unified Form Card Components`, `Site Navigation Menus`, `Analytics Tab & Distribution Items`, `Tool Landing Pages (LP/Revoke Mint)`, `Wallet Info & Benefits Section`, `Wallet Connection Buttons`, `Header Logo & Navigation`, `XLogo & Authority Controls Form`?**
  _High betweenness centrality (0.105) - this node is a cross-community bridge._
- **Why does `Button` connect `Wallet Info & Benefits Section` to `Home & Tools Landing Pages`, `Admin Panel & Error Pages`, `Loading States`, `Number Fields & Wallet Tokens List`, `SPL Tokens & Transactions Tabs`, `Analytics Tab & Distribution Items`, `Hero Section Background & CTAs`, `Error Boundaries`, `Burn Tokens Form Components`, `Header Logo & Navigation`, `Tool Action Buttons & Config`, `Custom Form Field & File Upload`, `Announcement Banner & Contentful Client`, `Simple Card & Cost Optimization`, `Connected Account Page`, `Token Dashboard & Liquidity Info`, `FAQ Items & Category Filter`, `Token Selection Form`, `Admin Transaction Row & Badges`, `Blog Client & Hero`?**
  _High betweenness centrality (0.046) - this node is a cross-community bridge._
- **What connects `CustomRenderOptions`, `stableConnection`, `mockWalletAdapter` to the rest of the system?**
  _377 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Test Utilities & Mocks` be split into smaller, more focused modules?**
  _Cohesion score 0.06425153793574846 - nodes in this community are weakly interconnected._
- **Should `Home & Tools Landing Pages` be split into smaller, more focused modules?**
  _Cohesion score 0.05853174603174603 - nodes in this community are weakly interconnected._
- **Should `Admin Panel & Error Pages` be split into smaller, more focused modules?**
  _Cohesion score 0.06610259122157588 - nodes in this community are weakly interconnected._