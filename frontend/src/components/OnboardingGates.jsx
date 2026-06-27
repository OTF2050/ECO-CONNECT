import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { API_BASE } from '../config';

// ── Pending Approval State Screen ───────────────────────────────────────────
export function PendingApprovalScreen({ role }) {
  const { logout, refreshStatus, simulateApproval } = useContext(AuthContext);
  const [checking, setChecking] = useState(false);

  const handleRefresh = async () => {
    setChecking(true);
    await refreshStatus();
    setTimeout(() => setChecking(false), 800);
  };

  return (
    <div className="min-h-screen bg-[#07080a] flex flex-col items-center justify-center p-6 text-center select-none text-zinc-100 font-sans">
      <div className="w-full max-w-md bg-zinc-950/80 border border-zinc-800 rounded-3xl p-8 space-y-6 shadow-2xl relative backdrop-blur-xl">
        <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/30 text-amber-500 rounded-full flex items-center justify-center text-3xl mx-auto animate-pulse">
          ⏳
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold tracking-tight text-zinc-100">
            Verification Under Review
          </h2>
          <span className="inline-block text-[9px] font-bold tracking-widest uppercase text-[#c2a14e] border border-[#c2a14e]/40 rounded-full px-3 py-1 bg-[#faf6ec]/5">
            Ministry of Climate Change & Environment
          </span>
        </div>
        <p className="text-xs text-zinc-400 leading-relaxed font-light">
          Your credentials have been submitted. An administrator from the UAE Ministry of Climate Change & Environment (MOCCAE) will review your {role === 'farmer' ? 'Agricultural Holding Certificate' : 'Government Investor Verification'} shortly.
        </p>
        <div className="bg-[#faf6ec]/5 border border-zinc-850 rounded-xl p-4 text-[10px] text-zinc-400 text-left font-mono space-y-1">
          <div className="flex justify-between">
            <span>● Account registration:</span>
            <span className="text-emerald-450">Complete ✓</span>
          </div>
          <div className="flex justify-between">
            <span>● Document upload:</span>
            <span className="text-emerald-450">AI-Verified ✓</span>
          </div>
          <div className="flex justify-between">
            <span>● MOCCAE Auditor sign-off:</span>
            <span className="text-amber-400 animate-pulse">Pending...</span>
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <button
            onClick={handleRefresh}
            disabled={checking}
            className="flex-1 bg-emerald-700 hover:bg-emerald-650 text-white font-bold py-3 rounded-xl text-xs uppercase cursor-pointer transition-all shadow-md active:scale-95 disabled:opacity-50"
          >
            {checking ? 'Checking Status...' : 'Refresh Status 🔄'}
          </button>
          <button
            onClick={logout}
            className="flex-1 bg-zinc-850 hover:bg-zinc-800 text-zinc-300 font-bold py-3 rounded-xl text-xs uppercase cursor-pointer transition-all active:scale-95"
          >
            Log Out ✕
          </button>
        </div>

        {/* Hidden dev-only shortcut to bypass MOCCAE approval for the demo */}
        <button
          onClick={simulateApproval}
          title="Developer shortcut — bypasses approval for the demo"
          className="w-full text-[9px] font-mono uppercase tracking-widest text-zinc-700 hover:text-amber-400 border border-dashed border-zinc-850 hover:border-amber-500/40 rounded-lg py-2 transition-all cursor-pointer"
        >
          ⚡ Simulate Approval (dev only)
        </button>
      </div>
    </div>
  );
}

