import React, { useState } from 'react';
import Logo from './Logo';

const SKILLS = ['Harvesting', 'Machine Operation', 'Animal Care', 'Irrigation & Drip Systems', 'Beekeeping'];

// First-time worker onboarding. Captures a lightweight profile in localStorage
// (no backend dependency) then hands control back to the WorkerDashboard.
export default function WorkerSignUp({ defaultName = '', onComplete }) {
  const [fullName, setFullName] = useState(defaultName);
  const [skill, setSkill] = useState(SKILLS[0]);
  const [rate, setRate] = useState(25);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!fullName.trim()) return;
    setSubmitting(true);
    const profile = {
      name: fullName.trim(),
      skill,
      hourlyRate: Number(rate) || 0,
      onboardedAt: new Date().toISOString(),
    };
    try {
      localStorage.setItem('eco_worker_profile', JSON.stringify(profile));
      localStorage.setItem('eco_worker_onboarded', '1');
    } catch {
      /* localStorage unavailable — proceed anyway */
    }
    // Brief delay for a polished transition, then enter the dashboard
    setTimeout(() => onComplete && onComplete(profile), 600);
  };

  return (
    <div className="min-h-screen bg-[#07080a] flex flex-col items-center justify-center p-6 text-zinc-100 font-sans">
      <div className="w-full max-w-lg bg-zinc-950/80 border border-zinc-800 rounded-3xl p-8 space-y-6 shadow-2xl">
        <div className="flex justify-between items-start text-left">
          <div>
            <Logo size="sm" className="mb-1" />
            <h2 className="text-lg font-bold text-zinc-100 mt-1">Worker Sign-Up</h2>
            <p className="text-xs text-zinc-500">Set up your farm employee profile to get started.</p>
          </div>
          <span className="text-3xl">👷</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase font-bold text-zinc-550 tracking-wider">Full Name *</label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Ramesh Kumar"
              required
              className="bg-[#0a0c10] border border-zinc-800 focus:border-emerald-500 rounded-xl p-3 text-xs text-zinc-200 outline-none transition-all"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase font-bold text-zinc-550 tracking-wider">Primary Skillset *</label>
            <select
              value={skill}
              onChange={(e) => setSkill(e.target.value)}
              className="bg-[#0a0c10] border border-zinc-800 focus:border-emerald-500 rounded-xl p-3 text-xs text-zinc-200 outline-none transition-all"
            >
              {SKILLS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] uppercase font-bold text-zinc-550 tracking-wider">Expected Hourly Rate</label>
              <span className="text-sm font-black text-emerald-400 font-mono">{rate} AED/hr</span>
            </div>
            <input
              type="range"
              min="10"
              max="120"
              step="5"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              className="w-full accent-emerald-600 cursor-pointer"
            />
            <div className="flex justify-between text-[9px] text-zinc-600 font-mono">
              <span>10 AED</span>
              <span>120 AED</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:brightness-110 text-white font-bold py-3 rounded-xl text-xs uppercase cursor-pointer transition-all shadow-md active:scale-95 disabled:opacity-50"
          >
            {submitting ? 'Setting up your dashboard…' : 'Enter Worker Dashboard 🚀'}
          </button>
        </form>
      </div>
    </div>
  );
}
