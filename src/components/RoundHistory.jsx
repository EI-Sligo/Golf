import React, { useState } from 'react';
import { useGolfStore } from '../store/useGolfStore';
import { courseData } from '../lib/courseData';

export default function RoundHistory() {
  const { rounds, deleteRound, userHandicap } = useGolfStore();
  const [selectedRound, setSelectedRound] = useState(null);

  const exportToCSV = (round) => {
    if (!round.scorecard) return alert("No detailed hole-by-hole data available for this round.");
    
    const headers = ["Hole", "Par", "Stroke Index", "Gross Score", "Putts", "Net Score", "Stableford Pts", "Accuracy"];
    
    const rows = Object.entries(round.scorecard).map(([hole, data]) => {
      const par = courseData[hole]?.par || 4;
      const si = courseData[hole]?.strokeIndex || 18;
      const rec = Math.floor(userHandicap / 18) + (si <= userHandicap % 18 ? 1 : 0);
      const net = data.strokes ? data.strokes - rec : '-';
      const pts = data.strokes ? Math.max(0, 2 + (par - net)) : '-';
      
      return [hole, par, si, data.strokes || '-', data.putts || '-', net, pts, data.fairway || '-'].join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = `${round.course_name.replace(/\s+/g, '_')}_Analytics.csv`;
    link.click();
  };

  if (selectedRound) {
    let totalPutts = 0;
    let girCount = 0;
    let holesPlayed = 0;

    if (selectedRound.scorecard) {
      Object.entries(selectedRound.scorecard).forEach(([hole, data]) => {
        if (data.strokes) {
          holesPlayed++;
          totalPutts += (data.putts || 0);
          const par = courseData[hole]?.par || 4;
          
          // GIR calculation: Gross Score minus putts <= Par - 2
          if (data.strokes - (data.putts || 0) <= par - 2) {
            girCount++;
          }
        }
      });
    }
    const girPercent = holesPlayed ? Math.round((girCount / holesPlayed) * 100) : 0;

    return (
      <div className="bg-slate-800 p-5 rounded-2xl shadow-lg border border-slate-700">
        <div className="flex justify-between items-center mb-6">
          <button 
            onClick={() => setSelectedRound(null)} 
            className="text-emerald-400 text-sm font-bold hover:text-emerald-300 transition-colors"
          >
            ← Back to Rounds
          </button>
          <button 
            onClick={() => exportToCSV(selectedRound)} 
            className="bg-slate-700 text-white px-3 py-1.5 text-xs font-bold rounded-lg hover:bg-slate-600 transition-colors"
          >
            📥 Export CSV
          </button>
        </div>
        
        <h2 className="text-2xl font-bold text-white">{selectedRound.course_name}</h2>
        <p className="text-slate-400 mb-6">{new Date(selectedRound.created_at).toLocaleDateString()}</p>
        
        {/* Round Analytics Summary Cards */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          <div className="bg-slate-900 p-4 rounded-xl text-center border border-slate-700">
            <p className="text-slate-400 uppercase text-[10px] font-bold mb-1">Score</p>
            <p className="text-3xl font-black text-emerald-400">{selectedRound.total_score}</p>
          </div>
          <div className="bg-slate-900 p-4 rounded-xl text-center border border-slate-700">
            <p className="text-slate-400 uppercase text-[10px] font-bold mb-1">Putts</p>
            <p className="text-3xl font-black text-sky-400">{totalPutts}</p>
          </div>
          <div className="bg-slate-900 p-4 rounded-xl text-center border border-slate-700">
            <p className="text-slate-400 uppercase text-[10px] font-bold mb-1">GIR</p>
            <p className="text-3xl font-black text-purple-400">{girPercent}%</p>
          </div>
        </div>

        {/* Detailed Hole-by-Hole Scorecard */}
        {selectedRound.scorecard && Object.keys(selectedRound.scorecard).length > 0 ? (
          <div className="space-y-2">
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
            <div 
              key={round.id} 
              className="bg-slate-900 p-4 rounded-xl border border-slate-700 flex justify-between items-center cursor-pointer hover:bg-slate-800 transition-colors" 
              onClick={() => setSelectedRound(round)}
            >
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