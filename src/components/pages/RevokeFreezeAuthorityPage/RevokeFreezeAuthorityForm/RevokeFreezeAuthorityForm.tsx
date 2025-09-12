import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form } from '@/components/ui/form'
import { UnifiedFormWrapper, UnifiedFormCard } from '@/components/common'
import { getToolUIConfig } from '@/lib/config/getToolUIConfig'
import { FormSections } from './FormSections'
import { revokeFreezeAuthorityFormSchema, RevokeFreezeAuthorityFormData } from './revokeFreezeAuthorityFormSchema'
import { motion } from 'framer-motion'
import { useState } from 'react'

export const RevokeFreezeAuthorityForm = (): React.ReactNode => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const toolConfig = getToolUIConfig('revoke-freeze-authority')

  const form = useForm<RevokeFreezeAuthorityFormData>({
    resolver: zodResolver(revokeFreezeAuthorityFormSchema),
    defaultValues: {
      tokenAddress: '',
      understandIrreversible: false,
      confirmRevoke: false,
    },
  })

  const handleSubmit = async (data: RevokeFreezeAuthorityFormData): Promise<void> => {
    setIsSubmitting(true)
    try {
      // TODO: Implement revoke freeze authority logic
      void data
      await new Promise((resolve) => setTimeout(resolve, 2000))
    } catch (error) {
      // Error handling
      void error
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <motion.div animate={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 20 }} transition={{ duration: 0.5 }}>
      <UnifiedFormWrapper>
        <Form {...form}>
          <form id='revoke-freeze-authority-form' onSubmit={form.handleSubmit(handleSubmit)}>
            <UnifiedFormCard
              header={{
                icon: toolConfig.icon,
                title: toolConfig.title,
                variant: toolConfig.variant,
              }}
              variant={toolConfig.variant}
            >
              <FormSections form={form} isSubmitting={isSubmitting} />
            </UnifiedFormCard>
          </form>
        </Form>
      </UnifiedFormWrapper>
    </motion.div>
  )
}
