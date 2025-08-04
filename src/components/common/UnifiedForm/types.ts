import { ReactNode } from 'react'
import { UseFormReturn, FieldValues } from 'react-hook-form'
import { LucideIcon } from 'lucide-react'

export type GradientVariant = 'primary' | 'info' | 'warning' | 'danger' | 'success'

export interface UnifiedFormHeaderProps {
  icon: LucideIcon
  title: string
  variant?: GradientVariant
}

export interface UnifiedFormCardProps {
  children: ReactNode
  variant?: GradientVariant
  header: UnifiedFormHeaderProps
}

export interface UnifiedFormWrapperProps {
  children: ReactNode
  className?: string
  id?: string
}

export interface UnifiedActionButtonsProps<T extends FieldValues = FieldValues> {
  form: UseFormReturn<T>
  submitConfig: {
    text: string
    loadingText: string
    icon: LucideIcon
    variant?: GradientVariant
  }
  showPreview?: boolean
  previewConfig?: {
    text: string
    icon: LucideIcon
    onClick?: () => void
  }
  customValidation?: boolean
  toolId: string
}
