import React, { useState } from 'react';

export default function EcoCare() {
  // --- STATE FOR AI TELE-HEALTH TRIAGE ---
  const [symptomText, setSymptomText] = useState('');
  const [selectedQuickSymptom, setSelectedQuickSymptom] = useState('');
  const [triageResult, setTriageResult] = useState(null);
  const [isTriageLoading, setIsTriageLoading] = useState(false);

  // --- STATE FOR ECO-REPORTING NODE ---
  const [envIssueType, setEnvIssueType] = useState('water');
  const [envDescription, setEnvDescription] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [isFetchingGps, setIsFetchingGps] = useState(false);
  const [gpsCoordinates, setGpsCoordinates] = useState(null);
  const [reportingStatus, setReportingStatus] = useState(null); // 'idle' | 'success'

  // --- QUICK SYMPTOMS MOCK ANSWERS ---
  const quickSymptoms = [
    { label: '🤒 Heat Exhaustion / Fever', value: 'fever' },
    { label: '💧 Dehydration / Dizziness', value: 'dehydration' },
    { label: '🧴 Solar Sunburn / Rash', value: 'sunburn' },
    { label: '💨 Dust Allergy / Coughing', value: 'allergy' },
  ];

  const mockTriageDatabase = {
    fever: {
      advice: "Your symptoms indicate potential heat exhaustion or minor thermal fever. Rest in a well-ventilated, shaded environment immediately. Apply a cool, damp cloth to your forehead and neck. If your temperature exceeds 39°C or you experience confusion, travel to the nearest clinic in Hatta or Al Dhafra.",
      severity: "Moderate",
      action: "Monitor temperature & rest in shade",
      urgency: "Yellow"
    },
    dehydration: {
      advice: "Indicates mild to moderate dehydration, common under the midday UAE sun. Rehydrate slowly with water or oral rehydration salts (ORS). Avoid caffeine or sugary beverages. Sit down in a cool area. If vomiting occurs or drinking fluids is impossible, physical clinical consultation is required.",
      severity: "Moderate",
      action: "Rehydrate with electrolytes immediately",
      urgency: "Yellow"
    },
    sunburn: {
      advice: "Epidermal UV irritation detected. Apply pure Aloe Vera gel or calamine lotion to the affected skin. Avoid direct sun exposure for the next 48 hours. Stay hydrated to assist skin regeneration. If blistering occurs over large areas, consult a doctor.",
      severity: "Low",
      action: "Apply cold compress & Aloe Vera",
      urgency: "Green"
    },
    allergy: {
      advice: "Coughing and respiratory irritation caused by airborne desert particulate matter or dust. Remain indoors with air filtration systems active. Inhale steam or use saline nasal sprays. Avoid heavy physical exertion. If breathing becomes labored, seek immediate medical attention.",
      severity: "Low to Moderate",
      action: "Stay indoors & run air filters",
      urgency: "Green"
    }
  };

  const handleQuickSymptomSelect = (value) => {
    setSelectedQuickSymptom(value);
    setSymptomText('');
  };

  const triggerTriageAnalysis = (e) => {
    e.preventDefault();
    if (!symptomText && !selectedQuickSymptom) return;

    setIsTriageLoading(true);
    setTriageResult(null);

    // Simulate AI processing delay
    setTimeout(() => {
      let key = selectedQuickSymptom;
      
      // Basic text parser fallback if they typed custom symptoms
      if (symptomText && !key) {
        const text = symptomText.toLowerCase();
        if (text.includes('sun') || text.includes('skin') || text.includes('burn') || text.includes('rash')) {
          key = 'sunburn';
        } else if (text.includes('water') || text.includes('dizzy') || text.includes('thirst') || text.includes('dry')) {
          key = 'dehydration';
        } else if (text.includes('cough') || text.includes('dust') || text.includes('breath') || text.includes('allerg')) {
          key = 'allergy';
        } else {
          key = 'fever'; // Default general triage path
        }
      }

      const result = mockTriageDatabase[key] || mockTriageDatabase['fever'];
      setTriageResult({
        ...result,
        customQuery: symptomText || quickSymptoms.find(s => s.value === key)?.label || 'General Assessment'
      });
      setIsTriageLoading(false);
    }, 1500);
  };

  // --- ECO-REPORTING ACTIONS ---
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedFileName(e.target.files[0].name);
    }
  };

  const handleGpsAndSubmit = (e) => {
    e.preventDefault();
    if (!envDescription) return;

    setIsFetchingGps(true);
    setReportingStatus(null);

    // Fetch live Geolocation API if supported, else fallback to mock UAE coordinates
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setTimeout(() => {
            setGpsCoordinates({
              lat: position.coords.latitude.toFixed(4),
              lng: position.coords.longitude.toFixed(4),
              accuracy: position.coords.accuracy.toFixed(1)
            });
            setIsFetchingGps(false);
            setReportingStatus('success');
          }, 1500);
        },
        (error) => {
          console.warn("GPS access denied or unavailable, using regional UAE coordinates.", error);
          // Standard coordinates for Hatta area fallback
          setTimeout(() => {
            setGpsCoordinates({
              lat: "24.8151",
              lng: "56.1264",
              accuracy: "Mock Fallback (Hatta Range)"
            });
            setIsFetchingGps(false);
            setReportingStatus('success');
          }, 1500);
        }
      );
    } else {
      setTimeout(() => {
        setGpsCoordinates({
          lat: "24.8151",
          lng: "56.1264",
          accuracy: "Static Local Base"
        });
        setIsFetchingGps(false);
        setReportingStatus('success');
      }, 1500);
    }
  };

  const resetReportingForm = () => {
    setEnvDescription('');
    setUploadedFileName('');
    setGpsCoordinates(null);
    setReportingStatus(null);
  };

  return (
    <div className="min-height-screen bg-zinc-900 text-zinc-100 p-4 md:p-8 font-sans selection:bg-emerald-500 selection:text-zinc-900">
      <div className="max-w-6xl mx-auto">
        
        {/* --- Header banner --- */}
        <header className="mb-8 text-center md:text-left flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500 bg-clip-text text-transparent">
              🌳 EcoCare Dashboard
            </h1>
            <p className="text-zinc-400 text-sm mt-1">
              Direct Social & Environmental Assistance Node for UAE Remote Communities
            </p>
          </div>
          <div className="flex items-center gap-2 justify-center bg-zinc-800/50 border border-zinc-700/50 px-4 py-2 rounded-xl backdrop-blur-md self-center md:self-auto">
            <span className="text-emerald-500 animate-pulse text-xs">●</span>
            <span className="text-xs font-mono text-zinc-300">GPS TELEMETRY LINKED</span>
          </div>
        </header>

        {/* --- Main Dual Layout --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* ==========================================================================
               SECTION 1: AI TELE-HEALTH TRIAGE
               ========================================================================== */}
          <section className="bg-zinc-800/40 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-xl shadow-xl flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">🩺</span>
              <h2 className="text-xl font-semibold text-zinc-100">AI Tele-Health Triage</h2>
            </div>
            
            <p className="text-zinc-400 text-xs mb-6">
              Skip the long travel to cities for initial checkups. Receive preliminary, non-emergency medical advice powered by EcoConnect AI.
            </p>

            <form onSubmit={triggerTriageAnalysis} className="space-y-4">
              {/* Custom Input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-zinc-400 font-medium uppercase tracking-wider">
                  Describe symptoms in detail
                </label>
                <textarea
                  value={symptomText}
                  onChange={(e) => {
                    setSymptomText(e.target.value);
                    setSelectedQuickSymptom('');
                  }}
                  className="w-full bg-zinc-950 border border-zinc-800 hover:border-zinc-700 focus:border-emerald-500 rounded-xl p-3 text-zinc-200 placeholder-zinc-600 text-sm transition-all focus:ring-1 focus:ring-emerald-500 outline-none"
                  rows="3"
                  placeholder="e.g. Feeling dizzy after working outside in Liwa heat, experiencing mild headache..."
                />
              </div>

              {/* Quick selectors */}
              <div className="space-y-2">
                <span className="text-xs text-zinc-400 font-medium uppercase tracking-wider block">
                  Or select a common local symptom:
                </span>
                <div className="flex flex-wrap gap-2">
                  {quickSymptoms.map((sym) => (
                    <button
                      key={sym.value}
                      type="button"
                      onClick={() => handleQuickSymptomSelect(sym.value)}
                      className={`text-xs px-3.5 py-2 rounded-full border transition-all ${
                        selectedQuickSymptom === sym.value
                          ? 'bg-emerald-500 text-zinc-900 border-emerald-500 font-semibold'
                          : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                      }`}
                    >
                      {sym.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={isTriageLoading || (!symptomText && !selectedQuickSymptom)}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-zinc-100 font-semibold py-3 px-4 rounded-xl shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none disabled:transform-none text-sm mt-2 flex items-center justify-center gap-2"
              >
                {isTriageLoading ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin"></span>
                    Running Virtual Diagnostic...
                  </>
                ) : (
                  <>
                    <span>⚡</span> Run AI Triage Analysis
                  </>
                )}
              </button>
            </form>

            {/* Results Area */}
            <div className="mt-6 flex-grow flex flex-col">
              <span className="text-xs text-zinc-400 font-medium uppercase tracking-wider block mb-2">
                AI Diagnostics Feedback Panel
              </span>

              {/* Empty state */}
              {!triageResult && !isTriageLoading && (
                <div className="border border-dashed border-zinc-800/80 rounded-xl p-8 text-center flex-grow flex flex-col items-center justify-center bg-zinc-900/10">
                  <span className="text-3xl mb-2 opacity-40">🤖</span>
                  <p className="text-zinc-500 text-xs max-w-xs">
                    Input your symptoms above and trigger analysis to generate medical guidance.
                  </p>
                </div>
              )}

              {/* Loading Placeholder */}
              {isTriageLoading && (
                <div className="border border-zinc-800 bg-zinc-900/20 rounded-xl p-6 space-y-4 animate-pulse flex-grow">
                  <div className="h-4 bg-zinc-800 rounded w-1/4"></div>
                  <div className="h-16 bg-zinc-800 rounded w-full"></div>
                  <div className="h-4 bg-zinc-800 rounded w-2/3"></div>
                </div>
              )}

              {/* Real Advice Card */}
              {triageResult && !isTriageLoading && (
                <div className="border border-zinc-800 bg-zinc-950/40 rounded-xl p-5 space-y-4 flex-grow flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                      <span className="text-xs font-mono text-zinc-500 uppercase">
                        Case Assessment: {triageResult.customQuery.substring(0, 24)}...
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        triageResult.urgency === 'Yellow' 
                          ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' 
                          : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                      }`}>
                        ⚠️ URGENCY: {triageResult.urgency}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <h4 className="text-xs font-medium text-emerald-400 uppercase tracking-wider">AI Preliminary Advice</h4>
                      <p className="text-xs text-zinc-300 leading-relaxed font-light">
                        {triageResult.advice}
                      </p>
                    </div>

                    <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-lg p-3 text-xs flex justify-between">
                      <div>
                        <span className="text-zinc-500 block text-[9px] uppercase font-bold">Severity</span>
                        <span className="text-zinc-200 font-semibold">{triageResult.severity}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-zinc-500 block text-[9px] uppercase font-bold">First Aid Action</span>
                        <span className="text-zinc-200 font-semibold">{triageResult.action}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-zinc-900 space-y-2.5">
                    <p className="text-[10px] text-zinc-500 italic leading-tight">
                      * Disclaimer: This advice is simulated by AI for triage planning. It is not an official medical diagnosis. In case of persistent pain, high fever, or distress, immediately contact emergency services or proceed to the nearest hospital.
                    </p>
                    
                    <button 
                      type="button"
                      onClick={() => alert("Connecting virtual telemedicine call with emergency doctor on duty at Abu Dhabi Clinic Hub...")}
                      className="w-full bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 hover:text-emerald-400 py-2 rounded-lg text-xs font-medium transition-all"
                    >
                      📞 Connect Live with Tele-Doctor
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* ==========================================================================
               SECTION 2: ECO-REPORTING NODE
               ========================================================================== */}
          <section className="bg-zinc-800/40 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-xl shadow-xl flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">🌱</span>
              <h2 className="text-xl font-semibold text-zinc-100">Eco-Reporting Node</h2>
            </div>
            
            <p className="text-zinc-400 text-xs mb-6">
              Instantly report local ecological issues (e.g. soil damage, water pipeline leaks, trash pileup) to city municipality departments.
            </p>

            {reportingStatus === 'success' ? (
              /* Success Status Display */
              <div className="border border-emerald-500/30 bg-emerald-500/5 rounded-xl p-8 text-center space-y-5 flex-grow flex flex-col items-center justify-center">
                <div className="w-14 h-14 bg-emerald-500/10 text-emerald-400 border border-emerald-500 rounded-full flex items-center justify-center text-2xl">
                  ✓
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-emerald-400">Report Dispatched</h4>
                  <p className="text-zinc-400 text-xs max-w-sm mx-auto mt-1">
                    Your eco-alert has been digitally timestamped, mapped, and forwarded directly to the municipal response department.
                  </p>
                </div>

                <div className="bg-zinc-950 border border-zinc-850 p-4 rounded-xl text-left text-xs font-mono text-zinc-400 space-y-2 w-full max-w-md mx-auto">
                  <div className="flex justify-between">
                    <span>Ticket ID:</span>
                    <span className="text-emerald-500 font-bold">MUNI-ECO-{Math.floor(10000 + Math.random() * 90000)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span className="text-zinc-300">DISPATCHED (Pending Action)</span>
                  </div>
                  {gpsCoordinates && (
                    <div className="flex justify-between border-t border-zinc-900 pt-2 mt-2">
                      <span>Coordinates:</span>
                      <span className="text-teal-400 font-semibold">{gpsCoordinates.lat}°N, {gpsCoordinates.lng}°E</span>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={resetReportingForm}
                  className="bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 px-6 py-2 rounded-lg text-xs transition-all"
                >
                  File Another Report
                </button>
              </div>
            ) : (
              /* Standard Input Form UI */
              <form onSubmit={handleGpsAndSubmit} className="space-y-4 flex-grow flex flex-col justify-between">
                <div className="space-y-4">
                  {/* Select issue type */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs text-zinc-400 font-medium uppercase tracking-wider">
                        Issue Category
                      </label>
                      <select
                        value={envIssueType}
                        onChange={(e) => setEnvIssueType(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-xl p-3 text-zinc-300 text-xs transition-all focus:ring-1 focus:ring-emerald-500 outline-none cursor-pointer"
                      >
                        <option value="water">💧 Water Leak / Waste</option>
                        <option value="soil">🍂 Soil Erosion / Degradation</option>
                        <option value="crop">🐛 Crop Disease / Blight</option>
                        <option value="waste">♻️ Waste / Illegal Dumping</option>
                      </select>
                    </div>
                    
                    {/* Simulated File Upload Input */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs text-zinc-400 font-medium uppercase tracking-wider">
                        Photo Evidence
                      </label>
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          id="eco-photo-upload"
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <div className="w-full bg-zinc-950 border border-zinc-850 hover:border-zinc-750 text-center rounded-xl p-3 text-xs text-zinc-400 transition-all truncate">
                          {uploadedFileName ? `📸 ${uploadedFileName}` : '📎 Attach Photo'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Description input */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-zinc-400 font-medium uppercase tracking-wider">
                      Describe the situation
                    </label>
                    <textarea
                      value={envDescription}
                      onChange={(e) => setEnvDescription(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 hover:border-zinc-700 focus:border-emerald-500 rounded-xl p-3 text-zinc-200 placeholder-zinc-600 text-xs transition-all focus:ring-1 focus:ring-emerald-500 outline-none"
                      rows="4"
                      placeholder="Include landmarks or severe aspects. E.g. A water valve is broken, creating large pools and washing away topsoil near Sector 4 farm gate..."
                      required
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-zinc-850 mt-6 space-y-4">
                  <div className="flex items-center gap-3 bg-zinc-950 border border-zinc-900 p-3.5 rounded-xl">
                    <span className="text-xl">📍</span>
                    <div className="text-[11px] leading-snug">
                      <span className="text-zinc-500 block uppercase font-mono font-bold tracking-wider">Automatic Metadata</span>
                      <span className="text-zinc-400">Your device GPS coordinates will be captured and sealed with the submission to ensure precision routing.</span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isFetchingGps || !envDescription}
                    className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-zinc-100 font-semibold py-3 px-4 rounded-xl shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none disabled:transform-none text-sm flex items-center justify-center gap-2"
                  >
                    {isFetchingGps ? (
                      <>
                        <span className="inline-block w-4 h-4 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin"></span>
                        Filing Coordinates & Dispatching...
                      </>
                    ) : (
                      <>
                        <span>🛰️</span> Send with GPS Coordinates
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </section>

        </div>
        
        {/* --- Footer branding --- */}
        <footer className="mt-12 text-center border-t border-zinc-800 pt-6">
          <p className="text-zinc-600 text-[10px] uppercase font-mono tracking-widest">
            Eco System UAE • Powered by EcoConnect Platform • All Rights Reserved 2026
          </p>
        </footer>

      </div>
    </div>
  );
}
