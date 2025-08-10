export interface TransactionData {
  signature: string
  block: number
  time: number | null
  source: string | null
  destination: string | null
  fee: number
  amount: number
  isIncoming: boolean
  status: 'processed' | 'confirmed' | 'finalized'
  isSuccess: boolean | null
}
