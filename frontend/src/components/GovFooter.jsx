import React from 'react';

/**
 * GovFooter — Official UAE government-style footer.
 *
 * Ported & adapted from MOE CO-POILT's SADDAD GovFooter (saddad-ui.tsx).
 * Provides ministry-grade branding + social links across portals.
 */
const SOCIALS = [
  { label: 'Facebook', href: 'https://www.facebook.com/moccae.uae', d: 'M14 9h3l.5-3H14V4.3c0-.9.3-1.5 1.6-1.5H17.5V.2C17.2.1 16.2 0 15 0c-2.5 0-4 1.5-4 4.2V6H8v3h3v9h3V9z' },
  { label: 'Instagram', href: 'https://www.instagram.com/moccaeuae', d: 'M3 7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7z M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z M17.5 6.5h.01' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/company/moccaeuae', d: 'M4.98 3.5A2.5 2.5 0 1 0 5 8.5a2.5 2.5 0 0 0 0-5zM3 9h4v12H3zM9 9h3.8v1.7h.05c.53-1 1.8-2 3.7-2 4 0 4.7 2.6 4.7 6V21H17v-5.3c0-1.3 0-3-1.8-3s-2.1 1.4-2.1 2.9V21H9z' },
  { label: 'X', href: 'https://twitter.com/moccaeuae', d: 'M17.5 3h3l-6.6 7.5L21.5 21h-5.9l-4.3-5.6L6.3 21H3.3l7-8L2.7 3h6l3.9 5.2L17.5 3z' },
  { label: 'YouTube', href: 'https://www.youtube.com/@moccaeuae', d: 'M22 8.2a3 3 0 0 0-2.1-2.1C18 5.5 12 5.5 12 5.5s-6 0-7.9.6A3 3 0 0 0 2 8.2 31 31 0 0 0 2 12a31 31 0 0 0 .1 3.8 3 3 0 0 0 2.1 2.1c1.9.6 7.9.6 7.9.6s6 0 7.9-.6a3 3 0 0 0 2.1-2.1A31 31 0 0 0 22 12a31 31 0 0 0-.1-3.8zM10 15V9l5.2 3L10 15z' },
];

export default function GovFooter() {
  return (
    <footer
      style={{
        marginTop: 40,
        borderTop: '1px solid #e6e1d4',
        paddingTop: 24,
        paddingBottom: 12,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 22 }}>🌳</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#16241f', letterSpacing: '0.02em' }}>
              Eco <span style={{ color: '#1e3a8a' }}>Connect</span><span style={{ color: '#a6802b', fontWeight: 600 }}> · إيكو</span>
            </div>
            <div style={{ fontSize: 10, color: '#6b7280' }}>
              Ministry of Climate Change &amp; Environment — UAE
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 600 }}>Follow us:</span>
          {SOCIALS.map((s) => (
            <a
              key={s.label}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Eco Connect ${s.label}`}
              style={{ color: '#6b7280', display: 'inline-flex', transition: 'color 0.15s' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#047857'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#6b7280'; }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                <path d={s.d} />
              </svg>
            </a>
          ))}
        </div>
      </div>

      <div
        style={{
          marginTop: 16,
          fontSize: 10.5,
          color: '#6b7280',
          textAlign: 'center',
          lineHeight: 1.6,
        }}
      >
        © 2026 Eco Connect · A UAE government-backed eco-sustainability platform. All rights reserved.
      </div>
    </footer>
  );
}
