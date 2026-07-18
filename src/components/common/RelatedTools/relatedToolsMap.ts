/**
 * Curated topical relationships between tools (by `Service.id` from
 * ServiceShowcaseSection/serviceData.ts), used to render each tool page's
 * "Related Tools" section. Each tool lists 3 related tools; the graph is
 * balanced so every tool receives multiple inbound links.
 */
export const relatedToolsMap: Record<string, string[]> = {
  'token-creator': ['liquidity-provider', 'token-auditor', 'revoke-mint'],
  multisender: ['token-creator', 'liquidity-provider', 'burn-tokens'],
  'burn-tokens': ['revoke-mint', 'token-auditor', 'multisender'],
  'revoke-mint': ['revoke-freeze', 'burn-tokens', 'token-auditor'],
  'revoke-freeze': ['revoke-mint', 'freeze-wallets', 'unfreeze-wallets'],
  'freeze-wallets': ['unfreeze-wallets', 'revoke-freeze', 'token-auditor'],
  'unfreeze-wallets': ['freeze-wallets', 'revoke-freeze', 'token-auditor'],
  'token-auditor': ['token-creator', 'revoke-mint', 'revoke-freeze'],
  'liquidity-provider': ['token-creator', 'multisender', 'token-auditor'],
}
