export const liquidityProviderFAQ = [
  {
    question: 'What is the difference between CPMM and CLMM pools?',
    answer:
      'CPMM (Constant Product Market Maker) pools use full-range liquidity and are simpler to manage. CLMM (Concentrated Liquidity Market Maker) pools allow you to concentrate liquidity within specific price ranges for better capital efficiency.',
  },
  {
    question: 'What are the costs for creating a liquidity pool?',
    answer:
      'CPMM pools cost approximately 0.19 SOL (0.0422 SOL rent + 0.15 SOL protocol fee). CLMM pools cost approximately 0.06 SOL in rent costs. All costs are non-refundable.',
  },
  {
    question: 'Which fee tier should I choose?',
    answer:
      '0.01% for stable or high-volume pairs, 0.05% for most common pairs, 0.25% for moderate volume pairs, and 1.00% for new or volatile pairs. Higher fees compensate for increased volatility risk.',
  },
  {
    question: 'Can I create a pool for tokens that already have a pool?',
    answer:
      'Only one pool can exist per token pair per fee tier on Raydium. The tool will validate and warn you if a pool already exists for your selected token pair and fee tier.',
  },
  {
    question: 'What happens after I create a pool?',
    answer:
      "Once created, you become a liquidity provider and will earn trading fees proportional to your share of the pool. You can add more liquidity, remove liquidity, or collect fees through Raydium's interface.",
  },
  {
    question: 'Do I need to provide initial liquidity?',
    answer:
      'Yes, CPMM pools require initial liquidity at creation to establish the starting price. CLMM pools can be created without initial liquidity, but you can add liquidity within your specified price range.',
  },
]
