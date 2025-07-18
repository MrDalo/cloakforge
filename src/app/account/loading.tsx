import LoadingSpinner from '@/components/common/LoadingSpinner'
import React from 'react'

const Loading = (): React.ReactNode => (
	<div className='flex size-full flex-col items-center justify-center gap-4'>
		<LoadingSpinner />
	</div>
)

export default Loading
