import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Sparkles } from 'lucide-react';
import { currencyService } from '@/services/currencyService';
import { useAuth } from '@/contexts/AuthContext';

interface PricingPlan {
  monthly: number;
  quarterly: number;
  yearly: number;
}

const Pricing: React.FC = () => {
  const [currency, setCurrency] = useState('USD');
  const [pricing, setPricing] = useState<PricingPlan>({ monthly: 12.99, quarterly: 34.99, yearly: 129.99 });
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'quarterly' | 'yearly'>('yearly');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const loadPricing = async () => {
      try {
        const location = await currencyService.getUserLocation();
        const userCurrency = location.currency || 'USD';
        setCurrency(userCurrency);
        const prices = currencyService.getPricingForCurrency(userCurrency);
        setPricing(prices);
      } catch (error) {
        console.error('Error loading pricing:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPricing();
  }, []);

  const handleSubscribe = () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    navigate('/payment', { state: { plan: selectedPlan, currency, amount: pricing[selectedPlan] } });
  };

  const features = {
    free: [
      'Basic workout tracking',
      'Manual meal logging',
      'Progress photos',
      'Community access',
    ],
    premium: [
      'AI-generated workout plans',
      'Personalized meal plans',
      'AI food scanner',
      'Advanced analytics & insights',
      'Progress tracking with trends',
      'Gamification & achievements',
      'Leaderboards & challenges',
      'AI coaching & recommendations',
      'Video exercise demonstrations',
      'Priority support',
    ],
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-blue border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading pricing...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-brand bg-clip-text text-transparent">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600">
            Transform your fitness journey with BodyVerse
          </p>
        </div>

        <div className="flex justify-center mb-8">
          <div className="inline-flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setSelectedPlan('monthly')}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                selectedPlan === 'monthly'
                  ? 'bg-white text-primary-blue shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setSelectedPlan('quarterly')}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                selectedPlan === 'quarterly'
                  ? 'bg-white text-primary-blue shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Quarterly
            </button>
            <button
              onClick={() => setSelectedPlan('yearly')}
              className={`px-6 py-2 rounded-lg font-medium transition-all relative ${
                selectedPlan === 'yearly'
                  ? 'bg-white text-primary-blue shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Yearly
              <span className="absolute -top-2 -right-2 bg-gradient-brand text-white text-xs px-2 py-0.5 rounded-full">
                Best Value
              </span>
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className="border-2 border-gray-200 rounded-2xl p-8 bg-white hover:shadow-lg transition-shadow">
            <h3 className="text-2xl font-bold mb-2">Free</h3>
            <div className="mb-6">
              <span className="text-4xl font-bold">
                {currencyService.getCurrencySymbol(currency)}0
              </span>
              <span className="text-gray-600 ml-2">forever</span>
            </div>

            <ul className="space-y-4 mb-8">
              {features.free.map((feature, index) => (
                <li key={index} className="flex items-start">
                  <Check className="w-5 h-5 text-primary-blue mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => user ? navigate('/dashboard') : navigate('/auth')}
              className="w-full py-3 border-2 border-gray-300 rounded-lg font-semibold hover:border-gray-400 transition-colors"
            >
              Get Started Free
            </button>
          </div>

          <div className="border-2 border-primary-blue rounded-2xl p-8 bg-gradient-to-br from-blue-50 to-purple-50 relative overflow-hidden hover:shadow-xl transition-shadow">
            <div className="absolute top-4 right-4">
              <Sparkles className="w-8 h-8 text-primary-gold" />
            </div>

            <h3 className="text-2xl font-bold mb-2 bg-gradient-brand bg-clip-text text-transparent">
              Premium
            </h3>
            <div className="mb-6">
              <span className="text-4xl font-bold">
                {currencyService.formatPrice(pricing[selectedPlan], currency)}
              </span>
              <span className="text-gray-600 ml-2">
                {selectedPlan === 'monthly' && '/month'}
                {selectedPlan === 'quarterly' && '/3 months'}
                {selectedPlan === 'yearly' && '/year'}
              </span>
              {selectedPlan !== 'monthly' && (
                <div className="text-sm text-gray-600 mt-1">
                  {currencyService.formatPrice(
                    selectedPlan === 'quarterly' ? pricing.quarterly / 3 : pricing.yearly / 12,
                    currency
                  )}/month
                </div>
              )}
            </div>

            <ul className="space-y-4 mb-8">
              {features.premium.map((feature, index) => (
                <li key={index} className="flex items-start">
                  <Check className="w-5 h-5 text-primary-purple mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={handleSubscribe}
              className="w-full py-3 bg-gradient-brand text-white rounded-lg font-semibold hover:opacity-90 transition-opacity"
            >
              Upgrade to Premium
            </button>
          </div>
        </div>

        <div className="mt-12 text-center text-sm text-gray-600">
          <p>Prices shown in {currency}. Secure payment powered by Flutterwave.</p>
          <p className="mt-2">Cancel anytime. No hidden fees.</p>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
