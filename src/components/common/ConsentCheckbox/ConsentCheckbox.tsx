'use client'

import Link from 'next/link'
import { useWallet } from '@solana/wallet-adapter-react'
import { Checkbox } from '@/components/ui/checkbox'
import { getConsentStatement } from '@/lib/compliance/legalConstants'
import { isConsentValid, useComplianceStore } from '@/lib/compliance/consentStore'

interface ConsentCheckboxProps {
  /** Tool the consent applies to; one consent covers exactly one paid action. */
  toolId: string
}

const LINK_TARGETS: Record<string, string> = {
  'Terms of Service': '/terms-of-service',
  'Demo Terms': '/terms-of-service',
  'Privacy Policy': '/privacy-policy',
}

const LINK_PATTERN = /(Terms of Service|Demo Terms|Privacy Policy)/

/**
 * Required, initially unticked clickwrap checkbox shown before every signature
 * (paid mode: CRD Art. 16(m), 8(7); Devnet showcase: demo acknowledgement and 18+ attestation). Ticking records the consent (time, Terms version, wording) in the
 * compliance store; it is bound to the connected wallet and consumed by the first confirmed
 * transaction of the action.
 */
export const ConsentCheckbox = ({ toolId }: ConsentCheckboxProps): React.ReactNode => {
  const { publicKey } = useWallet()
  const wallet = publicKey?.toString()
  const consent = useComplianceStore((state) => state.consents[toolId])
  const giveConsent = useComplianceStore((state) => state.giveConsent)
  const withdrawConsent = useComplianceStore((state) => state.withdrawConsent)

  const checked = isConsentValid(consent, wallet)
  const inputId = `consent-${toolId}`

  const handleCheckedChange = (value: boolean | 'indeterminate'): void => {
    if (value === true && wallet) {
      giveConsent(toolId, wallet)
    } else {
      withdrawConsent(toolId)
    }
  }

  return (
    <div className='flex items-start gap-3'>
      <Checkbox
        aria-required='true'
        checked={checked}
        className='mt-1'
        disabled={!wallet}
        id={inputId}
        onCheckedChange={handleCheckedChange}
        required
      />
      <label className='text-muted-foreground cursor-pointer text-sm leading-relaxed' htmlFor={inputId}>
        {getConsentStatement()
          .split(LINK_PATTERN)
          .map((part, index) =>
            LINK_TARGETS[part] ? (
              <Link
                className='text-primary underline underline-offset-2'
                href={LINK_TARGETS[part]}
                key={`${part}-${index}`}
                rel='noopener'
                target='_blank'
              >
                {part}
              </Link>
            ) : (
              part
            )
          )}
      </label>
    </div>
  )
}
