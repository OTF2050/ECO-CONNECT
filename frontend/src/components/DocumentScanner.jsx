import React, { useState, useRef } from 'react';
import { API_BASE as API } from '../config';

const DOC_LABEL = {
  trade_license: '🪪 Trade Licence',
  invoice: '🧾 Invoice',
  id: '🆔 Identity Document',
  permit: '📜 Permit',
  receipt: '🧾 Receipt',
  other: '📄 Document',
  unknown: '❔ Unknown',
};

export default function DocumentScanner() {
  const [preview, setPreview] = useState(null);
  const [imageB64, setImageB64] = useState(null);
  const [manualText, setManualText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const fileRef = useRef(null);

  const onFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setResult(null);
    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result);
      setImageB64(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const scan = async () => {
    if (!imageB64 && !manualText.trim()) {
      setError('Upload a document image or paste its text first.');
      return;
    }
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch(`${API}/api/ocr`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_base64: imageB64, text: manualText || null }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.detail || 'Scan failed.');
      }
      setResult(await res.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setPreview(null); setImageB64(null); setManualText(''); setResult(null); setError('');
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="max-w-5xl mx-auto w-full space-y-6">
      <div className="bg-[#15171e] border border-zinc-800/60 p-4 rounded-2xl flex items-center gap-3">
        <span className="text-2xl">📷</span>
        <div>
          <h2 className="text-md font-bold text-zinc-100">Document Scanner (OCR)</h2>
          <p className="text-[10px] text-zinc-400 font-mono">EXTRACT & STRUCTURE LICENCES · INVOICES · PERMITS</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload side */}
        <div className="bg-[#15171e] border border-zinc-800 rounded-2xl p-5 space-y-4">
          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-zinc-700 hover:border-emerald-600 rounded-2xl p-8 text-center cursor-pointer transition-all"
          >
            {preview ? (
              <img src={preview} alt="document preview" className="max-h-52 mx-auto rounded-lg" />
            ) : (
              <>
                <div className="text-4xl mb-2 opacity-70">📤</div>
                <p className="text-sm text-zinc-300 font-semibold">Click to upload a document image</p>
                <p className="text-[11px] text-zinc-500 mt-1">PNG / JPG of a licence, invoice or permit</p>
              </>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={onFile} className="hidden" />

          <div className="flex items-center gap-3">
            <span className="flex-1 h-px bg-zinc-800" />
            <span className="text-[10px] uppercase font-bold text-zinc-600 tracking-widest">or paste text</span>
            <span className="flex-1 h-px bg-zinc-800" />
          </div>
          <textarea
            value={manualText}
            onChange={(e) => setManualText(e.target.value)}
            rows={4}
            placeholder="Paste text from a document to structure it (works without an OCR engine)…"
            className="w-full bg-[#0a0a0a] border border-zinc-800 focus:border-emerald-500 rounded-xl p-3 text-xs text-zinc-300 outline-none resize-none"
          />

          <div className="flex gap-2">
            <button onClick={scan} disabled={loading} className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-3 rounded-xl text-xs transition-all disabled:opacity-50">
              {loading ? 'Scanning…' : 'Scan & Extract 🔍'}
            </button>
            <button onClick={reset} className="bg-[#1f222d] hover:bg-zinc-700 text-zinc-300 font-bold py-3 px-4 rounded-xl text-xs border border-zinc-700/50 transition-all">Reset</button>
          </div>
          {error && <p className="text-rose-400 text-xs">{error}</p>}
        </div>

        {/* Result side */}
        <div className="space-y-4">
          {!result && !loading && (
            <div className="h-full border border-dashed border-zinc-800 rounded-2xl p-10 flex flex-col items-center justify-center text-center">
              <div className="text-5xl mb-3 opacity-60">🗂️</div>
              <p className="text-sm text-zinc-300 font-semibold">Extracted fields appear here</p>
              <p className="text-xs text-zinc-500 mt-1">Document type, key fields and raw text.</p>
            </div>
          )}
          {result && (
            <>
              <div className="bg-[#15171e] border border-zinc-800 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-bold text-zinc-100">{DOC_LABEL[result.doc_type] || DOC_LABEL.other}</span>
                  <span className={`text-[9px] font-bold px-2 py-1 rounded-full border ${result.ai_processed ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' : 'text-amber-400 border-amber-500/30 bg-amber-500/10'}`}>
                    {result.ai_processed ? 'AI STRUCTURED' : 'PATTERN MATCH'}
                  </span>
                </div>
                {Object.keys(result.fields || {}).length === 0 ? (
                  <p className="text-[11px] text-zinc-500">No structured fields detected.</p>
                ) : (
                  <div className="space-y-1.5">
                    {Object.entries(result.fields).map(([k, v]) => (
                      <div key={k} className="flex justify-between gap-3 text-[11px] border-b border-zinc-850 last:border-0 py-1.5">
                        <span className="text-zinc-500 capitalize">{k.replace(/_/g, ' ')}</span>
                        <span className="text-zinc-200 font-semibold text-right">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {result.note && (
                <div className="bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] rounded-xl p-3">ℹ️ {result.note}</div>
              )}

              <div className="bg-[#15171e] border border-zinc-800 rounded-2xl p-5">
                <h4 className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider mb-2">Extracted text</h4>
                <pre className="text-[11px] text-zinc-400 whitespace-pre-wrap max-h-52 overflow-y-auto font-mono">{result.extracted_text || '(no text extracted)'}</pre>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
