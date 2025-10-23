import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Matte Black Theme
        'matte-black': '#0A0A0A',
        'dark-gray': '#121212',
        'light-gray': '#1a1a1a',
        'accent-blue': '#3b82f6',
        'accent-blue-dark': '#2563eb',
        
        // Status Colors
        'success-green': '#10b981',
        'warning-yellow': '#f59e0b',
        'danger-red': '#ef4444',
        
        // Text Colors
        'text-primary': '#ffffff',
        'text-secondary': '#d1d5db',
        'text-muted': '#9ca3af',
        'text-disabled': '#6b7280',
        
        // Border Colors
        'border-primary': '#374151',
        'border-secondary': '#4b5563',
        'border-accent': '#3b82f6',
        
        // Background variants
        'bg-primary': '#0A0A0A',
        'bg-secondary': '#121212',
        'bg-tertiary': '#1a1a1a',
        'bg-hover': '#262626',
        'bg-active': '#2a2a2a',
        
        // Risk Score Colors
        'risk-low': '#10b981',
        'risk-medium': '#f59e0b', 
        'risk-high': '#ef4444',
        
        // Credibility Colors
        'credibility-high': '#10b981',
        'credibility-medium': '#f59e0b',
        'credibility-low': '#ef4444',
      },
      
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
      
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
      },
      
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      
      boxShadow: {
        'glow': '0 0 20px rgba(59, 130, 246, 0.3)',
        'glow-green': '0 0 20px rgba(16, 185, 129, 0.3)',
        'glow-red': '0 0 20px rgba(239, 68, 68, 0.3)',
        'inner-glow': 'inset 0 0 10px rgba(59, 130, 246, 0.2)',
      },
      
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 2s infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(59, 130, 246, 0.2)' },
          '100%': { boxShadow: '0 0 20px rgba(59, 130, 246, 0.6)' },
        },
      },
      
      screens: {
        'xs': '475px',
        '3xl': '1600px',
      },
      
      backdropBlur: {
        'xs': '2px',
      },
      
      transitionProperty: {
        'height': 'height',
        'spacing': 'margin, padding',
      },
    },
  },
  plugins: [
    // Custom plugin for component utilities
    function({ addUtilities, theme }: any) {
      const newUtilities = {
        // Glass morphism effect
        '.glass': {
          background: 'rgba(26, 26, 26, 0.8)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        },
        
        // Gradient backgrounds
        '.bg-gradient-dark': {
          background: 'linear-gradient(135deg, #0A0A0A 0%, #121212 100%)',
        },
        
        '.bg-gradient-blue': {
          background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
        },
        
        // Text gradients
        '.text-gradient-blue': {
          background: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)',
          '-webkit-background-clip': 'text',
          '-webkit-text-fill-color': 'transparent',
          'background-clip': 'text',
        },
        
        // Custom scrollbar
        '.scrollbar-thin': {
          '&::-webkit-scrollbar': {
            width: '6px',
          },
          '&::-webkit-scrollbar-track': {
            background: theme('colors.dark-gray'),
          },
          '&::-webkit-scrollbar-thumb': {
            background: theme('colors.light-gray'),
            borderRadius: '3px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: theme('colors.bg-hover'),
          },
        },
        
        // Focus styles
        '.focus-ring': {
          '&:focus': {
            outline: 'none',
            boxShadow: `0 0 0 2px ${theme('colors.accent-blue')}`,
          },
        },
        
        // Button variants
        '.btn-primary': {
          backgroundColor: theme('colors.accent-blue'),
          color: theme('colors.text-primary'),
          padding: `${theme('spacing.2')} ${theme('spacing.4')}`,
          borderRadius: theme('borderRadius.lg'),
          fontWeight: theme('fontWeight.medium'),
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            backgroundColor: theme('colors.accent-blue-dark'),
            transform: 'translateY(-1px)',
          },
          '&:active': {
            transform: 'translateY(0)',
          },
          '&:disabled': {
            opacity: '0.5',
            cursor: 'not-allowed',
            '&:hover': {
              backgroundColor: theme('colors.accent-blue'),
              transform: 'none',
            },
          },
        },
        
        '.btn-secondary': {
          backgroundColor: theme('colors.bg-tertiary'),
          color: theme('colors.text-secondary'),
          border: `1px solid ${theme('colors.border-primary')}`,
          padding: `${theme('spacing.2')} ${theme('spacing.4')}`,
          borderRadius: theme('borderRadius.lg'),
          fontWeight: theme('fontWeight.medium'),
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            backgroundColor: theme('colors.bg-hover'),
            borderColor: theme('colors.border-secondary'),
            color: theme('colors.text-primary'),
          },
        },
        
        // Card styles
        '.card': {
          backgroundColor: theme('colors.bg-secondary'),
          border: `1px solid ${theme('colors.border-primary')}`,
          borderRadius: theme('borderRadius.xl'),
          padding: theme('spacing.6'),
        },
        
        '.card-hover': {
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            backgroundColor: theme('colors.bg-tertiary'),
            borderColor: theme('colors.border-secondary'),
            transform: 'translateY(-2px)',
          },
        },
      };
      
      addUtilities(newUtilities);
    },
  ],
};

export default config;