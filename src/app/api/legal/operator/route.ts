import 'server-only'
import { z } from 'zod'
import { createApiRoute } from '@/lib/api/createApiRoute'
import { getLegalEntityInfo } from '@/lib/config/legalConfig'
import { TERMS_VERSION } from '@/lib/compliance/legalConstants'
import { type OperatorInfoResponse } from '@/lib/compliance/operatorInfo'

/**
 * GET /api/legal/operator
 *
 * Returns the operator's public legal identity (the same data the Imprint shows) and the
 * current Terms version, for the fee VAT note and client-generated receipts. Takes no input
 * and returns nothing beyond what the law requires to be published.
 */
export const GET = createApiRoute({
  name: 'legal/operator',
  schema: z.object({}),
  method: 'GET',
  handler: async (): Promise<OperatorInfoResponse> => ({ operator: getLegalEntityInfo(), termsVersion: TERMS_VERSION }),
})
