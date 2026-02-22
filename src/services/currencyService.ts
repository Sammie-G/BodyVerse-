import axios from 'axios';

interface ExchangeRates {
  [currency: string]: number;
}

interface LocationData {
  country_code: string;
  currency: string;
}

const IPSTACK_API_KEY = import.meta.env.VITE_IPSTACK_API_KEY;

class CurrencyService {
  private exchangeRates: ExchangeRates | null = null;
  private lastFetchTime: number = 0;
  private cacheDuration = 3600000;

  readonly supportedCurrencies = {
    NGN: '₦',
    USD: '$',
    GBP: '£',
    EUR: '€',
    ZAR: 'R',
    KES: 'KSh',
    GHS: 'GH₵',
  };

  readonly regionalPricing = {
    NGN: { monthly: 6.99, quarterly: 18.99, yearly: 59.99 },
    USD: { monthly: 12.99, quarterly: 34.99, yearly: 129.99 },
    GBP: { monthly: 9.99, quarterly: 26.99, yearly: 99.99 },
    EUR: { monthly: 11.99, quarterly: 31.99, yearly: 119.99 },
    ZAR: { monthly: 6.99, quarterly: 18.99, yearly: 59.99 },
    KES: { monthly: 6.99, quarterly: 18.99, yearly: 59.99 },
    GHS: { monthly: 6.99, quarterly: 18.99, yearly: 59.99 },
  };

  async getUserLocation(): Promise<LocationData> {
    try {
      if (IPSTACK_API_KEY) {
        const response = await axios.get(
          `http://api.ipstack.com/check?access_key=${IPSTACK_API_KEY}`
        );
        return {
          country_code: response.data.country_code,
          currency: response.data.currency?.code || 'USD',
        };
      }
      return { country_code: 'US', currency: 'USD' };
    } catch (error) {
      console.error('Error fetching location:', error);
      return { country_code: 'US', currency: 'USD' };
    }
  }

  async getExchangeRates(): Promise<ExchangeRates> {
    const now = Date.now();

    if (this.exchangeRates && now - this.lastFetchTime < this.cacheDuration) {
      return this.exchangeRates;
    }

    try {
      const response = await axios.get(
        'https://api.exchangerate-api.com/v4/latest/USD'
      );
      const rates: ExchangeRates = response.data.rates;
      this.exchangeRates = rates;
      this.lastFetchTime = now;
      return rates;
    } catch (error) {
      console.error('Error fetching exchange rates:', error);
      if (this.exchangeRates) {
        return this.exchangeRates;
      }
      return {};
    }
  }

  async convertCurrency(
    amount: number,
    fromCurrency: string,
    toCurrency: string
  ): Promise<number> {
    if (fromCurrency === toCurrency) return amount;

    const rates = await this.getExchangeRates();

    if (!rates[fromCurrency] || !rates[toCurrency]) {
      return amount;
    }

    const amountInUSD = amount / rates[fromCurrency];
    return amountInUSD * rates[toCurrency];
  }

  getPricingForCurrency(currency: string): { monthly: number; quarterly: number; yearly: number } {
    const africaEmergingMarkets = ['NGN', 'ZAR', 'KES', 'GHS', 'TZS', 'UGX'];

    if (africaEmergingMarkets.includes(currency)) {
      return this.regionalPricing.NGN;
    }

    if (currency in this.regionalPricing) {
      return this.regionalPricing[currency as keyof typeof this.regionalPricing];
    }

    return this.regionalPricing.USD;
  }

  getCurrencySymbol(currency: string): string {
    return this.supportedCurrencies[currency as keyof typeof this.supportedCurrencies] || currency;
  }

  formatPrice(amount: number, currency: string): string {
    const symbol = this.getCurrencySymbol(currency);
    return `${symbol}${amount.toFixed(2)}`;
  }
}

export const currencyService = new CurrencyService();
