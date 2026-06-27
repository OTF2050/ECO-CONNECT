import React, { useState } from 'react';
import { API_BASE } from '../config';
import { useAccessibility } from '../context/AccessibilityContext';
import { exportReportPdf } from '../utils/reportExport';

const REQUEST_TYPES = [
  'Animal Feed Subsidy',
  'Irrigation Equipment Grant',
  'Greenhouse Setup Subsidy',
  'Date Palm Care Support',
  'Solar / Energy Subsidy',
  'General Farming Grant',
];

const DECISION_STYLE = {
  Approved: { color: '#4ade80', bg: 'bg-emerald-500/10 border-emerald-500/30', icon: '✅' },
  Review: { color: '#fbbf24', bg: 'bg-amber-500/10 border-amber-500/30', icon: '🔎' },
  Rejected: { color: '#f87171', bg: 'bg-red-500/10 border-red-500/30', icon: '⚠️' },
};

export default function SubsidyEligibility() {
  const { ar } = useAccessibility();
  const [form, setForm] = useState({
    request_type: REQUEST_TYPES[0],
    farm_size_dunum: 12,
    years_active: 3,
    annual_income_aed: 60000,
    requested_amount_aed: 15000,
    has_trade_license: true,
    prior_subsidy_default: false,
    uses_sustainable_irrigation: true,
    employs_locals: false,
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const evaluate = async () => {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch(`${API_BASE}/api/subsidy/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Evaluation service unavailable.');
      setResult(await res.json());
    } catch (e) {
      setError(e.message || 'Could not evaluate eligibility.');
    } finally {
      setLoading(false);
    }
  };

  const downloadPdf = () => {
    if (!result) return;
    exportReportPdf({
      title: 'Subsidy Eligibility Assessment',
      kpis: [
        { label: 'Decision', value: result.decision },
        { label: 'Compliance Score', value: `${result.score}/100` },
        { label: 'Income Cap', value: `AED ${Number(result.income_cap_aed).toLocaleString()}` },
        { label: 'Request Type', value: form.request_type },
      ],
      sections: [
        {
          heading: 'Rationale',
          rows: [['Summary (EN)', result.rationale_en], ['الملخص (AR)', result.rationale_ar]],
        },
        {
          heading: 'Rule Assessment',
          rows: result.rules.map((r) => [`${r.id} · ${r.label_en}`, r.passed ? 'PASS' : 'NOT MET']),
        },
        ...(result.how_to_qualify.length
          ? [{ heading: 'How to Qualify', rows: result.how_to_qualify.map((h, i) => [`Step ${i + 1}`, h.en]) }]
          : []),
      ],
    });
  };

  const ds = result ? DECISION_STYLE[result.decision] : null;

  return (
    <div className="max-w-5xl mx-auto w-full space-y-6">
      {/* Header */}
      <div className="bg-[#15171e] border border-zinc-800/60 rounded-2xl p-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">⚖️</span>
          <div>
            <h2 className="text-md font-bold text-zinc-100">{ar ? 'محرك أهلية الدعم' : 'Subsidy Eligibility Engine'}</h2>
            <p className="text-[10px] text-zinc-400 font-mono">GOVERNANCE-AS-CODE · MOCCAE RULES S-01…S-06</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className="bg-[#15171e] border border-zinc-800/60 rounded-2xl p-5 space-y-4">
          <Field label={ar ? 'نوع الطلب' : 'Request Type'}>
            <select
              value={form.request_type}
              onChange={(e) => set('request_type', e.target.value)}
              className="w-full bg-[#0a0a0a] border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-200 outline-none focus:border-emerald-500"
            >
              {REQUEST_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <NumberField label={ar ? 'حجم المزرعة (دونم)' : 'Farm Size (dunum)'} value={form.farm_size_dunum} onChange={(v) => set('farm_size_dunum', v)} />
            <NumberField label={ar ? 'سنوات النشاط' : 'Years Active'} value={form.years_active} onChange={(v) => set('years_active', v)} />
            <NumberField label={ar ? 'الدخل السنوي (درهم)' : 'Annual Income (AED)'} value={form.annual_income_aed} onChange={(v) => set('annual_income_aed', v)} />
            <NumberField label={ar ? 'المبلغ المطلوب (درهم)' : 'Requested (AED)'} value={form.requested_amount_aed} onChange={(v) => set('requested_amount_aed', v)} />
          </div>

          <div className="space-y-2 pt-1">
            <Check label={ar ? 'يملك رخصة تجارية/زراعية' : 'Has trade / farm licence'} checked={form.has_trade_license} onChange={(v) => set('has_trade_license', v)} />
            <Check label={ar ? 'يستخدم ريّاً مستداماً' : 'Uses sustainable irrigation'} checked={form.uses_sustainable_irrigation} onChange={(v) => set('uses_sustainable_irrigation', v)} />
            <Check label={ar ? 'يوظّف كوادر محلية' : 'Employs local workers'} checked={form.employs_locals} onChange={(v) => set('employs_locals', v)} />
            <Check label={ar ? 'تعثر سابق في الدعم' : 'Prior subsidy default'} checked={form.prior_subsidy_default} onChange={(v) => set('prior_subsidy_default', v)} danger />
          </div>

          <button
            onClick={evaluate}
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#0f7a54] to-[#9b7a36] hover:brightness-110 disabled:opacity-50 text-white font-bold py-3 rounded-xl text-sm transition-all"
          >
            {loading ? (ar ? 'جارٍ التقييم…' : 'Evaluating…') : (ar ? 'تقييم الأهلية' : 'Evaluate Eligibility')}
          </button>
          {error && <p className="text-red-400 text-xs text-center">{error}</p>}
        </div>

        {/* Result */}
        <div className="bg-[#15171e] border border-zinc-800/60 rounded-2xl p-5">
          {!result && (
            <div className="h-full flex flex-col items-center justify-center text-center text-zinc-500 py-12">
              <span className="text-4xl mb-3">📋</span>
              <p className="text-sm">{ar ? 'املأ النموذج لتقييم الأهلية الفورية وبيان الأسباب ثنائي اللغة.' : 'Fill the form to get an instant decision with a bilingual, transparent rationale.'}</p>
            </div>
          )}

          {result && (
            <div className="space-y-4">
              <div className={`rounded-xl border p-4 text-center ${ds.bg}`}>
                <div className="text-3xl mb-1">{ds.icon}</div>
                <div className="text-xl font-black" style={{ color: ds.color }}>{result.decision}</div>
                <div className="text-xs text-zinc-400 mt-1">{ar ? 'نسبة الامتثال' : 'Compliance score'}: <span className="font-bold text-zinc-200">{result.score}/100</span></div>
                <div className="mt-2 h-2 rounded-full bg-zinc-800 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${result.score}%`, background: ds.color }} />
                </div>
              </div>

              <p className="text-sm text-zinc-300 leading-relaxed">{ar ? result.rationale_ar : result.rationale_en}</p>

              <div className="space-y-1.5">
                {result.rules.map((r) => (
                  <div key={r.id} className="flex items-center gap-2 text-xs">
                    <span className={r.passed ? 'text-emerald-400' : 'text-red-400'}>{r.passed ? '✓' : '✕'}</span>
                    <span className="text-zinc-500 font-mono">{r.id}</span>
                    <span className="text-zinc-300">{ar ? r.label_ar : r.label_en}</span>
                  </div>
                ))}
              </div>

              {result.how_to_qualify.length > 0 && (
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
                  <div className="text-xs font-bold text-amber-400 mb-2">{ar ? '📈 كيف تصبح مؤهلاً' : '📈 How to Qualify'}</div>
                  <ul className="space-y-1.5">
                    {result.how_to_qualify.map((h, i) => (
                      <li key={i} className="text-xs text-zinc-300 flex gap-2">
                        <span className="text-amber-400">{i + 1}.</span>
                        <span>{ar ? h.ar : h.en}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <button
                onClick={downloadPdf}
                className="w-full border border-[#9b7a36]/50 text-[#c2a14e] hover:bg-[#9b7a36]/10 font-semibold py-2.5 rounded-xl text-sm transition-all"
              >
                ⬇️ {ar ? 'تنزيل التقييم PDF' : 'Download Assessment (PDF)'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">{label}</span>
      {children}
    </label>
  );
}

function NumberField({ label, value, onChange }) {
  return (
    <Field label={label}>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full bg-[#0a0a0a] border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-200 outline-none focus:border-emerald-500"
      />
    </Field>
  );
}

function Check({ label, checked, onChange, danger }) {
  return (
    <label className="flex items-center justify-between cursor-pointer">
      <span className={`text-sm ${danger ? 'text-red-300' : 'text-zinc-300'}`}>{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`w-11 h-6 rounded-full relative transition-colors ${checked ? (danger ? 'bg-red-500' : 'bg-emerald-600') : 'bg-zinc-700'}`}
      >
        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${checked ? 'left-[22px]' : 'left-0.5'}`} />
      </button>
    </label>
  );
}
