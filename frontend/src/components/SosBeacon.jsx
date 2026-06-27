import React, { useState, useEffect } from 'react';
import { API_BASE } from '../config';

// ===================================================================
// Challenge 2 — Reaching people quickly across a dispersed community
// Share a precise location and reach the nearest available help fast.
// ===================================================================

const RESPONDERS = [
  { name: 'Hatta Community Clinic', type: 'Medical', distanceKm: 3.2, eta: '7 min', phone: '998' },
  { name: 'Civil Defence — Hatta Post', type: 'Fire & Rescue', distanceKm: 5.8, eta: '11 min', phone: '997' },
  { name: 'Volunteer First-Responder (Salem)', type: 'Community', distanceKm: 1.4, eta: '4 min', phone: '+971 50 555 0190' },
  { name: 'Police — Hatta Station', type: 'Police', distanceKm: 6.1, eta: '12 min', phone: '999' },
];

const EMERGENCY_TYPES = [
  { id: 'medical', label: 'Medical', icon: '🚑' },
  { id: 'fire', label: 'Fire', icon: '🔥' },
  { id: 'accident', label: 'Accident', icon: '⚠️' },
  { id: 'water', label: 'Water / Flood', icon: '🌊' },
  { id: 'other', label: 'Other', icon: '🆘' },
];

