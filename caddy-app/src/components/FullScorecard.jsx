import React from 'react';
import { X, Flag } from 'lucide-react';
import { useGolfStore } from '../store/useGolfStore';
import { castleDargan } from '../data/castleDargan';

export default function FullScorecard({ isOpen, onClose }) {
  const { scores } = useGolfStore();

  if (!isOpen) return null;

  // Calculate Totals vs Par
  let totalStrokes = 0;
  let totalParPlayed = 0;

  Object.keys(scores).forEach(holeNum => {
    const strokes = scores[holeNum]?.strokes;
    if (strokes) {
      totalStrokes += strokes;
      const holeData = castleDargan.find(h => h.hole === parseInt(holeNum));
      if (holeData) totalParPlayed += holeData.par;
    }
  });

  const relativeToPar = totalStrokes - totalParPlayed;
  const parDisplay = relativeToPar > 0 ? `+${relativeToPar}` : relativeToPar === 0 ? 'E' : relativeToPar;

  return (
    <div className="fixed inset-0 z-[80] bg-slate-950 flex flex-col animate-in slide-in-from-bottom-full duration-300">
      
      <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900">
        <div>
          <h2 className="text-xl font-black text-white">Scorecard</h2>
          <p className="text-emerald-400 font-bold text-xs uppercase tracking-wider">Castle Dargan</p>
        </div>
        <button onClick={onClose} className="p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* NEW: Total Score vs Par Header */}
      <div className="bg-slate-900 p-4 border-b border-slate-800 flex justify-around">
        <div className="text-center">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Strokes</p>
          <p className="text-3xl font-black text-white">{totalStrokes > 0 ? totalStrokes : '--'}</p>
        </div>
        <div className="w-px bg-slate-800"></div>
        <div className="text-center">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">To Par</p>
          <p className={`text-3xl font-black ${relativeToPar > 0 ? 'text-rose-400' : relativeToPar < 0 ? 'text-emerald-400' : 'text-slate-300'}`}>
            {totalStrokes > 0 ? parDisplay : '--'}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-24">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-800/50 text-slate-400 text-xs uppercase font-bold">
              <tr>
                <th className="px-4 py-3">Hole</th>
                <th className="px-4 py-3 text-center">Par</th>
                <th className="px-4 py-3 text-center">Strokes</th>
                <th className="px-4 py-3 text-center">Putts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {castleDargan.map((hole) => {
                const holeScore = scores[hole.hole];
                const strokes = holeScore?.strokes || '-';
                const putts = holeScore?.putts || '-';
                
                // Color code the score
                let scoreColor = "text-slate-300";
                if (holeScore) {
                  if (strokes < hole.par) scoreColor = "text-emerald-400 font-black";
                  else if (strokes > hole.par) scoreColor = "text-rose-400 font-bold";
                }

                return (
                  <tr key={hole.hole} className="hover:bg-slate-800/20 transition-colors">
                    <td className="px-4 py-3 font-bold text-white flex items-center gap-2">
                      <Flag className="w-3 h-3 text-slate-500" /> {hole.hole}
                    </td>
                    <td className="px-4 py-3 text-center text-slate-400">{hole.par}</td>
                    <td className={`px-4 py-3 text-center ${scoreColor}`}>{strokes}</td>
                    <td className="px-4 py-3 text-center text-slate-400">{putts}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}