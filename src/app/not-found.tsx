'use client'

import { ActionButtons, ErrorDisplay, NavigationSection } from '@/components/pages/NotFoundPage'

const NotFound = (): React.ReactNode => (
  <div className='bg-background relative min-h-screen'>
    {/* Main Content */}
    <section className='relative overflow-hidden px-6 py-16 md:py-24'>
      <div className='relative z-10 container mx-auto max-w-4xl'>
        <div className='text-center'>
          <ErrorDisplay />
          <ActionButtons />
        </div>
        <NavigationSection />
      </div>
    </section>
  </div>
)

export default NotFound
