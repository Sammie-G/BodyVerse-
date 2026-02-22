import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { ChevronRight, ChevronLeft } from 'lucide-react';

interface OnboardingData {
  age: number;
  height: number;
  weight: number;
  gender: string;
  fitness_goal: string;
  activity_level: string;
  workout_preference: string;
  dietary_preferences: string[];
  commitment_level: string;
}

const Onboarding: React.FC = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState<OnboardingData>({
    age: 25,
    height: 170,
    weight: 70,
    gender: '',
    fitness_goal: '',
    activity_level: '',
    workout_preference: '',
    dietary_preferences: [],
    commitment_level: '',
  });

  const calculateCalories = () => {
    const bmr = data.gender === 'male'
      ? 10 * data.weight + 6.25 * data.height - 5 * data.age + 5
      : 10 * data.weight + 6.25 * data.height - 5 * data.age - 161;

    const activityMultipliers: Record<string, number> = {
      sedentary: 1.2,
      lightly_active: 1.375,
      moderately_active: 1.55,
      very_active: 1.725,
      extremely_active: 1.9,
    };

    const tdee = bmr * (activityMultipliers[data.activity_level] || 1.2);

    if (data.fitness_goal === 'weight_loss') return Math.round(tdee - 500);
    if (data.fitness_goal === 'muscle_gain') return Math.round(tdee + 300);
    return Math.round(tdee);
  };

  const calculateMacros = (calories: number) => {
    if (data.fitness_goal === 'muscle_gain') {
      return {
        protein: Math.round((calories * 0.3) / 4),
        carbs: Math.round((calories * 0.45) / 4),
        fats: Math.round((calories * 0.25) / 9),
      };
    } else if (data.fitness_goal === 'weight_loss') {
      return {
        protein: Math.round((calories * 0.35) / 4),
        carbs: Math.round((calories * 0.35) / 4),
        fats: Math.round((calories * 0.3) / 9),
      };
    }
    return {
      protein: Math.round((calories * 0.3) / 4),
      carbs: Math.round((calories * 0.4) / 4),
      fats: Math.round((calories * 0.3) / 9),
    };
  };

  const handleSubmit = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const calories = calculateCalories();
      const macros = calculateMacros(calories);

      const { error } = await supabase
        .from('user_profiles')
        .insert({
          id: user.id,
          ...data,
          daily_calorie_target: calories,
          macro_targets: macros,
          onboarding_completed: true,
        });

      if (error) throw error;
      navigate('/dashboard');
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateData = (field: keyof OnboardingData, value: any) => {
    setData({ ...data, [field]: value });
  };

  const toggleDietaryPreference = (pref: string) => {
    const prefs = data.dietary_preferences.includes(pref)
      ? data.dietary_preferences.filter(p => p !== pref)
      : [...data.dietary_preferences, pref];
    updateData('dietary_preferences', prefs);
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="max-w-2xl w-full py-8">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-3xl font-bold bg-gradient-brand bg-clip-text text-transparent">
              Let's Get Started
            </h2>
            <span className="text-sm font-medium text-gray-500">
              Step {step} of 5
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-brand h-2 rounded-full transition-all"
              style={{ width: `${(step / 5) * 100}%` }}
            />
          </div>
        </div>

        <div className="bg-white border-2 border-gray-100 rounded-2xl shadow-lg p-8">
          {step === 1 && (
            <div className="space-y-6">
              <h3 className="text-2xl font-bold mb-4">Basic Information</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Age</label>
                <input
                  type="number"
                  value={data.age}
                  onChange={(e) => updateData('age', parseInt(e.target.value))}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary-blue"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                <div className="grid grid-cols-3 gap-3">
                  {['male', 'female', 'other'].map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => updateData('gender', g)}
                      className={`py-3 px-4 rounded-lg border-2 font-medium capitalize transition-all ${
                        data.gender === g
                          ? 'border-primary-blue bg-blue-50 text-primary-blue'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Height (cm)</label>
                  <input
                    type="number"
                    value={data.height}
                    onChange={(e) => updateData('height', parseFloat(e.target.value))}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary-blue"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Weight (kg)</label>
                  <input
                    type="number"
                    value={data.weight}
                    onChange={(e) => updateData('weight', parseFloat(e.target.value))}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary-blue"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h3 className="text-2xl font-bold mb-4">What's Your Goal?</h3>
              <div className="grid grid-cols-1 gap-3">
                {[
                  { value: 'weight_loss', label: 'Lose Weight' },
                  { value: 'muscle_gain', label: 'Build Muscle' },
                  { value: 'endurance', label: 'Improve Endurance' },
                  { value: 'flexibility', label: 'Increase Flexibility' },
                  { value: 'general_health', label: 'General Health & Wellness' },
                ].map((goal) => (
                  <button
                    key={goal.value}
                    onClick={() => updateData('fitness_goal', goal.value)}
                    className={`py-4 px-6 rounded-lg border-2 font-medium text-left transition-all ${
                      data.fitness_goal === goal.value
                        ? 'border-primary-blue bg-blue-50 text-primary-blue'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {goal.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <h3 className="text-2xl font-bold mb-4">Activity & Experience</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Activity Level</label>
                <div className="space-y-3">
                  {[
                    { value: 'sedentary', label: 'Sedentary', desc: 'Little to no exercise' },
                    { value: 'lightly_active', label: 'Lightly Active', desc: 'Exercise 1-3 days/week' },
                    { value: 'moderately_active', label: 'Moderately Active', desc: 'Exercise 3-5 days/week' },
                    { value: 'very_active', label: 'Very Active', desc: 'Exercise 6-7 days/week' },
                  ].map((level) => (
                    <button
                      key={level.value}
                      onClick={() => updateData('activity_level', level.value)}
                      className={`w-full py-3 px-4 rounded-lg border-2 text-left transition-all ${
                        data.activity_level === level.value
                          ? 'border-primary-blue bg-blue-50 text-primary-blue'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium">{level.label}</div>
                      <div className="text-sm opacity-70">{level.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Experience Level</label>
                <div className="grid grid-cols-3 gap-3">
                  {['beginner', 'intermediate', 'advanced'].map((level) => (
                    <button
                      key={level}
                      onClick={() => updateData('commitment_level', level)}
                      className={`py-3 px-4 rounded-lg border-2 font-medium capitalize transition-all ${
                        data.commitment_level === level
                          ? 'border-primary-blue bg-blue-50 text-primary-blue'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <h3 className="text-2xl font-bold mb-4">Workout Preference</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'home', label: 'Home Workouts' },
                  { value: 'gym', label: 'Gym' },
                  { value: 'outdoor', label: 'Outdoor' },
                  { value: 'hybrid', label: 'Mix of All' },
                ].map((pref) => (
                  <button
                    key={pref.value}
                    onClick={() => updateData('workout_preference', pref.value)}
                    className={`py-4 px-6 rounded-lg border-2 font-medium transition-all ${
                      data.workout_preference === pref.value
                        ? 'border-primary-blue bg-blue-50 text-primary-blue'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {pref.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-6">
              <h3 className="text-2xl font-bold mb-4">Dietary Preferences</h3>
              <p className="text-gray-600 mb-4">Select all that apply</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  'Vegetarian',
                  'Vegan',
                  'Halal',
                  'Gluten-Free',
                  'Dairy-Free',
                  'Keto',
                  'Paleo',
                  'No Restrictions',
                ].map((pref) => (
                  <button
                    key={pref}
                    onClick={() => toggleDietaryPreference(pref)}
                    className={`py-3 px-4 rounded-lg border-2 font-medium transition-all ${
                      data.dietary_preferences.includes(pref)
                        ? 'border-primary-blue bg-blue-50 text-primary-blue'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {pref}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-between mt-8 pt-6 border-t">
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                className="flex items-center px-6 py-3 border-2 border-gray-200 rounded-lg font-medium hover:border-gray-300 transition-colors"
              >
                <ChevronLeft className="w-5 h-5 mr-1" />
                Back
              </button>
            )}

            {step < 5 ? (
              <button
                onClick={() => setStep(step + 1)}
                disabled={
                  (step === 1 && !data.gender) ||
                  (step === 2 && !data.fitness_goal) ||
                  (step === 3 && (!data.activity_level || !data.commitment_level)) ||
                  (step === 4 && !data.workout_preference)
                }
                className="ml-auto flex items-center px-6 py-3 bg-gradient-brand text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                Next
                <ChevronRight className="w-5 h-5 ml-1" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="ml-auto px-8 py-3 bg-gradient-brand text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Complete Setup'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
