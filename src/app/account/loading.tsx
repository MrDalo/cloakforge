import LoadingSpinner from '@/components/core/loading-spinner'
import React from 'react'

const Loading = (): React.ReactNode => (
  <div className='justify-cent flex h-[calc(100dvh-72px)] w-full flex-col items-start gap-4'>
    <LoadingSpinner />
  </div>
)

export default Loading
