'use client'

import { motion } from 'framer-motion'
import { FileText } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { LegalNoticeCard } from '@/components/common/LegalNoticeCard'
import { LegalSection } from '@/components/common/LegalSection'
import { imprintData } from './imprintData'

export const ImprintContentSection = (): React.ReactNode => (
  <>
    {/* Imprint Notice */}
    <LegalNoticeCard
      content='This imprint provides legally required identification information for the operator of the CloakForge service. CloakForge is a non-custodial software interface. The operator does not hold user funds, private keys, or personal data.'
      icon={FileText}
      title='Legal Identification'
      variant='info'
    />

    {/* Main Imprint Document */}
    <motion.div initial={{ opacity: 0, y: 30 }} transition={{ duration: 0.8 }} viewport={{ once: true }} whileInView={{ opacity: 1, y: 0 }}>
      <Card className='border-border hover:border-secondary/20 border-2 transition-all duration-300'>
        <CardContent className='p-8 md:p-12'>
          {imprintData.map((section, index) => (
            <div key={section.id}>
              <LegalSection description={section.description ?? ''} icon={section.icon} listItems={section.items} title={section.title} />
              {index < imprintData.length - 1 && <Separator className='my-8' />}
            </div>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  </>
)
