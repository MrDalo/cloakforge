'use client'

import { motion } from 'framer-motion'
import { Lock } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { LegalNoticeCard } from '@/components/common/LegalNoticeCard'
import { LegalSection } from '@/components/common/LegalSection'
import { type OperatorInfo } from '@/lib/compliance/operatorInfo'
import { buildPrivacySections } from './privacyData'
import { PrivacyTable } from './PrivacyTable'

interface PrivacyContentSectionProps {
  operator: OperatorInfo
}

export const PrivacyContentSection = ({ operator }: PrivacyContentSectionProps): React.ReactNode => {
  const sections = buildPrivacySections(operator)

  return (
    <>
      <LegalNoticeCard
        content='Minimal data: no accounts, no analytics, no ad trackers. Wallet activity is public on-chain, and our hosting and RPC providers process your IP address to deliver the service.'
        icon={Lock}
        title='In Short'
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
              <div className='scroll-mt-24' id={section.id} key={section.id}>
                <LegalSection
                  description={section.description}
                  emphasis={section.emphasis}
                  icon={section.icon}
                  iconVariant={section.iconVariant}
                  listItems={section.listItems}
                  title={section.title}
                >
                  {section.table && (
                    <div className='mt-6'>
                      <PrivacyTable table={section.table} />
                    </div>
                  )}
                </LegalSection>
                {index < sections.length - 1 && <Separator className='my-8' />}
              </div>
            ))}
          </CardContent>
        </Card>
      </motion.div>
    </>
  )
}
