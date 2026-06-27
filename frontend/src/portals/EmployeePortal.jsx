import React, { useContext, useMemo, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { API_BASE } from '../config';
import EcoCreditsPanel from '../components/EcoCreditsPanel';import TeamChat from '../components/TeamChat';
import TaskManager from '../components/TaskManager';
import WorkerSignUp from '../components/WorkerSignUp';

// Tailwind classes for each task priority badge
const PRIORITY_STYLE = {
  high: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
  medium: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  low: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
};

// Recent payslip history (demo data — no backend dependency)
const PAYSLIPS = [
  { month: 'June 2026', days: 25, gross: 4500, status: 'Pending' },
  { month: 'May 2026', days: 26, gross: 4680, status: 'Paid' },
  { month: 'April 2026', days: 24, gross: 4320, status: 'Paid' },
];
// ── STATEFUL ROSTER INTEGRATION ─────────────────────────────────────────────
const getRosterProfile = (name) => {
  const staff = JSON.parse(localStorage.getItem('eco_employees_staff') || '[]');
  const current = staff.find(e => e.name.toLowerCase().includes((name || '').toLowerCase())) || {
    id: 'EMP-04',
    name: name || 'Ramesh Kumar',
    role: 'Senior Farm Hand',
    shift: '06:00 – 14:00',
    wage: 4680,
    attendance: 96,
    status: 'On Duty'
  };
  return {
    ...current,
    dailyWage: Math.round(current.wage / 26),
    currency: 'AED',
    farm: 'Al Hattawi Organic Farm — Hatta (Dubai)',
    supervisor: 'Salem Al Hattawi'
  };
};

export default function EmployeePortal() {
  const { name, logout, token, refreshCredits } = useContext(AuthContext);

  const PROFILE = useMemo(() => getRosterProfile(name), [name]);

  // Active workspace view: dashboard | tasks | chat
  const [activeView, setActiveView] = useState('dashboard');

  // First-time worker onboarding gate (lightweight, localStorage-backed)
  const [needsOnboarding, setNeedsOnboarding] = useState(
    () => localStorage.getItem('eco_worker_onboarded') !== '1'
  );

  // Load stateful tasks assigned by farmer
  const PRIORITIES = ['high', 'medium', 'low'];
  const [tasks, setTasks] = useState(() => {
    const allTasks = JSON.parse(localStorage.getItem('eco_employees_tasks') || '{}');
    const list = allTasks[PROFILE.id] || [
      'Irrigate east date palm sector',
      'Inspect bee colonies (boxes 1–10)',
      'Sort & pack Khalas dates for resort order'
    ];
    return list.map((t, idx) => ({ id: idx, title: t, done: false, priority: PRIORITIES[idx % PRIORITIES.length] }));
  });

  const [clockedIn, setClockedIn] = useState(PROFILE.status === 'On Duty');
  const [clockTime, setClockTime] = useState(PROFILE.status === 'On Duty' ? '06:00 AM' : null);

  // Timesheet state
  const [loggedShifts, setLoggedShifts] = useState([
    { date: '2026-06-25', hours: 8, notes: 'Set up subsurface drip irrigation pipelines.' },
    { date: '2026-06-24', hours: 7.5, notes: 'Inspected honey hives. Added 2 super frames.' }
  ]);
  const [logDate, setLogDate] = useState('');
  const [logHours, setLogHours] = useState('');
  const [logNotes, setLogNotes] = useState('');

  const completed = tasks.filter((t) => t.done).length;
  const progress = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;
  const earnedThisMonth = useMemo(() => Math.round(PROFILE.dailyWage * (PROFILE.attendance / 100) * 26), [PROFILE]);

  const toggleTask = async (id) => {
    let clickedTask = null;
    const nextTasks = tasks.map((t) => {
      if (t.id === id) {
        clickedTask = t;
        return { ...t, done: !t.done };
      }
      return t;
    });
    setTasks(nextTasks);

    if (clickedTask && !clickedTask.done) {
      try {
        const res = await fetch(`${API_BASE}/api/employee/award-task`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ task_title: clickedTask.title })
        });
        if (res.ok) {
          refreshCredits();
        }
      } catch (err) {
        console.error('Failed to award task credits:', err);
      }
    }
  };

  const toggleClock = () => {
    const nextClocked = !clockedIn;
    setClockedIn(nextClocked);
    const nextStatus = nextClocked ? 'On Duty' : 'Off Duty';

    // Update in shared localStorage staff roster
    const staff = JSON.parse(localStorage.getItem('eco_employees_staff') || '[]');
    const updatedStaff = staff.map(s => {
      if (s.id === PROFILE.id || s.name.toLowerCase() === (name || '').toLowerCase()) {
        return { ...s, status: nextStatus };
      }
      return s;
    });
    localStorage.setItem('eco_employees_staff', JSON.stringify(updatedStaff));

    setClockTime(new Date().toLocaleTimeString('en-AE', { hour: '2-digit', minute: '2-digit' }));
  };

  const handleLogShift = (e) => {
    e.preventDefault();
    if (!logDate || !logHours) return;
    const newShift = { date: logDate, hours: parseFloat(logHours), notes: logNotes };
    setLoggedShifts([newShift, ...loggedShifts]);
    setLogDate('');
    setLogHours('');
    setLogNotes('');
  };

  // First-time workers complete a quick sign-up before seeing the dashboard
  if (needsOnboarding) {
    return (
      <WorkerSignUp
        defaultName={name}
        onComplete={() => setNeedsOnboarding(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#07080a] text-zinc-300 antialiased font-sans">
      {/* Sticky header with MOE style */}
      <header className="sticky top-0 z-40 border-b border-zinc-800/60 bg-[#0f1115]/90 backdrop-blur-md">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3 px-4 md:px-8 h-16">
          <Logo size="md" subtitle="Operations Portal" />
          <div className="flex items-center gap-3">
            <button
              onClick={toggleClock}
              className={`text-[10px] font-bold rounded-xl px-3.5 py-2 border uppercase tracking-wider cursor-pointer transition-all ${
                clockedIn 
                  ? 'bg-emerald-500/10 text-emerald-450 border-emerald-500/30' 
                  : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-750'
              }`}
            >
              {clockedIn ? `🟢 Active Shift · ${clockTime}` : '⏱️ Clock In'}
            </button>
            <button onClick={logout} className="text-[10px] font-bold text-zinc-400 hover:text-red-400 border border-zinc-850 hover:border-red-500/30 rounded-xl px-3.5 py-2 uppercase transition-all cursor-pointer">Logout 🚪</button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 md:px-8 py-6 space-y-6">
        {/* Profile Card */}
        <div className="bg-[#111317] border border-zinc-800/60 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4 text-left">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#c2a14e]/20 to-yellow-600/15 border border-[#c2a14e]/30 flex items-center justify-center text-[#c2a14e] font-bold text-sm uppercase">
              {name ? name.substring(0, 2) : 'EM'}
            </div>
            <div>
              <h2 className="text-md font-bold text-zinc-100">Marhaban, {name || 'Worker'} 👋</h2>
              <p className="text-[11px] text-zinc-450">{PROFILE.role} · {PROFILE.farm}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase font-mono text-zinc-500">Scheduled shift</p>
            <p className="text-xs font-bold text-zinc-200">{PROFILE.shift}</p>
          </div>
        </div>

        {/* Workspace tab navigation */}
        <div className="flex items-center gap-2 border-b border-zinc-850 overflow-x-auto scrollbar-none">
          {[
            { id: 'dashboard', label: '📊 My Dashboard' },
            { id: 'tasks', label: '🗂️ Task Board' },
            { id: 'chat', label: '💬 Team Chat' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveView(t.id)}
              className={`px-4 py-3 text-xs font-bold transition-all border-b-2 -mb-px cursor-pointer uppercase tracking-wider whitespace-nowrap ${
                activeView === t.id
                  ? 'text-[#c2a14e] border-[#c2a14e]'
                  : 'text-zinc-500 border-transparent hover:text-zinc-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {activeView === 'dashboard' && (
          <>
        {/* KPI Dashboard Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-left">
          {[
            { label: 'Tasks Done', value: `${completed}/${tasks.length}`, accent: 'text-emerald-400' },
            { label: 'Attendance', value: `${PROFILE.attendance}%`, accent: 'text-yellow-500' },
            { label: 'Daily Rate', value: `${PROFILE.dailyWage} AED`, accent: 'text-zinc-200' },
            { label: 'Est. Monthly Payout', value: `${earnedThisMonth.toLocaleString()} AED`, accent: 'text-emerald-400' },
          ].map((kpi) => (
            <div key={kpi.label} className="bg-[#111317] border border-zinc-850 rounded-2xl p-4 flex flex-col justify-between">
              <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">{kpi.label}</p>
              <p className={`text-xl font-black mt-2 ${kpi.accent}`}>{kpi.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
          {/* Daily task checklist */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-[#111317] border border-zinc-850 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2"><span>📋</span> Daily Operations Checklist</h3>
                <span className="text-[11px] font-bold text-emerald-400">{progress}% Complete</span>
              </div>
              <div className="h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all" style={{ width: `${progress}%` }} />
              </div>

              <div className="space-y-2">
                {tasks.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => toggleTask(t.id)}
                    className={`w-full flex items-center gap-3 text-left bg-zinc-950 border rounded-xl p-3.5 transition-all cursor-pointer ${
                      t.done ? 'border-emerald-950/60 opacity-60' : 'border-zinc-850 hover:border-zinc-800'
                    }`}
                  >
                    <span className={`w-5 h-5 shrink-0 rounded-md border flex items-center justify-center text-[10px] ${
                      t.done ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-zinc-700 bg-zinc-900'
                    }`}>
                      {t.done ? '✓' : ''}
                    </span>
                    <span className={`flex-1 text-xs font-semibold ${t.done ? 'line-through text-zinc-500' : 'text-zinc-350'}`}>{t.title}</span>
                    <span className={`text-[8px] font-bold uppercase border px-2 py-0.5 rounded-full tracking-wider ${PRIORITY_STYLE[t.priority]}`}>
                      {t.priority}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Shift Logs Table */}
            <div className="bg-[#111317] border border-zinc-850 rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2"><span>⏱️</span> Timesheet Logs</h3>
              <div className="space-y-3">
                {loggedShifts.map((s, idx) => (
                  <div key={idx} className="bg-zinc-950 border border-zinc-850 p-4 rounded-xl text-xs space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-zinc-300">{s.date}</span>
                      <span className="font-mono bg-zinc-900 text-[#c2a14e] px-2 py-0.5 rounded border border-zinc-800">{s.hours} Hours</span>
                    </div>
                    <p className="text-zinc-500 font-light leading-relaxed">{s.notes}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Clocking & Timesheet Form */}
          <div className="space-y-6">
            {/* Log Hours Form */}
            <div className="bg-[#111317] border border-zinc-850 rounded-2xl p-5 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2"><span>📝</span> Log Operations Hours</h3>
                <p className="text-[10px] text-zinc-500 mt-1">Submit your completed shifts directly to the supervisor vault.</p>
              </div>

              <form onSubmit={handleLogShift} className="space-y-3">
                <div>
                  <label className="block text-[9px] uppercase font-bold text-zinc-550 mb-1.5">Shift Date *</label>
                  <input
                    type="date"
                    value={logDate}
                    onChange={(e) => setLogDate(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-850 focus:border-amber-500 rounded-xl p-2.5 text-xs text-zinc-350 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[9px] uppercase font-bold text-zinc-550 mb-1.5">Hours Worked *</label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    max="16"
                    value={logHours}
                    onChange={(e) => setLogHours(e.target.value)}
                    placeholder="e.g. 8"
                    className="w-full bg-zinc-950 border border-zinc-850 focus:border-amber-500 rounded-xl p-2.5 text-xs text-zinc-350 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[9px] uppercase font-bold text-zinc-550 mb-1.5">Work Description</label>
                  <textarea
                    value={logNotes}
                    onChange={(e) => setLogNotes(e.target.value)}
                    placeholder="Describe tasks completed..."
                    rows={3}
                    className="w-full bg-zinc-950 border border-zinc-850 focus:border-amber-500 rounded-xl p-2.5 text-xs text-zinc-350 outline-none resize-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-amber-600 to-yellow-600 hover:brightness-110 text-white font-bold py-3 rounded-xl text-xs uppercase cursor-pointer transition-all"
                >
                  Submit Shift Entry
                </button>
              </form>
            </div>

            {/* Payslips Card */}
            <div className="bg-[#111317] border border-[#c2a14e]/20 rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-zinc-150 flex items-center gap-2"><span>💳</span> Monthly Payslips</h3>
              <div className="space-y-2">
                {PAYSLIPS.map((p) => (
                  <div key={p.month} className="bg-zinc-950 border border-zinc-850 rounded-xl p-3 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-zinc-300">{p.month}</p>
                      <p className="text-[9px] text-zinc-500 font-mono">{p.days} days active</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-emerald-450">{p.gross} AED</p>
                      <span className="text-[8px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-450 px-1.5 py-0.5 rounded font-bold uppercase">{p.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Eco Credits Section */}
        <div className="mt-6">
          <EcoCreditsPanel />
        </div>
          </>
        )}

        {activeView === 'tasks' && <TaskManager />}

        {activeView === 'chat' && <TeamChat />}
      </main>
    </div>
  );
}
