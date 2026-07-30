import React, { useState } from 'react';
import { useGolfStore } from '../store/useGolfStore';

export default function RoundHistory() {
  const { rounds, deleteRound } = useGolfStore();
  const [selectedRound, setSelectedRound] = useState(null);

  if (selectedRound) {
    return (
      <div className="bg-slate-800 p-5 rounded-2xl shadow-lg border border-slate-700">
        <button onClick={() => setSelectedRound(null)} className="text-emerald-400 text-sm font-bold mb-4 hover:text-emerald-300 transition-colors">← Back to Rounds</button>
        <h2 className="text-2xl font-bold text-white">{selectedRound.course_name}</h2>
        <p className="text-slate-400 mb-6">{new Date(selectedRound.created_at).toLocaleDateString()}</p>
        
        <div className="bg-slate-900 p-6 rounded-xl text-center border border-slate-700">
          <p className="text-slate-400 uppercase tracking-widest text-sm font-bold mb-2">Total Score</p>
          <p className="text-5xl font-black text-emerald-400">{selectedRound.total_score}</p>
        </div>

        {/* Detailed Hole-by-Hole Scorecard */}
        {selectedRound.scorecard && Object.keys(selectedRound.scorecard).length > 0 ? (
          <div className="mt-6 space-y-2">
            <h3 className="text-emerald-400 font-bold mb-3 uppercase tracking-wider text-sm">Hole-by-Hole</h3>
            <div className="bg-slate-900 rounded-xl border border-slate-700 overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-800 text-slate-400">
                  <tr>
                    <th className="p-3">Hole</th>
                    <th className="p-3 text-center">Score</th>
                    <th className="p-3 text-center">Putts</th>
                    <th className="p-3 text-right">Accuracy</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {Object.entries(selectedRound.scorecard).map(([hole, data]) => (
                    <tr key={hole}>
                      <td className="p-3 font-bold text-white">{hole}</td>
                      <td className="p-3 text-center font-bold text-emerald-400">{data.strokes || '-'}</td>
                      <td className="p-3 text-center text-slate-300">{data.putts !== undefined ? data.putts : '-'}</td>
                      <td className="p-3 text-right text-slate-300 text-[10px] uppercase font-bold tracking-wide">{data.fairway || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <p className="text-slate-500 text-sm mt-6 text-center italic">No hole-by-hole data saved for this round.</p>
        )}
      </div>
    );
  }

  return (
    <div className="bg-slate-800 p-5 rounded-2xl shadow-lg border border-slate-700">
      <h2 className="text-xl font-bold text-emerald-400 mb-6">Round History</h2>

      {rounds.length === 0 ? (
        <p className="text-center text-slate-400 py-10">No rounds played yet.</p>
      ) : (
        <div className="space-y-3">
          {rounds.map((round) => (
            <div key={round.id} className="bg-slate-900 p-4 rounded-xl border border-slate-700 flex justify-between items-center cursor-pointer hover:bg-slate-800 transition-colors" onClick={() => setSelectedRound(round)}>
              <div>
                <p className="font-bold text-white text-lg">{round.course_name}</p>
                <p className="text-xs text-slate-400">{new Date(round.created_at).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">Score</p>
                  <p className="text-emerald-400 font-black text-xl">{round.total_score || '--'}</p>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); deleteRound(round.id); }} 
                  className="text-red-400 hover:text-red-300 font-bold text-xl px-2"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}