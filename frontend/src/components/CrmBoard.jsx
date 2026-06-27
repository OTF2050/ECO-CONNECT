import React, { useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from '../context/AuthContext';
import { API_BASE as API } from '../config';

const STAGES = [
  { id: 'new', label: 'New', color: 'border-zinc-700' },
  { id: 'contacted', label: 'Contacted', color: 'border-blue-700/50' },
  { id: 'negotiating', label: 'Negotiating', color: 'border-amber-700/50' },
  { id: 'won', label: 'Won', color: 'border-emerald-700/50' },
  { id: 'lost', label: 'Lost', color: 'border-rose-800/50' },
];

const TYPE_ICON = { lead: '🌱', customer: '⭐', supplier: '📦', partner: '🤝' };

export default function CrmBoard() {
  const { token } = useContext(AuthContext);
  const [contacts, setContacts] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [active, setActive] = useState(null); // contact for interaction drawer
  const [interactions, setInteractions] = useState([]);
  const [logText, setLogText] = useState('');
  const [logKind, setLogKind] = useState('note');

  const [form, setForm] = useState({ name: '', contact_type: 'lead', email: '', phone: '', company: '', value: '', status: 'new', notes: '' });

  const authHeaders = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cRes, sRes] = await Promise.all([
        fetch(`${API}/api/crm/contacts`, { headers: authHeaders }),
        fetch(`${API}/api/crm/summary`, { headers: authHeaders }),
      ]);
      if (cRes.ok) setContacts(await cRes.json());
      if (sRes.ok) setSummary(await sRes.json());
    } catch { /* offline */ }
    finally { setLoading(false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const addContact = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    const res = await fetch(`${API}/api/crm/contacts`, {
      method: 'POST', headers: authHeaders,
      body: JSON.stringify({ ...form, value: parseFloat(form.value) || 0 }),
    });
    if (res.ok) {
      setForm({ name: '', contact_type: 'lead', email: '', phone: '', company: '', value: '', status: 'new', notes: '' });
      setShowForm(false);
      load();
    }
  };

  const moveStage = async (id, status) => {
    await fetch(`${API}/api/crm/contacts/${id}/status`, { method: 'PATCH', headers: authHeaders, body: JSON.stringify({ status }) });
    load();
  };

  const removeContact = async (id) => {
    await fetch(`${API}/api/crm/contacts/${id}`, { method: 'DELETE', headers: authHeaders });
    if (active?.id === id) setActive(null);
    load();
  };

  const openDrawer = async (contact) => {
    setActive(contact);
    setInteractions([]);
    const res = await fetch(`${API}/api/crm/contacts/${contact.id}/interactions`, { headers: authHeaders });
    if (res.ok) setInteractions(await res.json());
  };

  const logInteraction = async (e) => {
    e.preventDefault();
    if (!logText.trim() || !active) return;
    const res = await fetch(`${API}/api/crm/contacts/${active.id}/interactions`, {
      method: 'POST', headers: authHeaders, body: JSON.stringify({ kind: logKind, summary: logText }),
    });
    if (res.ok) {
      setLogText('');
      openDrawer(active);
      load();
    }
  };

  const kpis = summary ? [
    { label: 'Contacts', value: summary.total_contacts, icon: '👥', tone: 'text-zinc-100' },
    { label: 'Customers', value: summary.customers, icon: '⭐', tone: 'text-emerald-400' },
    { label: 'Won Value', value: `${(summary.won_value || 0).toLocaleString()} AED`, icon: '💰', tone: 'text-[#c2964b]' },
    { label: 'Open Pipeline', value: `${(summary.open_value || 0).toLocaleString()} AED`, icon: '📈', tone: 'text-blue-400' },
  ] : [];

  return (
    <div className="max-w-6xl mx-auto w-full space-y-6">
      <div className="bg-[#15171e] border border-zinc-800/60 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🤝</span>
          <div>
            <h2 className="text-md font-bold text-zinc-100">Customer CRM</h2>
            <p className="text-[10px] text-zinc-400 font-mono">LEADS · CUSTOMERS · SUPPLIERS · PARTNERS</p>
          </div>
        </div>
        <button onClick={() => setShowForm((v) => !v)} className="bg-[#247055] hover:bg-emerald-600 text-white font-bold py-2.5 px-5 rounded-xl text-xs transition-all flex items-center gap-2">
          <span>+</span> Add Contact
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {kpis.map((s) => (
          <div key={s.label} className="bg-[#15171e] border border-zinc-800/60 rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">{s.label}</span>
              <span className="text-base">{s.icon}</span>
            </div>
            <p className={`text-lg font-black mt-1 ${s.tone}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Add form */}
      {showForm && (
        <form onSubmit={addContact} className="bg-[#15171e] border border-zinc-800 rounded-2xl p-5 grid grid-cols-1 md:grid-cols-3 gap-3">
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Name *" className="bg-[#0a0a0a] border border-zinc-800 focus:border-emerald-500 rounded-xl p-3 text-xs text-zinc-300 outline-none" required />
          <input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="Company" className="bg-[#0a0a0a] border border-zinc-800 focus:border-emerald-500 rounded-xl p-3 text-xs text-zinc-300 outline-none" />
          <select value={form.contact_type} onChange={(e) => setForm({ ...form, contact_type: e.target.value })} className="bg-[#0a0a0a] border border-zinc-800 focus:border-emerald-500 rounded-xl p-3 text-xs text-zinc-300 outline-none">
            <option value="lead">Lead</option><option value="customer">Customer</option><option value="supplier">Supplier</option><option value="partner">Partner</option>
          </select>
          <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" className="bg-[#0a0a0a] border border-zinc-800 focus:border-emerald-500 rounded-xl p-3 text-xs text-zinc-300 outline-none" />
          <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Phone" className="bg-[#0a0a0a] border border-zinc-800 focus:border-emerald-500 rounded-xl p-3 text-xs text-zinc-300 outline-none" />
          <input type="number" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} placeholder="Deal value (AED)" className="bg-[#0a0a0a] border border-zinc-800 focus:border-emerald-500 rounded-xl p-3 text-xs text-zinc-300 outline-none" />
          <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Notes" className="md:col-span-2 bg-[#0a0a0a] border border-zinc-800 focus:border-emerald-500 rounded-xl p-3 text-xs text-zinc-300 outline-none" />
          <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-all py-3">Save Contact</button>
        </form>
      )}

      {/* Pipeline board */}
      {loading ? (
        <div className="text-center text-zinc-500 text-sm py-12">Loading CRM…</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-3">
          {STAGES.map((stage) => {
            const items = contacts.filter((c) => c.status === stage.id);
            return (
              <div key={stage.id} className={`bg-[#0f1115] border ${stage.color} rounded-2xl p-3 min-h-[120px]`}>
                <div className="flex items-center justify-between mb-3 px-1">
                  <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-wide">{stage.label}</span>
                  <span className="text-[9px] font-bold bg-zinc-800 text-zinc-400 rounded-full px-2 py-0.5">{items.length}</span>
                </div>
                <div className="space-y-2">
                  {items.map((c) => (
                    <div key={c.id} className="bg-[#15171e] border border-zinc-800 rounded-xl p-3 group">
                      <div className="flex items-start justify-between gap-2">
                        <button onClick={() => openDrawer(c)} className="text-left flex-1">
                          <p className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">{TYPE_ICON[c.contact_type] || '•'} {c.name}</p>
                          {c.company && <p className="text-[10px] text-zinc-500">{c.company}</p>}
                        </button>
                        <button onClick={() => removeContact(c.id)} className="text-zinc-700 hover:text-rose-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                      </div>
                      {c.value > 0 && <p className="text-[10px] text-[#c2964b] font-bold mt-1">{c.value.toLocaleString()} AED</p>}
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-[9px] text-zinc-600">{c.interactions_count} log{c.interactions_count === 1 ? '' : 's'}</span>
                        <select value={c.status} onChange={(e) => moveStage(c.id, e.target.value)} className="bg-[#0a0a0a] border border-zinc-800 rounded-md text-[9px] text-zinc-400 outline-none px-1 py-0.5">
                          {STAGES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                        </select>
                      </div>
                    </div>
                  ))}
                  {items.length === 0 && <p className="text-[10px] text-zinc-700 text-center py-3">Empty</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Interaction drawer */}
      {active && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setActive(null)}>
          <div className="absolute inset-0 bg-black/60" />
          <div className="relative w-full max-w-md bg-[#0f1115] border-l border-zinc-800 h-full overflow-y-auto p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">{TYPE_ICON[active.contact_type]} {active.name}</h3>
                <p className="text-[11px] text-zinc-500">{active.company || '—'} · {active.contact_type}</p>
              </div>
              <button onClick={() => setActive(null)} className="text-zinc-500 hover:text-zinc-200 text-lg">✕</button>
            </div>
            <div className="space-y-1 text-[11px] text-zinc-400 bg-[#15171e] border border-zinc-800 rounded-xl p-3 mb-4">
              {active.email && <p>✉️ {active.email}</p>}
              {active.phone && <p>📞 {active.phone}</p>}
              {active.value > 0 && <p>💰 {active.value.toLocaleString()} AED</p>}
              {active.notes && <p className="text-zinc-500 italic pt-1 border-t border-zinc-850 mt-1">{active.notes}</p>}
            </div>

            <form onSubmit={logInteraction} className="space-y-2 mb-4">
              <div className="flex gap-2">
                <select value={logKind} onChange={(e) => setLogKind(e.target.value)} className="bg-[#15171e] border border-zinc-800 rounded-lg text-[11px] text-zinc-300 outline-none px-2">
                  <option value="note">📝 Note</option><option value="call">📞 Call</option><option value="email">✉️ Email</option><option value="meeting">🤝 Meeting</option>
                </select>
                <input value={logText} onChange={(e) => setLogText(e.target.value)} placeholder="Log an interaction…" className="flex-1 bg-[#15171e] border border-zinc-800 focus:border-emerald-500 rounded-lg px-3 text-[11px] text-zinc-300 outline-none py-2" />
                <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold rounded-lg px-3 transition-all">Log</button>
              </div>
            </form>

            <h4 className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider mb-2">Timeline</h4>
            <div className="space-y-2">
              {interactions.length === 0 && <p className="text-[11px] text-zinc-600">No interactions logged yet.</p>}
              {interactions.map((i) => (
                <div key={i.id} className="bg-[#15171e] border border-zinc-800 rounded-xl p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase">{i.kind}</span>
                    <span className="text-[9px] text-zinc-600 font-mono">{i.created_at}</span>
                  </div>
                  <p className="text-[11px] text-zinc-300 mt-1">{i.summary}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
