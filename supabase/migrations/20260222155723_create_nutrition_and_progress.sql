/*
  # Nutrition Tracking and Progress Schema

  1. New Tables
    - `meal_logs`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references user_profiles)
      - `meal_type` (text) - breakfast, lunch, dinner, snack
      - `food_name` (text)
      - `calories` (decimal)
      - `protein` (decimal)
      - `carbs` (decimal)
      - `fats` (decimal)
      - `portion_size` (text)
      - `logged_at` (timestamptz)
      - `created_at` (timestamptz)

    - `meal_plans`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references user_profiles)
      - `name` (text)
      - `date` (date)
      - `meals` (jsonb) - Array of meal objects
      - `total_calories` (integer)
      - `total_protein` (decimal)
      - `total_carbs` (decimal)
      - `total_fats` (decimal)
      - `is_ai_generated` (boolean)
      - `created_at` (timestamptz)

    - `progress_logs`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references user_profiles)
      - `weight` (decimal)
      - `body_fat_percentage` (decimal)
      - `measurements` (jsonb) - Chest, waist, hips, arms, etc.
      - `photo_url` (text)
      - `notes` (text)
      - `logged_at` (timestamptz)
      - `created_at` (timestamptz)

    - `daily_stats`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references user_profiles)
      - `date` (date)
      - `calories_consumed` (integer)
      - `calories_burned` (integer)
      - `workouts_completed` (integer)
      - `water_intake_ml` (integer)
      - `sleep_hours` (decimal)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Users can only access their own nutrition and progress data
*/

CREATE TABLE IF NOT EXISTS meal_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  meal_type text NOT NULL,
  food_name text NOT NULL,
  calories decimal NOT NULL,
  protein decimal DEFAULT 0,
  carbs decimal DEFAULT 0,
  fats decimal DEFAULT 0,
  portion_size text,
  logged_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS meal_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  date date NOT NULL,
  meals jsonb DEFAULT '[]'::jsonb,
  total_calories integer DEFAULT 0,
  total_protein decimal DEFAULT 0,
  total_carbs decimal DEFAULT 0,
  total_fats decimal DEFAULT 0,
  is_ai_generated boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS progress_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  weight decimal,
  body_fat_percentage decimal,
  measurements jsonb DEFAULT '{}'::jsonb,
  photo_url text,
  notes text,
  logged_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS daily_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  calories_consumed integer DEFAULT 0,
  calories_burned integer DEFAULT 0,
  workouts_completed integer DEFAULT 0,
  water_intake_ml integer DEFAULT 0,
  sleep_hours decimal DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);

ALTER TABLE meal_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own meal logs"
  ON meal_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meal logs"
  ON meal_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meal logs"
  ON meal_logs FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own meal logs"
  ON meal_logs FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own meal plans"
  ON meal_plans FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meal plans"
  ON meal_plans FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meal plans"
  ON meal_plans FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own meal plans"
  ON meal_plans FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own progress logs"
  ON progress_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress logs"
  ON progress_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress logs"
  ON progress_logs FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own progress logs"
  ON progress_logs FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own daily stats"
  ON daily_stats FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own daily stats"
  ON daily_stats FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily stats"
  ON daily_stats FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own daily stats"
  ON daily_stats FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
