/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#087F72',
          primary: '#087F72',
          hover: '#06665C',
          light: '#E6F5F1',
          accent: '#10B981',
          accentLight: '#ECFDF5',
          subtleGreen: '#F0FDF9',
        },
        navy: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#111827', // Midnight Slate primary text
          950: '#0B1220', // Midnight Navy footer background
        },
        // Remapped teal to our sophisticated Emerald design tokens
        teal: {
          50: '#F0FDF9',   // Subtle green background
          100: '#E6F5F1',  // Primary light
          200: '#A7F3D0',
          300: '#6EE7B7',
          400: '#34D399',
          500: '#10B981',  // Accent
          600: '#087F72',  // Primary Brand
          700: '#06665C',  // Primary Hover
          800: '#044D46',
          900: '#033833',
          950: '#01221F',
        },
        slate: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
          main: '#F5F7FA',       // Main background
          secondary: '#F8FAFC',  // Secondary background
          card: '#FFFFFF',       // Card background
          footer: '#0B1220',     // Footer background
        },
        semantic: {
          critical: '#DC2626',
          criticalBg: '#FEF2F2',
          criticalBorder: '#FECACA',
          high: '#EA580C',
          highBg: '#FFF7ED',
          highBorder: '#FED7AA',
          medium: '#D97706',
          mediumBg: '#FFFBEB',
          mediumBorder: '#FDE68A',
          low: '#16A34A',
          lowBg: '#F0FDF4',
          lowBorder: '#BBF7D0',
          info: '#2563EB',
          infoBg: '#EFF6FF',
          infoBorder: '#BFDBFE',
          resolved: '#15803D',
          resolvedBg: '#F0FDF4',
          resolvedBorder: '#BBF7D0',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.04)',
        'elevated': '0 4px 6px -1px rgba(0, 0, 0, 0.06), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
      }
    },
  },
  plugins: [],
}