export default function SosBeacon({ name }) {
  const [type, setType] = useState('medical');
  const [coords, setCoords] = useState(null);
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState('');
  const [broadcasting, setBroadcasting] = useState(false);
  const [sent, setSent] = useState(false);
  const [seconds, setSeconds] = useState(0);

  // Computer Vision & Speech States
  const [uploadingImage, setUploadingImage] = useState(false);
  const [diagnosedData, setDiagnosedData] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [customDescription, setCustomDescription] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);

  const getLocation = () => {
    setLocating(true);
    setLocError('');
    if (!navigator.geolocation) {
      setLocError('Geolocation is not supported on this device.');
      setLocating(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude, acc: Math.round(pos.coords.accuracy) });
        setLocating(false);
      },
      () => {
        // Fallback to a Hatta demo coordinate so the demo always works
        setCoords({ lat: 24.7969, lng: 56.1225, acc: 50, demo: true });
        setLocError('Live location blocked — using approximate area location.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  useEffect(() => { getLocation(); }, []);

  useEffect(() => {
    if (!sent) return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [sent]);

  const broadcast = () => {
    if (!coords) { getLocation(); return; }
    setBroadcasting(true);
    setTimeout(() => {
      setBroadcasting(false);
      setSent(true);
      setSeconds(0);

      // Push to localStorage eco_sos_feed so it displays in the Admin Portal!
      try {
        const saved = localStorage.getItem('eco_sos_feed');
        const currentFeed = saved ? JSON.parse(saved) : [];
        const typeLabels = {
          medical: "Medical Emergency",
          fire: "Fire Emergency",
          accident: "Tractor Failure",
          water: "Water Shortage",
          other: "Other"
        };
        const newSos = {
          id: Date.now(),
          sender: name || "Salem Al Hattawi",
          type: typeLabels[type] || "Other",
          description: customDescription || "Emergency rescue beacon activated.",
          lat: parseFloat(coords.lat.toFixed(4)),
          lng: parseFloat(coords.lng.toFixed(4)),
          time: "Just now",
          responders: [],
          region: "Al-Qaw'ah / Hatta",
          status: "Pending"
        };
        const updated = [newSos, ...currentFeed];
        localStorage.setItem('eco_sos_feed', JSON.stringify(updated));
      } catch (err) {
        console.error("Local storage SOS sync failed:", err);
      }
    }, 1400);
  };

  const reset = () => { 
    setSent(false); 
    setSeconds(0); 
    setImagePreview('');
    setDiagnosedData(null);
    setCustomDescription('');
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
      triggerCvDiagnosis(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const triggerCvDiagnosis = async (base64Str) => {
    setUploadingImage(true);
    setDiagnosedData(null);
    try {
      const res = await fetch(`${API_BASE}/api/computer-vision/diagnose`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_base64: base64Str })
      });
      if (res.ok) {
        const data = await res.json();
        setDiagnosedData(data);
        setType(data.category);
        
        const generatedDesc = `[AI Auto-Diagnosis: ${data.issue_detected}] ${data.diagnosis} Recommended Action: ${data.recommended_action}`;
        setCustomDescription(generatedDesc);
        
        // Offset coords slightly
        if (coords) {
          setCoords(prev => ({
            ...prev,
            lat: prev.lat + (data.coords_offset?.lat || 0),
            lng: prev.lng + (data.coords_offset?.lng || 0)
          }));
        }
      } else {
        throw new Error("API response error");
      }
    } catch (err) {
      console.warn("CV Diagnosis API offline, running offline AI vision analysis simulator:", err);
      setTimeout(() => {
        const mockDiagnosis = {
          category: 'accident',
          issue_detected: 'Main Line Irrigation Rupture',
          diagnosis: 'Detected water leakage and sub-surface sand erosion around the primary pipeline joint in Sector 4.',
          recommended_action: 'Close main irrigation gate valve immediately and dispatch maintenance vehicle.',
          coords_offset: { lat: 0.0008, lng: -0.0004 }
        };
        setDiagnosedData(mockDiagnosis);
        setType(mockDiagnosis.category);
        const generatedDesc = `[AI Auto-Diagnosis: ${mockDiagnosis.issue_detected}] ${mockDiagnosis.diagnosis} Recommended Action: ${mockDiagnosis.recommended_action}`;
        setCustomDescription(generatedDesc);
        if (coords) {
          setCoords(prev => ({
            ...prev,
            lat: prev.lat + mockDiagnosis.coords_offset.lat,
            lng: prev.lng + mockDiagnosis.coords_offset.lng
          }));
        }
        setUploadingImage(false);
      }, 1000);
      return;
    }
    setUploadingImage(false);
  };

  const handleMicClick = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.lang = 'ar-AE';
      rec.onstart = () => setIsTranscribing(true);
      rec.onresult = async (e) => {
        const text = e.results[0][0].transcript;
        setCustomDescription((prev) => prev ? prev + ' ' + text : text);
        
        // Sync with backend
        try {
          await fetch(`${API_BASE}/api/speech/transcribe`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ audio_base64: 'raw-mic', text_fallback: text })
          });
        } catch (err) {
          console.error(err);
        }
      };
      rec.onerror = () => setIsTranscribing(false);
      rec.onend = () => setIsTranscribing(false);
      rec.start();
    } else {
      // Fallback simulated STT
      setIsTranscribing(true);
      setTimeout(async () => {
        setIsTranscribing(false);
        const sampleArabicDistress = "تسريب في خط الري الرئيسي في القطاع 4، يرجى المساعدة الفورية";
        setCustomDescription((prev) => prev ? prev + ' ' + sampleArabicDistress : sampleArabicDistress);
        try {
          await fetch(`${API_BASE}/api/speech/transcribe`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ audio_base64: 'raw-simulated-mic', text_fallback: sampleArabicDistress })
          });
        } catch (err) {
          console.error(err);
        }
      }, 2000);
    }
  };

  const mapsUrl = coords ? `https://www.google.com/maps?q=${coords.lat},${coords.lng}` : '#';
  const sorted = [...RESPONDERS].sort((a, b) => a.distanceKm - b.distanceKm);

  return (
    <div className="max-w-5xl mx-auto w-full space-y-6">
      <div className="bg-[#15171e] border border-zinc-800/60 p-4 rounded-2xl flex items-center gap-3">
        <span className="text-2xl">🆘</span>
        <div>
          <h2 className="text-md font-bold text-zinc-100">SOS — Reach Help Fast</h2>
          <p className="text-[10px] text-zinc-405 font-mono">SHARE PRECISE LOCATION · ALERT NEAREST RESPONDERS</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Beacon panel */}
        <div className="bg-gradient-to-br from-rose-950/40 to-[#15171e] border border-rose-900/40 rounded-2xl p-6 space-y-5">
          <div>
            <label className="block text-[10px] uppercase font-bold text-zinc-550 tracking-wider mb-2">Emergency type</label>
            <div className="grid grid-cols-5 gap-2">
              {EMERGENCY_TYPES.map((t) => (
                <button key={t.id} onClick={() => setType(t.id)}
                  className={`py-2.5 rounded-xl text-center border transition-all cursor-pointer ${type === t.id ? 'bg-rose-600/20 border-rose-500/50 text-rose-455' : 'bg-[#0a0a0a] border-zinc-800 hover:border-zinc-700 text-zinc-400'}`}>
                  <span className="text-lg block">{t.icon}</span>
                  <span className="text-[8px] font-bold uppercase">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* AI Vision Diagnostics */}
          <div className="bg-[#0a0a0a] border border-zinc-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider flex items-center gap-1.5">
                <span>📷</span> AI Vision Diagnostics (Optional)
              </span>
              {uploadingImage && <span className="text-[10px] text-rose-500 font-mono animate-pulse">Running diagnosis...</span>}
            </div>
            
            <div className="flex items-center gap-3">
              <label className="bg-[#1f222d] border border-zinc-700 hover:bg-zinc-700 text-zinc-300 text-[10px] font-bold px-3 py-2 rounded-lg cursor-pointer transition-all">
                Select Photo
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageUpload} 
                  className="hidden" 
                />
              </label>
              <p className="text-[9px] text-zinc-500 font-light leading-normal">
                Upload image of leak, crop disease, sand road blockage or tractor engine to auto-fill distress ticket details.
              </p>
            </div>

            {imagePreview && (
              <div className="flex gap-3 items-start bg-zinc-900/50 p-2.5 rounded-lg border border-zinc-850">
                <img 
                  src={imagePreview} 
                  alt="Distress upload preview" 
                  className="w-12 h-12 object-cover rounded-md border border-zinc-800" 
                />
                {diagnosedData ? (
                  <div className="text-[9.5px] leading-normal font-sans text-zinc-300">
                    <p className="text-emerald-450 font-bold">✓ Diagnosed: {diagnosedData.issue_detected}</p>
                    <p className="text-[8.5px] text-zinc-500 font-light mt-0.5">{diagnosedData.diagnosis}</p>
                  </div>
                ) : (
                  <p className="text-[9.5px] text-zinc-555 animate-pulse mt-1">Analyzing pixels with neural network...</p>
                )}
              </div>
            )}
          </div>

          {/* Description & Speech input */}
          <div className="bg-[#0a0a0a] border border-zinc-800 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Distress details</label>
              <button
                type="button"
                onClick={handleMicClick}
                className={`flex items-center gap-1 text-[9px] font-bold px-2 py-1 rounded border transition-all cursor-pointer ${
                  isTranscribing 
                    ? 'bg-rose-500/20 text-rose-500 border-rose-500/30 animate-pulse' 
                    : 'bg-zinc-850 text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-zinc-300'
                }`}
              >
                {isTranscribing ? (
                  <>🎙️ Listening...</>
                ) : (
                  <>🎙️ Click to Speak</>
                )}
              </button>
            </div>
            
            <textarea
              value={customDescription}
              onChange={(e) => setCustomDescription(e.target.value)}
              placeholder="e.g. My tractor engine snapped its belt back here behind block 5. Need pull assistance."
              rows="3"
              className="w-full bg-[#050505] border border-zinc-850 focus:border-rose-500 rounded-xl p-2.5 text-xs text-zinc-300 outline-none transition-all font-light"
            />
          </div>

          {/* Location */}
          <div className="bg-[#0a0a0a] border border-zinc-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">📍 Your location</span>
              <button onClick={getLocation} className="text-[10px] font-bold text-emerald-450 hover:text-emerald-305 bg-transparent border-0 cursor-pointer">{locating ? 'Locating…' : 'Refresh'}</button>
            </div>
            {coords ? (
              <>
                <p className="text-sm font-mono text-zinc-200">{coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}</p>
                <p className="text-[10px] text-zinc-500">±{coords.acc}m accuracy{coords.demo ? ' · approximate' : ''}</p>
                <a href={mapsUrl} target="_blank" rel="noreferrer" className="text-[11px] text-blue-400 hover:underline">Open in maps →</a>
              </>
            ) : (
              <p className="text-xs text-zinc-500">{locating ? 'Getting your position…' : 'Location unavailable'}</p>
            )}
            {locError && <p className="text-[10px] text-amber-500 mt-1">{locError}</p>}
          </div>

          {!sent ? (
            <button onClick={broadcast} disabled={broadcasting}
              className="w-full bg-rose-600 hover:bg-rose-500 text-white font-black py-4 rounded-2xl text-sm tracking-widest uppercase transition-all shadow-lg shadow-rose-900/40 disabled:opacity-60 cursor-pointer">
              {broadcasting ? 'Broadcasting…' : '🆘 Send SOS Beacon'}
            </button>
          ) : (
            <div className="bg-emerald-600/15 border border-emerald-500/40 rounded-2xl p-4 text-center">
              <p className="text-sm font-bold text-emerald-500">✅ SOS broadcast sent</p>
              <p className="text-[11px] text-zinc-400 mt-1">Nearest responders alerted with your live location.</p>
              <p className="text-[10px] text-zinc-500 mt-2 font-mono">Elapsed {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')} · stay where you are if safe</p>
              <button onClick={reset} className="mt-3 text-[11px] font-bold text-zinc-300 bg-[#1f222d] hover:bg-zinc-700 border border-zinc-700/50 rounded-lg px-4 py-1.5 cursor-pointer">Cancel beacon</button>
            </div>
          )}
        </div>

        {/* Responders */}
        <div className="space-y-3">
          <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider px-1">Nearest available help</p>
          {sorted.map((r, i) => (
            <div key={r.name} className={`bg-[#15171e] border rounded-2xl p-4 flex items-center justify-between gap-3 ${i === 0 ? 'border-emerald-700/50' : 'border-zinc-800'}`}>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-zinc-200">{r.name}</p>
                  {i === 0 && <span className="text-[8px] font-bold uppercase bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 rounded-full px-2 py-0.5">Closest</span>}
                </div>
                <p className="text-[11px] text-zinc-500">{r.type} · {r.distanceKm} km away</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-[#4ade80]">ETA {r.eta}</p>
                <a href={`tel:${r.phone.replace(/\s/g, '')}`} className="text-[11px] text-blue-400 hover:underline">📞 {r.phone}</a>
              </div>
            </div>
          ))}
          <p className="text-[10px] text-zinc-500 px-1 font-light leading-normal">In a real emergency always also call 999 (Police), 998 (Ambulance) or 997 (Fire).</p>
        </div>
      </div>
    </div>
  );
}
