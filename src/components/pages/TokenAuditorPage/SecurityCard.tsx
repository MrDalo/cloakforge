import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import { SecurityAnalysis } from '@/lib/solana/token-auditor/types'

interface SecurityCardProps {
  analysis: SecurityAnalysis
}

export const SecurityCard = ({ analysis }: SecurityCardProps) => (
  <Card>
    <CardHeader>
      <CardTitle className='flex items-center gap-2'>
        <ShieldIcon className='h-5 w-5' />
        Security Analysis
      </CardTitle>
    </CardHeader>
    <CardContent className='space-y-4'>
      <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
        <StatusItem isSafe={!analysis.mintAuthority} label='Mint Authority' riskText='Active' safeText='Renounced' />
        <StatusItem isSafe={!analysis.freezeAuthority} label='Freeze Authority' riskText='Active' safeText='Renounced' />
        <StatusItem isSafe={!analysis.isMutable} label='Metadata' riskText='Mutable' safeText='Immutable' />
        <StatusItem
          icon={<CheckCircle className='h-4 w-4 text-blue-500' />}
          isSafe={true} // Just informational
          label='Token Standard'
          riskText=''
          safeText={analysis.isToken2022 ? 'Token-2022' : 'Token Program'}
        />
      </div>

      {analysis.risks.length > 0 && (
        <div className='mt-4 space-y-2'>
          <h4 className='text-sm font-semibold'>Detected Risks:</h4>
          {analysis.risks.map((risk, i) => (
            <div className='bg-destructive/10 text-destructive flex items-start gap-2 rounded-md p-2 text-sm' key={i}>
              <AlertTriangle className='mt-0.5 h-4 w-4 shrink-0' />
              <div>
                <span className='font-bold'>{risk.label}:</span> {risk.description}
              </div>
            </div>
          ))}
        </div>
      )}
    </CardContent>
  </Card>
)

const StatusItem = ({
  label,
  isSafe,
  safeText,
  riskText,
  icon,
}: {
  label: string
  isSafe: boolean
  safeText: string
  riskText: string
  icon?: React.ReactNode
}) => (
  <div className='flex items-center justify-between rounded-lg border p-3'>
    <span className='text-sm font-medium'>{label}</span>
    <div className='flex items-center gap-2'>
      {icon ? icon : isSafe ? <CheckCircle className='h-4 w-4 text-green-500' /> : <XCircle className='h-4 w-4 text-red-500' />}
      <span className={isSafe ? 'text-green-600' : 'text-red-600'}>{isSafe ? safeText : riskText}</span>
    </div>
  </div>
)

const ShieldIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    {...props}
    fill='none'
    height='24'
    stroke='currentColor'
    strokeLinecap='round'
    strokeLinejoin='round'
    strokeWidth='2'
    viewBox='0 0 24 24'
    width='24'
    xmlns='http://www.w3.org/2000/svg'
  >
    <path d='M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10' />
  </svg>
)
