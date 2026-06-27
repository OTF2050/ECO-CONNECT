import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { API_BASE as API } from '../config';

// Demo pipeline of local entrepreneurs seeking funding
const OPPORTUNITIES = [
  {
    id: 1,
    name: 'Al-Qaw’ah Sidr Beekeeping',
    founder: 'Salem Al Hattawi',
    region: 'Hatta (Dubai)',
    sector: 'Beekeeping & Honey',
    ask: 45000,
    raised: 28000,
    equity: 15,
    roi: '22% / yr',
    stage: 'Scaling',
    summary: 'Expanding from 10 to 40 bee colonies to bottle premium organic Sidr honey for resorts and tourists.',
    tags: ['Organic', 'Tourism-linked', 'Export-ready'],
  },
  {
    id: 2,
    name: 'Heritage Sadu Collective',
    founder: 'Mariam Al Ameri',
    region: 'Liwa Oasis',
    sector: 'Handicrafts',
    ask: 30000,
    raised: 9000,
    equity: 20,
    roi: '18% / yr',
    stage: 'Seed',
    summary: 'A women-led cooperative weaving traditional Sadu rugs with a digital storefront for global collectors.',
    tags: ['Women-led', 'Cultural', 'E-commerce'],
  },
  {
    id: 3,
    name: 'Khalas Premium Dates Co.',
    founder: 'Ahmed Al Marri',
    region: 'Al Ain',
    sector: 'AgriTech',
    ask: 80000,
    raised: 61000,
    equity: 12,
    roi: '26% / yr',
    stage: 'Series A',
    summary: 'Solar-powered sorting and cold-chain packaging line to supply supermarkets across the GCC.',
    tags: ['AgriTech', 'Solar', 'Supply-chain'],
  },
  {
    id: 4,
    name: 'Hatta Eco-Stay Camps',
    founder: 'Latifa Al Suwaidi',
    region: 'Hatta (Dubai)',
    sector: 'Eco-Tourism',
    ask: 120000,
    raised: 34000,
    equity: 25,
    roi: '19% / yr',
    stage: 'Seed',
    summary: 'Low-impact desert eco-lodges with farm-to-table dining and guided heritage experiences.',
    tags: ['Eco-Tourism', 'Hospitality'],
  },
];

const SECTORS = ['Beekeeping & Honey', 'Handicrafts', 'AgriTech', 'Eco-Tourism', 'Dates & Produce'];

