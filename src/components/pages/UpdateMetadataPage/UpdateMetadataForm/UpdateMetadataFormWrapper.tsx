'use client'

import React from 'react'
import { useUpdateMetadata } from '@/hooks/solana/useUpdateMetadata'
import { UpdateMetadataForm } from './UpdateMetadataForm'

export const UpdateMetadataFormWrapper = (): React.ReactNode => {
  const { updateMetadata } = useUpdateMetadata()

  return <UpdateMetadataForm updateMetadata={updateMetadata} />
}
