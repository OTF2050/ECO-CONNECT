import React from 'react';

// Unified Eco Connect brand mark — emblem + wordmark.
// Used across every portal and section so the logo is identical everywhere.
const SIZES = {
  sm: { img: 'w-7 h-7', text: 'text-sm' },
  md: { img: 'w-8 h-8', text: 'text-base' },
  lg: { img: 'w-9 h-9', text: 'text-lg' },
};

export default function Logo({ size = 'md', subtitle, className = '' }) {
  const s = SIZES[size] || SIZES.md;
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <img src="/logo.svg" alt="Eco Connect" className={`${s.img} shrink-0`} />
      <div className="leading-tight text-left">
        <span className={`${s.text} font-black tracking-wide block`}>
          <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">ECO </span>
          <span className="text-blue-400">CONNECT</span>
        </span>
        {subtitle && (
          <p className="text-[9px] uppercase tracking-widest text-[#c2a14e]/80 font-mono">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
