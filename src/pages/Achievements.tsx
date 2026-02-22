import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Trophy, Lock, Award, Target } from 'lucide-react';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  points: number;
  unlocked: boolean;
  unlocked_at?: string;
}

const Achievements: React.FC = () => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'achievements' | 'leaderboard'>('achievements');
  const { user } = useAuth();

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    try {
      const { data: allAchievements } = await supabase
        .from('achievements')
        .select('*')
        .order('category');

      const { data: userAchievements } = await supabase
        .from('user_achievements')
        .select('achievement_id, unlocked_at')
        .eq('user_id', user.id);

      const unlockedIds = new Set(userAchievements?.map(ua => ua.achievement_id) || []);

      const achievementsWithStatus = allAchievements?.map(achievement => ({
        ...achievement,
        unlocked: unlockedIds.has(achievement.id),
        unlocked_at: userAchievements?.find(ua => ua.achievement_id === achievement.id)?.unlocked_at,
      })) || [];

      setAchievements(achievementsWithStatus);

      const { data: leaderboardData } = await supabase
        .from('leaderboard')
        .select('*')
        .order('total_points', { ascending: false })
        .limit(10);

      setLeaderboard(leaderboardData || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'workout':
        return '💪';
      case 'nutrition':
        return '🍎';
      case 'streak':
        return '🔥';
      case 'social':
        return '👥';
      case 'progress':
        return '📊';
      default:
        return '🏆';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-blue border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading achievements...</p>
        </div>
      </div>
    );
  }

  const totalUnlocked = achievements.filter(a => a.unlocked).length;
  const totalPoints = achievements.filter(a => a.unlocked).reduce((sum, a) => sum + a.points, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2 bg-gradient-brand bg-clip-text text-transparent">
          Achievements & Leaderboard
        </h1>
        <p className="text-gray-600">Track your progress and compete with others</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white border-2 border-gray-200 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Unlocked</h3>
            <Trophy className="w-6 h-6 text-primary-gold" />
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {totalUnlocked} / {achievements.length}
          </div>
        </div>

        <div className="bg-white border-2 border-gray-200 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Total Points</h3>
            <Target className="w-6 h-6 text-primary-blue" />
          </div>
          <div className="text-3xl font-bold bg-gradient-brand bg-clip-text text-transparent">
            {totalPoints}
          </div>
        </div>

        <div className="bg-gradient-brand rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium opacity-90">Completion</h3>
            <Award className="w-6 h-6" />
          </div>
          <div className="text-3xl font-bold">
            {Math.round((totalUnlocked / achievements.length) * 100)}%
          </div>
        </div>
      </div>

      <div className="bg-white border-2 border-gray-200 rounded-2xl overflow-hidden">
        <div className="flex border-b-2 border-gray-200">
          <button
            onClick={() => setActiveTab('achievements')}
            className={`flex-1 py-4 px-6 font-semibold transition-all ${
              activeTab === 'achievements'
                ? 'bg-gradient-brand text-white'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Achievements
          </button>
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`flex-1 py-4 px-6 font-semibold transition-all ${
              activeTab === 'leaderboard'
                ? 'bg-gradient-brand text-white'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Leaderboard
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'achievements' ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {achievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className={`border-2 rounded-xl p-4 transition-all ${
                    achievement.unlocked
                      ? 'border-primary-blue bg-gradient-to-br from-blue-50 to-purple-50 hover:shadow-lg'
                      : 'border-gray-200 bg-gray-50 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="text-4xl">
                      {achievement.unlocked ? (achievement.icon || getCategoryIcon(achievement.category)) : <Lock className="w-10 h-10 text-gray-400" />}
                    </div>
                    <div className="text-sm font-bold text-primary-gold">
                      +{achievement.points}
                    </div>
                  </div>
                  <h3 className="font-bold mb-1">{achievement.name}</h3>
                  <p className="text-sm text-gray-600 mb-2">{achievement.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs px-2 py-1 bg-white rounded-full capitalize font-medium">
                      {achievement.category}
                    </span>
                    {achievement.unlocked && (
                      <span className="text-xs text-green-600 font-medium">Unlocked</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {leaderboard.map((entry, index) => (
                <div
                  key={entry.id}
                  className={`flex items-center justify-between p-4 rounded-xl ${
                    index < 3
                      ? 'bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-primary-blue'
                      : 'bg-gray-50 border-2 border-gray-200'
                  }`}
                >
                  <div className="flex items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold mr-4 ${
                      index === 0 ? 'bg-gradient-brand text-white' :
                      index === 1 ? 'bg-gray-300 text-gray-700' :
                      index === 2 ? 'bg-yellow-600 text-white' :
                      'bg-gray-200 text-gray-600'
                    }`}>
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                    </div>
                    <div>
                      <div className="font-bold">{entry.username}</div>
                      <div className="text-sm text-gray-600">
                        {entry.workouts_completed} workouts • {entry.streak_days} day streak
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold bg-gradient-brand bg-clip-text text-transparent">
                      {entry.total_points}
                    </div>
                    <div className="text-sm text-gray-600">points</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Achievements;
