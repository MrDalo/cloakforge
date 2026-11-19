import { type FAQ } from '@/components/common'
import { serviceFee } from '@/lib/config/livePricing'

export const updateMetadataFAQs: FAQ[] = [
  {
    question: 'What can I update with this tool?',
    answer:
      "Your Token-2022 mint's on-chain name and symbol, plus the off-chain metadata JSON your token's URI points to — description, logo, website, Twitter/X, Telegram, and Discord links. Only fields you actually change are re-uploaded or written on-chain.",
    category: 'general',
  },
  {
    question: 'Who can update a token metadata?',
    answer:
      'Only the wallet holding the metadata update authority for that specific Token-2022 mint. CloakForge checks this on-chain before allowing any changes — if you are not the update authority, or the metadata has already been made immutable, the tool tells you.',
    category: 'general',
  },
  {
    question: 'Does this work for classic SPL tokens (not Token-2022)?',
    answer:
      'No. This tool only supports Token-2022 mints using the metadata-pointer extension, where metadata is stored directly in the mint account. Classic SPL tokens using Metaplex Token Metadata accounts are not supported.',
    category: 'technical',
  },
  {
    question: "Will this change my token's mint address, supply, or decimals?",
    answer:
      'No. Your mint address, decimals, and total supply are all unaffected — only the name, symbol, and metadata URI (and whatever description/social links live in that URI JSON) can change.',
    category: 'technical',
  },
  {
    question: "What happens to fields I don't change?",
    answer:
      "They're left exactly as they are. CloakForge diffs your edits against the token's current on-chain and off-chain values, and only re-uploads to IPFS or writes on-chain updates for fields that actually changed — saving you fees and avoiding unnecessary transactions.",
    category: 'technical',
  },
  {
    question: 'How much does updating metadata cost?',
    answer: `CloakForge charges a service fee of ${serviceFee('update-metadata')} plus minimal Solana network fees, both shown in the Fee Breakdown before you confirm. There is no extra charge for re-uploading a changed logo or metadata JSON to IPFS.`,
    category: 'technical',
  },
  {
    question: 'Is it safe to update my token metadata on CloakForge?',
    answer:
      'Yes. CloakForge prepares the transaction server-side and sends it to your wallet for signing. Your private keys never leave your wallet, and only the update-metadata instructions relevant to your changed fields are included — no other permissions are touched.',
    category: 'security',
  },
  {
    question: "Can I make my token's metadata immutable after updating it?",
    answer:
      'Not with this tool directly — use the Revoke Metadata Authority tool once you are happy with your final name, symbol, and links to permanently give up the ability to update metadata.',
    category: 'security',
  },
]