// ── Farmer Onboarding Document Upload ──────────────────────────────────────
export function FarmerOnboardingUpload() {
  const { logout, token, refreshStatus } = useContext(AuthContext);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError('');
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file to upload.');
      return;
    }
    setUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('doc_type', 'Agricultural Holding Certificate');

    try {
      const res = await fetch(`${API_BASE}/api/documents/verify`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || 'File verification failed.');
      }

      setSuccess(true);
      await refreshStatus(); // updates status to pending_approval in AuthContext
    } catch (err) {
      setError(err.message || 'Error uploading document.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07080a] flex flex-col items-center justify-center p-6 text-zinc-100 font-sans">
      <div className="w-full max-w-lg bg-zinc-950/80 border border-zinc-800 rounded-3xl p-8 space-y-6 shadow-2xl relative">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-lg font-bold text-zinc-100">Farm Verification Gate</h2>
            <p className="text-xs text-zinc-550">Upload your credentials to activate your Farmer Account</p>
          </div>
          <span className="text-3xl">🌾</span>
        </div>

        <form onSubmit={handleUploadSubmit} className="space-y-5 text-left">
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl p-3.5 text-xs text-center">
              ⚠️ {error}
            </div>
          )}

          <div className="bg-[#faf6ec]/5 border border-zinc-850 rounded-2xl p-5 space-y-3">
            <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Instructions</span>
            <p className="text-xs text-zinc-400 font-light leading-relaxed">
              MOCCAE requires all local agricultural suppliers to upload their **Agricultural Holding Certificate** to register for direct wholesale trades on Eco Souq.
            </p>
          </div>

          <div className="flex flex-col items-center justify-center border border-dashed border-zinc-800 rounded-2xl p-6 hover:border-zinc-700 transition-all bg-[#0a0c10]/40">
            <div className="text-4xl mb-3">📄</div>
            <label className="text-xs font-bold text-zinc-300 cursor-pointer hover:text-emerald-450 block text-center">
              {file ? file.name : 'Select Agricultural Holding Certificate (PDF, PNG, JPG)'}
              <input
                type="file"
                required
                accept=".pdf,.png,.jpg,.jpeg,.webp"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
            {file && (
              <span className="text-[10px] text-zinc-500 mt-1 block">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={uploading || success}
              className="flex-1 bg-emerald-700 hover:bg-emerald-650 text-white font-bold py-3 rounded-xl text-xs uppercase cursor-pointer transition-all shadow-md active:scale-95 disabled:opacity-50"
            >
              {uploading ? 'Processing AI Vision OCR...' : 'Upload & AI Verify 🚀'}
            </button>
            <button
              type="button"
              onClick={logout}
              className="px-5 bg-zinc-850 hover:bg-zinc-800 text-zinc-300 font-bold py-3 rounded-xl text-xs uppercase cursor-pointer transition-all active:scale-95"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Investor Onboarding Document Upload & Questionnaire ─────────────────────
export function InvestorOnboardingForm() {
  const { logout, token, refreshStatus } = useContext(AuthContext);
  const [file, setFile] = useState(null);
  const [capacity, setCapacity] = useState('< 500k AED');
  const [sectors, setSectors] = useState([]);
  const [investorType, setInvestorType] = useState('Individual Angel');
  const [focus, setFocus] = useState('AgTech');
  const [ticket, setTicket] = useState(250000);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError('');
    }
  };

  const handleSectorChange = (sector) => {
    setSectors(prev =>
      prev.includes(sector)
        ? prev.filter(s => s !== sector)
        : [...prev, sector]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please upload your government verification document (e.g. trade license or EID).');
      return;
    }
    if (sectors.length === 0) {
      setError('Please select at least one sector of interest.');
      return;
    }
    setUploading(true);
    setError('');

    try {
      // 1. Upload verification file
      const docFormData = new FormData();
      docFormData.append('file', file);
      docFormData.append('doc_type', 'Investor Government Verification');

      const docRes = await fetch(`${API_BASE}/api/documents/verify`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: docFormData
      });

      if (!docRes.ok) {
        throw new Error('Verification document upload failed.');
      }

      // 2. Submit investor questionnaire
      const questionnaireRes = await fetch(`${API_BASE}/api/user/investor-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          answers: {
            investment_capacity: capacity,
            sectors_of_interest: sectors,
            investor_type: investorType,
            investment_focus: focus,
            expected_ticket_aed: ticket
          }
        })
      });

      if (!questionnaireRes.ok) {
        throw new Error('Questionnaire submission failed.');
      }

      setSuccess(true);
      await refreshStatus(); // updates status in AuthContext to pending_approval
    } catch (err) {
      setError(err.message || 'An error occurred during onboarding.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07080a] flex flex-col items-center justify-center p-6 text-zinc-100 font-sans">
      <div className="w-full max-w-lg bg-zinc-950/80 border border-zinc-800 rounded-3xl p-8 space-y-6 shadow-2xl relative my-8">
        <div className="flex justify-between items-start text-left">
          <div>
            <h2 className="text-lg font-bold text-zinc-100">Investor Verification Gate</h2>
            <p className="text-xs text-zinc-550">Submit credentials & questionnaire to access investment deals</p>
          </div>
          <span className="text-3xl">💼</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl p-3.5 text-xs text-center">
              ⚠️ {error}
            </div>
          )}

          {/* Section 1: Upload Credentials */}
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-zinc-550 tracking-wider">
              1. Government Verification Document *
            </label>
            <div className="flex flex-col items-center justify-center border border-dashed border-zinc-800 rounded-2xl p-5 hover:border-zinc-700 transition-all bg-[#0a0c10]/40">
              <span className="text-3xl mb-2">📜</span>
              <label className="text-xs font-bold text-zinc-300 cursor-pointer hover:text-emerald-450 text-center">
                {file ? file.name : 'Upload Corporate License / Passports (PDF, PNG, JPG)'}
                <input
                  type="file"
                  required
                  accept=".pdf,.png,.jpg,.jpeg,.webp"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Section 2: Questionnaire */}
          <div className="space-y-3 pt-2">
            <span className="text-[10px] uppercase font-bold text-zinc-550 tracking-wider block">
              2. ESG Investor Questionnaire
            </span>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] uppercase font-semibold text-zinc-500">Investment Capacity</label>
                <select
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  className="bg-[#0a0c10] border border-zinc-800 rounded-xl p-2.5 text-xs text-zinc-350 outline-none"
                >
                  <option value="< 500k AED">&lt; 500,000 AED</option>
                  <option value="500k - 2M AED">500,000 – 2,000,000 AED</option>
                  <option value="2M - 10M AED">2,000,000 – 10,000,000 AED</option>
                  <option value="> 10M AED">&gt; 10,000,000 AED</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] uppercase font-semibold text-zinc-500">Investor Type</label>
                <select
                  value={investorType}
                  onChange={(e) => setInvestorType(e.target.value)}
                  className="bg-[#0a0c10] border border-zinc-800 rounded-xl p-2.5 text-xs text-zinc-350 outline-none"
                >
                  <option value="Individual Angel">Individual Angel</option>
                  <option value="Sovereign Fund">Sovereign Wealth Fund</option>
                  <option value="Corporate Venture">Corporate Venture Capital</option>
                  <option value="Impact ESG Fund">Impact ESG Fund</option>
                </select>
              </div>
            </div>

            {/* Investment focus + expected ticket */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] uppercase font-semibold text-zinc-500">Investment Focus</label>
                <select
                  value={focus}
                  onChange={(e) => setFocus(e.target.value)}
                  className="bg-[#0a0c10] border border-zinc-800 rounded-xl p-2.5 text-xs text-zinc-350 outline-none"
                >
                  <option value="AgTech">AgTech</option>
                  <option value="Solar">Solar</option>
                  <option value="Logistics">Logistics</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[9px] uppercase font-semibold text-zinc-500">Expected Ticket</label>
                  <span className="text-[10px] font-bold text-emerald-400 font-mono">{Number(ticket).toLocaleString('en-AE')} AED</span>
                </div>
                <input
                  type="range"
                  min="50000"
                  max="5000000"
                  step="50000"
                  value={ticket}
                  onChange={(e) => setTicket(Number(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer mt-2"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5 pt-1">
              <label className="text-[9px] uppercase font-semibold text-zinc-500">Primary Sectors of Interest *</label>
              <div className="grid grid-cols-2 gap-2 text-xs text-zinc-350">
                {[
                  { id: 'beekeeping', label: 'Organic Beekeeping' },
                  { id: 'dates', label: 'Sidr Palm Farming' },
                  { id: 'agritech', label: 'AgriTech Innovation' },
                  { id: 'tourism', label: 'Rural Ecotourism' }
                ].map(sec => (
                  <label key={sec.id} className="flex items-center gap-2 bg-[#0a0c10]/60 p-2 rounded-lg border border-zinc-850 cursor-pointer hover:border-zinc-800">
                    <input
                      type="checkbox"
                      checked={sectors.includes(sec.label)}
                      onChange={() => handleSectorChange(sec.label)}
                      className="accent-emerald-600 rounded"
                    />
                    <span>{sec.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={uploading || success}
              className="flex-1 bg-emerald-700 hover:bg-emerald-650 text-white font-bold py-3 rounded-xl text-xs uppercase cursor-pointer transition-all shadow-md active:scale-95 disabled:opacity-50"
            >
              {uploading ? 'Registering ESG Account...' : 'Submit Profile 🚀'}
            </button>
            <button
              type="button"
              onClick={logout}
              className="px-5 bg-zinc-850 hover:bg-zinc-800 text-zinc-300 font-bold py-3 rounded-xl text-xs uppercase cursor-pointer transition-all active:scale-95"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Gatekeeper Wrappers for Portal Routes ───────────────────────────────────
export function FarmerGatekeeper({ children }) {
  const { user, status } = useContext(AuthContext);

  if (user && user.role === 'admin') {
    return children;
  }

  if (status === 'pending_onboarding') {
    return <FarmerOnboardingUpload />;
  }

  if (status === 'pending_approval') {
    return <PendingApprovalScreen role="farmer" />;
  }

  return children;
}

export function InvestorGatekeeper({ children }) {
  const { user, status } = useContext(AuthContext);

  if (user && user.role === 'admin') {
    return children;
  }

  if (status === 'pending_onboarding') {
    return <InvestorOnboardingForm />;
  }

  if (status === 'pending_approval') {
    return <PendingApprovalScreen role="investor" />;
  }

  return children;
}
