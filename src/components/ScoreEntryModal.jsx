import React, { useState, useEffect } from 'react';
import { useGolfStore } from '../store/useGolfStore';
import { Check, Minus, Plus, X } from 'lucide-react';

export default function ScoreEntryModal({ isOpen, onClose }) {
  const { activeHole, scores, setScore } = useGolfStore();
  
  // Default to Par 4 logic, or load existing score if you are editing it
  const [strokes, setStrokes] = useState(4);
  const [putts, setPutts] = useState(2);

  // When the modal opens, reset the counters to whatever was saved, or defaults
  useEffect(() => {
    if (isOpen) {
      setStrokes(scores[activeHole]?.strokes || 4);
      setPutts(scores[activeHole]?.putts || 2);
    }
  }, [isOpen, activeHole, scores]);

  if (!isOpen) return null;

  const handleSave = () => {
    setScore(activeHole, strokes, putts);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-8 duration-300 mb-4">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-black text-white">Score Hole {activeHole}</h2>
            <p className="text-emerald-400 font-bold text-sm">Par 4</p>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Total Strokes Adjuster */}
        <div className="mb-6 bg-slate-950 p-4 rounded-2xl border border-slate-800">
          <p className="text-center text-xs font-bold uppercase text-slate-400 mb-3">Total Strokes</p>
          <div className="flex items-center justify-between">
            <button 
              onClick={() => setStrokes(Math.max(1, strokes - 1))}
              className="w-14 h-14 bg-slate-800 rounded-xl flex items-center justify-center text-rose-400 active:scale-95"
            >
              <Minus className="w-6 h-6 stroke-[3]" />
            </button>
            <span className="text-5xl font-black text-white">{strokes}</span>
            <button 
              onClick={() => setStrokes(strokes + 1)}
              className="w-14 h-14 bg-slate-800 rounded-xl flex items-center justify-center text-sky-400 active:scale-95"
            >
              <Plus className="w-6 h-6 stroke-[3]" />
            </button>
          </div>
        </div>

        {/* Putts Adjuster */}
        <div className="mb-8 bg-slate-950 p-4 rounded-2xl border border-slate-800">
          <p className="text-center text-xs font-bold uppercase text-slate-400 mb-3">Putts</p>
          <div className="flex items-center justify-between">
            <button 
              onClick={() => setPutts(Math.max(0, putts - 1))}
              className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center text-rose-400 active:scale-95"
            >
              <Minus className="w-5 h-5 stroke-[3]" />
            </button>
            <span className="text-3xl font-black text-white">{putts}</span>
            <button 
              onClick={() => setPutts(putts + 1)}
              className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center text-sky-400 active:scale-95"
            >
              <Plus className="w-5 h-5 stroke-[3]" />
            </button>
          </div>
        </div>

        {/* Save Button */}
        <button 
          onClick={handleSave}
          className="w-full py-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-slate-950 font-black text-lg shadow-lg flex items-center justify-center gap-2 transition-all"
        >
          <Check className="w-6 h-6 stroke-[3]" />
          Save Score
        </button>
      </div>
    </div>
  );
}
