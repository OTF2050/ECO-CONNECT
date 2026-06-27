import React, { useState, useEffect } from 'react';
import { API_BASE } from '../config';
import SmartDocumentVerification from './SmartDocumentVerification';
import GovConnect from './GovConnect';

export default function MobileAppSimulator() {
  const [activeScreen, setActiveScreen] = useState('home'); // 'home' | 'vault' | 'gov' | 'tools'
  const [credits, setCredits] = useState(350);
  const [currentTime, setCurrentTime] = useState('');
  
  // Custom states for simulated tools
  const [toolsList, setToolsList] = useState([
    { id: 'TL-01', name: 'Tractor Rotary Tiller', icon: '🚜', owner: 'Jassim Farm', cost: 50, status: 'Available' },
    { id: 'TL-02', name: 'Soil pH Sensor Kit', icon: '🧪', owner: 'Hatta Hub', cost: 10, status: 'Available' },
    { id: 'TL-03', name: 'Date Palm Ladder (High)', icon: '🧗', owner: 'Saeed Al Mansouri', cost: 15, status: 'Borrowed' }
  ]);
  const [toolMsg, setToolMsg] = useState('');

  // AI chat bubble simulation
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState([
    { sender: 'ai', text: 'Marhaban! I am your Hatta Farm Advisor. How can I help you grow today?' }
  ]);
  const [aiLoading, setAiLoading] = useState(false);

  // GPS Coordinates State
  const [gpsLogged, setGpsLogged] = useState(false);
  const [gpsCoords, setGpsCoords] = useState('23.5412, 55.4921');

  // In-app SOS confirmation toast
  const [sosSent, setSosSent] = useState(false);

  const handleTriggerSos = () => {
    setSosSent(true);
    setTimeout(() => setSosSent(false), 4000);
  };

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      let hrs = now.getHours();
      const mins = String(now.getMinutes()).padStart(2, '0');
      const ampm = hrs >= 12 ? 'PM' : 'AM';
      hrs = hrs % 12 || 12;
      setCurrentTime(`${hrs}:${mins} ${ampm}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleBorrowTool = (id, cost) => {
    if (credits < cost) {
      setToolMsg('❌ Insufficient Eco Credits to borrow this tool.');
      return;
    }
    setCredits(prev => prev - cost);
    setToolsList(prev => prev.map(t => t.id === id ? { ...t, status: 'Borrowed' } : t));
    setToolMsg('✅ Tool requested successfully! Arrange pickup via Hatta Hub.');
    setTimeout(() => setToolMsg(''), 4000);
  };

  const handleSendChat = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const userMsg = chatInput.trim();
    setChatHistory(prev => [...prev, { sender: 'user', text: userMsg }]);
    setChatInput('');
    setAiLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, history: [] })
      });
      if (res.ok) {
        const data = await res.json();
        setChatHistory(prev => [...prev, { sender: 'ai', text: data.response }]);
      } else {
        throw new Error();
      }
    } catch {
      setChatHistory(prev => [...prev, { sender: 'ai', text: 'I am processing your field request offline. Please verify network.' }]);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Background radial overlays */}
      <div className="pointer-events-none absolute -top-40 -right-40 h-96 w-96 rounded-full bg-teal-500/10 blur-[130px]" />
      <div className="pointer-events-none absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-emerald-500/10 blur-[130px]" />

      <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8 items-center">
        {/* Left Side: Mock description & quick info for Hackathon judges */}
        <div className="space-y-5 text-center md:text-left z-10">
          <span className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-bold px-3.5 py-1 rounded-full text-[10px] uppercase tracking-wider">
            Vincent Smartphone Simulator
          </span>
          <h2 className="text-3xl md:text-5xl font-black text-zinc-50 leading-tight">EcoConnect Native Mobile Shell</h2>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Experience our mobile app designed specifically for field farmers in Hatta. Fully loaded with quick-touch features, localized government portals, document verification, and a peer-to-peer tools sharing library.
          </p>
          <div className="flex justify-center md:justify-start gap-4">
            <a 
              href="#/login" 
              className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 font-bold px-5 py-3 rounded-xl text-xs transition-all"
            >
              ← Back to Web App
            </a>
            <button 
              onClick={() => { window.location.hash = '#/souq'; }} 
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-3 rounded-xl text-xs shadow-md transition-all"
            >
              Open Eco Souq Store
            </button>
          </div>
        </div>

        {/* Right Side: Smartphone Container */}
        <div className="flex justify-center">
          {/* Phone Shell body */}
          <div className="relative w-[340px] h-[680px] bg-zinc-900 border-[8px] border-zinc-850 rounded-[45px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col ring-4 ring-black/40">
            {/* Dynamic Island / Camera Notch */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-6 bg-black rounded-full z-50 flex items-center justify-center">
              <span className="w-2.5 h-2.5 rounded-full bg-zinc-800/80 mr-12" />
              <span className="w-1.5 h-1.5 rounded-full bg-blue-900/30" />
            </div>

            {/* Mobile Status Bar */}
            <div className="bg-black/90 text-zinc-350 text-[10px] font-semibold px-6 pt-3 pb-1 flex justify-between items-center z-40 select-none">
              <span>{currentTime}</span>
              <div className="flex items-center gap-1.5 font-mono text-[9px]">
                <span>5G</span>
                <span>📶</span>
                <span>🔋 88%</span>
              </div>
            </div>

            {/* Scrollable Mobile Screen Content */}
            <div className="flex-1 bg-[#060c09] text-zinc-150 overflow-y-auto pb-16 pt-3 relative scrollbar-none">
              
              {/* Home Screen View */}
              {activeScreen === 'home' && (
                <div className="p-4 space-y-4 text-left animate-fadeIn">
                  {/* Farmer profile header widget */}
                  <div className="bg-gradient-to-br from-emerald-950/40 to-teal-950/40 border border-emerald-900/40 p-4 rounded-3xl relative overflow-hidden">
                    <h3 className="text-sm font-bold text-zinc-200">Ahmed's Farm</h3>
                    <p className="text-[10px] text-zinc-450 mt-0.5">Hatta Valley Plot #44-A</p>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-xs font-mono text-emerald-450 font-bold bg-emerald-950 border border-emerald-900 px-2.5 py-1 rounded-xl">
                        🪙 {credits} Credits
                      </span>
                      <span className="text-[10px] text-zinc-400">Moisture: 42%</span>
                    </div>
                  </div>

                  {/* Quick Fields Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => setAiChatOpen(true)}
                      className="bg-zinc-900/80 hover:bg-zinc-850 border border-zinc-800 p-4 rounded-2xl flex flex-col items-center justify-center text-center space-y-1 transition-all"
                    >
                      <span className="text-2xl">🗣️</span>
                      <span className="text-xs font-bold text-zinc-200">AI Advisor</span>
                      <span className="text-[9px] text-zinc-500">Eco Copilot chat</span>
                    </button>
                    <button 
                      onClick={() => {
                        setGpsLogged(true);
                        const lat = (23.5 + Math.random() * 0.1).toFixed(4);
                        const lng = (55.4 + Math.random() * 0.1).toFixed(4);
                        setGpsCoords(`${lat}, ${lng}`);
                      }}
                      className="bg-zinc-900/80 hover:bg-zinc-850 border border-zinc-800 p-4 rounded-2xl flex flex-col items-center justify-center text-center space-y-1 transition-all"
                    >
                      <span className="text-2xl">📍</span>
                      <span className="text-xs font-bold text-zinc-200">Log GPS</span>
                      <span className="text-[9px] text-zinc-500">{gpsLogged ? 'Logged ✓' : 'Auto-locate'}</span>
                    </button>
                  </div>

                  {gpsLogged && (
                    <div className="bg-zinc-950 border border-zinc-850 rounded-2xl p-3 text-[10px] font-mono text-emerald-400 text-center">
                      🌐 Mock GPS Logged: {gpsCoords}
                    </div>
                  )}

                  {/* Eco emergency SOS button */}
                  <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-200">Emergency SOS</span>
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                    </div>
                    <p className="text-[10px] text-zinc-500 leading-normal">Instantly alert civil defense / forest protection services in Hatta.</p>
                    <button 
                      onClick={handleTriggerSos}
                      className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-xl text-xs transition-all uppercase tracking-wider"
                    >
                      Trigger SOS Shield
                    </button>
                    {sosSent && (
                      <div className="bg-red-950/60 border border-red-500/40 text-red-300 rounded-xl p-2.5 text-[10px] font-semibold text-center leading-relaxed animate-fadeIn">
                        🚨 SOS Beacon sent to Hatta Civil Defence! Your GPS location has been shared. Stay safe — help is on the way.
                      </div>
                    )}
                  </div>

                  {/* Active contracts preview */}
                  <div className="space-y-2">
                    <span className="text-[10px] uppercase font-bold text-zinc-550 tracking-wider">Active Supply Contracts</span>
                    <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-3.5 space-y-2.5">
                      <div className="flex justify-between items-start text-[11px]">
                        <div>
                          <h4 className="font-bold text-zinc-200">LuLu Hypermarket Group</h4>
                          <p className="text-zinc-500 text-[10px]">Dates & Sidr Honey</p>
                        </div>
                        <span className="bg-emerald-500/10 text-emerald-450 border border-emerald-500/20 px-2 py-0.5 rounded text-[8px] uppercase tracking-wider">
                          Active
                        </span>
                      </div>
                      <div className="flex justify-between border-t border-zinc-900 pt-2 text-[10px] font-mono text-zinc-500">
                        <span>Quota: 500 kg / Month</span>
                        <span className="text-emerald-450">120 AED/kg</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Document Vault Tab Screen */}
              {activeScreen === 'vault' && (
                <div className="p-4 space-y-4 text-left animate-fadeIn">
                  <div className="border-b border-zinc-900 pb-2">
                    <h3 className="text-md font-bold text-zinc-200">My Files & Vault</h3>
                    <p className="text-[9px] text-zinc-500 mt-0.5">Secure OCR document uploader</p>
                  </div>
                  
                  {/* Standalone onboarding verification simplified for mobile */}
                  <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-3">
                    <SmartDocumentVerification token="" userName="Ahmed Farmer" vaultOnly />
                  </div>
                </div>
              )}

              {/* Gov Connect Tab Screen */}
              {activeScreen === 'gov' && (
                <div className="p-4 space-y-4 text-left animate-fadeIn">
                  <div className="border-b border-zinc-900 pb-2">
                    <h3 className="text-md font-bold text-zinc-200">Gov-Connect</h3>
                    <p className="text-[9px] text-zinc-500 mt-0.5">Municipal & Livestock Services</p>
                  </div>
                  
                  {/* Embed GovConnect simplified layout */}
                  <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-3">
                    <GovConnect />
                  </div>
                </div>
              )}

              {/* Circular Tools Sharing Library */}
              {activeScreen === 'tools' && (
                <div className="p-4 space-y-4 text-left animate-fadeIn">
                  <div className="border-b border-zinc-900 pb-2">
                    <h3 className="text-md font-bold text-zinc-200">🔧 Tools Share Library</h3>
                    <p className="text-[9px] text-zinc-500 mt-0.5">Borrow and exchange farm resources</p>
                  </div>

                  {toolMsg && (
                    <div className="bg-zinc-950 border border-zinc-850 rounded-xl p-3 text-[10px] font-semibold text-center leading-relaxed">
                      {toolMsg}
                    </div>
                  )}

                  <div className="space-y-3">
                    {toolsList.map(t => (
                      <div key={t.id} className="bg-zinc-950 border border-zinc-900 rounded-2xl p-4 flex justify-between items-center gap-3">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl bg-zinc-900/80 p-2 rounded-xl border border-zinc-850">{t.icon}</span>
                          <div>
                            <h4 className="text-xs font-bold text-zinc-250 leading-tight">{t.name}</h4>
                            <span className="text-[9px] text-zinc-500 block mt-0.5">Owner: {t.owner}</span>
                            <span className="inline-flex items-center gap-1.5 mt-2 bg-emerald-500/10 text-emerald-450 border border-emerald-500/20 px-2 py-0.5 rounded text-[8px] font-bold">
                              🪙 {t.cost} Credits
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleBorrowTool(t.id, t.cost)}
                          disabled={t.status === 'Borrowed'}
                          className={`px-3 py-2 rounded-xl text-[10px] font-bold transition-all border ${
                            t.status === 'Borrowed'
                              ? 'bg-zinc-900 text-zinc-600 border-zinc-850'
                              : 'bg-emerald-600 hover:bg-emerald-500 text-white border-transparent cursor-pointer'
                          }`}
                        >
                          {t.status === 'Borrowed' ? 'Borrowed' : 'Borrow'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* AI Advisor Overlay Modal */}
            {aiChatOpen && (
              <div className="absolute inset-0 bg-black/90 z-50 flex flex-col justify-between pt-10 pb-4 animate-fade-in text-left">
                <div className="px-4 border-b border-zinc-850 pb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🤖</span>
                    <div>
                      <h4 className="text-xs font-bold text-zinc-200">Eco AI Advisor</h4>
                      <p className="text-[8px] text-zinc-500">Live farming agent</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setAiChatOpen(false)}
                    className="text-zinc-400 hover:text-zinc-200 text-xs font-bold"
                  >
                    ✕ Close
                  </button>
                </div>

                {/* Chat window */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
                  {chatHistory.map((m, idx) => (
                    <div key={idx} className={`flex items-start gap-2.5 ${m.sender === 'user' ? 'justify-end' : ''}`}>
                      {m.sender !== 'user' && <span className="text-base bg-zinc-900 p-1.5 rounded-full">🤖</span>}
                      <div className={`max-w-[200px] rounded-2xl p-3 text-[11px] leading-relaxed ${
                        m.sender === 'user' 
                          ? 'bg-emerald-600 text-white rounded-tr-none' 
                          : 'bg-zinc-800/80 text-zinc-100 rounded-tl-none'
                      }`}>
                        {m.text}
                      </div>
                    </div>
                  ))}
                  {aiLoading && (
                    <p className="text-[10px] text-zinc-500 italic pl-8">Advisor is analyzing...</p>
                  )}
                </div>

                {/* Input form */}
                <form onSubmit={handleSendChat} className="px-4 flex gap-2 border-t border-zinc-850 pt-3">
                  <input
                    type="text"
                    required
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask about crops, soil, water..."
                    className="flex-1 bg-zinc-950 border border-zinc-850 focus:border-emerald-500 rounded-xl px-3.5 py-2 text-[11px] text-zinc-300 outline-none"
                  />
                  <button 
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-2 rounded-xl text-[11px]"
                  >
                    Send
                  </button>
                </form>
              </div>
            )}

            {/* iPhone Native Bottom Bar Navigation */}
            <div className="absolute bottom-0 left-0 right-0 bg-black/95 border-t border-zinc-850 px-4 py-2.5 flex justify-between items-center z-40 select-none">
              {[
                { id: 'home', icon: '🏠', label: 'Home' },
                { id: 'vault', icon: '🗂️', label: 'Vault' },
                { id: 'tools', icon: '🔧', label: 'Tools' },
                { id: 'gov', icon: '🏛️', label: 'Gov' }
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => setActiveScreen(item.id)}
                  className={`flex flex-col items-center gap-0.5 text-[9px] font-bold transition-all ${
                    activeScreen === item.id ? 'text-emerald-400' : 'text-zinc-500 hover:text-zinc-350'
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </div>
            
            {/* Phone Home Button indicator strip */}
            <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-32 h-1 bg-zinc-800 rounded-full z-45" />
          </div>
        </div>
      </div>
    </div>
  );
}
