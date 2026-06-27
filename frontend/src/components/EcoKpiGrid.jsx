import React, { useEffect, useState } from 'react';

// Live-style eco KPI snapshot grid (MOE Strategist "kpi-grid" pattern, eco-themed)
const KPIS = [
  {
    id: 'water',
    label: 'Water Saved',
    icon: '💧',
    base: 38420,
    unit: 'L',
    change: +12.4,
    accent: '#38bdf8',
    bg: 'from-sky-500/15 to-sky-500/5',
    note: 'vs. flood irrigation baseline',
  },
  {
    id: 'co2',
    label: 'CO₂ Offset',
    icon: '🌍',
    base: 6.8,
    unit: 't',
    change: +8.1,
    accent: '#4ade80',
    bg: 'from-emerald-500/15 to-emerald-500/5',
    note: 'this season',
  },
  {
    id: 'farms',
    label: 'Active Eco Farms',
    icon: '🌾',
    base: 1247,
    unit: '',
    change: +3.6,
    accent: '#c2a14e',
    bg: 'from-amber-500/15 to-amber-500/5',
    note: 'across the network',
  },
  {
    id: 'sustain',
    label: 'Sustainability Index',
    icon: '🏅',
    base: 86,
    unit: '/100',
    change: +2.2,
    accent: '#a78bfa',
    bg: 'from-violet-500/15 to-violet-500/5',
    note: 'MOCCAE composite score',
  },
];

function useTicker(base, jitter) {
  const [value, setValue] = useState(base);
  useEffect(() => {
    const t = setInterval(() => {
      setValue((v) => {
        const delta = (Math.random() - 0.45) * jitter;
        return Math.max(0, v + delta);
      });
    }, 2600);
    return () => clearInterval(t);
  }, [jitter]);
  return value;
}

function KpiCard({ kpi }) {
  const live = useTicker(kpi.base, kpi.base * 0.004);
  const display =
    kpi.base >= 1000 ? Math.round(live).toLocaleString()
    : kpi.base >= 100 ? Math.round(live)
    : live.toFixed(1);

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-zinc-800/70 bg-gradient-to-br ${kpi.bg} p-4`}>
      <div className="flex items-start justify-between">
        <span className="text-2xl">{kpi.icon}</span>
        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2 py-0.5">
          ▲ {kpi.change}%
        </span>
      </div>
      <div className="mt-3">
        <div className="text-2xl font-black text-zinc-100 tabular-nums" style={{ color: kpi.accent }}>
          {display}<span className="text-sm text-zinc-400 font-semibold ml-0.5">{kpi.unit}</span>
        </div>
        <div className="text-xs font-semibold text-zinc-300 mt-0.5">{kpi.label}</div>
        <div className="text-[10px] text-zinc-500 mt-0.5">{kpi.note}</div>
      </div>
      <div className="mt-3 h-1 rounded-full bg-zinc-800 overflow-hidden">
        <div className="h-full rounded-full animate-pulse" style={{ width: '68%', background: kpi.accent }} />
      </div>
    </div>
  );
}

export default function EcoKpiGrid() {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Eco Intelligence · Live Snapshot</h3>
        <span className="text-[9px] text-zinc-500 font-mono ml-auto">UPDATED IN REAL TIME</span>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {KPIS.map((kpi) => <KpiCard key={kpi.id} kpi={kpi} />)}
      </div>
    </div>
  );
}
