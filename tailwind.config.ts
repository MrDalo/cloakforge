import type { Config } from 'tailwindcss'
import animate from 'tailwindcss-animate'
import plugin from 'tailwindcss/plugin'

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/globals.css',
    './src/styles/utilities.css',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--color-background)',
        foreground: 'var(--color-foreground)',
        card: {
          DEFAULT: 'var(--color-card)',
          foreground: 'var(--color-card-foreground)',
        },
        popover: {
          DEFAULT: 'var(--color-popover)',
          foreground: 'var(--color-popover-foreground)',
        },
        primary: {
          DEFAULT: 'var(--color-primary)',
          foreground: 'var(--color-primary-foreground)',
          hover: 'var(--color-primary-hover)',
          active: 'var(--color-primary-active)',
        },
        secondary: {
          DEFAULT: 'var(--color-secondary)',
          foreground: 'var(--color-secondary-foreground)',
        },
        muted: {
          DEFAULT: 'var(--color-muted)',
          foreground: 'var(--color-muted-foreground)',
        },
        accent: {
          DEFAULT: 'var(--color-accent)',
          foreground: 'var(--color-accent-foreground)',
        },
        destructive: {
          DEFAULT: 'var(--color-destructive)',
          foreground: 'var(--color-destructive-foreground)',
        },
        success: {
          DEFAULT: 'var(--color-success)',
          foreground: 'var(--color-success-foreground)',
        },
        info: {
          DEFAULT: 'var(--color-info)',
          foreground: 'var(--color-info-foreground)',
        },
        warning: {
          DEFAULT: 'var(--color-warning)',
          foreground: 'var(--color-warning-foreground)',
        },
        highlight: 'var(--color-highlight)',
        border: 'var(--color-border)',
        input: {
          DEFAULT: 'var(--color-input)',
          background: 'var(--color-input-background)',
        },
        switch: {
          background: 'var(--color-switch-background)',
        },
        ring: 'var(--color-ring)',
        chart: {
          1: 'var(--color-chart-1)',
          2: 'var(--color-chart-2)',
          3: 'var(--color-chart-3)',
          4: 'var(--color-chart-4)',
          5: 'var(--color-chart-5)',
        },
        sidebar: {
          DEFAULT: 'var(--color-sidebar)',
          foreground: 'var(--color-sidebar-foreground)',
          primary: 'var(--color-sidebar-primary)',
          'primary-foreground': 'var(--color-sidebar-primary-foreground)',
          accent: 'var(--color-sidebar-accent)',
          'accent-foreground': 'var(--color-sidebar-accent-foreground)',
          border: 'var(--color-sidebar-border)',
          ring: 'var(--color-sidebar-ring)',
        },
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        // Custom animations from globals.css
        float: {
          '0%, 100%': {
            transform: 'translateY(0px)',
          },
          '50%': {
            transform: 'translateY(-10px)',
          },
        },
        'pulse-glow': {
          '0%, 100%': {
            boxShadow: '0 0 20px rgba(99, 102, 241, 0.3)',
          },
          '50%': {
            boxShadow: '0 0 30px rgba(99, 102, 241, 0.6)',
          },
        },
        'shield-pulse': {
          '0%, 100%': {
            transform: 'scale(1)',
            boxShadow: '0 0 0 0 rgba(34, 197, 94, 0.4)',
          },
          '50%': {
            transform: 'scale(1.05)',
            boxShadow: '0 0 0 10px rgba(34, 197, 94, 0)',
          },
        },
        'lock-shake': {
          '0%, 100%': {
            transform: 'translateX(0)',
          },
          '25%': {
            transform: 'translateX(-2px)',
          },
          '75%': {
            transform: 'translateX(2px)',
          },
        },
        'privacy-glow': {
          '0%, 100%': {
            boxShadow: '0 0 10px rgba(34, 197, 94, 0.1)',
            borderColor: 'rgba(34, 197, 94, 0.3)',
          },
          '50%': {
            boxShadow: '0 0 10px rgba(34, 197, 94, 0.1)',
            borderColor: 'rgba(34, 197, 94, 0.4)',
          },
        },
        'encrypted-text': {
          '0%': {
            opacity: '0.3',
            transform: 'skewX(0deg)',
          },
          '50%': {
            opacity: '1',
            transform: 'skewX(2deg)',
          },
          '100%': {
            opacity: '0.3',
            transform: 'skewX(0deg)',
          },
        },
        'blockchain-pulse': {
          '0%, 100%': {
            backgroundPosition: '0% 50%',
            opacity: '0.6',
          },
          '50%': {
            backgroundPosition: '100% 50%',
            opacity: '1',
          },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        // Custom animations from globals.css
        'float-animation': 'float 3s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'shield-pulse': 'shield-pulse 2s ease-in-out infinite',
        'lock-shake': 'lock-shake 0.5s ease-in-out',
        'privacy-glow': 'privacy-glow 3s ease-in-out infinite',
        'encrypted-text': 'encrypted-text 2s ease-in-out infinite',
        'blockchain-pulse': 'blockchain-pulse 4s ease-in-out infinite',
      },
    },
  },
  plugins: [
    animate,
    plugin(function ({ addUtilities }) {
      addUtilities({
        '.crypto-gradient': {
          background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)',
        },
        '.crypto-text-gradient': {
          background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)',
          '-webkit-background-clip': 'text',
          'background-clip': 'text',
          '-webkit-text-fill-color': 'transparent',
        },
        '.privacy-gradient': {
          background: 'linear-gradient(135deg, var(--color-secondary) 0%, var(--color-primary) 100%)',
        },
        '.privacy-text-gradient': {
          background: 'linear-gradient(135deg, var(--color-secondary) 0%, var(--color-primary) 100%)',
          '-webkit-background-clip': 'text',
          'background-clip': 'text',
          '-webkit-text-fill-color': 'transparent',
        },
        '.glass-effect': {
          background: 'rgba(255, 255, 255, 0.1)',
          'backdrop-filter': 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
        },
        '.encrypted-pattern': {
          'background-image': 'radial-gradient(circle at 1px 1px, rgba(99, 102, 241, 0.3) 1px, transparent 0)',
          'background-size': '20px 20px',
        },
        '.blockchain-pattern': {
          background: 'linear-gradient(45deg, transparent 40%, rgba(34, 197, 94, 0.1) 50%, transparent 60%)',
          'background-size': '30px 30px',
        },
        '.privacy-border': {
          border: '2px solid',
          'border-image': 'linear-gradient(45deg, var(--color-secondary), var(--color-primary)) 1',
        },
        '.security-mesh': {
          'background-image': `
						linear-gradient(45deg, rgba(99, 102, 241, 0.1) 25%, transparent 25%),
						linear-gradient(-45deg, rgba(99, 102, 241, 0.1) 25%, transparent 25%),
						linear-gradient(45deg, transparent 75%, rgba(34, 197, 94, 0.1) 75%),
						linear-gradient(-45deg, transparent 75%, rgba(34, 197, 94, 0.1) 75%)
					`,
          'background-size': '40px 40px',
          'background-position': '0 0, 0 20px, 20px -20px, -20px 0px',
        },
        '.default-box-shadow': {
          'box-shadow': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        },
      })
    }),
  ],
}

export default config
