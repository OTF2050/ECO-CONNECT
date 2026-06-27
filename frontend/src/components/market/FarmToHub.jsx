import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { API_BASE as API } from '../../config';

const REGIONS = ['Hatta (Dubai)', 'Al Ain · Eastern Region', 'Liwa Oasis', 'Al Dhafra', 'Sharjah Central'];

// Automated Logistics / Carpooling — neighbouring farmers pool produce into a
// single shared "Farm-to-Hub" delivery trip to cut cost and carbon emissions.
export default function FarmToHub() {
  const { token, name } = useContext(AuthContext);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [busyId, setBusyId] = useState(null);

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    hub_name: '', depart_region: REGIONS[0], depart_date: '', depart_time: '06:00',
    capacity_kg: 500, distance_km: 60, notes: '', produce: '', weight_kg: 0,
  });

  // Join form state keyed by trip id
  const [joinDraft, setJoinDraft] = useState({});

  const authHeaders = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/logistics/trips`);
      if (!res.ok) throw new Error('Could not load trips.');
      setTrips(await res.json());
    } catch (e) {
      setMsg(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const isOnTrip = (trip) => trip.participants.some((p) => p.farmer_name && p.farmer_name === name);

  const createTrip = async (e) => {
    e.preventDefault();
    setMsg('');
    try {
      const res = await fetch(`${API}/api/logistics/trips`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          ...form,
          capacity_kg: parseFloat(form.capacity_kg) || 500,
          distance_km: parseFloat(form.distance_km) || 60,
          weight_kg: parseFloat(form.weight_kg) || 0,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.detail || 'Could not create trip.');
      }
      setShowCreate(false);
      setForm({ hub_name: '', depart_region: REGIONS[0], depart_date: '', depart_time: '06:00', capacity_kg: 500, distance_km: 60, notes: '', produce: '', weight_kg: 0 });
      setMsg('🚛 Shared trip created.');
      load();
    } catch (e) {
      setMsg(e.message);
    }
  };

  const joinTrip = async (tripId) => {
    const draft = joinDraft[tripId] || {};
    if (!draft.produce) { setMsg('Describe your produce to join.'); return; }
    setBusyId(tripId);
    setMsg('');
    try {
      const res = await fetch(`${API}/api/logistics/trips/${tripId}/join`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ produce: draft.produce, weight_kg: parseFloat(draft.weight_kg) || 0 }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.detail || 'Could not join trip.');
      }
      setJoinDraft((p) => ({ ...p, [tripId]: { produce: '', weight_kg: '' } }));
      setMsg('✅ Joined the shared delivery.');
      load();
    } catch (e) {
      setMsg(e.message);
    } finally {
      setBusyId(null);
    }
  };

  const leaveTrip = async (tripId) => {
    setBusyId(tripId);
    setMsg('');
    try {
      const res = await fetch(`${API}/api/logistics/trips/${tripId}/leave`, { method: 'DELETE', headers: authHeaders });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.detail || 'Could not leave trip.');
      }
      setMsg('You left the trip.');
      load();
    } catch (e) {
      setMsg(e.message);
    } finally {
      setBusyId(null);
    }
  };

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const setJoin = (id, k, v) => setJoinDraft((p) => ({ ...p, [id]: { ...(p[id] || {}), [k]: v } }));

  return (
    <div className="bg-[#15171e] border border-zinc-800 rounded-2xl p-5 space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">🚛</span>
          <div>
            <h3 className="text-sm font-bold text-zinc-100">Farm-to-Hub Carpooling</h3>
            <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">Pool produce · share a delivery · cut emissions</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreate((s) => !s)}
          className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-lg hover:opacity-90 transition-all"
        >
          {showCreate ? '✕ Cancel' : '+ Organize a Trip'}
        </button>
      </div>

      {msg && <div className="bg-zinc-800/50 border border-zinc-700 text-zinc-300 text-xs p-2.5 rounded-xl">{msg}</div>}

      {showCreate && (
        <form onSubmit={createTrip} className="bg-[#0a0a0a] border border-zinc-850 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Destination hub / market">
            <input required value={form.hub_name} onChange={(e) => set('hub_name', e.target.value)} placeholder="Dubai Central Produce Market" className="inp" />
          </Field>
          <Field label="Departure region">
            <select value={form.depart_region} onChange={(e) => set('depart_region', e.target.value)} className="inp">
              {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </Field>
          <Field label="Date">
            <input required type="date" value={form.depart_date} onChange={(e) => set('depart_date', e.target.value)} className="inp" />
          </Field>
          <Field label="Time">
            <input type="time" value={form.depart_time} onChange={(e) => set('depart_time', e.target.value)} className="inp" />
          </Field>
          <Field label="Truck capacity (kg)">
            <input type="number" value={form.capacity_kg} onChange={(e) => set('capacity_kg', e.target.value)} className="inp" />
          </Field>
          <Field label="One-way distance (km)">
            <input type="number" value={form.distance_km} onChange={(e) => set('distance_km', e.target.value)} className="inp" />
          </Field>
          <Field label="Your produce (optional)">
            <input value={form.produce} onChange={(e) => set('produce', e.target.value)} placeholder="Khalas dates (8 crates)" className="inp" />
          </Field>
          <Field label="Your load (kg)">
            <input type="number" value={form.weight_kg} onChange={(e) => set('weight_kg', e.target.value)} className="inp" />
          </Field>
          <div className="sm:col-span-2">
            <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2.5 rounded-xl transition-all">Create Shared Trip</button>
          </div>
          <style>{`.inp{width:100%;background:#15171e;border:1px solid #27272a;border-radius:0.6rem;padding:0.6rem;font-size:0.72rem;color:#d4d4d8;outline:none}.inp:focus{border-color:#10b981}`}</style>
        </form>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-xs text-zinc-500 py-4">
          <span className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" /> Loading shared trips…
        </div>
      ) : trips.length === 0 ? (
        <p className="text-xs text-zinc-500 text-center py-6">No shared trips yet. Organize the first one above.</p>
      ) : (
        <div className="space-y-3">
          {trips.map((t) => {
            const mine = isOnTrip(t);
            return (
              <div key={t.id} className="bg-[#0a0a0a] border border-zinc-850 rounded-xl p-4 space-y-3">
                <div className="flex justify-between items-start gap-3 flex-wrap">
                  <div>
                    <h4 className="text-sm font-bold text-zinc-100">📍 {t.hub_name}</h4>
                    <p className="text-[11px] text-zinc-500 mt-0.5">From {t.depart_region} · {t.depart_date}{t.depart_time ? ` · ${t.depart_time}` : ''}</p>
                  </div>
                  <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full uppercase">{t.status}</span>
                </div>

                {/* Sustainability impact */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <Stat label="Farmers" value={t.participant_count} accent="text-zinc-200" />
                  <Stat label="CO₂ saved" value={`${t.co2_saved_kg} kg`} accent="text-emerald-400" />
                  <Stat label="Cost saved" value={`${t.cost_saved_aed} AED`} accent="text-teal-300" />
                </div>

                {/* Capacity fill */}
                <div>
                  <div className="flex justify-between text-[10px] font-mono text-zinc-500 mb-1">
                    <span>{t.total_weight_kg} / {t.capacity_kg} kg</span>
                    <span>{t.fill_pct}% full</span>
                  </div>
                  <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400" style={{ width: `${t.fill_pct}%` }} />
                  </div>
                </div>

                {/* Manifest */}
                {t.participants.length > 0 && (
                  <div className="space-y-1">
                    {t.participants.map((p) => (
                      <div key={p.id} className="flex justify-between text-[11px] bg-[#15171e] border border-zinc-850 rounded-lg px-3 py-1.5">
                        <span className="text-zinc-300">🧺 {p.produce}</span>
                        <span className="text-zinc-500 font-mono">{p.farmer_name} · {p.weight_kg}kg</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Action */}
                {mine ? (
                  <button onClick={() => leaveTrip(t.id)} disabled={busyId === t.id} className="w-full border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 text-xs font-bold py-2 rounded-xl transition-all disabled:opacity-60">
                    {busyId === t.id ? 'Leaving…' : 'Leave this trip'}
                  </button>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      value={(joinDraft[t.id]?.produce) || ''}
                      onChange={(e) => setJoin(t.id, 'produce', e.target.value)}
                      placeholder="Your produce"
                      className="flex-1 bg-[#15171e] border border-zinc-800 focus:border-emerald-500 rounded-lg px-3 py-2 text-xs text-zinc-300 outline-none"
                    />
                    <input
                      type="number"
                      value={(joinDraft[t.id]?.weight_kg) || ''}
                      onChange={(e) => setJoin(t.id, 'weight_kg', e.target.value)}
                      placeholder="kg"
                      className="w-full sm:w-20 bg-[#15171e] border border-zinc-800 focus:border-emerald-500 rounded-lg px-3 py-2 text-xs text-zinc-300 outline-none"
                    />
                    <button onClick={() => joinTrip(t.id)} disabled={busyId === t.id} className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition-all disabled:opacity-60 whitespace-nowrap">
                      {busyId === t.id ? '…' : 'Join Pool'}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
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

function Stat({ label, value, accent }) {
  return (
    <div className="bg-[#15171e] border border-zinc-850 rounded-lg py-2">
      <p className={`text-sm font-black ${accent}`}>{value}</p>
      <p className="text-[9px] uppercase font-mono text-zinc-500">{label}</p>
    </div>
  );
}
