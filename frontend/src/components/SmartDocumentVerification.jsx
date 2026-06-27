import React, { useState, useEffect, useRef, useCallback } from 'react';
import { API_BASE } from '../config';

// ==========================================================================
// SMART AI ONBOARDING & "MY FILES" VAULT
// Eco-AI asks for the user's documents, simulates OCR extraction, and stores
// the verified results in a document vault. Used both for first-time
// onboarding (full flow) and as a standalone vault view (vaultOnly).
// ==========================================================================

const REQUIRED_DOCS = [
  {
    type: 'Emirates ID',
    icon: '🪪',
    blurb: 'Front side of your Emirates ID for identity verification.',
  },
  {
    type: 'Agricultural Holding Certificate',
    icon: '📜',
    blurb: 'Your MOCCAE farm-holding certificate to confirm eligibility.',
  },
];

function formatDate(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

function ScanningOverlay({ docType }) {
  return (
    <div className="flex flex-col items-center justify-center py-14">
      <div className="relative w-40 h-52 rounded-2xl border-2 border-emerald-400/40 bg-emerald-950/30 overflow-hidden shadow-[0_0_40px_rgba(74,222,128,0.25)]">
        {/* Document skeleton lines */}
        <div className="absolute inset-0 p-4 space-y-2 opacity-40">
          <div className="h-3 w-16 rounded bg-emerald-400/40" />
          <div className="h-2 w-24 rounded bg-emerald-400/30" />
          <div className="h-2 w-20 rounded bg-emerald-400/30" />
          <div className="mt-4 h-10 w-10 rounded-full bg-emerald-400/30" />
          <div className="h-2 w-24 rounded bg-emerald-400/30" />
          <div className="h-2 w-16 rounded bg-emerald-400/30" />
        </div>
        {/* Scanning beam */}
        <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-300 to-transparent shadow-[0_0_18px_4px_rgba(74,222,128,0.7)] animate-[ecoScan_1.6s_ease-in-out_infinite]" />
      </div>
      <p className="mt-6 text-emerald-300 font-semibold text-sm flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        Eco AI is extracting data from your {docType}…
      </p>
      <p className="mt-1 text-emerald-600/80 text-xs">Reading fields · Validating authenticity · Securing to vault</p>
      <style>{`
        @keyframes ecoScan {
          0% { top: 6%; }
          50% { top: 88%; }
          100% { top: 6%; }
        }
      `}</style>
    </div>
  );
}

function DocumentCard({ doc, isLight = false }) {
  const days = doc.days_to_expiry;
  const expiringSoon = typeof days === 'number' && days < 60;
  const docMeta = REQUIRED_DOCS.find((d) => d.type === doc.doc_type);

  return (
    <div className={`relative rounded-2xl border transition-all duration-300 hover:-translate-y-0.5 p-5 ${
      isLight 
        ? 'bg-white border-zinc-200 shadow-sm hover:shadow-md text-zinc-800' 
        : 'bg-gradient-to-br from-[#0e1a14] to-[#0a120d] border-emerald-800/50 shadow-lg hover:shadow-emerald-900/30 text-emerald-100'
    }`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-2xl ${
            isLight ? 'bg-emerald-50 border border-emerald-200' : 'bg-emerald-500/15 border border-emerald-500/30'
          }`}>
            {docMeta?.icon || '📄'}
          </div>
          <div>
            <h4 className={`text-xs font-bold leading-tight ${isLight ? 'text-zinc-800' : 'text-emerald-50'}`}>{doc.doc_type}</h4>
            <p className={`text-[10px] ${isLight ? 'text-zinc-500' : 'text-emerald-500/70'}`}>{doc.holder_name || 'Verified holder'}</p>
          </div>
        </div>
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold border ${
          isLight ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
        }`}>
          AI Verified
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className={`rounded-xl px-3 py-2 border ${isLight ? 'bg-zinc-50 border-zinc-200' : 'bg-black/30 border-emerald-900/40'}`}>
          <p className={`text-[9px] uppercase tracking-wider font-bold ${isLight ? 'text-zinc-500' : 'text-emerald-600/80'}`}>License / ID No.</p>
          <p className={`text-xs font-mono font-semibold mt-0.5 break-all ${isLight ? 'text-zinc-800' : 'text-emerald-100'}`}>
            {doc.extracted_id_number || '—'}
          </p>
        </div>
        <div className={`rounded-xl px-3 py-2 border ${isLight ? 'bg-zinc-50 border-zinc-200' : 'bg-black/30 border-emerald-900/40'}`}>
          <p className={`text-[9px] uppercase tracking-wider font-bold ${isLight ? 'text-zinc-500' : 'text-emerald-600/80'}`}>Expiry Date</p>
          <p className={`text-xs font-semibold mt-0.5 ${isLight ? 'text-zinc-800' : 'text-emerald-100'}`}>{formatDate(doc.expiry_date)}</p>
        </div>
      </div>

      {expiringSoon ? (
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-amber-500/10 border border-amber-500/40 px-3 py-2">
          <span className="text-base">⚠️</span>
          <p className="text-[11px] font-semibold text-amber-300 leading-tight">
            Expires in {days} days — Renew via Gov-Connect
          </p>
        </div>
      ) : (
        <div className={`mt-3 flex items-center gap-2 rounded-xl px-3 py-2 border ${
          isLight ? 'bg-emerald-50/50 border-emerald-200/50' : 'bg-emerald-500/5 border-emerald-900/40'
        }`}>
          <span className="text-base">🛡️</span>
          <p className={`text-[11px] font-medium leading-tight ${isLight ? 'text-emerald-700' : 'text-emerald-400/90'}`}>
            Valid{typeof days === 'number' ? ` · ${days} days remaining` : ''}
          </p>
        </div>
      )}

      {doc.file_url && (
        <a
          href={`${API_BASE}${doc.file_url}`}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 hover:text-emerald-500 transition-colors"
        >
          📎 View original file
        </a>
      )}
    </div>
  );
}

export default function SmartDocumentVerification({ token, userName, onComplete, vaultOnly = false }) {
  const [view, setView] = useState(vaultOnly ? 'vault' : 'upload'); // 'upload' | 'scanning' | 'vault'
  const [scanningType, setScanningType] = useState('');
  const [documents, setDocuments] = useState([]);
  const [error, setError] = useState('');
  const [loadingVault, setLoadingVault] = useState(vaultOnly);
  const fileInputs = useRef({});

  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  const fetchDocuments = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/documents`, { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        setDocuments(data);
      }
    } catch {
      /* network error — keep current state */
    } finally {
      setLoadingVault(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (vaultOnly) fetchDocuments();
  }, [vaultOnly, fetchDocuments]);

  const uploadedTypes = documents.map((d) => d.doc_type);
  const allDone = REQUIRED_DOCS.every((d) => uploadedTypes.includes(d.type));

  const handleUpload = async (docType, file) => {
    if (!file) return;
    setError('');
    setScanningType(docType);
    setView('scanning');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('doc_type', docType);

    try {
      const res = await fetch(`${API_BASE}/api/documents/verify`, {
        method: 'POST',
        headers: authHeaders,
        body: formData,
      });
      if (!res.ok) {
        const detail = await res.json().catch(() => ({}));
        throw new Error(detail.detail || 'Verification failed.');
      }
      const data = await res.json();
      setDocuments((prev) => [...prev.filter((d) => d.doc_type !== data.doc_type), data]);
      setView('vault');
    } catch (err) {
      setError(err.message || 'Could not verify the document.');
      setView('upload');
    }
  };

  // ---- VAULT-ONLY MODE (standalone "My Files" inside a portal) ----
  if (vaultOnly) {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className={`text-base font-black flex items-center gap-2 ${vaultOnly ? 'text-zinc-800' : 'text-emerald-50'}`}>🗂️ My Vault</h2>
            <p className={`text-[10px] mt-0.5 ${vaultOnly ? 'text-zinc-500' : 'text-emerald-500/70'}`}>AI-verified documents secured to your account.</p>
          </div>
          <label className={`cursor-pointer inline-flex items-center gap-2 rounded-xl px-4 py-2 text-[10px] font-bold border transition-all ${
            vaultOnly ? 'bg-emerald-600 text-white hover:bg-emerald-555 border-emerald-500/20' : 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25'
          }`}>
            ➕ Add Document
            <input
              type="file"
              accept="image/*,.pdf"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = '';
                // Infer doc type from whichever is still missing, default Emirates ID.
                const missing = REQUIRED_DOCS.find((d) => !uploadedTypes.includes(d.type));
                handleUpload(missing ? missing.type : 'Emirates ID', f);
              }}
            />
          </label>
        </div>

        {error && (
          <div className="rounded-xl bg-red-500/10 border border-red-500/40 px-4 py-2.5 text-xs text-red-300">{error}</div>
        )}

        {view === 'scanning' ? (
          <ScanningOverlay docType={scanningType} />
        ) : loadingVault ? (
          <p className="text-emerald-600/70 text-sm py-10 text-center">Loading your vault…</p>
        ) : documents.length === 0 ? (
          <div className={`rounded-2xl border border-dashed py-12 text-center ${
            vaultOnly ? 'border-zinc-200 bg-zinc-50' : 'border-emerald-800/50 bg-[#0a120d]'
          }`}>
            <div className="text-4xl mb-2">📂</div>
            <p className={`text-sm font-semibold ${vaultOnly ? 'text-zinc-700' : 'text-emerald-300'}`}>No documents yet</p>
            <p className={`text-xs mt-1 ${vaultOnly ? 'text-zinc-400' : 'text-emerald-600/70'}`}>Add your Emirates ID and Agricultural Holding Certificate.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {documents.map((doc) => (
              <DocumentCard key={doc.doc_id} doc={doc} isLight={vaultOnly} />
            ))}
          </div>
        )}
      </div>
    );
  }

  // ---- ONBOARDING FLOW ----
  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-[#06100b] via-[#08140e] to-[#040806] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-3xl">
        {/* Header */}
        <div className="text-center mb-7">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-3xl mb-3 shadow-[0_0_30px_rgba(74,222,128,0.2)]">
            🌿
          </div>
          <h1 className="text-2xl font-black text-emerald-50">Smart Document Verification</h1>
          <p className="text-sm text-emerald-500/80 mt-1">
            Step 2 of 2 · Let Eco AI verify your documents to unlock subsidies & services.
          </p>
        </div>

        <div className="rounded-3xl border border-emerald-800/50 bg-[#0a120d]/90 backdrop-blur-xl shadow-2xl p-6 sm:p-8">
          {error && (
            <div className="mb-4 rounded-xl bg-red-500/10 border border-red-500/40 px-4 py-2.5 text-xs text-red-300 text-center">
              {error}
            </div>
          )}

          {view === 'scanning' ? (
            <ScanningOverlay docType={scanningType} />
          ) : view === 'vault' ? (
            <>
              {/* AI chat bubble */}
              <div className="flex items-start gap-3 mb-5">
                <div className="w-9 h-9 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-lg flex-shrink-0">🤖</div>
                <div className="rounded-2xl rounded-tl-sm bg-emerald-500/10 border border-emerald-800/50 px-4 py-3 text-sm text-emerald-100">
                  {allDone
                    ? 'All set! I have verified your documents and secured them to your vault. 🎉'
                    : 'Great — that one checks out. Please upload the remaining document to continue.'}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {documents.map((doc) => (
                  <DocumentCard key={doc.doc_id} doc={doc} isLight={vaultOnly} />
                ))}
                {/* Pending docs as upload prompts */}
                {REQUIRED_DOCS.filter((d) => !uploadedTypes.includes(d.type)).map((d) => (
                  <label
                    key={d.type}
                    className="cursor-pointer rounded-2xl border-2 border-dashed border-emerald-800/50 bg-black/20 p-5 flex flex-col items-center justify-center text-center hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all min-h-[160px]"
                  >
                    <div className="text-3xl mb-2">{d.icon}</div>
                    <p className="text-sm font-bold text-emerald-100">{d.type}</p>
                    <p className="text-[11px] text-emerald-600/70 mt-1">Tap to upload</p>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        e.target.value = '';
                        handleUpload(d.type, f);
                      }}
                    />
                  </label>
                ))}
              </div>

              <button
                onClick={() => onComplete?.()}
                disabled={!allDone}
                className="mt-6 w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#04130b] font-black text-sm transition-all shadow-lg hover:shadow-emerald-500/30 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {allDone ? 'Continue to Dashboard →' : 'Upload remaining document to continue'}
              </button>
            </>
          ) : (
            <>
              {/* AI chat bubble */}
              <div className="flex items-start gap-3 mb-6">
                <div className="w-9 h-9 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-lg flex-shrink-0">🤖</div>
                <div className="rounded-2xl rounded-tl-sm bg-emerald-500/10 border border-emerald-800/50 px-4 py-3 text-sm text-emerald-100">
                  Hello <span className="font-bold text-emerald-300">{userName || 'there'}</span>! I'm your Eco AI assistant.
                  To finish setting up your account, please upload the two documents below. I'll extract and verify the
                  details automatically — no typing needed.
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {REQUIRED_DOCS.map((d) => {
                  const done = uploadedTypes.includes(d.type);
                  return (
                    <div
                      key={d.type}
                      className={`rounded-2xl border p-5 flex flex-col ${
                        done
                          ? 'border-emerald-500/50 bg-emerald-500/10'
                          : 'border-emerald-800/50 bg-black/20'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">{d.icon}</span>
                        <h4 className="text-sm font-bold text-emerald-50">{d.type}</h4>
                      </div>
                      <p className="text-[11px] text-emerald-600/80 leading-relaxed flex-1">{d.blurb}</p>
                      {done ? (
                        <span className="mt-3 inline-flex items-center justify-center gap-1 rounded-xl bg-emerald-500/15 border border-emerald-500/40 px-3 py-2 text-xs font-bold text-emerald-300">
                          ✅ Verified
                        </span>
                      ) : (
                        <label className="mt-3 cursor-pointer inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-3 py-2.5 text-xs font-black text-[#04130b] transition-all shadow hover:shadow-emerald-500/30">
                          ⬆️ Upload {d.type.split(' ')[0]}
                          <input
                            ref={(el) => (fileInputs.current[d.type] = el)}
                            type="file"
                            accept="image/*,.pdf"
                            className="hidden"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              e.target.value = '';
                              handleUpload(d.type, f);
                            }}
                          />
                        </label>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 flex items-center justify-between gap-3">
                <button
                  onClick={() => onComplete?.()}
                  className="text-xs font-semibold text-emerald-600/80 hover:text-emerald-400 transition-colors"
                >
                  Skip for now
                </button>
                <span className="text-[11px] text-emerald-700/70 flex items-center gap-1.5">
                  🔒 Encrypted & stored securely in your vault
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
