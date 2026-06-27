import React, { useState, useRef, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from '../context/AuthContext';
import { API_BASE } from '../config';

// Role-aware quick prompts — mirrors the AssistantWidget pattern from MOE CO-POILT
const QUICK_PROMPTS = {
  farmer: {
    default: [
      'How do I apply for a government subsidy?',
      'How do I increase my aquifer water quota?',
      'My crops show signs of pest disease. What should I do?',
      'How do I get an organic certification permit?',
    ],
  },
  tourist: {
    default: [
      'What eco-tours are available in the UAE?',
      'How do I book a Eco forest walking tour?',
      'What should I pack for a desert eco-trip?',
      'Which regions have the best Eco tree sites?',
    ],
  },
  admin: {
    default: [
      'Summarise today\'s pending government requests.',
      'How many farmers have active eco-tourism tours?',
      'What are the top environmental report categories?',
      'Explain the Eco tree conservation programme.',
    ],
  },
};

const ROLE_HEADERS = {
  farmer: { title: 'Eco Farmer Advisor', sub: 'Crops · Water · Subsidies · Permits' },
  tourist: { title: 'Eco Eco-Guide', sub: 'Tours · Activities · Sustainability tips' },
  admin: { title: 'Eco Admin Assistant', sub: 'Reports · Analytics · Governance' },
  default: { title: 'Eco Copilot', sub: 'Agricultural & Environmental Advisor' },
};

export default function EcoCopilotChat({ role }) {
  const { token } = useContext(AuthContext);
  const chatRole = role || 'default';
  const storageKey = `eco-chat-${chatRole}`;

  const [isOpen, setIsOpen] = useState(false);

  // Restore persisted history for this role (mimics AssistantWidget session persistence)
  const [messages, setMessages] = useState(() => {
    try {
      const raw = sessionStorage.getItem(storageKey);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const [inputValue, setInputValue] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef(null);

  const persistMessages = useCallback((msgs) => {
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(msgs.slice(-60)));
    } catch { /* quota */ }
    setMessages(msgs);
  }, [storageKey]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  const handleMicClick = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.lang = 'ar-AE';
      rec.onstart = () => setIsTranscribing(true);
      rec.onresult = async (e) => {
        const text = e.results[0][0].transcript;
        setInputValue((prev) => prev ? prev + ' ' + text : text);
        
        try {
          await fetch(`${API_BASE}/api/speech/transcribe`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ audio_base64: 'raw-mic-chat', text_fallback: text })
          });
        } catch (err) {
          console.error(err);
        }
      };
      rec.onerror = () => setIsTranscribing(false);
      rec.onend = () => setIsTranscribing(false);
      rec.start();
    } else {
      setIsTranscribing(true);
      setTimeout(async () => {
        setIsTranscribing(false);
        let sampleSpeech = "كيف يمكنني تقديم طلب للحصول على دعم زراعي؟";
        if (chatRole === 'tourist') {
          sampleSpeech = "ما هي الجولات البيئية المتاحة في حتا؟";
        } else if (chatRole === 'admin') {
          sampleSpeech = "عرض ملخص تقارير الاستغاثة المعلقة";
        }
        setInputValue((prev) => prev ? prev + ' ' + sampleSpeech : sampleSpeech);
        try {
          await fetch(`${API_BASE}/api/speech/transcribe`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ audio_base64: 'raw-simulated-mic-chat', text_fallback: sampleSpeech })
          });
        } catch (err) {
          console.error(err);
        }
      }, 2000);
    }
  };

  const sendMessage = async (text) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    const next = [...messages, { role: 'user', content: trimmed }];
    persistMessages(next);
    setInputValue('');
    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message: trimmed, history: next, audience: chatRole }),
      });

      if (res.ok) {
        const data = await res.json();
        persistMessages([...next, { role: 'assistant', content: data.response }]);
      } else {
        persistMessages([...next, { role: 'assistant', content: "Sorry, I'm having trouble connecting. Please try again." }]);
      }
    } catch {
      persistMessages([...next, { role: 'assistant', content: 'Connection timeout. The Eco Advisor server appears offline.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearHistory = () => {
    try { sessionStorage.removeItem(storageKey); } catch { /* ignore */ }
    setMessages([]);
  };

  const header = ROLE_HEADERS[chatRole] || ROLE_HEADERS.default;
  const quickPrompts = QUICK_PROMPTS[chatRole]?.default || QUICK_PROMPTS.farmer.default;

  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          aria-label="Open Eco Copilot"
          style={{
            width: 56, height: 56,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #059669, #0d9488)',
            border: '2px solid rgba(52,211,153,0.3)',
            color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 8px 32px rgba(5,150,105,0.5)',
            transition: 'transform 0.2s, box-shadow 0.2s',
            animation: 'ecoBounce 3s infinite',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.08)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
        >
          <span style={{ fontSize: 24 }}>🌳</span>
        </button>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Eco Copilot assistant"
          style={{
            position: 'absolute',
            bottom: 68,
            right: 0,
            width: 360,
            height: 500,
            background: '#ffffff',
            border: '1px solid #e6e1d4',
            borderRadius: 20,
            boxShadow: '0 24px 60px rgba(28,40,35,0.18)',
            backdropFilter: 'blur(20px)',
            display: 'flex', flexDirection: 'column',
            overflow: 'hidden',
            animation: 'ecoSlideIn 0.25s ease',
          }}
        >
          {/* Header */}
          <div style={{
            padding: '14px 16px',
            background: 'linear-gradient(135deg, #0f7a54, #0d8a78)',
            borderBottom: '1px solid rgba(255,255,255,0.15)',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{
              width: 34, height: 34, borderRadius: '50%',
              background: 'rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, flexShrink: 0,
            }}>🌳</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: 6 }}>
                {header.title}
                <span style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: '#a7f3d0', display: 'inline-block',
                  animation: 'ecoPing 1.5s infinite',
                }} />
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.82)', marginTop: 1 }}>{header.sub}</div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.7)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                🦅 <span>Local Falcon LLM · UAE AI Sovereignty</span>
              </div>
            </div>
            {messages.length > 0 && (
              <button
                onClick={clearHistory}
                title="Clear chat history"
                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.78)', fontSize: 11, cursor: 'pointer', padding: '2px 6px' }}
              >
                Clear
              </button>
            )}
            <button
              onClick={() => setIsOpen(false)}
              aria-label="Close assistant"
              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.9)', cursor: 'pointer', display: 'flex', padding: 4 }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Message log */}
          <div
            ref={scrollRef}
            role="log"
            aria-live="polite"
            style={{ flex: 1, padding: '12px 14px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}
          >
            {messages.length === 0 && (
              <p style={{ color: '#6b7280', fontSize: 12.5, lineHeight: 1.6, margin: 0 }}>
                Welcome! I'm your {header.title}. Ask me anything about UAE agriculture, eco-tourism, or environmental programmes.
              </p>
            )}
            {messages.map((m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '82%',
                  padding: '9px 13px',
                  borderRadius: m.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                  background: m.role === 'user' ? '#0f7a54' : '#f4f1e9',
                  border: m.role === 'user' ? 'none' : '1px solid #e6e1d4',
                  color: m.role === 'user' ? '#ecfdf5' : '#3c4742',
                  fontSize: 12.5, lineHeight: 1.55,
                }}>
                  {m.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{
                  padding: '9px 13px',
                  borderRadius: '14px 14px 14px 4px',
                  background: '#f4f1e9',
                  border: '1px solid #e6e1d4',
                  display: 'flex', gap: 4, alignItems: 'center',
                }}>
                  {[0, 0.2, 0.4].map((delay, i) => (
                    <span key={i} style={{
                      width: 6, height: 6, borderRadius: '50%',
                      background: '#34d399',
                      display: 'inline-block',
                      animation: `ecoBounce 1s ${delay}s infinite`,
                    }} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Quick prompts — only shown when no messages yet */}
          {messages.length === 0 && !isLoading && (
            <div style={{ padding: '8px 12px', borderTop: '1px solid #e6e1d4', background: '#faf8f2' }}>
              <p style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9aa1ab', fontWeight: 700, margin: '0 0 6px' }}>
                Suggested Questions
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {quickPrompts.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(q)}
                    disabled={isLoading}
                    style={{
                      background: '#ffffff',
                      border: '1px solid #e6e1d4',
                      color: '#3c4742',
                      fontSize: 10, padding: '5px 9px',
                      borderRadius: 8, cursor: 'pointer',
                      textAlign: 'left', lineHeight: 1.4,
                      transition: 'background 0.15s, color 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(15,122,84,0.1)'; e.currentTarget.style.color = '#047857'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.color = '#3c4742'; }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input form */}
          <form
            onSubmit={(e) => { e.preventDefault(); sendMessage(inputValue); }}
            style={{
              padding: '10px 12px',
              borderTop: '1px solid #e6e1d4',
              background: '#ffffff',
              display: 'flex', gap: 8,
            }}
          >
            <input
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              placeholder="Ask about subsidies, tours, permits…"
              disabled={isLoading}
              aria-label="Message the Eco assistant"
              style={{
                flex: 1,
                background: '#faf8f2',
                border: '1px solid #e6e1d4',
                borderRadius: 10, padding: '8px 12px',
                fontSize: 11.5, color: '#16241f',
                outline: 'none',
                transition: 'border-color 0.15s',
              }}
              onFocus={e => { e.target.style.borderColor = '#0f7a54'; }}
              onBlur={e => { e.target.style.borderColor = '#e6e1d4'; }}
            />
            <button
              type="button"
              onClick={handleMicClick}
              disabled={isLoading}
              title="Voice Input (Arabic/English)"
              aria-label="Use microphone for voice input"
              style={{
                background: isTranscribing ? '#ef4444' : '#faf8f2',
                border: '1px solid #e6e1d4',
                borderRadius: 10,
                padding: '8px 10px',
                cursor: 'pointer',
                color: isTranscribing ? '#ffffff' : '#4b5563',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
                animation: isTranscribing ? 'ecoPing 1.2s infinite' : 'none',
              }}
              onMouseEnter={e => {
                if (!isTranscribing) {
                  e.currentTarget.style.background = '#f3f4f6';
                  e.currentTarget.style.borderColor = '#0f7a54';
                }
              }}
              onMouseLeave={e => {
                if (!isTranscribing) {
                  e.currentTarget.style.background = '#faf8f2';
                  e.currentTarget.style.borderColor = '#e6e1d4';
                }
              }}
            >
              <span style={{ fontSize: 13 }}>{isTranscribing ? '🛑' : '🎙️'}</span>
            </button>
            <button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              aria-label="Send message"
              style={{
                background: '#0f7a54',
                border: 'none',
                borderRadius: 10, padding: '8px 12px',
                cursor: 'pointer', color: '#fff',
                display: 'flex', alignItems: 'center',
                transition: 'opacity 0.15s',
                opacity: (isLoading || !inputValue.trim()) ? 0.4 : 1,
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
              </svg>
            </button>
          </form>
        </div>
      )}

      {/* Keyframe animations injected once */}
      <style>{`
        @keyframes ecoBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        @keyframes ecoSlideIn {
          from { opacity: 0; transform: translateY(12px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes ecoPing {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
