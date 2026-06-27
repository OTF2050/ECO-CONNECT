import React, { useContext, useEffect, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { AuthContext } from '../../context/AuthContext';
import { API_BASE as API } from '../../config';

const WATER_TECHNIQUES = [
  'Sub-surface drip irrigation (50% water saving)',
  'Smart soil-moisture sensor scheduling',
  'Treated greywater recycling',
  'Rain-fed (no irrigation)',
  'Mulching + shade netting',
];

// Crop Traceability studio (seller side): generate a QR code that links to a
// public product "story" backed by a simulated per-farm blockchain ledger.
export default function TraceabilityStudio() {
  const { token } = useContext(AuthContext);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [active, setActive] = useState(null); // newly created / selected record to show QR
  const [form, setForm] = useState({
    product_name: '', batch_label: '', harvest_date: '', farm_location: 'Hatta (Dubai)',
    water_technique: WATER_TECHNIQUES[0], certifications: 'Organic, Pesticide-free', notes: '',
  });
  const qrWrapRef = useRef(null);

  const authHeaders = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const traceUrl = (publicId) => `${window.location.origin}${window.location.pathname}#/trace/${publicId}`;

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/traceability/mine`, { headers: authHeaders });
      if (!res.ok) throw new Error('Could not load your records.');
      setRecords(await res.json());
    } catch (e) {
      setMsg(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const createRecord = async (e) => {
    e.preventDefault();
    setMsg('');
    try {
      const res = await fetch(`${API}/api/traceability`, {
        method: 'POST', headers: authHeaders, body: JSON.stringify(form),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.detail || 'Could not create record.');
      }
      const rec = await res.json();
      setActive(rec);
      setMsg('✅ Traceability QR generated and added to the ledger.');
      setForm((p) => ({ ...p, product_name: '', batch_label: '', notes: '' }));
      load();
    } catch (e) {
      setMsg(e.message);
    }
  };

  const copyLink = (publicId) => {
    navigator.clipboard?.writeText(traceUrl(publicId));
    setMsg('🔗 Public link copied to clipboard.');
  };

  const downloadQr = (publicId) => {
    const svg = qrWrapRef.current?.querySelector('svg');
    if (!svg) return;
    const data = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([data], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `eco-trace-${publicId}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-[#15171e] border border-zinc-800 rounded-2xl p-5 space-y-4">
      <div className="flex items-center gap-2.5">
        <span className="text-xl">🔗</span>
        <div>
          <h3 className="text-sm font-bold text-zinc-100">Crop Traceability Studio</h3>
          <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">Generate a QR · build buyer trust · blockchain-secured</p>
        </div>
      </div>

      {msg && <div className="bg-zinc-800/50 border border-zinc-700 text-zinc-300 text-xs p-2.5 rounded-xl">{msg}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Create form */}
        <form onSubmit={createRecord} className="bg-[#0a0a0a] border border-zinc-850 rounded-xl p-4 space-y-3">
          <Field label="Product name">
            <input required value={form.product_name} onChange={(e) => set('product_name', e.target.value)} placeholder="Premium Khalas Dates" className="inp" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Batch label">
              <input value={form.batch_label} onChange={(e) => set('batch_label', e.target.value)} placeholder="Batch #A-2026-06" className="inp" />
            </Field>
            <Field label="Harvest date">
              <input type="date" value={form.harvest_date} onChange={(e) => set('harvest_date', e.target.value)} className="inp" />
            </Field>
          </div>
          <Field label="Farm location">
            <input value={form.farm_location} onChange={(e) => set('farm_location', e.target.value)} className="inp" />
          </Field>
          <Field label="Water-saving technique">
            <select value={form.water_technique} onChange={(e) => set('water_technique', e.target.value)} className="inp">
              {WATER_TECHNIQUES.map((w) => <option key={w} value={w}>{w}</option>)}
            </select>
          </Field>
          <Field label="Certifications (comma separated)">
            <input value={form.certifications} onChange={(e) => set('certifications', e.target.value)} placeholder="Organic, Pesticide-free" className="inp" />
          </Field>
          <Field label="Note for buyers (optional)">
            <textarea rows="2" value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Hand-picked and sun-dried on-farm." className="inp resize-none" />
          </Field>
          <button type="submit" className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold py-2.5 rounded-xl shadow-lg hover:opacity-90 transition-all">
            🔗 Generate Traceability QR
          </button>
          <style>{`.inp{width:100%;background:#15171e;border:1px solid #27272a;border-radius:0.6rem;padding:0.6rem;font-size:0.72rem;color:#d4d4d8;outline:none}.inp:focus{border-color:#10b981}`}</style>
        </form>

        {/* QR preview */}
        <div className="bg-[#0a0a0a] border border-zinc-850 rounded-xl p-4 flex flex-col items-center justify-center text-center">
          {active ? (
            <div ref={qrWrapRef} className="w-full flex flex-col items-center">
              <div className="bg-white p-3 rounded-2xl">
                <QRCodeSVG value={traceUrl(active.public_id)} size={150} level="M" includeMargin={false} />
              </div>
              <p className="text-sm font-bold text-zinc-100 mt-3">{active.product_name}</p>
              {active.batch_label && <p className="text-[11px] text-zinc-500 font-mono">{active.batch_label}</p>}
              <p className="text-[10px] text-emerald-400 font-mono mt-1 break-all">#{active.batch_hash?.slice(0, 16)}…</p>
              <div className="flex gap-2 mt-3">
                <button onClick={() => copyLink(active.public_id)} className="text-[10px] font-bold text-zinc-300 border border-zinc-700 hover:bg-zinc-800 rounded-lg px-3 py-1.5 transition-all">Copy link</button>
                <button onClick={() => downloadQr(active.public_id)} className="text-[10px] font-bold text-zinc-300 border border-zinc-700 hover:bg-zinc-800 rounded-lg px-3 py-1.5 transition-all">Download QR</button>
                <a href={`#/trace/${active.public_id}`} target="_blank" rel="noreferrer" className="text-[10px] font-bold text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/10 rounded-lg px-3 py-1.5 transition-all">Preview</a>
              </div>
            </div>
          ) : (
            <div className="text-zinc-600">
              <span className="text-4xl block mb-2">📱</span>
              <p className="text-xs">Generate a record to produce a scannable QR code buyers can verify.</p>
            </div>
          )}
        </div>
      </div>

      {/* Existing records */}
      <div>
        <p className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 mb-2">Your ledger ({records.length})</p>
        {loading ? (
          <div className="flex items-center gap-2 text-xs text-zinc-500 py-3">
            <span className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" /> Loading ledger…
          </div>
        ) : records.length === 0 ? (
          <p className="text-xs text-zinc-500">No records yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {records.map((r) => (
              <button
                key={r.public_id}
                onClick={() => setActive(r)}
                className={`text-left bg-[#0a0a0a] border rounded-xl p-3 transition-all ${active?.public_id === r.public_id ? 'border-emerald-500/40' : 'border-zinc-850 hover:border-zinc-700'}`}
              >
                <div className="flex justify-between items-center gap-2">
                  <span className="text-xs font-bold text-zinc-200 truncate">{r.product_name}</span>
                  <span className="text-[9px] font-mono text-emerald-400 shrink-0">#{r.batch_hash?.slice(0, 6)}</span>
                </div>
                <p className="text-[10px] text-zinc-500 mt-0.5">{r.batch_label || '—'} · {r.harvest_date || 'no date'}</p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">{label}</label>
      {children}
    </div>
  );
}
