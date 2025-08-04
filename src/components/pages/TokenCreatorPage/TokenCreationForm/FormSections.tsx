import { UseFormReturn } from 'react-hook-form'
import { Code } from 'lucide-react'
import { PublicKey } from '@solana/web3.js'
import { UnifiedActionButtons } from '@/components/common'
import { getToolConfig } from '@/lib/config/toolConfigs'
import { BasicInformationForm } from './BasicInformationForm'
import { LogoUploadForm } from './LogoUploadForm'
import { AuthorityControlsForm } from './AuthorityControlsForm'
import { OptionalLinksForm } from './OptionalLinksForm'
import { FeeBreakdown } from './FeeBreakdown'
import { TokenCreatorFormData } from './tokenCreatorFormSchema'

interface FormSectionsProps {
  form: UseFormReturn<TokenCreatorFormData>
  isSubmitting?: boolean
  connected?: boolean
  publicKey?: PublicKey | null
}

export const FormSections = ({ form, isSubmitting = false, connected = false, publicKey = null }: FormSectionsProps): React.ReactNode => {
  const toolConfig = getToolConfig('token-creator')

  // You can use isSubmitting, connected, publicKey here for conditional rendering
  // For example: show wallet connection status, disable forms when submitting, etc.
  void isSubmitting // Prevent unused variable warning
  void connected // Prevent unused variable warning
  void publicKey // Prevent unused variable warning

  return (
    <div className='space-y-8'>
      <BasicInformationForm form={form} />
      <LogoUploadForm form={form} />
      <AuthorityControlsForm form={form} />
      <OptionalLinksForm form={form} />
      <FeeBreakdown />
      <UnifiedActionButtons
        fees={toolConfig.fees}
        form={form}
        previewConfig={
          toolConfig.showPreview && toolConfig.previewText
            ? {
                text: toolConfig.previewText,
                icon: Code,
              }
            : undefined
        }
        showPreview={toolConfig.showPreview}
        submitConfig={{
          text: toolConfig.submitText,
          loadingText: toolConfig.loadingText,
          icon: toolConfig.icon,
          variant: toolConfig.variant,
        }}
        toolId='token-creator'
      />
    </div>
  )
}
