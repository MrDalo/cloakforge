'use client'

import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { z } from 'zod'
import { type OperatorInfoResponse } from './operatorInfo'

const OPERATOR_INFO_ENDPOINT = '/api/legal/operator'

const nullableText = z.string().max(200).nullable()

const operatorInfoResponseSchema = z.object({
  data: z.object({
    operator: z.object({
      name: nullableText,
      address: nullableText,
      ico: nullableText,
      email: z.string().max(200),
      vatId: nullableText,
      tradeRegisterOffice: nullableText,
    }),
    termsVersion: z.string().max(40),
  }),
})

/**
 * Fetches the operator's public identity from GET /api/legal/operator.
 *
 * @returns Operator identity and current Terms version.
 * @throws Error when the request fails or the payload is malformed.
 */
export const fetchOperatorInfo = async (): Promise<OperatorInfoResponse> => {
  const response = await fetch(OPERATOR_INFO_ENDPOINT, { headers: { Accept: 'application/json' } })
  if (!response.ok) {
    throw new Error(`Operator info request failed with status ${response.status}`)
  }
  return operatorInfoResponseSchema.parse(await response.json()).data
}

/**
 * Operator identity for client components (VAT note next to fees). Cached for the session.
 *
 * @returns TanStack Query result with the operator identity.
 */
export const useOperatorInfo = (): UseQueryResult<OperatorInfoResponse> =>
  useQuery({
    queryKey: ['legal', 'operator'],
    queryFn: fetchOperatorInfo,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: 1,
  })
