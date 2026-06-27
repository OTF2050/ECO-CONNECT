import React from 'react';

/**
 * StatCard — Executive KPI card.
 *
 * Ported from MOE CO-POILT (MOE-strategist kpi-card + SADDAD DataHead pattern).
 * Displays a single key metric with an optional trend indicator and accent tone.
 *
 * Props:
 *   label    – metric name (e.g. "Total Reports")
 *   value    – the headline figure (string | number)
 *   sublabel – small caption under the value
 *   icon     – emoji or node rendered in the corner
 *   tone     – 'emerald' | 'amber' | 'rose' | 'blue' | 'teal'
 *   trend    – optional { direction: 'up'|'down'|'flat', text: string }
 */
const TONES = {
  emerald: { text: '#047857', ring: 'rgba(4,120,87,0.28)', glow: 'rgba(4,120,87,0.08)' },
  amber: { text: '#b45309', ring: 'rgba(180,83,9,0.28)', glow: 'rgba(180,83,9,0.08)' },
  rose: { text: '#e11d48', ring: 'rgba(225,29,72,0.28)', glow: 'rgba(225,29,72,0.08)' },
  blue: { text: '#2563eb', ring: 'rgba(37,99,235,0.28)', glow: 'rgba(37,99,235,0.08)' },
  teal: { text: '#0d8a78', ring: 'rgba(13,138,120,0.28)', glow: 'rgba(13,138,120,0.08)' },
};

export default function StatCard({ label, value, sublabel, icon, tone = 'emerald', trend }) {
  const t = TONES[tone] || TONES.emerald;

  const trendColor =
    trend?.direction === 'up' ? '#047857' :
    trend?.direction === 'down' ? '#e11d48' :
    '#9aa1ab';
  const trendArrow =
    trend?.direction === 'up' ? '▲' :
    trend?.direction === 'down' ? '▼' :
    '—';

  return (
    <div
      style={{
        position: 'relative',
        background: `linear-gradient(135deg, ${t.glow}, #ffffff)`,
        border: `1px solid ${t.ring}`,
        borderRadius: 18,
        padding: '18px 20px',
        backdropFilter: 'blur(14px)',
        overflow: 'hidden',
        boxShadow: '0 10px 26px rgba(28,40,35,0.07)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
        <span style={{
          fontSize: 10,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          fontWeight: 700,
          color: '#6b7280',
        }}>
          {label}
        </span>
        {icon && <span style={{ fontSize: 18, lineHeight: 1 }}>{icon}</span>}
      </div>

      <div style={{ marginTop: 12, display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{ fontSize: 28, fontWeight: 800, color: t.text, lineHeight: 1 }}>
          {value}
        </span>
        {trend && (
          <span style={{ fontSize: 11, fontWeight: 700, color: trendColor }}>
            {trendArrow} {trend.text}
          </span>
        )}
      </div>

      {sublabel && (
        <div style={{ marginTop: 6, fontSize: 11, color: '#6b7280', lineHeight: 1.4 }}>
          {sublabel}
        </div>
      )}
    </div>
  );
}
