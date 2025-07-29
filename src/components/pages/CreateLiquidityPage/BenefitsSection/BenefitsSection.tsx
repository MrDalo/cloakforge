'use client'

import { BenefitsSection as CommonBenefitsSection } from '@/components/common/BenefitsSection'
import { createLiquidityBenefitsConfig } from './benefitsConfig'

export const BenefitsSection = (): React.ReactNode => <CommonBenefitsSection config={createLiquidityBenefitsConfig} />
