import { z } from 'zod'
import { solanaAddressSchema } from './apiSchemas'

export const createMarketSchema = z.object({
  walletAddress: solanaAddressSchema,
  baseMint: solanaAddressSchema,
  quoteMint: solanaAddressSchema,
  // Advanced options for market creation
  lotSize: z.number().positive().default(1), // Min order size
  tickSize: z.number().positive().default(0.01), // Price increment
  useAdvancedOptions: z.boolean().default(false),
  // Optimization
  optimizeForLowCost: z.boolean().default(true), // Use smaller event queues to save rent
})

export type CreateMarketInput = z.infer<typeof createMarketSchema>

export const createPoolSchema = z.object({
  walletAddress: solanaAddressSchema,
  marketId: solanaAddressSchema,
  baseMint: solanaAddressSchema,
  quoteMint: solanaAddressSchema,
  baseAmount: z.number().positive(),
  quoteAmount: z.number().positive(),
  startTime: z.coerce.date().optional(), // Optional launch time, coerced from string
})

export type CreatePoolInput = z.infer<typeof createPoolSchema>
