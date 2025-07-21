'use client'

import { InfoCard } from '@/components/common'
import { type ComplianceItem } from './securityData'

interface ComplianceCardProps {
  item: ComplianceItem
}

export const ComplianceCard = ({ item }: ComplianceCardProps): React.ReactNode => (
  <InfoCard description={item.description} icon={item.icon} title={item.title} variant='compliance' />
)
