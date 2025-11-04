/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        system: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
    },
  },
  plugins: [
    function({ addUtilities }) {
      addUtilities({
        '.glass-button': {
          'background-color': 'rgba(255, 255, 255, 0.8)',
          'backdrop-filter': 'blur(10px)',
          'border': '1px solid rgba(255, 255, 255, 0.2)',
          'box-shadow': '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          'transition': 'all 0.2s ease-in-out',
        },
        '.glass-button:hover': {
          'background-color': 'rgba(255, 255, 255, 0.9)',
          'transform': 'translateY(-1px)',
        },
      });
    },
  ],
};
