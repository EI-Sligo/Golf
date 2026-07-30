import React from 'react';
import { useGolfStore } from '../store/useGolfStore';

export default function FullScorecard() {
  const { scores, activeHole, setActiveHole } = useGolfStore();
  const holes = Array.from({ length: 18 }, (_, i) => i + 1);
  
  let totalStrokes = 0;
  let totalPutts = 0;

  return (
    <div className="bg-slate-800 p-5 rounded-2xl shadow-lg border border-slate-700">
      <h2 className="text-xl font-bold text-emerald-400 mb-4">Scorecard</h2>
      
      <div className="overflow-x-auto pb-2 custom-scrollbar">
        <div className="flex gap-1 min-w-max">
          
          {/* Row Labels */}
          <div className="flex flex-col gap-1 w-16 sticky left-0 bg-slate-800 z-10 pr-2">
            <div className="h-8 flex items-center font-bold text-slate-400 text-xs uppercase">Hole</div>
            <div className="h-10 flex items-center font-bold text-slate-300 text-sm">Score</div>
            <div className="h-8 flex items-center font-bold text-slate-400 text-xs">Putts</div>
          </div>

          {/* 18 Holes */}
          {holes.map(h => {
            const s = scores[h]?.strokes;
            const p = scores[h]?.putts;
            if (s) totalStrokes += s;
            if (p) totalPutts += p;

            return (
              <div 
                key={h} 
                onClick={() => setActiveHole(h)}
                className={`flex flex-col gap-1 w-10 text-center cursor-pointer transition-colors ${activeHole === h ? 'ring-2 ring-emerald-500 rounded-lg bg-slate-700/50' : ''}`}
              >
                <div className="h-8 flex items-center justify-center font-bold text-slate-400 text-xs">{h}</div>
                <div className={`h-10 flex items-center justify-center font-black text-lg rounded ${s ? 'bg-slate-900 text-white' : 'bg-slate-800 text-slate-600 border border-slate-700'}`}>
                  {s || '-'}
                </div>
                <div className="h-8 flex items-center justify-center font-bold text-slate-400 text-xs bg-slate-900/50 rounded">
                  {p !== undefined ? p : '-'}
                </div>
              </div>
            );
          })}

          {/* Totals */}
          <div className="flex flex-col gap-1 w-14 sticky right-0 bg-slate-800 z-10 pl-2 border-l border-slate-700 ml-1">
            <div className="h-8 flex items-center justify-center font-black text-emerald-400 text-xs uppercase">TOT</div>
            <div className="h-10 flex items-center justify-center font-black text-emerald-400 text-xl">{totalStrokes || '-'}</div>
            <div className="h-8 flex items-center justify-center font-bold text-emerald-400 text-sm">{totalPutts || '-'}</div>
          </div>

        </div>
      </div>
    </div>
  );
}