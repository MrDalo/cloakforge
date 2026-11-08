import { type FAQ } from '@/components/common'

export const liquidityProviderFAQ: FAQ[] = [
  {
    question: 'What does the Liquidity Provider tool do?',
    answer:
      'It creates a trading pool on Raydium, a decentralized exchange on Solana, for your chosen token pair and deposits your initial liquidity. Once the pool is live, anyone can swap between the two tokens on Raydium, and DEX aggregators such as Jupiter can route trades through it.',
    category: 'general',
  },
  {
    question: 'Who should use the Liquidity Provider?',
    answer:
      'Token creators who want their token to be tradeable after launch, and projects that want to open a public market for a token pair. Providing liquidity carries risk, including impermanent loss — only deposit amounts you can afford to lose.',
    category: 'general',
  },
  {
    question: 'Why use CloakForge instead of creating a pool directly on Raydium?',
    answer:
      "CloakForge provides a guided form with plain-English explanations for each setting, a fee breakdown before you confirm, and sits alongside the rest of the token tools. The pool itself is created by Raydium's on-chain programs either way.",
    category: 'general',
  },
  {
    question: 'What is the difference between CPMM and CLMM pools?',
    answer:
      "CPMM (Constant Product) uses the x·y=k formula and spreads your liquidity across all possible prices. It's simpler to set up and needs no range management. CLMM (Concentrated Liquidity) lets you focus liquidity within a specific price range: while the price stays in range your liquidity is active, outside it your position earns nothing. Choose CLMM only if you're comfortable managing a price range.",
    category: 'technical',
  },
  {
    question: 'Which fee tier should I choose?',
    answer:
      'Raydium CPMM pools offer 0.25% and 1%; CLMM pools also offer 0.01% and 0.05%. As a rule of thumb, 0.01% suits very stable pairs (e.g. USDC/USDT), 0.05% and 0.25% suit most pairs, and 1% suits new or highly volatile tokens. If Raydium does not offer the tier you pick for the pool type, the request is rejected rather than switched to a different tier.',
    category: 'technical',
  },
  {
    question: 'What are Min Price, Max Price and Initial Price in CLMM pools?',
    answer:
      'All three are quoted as Token B per Token A. Min Price and Max Price define the range where your liquidity is active. Initial Price is the price the new pool opens at; it must lie inside your range. Set it to the current market price — an initial price below market lets arbitrage traders buy your Token A cheaply.',
    category: 'technical',
  },
  {
    question: 'Can I create a pool for a token that already has a pool?',
    answer:
      'Raydium allows only one pool per token pair and fee configuration. If such a pool already exists, the pool-creation transaction fails as a whole, so the platform fee is not charged; choose a different fee tier or pool type, or add liquidity to the existing pool on Raydium.',
    category: 'technical',
  },
  {
    question: 'What happens after I create a pool?',
    answer:
      "The pair becomes tradeable on Raydium. As a liquidity provider you receive a share of the trading fees while your liquidity is active (for CLMM, only while the price is inside your range). Fee income is not guaranteed and can be smaller than impermanent loss. You can add or remove liquidity and collect fees through Raydium's interface.",
    category: 'technical',
  },
  {
    question: 'Is pool creation reversible?',
    answer:
      'No. Once a Raydium pool is created, it cannot be closed or deleted. Your liquidity can be withdrawn separately, but the pool itself is permanent. Make sure your token pair and settings are correct before confirming.',
    category: 'security',
  },
  {
    question: 'Will creating a pool make my token publicly tradeable?',
    answer:
      'Yes. Once the pool exists, anyone can swap against it on Raydium and through aggregators that index Raydium pools. For CPMM, the initial price is set by the ratio of the two amounts you deposit; for CLMM, by the Initial Price you enter. Make sure it reflects a price you intend.',
    category: 'security',
  },
  {
    question: 'What are the costs for creating a liquidity pool?',
    answer:
      'CloakForge charges a platform fee (0.1 SOL unless the fee breakdown shows otherwise; discount coupons apply). It is part of the pool-creation transaction, so it is only paid if the pool is created. Solana network fees are typically ~0.0005 SOL. Raydium charges its own pool-creation costs: CPMM ~0.19 SOL, CLMM ~0.06 SOL for the pool plus a separate position-opening cost (see below). The fee breakdown shows the costs before you confirm.',
    category: 'general',
  },
  {
    question: 'Why does CLMM ask me to approve two wallet transactions?',
    answer:
      'On Raydium, creating a CLMM pool and depositing liquidity into it are two separate on-chain actions — the pool has to exist before liquidity can be added to a price range within it. CloakForge walks you through both: approve the first transaction to create the pool, wait for it to confirm, then approve the second to deposit your tokens and mint your position NFT. CPMM pools only need one approval, since liquidity is deposited at creation.',
    category: 'technical',
  },
  {
    question: 'What does opening a CLMM position cost, and what is the position NFT?',
    answer:
      "Opening a position costs roughly 0.0092–0.16 SOL, depending on whether new tick arrays need to be created for your chosen price range. You'll receive an NFT representing ownership of your position — it's what you'd use to withdraw liquidity or collect fees later via Raydium.",
    category: 'technical',
  },
  {
    question: 'What does Slippage Tolerance control?',
    answer:
      'It applies to CLMM pools when your position is opened. Between pool creation and the deposit, the new pool holds no liquidity, so its price can be moved. If the pool price has moved further from your Initial Price than your slippage tolerance, CloakForge does not build the deposit and no liquidity is deposited. The tolerance also caps how much more than the expected amounts the deposit may take. Accepted values are 0.1% to 50%; 0.5% is a typical default.',
    category: 'technical',
  },
  {
    question: 'What ratio should Amount A and Amount B be?',
    answer:
      "For CPMM pools, Amount A and Amount B set the price the pool opens at — for example, depositing 1 SOL and 150 USDC sets an initial price of 150 USDC per SOL. For CLMM pools, the amounts are the most you're willing to deposit; the deposit uses the ratio required by your Initial Price and range, so one amount may be used only partly. A price far from the market creates an arbitrage opportunity that costs you value, so check current market prices before submitting.",
    category: 'technical',
  },
]
