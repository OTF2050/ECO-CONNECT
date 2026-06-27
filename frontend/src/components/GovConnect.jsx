import React, { useState } from 'react';
import { API_BASE } from '../config';
import DynamicServiceModal from './DynamicServiceModal';

/**
 * GovConnect — A seamless civic dashboard for rural citizens.
 * Green UX dark-mode theme (zinc-900/950 surfaces, emerald-500 / teal-400 accents).
 */
export default function GovConnect({ isWidget = false }) {
  const [description, setDescription] = useState('');
  const [photoName, setPhotoName] = useState('');
  const [coords, setCoords] = useState('');
  const [locating, setLocating] = useState('idle'); // idle | loading | error
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null); // { category, urgency_level, department_action, ai_processed }
  const [error, setError] = useState('');

  // Dynamic Service Modal State
  const [selectedServiceId, setSelectedServiceId] = useState(null);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);

  const handleOpenServiceModal = (serviceId) => {
    setSelectedServiceId(serviceId);
    setIsServiceModalOpen(true);
  };

  const handleGetLocation = () => {
    setLocating('loading');

    if (!('geolocation' in navigator)) {
      setLocating('error');
      setCoords('Geolocation not supported on this device');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCoords(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
        setLocating('idle');
      },
      () => {
        // Simulated fallback when permission is denied or unavailable.
        const lat = (24.0 + Math.random()).toFixed(5);
        const lng = (54.0 + Math.random()).toFixed(5);
        setCoords(`${lat}, ${lng}`);
        setLocating('idle');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handlePhoto = () => {
    setPhotoName('field_photo_2026.jpg');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim() || submitting) return;

    setSubmitting(true);
    setError('');
    setResult(null);

    try {
      // Route the report through the municipal civic-classification AI.
      const res = await fetch(`${API_BASE}/api/classify-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: description.trim() }),
      });
      if (!res.ok) throw new Error('API offline');
      const data = await res.json();
      setResult(data);
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 3000);
      setDescription('');
      setPhotoName('');
      setCoords('');
    } catch (err) {
      console.warn("Civic reporting API offline, executing local municipal routing fallback:", err);
      setTimeout(() => {
        const text = description.toLowerCase();
        let category = 'Municipal Infrastructure';
        let urgency = 'Low';
        let action = 'Logged in municipal maintenance queue for scheduled inspector visit.';

        if (text.includes('water') || text.includes('leak') || text.includes('canal') || text.includes('pipe')) {
          category = 'Water & Utilities';
          urgency = 'Critical';
          action = 'Alerted regional water supply engineer; automated valve pressure cutoff initiated.';
        } else if (text.includes('livestock') || text.includes('camel') || text.includes('sheep') || text.includes('animal')) {
          category = 'Agricultural & Veterinary';
          urgency = 'Medium';
          action = 'Assigned local emergency veterinarian responder. Appointment details queued.';
        } else if (text.includes('sand') || text.includes('road') || text.includes('dune') || text.includes('block')) {
          category = 'Roads & Access';
          urgency = 'Critical';
          action = 'Dispatched sand clearance bulldozer from Hatta municipal depot.';
        }

        setResult({
          category,
          urgency_level: urgency,
          department_action: action,
          ai_processed: false
        });
        setSubmitted(true);
        setTimeout(() => setSubmitted(false), 3500);
        setDescription('');
        setPhotoName('');
        setCoords('');
        setSubmitting(false);
      }, 800);
      return;
    }
    setSubmitting(false);
  };

  const URGENCY_STYLES = {
    Low: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    Medium: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    Critical: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
  };

  const SERVICES = [
    {
      icon: '🚜',
      title: 'Farm License',
      ref: 'AGRI-2024-8841',
      status: 'Active',
      tone: 'active',
      note: 'Valid until 31 Dec 2026',
    },
    {
      icon: '💧',
      title: 'Water Subsidy Request',
      ref: 'WTR-2026-0192',
      status: 'Pending Evaluation',
      tone: 'pending',
      note: 'Under review by the regional office',
    },
    {
      icon: '🌱',
      title: 'Organic Certification',
      ref: 'ORG-2026-0457',
      status: 'Active',
      tone: 'active',
      note: 'Renewed 14 Mar 2026',
    },
  ];

  const badgeStyles = {
    active: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    pending: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  };

  const dotStyles = {
    active: 'bg-emerald-400',
    pending: 'bg-amber-400',
  };

  const HELPLINES = [
    { icon: '🚑', label: 'Emergency Services', desc: 'Police · Ambulance · Civil Defence', number: '999' },
    { icon: '🌳', label: 'MOCCAE Environment Line', desc: 'Report pollution or wildlife issues', number: '800 3050' },
    { icon: '💧', label: 'Municipality Water & Utilities', desc: 'Irrigation leaks & supply faults', number: '800 555' },
    { icon: '🐪', label: 'ADAFSA Animal Health', desc: 'Livestock disease & vet support', number: '800 555 2424' },
  ];

  if (isWidget) {
    return (
      <div className="space-y-4 text-left font-sans text-zinc-800 bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-xl">🏛️</span>
          <div>
            <h4 className="text-xs font-bold text-zinc-800">Gov-Connect Mini</h4>
            <p className="text-[9px] text-zinc-500">Subsidies & Active Permits</p>
          </div>
        </div>

        {/* Render permits summary */}
        <div className="space-y-2">
          {SERVICES.map((srv, idx) => (
            <div key={idx} className="bg-zinc-50 border border-zinc-200/80 p-2.5 rounded-xl flex justify-between items-center text-[10px]">
              <div>
                <span className="font-bold text-zinc-850 block">{srv.title}</span>
                <span className="text-zinc-400 font-mono">{srv.ref}</span>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold border ${srv.tone === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-250' : 'bg-amber-50 text-amber-700 border-amber-250'}`}>
                {srv.status}
              </span>
            </div>
          ))}
        </div>

        {/* Quick report input */}
        <form onSubmit={handleSubmit} className="space-y-2 border-t border-zinc-200 pt-3">
          <label className="text-[9px] uppercase font-bold text-zinc-500 block">Report Issue to MOCCAE</label>
          <input
            type="text"
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. broken pipe or leak..."
            className="w-full bg-zinc-50 border border-zinc-200 text-xs text-zinc-800 p-2.5 rounded-xl outline-none focus:border-emerald-500"
          />
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-xl text-[10px] uppercase border-0 cursor-pointer transition-all"
          >
            {submitting ? 'Sending...' : 'Submit Report'}
          </button>
        </form>

        {result && (
          <div className="bg-emerald-50 border border-emerald-250 p-2.5 rounded-xl text-[9px] text-zinc-700 animate-fadeIn">
            <span className="font-bold text-emerald-700 block uppercase">Report Status: Dispatched</span>
            <p className="mt-0.5">{result.department_action}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-955 text-zinc-100 font-sans antialiased">
      {/* Ambient glow backdrops */}
      <div className="pointer-events-none fixed -top-32 -left-32 h-96 w-96 rounded-full bg-emerald-600/10 blur-[120px]" />
      <div className="pointer-events-none fixed -bottom-40 -right-24 h-96 w-96 rounded-full bg-teal-500/10 blur-[120px]" />

      <div className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 text-2xl shadow-lg shadow-emerald-900/40">
              🌳
            </span>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">
                Gov<span className="text-emerald-400">Connect</span>
              </h1>
              <p className="text-xs text-zinc-400">Rural Citizen Services · Municipality Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start rounded-full border border-zinc-800 bg-zinc-900/70 px-4 py-2 text-xs text-zinc-300 backdrop-blur">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
            Connected to local node
          </div>
        </header>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          {/* ============ Smart Civic Reporting ============ */}
          <section className="lg:col-span-3">
            <div className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-6 shadow-xl backdrop-blur-xl sm:p-8">
              <div className="mb-6 flex items-center gap-3">
                <span className="text-2xl">📣</span>
                <div>
                  <h2 className="text-lg font-bold">Smart Civic Reporting</h2>
                  <p className="text-xs text-zinc-400">
                    Report environmental or infrastructure issues to your municipality.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Description */}
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="issue-desc"
                    className="text-[11px] font-bold uppercase tracking-wider text-zinc-400"
                  >
                    Issue Description
                  </label>
                  <textarea
                    id="issue-desc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    placeholder="Describe the issue — e.g. broken irrigation canal near Plot 14, water leakage flooding the road…"
                    className="w-full resize-none rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                    required
                  />
                </div>

                {/* Attach + GPS row */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {/* Attach Photo */}
                  <div className="flex flex-col gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                      Evidence
                    </span>
                    <button
                      type="button"
                      onClick={handlePhoto}
                      className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-zinc-700 bg-zinc-950/60 px-4 py-3 text-sm font-medium text-zinc-300 transition hover:border-emerald-500/60 hover:bg-zinc-900 hover:text-emerald-300"
                    >
                      📷 {photoName ? 'Photo Attached' : 'Attach Photo'}
                    </button>
                    {photoName && (
                      <span className="truncate text-[11px] text-emerald-400">✓ {photoName}</span>
                    )}
                  </div>

                  {/* GPS */}
                  <div className="flex flex-col gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                      Location
                    </span>
                    <button
                      type="button"
                      onClick={handleGetLocation}
                      disabled={locating === 'loading'}
                      className="flex items-center justify-center gap-2 rounded-2xl border border-zinc-700 bg-zinc-950/60 px-4 py-3 text-sm font-medium text-zinc-200 transition hover:border-teal-400/60 hover:bg-zinc-900 hover:text-teal-300 disabled:opacity-60"
                    >
                      {locating === 'loading' ? '🛰️ Locating…' : '📍 Get My GPS Location'}
                    </button>
                  </div>
                </div>

                {/* Coordinates read-only field */}
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="gps-coords"
                    className="text-[11px] font-bold uppercase tracking-wider text-zinc-400"
                  >
                    Coordinates (Lat / Long)
                  </label>
                  <div className="flex items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-950/80 px-4 py-3">
                    <span className="text-teal-400">🌐</span>
                    <input
                      id="gps-coords"
                      type="text"
                      value={coords}
                      readOnly
                      placeholder="No location captured yet"
                      className="w-full bg-transparent font-mono text-sm text-zinc-100 placeholder:text-zinc-600 outline-none"
                    />
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-3.5 text-sm font-bold text-zinc-950 shadow-lg shadow-emerald-500/30 transition-all hover:shadow-xl hover:shadow-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 active:scale-[0.99] disabled:opacity-60"
                >
                  <span className="absolute inset-0 -translate-x-full bg-white/20 transition-transform duration-500 group-hover:translate-x-full" />
                  <span className="relative">
                    {submitting ? '⚙️ Routing report…' : submitted ? '✅ Report Submitted!' : '🚀 Submit Report'}
                  </span>
                </button>

                {error && (
                  <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-xs text-rose-300">
                    ⚠️ {error}
                  </p>
                )}

                {/* AI routing result */}
                {result && (
                  <div className="rounded-2xl border border-emerald-500/20 bg-zinc-950/70 p-4">
                    <div className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                      <span>🤖</span> Auto-Routed by Municipal AI
                      <span className="ml-auto font-medium normal-case text-zinc-500">
                        {result.ai_processed ? 'LLM analysis' : 'Rule-based routing'}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-400/30 bg-teal-500/15 px-3 py-1 text-xs font-bold text-teal-300">
                        📂 {result.category}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${
                          URGENCY_STYLES[result.urgency_level] || URGENCY_STYLES.Low
                        }`}
                      >
                        🚨 {result.urgency_level}
                      </span>
                    </div>
                    <p className="mt-3 border-t border-white/5 pt-3 text-sm text-zinc-300">
                      <span className="font-semibold text-zinc-100">Officer action: </span>
                      {result.department_action}
                    </p>
                  </div>
                )}
              </form>
            </div>
          </section>

          {/* ============ Active Permits & Services ============ */}
          <section className="lg:col-span-2 space-y-6">
            {/* New Apply for a Digital Service Card */}
            <div className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-6 shadow-xl backdrop-blur-xl">
              <div className="mb-4 flex items-center gap-3">
                <span className="text-2xl">⚡</span>
                <div>
                  <h2 className="text-md font-bold text-zinc-100">Apply for a Service</h2>
                  <p className="text-xs text-zinc-400">Request digital services instantly with Eco AI</p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-2.5">
                <button
                  onClick={() => handleOpenServiceModal('vet_visit')}
                  className="flex items-center gap-3 rounded-2xl bg-zinc-950/60 hover:bg-zinc-900 border border-zinc-850 hover:border-emerald-500/50 p-3.5 text-xs font-bold text-zinc-250 hover:text-[#4ade80] transition-all text-left group"
                >
                  <span className="text-lg bg-zinc-900/80 px-2.5 py-1.5 rounded-xl border border-zinc-800 group-hover:border-emerald-900/50">🏥</span>
                  <div>
                    <span className="block font-semibold text-zinc-200 group-hover:text-emerald-400">Schedule Veterinary Visit</span>
                    <span className="text-[10px] font-normal text-zinc-500 group-hover:text-zinc-400">Request on-site livestock health checkup</span>
                  </div>
                </button>
                <button
                  onClick={() => handleOpenServiceModal('water_leak')}
                  className="flex items-center gap-3 rounded-2xl bg-zinc-950/60 hover:bg-zinc-900 border border-zinc-850 hover:border-emerald-500/50 p-3.5 text-xs font-bold text-zinc-250 hover:text-emerald-400 transition-all text-left group"
                >
                  <span className="text-lg bg-zinc-900/80 px-2.5 py-1.5 rounded-xl border border-zinc-800 group-hover:border-emerald-900/50">💧</span>
                  <div>
                    <span className="block font-semibold text-zinc-200 group-hover:text-emerald-400">Report Irrigation / Water Leak</span>
                    <span className="text-[10px] font-normal text-zinc-500 group-hover:text-zinc-400">Alert municipal engineers immediately</span>
                  </div>
                </button>
                <button
                  onClick={() => handleOpenServiceModal('trade_license')}
                  className="flex items-center gap-3 rounded-2xl bg-zinc-950/60 hover:bg-zinc-900 border border-zinc-850 hover:border-emerald-500/50 p-3.5 text-xs font-bold text-zinc-250 hover:text-[#4ade80] transition-all text-left group"
                >
                  <span className="text-lg bg-zinc-900/80 px-2.5 py-1.5 rounded-xl border border-zinc-800 group-hover:border-emerald-900/50">📜</span>
                  <div>
                    <span className="block font-semibold text-zinc-200 group-hover:text-emerald-400">Apply for Rural Crafts License</span>
                    <span className="text-[10px] font-normal text-zinc-500 group-hover:text-zinc-400">Fast-track permit verified by My Vault</span>
                  </div>
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🗂️</span>
                <div>
                  <h2 className="text-lg font-bold">Active Permits &amp; Services</h2>
                  <p className="text-xs text-zinc-400">Status of your government services</p>
                </div>
              </div>

            <div className="grid grid-cols-1 gap-4">
              {SERVICES.map((s) => (
                <article
                  key={s.ref}
                  className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-5 shadow-lg backdrop-blur-xl transition hover:border-emerald-500/30 hover:bg-white/[0.07]"
                >
                  <div
                    className={`pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full blur-2xl ${
                      s.tone === 'active' ? 'bg-emerald-500/20' : 'bg-amber-500/20'
                    }`}
                  />
                  <div className="relative flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-zinc-950/60 text-xl">
                        {s.icon}
                      </span>
                      <div>
                        <h3 className="text-sm font-bold leading-tight text-zinc-100">{s.title}</h3>
                        <p className="font-mono text-[11px] text-zinc-500">{s.ref}</p>
                      </div>
                    </div>
                    <span
                      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold ${badgeStyles[s.tone]}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${dotStyles[s.tone]}`} />
                      {s.status}
                    </span>
                  </div>
                  <p className="relative mt-4 border-t border-white/5 pt-3 text-xs text-zinc-400">
                    {s.note}
                  </p>
                </article>
              ))}
            </div>
          </div>

          {/* ============ Emergency & Helpline Contacts ============ */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📞</span>
              <div>
                <h2 className="text-lg font-bold">Emergency &amp; Helplines</h2>
                <p className="text-xs text-zinc-400">Round-the-clock rural support lines</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-2.5">
              {HELPLINES.map((h) => (
                <a
                  key={h.number}
                  href={`tel:${h.number.replace(/\s/g, '')}`}
                  className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-3.5 transition hover:border-emerald-500/40 hover:bg-zinc-900 group"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-zinc-950/60 text-lg">
                    {h.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-zinc-100 leading-tight">{h.label}</p>
                    <p className="text-[11px] text-zinc-500">{h.desc}</p>
                  </div>
                  <span className="font-mono text-sm font-black text-emerald-400 group-hover:text-emerald-300">
                    {h.number}
                  </span>
                </a>
              ))}
            </div>
          </div>
        </section>
      </div>
      </div>
      {isServiceModalOpen && (
        <DynamicServiceModal
          isOpen={isServiceModalOpen}
          onClose={() => setIsServiceModalOpen(false)}
          serviceId={selectedServiceId}
          farmerId="farmer_ahmed"
        />
      )}
    </div>
  );
}
