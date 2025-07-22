'use client'

import { BenefitsSection as CommonBenefitsSection } from '@/components/common/BenefitsSection'
import { revokeMintAuthorityBenefitsConfig } from './benefitsConfig'

export const BenefitsSection = (): React.ReactNode => <CommonBenefitsSection config={revokeMintAuthorityBenefitsConfig} />
