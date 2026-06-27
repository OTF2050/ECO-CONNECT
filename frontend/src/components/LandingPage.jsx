import React from 'react';
import Logo from './Logo';

export default function LandingPage() {
  const handleEnterPortal = () => {
    window.location.hash = '#/login';
  };

  return (
    <div className="min-h-screen bg-[#07080a] text-zinc-100 font-sans flex flex-col justify-between overflow-x-hidden relative selection:bg-emerald-700 selection:text-white">
      {/* Background Glow effects */}
      <div className="absolute top-[-10%] left-[-15%] w-[60%] h-[60%] rounded-full bg-emerald-950/15 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-15%] w-[60%] h-[60%] rounded-full bg-[#c2a14e]/5 blur-[120px] pointer-events-none" />

      {/* Landing Header */}
      <header className="w-full max-w-7xl mx-auto px-6 h-20 flex items-center justify-between border-b border-zinc-900/80 z-10">
        <div className="flex items-center gap-3">
          <Logo size="md" />
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => { window.location.hash = '#/souq'; }}
            className="text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition-colors uppercase tracking-wider hidden sm:block"
          >
            Public Souq 🏬
          </button>
          <button
            onClick={() => { window.location.hash = '#/mobile'; }}
            className="text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition-colors uppercase tracking-wider hidden sm:block"
          >
            Mobile Simulator 📱
          </button>
          <button
            onClick={handleEnterPortal}
            className="px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[#c2a14e]/10 text-[#c2a14e] border border-[#c2a14e]/40 hover:bg-[#c2a14e] hover:text-zinc-950 shadow-sm active:scale-95 transition-all cursor-pointer"
          >
            Portal Access 🔑
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center max-w-6xl mx-auto px-6 py-16 text-center z-10 space-y-12">
        <div className="space-y-4 max-w-3xl">
          <span className="inline-flex items-center gap-1.5 text-[9px] font-bold bg-[#1b3d34] text-emerald-455 border border-emerald-900/50 px-3 py-1.5 rounded-full uppercase tracking-widest animate-pulse">
            🇦🇪 Ministry of Climate Change & Environment
          </span>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-zinc-100 leading-none">
            Digital Transformation for <br />
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-[#c2a14e] bg-clip-text text-transparent">
              UAE Sustainable Farming
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-xl mx-auto font-light leading-relaxed">
            Connecting local farmers, tourists, and ESG investors. Promoting food self-sufficiency, ecological governance, and circular economy tools across UAE rural communities.
          </p>
        </div>

        {/* Action Button */}
        <div>
          <button
            onClick={handleEnterPortal}
            className="px-8 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-550 text-white font-bold text-sm tracking-widest uppercase cursor-pointer shadow-lg shadow-emerald-950/40 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all duration-300"
          >
            Enter Platform Dashboards 🚀
          </button>
        </div>

        {/* Challenge Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full pt-8">
          {[
            { id: '1', title: 'Local Founder Accelerator', icon: '🚀', desc: 'Lowers barriers to let rural residents turn artisan skills and crops into licensed agricultural startups.' },
            { id: '2', title: 'SOS Emergency Beacon', icon: '🚨', desc: 'AI-assisted vision and location dispatching to coordinate response for pipeline leaks and veterinary emergencies.' },
            { id: '3', title: 'Live Intent survey Index', icon: '📊', desc: 'Real-time tourist demand tracker helping farmers match pricing and crop distribution with market indices.' }
          ].map(ch => (
            <div key={ch.id} className="bg-zinc-950/60 border border-zinc-900 p-6 rounded-2xl text-left hover:border-zinc-800 transition-all flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-xl shadow-inner">
                  {ch.icon}
                </div>
                <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wide">
                  Challenge {ch.id} — {ch.title}
                </h3>
                <p className="text-[11px] text-zinc-450 leading-relaxed font-light">{ch.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-zinc-900/80 py-6 text-center text-[10px] text-zinc-550 z-10 uppercase tracking-widest">
        © 2026 EcoConnect Initiative · Ministry of Climate Change & Environment
      </footer>
    </div>
  );
}
