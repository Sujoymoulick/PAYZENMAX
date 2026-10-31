/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,astro}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: '#F6F6F3',
        card: '#FFFFFF',
        textPrimary: '#17181A',
        textMuted: '#5E6168',
        textSubdued: '#3B3E44',
        borderMuted: '#E4E3DE',
        borderStrong: '#DAD9D3',
        brand: {
          green: '#1B5E3B',
          greenHover: '#123F28',
          sage: '#7FB396',
          blue: '#2E5AAC',
          amber: '#A14A0B',
          pillGreenBg: '#E7F0EA',
          pillGreenFg: '#1B5E3B',
          pillAmberBg: '#FBEEE3',
          pillAmberFg: '#A14A0B',
          pillYellowBg: '#FDF4DC',
          pillYellowFg: '#7A5300',
          pillGrayBg: '#EEEEEA',
          pillGrayFg: '#4A4D53'
        }
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace']
      }
    },
  },
  plugins: [],
}
