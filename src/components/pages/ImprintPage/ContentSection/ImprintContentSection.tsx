'use client'

import { motion } from 'framer-motion'
import { FileText } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { LegalNoticeCard } from '@/components/common/LegalNoticeCard'
import { LegalSection } from '@/components/common/LegalSection'
import { type OperatorInfo } from '@/lib/compliance/operatorInfo'
import { buildImprintSections } from './imprintData'

interface ImprintContentSectionProps {
  operator: OperatorInfo
}

export const ImprintContentSection = ({ operator }: ImprintContentSectionProps): React.ReactNode => {
  const sections = buildImprintSections(operator)

  return (
    <>
      <LegalNoticeCard
        content='This imprint provides the legally required identification information for the operator of the CloakForge service. CloakForge is a non-custodial software interface; the operator does not hold user funds or private keys.'
        icon={FileText}
        title='Legal Identification'
        variant='info'
      />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        whileInView={{ opacity: 1, y: 0 }}
      >
        <Card className='border-border hover:border-secondary/20 border-2 transition-all duration-300'>
          <CardContent className='p-8 md:p-12'>
            {sections.map((section, index) => (
              <div key={section.id}>
                <LegalSection description={section.description ?? ''} icon={section.icon} listItems={section.items} title={section.title} />
                {index < sections.length - 1 && <Separator className='my-8' />}
              </div>
            ))}
          </CardContent>
        </Card>
      </motion.div>
    </>
  )
}
