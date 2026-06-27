import React, { useState } from 'react';

// Employees a task can be assigned to (mock roster — no backend needed)
const EMPLOYEES = ['Ahmed Khan', 'Sarah Mathew', 'Ramesh Kumar', 'Salem Al Hattawi'];

const COLUMNS = [
  { id: 'todo', label: 'To Do', dot: 'bg-rose-500', tint: 'border-rose-500/20' },
  { id: 'progress', label: 'In Progress', dot: 'bg-amber-500', tint: 'border-amber-500/20' },
  { id: 'done', label: 'Completed', dot: 'bg-emerald-500', tint: 'border-emerald-500/20' },
];

// Flow of columns so cards can move forward / backward
const NEXT = { todo: 'progress', progress: 'done' };
const PREV = { done: 'progress', progress: 'todo' };
const NEXT_LABEL = { todo: 'Start ▶', progress: 'Complete ✓' };

let uid = 100;

export default function TaskManager() {
  const [tasks, setTasks] = useState([
    { id: 1, title: 'Irrigate east date palm sector', assignee: 'Ramesh Kumar', due: '2026-06-28', col: 'todo' },
    { id: 2, title: 'Inspect bee colonies (boxes 1–10)', assignee: 'Sarah Mathew', due: '2026-06-27', col: 'progress' },
    { id: 3, title: 'Sort & pack Khalas dates for resort order', assignee: 'Ahmed Khan', due: '2026-06-27', col: 'progress' },
    { id: 4, title: 'Service tractor rotary tiller', assignee: 'Ramesh Kumar', due: '2026-06-26', col: 'done' },
  ]);

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ title: '', assignee: EMPLOYEES[0], due: '' });

  const moveTask = (id, dir) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const target = dir === 'next' ? NEXT[t.col] : PREV[t.col];
        return target ? { ...t, col: target } : t;
      })
    );
  };

  const deleteTask = (id) => setTasks((prev) => prev.filter((t) => t.id !== id));

  const addTask = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setTasks((prev) => [
      ...prev,
      { id: ++uid, title: form.title.trim(), assignee: form.assignee, due: form.due || 'No due date', col: 'todo' },
    ]);
    setForm({ title: '', assignee: EMPLOYEES[0], due: '' });
    setModalOpen(false);
  };

  const initials = (n) => n.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="space-y-4 animate-fadeIn text-left">
      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
            <span>🗂️</span> Task Board
          </h3>
          <p className="text-[10px] text-zinc-500 mt-0.5">Assign and track field operations across the team.</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="bg-gradient-to-r from-amber-600 to-yellow-600 hover:brightness-110 text-white font-bold px-4 py-2.5 rounded-xl text-xs uppercase cursor-pointer transition-all shadow-md"
        >
          ＋ Assign Task
        </button>
      </div>

      {/* Kanban columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {COLUMNS.map((col) => {
          const colTasks = tasks.filter((t) => t.col === col.id);
          return (
            <div key={col.id} className={`bg-[#0d0f12] border ${col.tint} rounded-2xl p-3 flex flex-col`}>
              <div className="flex items-center justify-between px-1 pb-3 mb-1 border-b border-zinc-850">
                <span className="flex items-center gap-2 text-xs font-bold text-zinc-200 uppercase tracking-wide">
                  <span className={`w-2 h-2 rounded-full ${col.dot}`} /> {col.label}
                </span>
                <span className="text-[10px] font-mono text-zinc-500 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded-full">
                  {colTasks.length}
                </span>
              </div>

              <div className="space-y-2.5 min-h-[6rem]">
                {colTasks.length === 0 && (
                  <p className="text-[10px] text-zinc-600 text-center py-6 italic">No tasks here.</p>
                )}

                {colTasks.map((t) => (
                  <div
                    key={t.id}
                    className="bg-[#15181d] border border-zinc-800 rounded-xl p-3 space-y-2.5 group hover:border-zinc-700 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-xs font-semibold leading-snug ${t.col === 'done' ? 'text-zinc-500 line-through' : 'text-zinc-200'}`}>
                        {t.title}
                      </p>
                      <button
                        onClick={() => deleteTask(t.id)}
                        title="Remove task"
                        className="text-zinc-600 hover:text-rose-400 text-xs opacity-0 group-hover:opacity-100 transition-all cursor-pointer shrink-0"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-[9px] text-zinc-500 font-mono">
                      <span className="flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-emerald-900/40 border border-emerald-500/30 text-emerald-300 flex items-center justify-center text-[8px] font-bold">
                          {initials(t.assignee)}
                        </span>
                        {t.assignee.split(' ')[0]}
                      </span>
                      <span>📅 {t.due}</span>
                    </div>

                    <div className="flex gap-2 pt-1">
                      {PREV[t.col] && (
                        <button
                          onClick={() => moveTask(t.id, 'prev')}
                          className="flex-1 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 text-[9px] font-bold py-1.5 rounded-lg uppercase cursor-pointer transition-all"
                        >
                          ◀ Back
                        </button>
                      )}
                      {NEXT[t.col] && (
                        <button
                          onClick={() => moveTask(t.id, 'next')}
                          className="flex-1 bg-zinc-800 hover:bg-emerald-700 text-zinc-200 hover:text-white text-[9px] font-bold py-1.5 rounded-lg uppercase cursor-pointer transition-all"
                        >
                          {NEXT_LABEL[t.col]}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Assign Task modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setModalOpen(false)}
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={addTask}
            className="bg-[#111317] border border-zinc-800 rounded-2xl p-6 w-full max-w-sm space-y-4 text-left shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-zinc-100">Assign New Task</h3>
              <button type="button" onClick={() => setModalOpen(false)} className="text-zinc-500 hover:text-zinc-300 cursor-pointer">✕</button>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] uppercase font-bold text-zinc-550 tracking-wider">Task Title *</label>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Harvest greenhouse tomatoes"
                autoFocus
                className="bg-zinc-950 border border-zinc-850 focus:border-amber-500 rounded-xl p-3 text-xs text-zinc-200 outline-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] uppercase font-bold text-zinc-550 tracking-wider">Assign To</label>
              <select
                value={form.assignee}
                onChange={(e) => setForm({ ...form, assignee: e.target.value })}
                className="bg-zinc-950 border border-zinc-850 focus:border-amber-500 rounded-xl p-3 text-xs text-zinc-200 outline-none"
              >
                {EMPLOYEES.map((emp) => (
                  <option key={emp} value={emp}>{emp}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] uppercase font-bold text-zinc-550 tracking-wider">Due Date</label>
              <input
                type="date"
                value={form.due}
                onChange={(e) => setForm({ ...form, due: e.target.value })}
                className="bg-zinc-950 border border-zinc-850 focus:border-amber-500 rounded-xl p-3 text-xs text-zinc-300 outline-none"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="flex-1 border border-zinc-850 text-zinc-400 text-xs font-bold py-2.5 rounded-xl hover:bg-zinc-900/40 uppercase cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 bg-gradient-to-r from-amber-600 to-yellow-600 hover:brightness-110 text-white text-xs font-bold py-2.5 rounded-xl uppercase cursor-pointer transition-all shadow-md"
              >
                Create Task
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
