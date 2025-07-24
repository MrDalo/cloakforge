/* eslint-disable react/jsx-max-depth */
'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, Info, AlertTriangle, Bell, Zap, Heart, Star } from 'lucide-react'

const SonnerTestPage = (): React.ReactNode => {
  const [counter, setCounter] = useState(0)

  const showBasicToast = (): void => {
    toast('Basic Notification', {
      description: 'This is a basic notification message.',
    })
  }

  const showSuccessToast = (): void => {
    toast.success('Success!', {
      description: 'Your action was completed successfully.',
    })
  }

  const showErrorToast = (): void => {
    toast.error('Error Occurred', {
      description: 'Something went wrong. Please try again.',
    })
  }

  const showInfoToast = (): void => {
    toast.info('Information', {
      description: 'Here is some useful information for you.',
    })
  }

  const showWarningToast = (): void => {
    toast.warning('Warning!', {
      description: 'Please pay attention to this warning message.',
    })
  }

  const showLoadingToast = (): void => {
    const toastId = toast.loading('Processing...', {
      description: 'Please wait while we process your request.',
    })

    // Simulate loading and then success
    setTimeout(() => {
      toast.success('Process completed!', {
        id: toastId,
        description: 'Your request has been processed successfully.',
      })
    }, 3000)
  }

  const showPromiseToast = (): void => {
    const myPromise = new Promise<{ name: string }>((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() > 0.5) {
          resolve({ name: 'Sonner' })
        } else {
          reject(new Error('Something went wrong'))
        }
      }, 2000)
    })

    toast.promise(myPromise, {
      loading: 'Loading...',
      success: (data) => `${data.name} has been added`,
      error: 'Error occurred',
    })
  }

  const showActionToast = (): void => {
    toast('Event Scheduled', {
      description: 'Your event has been scheduled for tomorrow.',
      action: {
        label: 'View',
        onClick: () => toast.info('Viewing event details...'),
      },
    })
  }

  const showCancelToast = (): void => {
    toast('Delete Item', {
      description: 'This action cannot be undone.',
      cancel: {
        label: 'Cancel',
        onClick: () => toast.info('Action cancelled'),
      },
      action: {
        label: 'Delete',
        onClick: () => toast.success('Item deleted successfully'),
      },
    })
  }

  const showCustomIconToast = (): void => {
    setCounter((prev) => prev + 1)
    toast('Custom Icon Toast', {
      description: `This toast has a custom icon. Count: ${counter + 1}`,
      icon: <Star className='h-4 w-4 text-yellow-500' />,
    })
  }

  const showRichContentToast = (): void => {
    toast(
      <div className='flex items-center space-x-3'>
        <Heart className='h-5 w-5 text-red-500' />
        <div>
          <div className='font-medium'>Rich Content Toast</div>
          <div className='text-muted-foreground text-sm'>This toast contains rich HTML content with custom styling.</div>
        </div>
      </div>,
      {
        duration: 5000,
      }
    )
  }

  const showPersistentToast = (): void => {
    toast('Persistent Toast', {
      description: 'This toast will stay until manually dismissed.',
      duration: Infinity,
      action: {
        label: 'Dismiss',
        onClick: () => {},
      },
    })
  }

  const showPositionToasts = (): void => {
    const positions = ['top-left', 'top-center', 'top-right', 'bottom-left', 'bottom-center', 'bottom-right'] as const

    positions.forEach((position, index) => {
      setTimeout(() => {
        toast(`Toast at ${position}`, {
          description: `This toast appears at ${position}`,
          position,
          duration: 2000,
        })
      }, index * 200)
    })
  }

  return (
    <div className='bg-background min-h-screen py-8'>
      <div className='container mx-auto max-w-6xl px-6'>
        <div className='mb-8 text-center'>
          <h1 className='mb-4 text-4xl font-bold'>Sonner Toast Testing</h1>
          <p className='text-muted-foreground text-lg'>Test all variants and features of the Sonner notification system</p>
        </div>

        <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
          {/* Basic Variants */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center space-x-2'>
                <Bell className='h-5 w-5' />
                <span>Basic Variants</span>
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-3'>
              <Button className='w-full' onClick={showBasicToast} variant='outline'>
                Basic Toast
              </Button>

              <Button className='bg-success text-success-foreground hover:bg-success w-full' onClick={showSuccessToast}>
                <CheckCircle className='mr-2 h-4 w-4' />
                Success Toast
              </Button>

              <Button className='bg-destructive text-destructive-foreground hover:bg-destructive w-full' onClick={showErrorToast}>
                <XCircle className='mr-2 h-4 w-4' />
                Error Toast
              </Button>

              <Button className='bg-info text-info-foreground hover:bg-info/80 w-full' onClick={showInfoToast}>
                <Info className='mr-2 h-4 w-4' />
                Info Toast
              </Button>

              <Button className='bg-warning text-warning-foreground hover:bg-warning w-full' onClick={showWarningToast}>
                <AlertTriangle className='mr-2 h-4 w-4' />
                Warning Toast
              </Button>
            </CardContent>
          </Card>

          {/* Interactive Variants */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center space-x-2'>
                <Zap className='h-5 w-5' />
                <span>Interactive Features</span>
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-3'>
              <Button className='w-full' onClick={showLoadingToast} variant='outline'>
                Loading Toast
              </Button>

              <Button className='w-full' onClick={showPromiseToast} variant='outline'>
                Promise Toast
              </Button>

              <Button className='w-full' onClick={showActionToast} variant='outline'>
                Action Toast
              </Button>

              <Button className='w-full' onClick={showCancelToast} variant='outline'>
                Cancel Toast
              </Button>

              <Button className='w-full' onClick={showPersistentToast} variant='outline'>
                Persistent Toast
              </Button>
            </CardContent>
          </Card>

          {/* Custom Variants */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center space-x-2'>
                <Star className='h-5 w-5' />
                <span>Custom Features</span>
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-3'>
              <Button className='w-full' onClick={showCustomIconToast} variant='outline'>
                Custom Icon Toast
                <Badge className='ml-2' variant='secondary'>
                  {counter}
                </Badge>
              </Button>

              <Button className='w-full' onClick={showRichContentToast} variant='outline'>
                Rich Content Toast
              </Button>

              <Button className='w-full' onClick={showPositionToasts} variant='outline'>
                All Position Toasts
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className='mt-8'>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='flex flex-wrap gap-3'>
              <Button onClick={() => toast.dismiss()} size='sm' variant='destructive'>
                Dismiss All Toasts
              </Button>

              <Button
                onClick={() => {
                  for (let i = 0; i < 5; i++) {
                    setTimeout(() => {
                      toast(`Batch toast ${i + 1}`, {
                        description: `This is batch toast number ${i + 1}`,
                      })
                    }, i * 100)
                  }
                }}
                size='sm'
                variant='outline'
              >
                Show 5 Toasts
              </Button>

              <Button
                onClick={() => {
                  toast.success('Theme Test', { description: 'Success color test' })
                  setTimeout(() => toast.error('Theme Test', { description: 'Error color test' }), 500)
                  setTimeout(() => toast.info('Theme Test', { description: 'Info color test' }), 1000)
                  setTimeout(() => toast.warning('Theme Test', { description: 'Warning color test' }), 1500)
                }}
                size='sm'
                variant='outline'
              >
                Color Theme Test
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Usage Examples */}
        <Card className='mt-8'>
          <CardHeader>
            <CardTitle>Usage Examples</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-4 text-sm'>
              <div>
                <Badge className='mb-2'>Basic</Badge>
                <pre className='bg-muted overflow-x-auto rounded p-2 text-xs'>{`toast('Message', { description: 'Description' })`}</pre>
              </div>

              <div>
                <Badge className='mb-2'>Success</Badge>
                <pre className='bg-muted overflow-x-auto rounded p-2 text-xs'>
                  {`toast.success('Success!', { description: 'Action completed' })`}
                </pre>
              </div>

              <div>
                <Badge className='mb-2'>With Action</Badge>
                <pre className='bg-muted overflow-x-auto rounded p-2 text-xs'>
                  {`toast('Message', {
  action: { label: 'Action', onClick: () => {} }
})`}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default SonnerTestPage
