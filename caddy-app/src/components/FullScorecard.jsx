import React, { useState } from 'react';
import { useGolfStore } from '../store/useGolfStore';
import { supabase } from '../lib/supabase';
import { X, Trophy } from 'lucide-react';

export default function FullScorecard({ isOpen, onClose }) {
  const { scores, resetRound } = useGolfStore();
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const holes = Array.from({ length: 18 }, (_, i) => i + 1);
  const getScore = (hole) => scores[hole]?.strokes || '-';
  const getPutts = (hole) => scores[hole]?.putts || '-';

  const calculateTotal = (start, end) => {
    let total = 0;
    for (let i = start; i <= end; i++) {
      if (scores[i]?.strokes) total += scores[i].strokes;
    }
    return total || '-';
  };

  const front9 = calculateTotal(1, 9);
  const back9 = calculateTotal(10, 18);
  const totalScore = calculateTotal(1, 18);

  const handleFinishRound = async () => {
    // Prevent saving an empty scorecard
    if (totalScore === '-') {
      alert("You haven't logged any scores yet!");
      return;
    }

    setIsSaving(true);
    try {
      // 1. Get the current logged-in user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("Could not authenticate user.");

      // 2. Push the round data to Supabase
      const { error: dbError } = await supabase
        .from('rounds')
        .insert([{
          user_id: user.id,
          course_name: 'Castle Dargan',
          total_score: totalScore === '-' ? null : totalScore,
          front_9: front9 === '-' ? null : front9,
          back_9: back9 === '-' ? null : back9,
          score_data: scores // Saves the full JSON object of individual hole scores
        }]);

      if (dbError) throw dbError;

      alert(`Round Saved! Great shooting. Final Score: ${totalScore}`);
      
      // 3. Clean up the UI
      resetRound();
      onClose();

    } catch (error) {
      console.error("Error saving round:", error.message);
      alert("Failed to save round. Check the console.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-slate-950 flex flex-col animate-in slide-in-from-bottom-full duration-300">
      
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900">
        <div>
          <h2 className="text-xl font-black text-white">Scorecard</h2>
          <p className="text-emerald-400 font-bold text-xs uppercase tracking-wider">Castle Dargan</p>
        </div>
        <button onClick={onClose} className="p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Scrollable Score Grid */}
      <div className="flex-1 overflow-y-auto p-4 pb-32">
        
        {/* Front 9 */}
        <div className="mb-6 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
          <div className="bg-slate-800 p-2 text-center text-xs font-black uppercase text-slate-300">Front 9</div>
          <div className="grid grid-cols-10 border-b border-slate-800 text-xs font-bold text-slate-400 text-center">
            <div className="p-2 border-r border-slate-800 flex items-center justify-center">H</div>
            {holes.slice(0, 9).map(h => <div key={h} className="p-2">{h}</div>)}
          </div>
          <div className="grid grid-cols-10 border-b border-slate-800 text-sm font-black text-white text-center bg-slate-900/50">
            <div className="p-2 border-r border-slate-800 text-slate-400 text-xs flex items-center justify-center">S</div>
            {holes.slice(0, 9).map(h => (
              <div key={`score-${h}`} className={`p-2 ${scores[h] ? 'text-emerald-400' : ''}`}>{getScore(h)}</div>
            ))}
          </div>
          <div className="grid grid-cols-10 text-xs font-semibold text-slate-400 text-center bg-slate-900/30">
            <div className="p-2 border-r border-slate-800 text-[10px] flex items-center justify-center">P</div>
            {holes.slice(0, 9).map(h => (
              <div key={`putt-${h}`} className="p-2">{getPutts(h)}</div>
            ))}
          </div>
        </div>

        {/* Back 9 */}
        <div className="mb-6 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
          <div className="bg-slate-800 p-2 text-center text-xs font-black uppercase text-slate-300">Back 9</div>
          <div className="grid grid-cols-10 border-b border-slate-800 text-xs font-bold text-slate-400 text-center">
            <div className="p-2 border-r border-slate-800 flex items-center justify-center">H</div>
            {holes.slice(9, 18).map(h => <div key={h} className="p-2">{h}</div>)}
          </div>
          <div className="grid grid-cols-10 border-b border-slate-800 text-sm font-black text-white text-center bg-slate-900/50">
            <div className="p-2 border-r border-slate-800 text-slate-400 text-xs flex items-center justify-center">S</div>
            {holes.slice(9, 18).map(h => (
              <div key={`score-${h}`} className={`p-2 ${scores[h] ? 'text-emerald-400' : ''}`}>{getScore(h)}</div>
            ))}
          </div>
          <div className="grid grid-cols-10 text-xs font-semibold text-slate-400 text-center bg-slate-900/30">
            <div className="p-2 border-r border-slate-800 text-[10px] flex items-center justify-center">P</div>
            {holes.slice(9, 18).map(h => (
              <div key={`putt-${h}`} className="p-2">{getPutts(h)}</div>
            ))}
          </div>
        </div>

        {/* Totals Summary */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
            <p className="text-[10px] font-bold uppercase text-slate-400">Out</p>
            <p className="text-2xl font-black text-white">{front9}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
            <p className="text-[10px] font-bold uppercase text-slate-400">In</p>
            <p className="text-2xl font-black text-white">{back9}</p>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-center">
            <p className="text-[10px] font-bold uppercase text-emerald-500">Total</p>
            <p className="text-2xl font-black text-emerald-400">{totalScore}</p>
          </div>
        </div>

        {/* Finish Round Button */}
        <button 
          onClick={handleFinishRound}
          disabled={isSaving || totalScore === '-'}
          className="w-full py-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-500 active:scale-[0.98] text-slate-950 font-black text-lg shadow-lg flex items-center justify-center gap-2 transition-all mt-4"
        >
          {isSaving ? 'Syncing to Cloud...' : (
            <>
              <Trophy className="w-6 h-6 stroke-[2.5]" />
              Finish & Save Round
            </>
          )}
        </button>

      </div>
    </div>
  );
}