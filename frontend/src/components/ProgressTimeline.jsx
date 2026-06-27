import React from 'react';

/**
 * ProgressTimeline — Visual application progress stepper.
 *
 * Ported from MOE CO-POILT's AgentProcessing "Citizen Timeline" pattern.
 * Renders a vertical timeline of steps with status states:
 *   'complete' | 'active' | 'pending'
 *
 * Props:
 *   steps: Array<{ label: string; sublabel?: string; status: 'complete'|'active'|'pending' }>
 *   title?: string
 */
export default function ProgressTimeline({ steps = [], title }) {
  return (
    <div style={{
      background: '#ffffff',
      border: '1px solid #e6e1d4',
      borderRadius: 16,
      padding: '18px 20px',
      fontFamily: 'Inter, system-ui, sans-serif',
      boxShadow: '0 10px 26px rgba(28,40,35,0.07)',
    }}>
      {title && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          marginBottom: 18,
          fontSize: 12, fontWeight: 700, color: '#6b7280',
          textTransform: 'uppercase', letterSpacing: '0.06em',
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#047857', flexShrink: 0 }} />
          {title}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {steps.map((step, i) => {
          const isLast = i === steps.length - 1;
          const { status } = step;

          const iconBg =
            status === 'complete' ? '#059669' :
            status === 'active'   ? 'rgba(4,120,87,0.12)' :
                                    '#ece8dd';
          const iconBorder =
            status === 'complete' ? '#059669' :
            status === 'active'   ? '#047857' :
                                    '#d6cdb8';
          const iconColor =
            status === 'complete' ? '#fff' :
            status === 'active'   ? '#047857' :
                                    '#9aa1ab';

          const lineColor = status === 'complete' ? '#059669' : '#e6e1d4';

          return (
            <div key={i} style={{ display: 'flex', gap: 14 }}>
              {/* Left column: icon + connector line */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: iconBg,
                  border: `2px solid ${iconBorder}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'all 0.3s',
                  boxShadow: status === 'active' ? '0 0 12px rgba(4,120,87,0.25)' : 'none',
                }}>
                  {status === 'complete' && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="3">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  )}
                  {status === 'active' && (
                    <span style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: '#047857', display: 'block',
                      animation: 'tlPing 1.4s infinite',
                    }} />
                  )}
                  {status === 'pending' && (
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2.5">
                      <circle cx="12" cy="12" r="9" />
                      <path d="M12 7v5l3 3" />
                    </svg>
                  )}
                </div>
                {!isLast && (
                  <div style={{
                    width: 2, flex: 1, minHeight: 20,
                    background: lineColor,
                    margin: '4px 0',
                    borderRadius: 1,
                    transition: 'background 0.4s',
                  }} />
                )}
              </div>

              {/* Right column: content */}
              <div style={{ paddingBottom: isLast ? 0 : 18, paddingTop: 4 }}>
                <div style={{
                  fontSize: 13, fontWeight: 600,
                  color: status === 'pending' ? '#9aa1ab' : '#16241f',
                  transition: 'color 0.3s',
                }}>
                  {step.label}
                </div>
                {step.sublabel && (
                  <div style={{
                    fontSize: 11.5, color: status === 'pending' ? '#9aa1ab' : '#6b7280',
                    marginTop: 3, lineHeight: 1.5,
                  }}>
                    {step.sublabel}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes tlPing {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.3); }
        }
      `}</style>
    </div>
  );
}
