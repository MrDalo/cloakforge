import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/** Marketing copy modules cleaned of false or unsubstantiated claims (GDPR Art. 5(1)(a), UCPD Art. 6). */
const MARKETING_COPY_FILES = [
  'AccountPage/NotConnectedWallet/NotConnectedWallet.tsx',
  'AccountPage/PrivacySection/PrivacySection.tsx',
  'BurnTokensPage/BenefitsSection/benefitsConfig.ts',
  'BurnTokensPage/HeroSection/FeatureHighlights.tsx',
  'BurnTokensPage/HeroSection/HeroSection.tsx',
  'HomePage/BenefitsSection/benefitsData.ts',
  'HomePage/CTASection/ctaData.ts',
  'HomePage/HeroSection/heroData.ts',
  'HomePage/PlatformFeaturesSection/platformFeaturesData.ts',
  'HomePage/SecurityPrivacySection/BottomBadge.tsx',
  'HomePage/SecurityPrivacySection/SectionHeader.tsx',
  'HomePage/SecurityPrivacySection/securityData.ts',
  'RevokeFreezeAuthorityPage/BenefitsSection/benefitsConfig.ts',
  'RevokeFreezeAuthorityPage/HeroSection/HeroSection.tsx',
  'RevokeMetadataAuthorityPage/BenefitsSection/benefitsConfig.ts',
  'RevokeMetadataAuthorityPage/HeroSection/HeroSection.tsx',
  'RevokeMintAuthorityPage/BenefitsSection/benefitsConfig.ts',
  'RevokeMintAuthorityPage/HeroSection/HeroSection.tsx',
  'TokenCreatorPage/BenefitsSection/benefitsConfig.ts',
  'TokenCreatorPage/HeroSection/HeroHeader.tsx',
  'TokenCreatorPage/tokenCreatorData.ts',
  'UpdateMetadataPage/BenefitsSection/benefitsConfig.ts',
  'UpdateMetadataPage/updateMetadataData.ts',
] as const

/** Copy outside `components/pages`: loading screens and the shared service showcase. */
const APP_COPY_FILES = ['app/loading.tsx', 'app/account/loading.tsx', 'components/common/ServiceShowcaseSection/serviceData.ts'] as const

const BANNED_PHRASES: readonly RegExp[] = [
  /zero data/i,
  /no data collected/i,
  /anonym/i,
  /complete privacy/i,
  /privacy guaranteed/i,
  /zero-knowledge/i,
  /no central servers?/i,
  /peer-to-peer/i,
  /single point of failure/i,
  /\bkyc\b/i,
  /uptime/i,
  /lowest fees?/i,
  /most (secure|trusted)/i,
  /trusted by thousands/i,
  /regulatory clarity/i,
  /market value/i,
  /no ip logging/i,
  /ip address is not stored/i,
]

const readSource = (relativeToSrc: string): string => readFileSync(join(process.cwd(), 'src', relativeToSrc), 'utf8')

describe('marketing copy', () => {
  const files = [...MARKETING_COPY_FILES.map((file) => `components/pages/${file}`), ...APP_COPY_FILES]

  it.each(files)('should not contain banned claims in %s', (file) => {
    const source = readSource(file)
    for (const phrase of BANNED_PHRASES) {
      expect(source, `${file} matches ${phrase}`).not.toMatch(phrase)
    }
  })
})
