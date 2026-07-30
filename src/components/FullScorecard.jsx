import React from 'react';
import { useGolfStore } from '../store/useGolfStore';
import { courseData } from '../lib/courseData';

export default function FullScorecard() {
  const { 
    scores, 
    activeHole, 
    setActiveHole, 
    userHandicap, 
    setUserHandicap 
  } = useGolfStore();
  
  // Generate an array of holes 1-18
  const holes = Array.from({ length: 18 }, (_, i) => i + 1);
  
  let totalStrokes = 0;
  let totalStableford = 0;

  return (
    <div className="bg-slate-800 p-5 rounded-2xl shadow-lg border border-slate-700">
      
      {/* Header & Handicap Input */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-emerald-400">Scorecard</h2>
        <div className="flex items-center gap-2">
          <p className="text-xs text-slate-400 font-bold uppercase">Handicap</p>
          <input 
            type="number" 
            value={userHandicap} 
            onChange={(e) => setUserHandicap(Number(e.target.value))}
            className="w-16 bg-slate-900 p-2 rounded-lg text-white border border-slate-700 text-center text-sm font-bold focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>
      
      {/* Scorecard Table Wrapper */}
      <div className="overflow-x-auto pb-2 custom-scrollbar">
        <div className="flex gap-1 min-w-max">
          
          {/* Left Sticky Column (Labels) */}
          <div className="flex flex-col gap-1 w-16 sticky left-0 bg-slate-800 z-10 pr-2">
            <div className="h-8 flex items-center font-bold text-slate-400 text-[10px] uppercase">
              Hole
            </div>
            <div className="h-6 flex items-center font-bold text-slate-500 text-[10px] uppercase">
              Par / SI
            </div>
            <div className="h-10 flex items-center font-bold text-slate-300 text-sm">
              Score
            </div>
            <div className="h-8 flex items-center font-bold text-sky-400 text-xs">
              Stblfrd
            </div>
          </div>

          {/* Hole Data Columns */}
          {holes.map(h => {
            const data = scores[h];
            const par = courseData[h]?.par || 4;
            const si = courseData[h]?.strokeIndex || 18;
            
            // Stableford & Net Math Calculation
            let pts = '-';
            if (data?.strokes) {
              totalStrokes += data.strokes;
              
              // Calculate strokes received on this specific hole
              const strokesReceived = Math.floor(userHandicap / 18) + (si <= (userHandicap % 18) ? 1 : 0);
              const netScore = data.strokes - strokesReceived;
              
              // Standard Stableford: 2 pts for Net Par, 3 for Birdie, etc.
              pts = Math.max(0, 2 + (par - netScore));
              totalStableford += pts;
            }

            return (
              <div 
                key={h} 
                onClick={() => setActiveHole(h)} 
                className={`flex flex-col gap-1 w-12 text-center cursor-pointer transition-colors ${
                  activeHole === h ? 'ring-2 ring-emerald-500 rounded-lg bg-slate-700/50' : ''
                }`}
              >
                <div className="h-8 flex items-center justify-center font-bold text-slate-400 text-xs">
                  {h}
                </div>
                <div className="h-6 flex items-center justify-center font-bold text-slate-500 text-[9px]">
                  {par} / {si}
                </div>
                <div className={`h-10 flex items-center justify-center font-black text-lg rounded ${
                  data?.strokes ? 'bg-slate-900 text-white' : 'bg-slate-800 text-slate-600 border border-slate-700'
                }`}>
                  {data?.strokes || '-'}
                </div>
                <div className="h-8 flex items-center justify-center font-bold text-sky-400 text-sm bg-slate-900/50 rounded">
                  {pts}
             </div>
              </div>
            );
          })}

          {/* Right Sticky Column (Totals) */}
          <div className="flex flex-col gap-1 w-14 sticky right-0 bg-slate-800 z-10 pl-2 border-l border-slate-700 ml-1">
            <div className="h-8 flex items-center justify-center font-black text-emerald-400 text-[10px] uppercase">
              TOT
            </div>
            <div className="h-6"></div>
            <div className="h-10 flex items-center justify-center font-black text-emerald-400 text-xl">
              {totalStrokes || '-'}
            </div>
            <div className="h-8 flex items-center justify-center font-black text-sky-400 text-sm">
              {totalStableford || '-'}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}