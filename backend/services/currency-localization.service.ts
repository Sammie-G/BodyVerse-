import axios from 'axios';
import NodeCache from 'node-cache';

class CurrencyLocalizationService {
    constructor() {
        this.cache = new NodeCache({ stdTTL: 3600 });
        this.exchangeRateAPI = 'https://api.exchangerate-api.com/v4/latest';
        this.supportedCurrencies = ['NGN', 'USD', 'GBP', 'EUR', 'ZAR', 'KES', 'GHS'];
    }

    async getUserCountry(req) {
        const geoIpServiceUrl = 'http://api.ipapi.com/api/check?access_key=YOUR_ACCESS_KEY';
        const response = await axios.get(geoIpServiceUrl);
        return response.data.country_code;
    }

    async getExchangeRate(baseCurrency) {
        const cachedRate = this.cache.get(baseCurrency);
        if (cachedRate) {
            return cachedRate;
        }

        const response = await axios.get(`${this.exchangeRateAPI}/${baseCurrency}`);
        const rates = response.data.rates;
        this.cache.set(baseCurrency, rates);
        return rates;
    }

    async convertCurrency(amount, fromCurrency, toCurrency) {
        const exchangeRates = await this.getExchangeRate(fromCurrency);
        const rate = exchangeRates[toCurrency];
        return amount * rate;
    }

    async detectPricingTier(UserRegion) {
        // Implement your pricing logic based on region
        // Example: return tier based on localized pricing rules
        return 'standard'; // simple example
    }

    async getMultiCurrencySupport() {
        return this.supportedCurrencies;
    }
}

export default CurrencyLocalizationService;
