import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Dumbbell, Plus, Play, Clock, TrendingUp } from 'lucide-react';

interface WorkoutPlan {
  id: string;
  name: string;
  description: string;
  type: string;
  difficulty: string;
  duration_weeks: number;
  days_per_week: number;
  is_ai_generated: boolean;
}

const Workouts: React.FC = () => {
  const [workoutPlans, setWorkoutPlans] = useState<WorkoutPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingAI, setGeneratingAI] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    loadWorkoutPlans();
  }, [user]);

  const loadWorkoutPlans = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('workout_plans')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWorkoutPlans(data || []);
    } catch (error) {
      console.error('Error loading workout plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateAIWorkout = async () => {
    if (!user) return;

    setGeneratingAI(true);
    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (!profile) {
        alert('Please complete your profile first');
        return;
      }

      const workoutPlan = {
        user_id: user.id,
        name: `${profile.fitness_goal} Workout Plan`,
        description: `AI-generated ${profile.commitment_level} level workout plan tailored for your goals`,
        type: profile.fitness_goal === 'endurance' ? 'cardio' : 'strength',
        difficulty: profile.commitment_level,
        duration_weeks: 8,
        days_per_week: profile.commitment_level === 'beginner' ? 3 : profile.commitment_level === 'intermediate' ? 4 : 5,
        is_ai_generated: true,
      };

      const { error } = await supabase.from('workout_plans').insert(workoutPlan);

      if (error) throw error;
      loadWorkoutPlans();
    } catch (error) {
      console.error('Error generating AI workout:', error);
    } finally {
      setGeneratingAI(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-blue border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading workouts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2 bg-gradient-brand bg-clip-text text-transparent">
            My Workouts
          </h1>
          <p className="text-gray-600">Your personalized workout plans</p>
        </div>
        <button
          onClick={generateAIWorkout}
          disabled={generatingAI}
          className="flex items-center px-6 py-3 bg-gradient-brand text-white rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {generatingAI ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Generating...
            </>
          ) : (
            <>
              <Plus className="w-5 h-5 mr-2" />
              Generate AI Workout
            </>
          )}
        </button>
      </div>

      {workoutPlans.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-2xl">
          <Dumbbell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Workouts Yet</h3>
          <p className="text-gray-600 mb-6">
            Get started by generating your first AI-powered workout plan
          </p>
          <button
            onClick={generateAIWorkout}
            disabled={generatingAI}
            className="inline-flex items-center px-6 py-3 bg-gradient-brand text-white rounded-lg font-semibold hover:opacity-90 transition-opacity"
          >
            <Plus className="w-5 h-5 mr-2" />
            Generate AI Workout
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workoutPlans.map((plan) => (
            <div
              key={plan.id}
              className="border-2 border-gray-200 rounded-2xl p-6 hover:border-primary-blue hover:shadow-lg transition-all cursor-pointer bg-white"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                  {plan.is_ai_generated && (
                    <span className="inline-block px-2 py-1 bg-gradient-brand text-white text-xs rounded-full">
                      AI Generated
                    </span>
                  )}
                </div>
                <Dumbbell className="w-8 h-8 text-primary-blue" />
              </div>

              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {plan.description}
              </p>

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-700">
                  <Clock className="w-4 h-4 mr-2 text-primary-purple" />
                  {plan.duration_weeks} weeks
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <TrendingUp className="w-4 h-4 mr-2 text-primary-gold" />
                  {plan.days_per_week} days/week
                </div>
              </div>

              <div className="flex gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
                  plan.difficulty === 'beginner' ? 'bg-green-100 text-green-700' :
                  plan.difficulty === 'intermediate' ? 'bg-blue-100 text-blue-700' :
                  'bg-purple-100 text-purple-700'
                }`}>
                  {plan.difficulty}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-medium capitalize bg-gray-100 text-gray-700">
                  {plan.type}
                </span>
              </div>

              <button className="w-full mt-4 py-2 bg-gradient-brand text-white rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center justify-center">
                <Play className="w-4 h-4 mr-2" />
                Start Workout
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-primary-blue rounded-2xl p-8">
        <h2 className="text-2xl font-bold mb-4 bg-gradient-brand bg-clip-text text-transparent">
          Exercise Library
        </h2>
        <p className="text-gray-700 mb-6">
          Browse our comprehensive library of exercises with video demonstrations, detailed instructions, and form tips
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core', 'Cardio', 'Full Body'].map((group) => (
            <button
              key={group}
              className="py-3 px-4 bg-white rounded-lg font-medium hover:shadow-md transition-shadow border-2 border-transparent hover:border-primary-blue"
            >
              {group}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Workouts;
