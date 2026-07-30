import React, { useState } from 'react';

export default function SwingThoughtsRules() {
  const [thoughts, setThoughts] = useState(localStorage.getItem('swing_thoughts') || '');

  const handleSaveThoughts = (e) => {
    setThoughts(e.target.value);
    localStorage.setItem('swing_thoughts', e.target.value);
  };

  return (
    <div className="space-y-6">
      {/* Swing Thoughts */}
      <div className="bg-slate-800 p-5 rounded-2xl shadow-lg border border-slate-700">
        <h2 className="text-xl font-bold text-emerald-400 mb-4">My Swing Thoughts</h2>
        <textarea
          value={thoughts}
          onChange={handleSaveThoughts}
          placeholder="Keep the left arm straight, smooth tempo..."
          className="w-full bg-slate-900 p-4 rounded-xl text-white border border-slate-700 focus:border-emerald-500 focus:outline-none min-h-[120px]"
        />
      </div>

      {/* Rules Reference */}
      <div className="bg-slate-800 p-5 rounded-2xl shadow-lg border border-slate-700">
        <h2 className="text-xl font-bold text-emerald-400 mb-4">Quick Rules Reference</h2>
        
        <div className="space-y-4">
          <div className="bg-slate-900 p-4 rounded-xl border border-slate-700">
            <h3 className="font-bold text-white mb-1">Out of Bounds (White Stakes)</h3>
            <p className="text-sm text-slate-400">Add 1 penalty stroke. Replay the shot from the original spot (Stroke and Distance).</p>
          </div>
          
          <div className="bg-slate-900 p-4 rounded-xl border border-slate-700">
            <h3 className="font-bold text-white mb-1">Penalty Area (Red/Yellow Stakes)</h3>
            <p className="text-sm text-slate-400">Add 1 penalty stroke. Drop within 2 club lengths of where it crossed the margin (Red), or keep the entry point between you and the hole and drop back as far as you want (Yellow).</p>
          </div>

          <div className="bg-slate-900 p-4 rounded-xl border border-slate-700">
            <h3 className="font-bold text-white mb-1">Unplayable Lie</h3>
            <p className="text-sm text-slate-400">Add 1 penalty stroke. Drop within 2 club lengths (no closer to hole), keep the spot between you and the hole and go back, or replay from previous spot.</p>
          </div>
        </div>
      </div>
    </div>
  );
}