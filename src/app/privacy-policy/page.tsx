import { PrivacyPolicyPage } from '@/components/pages/PrivacyPolicyPage'
import { getLegalEntityInfo } from '@/lib/config/legalConfig'

/**
 * Privacy Policy route. Server component: the controller identity is read from the environment
 * on the server and rendered into the page.
 *
 * @returns Privacy Policy page.
 */
const PrivacyPolicyRoute = (): React.ReactNode => <PrivacyPolicyPage operator={getLegalEntityInfo()} />

export default PrivacyPolicyRoute
