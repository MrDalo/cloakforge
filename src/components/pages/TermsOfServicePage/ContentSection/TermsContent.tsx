'use client'

import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { type OperatorInfo } from '@/lib/compliance/operatorInfo'
import { TermsSection } from './TermsSection'
import { TermsList } from './TermsList'
import { buildTermsPageSections } from './termsData'

interface TermsContentProps {
  operator: OperatorInfo
}

export const TermsContent = ({ operator }: TermsContentProps): React.ReactNode => (
  <motion.div initial={{ opacity: 0, y: 30 }} transition={{ duration: 0.8 }} viewport={{ once: true }} whileInView={{ opacity: 1, y: 0 }}>
    <Card className='border-border hover:border-primary/20 border-2 transition-all duration-300'>
      <CardContent className='p-8 md:p-12'>
        {buildTermsPageSections(operator).map((section, index) => (
          <TermsSection
            anchorId={section.id}
            icon={section.icon}
            iconVariant={section.iconVariant}
            key={section.id}
            sectionNumber={index + 1}
            title={section.title}
          >
            {section.content.type === 'text' ? (
              <p className='text-muted-foreground leading-relaxed'>{section.content.text}</p>
            ) : (
              <TermsList description={section.content.description} items={section.content.items || []} />
            )}
          </TermsSection>
        ))}
      </CardContent>
    </Card>
  </motion.div>
)
