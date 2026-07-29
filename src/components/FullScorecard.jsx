import React, { useState } from 'react';
import { X, Flag, CheckCircle2 } from 'lucide-react';
import { useGolfStore } from '../store/useGolfStore';
import { castleDargan } from '../data/castleDargan';
import { supabase } from '../lib/supabase';

export default function FullScorecard({ isOpen, onClose }) {
  const { scores, currentRoundId, clearRound } = useGolfStore();
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  let totalStrokes = 0;
  let totalParPlayed = 0;
  let holesPlayed = 0;

  Object.keys(scores).forEach(holeNum => {
    const strokes = scores[holeNum]?.strokes;
    if (strokes) {
      totalStrokes += strokes;
      holesPlayed++;
      const holeData = castleDargan.find(h => h.hole === parseInt(holeNum));
      if (holeData) totalParPlayed += holeData.par;
    }
  });

  const relativeToPar = totalStrokes - totalParPlayed;
  const parDisplay = relativeToPar > 0 ? `+${relativeToPar}` : relativeToPar === 0 ? 'E' : relativeToPar;

  // Finalize and save the round (works for 5 holes, 9 holes, or 18!)
  const handleFinishRound = async () => {
    if (holesPlayed === 0) {
      alert("No scores entered yet!");
      return;
    }
    
    if (!window.confirm(`Finish round after ${holesPlayed} holes? This will save your score to history.`)) return;

    setSaving(true);
    try {
      if (currentRoundId) {
        const { error } = await supabase
          .from('rounds')
          .update({
            total_score: totalStrokes,
            to_par: relativeToPar
          })
          .eq('id', currentRoundId);

        if (error) throw error;
      }

      alert(`Round saved successfully! Total: ${totalStrokes} (${parDisplay}) over ${holesPlayed} holes.`);
      clearRound();
      onClose();
    } catch (err) {
      alert("Error saving round: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] bg-slate-950 flex flex-col animate-in slide-in-from-bottom-full duration-300">
      
      <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900">
        <div>
          <h2 className="text-xl font-black text-white">Scorecard</h2>
          <p className="text-emerald-400 font-bold text-xs uppercase tracking-wider">Castle Dargan ({holesPlayed} Holes Played)</p>
        </div>
        <button onClick={onClose} className="p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="bg-slate-900 p-4 border-b border-slate-800 flex justify-around">
        <div className="text-center">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Strokes</p>
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

      <div className="flex-1 overflow-y-auto p-4 pb-32 space-y-4">
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

        {/* Finish & Save Partial Round Button */}
        {currentRoundId && holesPlayed > 0 && (
          <button 
            onClick={handleFinishRound}
            disabled={saving}
            className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-2xl text-base flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
          >
            <CheckCircle2 className="w-5 h-5" />
            {saving ? "Saving Round..." : `Finish & Save (${holesPlayed} Holes)`}
          </button>
        )}
      </div>
    </div>
  );
}