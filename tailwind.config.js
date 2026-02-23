export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        black: '#000000',
        card: '#0d0d0d',
        cardAlt: '#1a1a1a',
        gold: '#D4A843',
        success: '#30D158',
      },
      borderRadius: {
        sm12: '12px',
        card: '18px',
        modal: '24px',
      },
    },
  },
  plugins: [],
};
