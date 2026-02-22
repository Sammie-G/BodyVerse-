import React, { useState, useEffect } from 'react';

interface PricingCardProps {
  price: number; // Base price in USD
  currency: string; // Currency code, e.g., "EUR", "GBP"
}

const PricingCard: React.FC<PricingCardProps> = ({ price, currency }) => {
  const [convertedPrice, setConvertedPrice] = useState<number | null>(null);
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);

  useEffect(() => {
    const fetchExchangeRate = async () => {
      try {
        const response = await fetch(`https://api.exchangerate-api.com/v4/latest/USD`);
        const data = await response.json();
        const rate = data.rates[currency];
        setExchangeRate(rate);
        setConvertedPrice(rate ? price * rate : null);
      } catch (error) {
        console.error('Error fetching exchange rate:', error);
      }
    };

    fetchExchangeRate();
  }, [price, currency]);

  return (
    <div className="pricing-card">
      <h2>Pricing</h2>
      <p>Base Price: ${price.toFixed(2)} USD</p>
      {exchangeRate ? (
        <p>
          Convert Price: {convertedPrice?.toFixed(2)} {currency} (Exchange Rate: {exchangeRate})
        </p>
      ) : (
        <p>Loading conversion rate...</p>
      )}
    </div>
  );
};

export default PricingCard;