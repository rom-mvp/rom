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
    fontSize: {
      xs: ['0.75rem', { lineHeight: '1rem' }],  // For tiny text
      sm: ['0.875rem', { lineHeight: '1.25rem' }],
    },
  },
},
 plugins: [
  function({ addUtilities }) {
    addUtilities({
      '.user-friendly-button': {
        'background-color': 'rgba(255, 255, 255, 0.8)',
        'backdrop-filter': 'blur(10px)',
        'border': '1px solid rgba(255, 255, 255, 0.2)',
        'box-shadow': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'transition': 'all 0.2s ease-in-out',
        'border-radius': '12px',  // Softer iOS round
        'font-weight': '600',
        'font-size': '1rem',
        'padding': '12px 16px',
      },
      '.user-friendly-button:hover': {
        'background-color': 'rgba(255, 255, 255, 0.9)',
        'transform': 'translateY(-1px)',
      },
    });
  },
],,
};
