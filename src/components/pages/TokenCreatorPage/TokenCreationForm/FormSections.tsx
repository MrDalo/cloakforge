import { UseFormReturn } from 'react-hook-form'
import { Dispatch, SetStateAction } from 'react'
import { BasicInformationForm } from './BasicInformationForm'
import { LogoUploadForm } from './LogoUploadForm'
import { AuthorityControlsForm } from './AuthorityControlsForm'
import { OptionalLinksForm } from './OptionalLinksForm'
import { FeeBreakdown } from './FeeBreakdown'
import { ActionButtons } from './ActionButtons'
import { TokenCreatorFormData } from './tokenCreatorFormSchema'

interface FormSectionsProps {
  form: UseFormReturn<TokenCreatorFormData>
  isConnected: boolean
  setIsConnected: Dispatch<SetStateAction<boolean>>
}

export const FormSections = ({ form, isConnected, setIsConnected }: FormSectionsProps): React.ReactNode => (
  <div className='space-y-8'>
    <BasicInformationForm form={form} />
    <LogoUploadForm form={form} />
    <AuthorityControlsForm form={form} />
    <OptionalLinksForm form={form} />
    <FeeBreakdown />
    <ActionButtons form={form} isConnected={isConnected} setIsConnected={setIsConnected} />
  </div>
)
