'use client'

import { motion } from 'framer-motion'
import { Lock } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { LegalNoticeCard } from '@/components/common/LegalNoticeCard'
import { LegalSection } from '@/components/common/LegalSection'
import { privacySectionsData } from './privacyData'

export const PrivacyContentSection = (): React.ReactNode => (
  <section className='px-6 py-16'>
    <div className='container mx-auto max-w-4xl'>
      {/* Privacy Promise */}
      <LegalNoticeCard
        content="CloakForge operates with zero data collection. We don't track, store, or monitor your activities. Your interactions are directly with the Solana blockchain, ensuring complete privacy and anonymity."
        icon={Lock}
        title='Our Privacy Promise'
        variant='info'
      />

      {/* Main Privacy Document */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        whileInView={{ opacity: 1, y: 0 }}
      >
        <Card className='border-border hover:border-secondary/20 border-2 transition-all duration-300'>
          <CardContent className='p-8 md:p-12'>
            {privacySectionsData.map((section, index) => (
              <div key={section.id}>
                <LegalSection
                  description={section.description}
                  icon={section.icon}
                  iconVariant={section.iconVariant}
                  listItems={section.listItems}
                  title={section.title}
                />
                {index < privacySectionsData.length - 1 && <Separator className='my-8' />}
              </div>
            ))}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  </section>
)
