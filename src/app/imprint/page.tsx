import { type Metadata } from 'next'
import { ImprintPage } from '@/components/pages/ImprintPage'
import { getLegalEntityInfo } from '@/lib/config/legalConfig'

export const metadata: Metadata = {
  title: 'Imprint | CloakForge',
  description: 'Legal identification of the operator of CloakForge, contact points, and supervisory authorities.',
  alternates: {
    canonical: 'https://cloakforge.app/imprint',
  },
}

/**
 * Imprint route. Server component: the operator identity is read from the environment on the
 * server and rendered into the page.
 *
 * @returns Imprint page.
 */
const ImprintRoute = (): React.ReactNode => <ImprintPage operator={getLegalEntityInfo()} />

export default ImprintRoute
