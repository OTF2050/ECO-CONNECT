import React, { useState } from 'react';
import { API_BASE } from '../config';

const CROPS = {
  dates: { name: 'Date Palm', icon: '🌴', color: '#c2a14e', baseYield: 2.2, basePrice: 15, metrics: { yield: 82, water: 55, profit: 88, heat: 95, market: 90, labour: 60 } },
  alfalfa: { name: 'Alfalfa', icon: '🌿', color: '#4ade80', baseYield: 4.5, basePrice: 4, metrics: { yield: 70, water: 35, profit: 50, heat: 65, market: 60, labour: 75 } },
  tomato: { name: 'Greenhouse Tomato', icon: '🍅', color: '#f87171', baseYield: 8.0, basePrice: 8, metrics: { yield: 90, water: 70, profit: 78, heat: 45, market: 85, labour: 50 } },
  olive: { name: 'Olive', icon: '🫒', color: '#84cc16', baseYield: 1.8, basePrice: 22, metrics: { yield: 60, water: 60, profit: 72, heat: 80, market: 70, labour: 68 } },
  honey: { name: 'Apiary / Honey', icon: '🍯', color: '#fbbf24', baseYield: 0.8, basePrice: 120, metrics: { yield: 45, water: 90, profit: 80, heat: 70, market: 82, labour: 80 } },
  cucumber: { name: 'Cucumber', icon: '🥒', color: '#34d399', baseYield: 7.2, basePrice: 6, metrics: { yield: 85, water: 50, profit: 65, heat: 50, market: 72, labour: 55 } },
};

const METHODS = {
  soil: { name: 'Traditional Soil', icon: '🪵', yieldMult: 1.0, waterMult: 1.0, costMult: 1.0, label: 'Standard desert soil cultivation' },
  hydro: { name: 'Smart Hydroponics', icon: '💧', yieldMult: 1.35, waterMult: 0.20, costMult: 1.5, label: 'Soilless water recycling channels' },
  aqua: { name: 'Closed Aquaponics', icon: '🐠', yieldMult: 1.45, waterMult: 0.10, costMult: 1.8, label: 'Symbiotic fish & crop ecosystem' }
};

const METRIC_LABELS = [
  { id: 'yield', label: 'Yield' },
  { id: 'water', label: 'Water Efficiency' },
  { id: 'profit', label: 'Profitability' },
  { id: 'heat', label: 'Heat Tolerance' },
  { id: 'market', label: 'Market Demand' },
  { id: 'labour', label: 'Labour Efficiency' },
];

function RadarChart({ a, b }) {
  const size = 240;
  const c = size / 2;
  const r = 92;
  const n = METRIC_LABELS.length;
  const angleFor = (i) => (Math.PI * 2 * i) / n - Math.PI / 2;
  const point = (i, val) => {
    const rad = (val / 100) * r;
    return [c + rad * Math.cos(angleFor(i)), c + rad * Math.sin(angleFor(i))];
  };
  const polygon = (crop) =>
    METRIC_LABELS.map((m, i) => point(i, crop.metrics[m.id]).join(',')).join(' ');

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-[280px] mx-auto">
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <polygon
          key={f}
          points={METRIC_LABELS.map((_, i) => point(i, f * 100).join(',')).join(' ')}
          fill="none"
          stroke="#3f3f46"
          strokeWidth="0.6"
        />
      ))}
      {METRIC_LABELS.map((m, i) => {
        const [x, y] = point(i, 100);
        const [lx, ly] = point(i, 122);
        return (
          <g key={m.id}>
            <line x1={c} y1={c} x2={x} y2={y} stroke="#3f3f46" strokeWidth="0.5" />
            <text x={lx} y={ly} fontSize="7.5" fill="#a1a1aa" textAnchor="middle" dominantBaseline="middle">
              {m.label}
            </text>
          </g>
        );
      })}
      <polygon points={polygon(a)} fill={`${a.color}33`} stroke={a.color} strokeWidth="2" />
      <polygon points={polygon(b)} fill={`${b.color}33`} stroke={b.color} strokeWidth="2" />
    </svg>
  );
}

