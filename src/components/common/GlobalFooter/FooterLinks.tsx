'use client'

import { motion } from 'framer-motion'
import { footerLinks, type FooterLink } from './footerData'

export const FooterLinks = (): React.ReactNode => (
  <>
    {Object.entries(footerLinks).map(([category, links], index) => (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        key={category}
        transition={{ delay: index * 0.1, duration: 0.6 }}
        viewport={{ once: true }}
        whileInView={{ opacity: 1, y: 0 }}
      >
        <h3 className='text-foreground mb-4 capitalize'>{category}</h3>
        <ul className='space-y-3'>
          {links.map((link: FooterLink) => (
            <li key={link.name}>
              <a className='text-muted-foreground hover:text-primary transition-colors duration-300' href={link.href}>
                {link.name}
              </a>
            </li>
          ))}
        </ul>
      </motion.div>
    ))}
  </>
)
