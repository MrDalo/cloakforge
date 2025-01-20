'use client'
import React from 'react'
import PulseLoader from 'react-spinners/PulseLoader'

const LoadingSpinner = (): React.ReactNode => (
  <PulseLoader color='#6366F1' loading={true} size={8} />
)

export default LoadingSpinner