function BarRow({ label, va, vb, ca, cb }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[11px] text-zinc-400">
        <span>{label}</span>
        <span className="font-mono"><span style={{ color: ca }}>{va}</span> · <span style={{ color: cb }}>{vb}</span></span>
      </div>
      <div className="flex gap-1.5 items-center">
        <div className="flex-1 h-2.5 rounded-full bg-zinc-800 overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${va}%`, background: ca }} />
        </div>
        <div className="flex-1 h-2.5 rounded-full bg-zinc-800 overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${vb}%`, background: cb }} />
        </div>
      </div>
    </div>
  );
}

export default function CropCompare() {
  const [left, setLeft] = useState('dates');
  const [right, setRight] = useState('tomato');
  const [leftMethod, setLeftMethod] = useState('soil');
  const [rightMethod, setRightMethod] = useState('hydro');
  const [dunums, setDunums] = useState(10);
  const [budget, setBudget] = useState(30000);

  // Falcon AI state
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAdvice, setAiAdvice] = useState('');

  const a = CROPS[left];
  const b = CROPS[right];
  const mA = METHODS[leftMethod];
  const mB = METHODS[rightMethod];

  // Weighted score based on crop metrics & farming method efficiency multipliers
  const scoreA = Math.round(
    (a.metrics.yield * mA.yieldMult + a.metrics.water * (2 - mA.waterMult) + a.metrics.profit) / 3
  );
  const scoreB = Math.round(
    (b.metrics.yield * mB.yieldMult + b.metrics.water * (2 - mB.waterMult) + b.metrics.profit) / 3
  );

  const winner = scoreA === scoreB ? null : scoreA > scoreB ? { ...a, method: mA } : { ...b, method: mB };

  // Economic calculations
  const calculateMetrics = (crop, method) => {
    const yieldTons = parseFloat((crop.baseYield * dunums * method.yieldMult).toFixed(1));
    const revenue = Math.round(yieldTons * 1000 * crop.basePrice);
    const capex = Math.round(dunums * 2500 * method.costMult);
    const waterUsed = Math.round((120 - crop.metrics.water) * dunums * method.waterMult * 365); // Liters/yr
    const netProfit = revenue - capex;
    const roi = capex > 0 ? Math.round((netProfit / capex) * 100) : 0;

    return { yieldTons, revenue, capex, waterUsed, netProfit, roi };
  };

  const metricsA = calculateMetrics(a, mA);
  const metricsB = calculateMetrics(b, mB);

  const fetchAiAdvisory = async () => {
    setAiLoading(true);
    setAiAdvice('');
    const promptText = `Compare growing ${a.name} using ${mA.name} vs ${b.name} using ${mB.name} on a ${dunums} dunum farm in the UAE, with a budget of ${budget} AED. Focus on water conservation, startup costs, and return on investment. Make it practical and brief.`;
    try {
      const res = await fetch(`${API_BASE}/api/falcon`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: promptText })
      });
      if (res.ok) {
        const data = await res.json();
        setAiAdvice(data.reply);
      } else {
        setAiAdvice('Advisory service temporarily offline. Please verify network settings.');
      }
    } catch {
      setAiAdvice('Could not reach Falcon Advisory Service.');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto w-full space-y-6">
      {/* Header */}
      <div className="bg-[#15171e] border border-zinc-800/60 rounded-2xl p-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">⚖️</span>
          <div>
            <h2 className="text-md font-bold text-zinc-100">Crop &amp; Method Comparison Studio</h2>
            <p className="text-[10px] text-zinc-400 font-mono">DETERMINE OPTIMAL CROPS, ROI AND WATER footprint</p>
          </div>
        </div>
      </div>

      {/* Farm inputs */}
      <div className="bg-[#15171e] border border-zinc-800/60 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] uppercase font-bold text-zinc-500 tracking-wider mb-1.5">Farm size (Dunums)</label>
          <input type="number" min="1" value={dunums} onChange={(e) => setDunums(parseInt(e.target.value) || 1)} className="w-full bg-[#0a0a0a] border border-zinc-800 rounded-xl p-3 text-xs text-zinc-300 outline-none focus:border-emerald-500" />
        </div>
        <div>
          <label className="block text-[10px] uppercase font-bold text-zinc-500 tracking-wider mb-1.5">Setup budget (AED)</label>
          <input type="number" min="1000" value={budget} onChange={(e) => setBudget(parseInt(e.target.value) || 1000)} className="w-full bg-[#0a0a0a] border border-zinc-800 rounded-xl p-3 text-xs text-zinc-300 outline-none focus:border-emerald-500" />
        </div>
      </div>

      {/* Selectors */}
      <div className="grid grid-cols-2 gap-4">
        {/* Left Side */}
        <div className="bg-[#15171e] border border-zinc-800/60 rounded-2xl p-4 text-center space-y-3">
          <div className="text-4xl">{a.icon}</div>
          <select
            value={left}
            onChange={(e) => setLeft(e.target.value)}
            className="w-full bg-[#0a0a0a] border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-200 outline-none focus:border-emerald-500"
          >
            {Object.entries(CROPS).map(([k, v]) => (
              <option key={k} value={k}>{v.icon} {v.name}</option>
            ))}
          </select>
          <select
            value={leftMethod}
            onChange={(e) => setLeftMethod(e.target.value)}
            className="w-full bg-[#0a0a0a] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-400 outline-none focus:border-emerald-500"
          >
            {Object.entries(METHODS).map(([k, v]) => (
              <option key={k} value={k}>{v.icon} {v.name}</option>
            ))}
          </select>
          <div className="mt-3 text-3xl font-black tabular-nums animate-fadeIn" style={{ color: a.color }}>
            {scoreA}<span className="text-sm text-zinc-500">/100</span>
          </div>
          <div className="text-[10px] text-zinc-500">Agronomic score</div>
        </div>

        {/* Right Side */}
        <div className="bg-[#15171e] border border-zinc-800/60 rounded-2xl p-4 text-center space-y-3">
          <div className="text-4xl">{b.icon}</div>
          <select
            value={right}
            onChange={(e) => setRight(e.target.value)}
            className="w-full bg-[#0a0a0a] border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-200 outline-none focus:border-emerald-500"
          >
            {Object.entries(CROPS).map(([k, v]) => (
              <option key={k} value={k}>{v.icon} {v.name}</option>
            ))}
          </select>
          <select
            value={rightMethod}
            onChange={(e) => setRightMethod(e.target.value)}
            className="w-full bg-[#0a0a0a] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-400 outline-none focus:border-emerald-500"
          >
            {Object.entries(METHODS).map(([k, v]) => (
              <option key={k} value={k}>{v.icon} {v.name}</option>
            ))}
          </select>
          <div className="mt-3 text-3xl font-black tabular-nums animate-fadeIn" style={{ color: b.color }}>
            {scoreB}<span className="text-sm text-zinc-500">/100</span>
          </div>
          <div className="text-[10px] text-zinc-500">Agronomic score</div>
        </div>
      </div>

      {/* Winner banner */}
      {winner && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-center text-sm text-emerald-300">
          🏆 <span className="font-bold">{winner.icon} {winner.name}</span> in <span className="font-bold">{winner.method.name}</span> is recommended for your local conditions.
        </div>
      )}

      {/* Interactive Economic & Metric comparisons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#15171e] border border-zinc-800/60 rounded-2xl p-5">
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-zinc-150 flex items-center gap-2 border-b border-zinc-800 pb-2"><span>📊</span> Projected Yields &amp; Economics</h3>
          <div className="space-y-3 font-mono text-xs">
            <div className="flex justify-between border-b border-zinc-850 py-1">
              <span className="text-zinc-500">Projected Yield:</span>
              <span className="text-zinc-200 font-bold">{metricsA.yieldTons} tons vs {metricsB.yieldTons} tons</span>
            </div>
            <div className="flex justify-between border-b border-zinc-850 py-1">
              <span className="text-zinc-500">Est. Setup CAPEX:</span>
              <span className="text-zinc-200 font-bold">{metricsA.capex.toLocaleString()} AED vs {metricsB.capex.toLocaleString()} AED</span>
            </div>
            <div className="flex justify-between border-b border-zinc-850 py-1">
              <span className="text-zinc-500">Annual Gross Revenue:</span>
              <span className="text-zinc-200 font-bold">{metricsA.revenue.toLocaleString()} AED vs {metricsB.revenue.toLocaleString()} AED</span>
            </div>
            <div className="flex justify-between border-b border-zinc-850 py-1">
              <span className="text-zinc-500">Net Return (Year 1):</span>
              <span className="text-zinc-200 font-bold">{metricsA.netProfit.toLocaleString()} AED vs {metricsB.netProfit.toLocaleString()} AED</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-zinc-500">Projected ROI %:</span>
              <span className={`font-black ${metricsA.roi > metricsB.roi ? 'text-emerald-400' : 'text-amber-400'}`}>{metricsA.roi}% vs {metricsB.roi}%</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-bold text-zinc-150 flex items-center gap-2 border-b border-zinc-800 pb-2"><span>💧</span> Resource &amp; Efficiency Metrics</h3>
          <div className="space-y-3 font-mono text-xs">
            <div className="flex justify-between border-b border-zinc-850 py-1">
              <span className="text-zinc-500">Est. Water Consumption:</span>
              <span className="text-zinc-200 font-bold">{metricsA.waterUsed.toLocaleString()} L/yr vs {metricsB.waterUsed.toLocaleString()} L/yr</span>
            </div>
            <div className="flex justify-between border-b border-zinc-850 py-1">
              <span className="text-zinc-500">Water Conservation Rating:</span>
              <span className="text-emerald-450 font-bold">{(100 - a.metrics.water * mA.waterMult).toFixed(0)}% vs {(100 - b.metrics.water * mB.waterMult).toFixed(0)}%</span>
            </div>
            <div className="flex justify-between border-b border-zinc-850 py-1">
              <span className="text-zinc-500">Labour efficiency rating:</span>
              <span className="text-zinc-300">{a.metrics.labour}% vs {b.metrics.labour}%</span>
            </div>
            <div className="flex justify-between border-b border-zinc-850 py-1">
              <span className="text-zinc-500">Climate tolerance:</span>
              <span className="text-amber-450 font-bold">{a.metrics.heat}% vs {b.metrics.heat}%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Radar */}
        <div className="bg-[#15171e] border border-zinc-800/60 rounded-2xl p-4 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-3">Multi-Metric Radar Map</h3>
            <RadarChart a={a} b={b} />
          </div>
          <div className="flex justify-center gap-4 mt-4 text-[11px]">
            <span className="flex items-center gap-1.5 text-zinc-400"><span className="w-3 h-1.5 rounded-full inline-block" style={{ background: a.color }} />{a.name}</span>
            <span className="flex items-center gap-1.5 text-zinc-400"><span className="w-3 h-1.5 rounded-full inline-block" style={{ background: b.color }} />{b.name}</span>
          </div>
        </div>

        {/* Bars */}
        <div className="bg-[#15171e] border border-zinc-800/60 rounded-2xl p-4 space-y-3.5">
          <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">Detailed Base Ratings</h3>
          {METRIC_LABELS.map((m) => (
            <BarRow key={m.id} label={m.label} va={a.metrics[m.id]} vb={b.metrics[m.id]} ca={a.color} cb={b.color} />
          ))}
        </div>
      </div>

      {/* Falcon AI Advisory Section */}
      <div className="bg-[#1c1810] border border-[#9b7a36]/40 p-5 rounded-2xl space-y-4">
        <div className="flex justify-between items-center flex-wrap gap-3">
          <div>
            <h4 className="text-sm font-bold text-zinc-150 flex items-center gap-2"><span>🦅</span> Falcon Agronomist Comparison Matchup</h4>
            <p className="text-[10px] text-[#a89060] font-mono mt-0.5">RUN DUAL-MODE CROP PREDICTOR SCAN</p>
          </div>
          <button
            onClick={fetchAiAdvisory}
            disabled={aiLoading}
            className="bg-[#9b7a36] hover:bg-[#b08c45] text-white font-bold py-2.5 px-5 rounded-xl text-xs transition-all disabled:opacity-40 cursor-pointer shadow-lg"
          >
            {aiLoading ? 'Synthesizing...' : 'Scan with Falcon AI 🔮'}
          </button>
        </div>

        {aiAdvice && (
          <div className="bg-[#0f0b05] border border-[#9b7a36]/20 p-4 rounded-xl text-xs text-[#e9dcc0] leading-relaxed font-light whitespace-pre-wrap">
            {aiAdvice}
          </div>
        )}
      </div>
    </div>
  );
}
