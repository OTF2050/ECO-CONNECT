import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { API_BASE } from '../config';

export default function EcoCreditsPanel() {
  const { token, ecoCredits, refreshCredits, name } = useContext(AuthContext);
  const [rewards, setRewards] = useState([]);
  const [loadingRewards, setLoadingRewards] = useState(false);
  const [redeemingId, setRedeemingId] = useState(null);
  const [redemptionResult, setRedemptionResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Local state for static/mock leaderboard & achievements
  const leaderboard = [
    { name: 'Eng. Fatima Al Mazrouei', role: 'Admin', credits: 420, avatar: '🏛️' },
    { name: name || 'You', role: 'Participant', credits: ecoCredits, avatar: '👤', isUser: true },
    { name: 'Salem Al Hattawi', role: 'Farmer', credits: 240, avatar: '🌾' },
    { name: 'Ramesh Kumar', role: 'Worker', credits: 195, avatar: '👷' },
    { name: 'John Doe', role: 'Tourist', credits: 85, avatar: '🐫' },
  ].sort((a, b) => b.credits - a.credits);

  const achievements = [
    { id: 'guardian', title: 'Eco Guardian', desc: 'Acquire > 150 Eco-Credits.', icon: '🌳', unlocked: ecoCredits >= 150 },
    { id: 'patron', title: 'Market Patron', desc: 'Complete a circular market deal.', icon: '🏷️', unlocked: true },
    { id: 'pioneer', title: 'Logistics Pro', desc: 'Participate in a hub carpool.', icon: '🚚', unlocked: false },
    { id: 'shield', title: 'Eco Shield', desc: 'Resolve an environmental ticket.', icon: '🛡️', unlocked: ecoCredits >= 200 },
  ];

  const fetchRewards = async () => {
    setLoadingRewards(true);
    setErrorMsg('');
    try {
      const res = await fetch(`${API_BASE}/api/rewards`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Failed to retrieve rewards catalog.');
      const data = await res.json();
      setRewards(data);
    } catch (err) {
      setErrorMsg(err.message || 'Error loading rewards.');
    } finally {
      setLoadingRewards(false);
    }
  };

  useEffect(() => {
    fetchRewards();
  }, []);

  const handleRedeem = async (rewardId) => {
    setRedeemingId(rewardId);
    setErrorMsg('');
    setRedemptionResult(null);

    try {
      const res = await fetch(`${API_BASE}/api/rewards/redeem`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reward_id: rewardId }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Redemption failed. Check balance.');
      }

      setRedemptionResult(data);
      refreshCredits(); // Update context credits
    } catch (err) {
      setErrorMsg(err.message || 'Could not complete redemption.');
    } finally {
      setRedeemingId(null);
    }
  };

  return (
    <div className="w-full bg-zinc-950/80 border border-zinc-800/80 rounded-3xl p-6 backdrop-blur-xl shadow-2xl space-y-6">
      {/* Overview Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500/10 via-yellow-500/5 to-transparent border border-amber-500/20 p-6 flex flex-wrap items-center justify-between gap-4">
        {/* Glow effects */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-500/10 blur-3xl rounded-full pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-yellow-500/10 blur-2xl rounded-full pointer-events-none" />

        <div className="space-y-1">
          <span className="text-[10px] font-bold tracking-widest uppercase text-amber-400/90 border border-amber-500/30 rounded-full px-2.5 py-0.5 bg-amber-500/5">
            Ministry of Climate Change & Environment
          </span>
          <h2 className="text-2xl font-black text-zinc-100 mt-2 tracking-tight">Eco-Credits Dashboard</h2>
          <p className="text-xs text-zinc-400">Awarded for active carbon reduction, local guide hosting, and sustainable operations.</p>
        </div>

        {/* Large Counter */}
        <div className="flex items-center gap-3 bg-black/40 border border-zinc-800/80 rounded-2xl px-5 py-3.5 shadow-inner">
          <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-xl shadow-md animate-pulse">🪙</div>
          <div className="leading-tight">
            <span className="text-3xl font-black bg-gradient-to-r from-amber-400 to-yellow-300 bg-clip-text text-transparent">{ecoCredits}</span>
            <p className="text-[9px] uppercase tracking-widest font-bold text-zinc-500 font-mono">Total Points</p>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {errorMsg && (
        <div className="bg-rose-950/20 border border-rose-800/40 rounded-xl px-4 py-3 text-xs text-rose-300 flex items-center gap-2 animate-bounce">
          <span>⚠️</span> {errorMsg}
        </div>
      )}

      {redemptionResult && (
        <div className="bg-emerald-950/20 border border-emerald-800/40 rounded-xl p-4 space-y-2 text-xs text-emerald-300">
          <div className="flex items-center gap-2 font-bold text-emerald-200">
            <span>🎉</span> {redemptionResult.message}
          </div>
          <p className="text-zinc-400 text-[11px]">Copy the voucher code below to use at the municipal or market checkout:</p>
          <div className="flex items-center justify-between gap-3 bg-black/40 border border-zinc-800 rounded-lg p-2.5 font-mono select-all text-sm tracking-wide">
            <span>{redemptionResult.voucher_code}</span>
            <button
              onClick={() => navigator.clipboard.writeText(redemptionResult.voucher_code)}
              className="text-[10px] px-2 py-1 rounded bg-zinc-800 text-zinc-300 hover:bg-zinc-700 active:scale-95 transition-all cursor-pointer"
            >
              Copy 📋
            </button>
          </div>
        </div>
      )}

      {/* Grid Layout Showing All Sections simultaneously */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Left Side: Rewards Store (3/5 Columns) */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800/60 pb-2">
            <h3 className="text-xs uppercase tracking-widest font-mono font-bold text-amber-400 flex items-center gap-1.5">
              <span>🎁</span> Rewards Catalog
            </h3>
            <button onClick={fetchRewards} className="text-[10px] text-zinc-550 hover:text-zinc-300 transition-all">Reload 🔄</button>
          </div>

          {loadingRewards && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-zinc-900/40 border border-zinc-800 animate-pulse rounded-2xl p-4 h-28" />
              ))}
            </div>
          )}

          {!loadingRewards && rewards.length === 0 && (
            <p className="text-center text-xs text-zinc-600 py-8">No reward items found in catalog.</p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {rewards.map((reward) => {
              const isAffordable = ecoCredits >= reward.cost_credits;
              return (
                <div
                  key={reward.id}
                  className={`bg-zinc-900/20 border rounded-2xl p-4 flex flex-col justify-between gap-4 transition-all duration-300 hover:-translate-y-0.5 ${isAffordable ? 'border-zinc-800 hover:border-zinc-700' : 'border-zinc-900/60 opacity-60'}`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[9px] uppercase tracking-widest font-bold font-mono px-2 py-0.5 rounded bg-zinc-800/80 text-zinc-400">
                        {reward.category}
                      </span>
                      <div className="flex items-center gap-1 text-amber-400 text-xs font-extrabold font-mono">
                        <span>🪙</span> {reward.cost_credits} pts
                      </div>
                    </div>
                    <h4 className="text-xs font-bold text-zinc-200">{reward.title}</h4>
                    <p className="text-[10px] text-zinc-500 leading-normal font-light">{reward.description}</p>
                  </div>

                  <button
                    onClick={() => handleRedeem(reward.id)}
                    disabled={!isAffordable || redeemingId !== null}
                    className={`w-full py-2 rounded-xl text-[10px] font-bold tracking-wide uppercase transition-all duration-300 cursor-pointer ${isAffordable ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-md active:scale-95' : 'bg-zinc-900 text-zinc-600 border border-zinc-800/10 cursor-not-allowed'}`}
                  >
                    {redeemingId === reward.id ? 'Processing…' : (isAffordable ? 'Redeem Voucher' : 'Need Credits')}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Achievements & Leaderboard (2/5 Columns) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Achievements widget */}
          <div className="space-y-3.5">
            <h3 className="text-xs uppercase tracking-widest font-mono font-bold text-amber-400 flex items-center gap-1.5 border-b border-zinc-800/60 pb-2">
              <span>🌳</span> Badges & Milestones
            </h3>
            <div className="grid grid-cols-1 gap-2.5">
              {achievements.map((badge) => (
                <div
                  key={badge.id}
                  className={`border rounded-2xl p-3 flex gap-3 transition-all duration-300 ${badge.unlocked ? 'bg-amber-500/5 border-amber-500/20' : 'bg-zinc-900/10 border-zinc-900/40 opacity-40'}`}
                >
                  <div className={`w-8 h-8 shrink-0 rounded-xl flex items-center justify-center text-sm ${badge.unlocked ? 'bg-amber-500/15 border border-amber-500/20 text-amber-300' : 'bg-zinc-800 text-zinc-650'}`}>
                    {badge.icon}
                  </div>
                  <div className="leading-tight space-y-0.5 min-w-0">
                    <p className={`text-xs font-bold ${badge.unlocked ? 'text-amber-200' : 'text-zinc-500'}`}>{badge.title}</p>
                    <p className="text-[10px] text-zinc-500 leading-snug truncate">{badge.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Leaderboard widget */}
          <div className="space-y-3.5">
            <h3 className="text-xs uppercase tracking-widest font-mono font-bold text-amber-400 flex items-center gap-1.5 border-b border-zinc-800/60 pb-2">
              <span>🏆</span> Community Leaderboard
            </h3>
            <div className="bg-black/35 border border-zinc-800/80 rounded-2xl p-3 space-y-2">
              {leaderboard.map((item, idx) => (
                <div
                  key={idx}
                  className={`flex items-center justify-between gap-3 p-2 rounded-xl transition-all ${item.isUser ? 'bg-gradient-to-r from-amber-500/10 to-transparent border border-amber-500/20 shadow-md' : ''}`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`text-[10px] font-bold font-mono w-4 text-center ${idx === 0 ? 'text-yellow-400' : idx === 1 ? 'text-zinc-400' : 'text-zinc-600'}`}>
                      #{idx + 1}
                    </span>
                    <span className="text-xs">{item.avatar}</span>
                    <div className="leading-tight min-w-0">
                      <p className={`text-xs font-bold truncate ${item.isUser ? 'text-amber-300' : 'text-zinc-300'}`}>{item.name}</p>
                      <p className="text-[9px] text-zinc-550 truncate">{item.role}</p>
                    </div>
                  </div>
                  <span className="text-xs font-extrabold font-mono text-zinc-400 shrink-0">{item.credits} pts</span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
