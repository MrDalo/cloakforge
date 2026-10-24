import { NextResponse } from 'next/server'
import { getBlogPosts } from '@/lib/contentful/client'
import { isToolPathAvailable } from '@/lib/config/showcaseTools'

const BASE_URL = 'https://cloakforge.app'

const TOOLS: Array<{ path: string; name: string; description: string }> = [
  { path: '/tools/token-creator', name: 'Token Creator', description: 'Create custom Solana SPL tokens instantly, no code required.' },
  {
    path: '/tools/transaction-multisender',
    name: 'Transaction Multisender',
    description: 'Send Solana tokens to multiple recipients in a single batch transaction.',
  },
  { path: '/tools/burn-tokens', name: 'Burn Tokens', description: 'Permanently burn Solana SPL tokens to reduce circulating supply.' },
  {
    path: '/tools/revoke-mint-authority',
    name: 'Revoke Mint Authority',
    description: "Revoke a token's mint authority to prevent further minting.",
  },
  {
    path: '/tools/revoke-freeze-authority',
    name: 'Revoke Freeze Authority',
    description: "Revoke a token's freeze authority to prevent account freezing.",
  },
  { path: '/tools/freeze-wallets', name: 'Freeze Wallets', description: 'Freeze specific token wallets to block transfers.' },
  { path: '/tools/unfreeze-wallets', name: 'Unfreeze Wallets', description: 'Unfreeze previously frozen token wallets.' },
  {
    path: '/tools/token-auditor',
    name: 'Token Auditor',
    description: 'Audit and analyze Solana SPL tokens for security risks, free to use.',
  },
  {
    path: '/tools/liquidity-provider',
    name: 'Liquidity Provider',
    description: 'Create CPMM or CLMM liquidity pools on Raydium with a guided, fee-transparent flow.',
  },
]

/**
 * Serves /llms.txt — a curated, machine-readable map of the site for AI
 * agents and LLM-based tools (per the llms.txt convention: llmstxt.org),
 * distinct from robots.txt (access control) and sitemap.xml (exhaustive
 * crawl list). Built dynamically so new blog posts appear without a
 * code change.
 *
 * @returns Plain-text llms.txt content.
 */
export async function GET(): Promise<NextResponse> {
  const posts = await getBlogPosts().catch(() => [])
  const recentPosts = posts.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()).slice(0, 10)

  const lines: string[] = [
    '# CloakForge',
    '',
    '> CloakForge is an all-in-one suite of Solana blockchain tools: create tokens, manage liquidity pools, burn tokens, revoke mint/freeze authority, batch-send transactions, and audit token security. Built for token creators, DeFi projects, and Solana developers.',
    '',
    '## Tools',
    '',
    ...TOOLS.filter((tool) => isToolPathAvailable(tool.path)).map(
      (tool) => `- [${tool.name}](${BASE_URL}${tool.path}): ${tool.description}`
    ),
    '',
  ]

  if (recentPosts.length > 0) {
    lines.push('## Blog', '')
    for (const post of recentPosts) {
      const excerpt = post.excerpt ? `: ${post.excerpt}` : ''
      lines.push(`- [${post.title}](${BASE_URL}/blog/${post.slug})${excerpt}`)
    }
    lines.push('')
  }

  lines.push('## Legal', '', `- [Privacy Policy](${BASE_URL}/privacy-policy)`, `- [Terms of Service](${BASE_URL}/terms-of-service)`, '')

  return new NextResponse(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
