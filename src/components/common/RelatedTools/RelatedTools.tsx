'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { services, type Service } from '@/components/common/ServiceShowcaseSection/serviceData'
import { relatedToolsMap } from './relatedToolsMap'

interface RelatedToolsProps {
  toolId: string
}

const RelatedToolCard = ({ service }: { service: Service }): React.ReactNode => {
  const Icon = service.icon

  return (
    <Link className='group block h-full' href={service.href}>
      <Card className='hover:border-primary/30 h-full border-2 transition-all duration-300 hover:shadow-lg'>
        <CardContent className='p-6'>
          <div className='mb-4 flex items-center gap-3'>
            <div className='bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg'>
              <Icon className='text-primary h-5 w-5' />
            </div>
            <h3 className='group-hover:text-primary font-medium transition-colors duration-300'>{service.title}</h3>
          </div>
          <p className='text-muted-foreground mb-4 text-sm leading-relaxed'>{service.description}</p>
          <div className='text-primary flex items-center text-sm'>
            Use Tool
            <ArrowRight className='ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1' />
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

/**
 * Renders a "Related Tools" section linking to topically related tool pages
 * via real crawlable links, so search engines see internal link equity and
 * users have a clear next step. Renders nothing if no relations are configured
 * for the given tool.
 *
 * @param toolId - The current tool's id (matches an id in serviceData.ts).
 * @returns The related-tools section, or null if there are no related tools.
 */
export const RelatedTools = ({ toolId }: RelatedToolsProps): React.ReactNode => {
  const relatedServices = (relatedToolsMap[toolId] ?? [])
    .map((id) => services.find((service) => service.id === id))
    .filter((service) => service !== undefined)

  if (relatedServices.length === 0) return null

  return (
    <section className='px-6 py-16'>
      <div className='container mx-auto max-w-6xl'>
        <motion.div
          className='mb-12 text-center'
          initial={{ opacity: 0, y: 30 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <h2 className='mb-4 text-3xl md:text-4xl'>Related Tools</h2>
          <p className='text-muted-foreground mx-auto max-w-2xl text-lg'>Explore other CloakForge tools for managing your Solana tokens.</p>
        </motion.div>

        <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
          {relatedServices.map((service, index) => (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              key={service.id}
              transition={{ delay: index * 0.1, duration: 0.6 }}
              viewport={{ once: true }}
              whileHover={{ y: -4 }}
              whileInView={{ opacity: 1, y: 0 }}
            >
              <RelatedToolCard service={service} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default RelatedTools
