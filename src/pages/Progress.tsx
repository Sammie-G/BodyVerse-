import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { TrendingUp, TrendingDown, Camera, Calendar } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

interface ProgressLog {
  id: string;
  weight: number;
  body_fat_percentage: number;
  logged_at: string;
  photo_url: string;
  notes: string;
}

const Progress: React.FC = () => {
  const [progressLogs, setProgressLogs] = useState<ProgressLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    currentWeight: 0,
    startWeight: 0,
    weightChange: 0,
    workoutsCompleted: 0,
    currentStreak: 0,
  });
  const { user } = useAuth();

  useEffect(() => {
    loadProgressData();
  }, [user]);

  const loadProgressData = async () => {
    if (!user) return;

    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('weight')
        .eq('id', user.id)
        .maybeSingle();

      const { data: logs } = await supabase
        .from('progress_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('logged_at', { ascending: false });

      const { data: workouts } = await supabase
        .from('workout_sessions')
        .select('id')
        .eq('user_id', user.id)
        .eq('completed', true);

      const { data: streaks } = await supabase
        .from('streaks')
        .select('current_streak')
        .eq('user_id', user.id)
        .eq('type', 'workout')
        .maybeSingle();

      if (logs && logs.length > 0) {
        const currentWeight = logs[0].weight;
        const startWeight = profile?.weight || logs[logs.length - 1].weight;
        const weightChange = currentWeight - startWeight;

        setProgressLogs(logs);
        setStats({
          currentWeight,
          startWeight,
          weightChange,
          workoutsCompleted: workouts?.length || 0,
          currentStreak: streaks?.current_streak || 0,
        });
      } else if (profile) {
        setStats({
          currentWeight: profile.weight,
          startWeight: profile.weight,
          weightChange: 0,
          workoutsCompleted: workouts?.length || 0,
          currentStreak: streaks?.current_streak || 0,
        });
      }
    } catch (error) {
      console.error('Error loading progress data:', error);
    } finally {
      setLoading(false);
    }
  };

  const chartData = progressLogs
    .slice(0, 30)
    .reverse()
    .map((log) => ({
      date: format(new Date(log.logged_at), 'MMM d'),
      weight: log.weight,
    }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-blue border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading progress...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2 bg-gradient-brand bg-clip-text text-transparent">
            Progress Tracking
          </h1>
          <p className="text-gray-600">Track your fitness journey</p>
        </div>
        <button className="flex items-center px-6 py-3 bg-gradient-brand text-white rounded-lg font-semibold hover:opacity-90 transition-opacity">
          <Camera className="w-5 h-5 mr-2" />
          Log Progress
        </button>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        <div className="bg-white border-2 border-gray-200 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Current Weight</h3>
            <TrendingUp className="w-5 h-5 text-primary-blue" />
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {stats.currentWeight.toFixed(1)} kg
          </div>
        </div>

        <div className="bg-white border-2 border-gray-200 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Weight Change</h3>
            {stats.weightChange < 0 ? (
              <TrendingDown className="w-5 h-5 text-green-500" />
            ) : (
              <TrendingUp className="w-5 h-5 text-primary-purple" />
            )}
          </div>
          <div className={`text-3xl font-bold ${stats.weightChange < 0 ? 'text-green-500' : 'text-primary-purple'}`}>
            {stats.weightChange > 0 ? '+' : ''}{stats.weightChange.toFixed(1)} kg
          </div>
        </div>

        <div className="bg-white border-2 border-gray-200 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Workouts</h3>
            <Calendar className="w-5 h-5 text-primary-gold" />
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {stats.workoutsCompleted}
          </div>
          <div className="text-sm text-gray-600 mt-1">completed</div>
        </div>

        <div className="bg-gradient-brand rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium">Current Streak</h3>
            <div className="text-2xl">🔥</div>
          </div>
          <div className="text-3xl font-bold">
            {stats.currentStreak}
          </div>
          <div className="text-sm opacity-90 mt-1">days</div>
        </div>
      </div>

      <div className="bg-white border-2 border-gray-200 rounded-2xl p-6">
        <h2 className="text-xl font-bold mb-6">Weight Progress</h2>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
              <Line
                type="monotone"
                dataKey="weight"
                stroke="url(#gradient)"
                strokeWidth={3}
                dot={{ fill: '#4A90E2', r: 5 }}
              />
              <defs>
                <linearGradient id="gradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#4A90E2" />
                  <stop offset="50%" stopColor="#9B59B6" />
                  <stop offset="100%" stopColor="#F39C12" />
                </linearGradient>
              </defs>
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center py-12 text-gray-500">
            No weight data to display. Start logging your progress!
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white border-2 border-gray-200 rounded-2xl p-6">
          <h2 className="text-xl font-bold mb-4">Progress Photos</h2>
          {progressLogs.filter(log => log.photo_url).length > 0 ? (
            <div className="grid grid-cols-3 gap-4">
              {progressLogs
                .filter(log => log.photo_url)
                .slice(0, 6)
                .map((log) => (
                  <div key={log.id} className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={log.photo_url}
                      alt="Progress"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-2">
                      {format(new Date(log.logged_at), 'MMM d')}
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Camera className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              No photos yet. Start capturing your transformation!
            </div>
          )}
        </div>

        <div className="bg-white border-2 border-gray-200 rounded-2xl p-6">
          <h2 className="text-xl font-bold mb-4">Recent Logs</h2>
          {progressLogs.length > 0 ? (
            <div className="space-y-3">
              {progressLogs.slice(0, 5).map((log) => (
                <div key={log.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-semibold">{log.weight} kg</div>
                    <div className="text-sm text-gray-600">
                      {format(new Date(log.logged_at), 'MMM d, yyyy')}
                    </div>
                    {log.notes && (
                      <div className="text-sm text-gray-500 mt-1">{log.notes}</div>
                    )}
                  </div>
                  {log.body_fat_percentage && (
                    <div className="text-right">
                      <div className="text-sm text-gray-600">Body Fat</div>
                      <div className="font-semibold">{log.body_fat_percentage}%</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              No logs yet. Start tracking your progress!
            </div>
          )}
        </div>
      </div>

      <div className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-primary-blue rounded-2xl p-8">
        <h2 className="text-2xl font-bold mb-4 bg-gradient-brand bg-clip-text text-transparent">
          Keep Going!
        </h2>
        <p className="text-gray-700 mb-4">
          Consistency is key to achieving your fitness goals. Track your progress regularly to stay motivated and see your transformation over time.
        </p>
        <div className="grid md:grid-cols-3 gap-4 text-center">
          <div className="bg-white rounded-lg p-4">
            <div className="text-3xl mb-2">📊</div>
            <div className="font-semibold">Track Daily</div>
          </div>
          <div className="bg-white rounded-lg p-4">
            <div className="text-3xl mb-2">📸</div>
            <div className="font-semibold">Take Photos</div>
          </div>
          <div className="bg-white rounded-lg p-4">
            <div className="text-3xl mb-2">🎯</div>
            <div className="font-semibold">Stay Consistent</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Progress;