export default function InvestorPortal() {
  const { name, logout } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('opportunities');
  const [committed, setCommitted] = useState({
    1: 15000, // Pre-committed for rich initial dashboard state
    3: 20000
  });
  const [selected, setSelected] = useState(null);
  const [pledge, setPledge] = useState('');

  // Market intelligence
  const [sector, setSector] = useState(SECTORS[0]);
  const [region, setRegion] = useState('Hatta (Dubai)');
  const [insight, setInsight] = useState(null);
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [insightErr, setInsightErr] = useState('');

  const fmt = (n) => n.toLocaleString('en-AE');
  const totalCommitted = Object.values(committed).reduce((a, b) => a + b, 0);
  const dealsBacked = Object.keys(committed).length;

  const confirmPledge = () => {
    const amount = parseFloat(pledge);
    if (!selected || !amount || amount <= 0) return;
    setCommitted((prev) => ({ ...prev, [selected.id]: (prev[selected.id] || 0) + amount }));
    setPledge('');
    setSelected(null);
  };

  const loadInsight = async () => {
    setLoadingInsight(true);
    setInsightErr('');
    setInsight(null);
    try {
      const res = await fetch(`${API}/api/market/insights`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sector, region, note: 'Investor due-diligence scan' }),
      });
      if (!res.ok) throw new Error('Insight service unavailable.');
      setInsight(await res.json());
    } catch (e) {
      setInsightErr(e.message || 'Could not load market insight.');
    } finally {
      setLoadingInsight(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07080a] text-zinc-300 antialiased font-sans">
      {/* Sticky header with MOE style */}
      <header className="sticky top-0 z-40 border-b border-zinc-800/60 bg-[#0f1115]/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3 px-4 md:px-8 h-16">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">👑</span>
            <div className="leading-tight text-left">
              <span className="text-sm font-black bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent tracking-wide">ECO CONNECT</span>
              <p className="text-[9px] uppercase tracking-widest text-amber-500/80 font-mono">Investor Console</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-left">
              <div className="w-8 h-8 rounded-full bg-amber-900/40 border border-amber-500/30 flex items-center justify-center text-amber-300 font-bold text-[10px] uppercase">
                {name ? name.substring(0, 2) : 'IN'}
              </div>
              <div className="leading-tight">
                <p className="text-[11px] font-bold text-zinc-200">{name || 'Investor'}</p>
                <p className="text-[9px] text-zinc-500">Funding Partner</p>
              </div>
            </div>
            <button onClick={logout} className="text-[10px] font-bold text-zinc-400 hover:text-red-400 border border-zinc-850 hover:border-red-500/30 rounded-xl px-3.5 py-2 uppercase transition-all cursor-pointer">Logout 🚪</button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 md:px-8 py-6 space-y-6">
        {/* KPI Dashboard Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-left">
          {[
            { label: 'Available Deals', value: OPPORTUNITIES.length, accent: 'text-amber-400' },
            { label: 'Deals Backed', value: dealsBacked, accent: 'text-emerald-400' },
            { label: 'Capital Committed', value: `${fmt(totalCommitted)} AED`, accent: 'text-yellow-500' },
            { label: 'Avg. Target Yield', value: '22% / yr', accent: 'text-teal-400' },
          ].map((kpi) => (
            <div key={kpi.label} className="bg-[#111317] border border-zinc-850 rounded-2xl p-4 flex flex-col justify-between">
              <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">{kpi.label}</p>
              <p className={`text-xl font-black mt-2 ${kpi.accent}`}>{kpi.value}</p>
            </div>
          ))}
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-zinc-850">
          {[
            { id: 'opportunities', label: '💼 Funding Pipeline' },
            { id: 'insights', label: '📊 Market Scans' },
            { id: 'portfolio', label: '📈 Portfolio Analytics' }
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-4 py-3 text-xs font-bold transition-all border-b-2 -mb-px cursor-pointer uppercase tracking-wider ${
                activeTab === t.id 
                  ? 'text-amber-400 border-amber-400' 
                  : 'text-zinc-500 border-transparent hover:text-zinc-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* OPPORTUNITIES TAB */}
        {activeTab === 'opportunities' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-fadeIn text-left">
            {OPPORTUNITIES.map((o) => {
              const pct = Math.min(100, Math.round(((o.raised + (committed[o.id] || 0)) / o.ask) * 100));
              return (
                <div key={o.id} className="bg-[#111317] border border-zinc-850 rounded-2xl p-5 space-y-4 flex flex-col justify-between hover:border-amber-500/20 transition-all duration-300">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start gap-3 flex-wrap">
                      <div>
                        <h3 className="text-sm font-bold text-zinc-100">{o.name}</h3>
                        <p className="text-[10px] text-zinc-500 mt-0.5">👤 {o.founder} · 📍 {o.region}</p>
                      </div>
                      <span className="text-[9px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-300 border border-amber-500/20 px-2 py-0.5 rounded-full">{o.stage}</span>
                    </div>

                    <p className="text-xs text-zinc-400 leading-relaxed font-light">{o.summary}</p>

                    <div className="flex flex-wrap gap-1.5">
                      {o.tags.map((tag) => (
                        <span key={tag} className="text-[9px] font-semibold bg-zinc-950 text-zinc-450 px-2 py-0.5 rounded-full border border-zinc-850">{tag}</span>
                      ))}
                    </div>

                    <div>
                      <div className="flex justify-between text-[10px] font-mono text-zinc-500 mb-1">
                        <span>{fmt(o.raised + (committed[o.id] || 0))} / {fmt(o.ask)} AED</span>
                        <span>{pct}% funded</span>
                      </div>
                      <div className="h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-amber-500 to-yellow-400" style={{ width: `${pct}%` }} />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 bg-zinc-950 p-3 rounded-xl border border-zinc-850 text-center font-mono">
                      <div>
                        <span className="text-[8.5px] text-zinc-500 block">EQUITY</span>
                        <span className="text-xs font-bold text-zinc-200">{o.equity}%</span>
                      </div>
                      <div>
                        <span className="text-[8.5px] text-zinc-500 block">TARGET ROI</span>
                        <span className="text-xs font-bold text-emerald-400">{o.roi}</span>
                      </div>
                      <div>
                        <span className="text-[8.5px] text-zinc-500 block">SECTOR</span>
                        <span className="text-[9px] font-bold text-zinc-300 truncate block">{o.sector}</span>
                      </div>
                    </div>
                  </div>

                  {committed[o.id] ? (
                    <div className="text-center bg-emerald-500/10 border border-emerald-500/30 text-emerald-450 text-xs font-bold py-2.5 rounded-xl uppercase tracking-wider font-mono">
                      ✓ Committed: {fmt(committed[o.id])} AED
                    </div>
                  ) : (
                    <button
                      onClick={() => { setSelected(o); setPledge(''); }}
                      className="w-full bg-gradient-to-r from-amber-600 to-yellow-600 hover:brightness-110 text-white font-bold py-2.5 rounded-xl text-xs uppercase tracking-wide cursor-pointer transition-all shadow-lg"
                    >
                      💰 Pledge Capital
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* MARKET SCANS TAB */}
        {activeTab === 'insights' && (
          <div className="bg-[#111317] border border-zinc-850 rounded-2xl p-5 space-y-5 animate-fadeIn text-left">
            <div>
              <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2"><span>📊</span> Local Market Intelligence</h3>
              <p className="text-[11px] text-zinc-500 mt-1 font-light">Scan demand and opportunity for a sector before committing capital. Powered by the Eco Connect insight engine.</p>
            </div>

            <div className="flex flex-wrap items-end gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-zinc-500">Sector</label>
                <select value={sector} onChange={(e) => setSector(e.target.value)} className="bg-zinc-950 border border-zinc-850 focus:border-amber-500 rounded-xl p-2.5 text-xs text-zinc-300 outline-none">
                  {SECTORS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-zinc-500">Region</label>
                <input value={region} onChange={(e) => setRegion(e.target.value)} className="bg-zinc-950 border border-zinc-850 focus:border-amber-500 rounded-xl p-2.5 text-xs text-zinc-300 outline-none" />
              </div>
              <button onClick={loadInsight} disabled={loadingInsight} className="bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all disabled:opacity-60 cursor-pointer">
                {loadingInsight ? 'Scanning…' : 'Run Scan'}
              </button>
            </div>

            {insightErr && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs p-3 rounded-xl">{insightErr}</div>}

            {insight && (
              <div className="space-y-4">
                <div className="flex items-center gap-4 bg-zinc-950 border border-zinc-850 rounded-xl p-4">
                  <div className="text-center">
                    <p className="text-3xl font-black text-amber-300">{insight.demand_score}</p>
                    <p className="text-[9px] uppercase font-mono text-zinc-500">Demand</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-zinc-100">{insight.demand_label}</p>
                    {!insight.ai_processed && <p className="text-[10px] text-zinc-500">Estimated via rule-based model</p>}
                  </div>
                </div>
                <InsightCol title="🔎 Key Insights" items={insight.insights} />
                <InsightCol title="🚀 Opportunities" items={insight.opportunities} />
                <InsightCol title="🛒 Recommended Products" items={insight.recommended_products} />
                <InsightCol title="⚠️ Risks" items={insight.risks} accent="text-rose-400 animate-pulse" />
              </div>
            )}
          </div>
        )}

        {/* PORTFOLIO TAB */}
        {activeTab === 'portfolio' && (
          <div className="space-y-6 animate-fadeIn text-left">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Asset Allocations */}
              <div className="bg-[#111317] border border-zinc-850 p-5 rounded-2xl space-y-4">
                <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-2">
                  <span>💼</span> Venture Capital Distribution
                </h3>
                <div className="space-y-3">
                  {[
                    { label: 'Sidr Beekeeping (Scaling)', val: committed[1] || 0, color: 'bg-amber-500', pct: totalCommitted ? Math.round(((committed[1] || 0) / totalCommitted) * 100) : 0 },
                    { label: 'Dates Co. (Series A)', val: committed[3] || 0, color: 'bg-emerald-500', pct: totalCommitted ? Math.round(((committed[3] || 0) / totalCommitted) * 100) : 0 },
                    { label: 'Other Active Pledges', val: totalCommitted - (committed[1] || 0) - (committed[3] || 0), color: 'bg-[#c2a14e]', pct: totalCommitted ? Math.round(((totalCommitted - (committed[1] || 0) - (committed[3] || 0)) / totalCommitted) * 100) : 0 }
                  ].map((item) => (
                    <div key={item.label} className="bg-zinc-950/60 p-3 rounded-xl border border-zinc-850/60 space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-zinc-350">{item.label}</span>
                        <span className="font-mono text-zinc-150 font-bold">{fmt(item.val)} AED</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                          <div className={`h-full ${item.color}`} style={{ width: `${item.pct}%` }} />
                        </div>
                        <span className="text-[9.5px] font-mono text-zinc-500 font-bold">{item.pct}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Performance SVG Line Chart */}
              <div className="bg-[#111317] border border-zinc-850 p-5 rounded-2xl lg:col-span-2 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
                    📈 Monthly Dividend Payout Yields
                  </h3>
                  <span className="text-[9px] uppercase font-mono text-emerald-450 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">Compound Interest</span>
                </div>
                <div className="w-full bg-zinc-950/60 p-4 rounded-xl border border-zinc-850/60">
                  <svg className="w-full h-36 overflow-visible" viewBox="0 0 500 120">
                    <defs>
                      <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#d97706" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#d97706" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M 10,90 Q 120,60 220,70 T 430,30 L 490,20 L 490,110 L 10,110 Z"
                      fill="url(#chartGrad)"
                    />
                    <path
                      d="M 10,90 Q 120,60 220,70 T 430,30 L 490,20"
                      fill="none"
                      stroke="#d97706"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                    <circle cx="10" cy="90" r="4" fill="#fbbf24" />
                    <circle cx="220" cy="70" r="4" fill="#fbbf24" />
                    <circle cx="430" cy="30" r="4" fill="#fbbf24" />
                    <circle cx="490" cy="20" r="4" fill="#fbbf24" />
                    <text x="10" y="115" fill="#71717a" fontSize="8" fontFamily="monospace">JAN</text>
                    <text x="120" y="115" fill="#71717a" fontSize="8" fontFamily="monospace">FEB</text>
                    <text x="220" y="115" fill="#71717a" fontSize="8" fontFamily="monospace">MAR</text>
                    <text x="330" y="115" fill="#71717a" fontSize="8" fontFamily="monospace">APR</text>
                    <text x="430" y="115" fill="#71717a" fontSize="8" fontFamily="monospace">MAY</text>
                    <text x="480" y="115" fill="#71717a" fontSize="8" fontFamily="monospace">JUN</text>
                  </svg>
                </div>
              </div>
            </div>

            {/* Dividend ledger & payouts table */}
            <div className="bg-[#111317] border border-zinc-850 p-5 rounded-2xl space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-zinc-150 flex items-center gap-2">
                  <span>📜</span> Dividend &amp; Payout Audit Ledger
                </h3>
                <span className="text-[10px] font-mono text-emerald-450 bg-[#1b3d34] border border-emerald-900/50 px-2.5 py-1 rounded-full">Audited Ledger</span>
              </div>
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left text-xs font-light font-mono text-zinc-400">
                  <thead className="bg-zinc-950 border-b border-zinc-850 text-zinc-500">
                    <tr>
                      <th className="p-3">Payout Date</th>
                      <th className="p-3">Backed Venture</th>
                      <th className="p-3">Category</th>
                      <th className="p-3 text-right">Dividend Amount</th>
                      <th className="p-3 text-right">Audit Code</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-850/60">
                    {[
                      { date: '2026-06-15', entity: 'Al-Qaw’ah Sidr Beekeeping', category: 'Honey Yield', amt: 850, ref: 'DIV-REF-2384' },
                      { date: '2026-05-30', entity: 'Khalas Premium Dates Co.', category: 'Harvest Payout', amt: 1200, ref: 'DIV-REF-1094' },
                      { date: '2026-05-15', entity: 'Al-Qaw’ah Sidr Beekeeping', category: 'Honey Yield', amt: 650, ref: 'DIV-REF-9844' },
                      { date: '2026-04-30', entity: 'Khalas Premium Dates Co.', category: 'Harvest Payout', amt: 1400, ref: 'DIV-REF-5091' }
                    ].map((row, idx) => (
                      <tr key={idx} className="hover:bg-zinc-900/25">
                        <td className="p-3 text-zinc-300 font-semibold">{row.date}</td>
                        <td className="p-3">{row.entity}</td>
                        <td className="p-3 text-zinc-500">{row.category}</td>
                        <td className="p-3 text-right text-emerald-400 font-bold">{row.amt} AED</td>
                        <td className="p-3 text-right text-zinc-550">{row.ref}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Pledge modal */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-[#111317] border border-zinc-850 rounded-2xl p-6 w-full max-w-sm space-y-4 text-left" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-bold text-zinc-100">Pledge Capital to {selected.name}</h3>
            <p className="text-[11px] text-zinc-500 leading-normal font-light">Founder {selected.founder} is raising {fmt(selected.ask)} AED for {selected.equity}% equity (target ROI {selected.roi}).</p>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase font-bold text-zinc-550">Commitment Amount (AED) *</label>
              <input type="number" value={pledge} onChange={(e) => setPledge(e.target.value)} placeholder="e.g. 10000" className="bg-zinc-950 border border-zinc-850 focus:border-amber-500 rounded-xl p-3 text-xs text-zinc-300 outline-none" autoFocus />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setSelected(null)} className="flex-1 border border-zinc-850 text-zinc-400 text-xs font-bold py-2.5 rounded-xl hover:bg-zinc-900/40 uppercase cursor-pointer">Cancel</button>
              <button onClick={confirmPledge} className="flex-1 bg-amber-650 hover:bg-amber-600 text-white text-xs font-bold py-2.5 rounded-xl uppercase cursor-pointer transition-all shadow-md">Confirm Pledge</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InsightCol({ title, items, accent = 'text-zinc-300' }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="bg-zinc-950 border border-zinc-850 rounded-xl p-4">
      <p className="text-xs font-bold text-zinc-200 mb-2">{title}</p>
      <ul className="space-y-1.5">
        {items.map((it, i) => (
          <li key={i} className={`text-[11px] leading-relaxed font-light flex gap-2 ${accent}`}>
            <span className="text-zinc-650">•</span><span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
