/*
  # Workouts and Exercises Schema

  1. New Tables
    - `exercises`
      - `id` (uuid, primary key)
      - `name` (text) - Exercise name
      - `description` (text) - Detailed description
      - `muscle_group` (text) - chest, back, legs, shoulders, arms, core, full_body
      - `equipment` (text) - bodyweight, dumbbells, barbell, resistance_bands, machines, etc.
      - `difficulty` (text) - beginner, intermediate, advanced
      - `video_url` (text) - URL to exercise demonstration video
      - `thumbnail_url` (text) - Thumbnail image
      - `instructions` (jsonb) - Step-by-step instructions array
      - `tips` (jsonb) - Form tips and modifications
      - `created_at` (timestamptz)

    - `workout_plans`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references user_profiles)
      - `name` (text)
      - `description` (text)
      - `type` (text) - strength, cardio, hiit, flexibility, mixed
      - `difficulty` (text)
      - `duration_weeks` (integer)
      - `days_per_week` (integer)
      - `is_ai_generated` (boolean)
      - `created_at` (timestamptz)

    - `workout_sessions`
      - `id` (uuid, primary key)
      - `workout_plan_id` (uuid, references workout_plans)
      - `user_id` (uuid, references user_profiles)
      - `day_number` (integer)
      - `name` (text)
      - `exercises` (jsonb) - Array of exercise objects with sets/reps
      - `completed` (boolean)
      - `completed_at` (timestamptz)
      - `created_at` (timestamptz)

    - `workout_logs`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references user_profiles)
      - `workout_session_id` (uuid, references workout_sessions)
      - `exercise_id` (uuid, references exercises)
      - `sets_completed` (integer)
      - `reps_completed` (jsonb) - Array of reps per set
      - `weight_used` (jsonb) - Array of weights per set
      - `duration_minutes` (integer)
      - `notes` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Exercises table is public readable
    - Other tables restricted to user's own data
*/

CREATE TABLE IF NOT EXISTS exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  muscle_group text NOT NULL,
  equipment text NOT NULL,
  difficulty text NOT NULL,
  video_url text,
  thumbnail_url text,
  instructions jsonb DEFAULT '[]'::jsonb,
  tips jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS workout_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  type text NOT NULL,
  difficulty text NOT NULL,
  duration_weeks integer NOT NULL,
  days_per_week integer NOT NULL,
  is_ai_generated boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS workout_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_plan_id uuid REFERENCES workout_plans(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  day_number integer NOT NULL,
  name text NOT NULL,
  exercises jsonb DEFAULT '[]'::jsonb,
  completed boolean DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS workout_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  workout_session_id uuid REFERENCES workout_sessions(id) ON DELETE CASCADE,
  exercise_id uuid REFERENCES exercises(id) ON DELETE SET NULL,
  sets_completed integer,
  reps_completed jsonb DEFAULT '[]'::jsonb,
  weight_used jsonb DEFAULT '[]'::jsonb,
  duration_minutes integer,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Exercises are viewable by everyone"
  ON exercises FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can view own workout plans"
  ON workout_plans FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own workout plans"
  ON workout_plans FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workout plans"
  ON workout_plans FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own workout plans"
  ON workout_plans FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own workout sessions"
  ON workout_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own workout sessions"
  ON workout_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workout sessions"
  ON workout_sessions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own workout sessions"
  ON workout_sessions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own workout logs"
  ON workout_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own workout logs"
  ON workout_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workout logs"
  ON workout_logs FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own workout logs"
  ON workout_logs FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
