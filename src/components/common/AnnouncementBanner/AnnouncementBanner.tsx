'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, AlertTriangle, Info, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { type SiteBanner } from '@/lib/contentful/client'
import { getLogger } from '@/lib/logger/logger'

interface AnnouncementBannerProps {
  currentPage?: string
}

const BannerContent = ({
  banner,
  textColor,
  iconColor,
  Icon,
}: {
  banner: SiteBanner & { id: string }
  textColor: string
  iconColor: string
  Icon: React.ComponentType<{ className?: string }>
}): React.ReactElement => (
  <div className='flex min-w-0 flex-1 items-center gap-3'>
    <Icon className={`h-5 w-5 shrink-0 ${iconColor}`} />
    <div className='min-w-0 flex-1'>
      {banner.title && <span className={`mr-2 text-sm font-semibold ${textColor}`}>{banner.title}</span>}
      {banner.message && <span className={`text-sm ${textColor} opacity-90`}>{banner.message}</span>}
    </div>
  </div>
)

const AnnouncementBanner = ({ currentPage = 'all' }: AnnouncementBannerProps): React.ReactElement | null => {
  const [banner, setBanner] = useState<SiteBanner | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const logger = useMemo(() => getLogger({ context: 'AnnouncementBanner', function: 'fetchBanner' }), [])

  useEffect(() => {
    const fetchBanner = async (): Promise<void> => {
      try {
        const response = await fetch('/api/site-banner')
        const data = await response.json()

        // Handle the new unified API response format
        if (data.status === 'success' && data.data?.banner) {
          const bannerData = data.data.banner

          if (bannerData && bannerData.isActive) {
            const shouldShow =
              bannerData.showOnPages.includes('all') ||
              bannerData.showOnPages.includes(currentPage) ||
              bannerData.showOnPages.some((page: string) => currentPage.startsWith(page))

            const dismissedBanners = JSON.parse(localStorage.getItem('dismissedBanners') || '{}')
            const bannerId = `${bannerData.title}-${bannerData.message || 'default'}`

            // Check if banner was dismissed and if dismissal has expired (24 hours)
            const dismissedInfo = dismissedBanners[bannerId]
            const isDismissed = dismissedInfo && Date.now() - dismissedInfo.timestamp < 24 * 60 * 60 * 1000

            if (shouldShow && !isDismissed) {
              setBanner({ ...bannerData, id: bannerId } as SiteBanner & { id: string })
              setIsVisible(true)
            }
          }
        } else if (data.status === 'error') {
          logger.error('API returned error:', data.error_message, { errorCode: data.error_code })
        }
      } catch (error) {
        logger.error('Error fetching banner:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchBanner()
  }, [currentPage, logger])

  const handleDismiss = (): void => {
    if (!banner || !('id' in banner)) return

    const dismissedBanners = JSON.parse(localStorage.getItem('dismissedBanners') || '{}')
    dismissedBanners[(banner as SiteBanner & { id: string }).id] = {
      timestamp: Date.now(),
      type: banner.type,
    }
    localStorage.setItem('dismissedBanners', JSON.stringify(dismissedBanners))

    setIsVisible(false)
  }

  const getIconAndColors = (
    type: SiteBanner['type']
  ): {
    icon: React.ComponentType<{ className?: string }>
    bgColor: string
    textColor: string
    iconColor: string
  } => {
    switch (type) {
      case 'warning':
        return {
          icon: AlertTriangle,
          bgColor: 'bg-amber-500/10 border-amber-500/20',
          textColor: 'text-amber-700 dark:text-amber-300',
          iconColor: 'text-amber-600 dark:text-amber-400',
        }
      case 'maintenance':
        return {
          icon: Settings,
          bgColor: 'bg-red-500/10 border-red-500/20',
          textColor: 'text-red-700 dark:text-red-300',
          iconColor: 'text-red-600 dark:text-red-400',
        }
      case 'info':
      default:
        return {
          icon: Info,
          bgColor: 'bg-blue-500/10 border-blue-500/20',
          textColor: 'text-blue-700 dark:text-blue-300',
          iconColor: 'text-blue-600 dark:text-blue-400',
        }
    }
  }

  if (isLoading || !banner || !isVisible) {
    return null
  }

  const { icon: Icon, bgColor, textColor, iconColor } = getIconAndColors(banner.type)

  return (
    <AnimatePresence>
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className={`fixed top-18 right-0 left-0 z-50 border-y backdrop-blur-xl ${bgColor}`}
        exit={{ opacity: 0, y: -100 }}
        initial={{ opacity: 0, y: -100 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        <div className='container mx-auto px-4 py-3'>
          <div className='flex items-center justify-between gap-4'>
            <BannerContent Icon={Icon} banner={banner as SiteBanner & { id: string }} iconColor={iconColor} textColor={textColor} />
            <Button className={`h-8 w-8 p-0 hover:bg-black/10 dark:hover:bg-white/10 ${textColor}`} onClick={handleDismiss} variant='ghost'>
              <X className='h-4 w-4' />
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

export default AnnouncementBanner
