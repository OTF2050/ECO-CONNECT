import React, { useEffect, useState } from 'react';
import { API_BASE as API } from '../../config';

const TREND_STYLE = {
  Rising: { color: 'text-emerald-400', bar: 'from-emerald-500 to-teal-400', badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', arrow: '▲' },
  Stable: { color: 'text-amber-300', bar: 'from-amber-500 to-yellow-400', badge: 'bg-amber-500/10 text-amber-300 border-amber-500/20', arrow: '▬' },
  Falling: { color: 'text-rose-400', bar: 'from-rose-500 to-red-400', badge: 'bg-rose-500/10 text-rose-400 border-rose-500/20', arrow: '▼' },
};

// Predictive Demand Analytics widget.
// `compact` renders a tighter version (used inside My Farm as a "Planting Planner").
export default function DemandRadar({ compact = false }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/api/market/demand-forecast`);
      if (!res.ok) throw new Error('Forecast service unavailable.');
      setData(await res.json());
    } catch (e) {
      setError(e.message || 'Could not load demand forecast.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const forecasts = data?.forecasts || [];
  const shown = compact ? forecasts.slice(0, 3) : forecasts;

  return (
    <div className="bg-[#15171e] border border-zinc-800 rounded-2xl p-5 space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">📈</span>
          <div>
            <h3 className="text-sm font-bold text-zinc-100">{compact ? 'Planting Planner' : 'Predictive Demand Radar'}</h3>
            <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">
              {compact ? 'What to plant next' : 'AI crop demand forecast · next 2-6 weeks'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {data && (
            <span className={`text-[9px] font-bold px-2 py-1 rounded-full border ${data.ai_processed ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-zinc-700/40 text-zinc-400 border-zinc-700'}`}>
              {data.ai_processed ? '🤖 AI' : '⚙️ Rule-based'}
            </span>
          )}
          <button onClick={load} className="text-[10px] font-bold text-zinc-400 hover:text-zinc-200 border border-zinc-800 hover:border-zinc-600 rounded-lg px-2.5 py-1 transition-all">↻</button>
        </div>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-xs text-zinc-500 py-4">
          <span className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          Forecasting local demand…
        </div>
      )}

      {error && !loading && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs p-3 rounded-xl">{error}</div>
      )}

      {!loading && !error && (
        <div className={compact ? 'space-y-2.5' : 'grid grid-cols-1 md:grid-cols-2 gap-3'}>
          {shown.map((f) => {
            const st = TREND_STYLE[f.trend] || TREND_STYLE.Stable;
            return (
              <div key={f.crop} className="bg-[#0a0a0a] border border-zinc-850 rounded-xl p-4 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xl shrink-0">{f.icon}</span>
                    <span className="text-sm font-bold text-zinc-100 truncate">{f.crop}</span>
                  </div>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap ${st.badge}`}>{st.arrow} {f.trend}</span>
                </div>

                <div>
                  <div className="flex justify-between text-[10px] font-mono text-zinc-500 mb-1">
                    <span>Demand</span>
                    <span className={st.color}>{f.demand_score}/100</span>
                  </div>
                  <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div className={`h-full bg-gradient-to-r ${st.bar}`} style={{ width: `${f.demand_score}%` }} />
                  </div>
                </div>

                <p className="text-[11px] text-emerald-300/90 font-semibold">🪴 {f.window}</p>
                {!compact && <p className="text-[11px] text-zinc-400 leading-relaxed font-light">{f.advice}</p>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
