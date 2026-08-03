/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        tv: {
          bg: '#0d1117',
          card: '#161b22',
          surface: '#1c2128',
          hover: '#21262d',
          border: '#30363d',
          muted: '#8b949e',
          text: '#c9d1d9',
          heading: '#f0f6fc',
          green: '#089981',
          'green-light': 'rgba(8, 153, 129, 0.15)',
          red: '#f23645',
          'red-light': 'rgba(242, 54, 69, 0.15)',
          blue: '#2962ff',
          purple: '#ab47bc',
          cyan: '#00e5ff',
          gold: '#ffd700',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
};
