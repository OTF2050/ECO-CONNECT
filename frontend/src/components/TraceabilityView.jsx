import React, { useEffect, useState } from 'react';
import { API_BASE as API } from '../config';

// Public product "story" page shown when a buyer scans a crop's QR code.
// No authentication — anyone with the link/QR can verify provenance.
export default function TraceabilityView({ publicId }) {
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`${API}/api/traceability/${encodeURIComponent(publicId)}`);
        if (!res.ok) throw new Error('This product record could not be found or has been revoked.');
        const data = await res.json();
        if (active) setRecord(data);
      } catch (e) {
        if (active) setError(e.message || 'Unable to load record.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [publicId]);

  const shortHash = (h) => (h ? `${h.slice(0, 10)}…${h.slice(-8)}` : '—');

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0a] to-[#0c130f] text-zinc-300 flex flex-col items-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2.5 mb-6">
          <img src="/logo.svg" alt="Eco Connect" className="w-8 h-8" />
          <span className="text-lg font-black bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent tracking-wide">ECO CONNECT</span>
        </div>

        {loading && (
          <div className="bg-[#15171e] border border-zinc-800 rounded-3xl p-8 flex flex-col items-center">
            <span className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-xs uppercase font-mono tracking-widest text-zinc-500">Verifying on ledger…</p>
          </div>
        )}

        {error && !loading && (
          <div className="bg-[#15171e] border border-red-500/30 rounded-3xl p-8 text-center">
            <span className="text-4xl block mb-3">🔍</span>
            <h2 className="text-md font-bold text-red-400 mb-1">Record Not Found</h2>
            <p className="text-xs text-zinc-400 leading-relaxed">{error}</p>
          </div>
        )}

        {record && !loading && (
          <div className="bg-[#15171e] border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl">
            {/* Verified banner */}
            <div className="bg-gradient-to-r from-emerald-600/90 to-teal-600/90 px-6 py-4 flex items-center gap-3">
              <span className="text-2xl">✅</span>
              <div>
                <p className="text-sm font-black text-white leading-tight">Verified Origin</p>
                <p className="text-[10px] text-emerald-100/90 font-mono uppercase tracking-wider">Blockchain-secured provenance</p>
              </div>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <h1 className="text-xl font-black text-zinc-100">{record.product_name}</h1>
                {record.batch_label && <p className="text-xs text-zinc-500 mt-0.5 font-mono">{record.batch_label}</p>}
              </div>

              {record.certifications && record.certifications.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {record.certifications.map((c) => (
                    <span key={c} className="text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full">🌿 {c}</span>
                  ))}
                </div>
              )}

              {/* The "story" */}
              <div className="space-y-3">
                <StoryRow icon="👨‍🌾" label="Produced by" value={record.farmer_name || 'Verified Eco Connect farmer'} />
                <StoryRow icon="📍" label="Farm location" value={record.farm_location} />
                <StoryRow icon="📅" label="Harvest date" value={record.harvest_date} />
                <StoryRow icon="💧" label="Water-saving technique" value={record.water_technique} />
                {record.notes && <StoryRow icon="📝" label="Farmer's note" value={record.notes} />}
              </div>

              {/* Ledger proof */}
              <div className="bg-[#0a0a0a] border border-zinc-850 rounded-xl p-4 space-y-2">
                <p className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">🔗 Ledger Proof</p>
                <div className="flex justify-between gap-2 text-[10px] font-mono">
                  <span className="text-zinc-500">Batch hash</span>
                  <span className="text-emerald-400 break-all text-right">{shortHash(record.batch_hash)}</span>
                </div>
                <div className="flex justify-between gap-2 text-[10px] font-mono">
                  <span className="text-zinc-500">Previous</span>
                  <span className="text-zinc-400 break-all text-right">{record.prev_hash ? shortHash(record.prev_hash) : 'GENESIS'}</span>
                </div>
                {record.created_at && (
                  <div className="flex justify-between gap-2 text-[10px] font-mono">
                    <span className="text-zinc-500">Registered</span>
                    <span className="text-zinc-400">{new Date(record.created_at).toLocaleString('en-AE')}</span>
                  </div>
                )}
              </div>

              <p className="text-[10px] text-center text-zinc-600 leading-relaxed">
                This record is immutably linked to the farm's production ledger on Eco Connect.
              </p>

              <a href="#/login" className="block text-center bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold py-3 rounded-xl border border-zinc-700 transition-all">
                Explore Eco Connect →
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StoryRow({ icon, label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3">
      <span className="text-lg w-7 text-center shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">{label}</p>
        <p className="text-sm text-zinc-200 leading-snug">{value}</p>
      </div>
    </div>
  );
}
