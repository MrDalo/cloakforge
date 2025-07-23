'use client'

import { useRouter } from 'next/navigation'
import { ErrorDisplay } from './HeroSection'
import { ErrorActionButtons } from './ActionSection'
import { TroubleshootingCard } from './TroubleshootingSection'

interface ErrorPageProps {
  title?: string
  subtitle?: string
  onReset?: () => void
  errorDetails?: {
    message: string
    status?: number
    statusText?: string
    digest?: string
    name: string
  }
}

export const ErrorPage = ({ title, subtitle, onReset, errorDetails }: ErrorPageProps): React.ReactNode => {
  const router = useRouter()

  const handleTryAgain = (): void => {
    if (onReset) {
      onReset()
    } else {
      window.location.reload()
    }
  }

  const handleGoBack = (): void => {
    if (window.history.length > 1) {
      router.back()
    } else {
      router.push('/')
    }
  }

  return (
    <div className='bg-background relative min-h-screen'>
      {/* Main Content */}
      <section className='relative overflow-hidden px-6 py-16 md:py-24'>
        <div className='relative z-10 container mx-auto max-w-4xl'>
          <div className='text-center'>
            <ErrorDisplay errorDetails={errorDetails} subtitle={subtitle} title={title} />
            <ErrorActionButtons onGoBack={handleGoBack} onTryAgain={handleTryAgain} />
          </div>
          <TroubleshootingCard />
        </div>
      </section>
    </div>
  )
}
