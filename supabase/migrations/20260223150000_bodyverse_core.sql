CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name text DEFAULT 'Athlete',
  goal text,
  fitness_level integer,
  weight_kg numeric,
  height_cm numeric,
  age integer,
  gender text,
  training_frequency text,
  plan_type text DEFAULT 'pro',
  onboarding_complete boolean DEFAULT false,
  streak_count integer DEFAULT 0,
  xp_total integer DEFAULT 0,
  freeze_available boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS workouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  description text,
  duration_mins integer,
  calories integer,
  difficulty integer,
  exercises jsonb NOT NULL DEFAULT '[]'::jsonb
);

CREATE TABLE IF NOT EXISTS workout_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workout_id uuid REFERENCES workouts(id) ON DELETE SET NULL,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  total_volume_kg numeric,
  notes text
);

CREATE TABLE IF NOT EXISTS exercise_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
  exercise_name text NOT NULL,
  set_number integer,
  weight_kg numeric,
  reps integer,
  completed_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS nutrition_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  meal_type text NOT NULL,
  food_name text NOT NULL,
  calories integer,
  protein_g numeric,
  carbs_g numeric,
  fat_g numeric,
  logged_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS progress_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  weight_kg numeric,
  body_fat_pct numeric,
  waist_cm numeric,
  chest_cm numeric,
  hips_cm numeric,
  bicep_cm numeric,
  notes text
);

CREATE TABLE IF NOT EXISTS streaks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak integer DEFAULT 0,
  longest_streak integer DEFAULT 0,
  last_workout_date date,
  freeze_available boolean DEFAULT true
);

CREATE TABLE IF NOT EXISTS xp_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action text,
  points integer,
  earned_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "profiles own read/write" ON profiles FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "workouts authenticated read" ON workouts FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY IF NOT EXISTS "workout_sessions own read/write" ON workout_sessions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "exercise_logs own via session" ON exercise_logs FOR ALL USING (
  EXISTS (SELECT 1 FROM workout_sessions s WHERE s.id = exercise_logs.session_id AND s.user_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM workout_sessions s WHERE s.id = exercise_logs.session_id AND s.user_id = auth.uid())
);
CREATE POLICY IF NOT EXISTS "nutrition own read/write" ON nutrition_logs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "progress own read/write" ON progress_entries FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "streaks own read/write" ON streaks FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "xp own read/write" ON xp_log FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

INSERT INTO workouts (name, category, description, duration_mins, calories, difficulty, exercises)
VALUES
('Upper Body Power', 'Strength', 'Pressing and pulling for upper strength.', 55, 420, 3, '[{"name":"Bench Press","sets":4,"reps":"6-8","rest":"90s","muscle":"Chest"},{"name":"Bent Over Row","sets":4,"reps":"8","rest":"75s","muscle":"Back"}]'),
('Lower Body Foundation', 'Strength', 'Build lower body force production.', 50, 390, 2, '[{"name":"Back Squat","sets":4,"reps":"6","rest":"120s","muscle":"Legs"},{"name":"Romanian Deadlift","sets":4,"reps":"8","rest":"90s","muscle":"Hamstrings"}]'),
('Push Day Hypertrophy', 'Strength', 'Chest shoulder tricep volume.', 48, 360, 2, '[{"name":"Incline Dumbbell Press","sets":4,"reps":"10","rest":"75s","muscle":"Chest"},{"name":"Lateral Raise","sets":4,"reps":"14","rest":"45s","muscle":"Shoulders"}]'),
('HIIT Inferno', 'HIIT', 'Fast intervals and intense effort.', 28, 350, 3, '[{"name":"Burpees","sets":5,"reps":"40s on / 20s off","rest":"20s","muscle":"Full Body"},{"name":"Bike Sprint","sets":5,"reps":"45s","rest":"30s","muscle":"Cardio"}]'),
('HIIT Core Burn', 'HIIT', 'Core-heavy interval protocol.', 24, 280, 2, '[{"name":"Mountain Climbers","sets":6,"reps":"30s","rest":"20s","muscle":"Core"},{"name":"V-Ups","sets":5,"reps":"14","rest":"30s","muscle":"Core"}]'),
('Endurance Run Builder', 'Cardio', 'Steady-state aerobic base run.', 45, 410, 2, '[{"name":"Treadmill Run","sets":1,"reps":"45 min","rest":"0","muscle":"Cardio"}]'),
('Row + Rope Engine', 'Cardio', 'Mixed cardio intervals.', 32, 300, 2, '[{"name":"Row Erg","sets":6,"reps":"2 min","rest":"45s","muscle":"Cardio"},{"name":"Jump Rope","sets":6,"reps":"1 min","rest":"30s","muscle":"Cardio"}]'),
('Bodyweight Core Blast', 'Bodyweight', 'No equipment abdominal circuit.', 30, 220, 2, '[{"name":"Plank","sets":4,"reps":"45s","rest":"30s","muscle":"Core"},{"name":"Dead Bug","sets":4,"reps":"12","rest":"30s","muscle":"Core"}]'),
('Bodyweight Mobility Flow', 'Bodyweight', 'Mobility and activation blend.', 26, 170, 1, '[{"name":"Worlds Greatest Stretch","sets":3,"reps":"8/side","rest":"20s","muscle":"Mobility"},{"name":"Glute Bridge","sets":3,"reps":"15","rest":"30s","muscle":"Glutes"}]'),
('Cardio Dance Intervals', 'Cardio', 'Rhythmic movement cardio workout.', 35, 320, 1, '[{"name":"Dance Combo","sets":7,"reps":"4 min","rest":"30s","muscle":"Cardio"}]')
ON CONFLICT DO NOTHING;
