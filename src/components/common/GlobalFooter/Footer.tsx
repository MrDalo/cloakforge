'use client'

import { FooterBottom } from './FooterBottom'
import { FooterBrand } from './FooterBrand'
import { FooterLinks } from './FooterLinks'

export const GlobalFooter = (): React.ReactNode => (
  <footer className='bg-card border-border border-t px-6 py-16'>
    <div className='container mx-auto max-w-7xl'>
      <div className='mb-12 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4'>
        {/* Brand Column */}
        <div className='lg:col-span-1'>
          <FooterBrand />
        </div>

        {/* Links Columns */}
        <FooterLinks />
      </div>

      {/* Bottom Section */}
      <FooterBottom />
    </div>
  </footer>
)
