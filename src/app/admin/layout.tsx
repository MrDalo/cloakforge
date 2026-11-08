import { type Metadata } from 'next'
import React from 'react'

// Private route: keep it out of search indexes (robots.txt alone does not prevent indexing)
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

const AdminLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode
}>): React.ReactNode => <>{children}</>

export default AdminLayout
