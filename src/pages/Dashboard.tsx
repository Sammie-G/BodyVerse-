import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Dumbbell, Apple, Trophy, Target, Calendar, Flame } from 'lucide-react';
import { format } from 'date-fns';

interface Achievement {
  id: string;
  name: string;
  icon: string;
  category: string;
}

const Dashboard: React.FC = () => {
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({
    workoutsThisWeek: 0,
    currentStreak: 0,
    caloriesConsumed: 0,
    targetCalories: 2000,
    achievements: 0,
    totalPoints: 0,
  });
  const [recentAchievements, setRecentAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;

    try {
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      const { data: workouts } = await supabase
        .from('workout_sessions')
        .select('id')
        .eq('user_id', user.id)
        .eq('completed', true)
        .gte('completed_at', format(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'));

      const { data: streak } = await supabase
        .from('streaks')
        .select('current_streak')
        .eq('user_id', user.id)
        .eq('type', 'workout')
        .maybeSingle();

      const today = format(new Date(), 'yyyy-MM-dd');
      const { data: dailyStat } = await supabase
        .from('daily_stats')
        .select('calories_consumed')
        .eq('user_id', user.id)
        .eq('date', today)
        .maybeSingle();

      const { data: userAchievements } = await supabase
        .from('user_achievements')
        .select('achievement_id, achievements(name, icon, category)')
        .eq('user_id', user.id)
        .order('unlocked_at', { ascending: false })
        .limit(3);

      const { data: leaderboardEntry } = await supabase
        .from('leaderboard')
        .select('total_points')
        .eq('user_id', user.id)
        .maybeSingle();

      setProfile(profileData);
      setStats({
        workoutsThisWeek: workouts?.length || 0,
        currentStreak: streak?.current_streak || 0,
        caloriesConsumed: dailyStat?.calories_consumed || 0,
        targetCalories: profileData?.daily_calorie_target || 2000,
        achievements: userAchievements?.length || 0,
        totalPoints: leaderboardEntry?.total_points || 0,
      });

      if (userAchievements) {
        setRecentAchievements(
          userAchievements.map((ua: any) => ({
            id: ua.achievement_id,
            name: ua.achievements.name,
            icon: ua.achievements.icon,
            category: ua.achievements.category,
          }))
        );
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-blue border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const caloriesPercentage = Math.min((stats.caloriesConsumed / stats.targetCalories) * 100, 100);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-brand rounded-2xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">
          Welcome back, {user?.email?.split('@')[0]}!
        </h1>
        <p className="text-lg opacity-90">
          {format(new Date(), 'EEEE, MMMM d, yyyy')}
        </p>
        {profile && (
          <div className="mt-4 flex items-center gap-4">
            <div className="bg-white bg-opacity-20 rounded-lg px-4 py-2">
              <div className="text-sm opacity-90">Goal</div>
              <div className="font-semibold capitalize">{profile.fitness_goal?.replace('_', ' ')}</div>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg px-4 py-2">
              <div className="text-sm opacity-90">Level</div>
              <div className="font-semibold capitalize">{profile.commitment_level}</div>
            </div>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-600">Workouts</h3>
            <Dumbbell className="w-6 h-6 text-primary-blue" />
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">
            {stats.workoutsThisWeek}
          </div>
          <div className="text-sm text-gray-600">this week</div>
        </div>

        <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-600">Streak</h3>
            <Flame className="w-6 h-6 text-primary-gold" />
          </div>
          <div className="text-3xl font-bold bg-gradient-brand bg-clip-text text-transparent mb-1">
            {stats.currentStreak}
          </div>
          <div className="text-sm text-gray-600">days</div>
        </div>

        <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-600">Achievements</h3>
            <Trophy className="w-6 h-6 text-primary-purple" />
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">
            {stats.achievements}
          </div>
          <div className="text-sm text-gray-600">unlocked</div>
        </div>

        <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-600">Points</h3>
            <Target className="w-6 h-6 text-primary-gold" />
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">
            {stats.totalPoints}
          </div>
          <div className="text-sm text-gray-600">total earned</div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white border-2 border-gray-200 rounded-2xl p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <Apple className="w-6 h-6 mr-2 text-primary-blue" />
            Today's Nutrition
          </h2>
          <div className="mb-4">
            <div className="flex justify-between mb-2">
              <span className="font-medium text-gray-700">Calories</span>
              <span className="font-bold">{stats.caloriesConsumed} / {stats.targetCalories}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-gradient-brand h-3 rounded-full transition-all"
                style={{ width: `${caloriesPercentage}%` }}
              />
            </div>
          </div>
          <button className="w-full py-3 bg-primary-blue text-white rounded-lg font-semibold hover:opacity-90 transition-opacity">
            Log Meal
          </button>
        </div>

        <div className="bg-white border-2 border-gray-200 rounded-2xl p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <Calendar className="w-6 h-6 mr-2 text-primary-purple" />
            Today's Workout
          </h2>
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-4 mb-4">
            <div className="font-semibold mb-1">Upper Body Strength</div>
            <div className="text-sm text-gray-600">45 minutes • 8 exercises</div>
          </div>
          <button className="w-full py-3 bg-gradient-brand text-white rounded-lg font-semibold hover:opacity-90 transition-opacity">
            Start Workout
          </button>
        </div>
      </div>

      {recentAchievements.length > 0 && (
        <div className="bg-white border-2 border-gray-200 rounded-2xl p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <Trophy className="w-6 h-6 mr-2 text-primary-gold" />
            Recent Achievements
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            {recentAchievements.map((achievement) => (
              <div
                key={achievement.id}
                className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-4 text-center border-2 border-transparent hover:border-primary-blue transition-all"
              >
                <div className="text-4xl mb-2">{achievement.icon || '🏆'}</div>
                <div className="font-semibold">{achievement.name}</div>
                <div className="text-xs text-gray-600 capitalize mt-1">{achievement.category}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-primary-blue rounded-2xl p-8">
        <h2 className="text-2xl font-bold mb-4 bg-gradient-brand bg-clip-text text-transparent">
          AI Coach Recommendation
        </h2>
        <p className="text-gray-700 mb-4">
          Based on your progress and goals, here are today's personalized recommendations:
        </p>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-4">
            <div className="font-semibold mb-2 flex items-center">
              <Dumbbell className="w-5 h-5 mr-2 text-primary-blue" />
              Workout Focus
            </div>
            <p className="text-sm text-gray-600">
              Focus on upper body today. You've been consistent with leg workouts this week!
            </p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <div className="font-semibold mb-2 flex items-center">
              <Apple className="w-5 h-5 mr-2 text-primary-purple" />
              Nutrition Tip
            </div>
            <p className="text-sm text-gray-600">
              Increase protein intake to support muscle recovery. Aim for 150g today.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
