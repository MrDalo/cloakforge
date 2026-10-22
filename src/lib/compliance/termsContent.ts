import { getConsentStatement, LEGAL_CONTACTS, LEGAL_LAST_UPDATED, TERMS_VERSION } from './legalConstants'
import { getOperatorIdentityLines, getVatStatusText, type OperatorInfo } from './operatorInfo'

/**
 * Text of the Terms of Service, kept free of UI concerns so the Terms page and the downloadable
 * receipt (which must carry the full Terms text, CJEU C-49/11) render the same wording.
 */

export interface TermsTextContent {
  type: 'text' | 'list'
  text?: string
  description?: string
  items?: string[]
}

export interface TermsTextSection {
  id: string
  title: string
  content: TermsTextContent
}

const { support, privacy, legal, abuse } = LEGAL_CONTACTS

/**
 * Builds the Terms of Service sections for the given operator identity.
 *
 * @param operator - Public operator identity (from getLegalEntityInfo or the operator API).
 * @returns Ordered Terms sections.
 */
export const buildTermsSections = (operator: OperatorInfo): TermsTextSection[] => [
  {
    id: 'contact',
    title: 'Operator Information and Points of Contact',
    content: {
      type: 'list',
      description: `The Service is operated by the following sole trader. These Terms are version ${TERMS_VERSION} (last updated ${LEGAL_LAST_UPDATED}).`,
      items: [
        ...getOperatorIdentityLines(operator),
        `Support and complaints: ${support}`,
        `Privacy requests: ${privacy}`,
        `Single point of contact for authorities and users (DSA Art. 11–12): ${legal} (English, Czech)`,
        `Report illegal content: ${abuse}`,
      ],
    },
  },
  {
    id: 'contract-formation',
    title: 'Scope and Contract Formation',
    content: {
      type: 'list',
      description:
        'These Terms of Service ("Terms") govern your use of CloakForge (the "Service"), operated by the operator named in the Operator Information section ("we", "us", "our"). Version ' +
        `${TERMS_VERSION}.`,
      items: [
        'A contract for a paid action is formed when you tick the acceptance box and sign the transaction in your wallet',
        `The acceptance box reads: "${getConsentStatement()}"`,
        'Before signing you can correct your inputs in the form and review the transaction in your wallet prompt; you can cancel at any time before signing',
        'The contract is concluded in English',
        'We do not archive the contract for you; after a successful transaction you can download a confirmation file containing the transaction details, your consent and these Terms',
        'The Terms version shown when you sign a transaction governs that transaction',
      ],
    },
  },
  {
    id: 'eligibility',
    title: 'Eligibility',
    content: {
      type: 'list',
      description: 'By using the Service, you represent and warrant that:',
      items: [
        'You are at least 18 years old and of legal age in your jurisdiction',
        'You have the legal capacity and authority to enter into these Terms',
        'You are not located in, resident in, or organised in a comprehensively sanctioned jurisdiction or region',
        'You are not identified on any sanctions or restricted-party list maintained by the EU, the Czech Republic, the United States, the United Kingdom, the United Nations, or any other applicable authority',
        'Your use of the Service complies with all laws, regulations, and rules applicable to you',
        'You understand the technical, legal, and financial risks of blockchain, crypto-assets, and token creation',
      ],
    },
  },
  {
    id: 'service-description',
    title: 'Nature of the Service',
    content: {
      type: 'list',
      description: 'CloakForge is a non-custodial software interface and transaction-building service that:',
      items: [
        'Provides technical tools for building transactions that interact with public blockchain networks, including Solana',
        'Prepares unsigned transactions that you review and sign with your own wallet',
        'Never takes custody of your funds, crypto-assets, private keys, seed phrases, or accounts',
        'Relies on third-party infrastructure such as wallet providers, hosting providers, IPFS pinning services, and blockchain RPC providers',
      ],
    },
  },
  {
    id: 'technical-architecture',
    title: 'Technical Architecture and Infrastructure Role',
    content: {
      type: 'list',
      description: 'CloakForge operates as a technical interface layer between you and public blockchain networks:',
      items: [
        "Token operations use Solana's native Token, Token-2022, and Metadata programs directly",
        'We do not deploy, control, or manage smart contracts on your behalf',
        'All blockchain operations are executed between your wallet and the network',
        'Our service fee is a standard transfer instruction within the transaction you sign',
        'Each transaction includes a public memo naming the CloakForge tool used, as described in the Privacy Policy',
      ],
    },
  },
  {
    id: 'regulatory-positioning',
    title: 'Regulatory Positioning',
    content: {
      type: 'list',
      description: 'You acknowledge and agree that:',
      items: [
        'CloakForge is a software tool and user interface only',
        'CloakForge is not a bank, broker, dealer, exchange, trading venue, money transmitter, payment service provider, investment firm, asset manager, or fiduciary',
        'CloakForge does not provide custody or administration of crypto-assets for third parties and does not operate a trading platform for crypto-assets',
        'CloakForge does not provide legal, tax, accounting, investment, or financial advice',
        'Nothing in the Service constitutes a recommendation, endorsement, solicitation, or offer to buy, sell, issue, distribute, or promote any crypto-asset, token, or financial instrument',
      ],
    },
  },
  {
    id: 'mica-positioning',
    title: 'MiCA and Crypto Regulatory Positioning',
    content: {
      type: 'list',
      description:
        'For purposes of Regulation (EU) 2023/1114 on markets in crypto-assets ("MiCA") and similar laws in other jurisdictions:',
      items: [
        'We operate as a technical infrastructure provider and software interface only and are not a crypto-asset service provider (CASP) authorised under MiCA',
        'We do not prepare, approve, verify, or publish crypto-asset white papers for users',
        'Any token created using our interface is created solely by you through direct blockchain interaction',
        'All compliance obligations relating to token creation, issuance, marketing, disclosure, consumer protection, anti-money laundering, sanctions, securities laws, or MiCA remain solely with you',
      ],
    },
  },
  {
    id: 'non-custodial',
    title: 'Non-Custodial Nature',
    content: {
      type: 'list',
      description: 'You acknowledge and agree that:',
      items: [
        'You retain sole control over your wallet, credentials, private keys, and seed phrases at all times',
        'We cannot access, retrieve, recover, reset, or rotate your private keys or seed phrases',
        'We cannot reverse, cancel, edit, or recover blockchain transactions once signed and submitted',
        'Loss of access to your wallet may result in irreversible loss of funds or assets',
      ],
    },
  },
  {
    id: 'fees',
    title: 'Fees, Taxes and Coupons',
    content: {
      type: 'list',
      description: 'Paid tools charge a service fee that is part of the transaction you sign:',
      items: [
        'Fees are shown in SOL before you sign, next to the confirmation checkbox (the current fee of each tool is displayed on its page)',
        getVatStatusText(operator.vatId),
        'Blockchain network fees, priority fees, rent deposits, and similar charges are network costs beyond our control',
        'By signing a transaction, you authorise all transfers and fee payments reflected in it; confirmed transactions are final and irreversible',
        'We may change our fees for future transactions; the fee shown before you sign applies to that transaction',
        'Coupons: one per transaction, no cash value, non-transferable, may be withdrawn at any time',
      ],
    },
  },
  {
    id: 'refund-policy',
    title: 'Right of Withdrawal and Refunds',
    content: {
      type: 'list',
      description: 'Service fees are paid inside blockchain transactions that you sign yourself:',
      items: [
        'You have a 14-day right of withdrawal as a consumer, but you lose it once the service is fully performed (transaction confirmed on-chain), provided you gave your express prior consent and acknowledgment via the checkbox before signing',
        'Without that consent and acknowledgment the service is not performed, and you cannot sign a paid transaction',
        'If the transaction fails or is never confirmed, the service fee is not charged: the fee is part of the same transaction, so no payment occurs',
        'Errors in the inputs you provide (recipient addresses, amounts, token parameters, metadata, or authority settings) do not entitle you to a refund; the service is performed correctly when it executes the transaction you configured and signed',
        'Blockchain transactions are irreversible by design; we cannot reverse, cancel, or recall a confirmed transaction or the fee paid within it',
        'Nothing in this section excludes or limits any right or remedy you have under mandatory law',
        `Requests based on mandatory law should be sent to ${support} with the transaction signature, the wallet address used, and a description of the claim`,
      ],
    },
  },
  {
    id: 'donations',
    title: 'Donations',
    content: {
      type: 'list',
      description:
        'The Service offers an optional feature to send a voluntary payment ("donation") in SOL or another token to our treasury wallet:',
      items: [
        'A donation is a voluntary, gratuitous transfer; you receive no goods, service, membership, reward, or other consideration in exchange',
        'CloakForge is not a registered charity; donations are not tax-deductible',
        'You choose the asset and amount and execute the transfer by signing a transaction with your own wallet',
        'Where applicable law treats a donation as a contract with a right of withdrawal, you expressly request immediate performance and acknowledge that you lose that right once the transaction is confirmed on-chain',
        'Donations are final once confirmed, except where mandatory law requires otherwise',
      ],
    },
  },
  {
    id: 'user-responsibilities',
    title: 'User Responsibilities',
    content: {
      type: 'list',
      description: 'You are solely responsible for:',
      items: [
        'Securing your devices, wallet, credentials, private keys, and seed phrases',
        'Reviewing all on-screen information and wallet prompts before signing any transaction',
        'Evaluating the suitability, legality, and consequences of your actions in your jurisdiction',
        'Paying taxes, duties, reporting obligations, and regulatory charges that may apply to your activity',
        'All activity conducted through your wallet or wallet-connected session',
      ],
    },
  },
  {
    id: 'token-responsibility',
    title: 'Token Creation and Issuance Responsibility',
    content: {
      type: 'list',
      description: 'If you create, configure, deploy, burn, modify, or otherwise interact with tokens using the Service:',
      items: [
        'You are solely the creator, issuer, controller, promoter, and responsible party for those tokens and related activities',
        'We do not review, audit, approve, endorse, market, distribute, or verify any token',
        'We make no representation that any token is lawful, non-security, non-e-money, non-financial instrument, or otherwise compliant in any jurisdiction',
        'If any white paper, disclosure, licensing step, filing, registration, or authorisation is required, that obligation is yours alone',
        'You must not use the Service to create deceptive, fraudulent, misleading, infringing, unlawful, or malicious tokens',
      ],
    },
  },
  {
    id: 'no-offer-no-solicitation',
    title: 'No Offer, Solicitation, Promotion, or Admission to Trading',
    content: {
      type: 'text',
      text: 'Nothing in the Service, interface, documentation, code, or communications constitutes an offer to the public, solicitation, recommendation, endorsement, invitation to invest, financial promotion, or admission to trading of any token, crypto-asset, or financial instrument. All blockchain actions are initiated solely by users at their own direction and risk.',
    },
  },
  {
    id: 'no-advice',
    title: 'No Advice',
    content: {
      type: 'text',
      text: 'Token Auditor results, security scores, and other informational outputs are informational only. They are not investment advice or a personal recommendation, and scores are heuristic: they may be incomplete or wrong and are not an assessment of whether any token is lawful or safe.',
    },
  },
  {
    id: 'prohibited-uses',
    title: 'Prohibited Uses',
    content: {
      type: 'list',
      description: 'You agree not to use the Service for, in connection with, or to facilitate:',
      items: [
        'Any unlawful, fraudulent, deceptive, abusive, or malicious activity',
        'Money laundering, terrorist financing, sanctions evasion, or dealings with restricted persons',
        'Scam tokens, impersonation tokens, phishing tools, malware-related assets, or deceptive token launches',
        'Violating securities, financial services, consumer-protection, intellectual property, privacy, or advertising laws',
        'Attempting to exploit vulnerabilities, bypass safeguards (including geo-blocking), interfere with the Service, scrape infrastructure abusively, or conduct denial-of-service activity',
      ],
    },
  },
  {
    id: 'content-rules',
    title: 'Uploaded Content and Notices of Illegal Content',
    content: {
      type: 'list',
      description:
        'When you upload an image or metadata (for example a token logo), we pin it publicly on IPFS through our Pinata account and serve it through our gateway:',
      items: [
        'Uploaded content is public and, on IPFS, effectively permanent; copies pinned by third parties are outside our control',
        "Do not upload content that infringes others' intellectual property (e.g., third-party logos), impersonates brands or persons, contains other people's personal data, or is otherwise illegal",
        `To report illegal content (DSA Art. 16), email ${abuse} with the IPFS CID or URL, why you believe it is illegal, your name and email address, and a statement that your notice is accurate and made in good faith`,
        'We review notices without undue delay; where justified we unpin the content from our Pinata account, block it on our gateway, and inform the person who sent the notice',
        'Where we remove your content and have your contact details, we tell you why and how you can contest the decision (DSA Art. 17)',
        `Single point of contact for authorities and users (DSA Art. 11–12): ${legal}; languages: English, Czech`,
      ],
    },
  },
  {
    id: 'sanctions',
    title: 'Sanctions and Restricted Jurisdictions',
    content: {
      type: 'list',
      description: 'We comply with EU, Czech, UN, UK, and US sanctions laws:',
      items: [
        'You must not use the Service if you are located in, resident in, or organised in a comprehensively sanctioned jurisdiction or region, or if you are a sanctioned or restricted person',
        'We use IP-based geo-blocking and screen wallet addresses against public sanctions lists and will refuse to build transactions for blocked regions or listed addresses',
        'Circumventing these controls (e.g., by VPN) is a material breach of these Terms',
        'We may refuse, suspend, or terminate the Service where we reasonably suspect sanctions risk or prohibited use',
        'We do not perform identity verification (KYC)',
      ],
    },
  },
  {
    id: 'third-party-services',
    title: 'Third-Party Services and Dependencies',
    content: {
      type: 'list',
      description: 'The Service depends on third parties beyond our control, including:',
      items: [
        'Public blockchain networks, including Solana, and wallet providers',
        'Alchemy (RPC), Vercel (hosting), Pinata (IPFS), Contentful (CMS), Better Stack (error logs), and Google (web font)',
        'Raydium and CoinGecko APIs for pool and price data where applicable',
        'We are not responsible for the availability, security, legality, accuracy, or failures of third-party services',
      ],
    },
  },
  {
    id: 'technical-risks',
    title: 'Technical and Blockchain Risks',
    content: {
      type: 'list',
      description: 'Use of the Service involves substantial technical and blockchain risks, including:',
      items: [
        'Software bugs, RPC failures, outages, latency, or malformed data',
        'Irreversible, failed, or duplicate transactions and incorrect parameter submission',
        'Network congestion, fee volatility, validator behaviour, or chain instability',
        'Wallet bugs, browser issues, phishing, malicious extensions, and device compromise',
        'Token metadata errors, authority misconfiguration, liquidity mistakes, and permanent configuration errors',
      ],
    },
  },
  {
    id: 'market-and-regulatory-risks',
    title: 'Market, Legal, and Regulatory Risks',
    content: {
      type: 'list',
      description: 'Blockchain and token activity involves significant legal and financial uncertainty:',
      items: [
        'Crypto-assets may be volatile and may lose all value',
        'Laws may change rapidly and differ across jurisdictions',
        'A token or transaction may be treated as a security, financial instrument, e-money, or other regulated product depending on facts and jurisdiction',
        'Enforcement action, tax consequences, civil disputes, or criminal liability may arise from your activities',
      ],
    },
  },
  {
    id: 'no-warranties',
    title: 'No Warranties',
    content: {
      type: 'list',
      description: 'To the extent permitted by law, the Service is provided "as is" and "as available", without warranties of any kind:',
      items: [
        'No warranty of uninterrupted, timely, secure, or error-free operation',
        'No warranty of fitness for a particular purpose, merchantability, title, or non-infringement',
        'No warranty that outputs, calculations, or blockchain results are accurate, complete, lawful, or suitable for your needs',
        'Your statutory rights for defective performance (see Complaints) remain unaffected',
      ],
    },
  },
  {
    id: 'limitation-liability',
    title: 'Limitation of Liability',
    content: {
      type: 'text',
      text: 'To the extent permitted by law, we are not liable for indirect, incidental, consequential, special, or punitive damages, or for loss of profits, revenue, business, goodwill, data, crypto-assets, tokens, or funds arising from the Service, blockchain transactions, third-party services, or unauthorised access to your wallet or devices. Nothing in these Terms limits liability for intent, gross negligence, harm to life or health, or any liability that cannot be limited by law (including under §2898 of the Czech Civil Code). For business users, our total liability is capped at the fees you paid us in the 12 months before the claim.',
    },
  },
  {
    id: 'indemnification',
    title: 'Indemnification',
    content: {
      type: 'text',
      text: 'If you use the Service for business purposes, you agree to indemnify and hold harmless the operator against claims, losses, and costs (including reasonable legal fees) arising from your use of the Service, your tokens, your breach of these Terms, or your violation of any law or third-party right. If you are a consumer, you are liable only for losses caused by your culpable breach of these Terms.',
    },
  },
  {
    id: 'termination',
    title: 'Suspension and Termination',
    content: {
      type: 'list',
      description: 'We may suspend, restrict, or terminate access to the Service:',
      items: [
        'If we reasonably believe you are violating these Terms or applicable law',
        'If we suspect fraud, abuse, sanctions risk, or security risk',
        'If required by law, court order, regulator, or infrastructure provider',
        'If we modify, discontinue, or shut down part or all of the Service',
      ],
    },
  },
  {
    id: 'changes',
    title: 'Changes to the Service and Terms',
    content: {
      type: 'list',
      description: 'We may change the Service or these Terms:',
      items: [
        'Changes may reflect legal, regulatory, technical, business, or security developments',
        'Updated Terms are posted on this page with a new version and date',
        'The Terms version shown when you sign a transaction governs that transaction; changes never apply to completed transactions',
      ],
    },
  },
  {
    id: 'complaints',
    title: 'Complaints and Out-of-Court Dispute Resolution',
    content: {
      type: 'list',
      description: 'If something went wrong with a transaction we built:',
      items: [
        `Complaints (reklamace): if the Service did not build the transaction you configured, email ${support} within two years with the transaction signature and a description of the problem. We confirm receipt and decide within 30 days`,
        'Out-of-court resolution of consumer disputes: Czech Trade Inspection Authority (Česká obchodní inspekce, ČOI), Štěpánská 567/15, 120 00 Praha 2, www.coi.cz. You can submit a proposal online at adr.coi.cz',
        'ČOI also supervises compliance with Czech consumer-protection law',
      ],
    },
  },
  {
    id: 'consumer-rights',
    title: 'Consumer Rights',
    content: {
      type: 'list',
      description: 'Nothing in these Terms limits any mandatory rights you have under consumer-protection law:',
      items: [
        'Mandatory consumer rights under EU, Czech, or other applicable law remain unaffected',
        'If non-waivable law grants you rights inconsistent with these Terms, that law prevails to that extent only',
      ],
    },
  },
  {
    id: 'us-arbitration',
    title: 'Dispute Resolution for US Users',
    content: {
      type: 'list',
      description:
        'This section applies only if you reside in the United States. It does not apply to consumers in the EU, the EEA, or any other place where such a clause is not permitted:',
      items: [
        'Disputes are resolved by individual binding arbitration under the AAA Consumer Arbitration Rules, except that either party may bring a claim in small-claims court',
        'Class actions, class arbitrations, and jury trials are waived',
        `You may opt out of arbitration within 30 days of first accepting these Terms by emailing ${legal}`,
      ],
    },
  },
  {
    id: 'governing-law-jurisdiction',
    title: 'Governing Law and Jurisdiction',
    content: {
      type: 'list',
      description: 'These Terms are governed as follows:',
      items: [
        'These Terms are governed by the laws of the Czech Republic',
        'If you are a consumer, this choice of law does not deprive you of the protection of the mandatory provisions of the law of your country of habitual residence (Art. 6(2) Rome I Regulation)',
        'Czech courts have jurisdiction; if you are an EU consumer you may also bring proceedings in the courts of your domicile, and we may sue you only there',
        'Before formal proceedings, please contact us so we can try to resolve the dispute',
      ],
    },
  },
]

/**
 * Renders Terms sections as numbered plain text (used for the receipt appendix).
 *
 * @param sections - Terms sections.
 * @returns Plain-text Terms.
 */
export const termsSectionsToPlainText = (sections: TermsTextSection[]): string =>
  sections
    .map((section, index) => {
      const heading = `${index + 1}. ${section.title}`
      const { content } = section
      if (content.type === 'text') {
        return `${heading}\n${content.text ?? ''}`
      }
      const lines = [content.description, ...(content.items ?? []).map((item) => `- ${item}`)].filter(Boolean)
      return `${heading}\n${lines.join('\n')}`
    })
    .join('\n\n')
