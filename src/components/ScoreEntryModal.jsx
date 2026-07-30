import React, { useState, useEffect } from 'react';
import { useGolfStore } from '../store/useGolfStore';

const ACCURACY_OPTIONS = [
  'Very Left', 'Left', 'Fairway', 'Right', 'Very Right', 'Fairway Bunker', 'Greenside Bunker'
];

export default function ScoreEntryModal() {
  const { activeHole, scores, setScore, isScoreModalOpen, setScoreModalOpen } = useGolfStore();

  const existingScore = scores[activeHole] || { strokes: 4, putts: 2, fairway: 'Fairway' };

  const [strokes, setStrokes] = useState(existingScore.strokes);
  const [putts, setPutts] = useState(existingScore.putts);
  const [fairway, setFairway] = useState(existingScore.fairway);

  // Sync state if the user changes holes while the modal is closed
  useEffect(() => {
    setStrokes(existingScore.strokes);
    setPutts(existingScore.putts);
    setFairway(existingScore.fairway);
  }, [activeHole, isScoreModalOpen]);

  if (!isScoreModalOpen) return null;

  const handleSave = () => {
    setScore(activeHole, strokes, putts, fairway);
    setScoreModalOpen(false);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 z-[1000] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-slate-800 p-6 rounded-2xl shadow-2xl border border-slate-700 w-full max-w-sm">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-black text-emerald-400">Hole {activeHole}</h2>
          <button onClick={() => setScoreModalOpen(false)} className="text-slate-400 hover:text-white text-2xl font-bold">&times;</button>
        </div>

        {/* Strokes */}
        <div className="mb-6 bg-slate-900 p-4 rounded-xl border border-slate-700">
          <p className="text-slate-400 font-bold mb-3 text-center text-sm uppercase tracking-wider">Total Strokes</p>
          <div className="flex justify-between items-center px-4">
            <button onClick={() => setStrokes(Math.max(1, strokes - 1))} className="w-12 h-12 bg-slate-700 rounded-full text-2xl font-bold text-white hover:bg-slate-600 transition-colors">-</button>
            <span className="text-5xl font-black text-white">{strokes}</span>
            <button onClick={() => setStrokes(strokes + 1)} className="w-12 h-12 bg-emerald-500 rounded-full text-2xl font-bold text-slate-900 hover:bg-emerald-400 transition-colors">+</button>
          </div>
        </div>

        {/* Putts */}
        <div className="mb-6 bg-slate-900 p-4 rounded-xl border border-slate-700">
          <p className="text-slate-400 font-bold mb-3 text-center text-sm uppercase tracking-wider">Putts</p>
          <div className="flex justify-between items-center px-4">
            <button onClick={() => setPutts(Math.max(0, putts - 1))} className="w-12 h-12 bg-slate-700 rounded-full text-2xl font-bold text-white hover:bg-slate-600 transition-colors">-</button>
            <span className="text-4xl font-black text-white">{putts}</span>
            <button onClick={() => setPutts(putts + 1)} className="w-12 h-12 bg-emerald-500 rounded-full text-2xl font-bold text-slate-900 hover:bg-emerald-400 transition-colors">+</button>
          </div>
        </div>

        {/* Fairway Hit */}
        <div className="mb-6">
          <p className="text-slate-400 font-bold mb-3 text-center text-sm uppercase tracking-wider">Shot Accuracy</p>
          <div className="flex flex-wrap justify-center gap-2">
            {ACCURACY_OPTIONS.map(dir => (
              <button
                key={dir}
                onClick={() => setFairway(dir)}
                className={`px-3 py-2 rounded-lg font-bold text-xs transition-colors flex-grow text-center ${fairway === dir ? 'bg-emerald-500 text-slate-900' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
              >
                {dir}
              </button>
            ))}
          </div>
        </div>

        <button onClick={handleSave} className="w-full bg-emerald-500 text-slate-900 font-black py-4 rounded-xl text-lg hover:bg-emerald-400 transition-colors">
          Save Score
        </button>
      </div>
    </div>
  );
}