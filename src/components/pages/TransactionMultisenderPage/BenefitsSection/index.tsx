'use client'

import { BenefitsSection as CommonBenefitsSection } from '@/components/common'
import { multisenderBenefitsConfig } from './benefitsConfig'

export const BenefitsSection = (): React.ReactNode => <CommonBenefitsSection config={multisenderBenefitsConfig} />
