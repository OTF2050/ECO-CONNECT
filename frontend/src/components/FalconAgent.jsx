import React, { useState, useRef, useEffect } from 'react';
import { API_BASE } from '../config';

// ── Falcon capabilities (MIRA-style sidebar registry) ──────────────────────
const CAPABILITIES = [
  { id: 'crop', icon: '🌱', label: 'Crop Advisory', prompt: 'What should I plant this season on my farm in the UAE?' },
  { id: 'water', icon: '💧', label: 'Water & Irrigation', prompt: 'How can I cut my irrigation water use without hurting yield?' },
  { id: 'pest', icon: '🐛', label: 'Pest & Disease', prompt: 'How do I control red palm weevil on my date palms?' },
  { id: 'livestock', icon: '🐐', label: 'Livestock Care', prompt: 'How do I keep my livestock healthy in 45°C summer heat?' },
  { id: 'market', icon: '🏷️', label: 'Market & Subsidies', prompt: 'How do I apply for a farming subsidy or permit?' },
  { id: 'climate', icon: '🌡️', label: 'Climate Adaptation', prompt: 'How do I protect my crops from extreme heat and dust?' },
];

const QUICK_COMMANDS = [
  'How do I improve sandy, salty soil?',
  'What can I plant in the UAE summer?',
  'How do I start composting on my farm?',
  'How do I set up a drip irrigation system?',
  'How do I host an eco-tourism farm visit?',
];

