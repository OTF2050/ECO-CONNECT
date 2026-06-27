import React, { useState, useEffect, useRef } from 'react';

// ── Internal team directory (mock data — no backend / WebSockets needed) ─────
const TEAM = [
  { id: 'u1', name: 'Salem Al Hattawi', role: 'Farm Manager', avatar: '🧑‍🌾', online: true,
    seed: 'Salam! Make sure the east drip lines are checked before noon.' },
  { id: 'u2', name: 'Ahmed Khan', role: 'Harvesting', avatar: '👨‍🌾', online: true,
    seed: 'Khalas dates crate #12 is ready for the resort pickup.' },
  { id: 'u3', name: 'Sarah Mathew', role: 'Animal Care', avatar: '👩‍🌾', online: false,
    seed: 'Goats are fed. Box 3 hive looks low on frames.' },
  { id: 'u4', name: 'Ramesh Kumar', role: 'Machine Operation', avatar: '🧑‍🔧', online: true,
    seed: 'Tractor tiller serviced and fuelled for tomorrow.' },
];

// Canned auto-replies to simulate interactivity for the demo
const AUTO_REPLIES = [
  'Got it, on it now 👍',
  'Sure — I will update the task board.',
  'Understood. I will let you know once it is done.',
  'Noted ✅ Heading to the field.',
  'Thanks for the heads up!',
  'Can you share the plot number?',
  'Already started, about 70% complete.',
];

export default function TeamChat() {
  const [activeId, setActiveId] = useState(TEAM[0].id);
  const [drafts, setDrafts] = useState('');
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef(null);

  // One thread per teammate, seeded with an opening message from them
  const [threads, setThreads] = useState(() => {
    const init = {};
    TEAM.forEach((m) => {
      init[m.id] = [{ from: 'them', text: m.seed, time: '08:14' }];
    });
    return init;
  });

  const active = TEAM.find((m) => m.id === activeId);
  const messages = threads[activeId] || [];

  const nowTime = () =>
    new Date().toLocaleTimeString('en-AE', { hour: '2-digit', minute: '2-digit' });

  // Auto-scroll to the latest message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length, typing]);

  const sendMessage = (e) => {
    e.preventDefault();
    const text = drafts.trim();
    if (!text) return;

    const targetId = activeId;
    setThreads((prev) => ({
      ...prev,
      [targetId]: [...(prev[targetId] || []), { from: 'me', text, time: nowTime() }],
    }));
    setDrafts('');
    setTyping(true);

    // Simulate the teammate replying after ~1 second (no real WebSocket)
    setTimeout(() => {
      const reply = AUTO_REPLIES[Math.floor(Math.random() * AUTO_REPLIES.length)];
      setThreads((prev) => ({
        ...prev,
        [targetId]: [...(prev[targetId] || []), { from: 'them', text: reply, time: nowTime() }],
      }));
      setTyping(false);
    }, 1000);
  };

  return (
    <div className="bg-[#111317] border border-zinc-850 rounded-2xl overflow-hidden animate-fadeIn">
      <div className="grid grid-cols-1 sm:grid-cols-[230px_1fr] h-[34rem] max-h-[70vh]">
        {/* ── Sidebar: employee directory ── */}
        <aside className="border-b sm:border-b-0 sm:border-r border-zinc-850 bg-[#0d0f12] flex flex-col">
          <div className="px-4 py-3.5 border-b border-zinc-850">
            <h3 className="text-xs font-bold text-zinc-100 flex items-center gap-2">
              <span>💬</span> Team Chat
            </h3>
            <p className="text-[9px] text-zinc-500 mt-0.5 uppercase tracking-wider font-mono">
              {TEAM.filter((m) => m.online).length} online
            </p>
          </div>
          <div className="flex sm:flex-col overflow-x-auto sm:overflow-y-auto scrollbar-none">
            {TEAM.map((m) => (
              <button
                key={m.id}
                onClick={() => setActiveId(m.id)}
                className={`flex items-center gap-3 px-3.5 py-3 text-left w-full min-w-[180px] sm:min-w-0 transition-all cursor-pointer border-l-2 ${
                  activeId === m.id
                    ? 'bg-zinc-900/60 border-amber-500'
                    : 'border-transparent hover:bg-zinc-900/30'
                }`}
              >
                <div className="relative shrink-0">
                  <span className="w-9 h-9 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-base">
                    {m.avatar}
                  </span>
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#0d0f12] ${
                      m.online ? 'bg-emerald-500' : 'bg-zinc-600'
                    }`}
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-zinc-200 truncate">{m.name}</p>
                  <p className="text-[9px] text-zinc-500 truncate">{m.role}</p>
                </div>
              </button>
            ))}
          </div>
        </aside>

        {/* ── Main chat window ── */}
        <section className="flex flex-col bg-[#0a0c10] min-w-0">
          {/* Header */}
          <header className="px-4 py-3 border-b border-zinc-850 flex items-center gap-3 bg-[#0d0f12]">
            <span className="w-9 h-9 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-base shrink-0">
              {active?.avatar}
            </span>
            <div className="min-w-0">
              <p className="text-xs font-bold text-zinc-100 truncate">{active?.name}</p>
              <p className="text-[9px] text-zinc-500">
                {active?.online ? (
                  <span className="text-emerald-400">● Active now</span>
                ) : (
                  'Offline'
                )}{' '}
                · {active?.role}
              </p>
            </div>
          </header>

          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-none"
            style={{
              backgroundImage:
                'radial-gradient(circle at 20% 20%, rgba(194,161,78,0.04), transparent 40%)',
            }}
          >
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.from === 'me' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[78%] px-3.5 py-2 rounded-2xl text-xs leading-relaxed ${
                    msg.from === 'me'
                      ? 'bg-gradient-to-br from-emerald-600 to-emerald-700 text-white rounded-br-sm'
                      : 'bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-bl-sm'
                  }`}
                >
                  <p>{msg.text}</p>
                  <p
                    className={`text-[8.5px] mt-1 font-mono ${
                      msg.from === 'me' ? 'text-emerald-100/70 text-right' : 'text-zinc-500'
                    }`}
                  >
                    {msg.time}
                  </p>
                </div>
              </div>
            ))}

            {typing && (
              <div className="flex justify-start">
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl rounded-bl-sm px-3.5 py-2.5 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" />
                </div>
              </div>
            )}
          </div>

          {/* Composer */}
          <form
            onSubmit={sendMessage}
            className="p-3 border-t border-zinc-850 bg-[#0d0f12] flex items-center gap-2"
          >
            <input
              value={drafts}
              onChange={(e) => setDrafts(e.target.value)}
              placeholder={`Message ${active?.name?.split(' ')[0] || ''}…`}
              className="flex-1 bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-xs text-zinc-200 outline-none transition-all placeholder:text-zinc-600"
            />
            <button
              type="submit"
              disabled={!drafts.trim()}
              className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:brightness-110 text-white font-bold px-4 py-2.5 rounded-xl text-xs uppercase cursor-pointer transition-all shadow-md disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            >
              Send ➤
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
