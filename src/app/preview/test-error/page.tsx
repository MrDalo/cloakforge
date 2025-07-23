/* eslint-disable react/jsx-max-depth */
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

const ErrorTrigger = (): React.ReactNode => {
  const [errorType, setErrorType] = useState<string | null>(null)

  if (errorType === 'basic') {
    throw new Error('This is a basic test error to preview the error page!')
  }

  if (errorType === 'network') {
    const error = new Error('Network request failed')
    error.name = 'NetworkError'
    // Simulate a network error with status
    Object.assign(error, { status: 500, statusText: 'Internal Server Error' })
    throw error
  }

  if (errorType === 'chunk') {
    const error = new Error('Loading CSS chunk 123 failed')
    error.name = 'ChunkLoadError'
    throw error
  }

  return (
    <div className='bg-background min-h-screen'>
      <section className='px-6 py-16 md:py-24'>
        <div className='container mx-auto max-w-4xl'>
          <Card className='border-border border-2'>
            <CardContent className='p-8 text-center'>
              <h1 className='mb-6 text-3xl font-bold'>Error Page Testing</h1>
              <p className='text-muted-foreground mb-8'>
                Click any button below to trigger different types of errors and see how the error page displays various error details
                including status codes.
              </p>

              <div className='grid gap-4 md:grid-cols-3'>
                <Button className='bg-red-500 hover:bg-red-600' onClick={() => setErrorType('basic')} size='lg'>
                  🚨 Basic Error
                </Button>

                <Button className='bg-orange-500 hover:bg-orange-600' onClick={() => setErrorType('network')} size='lg'>
                  🌐 Network Error (500)
                </Button>

                <Button className='bg-purple-500 hover:bg-purple-600' onClick={() => setErrorType('chunk')} size='lg'>
                  📦 Chunk Load Error
                </Button>
              </div>

              <div className='mt-8 text-sm text-gray-500'>
                <p>Or visit these preview routes:</p>
                <ul className='mt-2 space-y-1'>
                  <li>
                    •{' '}
                    <a className='text-blue-500 hover:underline' href='/preview/error'>
                      Regular Error Preview
                    </a>
                  </li>
                  <li>
                    •{' '}
                    <a className='text-blue-500 hover:underline' href='/preview/global-error'>
                      Global Error Preview
                    </a>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}

export default ErrorTrigger
