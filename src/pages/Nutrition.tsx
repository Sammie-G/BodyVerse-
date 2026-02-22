import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Apple, Camera, Plus, Utensils } from 'lucide-react';
import { format } from 'date-fns';

interface MealLog {
  id: string;
  meal_type: string;
  food_name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  logged_at: string;
}

interface DailyStats {
  calories_consumed: number;
  target_calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

const Nutrition: React.FC = () => {
  const [mealLogs, setMealLogs] = useState<MealLog[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStats>({
    calories_consumed: 0,
    target_calories: 2000,
    protein: 0,
    carbs: 0,
    fats: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showAddMeal, setShowAddMeal] = useState(false);
  const [newMeal, setNewMeal] = useState({
    meal_type: 'breakfast',
    food_name: '',
    calories: 0,
    protein: 0,
    carbs: 0,
    fats: 0,
  });
  const { user } = useAuth();
  const today = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    loadNutritionData();
  }, [user]);

  const loadNutritionData = async () => {
    if (!user) return;

    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('daily_calorie_target, macro_targets')
        .eq('id', user.id)
        .maybeSingle();

      const { data: meals } = await supabase
        .from('meal_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('logged_at', `${today}T00:00:00`)
        .lte('logged_at', `${today}T23:59:59`)
        .order('logged_at', { ascending: false });

      if (meals) {
        setMealLogs(meals);
        const totalCalories = meals.reduce((sum, meal) => sum + Number(meal.calories), 0);
        const totalProtein = meals.reduce((sum, meal) => sum + Number(meal.protein), 0);
        const totalCarbs = meals.reduce((sum, meal) => sum + Number(meal.carbs), 0);
        const totalFats = meals.reduce((sum, meal) => sum + Number(meal.fats), 0);

        setDailyStats({
          calories_consumed: totalCalories,
          target_calories: profile?.daily_calorie_target || 2000,
          protein: totalProtein,
          carbs: totalCarbs,
          fats: totalFats,
        });
      }
    } catch (error) {
      console.error('Error loading nutrition data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addMeal = async () => {
    if (!user || !newMeal.food_name) return;

    try {
      const { error } = await supabase.from('meal_logs').insert({
        user_id: user.id,
        ...newMeal,
      });

      if (error) throw error;

      setShowAddMeal(false);
      setNewMeal({
        meal_type: 'breakfast',
        food_name: '',
        calories: 0,
        protein: 0,
        carbs: 0,
        fats: 0,
      });
      loadNutritionData();
    } catch (error) {
      console.error('Error adding meal:', error);
    }
  };

  const caloriesRemaining = dailyStats.target_calories - dailyStats.calories_consumed;
  const caloriesPercentage = Math.min((dailyStats.calories_consumed / dailyStats.target_calories) * 100, 100);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-blue border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading nutrition data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2 bg-gradient-brand bg-clip-text text-transparent">
            Nutrition
          </h1>
          <p className="text-gray-600">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
        </div>
        <button
          onClick={() => setShowAddMeal(true)}
          className="flex items-center px-6 py-3 bg-gradient-brand text-white rounded-lg font-semibold hover:opacity-90 transition-opacity"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Meal
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white border-2 border-gray-200 rounded-2xl p-6">
          <h2 className="text-xl font-bold mb-4">Daily Calories</h2>
          <div className="text-center mb-4">
            <div className="text-5xl font-bold bg-gradient-brand bg-clip-text text-transparent mb-2">
              {dailyStats.calories_consumed}
            </div>
            <div className="text-gray-600">
              of {dailyStats.target_calories} kcal
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
            <div
              className="bg-gradient-brand h-4 rounded-full transition-all"
              style={{ width: `${caloriesPercentage}%` }}
            />
          </div>
          <div className={`text-center font-semibold ${caloriesRemaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {Math.abs(caloriesRemaining)} kcal {caloriesRemaining >= 0 ? 'remaining' : 'over'}
          </div>
        </div>

        <div className="bg-white border-2 border-gray-200 rounded-2xl p-6">
          <h2 className="text-xl font-bold mb-4">Macronutrients</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="font-medium text-gray-700">Protein</span>
                <span className="font-bold text-primary-blue">{dailyStats.protein.toFixed(1)}g</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div className="bg-primary-blue h-3 rounded-full" style={{ width: '60%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="font-medium text-gray-700">Carbs</span>
                <span className="font-bold text-primary-purple">{dailyStats.carbs.toFixed(1)}g</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div className="bg-primary-purple h-3 rounded-full" style={{ width: '50%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="font-medium text-gray-700">Fats</span>
                <span className="font-bold text-primary-gold">{dailyStats.fats.toFixed(1)}g</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div className="bg-primary-gold h-3 rounded-full" style={{ width: '40%' }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-primary-blue rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">AI Food Scanner</h2>
          <Camera className="w-8 h-8 text-primary-blue" />
        </div>
        <p className="text-gray-700 mb-4">
          Scan food with your camera or barcode to instantly log calories and macros
        </p>
        <button className="px-6 py-3 bg-gradient-brand text-white rounded-lg font-semibold hover:opacity-90 transition-opacity">
          Open Scanner
        </button>
      </div>

      <div className="bg-white border-2 border-gray-200 rounded-2xl p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center">
          <Utensils className="w-6 h-6 mr-2 text-primary-blue" />
          Today's Meals
        </h2>

        {mealLogs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Apple className="w-12 h-12 mx-auto mb-2 text-gray-400" />
            No meals logged today
          </div>
        ) : (
          <div className="space-y-4">
            {mealLogs.map((meal) => (
              <div key={meal.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-semibold capitalize">{meal.meal_type}</div>
                  <div className="text-gray-700">{meal.food_name}</div>
                  <div className="text-sm text-gray-600">
                    P: {meal.protein}g | C: {meal.carbs}g | F: {meal.fats}g
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary-blue">{meal.calories}</div>
                  <div className="text-sm text-gray-600">kcal</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAddMeal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-2xl font-bold mb-4">Add Meal</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Meal Type</label>
                <select
                  value={newMeal.meal_type}
                  onChange={(e) => setNewMeal({ ...newMeal, meal_type: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary-blue"
                >
                  <option value="breakfast">Breakfast</option>
                  <option value="lunch">Lunch</option>
                  <option value="dinner">Dinner</option>
                  <option value="snack">Snack</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Food Name</label>
                <input
                  type="text"
                  value={newMeal.food_name}
                  onChange={(e) => setNewMeal({ ...newMeal, food_name: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary-blue"
                  placeholder="e.g., Grilled Chicken Breast"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Calories</label>
                  <input
                    type="number"
                    value={newMeal.calories}
                    onChange={(e) => setNewMeal({ ...newMeal, calories: Number(e.target.value) })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary-blue"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Protein (g)</label>
                  <input
                    type="number"
                    value={newMeal.protein}
                    onChange={(e) => setNewMeal({ ...newMeal, protein: Number(e.target.value) })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary-blue"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Carbs (g)</label>
                  <input
                    type="number"
                    value={newMeal.carbs}
                    onChange={(e) => setNewMeal({ ...newMeal, carbs: Number(e.target.value) })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary-blue"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Fats (g)</label>
                  <input
                    type="number"
                    value={newMeal.fats}
                    onChange={(e) => setNewMeal({ ...newMeal, fats: Number(e.target.value) })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary-blue"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowAddMeal(false)}
                  className="flex-1 py-3 border-2 border-gray-200 rounded-lg font-semibold hover:border-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={addMeal}
                  className="flex-1 py-3 bg-gradient-brand text-white rounded-lg font-semibold hover:opacity-90"
                >
                  Add Meal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Nutrition;
