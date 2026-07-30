import React from 'react';
import { useGolfStore } from '../store/useGolfStore';

export default function HeroDistanceCard() {
  const { activeHole, setActiveHole, setScoreModalOpen, finishRound } = useGolfStore();

  return (
    <div className="bg-slate-800 p-5 rounded-2xl shadow-lg border border-slate-700 flex justify-between items-center">
      {/* Previous Hole */}
      <button 
        onClick={() => setActiveHole(Math.max(1, activeHole - 1))}
        className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center text-white font-bold hover:bg-slate-600 transition-colors"
      >
        &#8592;
      </button>

      {/* Center Info */}
      <div className="text-center flex flex-col items-center">
        <p className="text-slate-400 uppercase tracking-widest text-xs font-bold mb-1">Hole</p>
        <h2 className="text-5xl font-black text-emerald-400 leading-none">{activeHole}</h2>
        
        <div className="flex gap-2 mt-4">
          <button 
            onClick={() => setScoreModalOpen(true)}
            className="px-4 py-1.5 bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 text-sm font-bold rounded-lg hover:bg-emerald-500/30 transition-colors"
          >
            📝 Log Score
          </button>
          <button 
            onClick={() => {
              if (window.confirm("Are you sure you want to end this round?")) {
                finishRound();
              }
            }}
            className="px-4 py-1.5 bg-red-500/20 border border-red-500/50 text-red-400 text-sm font-bold rounded-lg hover:bg-red-500/30 transition-colors"
          >
            🛑 End Round
          </button>
        </div>
      </div>

      {/* Next Hole */}
      <button 
        onClick={() => setActiveHole(Math.min(18, activeHole + 1))}
        className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center text-white font-bold hover:bg-slate-600 transition-colors"
      >
        &#8594;
      </button>
    </div>
  );
}