import { TOOL_DISPLAY_NAMES, isValidCoreToolType } from '@/types/toolTypes'
import { type TransactionReceipt } from './consentStore'
import { LEGAL_CONTACTS, SITE_ORIGIN } from './legalConstants'
import { FALLBACK_OPERATOR_INFO, getOperatorIdentityLines, getVatStatusText, type OperatorInfo } from './operatorInfo'

/**
 * Client-generated confirmation of a completed paid action on a durable medium
 * (CRD Art. 8(7)): a self-contained HTML file with the transaction details, the consent the user
 * gave, the operator identity and the full Terms text. Nothing is sent to the server.
 */

const SOL_DECIMALS = 9

export interface ReceiptDocumentInput {
  receipt: TransactionReceipt
  operator: OperatorInfo
  /** Full plain-text Terms of Service of the version the user accepted. */
  termsText: string
}

const HTML_ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }

/**
 * Escapes text for safe inclusion in HTML (token names and other inputs are user-controlled).
 *
 * @param value - Raw text.
 * @returns HTML-escaped text.
 */
export const escapeHtml = (value: string): string => value.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char])

/**
 * Display name of a tool for receipts.
 *
 * @param toolId - Tool identifier (core tool type or 'donation').
 * @returns Human-readable tool name.
 */
export const getReceiptToolName = (toolId: string): string => {
  if (toolId === 'donation') return 'Donation'
  return isValidCoreToolType(toolId) ? TOOL_DISPLAY_NAMES[toolId] : toolId
}

const formatSol = (amount: number): string =>
  `${amount < 0 ? '−' : ''}${Math.abs(amount)
    .toFixed(SOL_DECIMALS)
    .replace(/\.?0+$/, '')} SOL`

const formatUtc = (iso: string): string =>
  `${iso
    .replace('T', ' ')
    .replace(/\.\d+Z$/, '')
    .replace(/Z$/, '')} UTC`

const row = (label: string, valueHtml: string): string => `<tr><th>${escapeHtml(label)}</th><td>${valueHtml}</td></tr>`

const buildFeeRows = (receipt: TransactionReceipt): string => {
  if (!receipt.feeQuote) {
    return row('Fees shown before signing', 'Not available (see the transaction on the blockchain)')
  }
  const lines = receipt.feeQuote.lines.map((line) => row(line.label, escapeHtml(formatSol(line.amountSOL))))
  return [...lines, row('Total shown before signing', `<strong>${escapeHtml(formatSol(receipt.feeQuote.totalSOL))}</strong>`)].join('')
}

const buildSignatureList = (signatures: string[]): string =>
  signatures
    .map((signature) => {
      const safe = escapeHtml(signature)
      return `<li><a href="https://solscan.io/tx/${encodeURIComponent(signature)}">${safe}</a></li>`
    })
    .join('')

/**
 * Builds the receipt as a standalone HTML document (no scripts, no external resources).
 *
 * @param input - Receipt record, operator identity and Terms text.
 * @returns HTML document string.
 */
export const buildReceiptHtml = ({ receipt, operator, termsText }: ReceiptDocumentInput): string => {
  const toolName = getReceiptToolName(receipt.toolId)
  const detailRows = receipt.details.map((detail) => row(detail.label, escapeHtml(detail.value))).join('')
  const operatorLines = getOperatorIdentityLines(operator)
    .map((line) => `<li>${escapeHtml(line)}</li>`)
    .join('')

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>CloakForge receipt – ${escapeHtml(toolName)} – ${escapeHtml(formatUtc(receipt.completedAt))}</title>
<style>
body{font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:820px;margin:2rem auto;padding:0 1rem;color:#111;line-height:1.5}
h1{font-size:1.5rem}h2{font-size:1.1rem;margin-top:2rem;border-bottom:1px solid #ddd;padding-bottom:.25rem}
table{border-collapse:collapse;width:100%}th,td{text-align:left;vertical-align:top;padding:.35rem .5rem;border-bottom:1px solid #eee}
th{width:38%;font-weight:600}td,li{word-break:break-all}blockquote{margin:0;padding:.75rem 1rem;background:#f6f6f6;border-left:4px solid #888}
pre{white-space:pre-wrap;font-family:inherit;font-size:.9rem}
</style>
</head>
<body>
<h1>CloakForge – Order confirmation and receipt</h1>
<p>Keep this file as your confirmation of the contract on a durable medium. It was generated in your browser.</p>
<h2>Transaction</h2>
<table>
${row('Service', escapeHtml(toolName))}
${row('Consent given (UTC)', escapeHtml(formatUtc(receipt.acceptedAt)))}
${row('Completed (UTC)', escapeHtml(formatUtc(receipt.completedAt)))}
${row('Wallet (payer)', escapeHtml(receipt.wallet))}
${detailRows}
${buildFeeRows(receipt)}
${row('VAT', escapeHtml(getVatStatusText(operator.vatId)))}
</table>
<h2>Transaction signature(s)</h2>
<ul>${buildSignatureList(receipt.signatures)}</ul>
<p>The amounts actually charged are those in the signed transaction(s) above.</p>
<h2>Your consent</h2>
<p>Before signing, you ticked the following statement (Terms of Service version ${escapeHtml(receipt.termsVersion)}):</p>
<blockquote>${escapeHtml(receipt.statement)}</blockquote>
<p>The service was fully performed when the transaction was confirmed on-chain; in line with your consent, the right of withdrawal no longer applies.</p>
<h2>Complaints</h2>
<p>If the service did not build the transaction you configured, email ${escapeHtml(LEGAL_CONTACTS.support)} within two years with the transaction signature. Out-of-court consumer disputes: Czech Trade Inspection Authority (ČOI), www.coi.cz, adr.coi.cz.</p>
<h2>Operator</h2>
<ul>${operatorLines}</ul>
<p>${escapeHtml(SITE_ORIGIN)}/imprint</p>
<h2>Terms of Service (version ${escapeHtml(receipt.termsVersion)}) – full text</h2>
<pre>${escapeHtml(termsText)}</pre>
</body>
</html>
`
}

/**
 * File name for a receipt download.
 *
 * @param receipt - Receipt record.
 * @returns File name such as `cloakforge-receipt-2026-10-16-5x8F2abc.html`.
 */
export const getReceiptFileName = (receipt: TransactionReceipt): string => {
  const date = receipt.completedAt.slice(0, 10)
  const signaturePrefix = (receipt.signatures[0] ?? 'transaction').slice(0, 8).replace(/[^A-Za-z0-9]/g, '')
  return `cloakforge-receipt-${date}-${signaturePrefix}.html`
}

/**
 * Generates the receipt in the browser and starts the download.
 *
 * The operator identity comes from the public operator API; if it cannot be loaded the receipt
 * still downloads with a pointer to the Imprint. The Terms text is loaded on demand.
 *
 * @param receipt - Receipt record.
 */
export const downloadReceipt = async (receipt: TransactionReceipt): Promise<void> => {
  const [{ fetchOperatorInfo }, { buildTermsSections, termsSectionsToPlainText }] = await Promise.all([
    import('./useOperatorInfo'),
    import('./termsContent'),
  ])
  const operator = await fetchOperatorInfo()
    .then((info) => info.operator)
    .catch(() => FALLBACK_OPERATOR_INFO)

  const html = buildReceiptHtml({ receipt, operator, termsText: termsSectionsToPlainText(buildTermsSections(operator)) })
  const url = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }))

  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = getReceiptFileName(receipt)
  anchor.rel = 'noopener'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  // Give the browser a moment to start the download before releasing the blob
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
