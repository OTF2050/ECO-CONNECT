import React, { useState, useEffect } from 'react';
import { API_BASE } from '../config';
import SmartDocumentVerification from './SmartDocumentVerification';
import GovConnect from './GovConnect';

export default function MobileAppSimulator() {
  const [selectedMobileApp, setSelectedMobileApp] = useState('ecoconnect'); // 'ecoconnect' | 'souq'
  const [activeScreen, setActiveScreen] = useState('home'); // 'home' | 'vault' | 'tools' | 'gov'
  const [credits, setCredits] = useState(350);
  const [currentTime, setCurrentTime] = useState('');

  // ── EcoConnect App States ──
  const [toolsList, setToolsList] = useState([
    { id: 'TL-01', name: 'Tractor Rotary Tiller', icon: '🚜', owner: 'Jassim Farm', cost: 50, status: 'Available' },
    { id: 'TL-02', name: 'Soil pH Sensor Kit', icon: '🧪', owner: 'Hatta Hub', cost: 10, status: 'Available' },
    { id: 'TL-03', name: 'Date Palm Ladder (High)', icon: '🧗', owner: 'Saeed Al Mansouri', cost: 15, status: 'Borrowed' }
  ]);
  const [toolMsg, setToolMsg] = useState('');
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState([
    { sender: 'ai', text: 'Marhaban! I am your Hatta Farm Advisor. How can I help you grow today?' }
  ]);
  const [aiLoading, setAiLoading] = useState(false);
  const [gpsLogged, setGpsLogged] = useState(false);
  const [gpsCoords, setGpsCoords] = useState('23.5412, 55.4921');
  const [sosSent, setSosSent] = useState(false);

  // ── Vincent Souq App States ──
  const [souqScreen, setSouqScreen] = useState('shop'); // 'shop' | 'cart' | 'receipt'
  const [souqCart, setSouqCart] = useState([]);
  const [souqSuccess, setSouqSuccess] = useState('');
  const [souqReceipt, setSouqReceipt] = useState(null);

  const souqProducts = [
    { id: 'p1', name: 'Hatta Sidr Honey', price: 85, icon: '🍯', category: 'Raw Honey' },
    { id: 'p2', name: 'Organic Khalas Dates', price: 40, icon: '🌴', category: 'Fresh Crops' },
    { id: 'p3', name: 'Fresh Goat Milk', price: 15, icon: '🥛', category: 'Dairy' },
    { id: 'p4', name: 'Greenhouse Tomatoes', price: 12, icon: '🍅', category: 'Vegetables' }
  ];

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

  // ── Handlers for EcoConnect App ──
  const handleBorrowTool = (id, cost) => {
    if (credits < cost) {
      setToolMsg('❌ Insufficient Eco Credits.');
      return;
    }
    setCredits(prev => prev - cost);
    setToolsList(prev => prev.map(t => t.id === id ? { ...t, status: 'Borrowed' } : t));
    setToolMsg('✅ Tool requested successfully!');
    setTimeout(() => setToolMsg(''), 3000);
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

  // ── Handlers for Vincent Souq App ──
  const handleAddSouqCart = (prod) => {
    const existing = souqCart.find(item => item.id === prod.id);
    if (existing) {
      setSouqCart(prev => prev.map(item => item.id === prod.id ? { ...item, qty: item.qty + 1 } : item));
    } else {
      setSouqCart(prev => [...prev, { ...prod, qty: 1 }]);
    }
    setSouqSuccess(`Added ${prod.name} to cart! 🛒`);
    setTimeout(() => setSouqSuccess(''), 2000);
  };

  const handleCheckoutSouq = (e) => {
    e.preventDefault();
    if (souqCart.length === 0) return;
    const total = souqCart.reduce((sum, item) => sum + (item.price * item.qty), 0);

    const rec = {
      receiptId: `VS-${Date.now().toString().slice(-5)}`,
      date: new Date().toLocaleDateString('en-AE'),
      items: [...souqCart],
      total
    };
    setSouqReceipt(rec);
    setSouqCart([]);
    setSouqScreen('receipt');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#faf6ec] via-[#f5ede0] to-[#eae0cc] flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans text-zinc-800">
      {/* Background radial overlays */}
      <div className="pointer-events-none absolute -top-40 -right-40 h-96 w-96 rounded-full bg-emerald-600/5 blur-[130px]" />
      <div className="pointer-events-none absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-[#c2a14e]/5 blur-[130px]" />

      <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8 items-center z-10">
        {/* Left Side: Twin App Selector */}
        <div className="space-y-5 text-center md:text-left">
          <span className="inline-block bg-emerald-600/10 border border-emerald-500/20 text-emerald-800 font-bold px-3.5 py-1.5 rounded-full text-[10px] uppercase tracking-wider">
            Smartphone App Simulator
          </span>
          <h2 className="text-3xl md:text-5xl font-black text-zinc-900 leading-tight">EcoConnect Mobile Hub</h2>
          <p className="text-xs text-zinc-650 leading-relaxed font-light">
            Interact with the twin mobile applications engineered for remote Hatta farmers and local UAE buyers.
          </p>

          <div className="bg-white p-2 rounded-2xl border border-zinc-200 shadow-sm flex gap-2 w-full max-w-md mx-auto md:mx-0">
            <button
              onClick={() => setSelectedMobileApp('ecoconnect')}
              className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all border-0 cursor-pointer ${selectedMobileApp === 'ecoconnect' ? 'bg-[#1b3d34] text-white shadow-sm' : 'bg-transparent text-zinc-500 hover:text-zinc-800'}`}
            >
               Vincent EcoConnect
            </button>
            <button
              onClick={() => setSelectedMobileApp('souq')}
              className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all border-0 cursor-pointer ${selectedMobileApp === 'souq' ? 'bg-[#1b3d34] text-white shadow-sm' : 'bg-transparent text-zinc-500 hover:text-zinc-800'}`}
            >
               Vincent Souq
            </button>
          </div>

          <div className="flex justify-center md:justify-start gap-3">
            <a 
              href="#/login" 
              className="bg-white border border-zinc-250 hover:bg-zinc-50 text-zinc-700 font-bold px-5 py-3 rounded-xl text-xs transition-all no-underline"
            >
              ← Back to Web App
            </a>
            <button 
              onClick={() => { window.location.hash = '#/souq'; }} 
              className="bg-emerald-700 hover:bg-emerald-650 text-white font-bold px-5 py-3 rounded-xl text-xs shadow-md transition-all cursor-pointer border-0"
            >
              Open Public Souq Website 🏬
            </button>
          </div>
        </div>

        {/* Right Side: Smartphone Simulation */}
        <div className="flex justify-center">
          <div className="relative w-full max-w-[340px] h-[680px] max-h-[85vh] bg-zinc-100 border-[10px] border-zinc-300 rounded-[48px] shadow-[0_25px_60px_-15px_rgba(40,40,40,0.2)] overflow-hidden flex flex-col ring-4 ring-zinc-200">
            {/* Camera notch */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-6 bg-zinc-800 rounded-full z-50" />

            {/* Mobile Status Bar */}
            <div className="bg-[#fafafa] border-b border-zinc-200/50 text-zinc-700 text-[10px] font-semibold px-6 pt-3.5 pb-1.5 flex justify-between items-center z-40 select-none">
              <span>{currentTime}</span>
              <div className="flex items-center gap-1.5 font-mono text-[9px] text-zinc-500">
                <span>5G</span>
                <span>📶</span>
                <span>🔋 88%</span>
              </div>
            </div>

            {/* Scrollable Mobile Screen Content */}
            <div className="flex-1 bg-gradient-to-b from-[#f8faf7] to-[#edf3ee] text-zinc-800 overflow-y-auto pb-16 pt-3 relative scrollbar-none">
              {/* ──────────────────────────────────────────────────────────────
                  VINCENT ECOCONNECT APPLICATION
              ────────────────────────────────────────────────────────────── */}
              {selectedMobileApp === 'ecoconnect' && (
                <>
                  {activeScreen === 'home' && (
                    <div className="p-4 space-y-4 text-left animate-fadeIn">
                      <div className="bg-white border border-zinc-200/80 p-4 rounded-3xl shadow-sm">
                        <h3 className="text-sm font-bold text-zinc-800">Ahmed's Farm</h3>
                        <p className="text-[10px] text-zinc-500 mt-0.5">Plot #44-A · Hatta Valley</p>
                        <div className="mt-4 flex items-center justify-between">
                          <span className="text-xs font-mono text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-xl">
                            🪙 {credits} Credits
                          </span>
                          <span className="text-[10px] text-zinc-500">Moisture: 42%</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <button 
                          onClick={() => setAiChatOpen(true)}
                          className="bg-white border border-zinc-200 shadow-sm p-4 rounded-2xl flex flex-col items-center justify-center text-center space-y-1 transition-all cursor-pointer hover:bg-zinc-50"
                        >
                          <span className="text-xl">🗣️</span>
                          <span className="text-xs font-bold text-zinc-800">AI Advisor</span>
                          <span className="text-[9px] text-zinc-500">Chat Copilot</span>
                        </button>
                        <button 
                          onClick={() => {
                            setGpsLogged(true);
                            setGpsCoords(`${(23.5 + Math.random()*0.1).toFixed(4)}, ${(55.4 + Math.random()*0.1).toFixed(4)}`);
                          }}
                          className="bg-white border border-zinc-200 shadow-sm p-4 rounded-2xl flex flex-col items-center justify-center text-center space-y-1 transition-all cursor-pointer hover:bg-zinc-50"
                        >
                          <span className="text-xl">📍</span>
                          <span className="text-xs font-bold text-zinc-800">Log GPS</span>
                          <span className="text-[9px] text-zinc-500">{gpsLogged ? 'Logged ✓' : 'Location'}</span>
                        </button>
                      </div>

                      {gpsLogged && (
                        <div className="bg-emerald-50/80 border border-emerald-200/50 rounded-2xl p-2.5 text-[9px] font-mono text-emerald-700 text-center">
                          📍 GPS REGISTERED: {gpsCoords}
                        </div>
                      )}

                      {/* Platform parity quick-access (mirrors the website pillars) */}
                      <div>
                        <p className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider mb-2 px-1">Explore Platform</p>
                        <div className="grid grid-cols-4 gap-2">
                          {[
                            { icon: '🏪', label: 'Souq', action: () => setSelectedMobileApp('souq') },
                            { icon: '🗂️', label: 'Vault', action: () => setActiveScreen('vault') },
                            { icon: '🔧', label: 'Tools', action: () => setActiveScreen('tools') },
                            { icon: '🏛️', label: 'Gov', action: () => setActiveScreen('gov') },
                          ].map((s) => (
                            <button
                              key={s.label}
                              onClick={s.action}
                              className="bg-white border border-zinc-200 shadow-sm rounded-2xl py-3 flex flex-col items-center gap-1 cursor-pointer hover:bg-zinc-50 transition-all"
                            >
                              <span className="text-lg">{s.icon}</span>
                              <span className="text-[8.5px] font-bold text-zinc-700">{s.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="bg-rose-50 border border-rose-200/80 rounded-2xl p-4 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-rose-900">Emergency SOS</span>
                          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                        </div>
                        <p className="text-[9px] text-rose-700">Alert civil defense & veterinary services in Hatta.</p>
                        <button 
                          onClick={() => { setSosSent(true); setTimeout(() => setSosSent(false), 3000); }}
                          className="w-full bg-rose-600 hover:bg-rose-550 text-white font-bold py-2 rounded-xl text-xs uppercase tracking-wide cursor-pointer border-0 shadow-sm"
                        >
                          Trigger SOS Beacon
                        </button>
                        {sosSent && (
                          <div className="bg-rose-100 border border-rose-300 text-rose-800 rounded-xl p-2.5 text-[10px] text-center">
                            🚨 SOS Beacon dispatched to Civil Defence! GPS coordinates sent.
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {activeScreen === 'vault' && (
                    <div className="p-4 space-y-4 text-left animate-fadeIn">
                      <div className="border-b border-zinc-200 pb-2">
                        <h3 className="text-sm font-bold text-zinc-850">My Files & Vault</h3>
                        <p className="text-[9px] text-zinc-550 mt-0.5">Secure OCR document uploader</p>
                      </div>
                      <div className="bg-white border border-zinc-200 rounded-2xl p-3 shadow-sm">
                        <SmartDocumentVerification token="" userName="Ahmed Farmer" vaultOnly />
                      </div>
                    </div>
                  )}

                  {activeScreen === 'tools' && (
                    <div className="p-4 space-y-4 text-left animate-fadeIn">
                      <div className="border-b border-zinc-200 pb-2">
                        <h3 className="text-sm font-bold text-zinc-850">🔧 Tools Share Library</h3>
                        <p className="text-[9px] text-zinc-500 mt-0.5">Borrow neighbouring farm resources</p>
                      </div>
                      {toolMsg && (
                        <div className="bg-emerald-50 border border-emerald-250 rounded-xl p-2.5 text-[10px] text-center text-emerald-700 font-bold">
                          {toolMsg}
                        </div>
                      )}
                      <div className="space-y-2.5">
                        {toolsList.map(t => (
                          <div key={t.id} className="bg-white border border-zinc-205 p-3 rounded-2xl flex justify-between items-center gap-3 shadow-sm">
                            <div className="flex items-center gap-2.5">
                              <span className="text-2xl bg-zinc-50 border border-zinc-200 p-2 rounded-xl">{t.icon}</span>
                              <div>
                                <h4 className="text-xs font-bold text-zinc-800 leading-tight">{t.name}</h4>
                                <span className="text-[9px] text-zinc-500 block">Owner: {t.owner}</span>
                              </div>
                            </div>
                            <button
                              onClick={() => handleBorrowTool(t.id, t.cost)}
                              disabled={t.status === 'Borrowed'}
                              className={`px-3 py-1.5 rounded-xl text-[10px] font-bold border-0 cursor-pointer ${t.status === 'Borrowed' ? 'bg-zinc-100 text-zinc-400' : 'bg-emerald-600 text-white hover:bg-emerald-550 shadow-sm'}`}
                            >
                              {t.status === 'Borrowed' ? 'Rented' : `${t.cost} 🪙`}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeScreen === 'gov' && (
                    <div className="p-4 space-y-4 text-left animate-fadeIn">
                      <div className="border-b border-zinc-200 pb-2">
                        <h3 className="text-sm font-bold text-zinc-850">Gov-Connect Portal</h3>
                        <p className="text-[9px] text-zinc-500 mt-0.5">Livestock & Crop Permits</p>
                      </div>
                      <div className="bg-white border border-zinc-200 rounded-2xl p-3 shadow-sm">
                        <GovConnect isWidget={true} />
                      </div>
                    </div>
                  )}
                </>
              )}

              {selectedMobileApp === 'souq' && (
                <div className="p-4 space-y-4 text-left animate-fadeIn">
                  {souqSuccess && (
                    <div className="bg-emerald-50 border border-emerald-250 text-emerald-700 text-[10px] p-2 rounded-xl text-center font-bold">
                      {souqSuccess}
                    </div>
                  )}

                  {souqScreen === 'shop' && (
                    <>
                      <div className="border-b border-zinc-200 pb-2">
                        <h3 className="text-sm font-bold text-zinc-850">Vincent Souq Store</h3>
                        <p className="text-[9px] text-zinc-500 mt-0.5">Organic local crops & food products</p>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        {souqProducts.map(p => (
                          <div key={p.id} className="bg-white border border-zinc-200/80 p-3 rounded-2xl flex flex-col justify-between h-36 shadow-sm">
                            <div>
                              <div className="flex justify-between items-center">
                                <span className="text-2xl">{p.icon}</span>
                                <span className="text-[8px] bg-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded-full font-mono font-bold">{p.category}</span>
                              </div>
                              <h4 className="text-xs font-bold text-zinc-800 mt-2 leading-tight">{p.name}</h4>
                            </div>
                            <div className="flex justify-between items-center mt-3 pt-2 border-t border-zinc-100">
                              <span className="text-xs font-mono font-bold text-emerald-700">{p.price} AED</span>
                              <button
                                onClick={() => handleAddSouqCart(p)}
                                className="bg-emerald-600 hover:bg-emerald-550 text-white font-bold p-1.5 rounded-lg text-[10px] border-0 cursor-pointer shadow-sm"
                              >
                                + Add
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {souqScreen === 'cart' && (
                    <form onSubmit={handleCheckoutSouq} className="space-y-4 font-sans">
                      <div className="border-b border-zinc-200 pb-2">
                        <h3 className="text-sm font-bold text-zinc-850">Your Basket</h3>
                        <p className="text-[9px] text-zinc-505 mt-0.5">Review items & select gateway</p>
                      </div>

                      {souqCart.length === 0 ? (
                        <p className="text-xs text-zinc-500 italic text-center py-8">Your basket is empty.</p>
                      ) : (
                        <div className="space-y-2 bg-white p-3 rounded-xl border border-zinc-200 shadow-sm">
                          {souqCart.map(item => (
                            <div key={item.id} className="flex justify-between items-center text-xs text-zinc-700">
                              <span>{item.icon} {item.name} (x{item.qty})</span>
                              <span className="font-mono text-zinc-800">{item.price * item.qty} AED</span>
                            </div>
                          ))}
                          <div className="flex justify-between border-t border-zinc-100 pt-2 font-bold text-xs">
                            <span className="text-zinc-800">Total Cost:</span>
                            <span className="text-emerald-700">
                              {souqCart.reduce((sum, item) => sum + (item.price * item.qty), 0)} AED
                            </span>
                          </div>
                        </div>
                      )}

                      {souqCart.length > 0 && (
                        <div className="space-y-3 pt-2">
                          <div className="flex flex-col gap-1">
                            <label className="text-[9px] uppercase font-bold text-zinc-600">Billing Card Number</label>
                            <input
                              type="text"
                              required
                              placeholder="4000 1234 5678 9010"
                              className="bg-zinc-50 border border-zinc-250 text-xs text-zinc-800 p-2.5 rounded-xl outline-none focus:border-emerald-500 font-mono"
                            />
                          </div>
                          <button
                            type="submit"
                            className="w-full bg-[#c2a14e] hover:brightness-110 text-zinc-900 font-bold py-2.5 rounded-xl text-xs uppercase tracking-wide cursor-pointer border-0 shadow-sm"
                          >
                            Place Order 🚀
                          </button>
                        </div>
                      )}
                    </form>
                  )}

                  {souqScreen === 'receipt' && souqReceipt && (
                    <div className="space-y-4">
                      <div className="bg-white text-zinc-950 p-5 rounded-2xl border border-zinc-250 font-mono text-left leading-relaxed shadow-sm">
                        <div className="text-center border-b border-dashed border-zinc-300 pb-3 space-y-1">
                          <p className="text-[9px] font-bold tracking-widest uppercase text-zinc-500">Vincent Souq Mobile</p>
                          <h4 className="text-[11px] font-black uppercase text-zinc-850">SALE RECEIPT</h4>
                        </div>
                        <div className="text-[9px] py-2 border-b border-zinc-200 text-zinc-650 space-y-0.5">
                          <div>Serial: {souqReceipt.receiptId}</div>
                          <div>Date: {souqReceipt.date}</div>
                        </div>
                        <div className="py-2 border-b border-zinc-200 space-y-1 text-zinc-700">
                          {souqReceipt.items.map(item => (
                            <div key={item.id} className="flex justify-between text-[9px]">
                              <span>{item.name} x{item.qty}</span>
                              <span>{item.price * item.qty} AED</span>
                            </div>
                          ))}
                        </div>
                        <div className="pt-2 flex justify-between font-black text-xs text-zinc-850 animate-fadeIn">
                          <span>TOTAL:</span>
                          <span>{souqReceipt.total} AED</span>
                        </div>
                      </div>
                      <button
                        onClick={() => setSouqScreen('shop')}
                        className="w-full bg-zinc-100 hover:bg-zinc-50 border border-zinc-255 text-zinc-700 font-bold py-2 rounded-xl text-xs uppercase cursor-pointer"
                      >
                        Keep Shopping 🏪
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* AI Advisor Chat Drawer Overlay (EcoConnect App Only) */}
            {selectedMobileApp === 'ecoconnect' && aiChatOpen && (
              <div className="absolute inset-0 bg-white/98 z-50 flex flex-col justify-between pt-10 pb-4 text-left border-l border-zinc-200">
                <div className="px-4 border-b border-zinc-200 pb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🤖</span>
                    <div>
                      <h4 className="text-xs font-bold text-zinc-800">Eco AI Advisor</h4>
                      <p className="text-[8px] text-zinc-500">Live farming agent</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setAiChatOpen(false)}
                    className="text-zinc-550 hover:text-zinc-850 text-xs font-bold bg-transparent border-0 cursor-pointer"
                  >
                    ✕ Close
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
                  {chatHistory.map((m, idx) => (
                    <div key={idx} className={`flex items-start gap-2.5 ${m.sender === 'user' ? 'justify-end' : ''}`}>
                      {m.sender !== 'user' && <span className="text-base bg-zinc-100 p-1.5 rounded-full">🤖</span>}
                      <div className={`max-w-[200px] rounded-2xl p-3 text-[11px] leading-relaxed ${
                        m.sender === 'user' 
                          ? 'bg-emerald-600 text-white rounded-tr-none font-medium' 
                          : 'bg-zinc-100 text-zinc-800 rounded-tl-none border border-zinc-200'
                      }`}>
                        {m.text}
                      </div>
                    </div>
                  ))}
                  {aiLoading && (
                    <p className="text-[10px] text-zinc-500 italic pl-8">Advisor is analyzing...</p>
                  )}
                </div>

                <form onSubmit={handleSendChat} className="px-4 flex gap-2 border-t border-zinc-200 pt-3">
                  <input
                    type="text"
                    required
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask about crops, soil, water..."
                    className="flex-1 bg-zinc-50 border border-zinc-200 focus:border-emerald-500 rounded-xl px-3.5 py-2 text-[11px] text-zinc-800 outline-none"
                  />
                  <button 
                    type="submit"
                    className="bg-[#247055] hover:bg-emerald-600 text-white font-bold px-4 py-2 rounded-xl text-[11px] border-0 cursor-pointer"
                  >
                    Send
                  </button>
                </form>
              </div>
            )}

            {/* Bottom App Navigation Bars */}
            {selectedMobileApp === 'ecoconnect' ? (
              <div className="absolute bottom-0 left-0 right-0 bg-[#fbfbfa]/90 border-t border-zinc-200/60 px-4 py-2.5 flex justify-between items-center z-45 select-none backdrop-blur-md">
                {[
                  { id: 'home', icon: '🏠', label: 'Home' },
                  { id: 'vault', icon: '🗂️', label: 'Vault' },
                  { id: 'tools', icon: '🔧', label: 'Tools' },
                  { id: 'gov', icon: '🏛️', label: 'Gov' }
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => setActiveScreen(item.id)}
                    className={`flex flex-col items-center gap-0.5 text-[9px] font-bold transition-all border-0 bg-transparent cursor-pointer ${
                      activeScreen === item.id ? 'text-emerald-700 font-extrabold' : 'text-zinc-500 hover:text-zinc-800'
                    }`}
                  >
                    <span className="text-lg">{item.icon}</span>
                    {item.label}
                  </button>
                ))}
              </div>
            ) : (
              <div className="absolute bottom-0 left-0 right-0 bg-[#fbfbfa]/90 border-t border-zinc-200/60 px-6 py-2.5 flex justify-between items-center z-45 select-none backdrop-blur-md">
                {[
                  { id: 'shop', icon: '🏪', label: 'Shop' },
                  { id: 'cart', icon: '🛒', label: 'Cart' }
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => setSouqScreen(item.id)}
                    className={`relative flex flex-col items-center gap-0.5 text-[9px] font-bold transition-all border-0 bg-transparent cursor-pointer ${
                      souqScreen === item.id ? 'text-emerald-700 font-extrabold' : 'text-zinc-500 hover:text-zinc-800'
                    }`}
                  >
                    <span className="text-lg">{item.icon}</span>
                    {item.label}
                    {item.id === 'cart' && souqCart.length > 0 && (
                      <span className="absolute -top-1 right-1 w-2 h-2 rounded-full bg-rose-500" />
                    )}
                  </button>
                ))}
              </div>
            )}
            
            {/* Phone Home Button indicator strip */}
            <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-32 h-1 bg-zinc-300 rounded-full z-45" />
          </div>
        </div>
      </div>
    </div>
  );
}
