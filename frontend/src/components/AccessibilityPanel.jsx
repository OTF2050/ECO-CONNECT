import React, { useState } from 'react';
import { useAccessibility } from '../context/AccessibilityContext';

const FONT_OPTIONS = [
  { label: 'A', value: 1, title: 'Normal' },
  { label: 'A+', value: 1.075, title: 'Large' },
  { label: 'A++', value: 1.15, title: 'Extra Large' },
];

const LEVELS = [
  { label: 'Off', value: 0 },
  { label: 'Med', value: 1 },
  { label: 'Max', value: 2 },
];

const COLOR_BLIND = [
  { label: 'None', value: 'none' },
  { label: 'Protan', value: 'protanopia' },
  { label: 'Deutan', value: 'deuteranopia' },
  { label: 'Tritan', value: 'tritanopia' },
  { label: 'Gray', value: 'grayscale' },
];

export default function AccessibilityPanel() {
  const [open, setOpen] = useState(false);
  const { settings, updateSettings, resetSettings, ar } = useAccessibility();

  return (
    <>
      {/* Hidden SVG colour-blindness filter matrices */}
      <svg aria-hidden="true" style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <filter id="eco-protanopia">
            <feColorMatrix type="matrix" values="0.567 0.433 0 0 0  0.558 0.442 0 0 0  0 0.242 0.758 0 0  0 0 0 1 0" />
          </filter>
          <filter id="eco-deuteranopia">
            <feColorMatrix type="matrix" values="0.625 0.375 0 0 0  0.7 0.3 0 0 0  0 0.3 0.7 0 0  0 0 0 1 0" />
          </filter>
          <filter id="eco-tritanopia">
            <feColorMatrix type="matrix" values="0.95 0.05 0 0 0  0 0.433 0.567 0 0  0 0.475 0.525 0 0  0 0 0 1 0" />
          </filter>
        </defs>
      </svg>

      <div style={{ position: 'fixed', left: ar ? 'auto' : 20, right: ar ? 20 : 'auto', bottom: 20, zIndex: 9998 }}>
        {!open && (
          <button
            onClick={() => setOpen(true)}
            aria-label="Open accessibility settings"
            data-keep
            style={{
              border: '1px solid rgba(166,128,43,0.4)',
              background: 'linear-gradient(135deg, #0f7a54, #a6802b)',
              color: '#ffffff',
              borderRadius: 999,
              padding: '10px 14px',
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.04em',
              cursor: 'pointer',
              boxShadow: '0 8px 24px rgba(28,40,35,0.18)',
            }}
          >
            ♿ {ar ? 'الإتاحة' : 'Accessibility'}
          </button>
        )}

        {open && (
          <div
            role="dialog"
            aria-label="Accessibility settings panel"
            style={{
              width: 320,
              maxHeight: '80vh',
              overflowY: 'auto',
              background: '#ffffff',
              border: '1px solid #e6e1d4',
              borderRadius: 16,
              boxShadow: '0 18px 44px rgba(28,40,35,0.18)',
            }}
          >
            <div style={{
              padding: '12px 14px',
              borderBottom: '1px solid #e6e1d4',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              position: 'sticky',
              top: 0,
              background: '#fff',
            }}>
              <div>
                <div style={{ color: '#16241f', fontSize: 13, fontWeight: 700 }}>{ar ? 'إعدادات الإتاحة' : 'Accessibility Settings'}</div>
                <div style={{ color: '#6b7280', fontSize: 10 }}>{ar ? 'مستوحاة من ضوابط MOE' : 'Inspired by MOE Co-Pilot controls'}</div>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close accessibility settings"
                style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: 16 }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: 14, display: 'grid', gap: 14 }}>
              {/* Language / RTL */}
              <Section title={ar ? 'اللغة' : 'Language'}>
                <Segmented
                  options={[{ label: 'English', value: 'en' }, { label: 'العربية', value: 'ar' }]}
                  value={settings.language}
                  onChange={(v) => updateSettings({ language: v })}
                />
              </Section>

              <Section title={ar ? 'حجم الخط' : 'Font Size'}>
                <Segmented
                  options={FONT_OPTIONS.map((o) => ({ label: o.label, value: o.value }))}
                  value={settings.fontScale}
                  onChange={(v) => updateSettings({ fontScale: v })}
                />
              </Section>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <Section title={ar ? 'تباعد الحروف' : 'Letter Spacing'}>
                  <Segmented options={LEVELS} value={settings.letterSpacing} onChange={(v) => updateSettings({ letterSpacing: v })} compact />
                </Section>
                <Section title={ar ? 'تباعد الكلمات' : 'Word Spacing'}>
                  <Segmented options={LEVELS} value={settings.wordSpacing} onChange={(v) => updateSettings({ wordSpacing: v })} compact />
                </Section>
              </div>

              <Section title={ar ? 'تشبّع الألوان' : 'Colour Saturation'}>
                <input
                  type="range"
                  min="0" max="2" step="0.25"
                  value={settings.saturation}
                  onChange={(e) => updateSettings({ saturation: Number(e.target.value) })}
                  style={{ width: '100%', accentColor: '#0f7a54' }}
                />
              </Section>

              <Section title={ar ? 'عمى الألوان' : 'Colour-Blind Filter'}>
                <Segmented options={COLOR_BLIND} value={settings.colorBlind} onChange={(v) => updateSettings({ colorBlind: v })} compact wrap />
              </Section>

              <section style={{ display: 'grid', gap: 8 }}>
                <ToggleRow label={ar ? 'تباين عالٍ' : 'High Contrast'} checked={settings.highContrast} onChange={(v) => updateSettings({ highContrast: v })} />
                <ToggleRow label={ar ? 'تقليل الحركة' : 'Reduce Motion'} checked={settings.reduceMotion} onChange={(v) => updateSettings({ reduceMotion: v })} />
                <ToggleRow label={ar ? 'خط مناسب لعسر القراءة' : 'Dyslexia-Friendly Font'} checked={settings.dyslexiaFriendly} onChange={(v) => updateSettings({ dyslexiaFriendly: v })} />
                <ToggleRow label={ar ? 'إخفاء الصور' : 'Hide Images'} checked={settings.hideImages} onChange={(v) => updateSettings({ hideImages: v })} />
                <ToggleRow label={ar ? '🔊 القراءة عند النقر' : '🔊 Read on Click (TTS)'} checked={settings.tts} onChange={(v) => updateSettings({ tts: v })} />
              </section>

              <button
                onClick={resetSettings}
                style={{
                  border: '1px solid rgba(220,38,38,0.35)',
                  color: '#dc2626',
                  background: 'rgba(220,38,38,0.08)',
                  borderRadius: 8,
                  padding: '8px 10px',
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {ar ? 'إعادة الضبط' : 'Reset Defaults'}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function Section({ title, children }) {
  return (
    <section>
      <div style={{ color: '#3c4742', fontWeight: 700, fontSize: 11, marginBottom: 8 }}>{title}</div>
      {children}
    </section>
  );
}

function Segmented({ options, value, onChange, compact, wrap }) {
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: wrap ? 'wrap' : 'nowrap' }}>
      {options.map((option) => {
        const active = value === option.value;
        return (
          <button
            key={String(option.value)}
            onClick={() => onChange(option.value)}
            style={{
              flex: compact ? '1 1 0' : '0 0 auto',
              border: active ? '1px solid #047857' : '1px solid #e6e1d4',
              background: active ? 'rgba(4,120,87,0.1)' : '#faf8f2',
              color: active ? '#047857' : '#6b7280',
              borderRadius: 8,
              fontSize: 11,
              fontWeight: 600,
              padding: '6px 10px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function ToggleRow({ label, checked, onChange }) {
  return (
    <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ color: '#3c4742', fontSize: 12 }}>{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        style={{
          width: 42,
          height: 24,
          borderRadius: 999,
          border: '1px solid #d6cdb8',
          background: checked ? '#0f7a54' : '#ece8dd',
          cursor: 'pointer',
          position: 'relative',
          flexShrink: 0,
        }}
      >
        <span
          style={{
            width: 18,
            height: 18,
            borderRadius: '50%',
            background: '#fff',
            position: 'absolute',
            top: 2,
            left: checked ? 21 : 2,
            transition: 'left 0.15s ease',
          }}
        />
      </button>
    </label>
  );
}

