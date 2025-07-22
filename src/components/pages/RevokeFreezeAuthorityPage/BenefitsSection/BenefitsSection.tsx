'use client'

import { BenefitsSection as CommonBenefitsSection } from '@/components/common/BenefitsSection'
import { revokeFreezeAuthorityBenefitsConfig } from './benefitsConfig'

export const BenefitsSection = (): React.ReactNode => <CommonBenefitsSection config={revokeFreezeAuthorityBenefitsConfig} />
