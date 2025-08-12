/* eslint-disable react/jsx-max-depth */
'use client'

import { motion } from 'framer-motion'
import { Shield, AlertTriangle, Lock, Unlock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { type TokenData } from '../tokenAuditorData'

interface SecurityAnalysisProps {
  tokenData: TokenData
}

export const SecurityAnalysis = ({ tokenData }: SecurityAnalysisProps): React.ReactNode => {
  const getSecurityColor = (score: number): string => {
    if (score >= 80) return 'text-secondary'
    if (score >= 60) return 'text-warning'
    return 'text-destructive'
  }

  const getRiskColor = (risk: string): string => {
    if (risk === 'Low') return 'text-secondary'
    if (risk === 'Medium') return 'text-warning'
    return 'text-destructive'
  }

  return (
    <motion.div animate={{ opacity: 1, x: 0 }} initial={{ opacity: 0, x: 30 }} transition={{ duration: 0.8 }}>
      <Card className='border-border border-2'>
        <CardHeader className='from-primary/5 to-secondary/5 border-border border-b bg-gradient-to-r'>
          <CardTitle className='flex items-center space-x-2'>
            <Shield className='text-primary h-5 w-5' />
            <span>Security Analysis</span>
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-6 p-6'>
          {/* Security Score */}
          <div>
            <div className='mb-2 flex items-center justify-between'>
              <Label className='text-sm font-medium'>Security Score</Label>
              <span className={`font-medium ${getSecurityColor(tokenData.security.score)}`}>{tokenData.security.score}/100</span>
            </div>
            <Progress className='h-3' value={tokenData.security.score} />
          </div>

          {/* Authority Status */}
          <div className='space-y-3'>
            <Label className='text-sm font-medium'>Authority Status</Label>

            <div className='bg-muted/50 flex items-center justify-between rounded-lg p-3'>
              <div className='flex items-center space-x-2'>
                {tokenData.mintAuthority ? (
                  <>
                    <Unlock className='text-warning h-4 w-4' />
                    <span className='text-sm'>Mint Authority</span>
                  </>
                ) : (
                  <>
                    <Lock className='text-secondary h-4 w-4' />
                    <span className='text-sm'>Mint Authority</span>
                  </>
                )}
              </div>
              <Badge className='text-xs' variant={tokenData.mintAuthority ? 'destructive' : 'secondary'}>
                {tokenData.mintAuthority ? 'Active' : 'Revoked'}
              </Badge>
            </div>

            <div className='bg-muted/50 flex items-center justify-between rounded-lg p-3'>
              <div className='flex items-center space-x-2'>
                {tokenData.freezeAuthority ? (
                  <>
                    <Unlock className='text-warning h-4 w-4' />
                    <span className='text-sm'>Freeze Authority</span>
                  </>
                ) : (
                  <>
                    <Lock className='text-secondary h-4 w-4' />
                    <span className='text-sm'>Freeze Authority</span>
                  </>
                )}
              </div>
              <Badge className='text-xs' variant={tokenData.freezeAuthority ? 'destructive' : 'secondary'}>
                {tokenData.freezeAuthority ? 'Active' : 'Revoked'}
              </Badge>
            </div>
          </div>

          {/* Risk Assessment */}
          {tokenData.security.risks.length > 0 && (
            <div>
              <Label className='mb-2 block text-sm font-medium'>Risk Factors</Label>
              <div className='space-y-2'>
                {tokenData.security.risks.map((risk, index) => (
                  <div className='flex items-center space-x-2 text-sm' key={index}>
                    <AlertTriangle className='text-warning h-4 w-4' />
                    <span>{risk}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Holder Distribution */}
          <div>
            <Label className='mb-2 block text-sm font-medium'>Holder Distribution</Label>
            <div className='bg-muted/50 rounded-lg p-3'>
              <div className='mb-2 flex items-center justify-between'>
                <span className='text-sm'>Top 10 holders control</span>
                <span className='font-medium'>{tokenData.distribution.top10Percentage}%</span>
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-sm'>Concentration risk</span>
                <Badge className={`text-xs ${getRiskColor(tokenData.distribution.concentrationRisk)}`} variant='outline'>
                  {tokenData.distribution.concentrationRisk}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
