export type PlanType = 'basic' | 'pro' | 'pro_annual';

export interface Profile {
  id?: string;
  user_id: string;
  name: string;
  goal: string | null;
  fitness_level: number | null;
  weight_kg: number | null;
  height_cm: number | null;
  age: number | null;
  gender: 'male' | 'female' | null;
  training_frequency: string | null;
  plan_type: PlanType;
  onboarding_complete: boolean;
  streak_count: number;
  xp_total: number;
  freeze_available: boolean;
  created_at?: string;
}

export interface WorkoutExercise {
  name: string;
  sets: number;
  reps: string;
  rest: string;
  muscle: string;
}

export interface Workout {
  id: string;
  name: string;
  category: string;
  description: string;
  duration_mins: number;
  calories: number;
  difficulty: number;
  exercises: WorkoutExercise[];
}
