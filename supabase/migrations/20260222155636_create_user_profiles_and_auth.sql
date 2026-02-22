/*
  # BodyVerse Database Schema - User Profiles and Authentication

  1. New Tables
    - `user_profiles`
      - `id` (uuid, primary key, references auth.users)
      - `age` (integer) - User's age for age-adaptive guidance
      - `height` (decimal) - Height in cm
      - `weight` (decimal) - Weight in kg
      - `gender` (text) - Inclusive gender options
      - `fitness_goal` (text) - primary, muscle_gain, weight_loss, endurance, flexibility, general_health
      - `activity_level` (text) - sedentary, lightly_active, moderately_active, very_active, extremely_active
      - `workout_preference` (text) - home, gym, outdoor, hybrid
      - `dietary_preferences` (jsonb) - Array of dietary preferences (vegetarian, vegan, halal, etc.)
      - `commitment_level` (text) - beginner, intermediate, advanced
      - `daily_calorie_target` (integer) - Calculated daily calorie needs
      - `macro_targets` (jsonb) - Protein, carbs, fats targets
      - `country_code` (text) - For regional pricing
      - `currency` (text) - User's preferred currency
      - `onboarding_completed` (boolean) - Whether user finished onboarding
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `user_profiles` table
    - Add policies for authenticated users to manage their own profiles
*/

CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  age integer,
  height decimal,
  weight decimal,
  gender text,
  fitness_goal text,
  activity_level text,
  workout_preference text,
  dietary_preferences jsonb DEFAULT '[]'::jsonb,
  commitment_level text,
  daily_calorie_target integer,
  macro_targets jsonb DEFAULT '{}'::jsonb,
  country_code text,
  currency text DEFAULT 'USD',
  onboarding_completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete own profile"
  ON user_profiles FOR DELETE
  TO authenticated
  USING (auth.uid() = id);
