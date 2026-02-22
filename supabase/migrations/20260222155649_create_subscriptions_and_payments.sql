/*
  # Subscriptions and Payments Schema

  1. New Tables
    - `subscriptions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references user_profiles)
      - `tier` (text) - free, premium
      - `plan_type` (text) - monthly, quarterly, yearly
      - `status` (text) - active, cancelled, expired, pending
      - `amount` (decimal) - Amount paid
      - `currency` (text) - Currency used
      - `payment_gateway` (text) - flutterwave, paypal
      - `transaction_id` (text) - Payment gateway transaction ID
      - `started_at` (timestamptz)
      - `expires_at` (timestamptz)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `payment_history`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references user_profiles)
      - `subscription_id` (uuid, references subscriptions)
      - `amount` (decimal)
      - `currency` (text)
      - `payment_gateway` (text)
      - `transaction_id` (text)
      - `status` (text) - success, failed, pending
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add policies for users to view their own subscriptions and payment history
*/

CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  tier text NOT NULL DEFAULT 'free',
  plan_type text,
  status text NOT NULL DEFAULT 'active',
  amount decimal,
  currency text,
  payment_gateway text,
  transaction_id text,
  started_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payment_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  subscription_id uuid REFERENCES subscriptions(id) ON DELETE SET NULL,
  amount decimal NOT NULL,
  currency text NOT NULL,
  payment_gateway text NOT NULL,
  transaction_id text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions"
  ON subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions"
  ON subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions"
  ON subscriptions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own payment history"
  ON payment_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payment history"
  ON payment_history FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
