export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          blue: '#4A90E2',
          purple: '#9B59B6',
          gold: '#F39C12',
        },
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #4A90E2 0%, #9B59B6 50%, #F39C12 100%)',
      },
    },
  },
  plugins: [],
};