const GREETING = {
  role: 'assistant',
  content:
    "Marhaba! I'm Falcon — your Farm Intelligence & Research Advisor. Pick a capability or ask me anything about soil, crops, water, pests, livestock, climate or using Eco Connect.",
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Named sub-agents shown in the processing pipeline (MOE multi-agent style)
const FALCON_AGENTS = [
  { id: 'intake', icon: '📋', name: 'Query Intake', note: 'Parsing intent & region' },
  { id: 'knowledge', icon: '📚', name: 'Agronomy Knowledge', note: 'Arid-farming corpus' },
  { id: 'climate', icon: '🌡️', name: 'Climate Analyst', note: 'Heat / water context' },
  { id: 'rules', icon: '⚖️', name: 'MOCCAE Guidelines', note: 'Policy & sustainability' },
  { id: 'advisor', icon: '🦅', name: 'Advisory Synthesiser', note: 'Composing guidance' },
];

// Client-side processing trace (mirrors the backend Falcon engine trace)
function buildTrace(message) {
  const q = (message || '').trim();
  const qShort = q.length > 44 ? `${q.slice(0, 44)}...` : q;
  return [
    '> Accessing Falcon Farm Intelligence Engine v2.0...',
    `> Parsing query: "${qShort}"`,
    '> Region context: UAE · Al Ain / Hatta / Liwa',
    '> Cross-referencing arid-agronomy knowledge base...',
    '> Applying MOCCAE sustainability guidelines...',
    '> Generating advisory...',
  ];
}

export default function FalconAgent({ onVoiceCommand }) {
  const [messages, setMessages] = useState([GREETING]);
  const [isListening, setIsListening] = useState(false);
  const [voiceLang, setVoiceLang] = useState('ar-AE'); // 'ar-AE' | 'en-US'

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please try Chrome or Safari.");
      return;
    }
    const rec = new SpeechRecognition();
    rec.lang = voiceLang;
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    rec.onstart = () => {
      setIsListening(true);
    };

    rec.onerror = (e) => {
      console.error(e);
      setIsListening(false);
    };

    rec.onend = () => {
      setIsListening(false);
    };

    rec.onresult = async (e) => {
      const transcript = e.results[0][0].transcript;
      setInput(transcript);
      setIsListening(false);
      await sendVoiceMessage(transcript);
    };

    rec.start();
  };

  const speakText = (text) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = voiceLang;
    const voices = window.speechSynthesis.getVoices();
    const targetVoice = voices.find(v => v.lang.startsWith(voiceLang.split('-')[0]));
    if (targetVoice) {
      utterance.voice = targetVoice;
    }
    window.speechSynthesis.speak(utterance);
  };

  const sendVoiceMessage = async (text) => {
    setStatus('thinking');
    setTerminalLines(['> EcoConnect Voice Hub listening...', `> Speech recognized: "${text}"`, '> Routing query to voice processor...']);
    try {
      const res = await fetch(`${API_BASE}/api/voice-assistant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      });
      if (res.ok) {
        const data = await res.json();
        setTerminalLines(prev => [...prev, '> Response received from Voice Hub', '✓ Speech synthesized.']);
        setMessages(prev => [...prev, 
          { role: 'user', content: text },
          { role: 'assistant', content: data.reply, topic: 'Voice Assistant Response' }
        ]);
        speakText(data.reply);
        
        if (data.command && onVoiceCommand) {
          setTimeout(() => {
            onVoiceCommand(data.command);
          }, 1500);
        }
      } else {
        setTerminalLines(prev => [...prev, '! Voice assistant endpoint failed.']);
      }
    } catch (err) {
      setTerminalLines(prev => [...prev, '! Network error in Voice Hub.']);
    } finally {
      setStatus('chat');
    }
  };

  const [input, setInput] = useState('');
  const [status, setStatus] = useState('idle'); // idle | thinking | chat
  const [terminalLines, setTerminalLines] = useState([]);
  const [agentStates, setAgentStates] = useState({}); // id -> 'active' | 'done'
  const [offline, setOffline] = useState(false);
  const [agentLabel, setAgentLabel] = useState('Falcon');
  const [capability, setCapability] = useState('crop');
  const endRef = useRef(null);
  const terminalRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, status]);

  useEffect(() => {
    terminalRef.current?.scrollTo({ top: terminalRef.current.scrollHeight });
  }, [terminalLines]);

  const send = async (text) => {
    const content = (text ?? input).trim();
    if (!content || status === 'thinking') return;

    const nextMessages = [...messages, { role: 'user', content }];
    setMessages(nextMessages);
    setInput('');
    setStatus('thinking');
    setTerminalLines([]);
    setAgentStates({});

    // Fire the request and animate the processing terminal in parallel
    const history = nextMessages.slice(-8).map((m) => ({ role: m.role, content: m.content }));
    const fetchPromise = fetch(`${API_BASE}/api/falcon`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: content, history }),
    })
      .then((r) => {
        if (!r.ok) throw new Error('unavailable');
        return r.json();
      })
      .catch(() => null);

    // Animate named sub-agents through their lifecycle
    (async () => {
      for (const agent of FALCON_AGENTS) {
        setAgentStates((prev) => ({ ...prev, [agent.id]: 'active' }));
        await sleep(360);
        setAgentStates((prev) => ({ ...prev, [agent.id]: 'done' }));
      }
    })();

    for (const line of buildTrace(content)) {
      setTerminalLines((prev) => [...prev, line]);
      await sleep(230);
    }

    const data = await fetchPromise;

    if (data) {
      setOffline(data.ai_processed === false);
      setAgentLabel(data.agent || 'Falcon');
      const closing = data.ai_processed === false
        ? '> Using offline knowledge base...'
        : '> Falcon Cloud Agent responded ✓';
      setTerminalLines((prev) => [...prev, closing, `> Domain: ${data.topic || 'General Advisory'}`, '✓ Advisory ready.']);
      await sleep(450);
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply, topic: data.topic }]);
    } else {
      setTerminalLines((prev) => [...prev, '! Falcon service unreachable.']);
      await sleep(450);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'I could not reach the Falcon service. Please ensure the backend is running and try again.' },
      ]);
    }
    setStatus('chat');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    send();
  };

  const handleCapability = (cap) => {
    setCapability(cap.id);
    setInput(cap.prompt);
  };

  const isIdle = status !== 'thinking' && messages.length <= 1;

  return (
    <div className="max-w-6xl mx-auto w-full">
      <div className="flex flex-col h-[78vh] rounded-2xl overflow-hidden border border-[#9b7a36]/40 shadow-2xl bg-[#0f0b05]">
        {/* ── Dark Falcon header ── */}
        <div className="bg-[#2a1e0e] border-b border-[#9b7a36]/40 px-4 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#9b7a36] to-[#c2a14e] flex items-center justify-center text-lg shadow">🦅</div>
            <div>
              <div className="text-white font-bold text-base tracking-wide">FALCON</div>
              <div className="text-[#a89060] text-[10px] tracking-wider">FARM INTELLIGENCE &amp; RESEARCH ADVISOR</div>
            </div>
            <div className={`flex items-center gap-1.5 ml-3 rounded-full px-2.5 py-0.5 border ${offline ? 'bg-amber-900/40 border-amber-500/30' : 'bg-green-900/40 border-green-500/30'}`}>
              <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${offline ? 'bg-amber-400' : 'bg-green-400'}`} />
              <span className={`text-[10px] font-mono tracking-wider ${offline ? 'text-amber-400' : 'text-green-400'}`}>
                {offline ? 'OFFLINE KB' : 'ONLINE'}
              </span>
            </div>
          </div>
          <span className="hidden sm:block text-[#c2a14e] text-[10px] font-mono border border-[#9b7a36]/40 rounded-lg px-3 py-1.5">
            {agentLabel}
          </span>
        </div>

        {/* ── Body (sidebar + main) ── */}
        <div className="flex flex-1 overflow-hidden">
          {/* ── Left sidebar ── */}
          <div className="w-[210px] flex-shrink-0 bg-[#1a1208] border-r border-[#9b7a36]/20 flex-col overflow-y-auto hidden md:flex">
            <div className="p-3">
              <div className="text-[10px] font-bold text-[#9b7a36] uppercase tracking-widest mb-2 px-1">Capabilities</div>
              <div className="space-y-1">
                {CAPABILITIES.map((cap) => (
                  <button
                    key={cap.id}
                    onClick={() => handleCapability(cap)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-left transition-all ${
                      capability === cap.id
                        ? 'bg-[#9b7a36] text-white font-semibold shadow-sm'
                        : 'text-[#d8c9a8] hover:bg-[#2a1e0e]'
                    }`}
                  >
                    <span>{cap.icon}</span>
                    <span className="truncate text-xs">{cap.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="px-3 py-2 border-t border-[#9b7a36]/15 mt-auto">
              <div className="text-[10px] font-bold text-[#9b7a36] uppercase tracking-widest mb-2 px-1">Quick Commands</div>
              <div className="space-y-1">
                {QUICK_COMMANDS.map((cmd, i) => (
                  <button
                    key={i}
                    onClick={() => send(cmd)}
                    className="w-full text-left px-3 py-1.5 rounded-lg text-[11px] text-[#d8c9a8] hover:bg-[#2a1e0e] border border-transparent hover:border-[#9b7a36]/30 transition-colors"
                  >
                    {cmd}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── Main content ── */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Welcome / idle */}
              {isIdle && (
                <div className="h-full flex flex-col items-center justify-center text-center max-w-xl mx-auto">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#9b7a36] to-[#c2a14e] flex items-center justify-center mb-5 shadow-lg text-3xl">🦅</div>
                  <h2 className="text-2xl font-bold text-[#e9dcc0] mb-2">Welcome to Falcon</h2>
                  <p className="text-sm text-[#a89060] mb-1">Farm Intelligence &amp; Research Advisor</p>
                  <p className="text-xs text-[#9b7a36] mb-6">Practical, UAE-ready guidance for every part of your farm — and the Eco Connect platform.</p>
                  <div className="grid grid-cols-2 gap-3 w-full">
                    {CAPABILITIES.map((cap) => (
                      <button
                        key={cap.id}
                        onClick={() => send(cap.prompt)}
                        className="flex items-center gap-2 p-3 rounded-xl border-2 text-left transition-all border-[#9b7a36]/30 hover:border-[#c2a14e] bg-[#1a1208]"
                      >
                        <span className="text-lg">{cap.icon}</span>
                        <span className="text-xs font-medium text-[#d8c9a8]">{cap.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Conversation */}
              {!isIdle && messages.map((m, i) => (
                <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {m.role === 'assistant' && (
                    <div className="w-8 h-8 shrink-0 rounded-lg bg-gradient-to-br from-[#9b7a36] to-[#c2a14e] flex items-center justify-center text-base">🦅</div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                      m.role === 'user'
                        ? 'bg-[#9b7a36] text-white rounded-br-sm'
                        : 'bg-[#1a1208] border border-[#9b7a36]/25 text-[#e9dcc0] rounded-bl-sm'
                    }`}
                  >
                    {m.role === 'assistant' && m.topic && (
                      <div className="text-[9px] uppercase tracking-widest font-bold text-[#9b7a36] mb-1.5">{m.topic}</div>
                    )}
                    {m.content}
                  </div>
                </div>
              ))}

              {/* Thinking — terminal */}
              {status === 'thinking' && (
                <div className="max-w-2xl">
                  {/* Multi-agent pipeline */}
                  <div className="mb-3 grid grid-cols-1 sm:grid-cols-5 gap-2">
                    {FALCON_AGENTS.map((agent) => {
                      const st = agentStates[agent.id];
                      return (
                        <div
                          key={agent.id}
                          className={`rounded-xl border p-2.5 transition-all ${
                            st === 'done'
                              ? 'border-green-500/40 bg-green-900/15'
                              : st === 'active'
                              ? 'border-[#c2a14e] bg-[#2a1e0e] shadow'
                              : 'border-[#9b7a36]/15 bg-[#1a1208] opacity-50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-base">{agent.icon}</span>
                            <span className="text-[10px] font-mono">
                              {st === 'done' ? <span className="text-green-400">✓</span>
                                : st === 'active' ? <span className="text-[#c2a14e] animate-pulse">●</span>
                                : <span className="text-[#7a6440]">○</span>}
                            </span>
                          </div>
                          <div className="text-[10px] font-bold text-[#e9dcc0] mt-1.5 leading-tight">{agent.name}</div>
                          <div className="text-[9px] text-[#a89060] leading-tight">{agent.note}</div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="bg-[#120c04] rounded-xl border border-[#9b7a36]/30 overflow-hidden">
                    <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[#9b7a36]/20">
                      <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-500/70" />
                        <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                        <div className="w-3 h-3 rounded-full bg-green-500/70" />
                      </div>
                      <span className="font-mono text-[10px] text-[#a89060] tracking-wider ml-2">Falcon Intelligence Engine v2.0</span>
                      <div className="ml-auto flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#c2a14e] animate-pulse" />
                        <span className="text-[#c2a14e] text-[10px] font-mono">PROCESSING</span>
                      </div>
                    </div>
                    <div ref={terminalRef} className="p-4 font-mono text-xs space-y-1 min-h-[160px] max-h-[320px] overflow-y-auto">
                      {terminalLines.map((line, i) => {
                        const isCmd = line.startsWith('>');
                        const isSuccess = line.startsWith('✓');
                        const isWarning = line.startsWith('!');
                        return (
                          <div key={i} style={{ color: isSuccess ? '#22c55e' : isWarning ? '#ef4444' : isCmd ? '#c2a14e' : '#a89060' }}>
                            {line}
                          </div>
                        );
                      })}
                      <div className="text-[#c2a14e] animate-pulse">█</div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={endRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="border-t border-[#9b7a36]/20 bg-[#1a1208] p-3 flex items-center gap-2">
              <button
                type="button"
                onClick={startListening}
                className={`w-12 h-12 rounded-xl border flex items-center justify-center transition-all ${
                  isListening
                    ? 'bg-rose-600 border-rose-500 animate-pulse text-white'
                    : 'bg-[#120c04] border-[#9b7a36]/30 text-[#c2a14e] hover:border-[#c2a14e]'
                }`}
                title="Tap to speak to EcoConnect Voice Hub"
              >
                {isListening ? '🎙️' : '🎤'}
              </button>
              <button
                type="button"
                onClick={() => setVoiceLang(prev => prev === 'ar-AE' ? 'en-US' : 'ar-AE')}
                className="w-12 h-12 rounded-xl border bg-[#120c04] border-[#9b7a36]/30 text-[#c2a14e] hover:border-[#c2a14e] text-[10px] font-bold uppercase transition-all cursor-pointer"
                title="Toggle Voice Language"
              >
                {voiceLang === 'ar-AE' ? 'العربية' : 'EN'}
              </button>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask Falcon, or tap mic to speak to Voice Hub..."
                className="flex-1 bg-[#120c04] border border-[#9b7a36]/30 focus:border-[#c2a14e] rounded-xl py-3 px-4 text-sm text-[#e9dcc0] placeholder:text-[#7a6440] outline-none"
              />
              <button
                type="submit"
                disabled={status === 'thinking' || !input.trim()}
                className="bg-gradient-to-br from-[#9b7a36] to-[#c2a14e] hover:brightness-110 disabled:opacity-40 text-white font-bold px-5 py-3 rounded-xl text-sm transition-all"
              >
                Send ➤
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

