import { FormEvent, useEffect, useMemo, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import type { Profile, Workout } from '@/types';
import {
  Apple,
  Bot,
  BarChart3,
  ChevronLeft,
  CheckCircle2,
  CircleDot,
  Crown,
  Dumbbell,
  Flame,
  Home,
  Lock,
  Send,
  User,
} from 'lucide-react';

interface AppState {
  userId: string | null;
  profile: Profile | null;
  onboardingStep: number;
  activeWorkout: Workout | null;
  workoutIndex: number;
  planModalOpen: boolean;
}

const workoutsSeed: Workout[] = [
  { id: '1', name: 'Upper Body Power', category: 'Strength', description: 'Push and pull focused strength split.', duration_mins: 55, calories: 420, difficulty: 3, exercises: [
    { name: 'Bench Press', sets: 4, reps: '6-8', rest: '90s', muscle: 'Chest' },
    { name: 'Bent Over Row', sets: 4, reps: '8', rest: '75s', muscle: 'Back' },
    { name: 'Overhead Press', sets: 3, reps: '10', rest: '60s', muscle: 'Shoulders' },
    { name: 'Cable Fly', sets: 3, reps: '12', rest: '45s', muscle: 'Chest' },
    { name: 'Hammer Curl', sets: 3, reps: '12', rest: '45s', muscle: 'Arms' },
    { name: 'Tricep Rope Pushdown', sets: 3, reps: '12', rest: '45s', muscle: 'Arms' },
  ] },
  { id: '2', name: 'HIIT Inferno', category: 'HIIT', description: 'Fast intervals for conditioning.', duration_mins: 28, calories: 350, difficulty: 3, exercises: [
    { name: 'Burpees', sets: 5, reps: '40s on / 20s off', rest: '20s', muscle: 'Full Body' },
    { name: 'Kettlebell Swing', sets: 5, reps: '40s on / 20s off', rest: '20s', muscle: 'Posterior Chain' },
    { name: 'Mountain Climbers', sets: 5, reps: '40s on / 20s off', rest: '20s', muscle: 'Core' },
  ] },
  { id: '3', name: 'Bodyweight Core Blast', category: 'Bodyweight', description: 'No equipment full core challenge.', duration_mins: 30, calories: 220, difficulty: 2, exercises: [
    { name: 'Plank', sets: 4, reps: '45s', rest: '30s', muscle: 'Core' },
    { name: 'Hollow Hold', sets: 4, reps: '30s', rest: '30s', muscle: 'Core' },
    { name: 'Russian Twists', sets: 4, reps: '20', rest: '30s', muscle: 'Core' },
  ] },
];

const defaultState: AppState = {
  userId: null,
  profile: null,
  onboardingStep: 1,
  activeWorkout: null,
  workoutIndex: 0,
  planModalOpen: false,
};

const tabs = [
  { key: 'home', label: 'Home', icon: Home, path: '/app/home' },
  { key: 'train', label: 'Train', icon: Dumbbell, path: '/app/train' },
  { key: 'eat', label: 'Eat', icon: Apple, path: '/app/eat' },
  { key: 'progress', label: 'Progress', icon: BarChart3, path: '/app/progress' },
  { key: 'ai', label: 'AI', icon: Bot, path: '/app/ai' },
];

const screenTitles = ['Splash', 'Goal', 'Frequency', 'Fitness', 'Body Stats', 'Loading', 'Projection', 'Social', 'Paywall'];

const buttonClass = 'w-full h-[52px] rounded-xl font-bold text-black bg-[#D4A843]';

function ProtectedRoute({ children, state }: { children: JSX.Element; state: AppState }) {
  if (!state.userId) return <Navigate to="/auth" replace />;
  if (state.profile && !state.profile.onboarding_complete) return <Navigate to="/onboarding" replace />;
  return children;
}

function AuthPage({ onAuthed }: { onAuthed: (userId: string) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (mode === 'signup') {
      const { data, error: signError } = await supabase.auth.signUp({ email, password });
      if (signError || !data.user) return setError(signError?.message ?? 'Unable to sign up');
      await supabase.from('profiles').upsert({ user_id: data.user.id, name: name || 'Athlete', plan_type: 'pro', onboarding_complete: false });
      onAuthed(data.user.id);
      return;
    }
    const { data, error: loginError } = await supabase.auth.signInWithPassword({ email, password });
    if (loginError || !data.user) return setError(loginError?.message ?? 'Unable to login');
    onAuthed(data.user.id);
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 flex items-center justify-center">
      <form onSubmit={submit} className="w-full max-w-md bg-[#111] border border-white/10 rounded-[18px] p-6 space-y-4">
        <h1 className="text-3xl font-bold text-[#D4A843]">BodyVerse</h1>
        <p className="text-white/70">Your body. Your universe.</p>
        {mode === 'signup' && <input className="field" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />}
        <input className="field" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="field" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button className={buttonClass}>{mode === 'signup' ? 'Create Account' : 'Login'}</button>
        <button type="button" className="text-[#D4A843] text-sm" onClick={() => setMode(mode === 'signup' ? 'login' : 'signup')}>
          {mode === 'signup' ? 'Already have an account? Login' : 'Need an account? Sign up'}
        </button>
      </form>
    </div>
  );
}

function Onboarding({ state, setState }: { state: AppState; setState: (v: Partial<AppState>) => void }) {
  const navigate = useNavigate();
  const [goal, setGoal] = useState('Build Muscle');
  const [freq, setFreq] = useState('3-4 days');
  const [fitness, setFitness] = useState(3);
  const [age, setAge] = useState(28);
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [weight, setWeight] = useState(75);
  const [height, setHeight] = useState(178);

  const step = state.onboardingStep;
  const progress = Math.round((step / 9) * 100);
  const hideTop = step === 1;
  const hideSkip = [1, 6, 9].includes(step);
  const hideDots = [1, 6, 9].includes(step);

  useEffect(() => {
    if (step === 6) {
      const timeout = setTimeout(() => setState({ onboardingStep: 7 }), 3000);
      return () => clearTimeout(timeout);
    }
    return undefined;
  }, [step, setState]);

  const completeOnboarding = async () => {
    if (!state.userId) return;
    await supabase.from('profiles').upsert({
      user_id: state.userId,
      goal,
      training_frequency: freq,
      fitness_level: fitness,
      age,
      gender,
      weight_kg: weight,
      height_cm: height,
      onboarding_complete: true,
      plan_type: 'pro',
    });
    setState({ profile: state.profile ? { ...state.profile, onboarding_complete: true, goal, training_frequency: freq, fitness_level: fitness } : state.profile });
    navigate('/app/home');
  };

  const next = () => setState({ onboardingStep: Math.min(9, step + 1) });
  const back = () => setState({ onboardingStep: Math.max(1, step - 1) });

  return (
    <div className="min-h-screen bg-black text-white p-5 flex flex-col">
      <div className="h-1.5 bg-white/10 rounded-full mb-5"><div className="h-full bg-[#D4A843] rounded-full" style={{ width: `${progress}%` }} /></div>
      <div className="flex items-center justify-between mb-4">
        {hideTop ? <span /> : <button onClick={back}><ChevronLeft /></button>}
        <span className="text-sm text-white/50">{screenTitles[step - 1]}</span>
        {hideSkip ? <span /> : <button onClick={() => setState({ onboardingStep: 9 })} className="text-white/70">Skip</button>}
      </div>

      <div className="flex-1 card p-5">
        {step === 1 && <div className="space-y-4"><h1 className="text-4xl font-bold text-[#D4A843]">BodyVerse</h1><p>Workout tracking · AI food scan · AI coach · streaks</p><p className="text-white/60">7-day free trial</p><button className={buttonClass} onClick={next}>Get Started</button></div>}
        {step === 2 && ['Lose Weight', 'Build Muscle', 'Get Fitter', 'Maintain & Tone'].map((v) => <button key={v} onClick={() => { setGoal(v); next(); }} className="w-full text-left p-4 mb-2 rounded-xl border border-white/10 bg-[#1a1a1a]">{v}</button>)}
        {step === 3 && ['1-2 days', '3-4 days', '5-6 days', 'Every day'].map((v) => <button key={v} onClick={() => { setFreq(v); next(); }} className="w-full text-left p-4 mb-2 rounded-xl border border-white/10 bg-[#1a1a1a]">{v}</button>)}
        {step === 4 && <div><p className="mb-4">Fitness level: {fitness}/5</p><input type="range" min={1} max={5} value={fitness} onChange={(e) => setFitness(Number(e.target.value))} className="w-full" /><button onClick={next} className={`${buttonClass} mt-6`}>Continue</button></div>}
        {step === 5 && <div className="space-y-3"><input className="field" value={age} onChange={(e) => setAge(Number(e.target.value))} /><div className="grid grid-cols-2 gap-2"><button onClick={() => setGender('male')} className={`chip ${gender === 'male' ? 'chip-active' : ''}`}>Male</button><button onClick={() => setGender('female')} className={`chip ${gender === 'female' ? 'chip-active' : ''}`}>Female</button></div><input className="field" value={weight} onChange={(e) => setWeight(Number(e.target.value))} /><input className="field" value={height} onChange={(e) => setHeight(Number(e.target.value))} /><button onClick={next} className={buttonClass}>Continue</button></div>}
        {step === 6 && <div className="h-full flex flex-col justify-center items-center gap-4"><div className="w-16 h-16 rounded-full bg-[#D4A843] animate-pulse" /><p>Calculating calories…</p><p>Generating workout plan…</p><p>Setting macros…</p><p>Personalising AI coach…</p></div>}
        {step === 7 && <div className="space-y-4"><h2 className="text-2xl font-bold">12-week projection: -8.5kg</h2><svg viewBox="0 0 300 120" className="w-full"><polyline fill="none" stroke="#D4A843" strokeWidth="3" points="0,20 60,34 120,45 180,62 240,83 300,95" /></svg><div className="grid grid-cols-3 gap-2"><div className="stat">2100 kcal</div><div className="stat">150g protein</div><div className="stat">4 workouts</div></div><button className={buttonClass} onClick={next}>Continue</button></div>}
        {step === 8 && <div className="space-y-3"><p>“Lost 9kg in 11 weeks” ⭐⭐⭐⭐⭐</p><p>“Hit my first pull-up after 6 weeks” ⭐⭐⭐⭐⭐</p><div className="grid grid-cols-3 gap-2"><div className="stat">50K users</div><div className="stat">4.9 stars</div><div className="stat">87% retention</div></div><button className={buttonClass} onClick={next}>Continue</button></div>}
        {step === 9 && <div className="space-y-3"><h2 className="text-2xl font-bold">Choose your plan</h2><div className="card p-3 border-[#D4A843]">Basic $3/mo</div><div className="card p-3 border-[#D4A843] bg-[#20180a]">Pro $14.99/mo (Selected)</div><div className="card p-3 border-white/10">Pro Annual $143.90/yr SAVE 20%</div><div className="card p-3">Today → Day 6 reminder → Day 8 charge</div><button className={buttonClass} onClick={completeOnboarding}>Start Free Trial</button></div>}
      </div>

      {!hideDots && <div className="flex justify-center gap-2 mt-4">{Array.from({ length: 9 }).map((_, idx) => <CircleDot key={idx} className={`w-4 h-4 ${idx + 1 === step ? 'text-[#D4A843]' : 'text-white/30'}`} />)}</div>}
    </div>
  );
}

function AppShell({ state, setState, signOut }: { state: AppState; setState: (v: Partial<AppState>) => void; signOut: () => Promise<void> }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [filter, setFilter] = useState('All');
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const [chat, setChat] = useState([{ from: 'ai', text: 'You are 80% to your weekly target. Keep pushing.' }]);
  const [message, setMessage] = useState('');

  const visible = useMemo(() => workoutsSeed.filter((w) => filter === 'All' || w.category === filter), [filter]);
  const isBasic = state.profile?.plan_type === 'basic';

  const sendMessage = () => {
    if (!message) return;
    setChat((prev) => [...prev, { from: 'user', text: message }, { from: 'ai', text: 'Great question. Focus on sleep and protein tonight.' }]);
    setMessage('');
  };

  if (selectedWorkout) {
    return (
      <main className="pb-24 px-4 pt-6 text-white">
        <button onClick={() => setSelectedWorkout(null)} className="mb-4"><ChevronLeft /></button>
        <h1 className="text-3xl font-bold">{selectedWorkout.name}</h1>
        <p className="text-white/70 mb-4">{selectedWorkout.description}</p>
        <div className="grid grid-cols-4 gap-2 mb-4">{['exercises', 'sets', 'duration', 'calories'].map((s, i) => <div className="stat" key={s}>{i === 0 ? selectedWorkout.exercises.length : i === 1 ? selectedWorkout.exercises.reduce((t, e) => t + e.sets, 0) : i === 2 ? `${selectedWorkout.duration_mins}m` : selectedWorkout.calories}</div>)}</div>
        <div className="space-y-2">{selectedWorkout.exercises.map((ex) => <div className="card p-3" key={ex.name}><p className="font-semibold">{ex.name}</p><p className="text-white/60 text-sm">{ex.sets} x {ex.reps} · Rest {ex.rest}</p><span className="text-xs bg-[#1a1a1a] border border-white/10 px-2 py-1 rounded-full">{ex.muscle}</span></div>)}</div>
        <button className={`${buttonClass} fixed bottom-20 left-4 right-4`} onClick={() => { setState({ activeWorkout: selectedWorkout, workoutIndex: 0 }); setSelectedWorkout(null); }}>
          Start Workout
        </button>
      </main>
    );
  }

  if (state.activeWorkout) {
    const exercise = state.activeWorkout.exercises[state.workoutIndex];
    const done = state.workoutIndex + 1 >= state.activeWorkout.exercises.length;
    return (
      <main className="pb-24 px-4 pt-6 text-white">
        <h1 className="text-3xl font-bold mb-2">{exercise.name}</h1>
        <p className="text-white/60 mb-4">Exercise {state.workoutIndex + 1} of {state.activeWorkout.exercises.length}</p>
        {Array.from({ length: exercise.sets }).map((_, idx) => <div key={idx} className="card p-3 mb-2"><p>Set {idx + 1}</p><div className="grid grid-cols-3 gap-2"><input className="field" placeholder="Weight" /><input className="field" placeholder="Reps" /><button className="chip chip-active"><CheckCircle2 /></button></div></div>)}
        <p className="text-white/50 mb-4">Previous performance: 60kg x 8 reps</p>
        <button className={buttonClass} onClick={() => done ? setState({ activeWorkout: null, workoutIndex: 0 }) : setState({ workoutIndex: state.workoutIndex + 1 })}>{done ? 'Finish Workout' : 'Next Exercise'}</button>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      <main className="px-4 pt-5 space-y-4">
        {location.pathname.endsWith('/home') && <>
          <header className="card p-4"><div className="flex items-center justify-between"><div><p className="text-white/70">Good morning, {state.profile?.name ?? 'Athlete'}</p><h1 className="text-2xl font-bold">Ready to train?</h1></div><span className="chip chip-active"><Flame className="w-4" /> {state.profile?.streak_count ?? 4} Day Streak</span></div><div className="mt-3"><p className="text-sm text-white/60 mb-1">XP Progress</p><div className="h-2 bg-white/10 rounded-full"><div className="h-2 rounded-full bg-[#30D158]" style={{ width: '46%' }} /></div><p className="text-xs mt-1">Bronze · {(state.profile?.xp_total ?? 230)}/500 XP</p></div></header>
          <section className="grid grid-cols-3 gap-2">{['Training Volume', 'Recovery Score', 'Calories Today'].map((m, i) => <div className="stat" key={m}><p className="text-xs">{m}</p><p className="font-bold">{i === 0 ? '12,450kg' : i === 1 ? '84%' : '1,520'}</p></div>)}</section>
          <section className="card p-4"><h2 className="font-bold text-lg mb-1">Today’s Workout</h2><p className="text-white/60">Upper Body Power · 6 exercises · 55 min · 420 kcal</p><button className={`${buttonClass} mt-4`} onClick={() => setSelectedWorkout(workoutsSeed[0])}>Start Workout</button></section>
          <section className="p-4 rounded-[18px] bg-[#111927] border border-[#2d3f69]"><h2 className="font-bold text-lg mb-1">AI Coach</h2><p className="text-blue-100/70">Your squat depth improved. Add a tempo set today.</p><button className="w-full h-[52px] rounded-xl mt-4 font-bold text-white bg-[#304a7c]" onClick={() => navigate('/app/ai')}>Ask Coach</button></section>
          <section className="card p-4"><h2 className="font-bold mb-2">Weekly Activity</h2><div className="grid grid-cols-7 gap-2">{['M','T','W','T','F','S','S'].map((d, i) => <div key={d + i} className="text-center"><div className={`h-20 rounded-lg ${i < 4 ? 'bg-[#D4A843]' : 'bg-[#1a1a1a]'} ${i===4 ? 'border border-[#D4A843]' : ''}`} /><p className="text-xs text-white/60 mt-1">{d}</p></div>)}</div></section>
        </>}

        {location.pathname.endsWith('/train') && <><h1 className="text-3xl font-bold">Workouts</h1><div className="flex gap-2 overflow-auto">{['All', 'Strength', 'HIIT', 'Cardio', 'Bodyweight'].map((x) => <button key={x} className={`chip ${filter === x ? 'chip-active' : ''}`} onClick={() => setFilter(x)}>{x}</button>)}</div><div className="space-y-3">{visible.map((w) => <button className="card p-4 text-left w-full" key={w.id} onClick={() => setSelectedWorkout(w)}><div className="h-24 rounded-xl bg-[#1a1a1a] mb-3" /><div className="flex justify-between items-center"><p className="font-bold">{w.name}</p><span className="text-xs px-2 py-1 bg-[#1a1a1a] rounded-full border border-white/10">{w.category}</span></div><p className="text-sm text-white/60">{w.exercises.length} exercises · {w.duration_mins} min</p><p>{'●'.repeat(w.difficulty)}{'○'.repeat(3 - w.difficulty)}</p></button>)}</div></>}

        {location.pathname.endsWith('/eat') && <><h1 className="text-3xl font-bold">Nutrition</h1><section className="card p-4"><p className="text-white/70 mb-3">Date: Today</p><div className="w-44 h-44 mx-auto rounded-full border-8 border-[#D4A843] flex items-center justify-center"><div className="text-center"><p className="text-3xl font-bold">1520</p><p className="text-xs text-white/60">/2100 kcal</p></div></div><div className="space-y-2 mt-4">{[['Protein', '#30D158', '124/150g'], ['Carbs', '#3b82f6', '168/220g'], ['Fat', '#D4A843', '56/70g'], ['Fiber', '#9b5de5', '24/30g']].map((m) => <div key={m[0]}><div className="flex justify-between text-sm"><span>{m[0]}</span><span>{m[2]}</span></div><div className="h-2 bg-white/10 rounded-full"><div className="h-2 rounded-full" style={{ width: '70%', backgroundColor: m[1] as string }} /></div></div>)}</div></section><section className="space-y-2">{['Breakfast', 'Lunch', 'Dinner', 'Snacks'].map((meal) => <div key={meal} className="card p-4"><p className="font-semibold">{meal}</p><p className="text-sm text-white/60">Logged foods · 320 kcal</p></div>)}</section><button className="fixed bottom-24 right-5 w-14 h-14 rounded-full bg-[#D4A843] text-black text-3xl font-bold">+</button></>}

        {location.pathname.endsWith('/progress') && <><h1 className="text-3xl font-bold">Progress</h1><div className="flex gap-2">{['1W', '1M', '3M', '6M', 'All'].map((r, idx) => <button key={r} className={`chip ${idx === 1 ? 'chip-active' : ''}`}>{r}</button>)}</div><section className="card p-4"><svg viewBox="0 0 360 140" className="w-full"><polyline fill="none" stroke="#D4A843" strokeWidth="4" points="0,20 60,35 120,50 180,64 240,90 300,105 360,110" /></svg></section><section className="grid grid-cols-2 gap-2">{['Weight', 'Body Fat %', 'Waist', 'Chest', 'Hips', 'Bicep'].map((m, idx) => <div key={m} className="stat"><p>{m}</p><p className="font-bold">{idx === 0 ? '74.6kg' : `${20 + idx}.0`}</p><p className="text-[#30D158] text-xs">-0.{idx + 2}</p></div>)}</section><section className="card p-4"><p className="font-semibold mb-2">Progress Photos</p><div className="grid grid-cols-3 gap-2">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-20 bg-[#1a1a1a] rounded-lg" />)}</div></section><button className={buttonClass}>Log Measurement</button><button className={buttonClass}>Add Photo</button></>}

        {location.pathname.endsWith('/ai') && <><div className="flex items-center gap-2"><h1 className="text-3xl font-bold">AI Coach</h1><div className="w-7 h-7 rounded-full bg-[#D4A843]" /></div><section className="card p-4 border-[#D4A843]"><p className="text-[#D4A843]">Tip: Prioritize 30g protein at breakfast tomorrow.</p></section><section className="space-y-2">{chat.map((entry, idx) => <div key={`${entry.text}-${idx}`} className={`p-3 rounded-xl max-w-[85%] ${entry.from === 'ai' ? 'bg-[#151515] border border-white/10' : 'bg-[#D4A843] text-black ml-auto'}`}>{entry.from === 'ai' && <span className="inline-block w-4 h-4 rounded-full bg-[#D4A843] mr-1" />}{entry.text}</div>)}</section><div className="flex flex-wrap gap-2">{['Should I train today?', 'Analyse my nutrition', 'How is my progress?'].map((q) => <button key={q} className="chip">{q}</button>)}</div><div className="fixed bottom-24 left-4 right-4 flex gap-2"><input className="field flex-1" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Ask AI coach..." /><button className="w-12 rounded-xl bg-[#D4A843] text-black flex items-center justify-center" onClick={sendMessage}><Send className="w-5" /></button></div></>}
      </main>

      <button onClick={() => navigate('/app/profile')} className="fixed top-4 right-4 chip"><User className="w-4" /> Profile</button>
      {location.pathname.endsWith('/profile') && <div className="fixed inset-0 bg-black z-40 p-4 overflow-auto"><button onClick={() => navigate('/app/home')}><ChevronLeft /></button><h2 className="text-2xl font-bold mb-3">Profile & Badges</h2><div className="grid grid-cols-3 gap-2">{['Consistency', 'Protein King', 'Volume Beast', 'Meal Logger', 'Hydration', '5AM Club'].map((b) => <div key={b} className="card p-4 text-center"><Crown className="mx-auto text-[#D4A843]" /><p className="text-xs mt-2">{b}</p></div>)}</div><button className="mt-4 chip" onClick={() => signOut()}>Sign out</button></div>}

      {isBasic && <button className="fixed bottom-40 right-5 chip" onClick={() => setState({ planModalOpen: true })}><Lock className="w-4" /> Pro feature</button>}
      {state.planModalOpen && <div className="fixed inset-0 bg-black/80 z-50 flex items-end"><div className="w-full bg-[#111] border border-white/10 rounded-t-[24px] p-5"><h3 className="text-xl font-bold mb-2">Upgrade to Pro</h3><p className="text-white/60 mb-4">Unlock AI food scan, barcode scanner, AI coach and auto adjustments.</p><button className={buttonClass}>Upgrade now</button><button className="w-full h-[52px] font-bold" onClick={() => setState({ planModalOpen: false })}>Not now</button></div></div>}

      <nav className="fixed bottom-0 left-0 right-0 bg-[#0d0d0d] border-t border-white/10 h-20 flex justify-around items-center px-2">
        {tabs.map((item) => {
          const Icon = item.icon;
          const active = location.pathname === item.path;
          return <button key={item.key} className={`flex flex-col items-center text-xs ${active ? 'text-[#D4A843]' : 'text-white/45'}`} onClick={() => navigate(item.path)}><Icon className="w-5" />{item.label}</button>;
        })}
      </nav>
    </div>
  );
}

export default function App() {
  const [state, setStateInternal] = useState<AppState>(defaultState);

  const setState = (value: Partial<AppState>) => setStateInternal((prev) => ({ ...prev, ...value }));

  const loadProfile = async (userId: string) => {
    const { data } = await supabase.from('profiles').select('*').eq('user_id', userId).maybeSingle();
    if (data) {
      setState({ profile: data as Profile, onboardingStep: data.onboarding_complete ? 9 : 1 });
      return;
    }
    const newProfile: Profile = {
      user_id: userId,
      name: 'Athlete',
      goal: null,
      fitness_level: null,
      weight_kg: null,
      height_cm: null,
      age: null,
      gender: null,
      training_frequency: null,
      plan_type: 'pro',
      onboarding_complete: false,
      streak_count: 1,
      xp_total: 200,
      freeze_available: true,
    };
    await supabase.from('profiles').insert(newProfile);
    setState({ profile: newProfile });
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const userId = data.session?.user.id ?? null;
      setState({ userId });
      if (userId) loadProfile(userId);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const userId = session?.user.id ?? null;
      setState({ userId, profile: userId ? state.profile : null });
      if (userId) loadProfile(userId);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setStateInternal(defaultState);
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<AuthPage onAuthed={(userId) => setState({ userId })} />} />
        <Route path="/onboarding" element={state.userId ? <Onboarding state={state} setState={setState} /> : <Navigate to="/auth" replace />} />
        <Route path="/app/*" element={<ProtectedRoute state={state}><Routes><Route path="home" element={<AppShell state={state} setState={setState} signOut={signOut} />} /><Route path="train" element={<AppShell state={state} setState={setState} signOut={signOut} />} /><Route path="eat" element={<AppShell state={state} setState={setState} signOut={signOut} />} /><Route path="progress" element={<AppShell state={state} setState={setState} signOut={signOut} />} /><Route path="ai" element={<AppShell state={state} setState={setState} signOut={signOut} />} /><Route path="profile" element={<AppShell state={state} setState={setState} signOut={signOut} />} /><Route path="*" element={<Navigate to="home" replace />} /></Routes></ProtectedRoute>} />
        <Route path="*" element={<Navigate to={state.userId ? '/app/home' : '/auth'} replace />} />
      </Routes>
    </BrowserRouter>
  );
}
