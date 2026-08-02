/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        vault: {
          base: '#0D1117',
          surface: '#161B22',
          border: '#30363D',
          lime: '#22C55E',
          'lime-soft': '#4ADE80',
          purple: '#A855F7',
          'purple-soft': '#C084FC',
          orange: '#F97316',
          'orange-soft': '#FB923C',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 42px rgba(168, 85, 247, 0.18)',
        lime: '0 0 24px rgba(34, 197, 94, 0.18)',
        orange: '0 0 24px rgba(249, 115, 22, 0.22)',
      },
      backgroundImage: {
        'vault-radial':
          'radial-gradient(circle at top left, rgba(168,85,247,0.18), transparent 30%), radial-gradient(circle at top right, rgba(34,197,94,0.12), transparent 28%), linear-gradient(135deg, #0D1117 0%, #101620 50%, #0D1117 100%)',
      },
    },
  },
  plugins: [],
};
