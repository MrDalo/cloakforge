'use client'

import { BenefitsSection as CommonBenefitsSection } from '@/components/common/BenefitsSection'
import { benefitsConfig } from './benefitsConfig'

export const BenefitsSection = (): React.ReactNode => <CommonBenefitsSection config={benefitsConfig} />
