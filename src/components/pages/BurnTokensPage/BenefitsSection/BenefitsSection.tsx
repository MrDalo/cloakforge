'use client'

import { BenefitsSection as CommonBenefitsSection } from '@/components/common/BenefitsSection'
import { burnTokensBenefitsConfig } from './benefitsConfig'

export const BenefitsSection = (): React.ReactNode => <CommonBenefitsSection config={burnTokensBenefitsConfig} />
