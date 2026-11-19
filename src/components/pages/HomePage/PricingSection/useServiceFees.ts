'use client'

import { useToolConfigurations } from '@/providers/ToolConfigProvider'
import { mapToolConfigurationsToServiceFees } from './contentfulPricingUtils'
import { type ServiceFee } from './pricingData'

/**
 * Service fees for the pricing table: live Contentful prices, cached prices during a Contentful
 * outage, or the fallback fees — always covering every tool. Resolved on the server, so the
 * first render (including SSR) already shows the right prices.
 *
 * @returns Pricing table rows.
 */
export const useServiceFees = (): ServiceFee[] => mapToolConfigurationsToServiceFees(useToolConfigurations())
