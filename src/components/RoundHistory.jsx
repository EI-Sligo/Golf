import React from 'react';
import { useGolfStore } from '../store/useGolfStore';

export default function RoundHistory() {
  const { rounds, deleteRound } = useGolfStore();

  if (!rounds || rounds.length === 0) {
    return (
      <div className="bg-slate-800 p-8 rounded-2xl shadow-lg border border-slate-700 text-center my-4">
        <span className="text-4xl block mb-3">🏌️‍♂️</span>
        <h3 className="text-xl font-bold text-emerald-400 mb-2">No Rounds Yet</h3>
        <p className="text-slate-400 text-sm">Play a round and save your scores to see your history here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-10">
      <h2 className="text-2xl font-black text-white px-2">Round History</h2>
      
      {rounds.map((round) => {
        // Safely parse scorecard data
        const scorecard = round.scorecard || {};
        const holesPlayed = Object.keys(scorecard).length;
        
        let totalStrokes = 0;
        let totalPutts = 0;
        
        Object.values(scorecard).forEach(hole => {
          totalStrokes += (hole.strokes || 0);
          totalPutts += (hole.putts || 0);
        });

        // Format Date
        const dateObj = new Date(round.created_at);
        const formattedDate = dateObj.toLocaleDateString('en-US', {
          weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
        });

        return (
          <div key={round.id} className="bg-slate-800 rounded-2xl shadow-lg border border-slate-700 overflow-hidden">
            {/* Card Header */}
            <div className="p-4 border-b border-slate-700 flex justify-between items-start bg-slate-800/50">
              <div>
                <h3 className="text-lg font-bold text-white">{round.course_name || 'Unknown Course'}</h3>
                <p className="text-xs text-slate-400 font-semibold">{formattedDate}</p>
              </div>
              
              <div className="text-right">
                <span className="text-2xl font-black text-emerald-400 leading-none">
                  {totalStrokes > 0 ? totalStrokes : '-'}
                </span>
                <p className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Total</p>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-3 divide-x divide-slate-700 bg-slate-900 border-b border-slate-700">
              <div className="p-3 text-center">
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Holes</p>
                <p className="text-lg font-bold text-white">{holesPlayed}</p>
              </div>
              <div className="p-3 text-center">
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Putts</p>
                <p className="text-lg font-bold text-sky-400">{totalPutts}</p>
              </div>
              <div className="p-3 text-center">
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Status</p>
                <p className={`text-xs font-bold mt-1.5 ${holesPlayed >= 18 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {holesPlayed >= 18 ? 'Complete' : 'Partial'}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="p-3 bg-slate-800 flex justify-end">
              <button 
                onClick={() => {
                  if (window.confirm("Delete this round permanently?")) {
                    deleteRound(round.id);
                  }
                }}
                className="text-xs font-bold text-rose-400 bg-rose-500/10 px-3 py-1.5 rounded-lg border border-rose-500/20 hover:bg-rose-500/20 transition-colors"
              >
                Delete Round
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}