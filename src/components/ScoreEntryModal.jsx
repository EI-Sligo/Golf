import React, { useState } from 'react';
import { useGolfStore } from '../store/useGolfStore';

export default function ScoreEntryModal() {
  const { isScoreModalOpen, setScoreModalOpen, activeHole, scores, setScore } = useGolfStore();
  
  const currentHoleData = scores[activeHole] || { strokes: 4, putts: 2, fairway: 'Fairway' };
  const [strokes, setStrokes] = useState(currentHoleData.strokes || 4);
  const [putts, setPutts] = useState(currentHoleData.putts || 2);
  const [fairway, setFairway] = useState(currentHoleData.fairway || 'Fairway');

  if (!isScoreModalOpen) return null;

  const accuracies = ['Very Left', 'Left', 'Fairway', 'Right', 'Very Right', 'Fairway Bunker', 'Greenside Bunker'];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-sm bg-slate-800 rounded-2xl p-5 border border-slate-700 shadow-2xl text-white space-y-4 my-auto">
        <div className="flex justify-between items-center border-b border-slate-700 pb-3">
          <h3 className="text-xl font-bold text-emerald-400">Hole {activeHole} Score</h3>
          <button 
            onClick={() => setScoreModalOpen(false)} 
            className="text-slate-400 hover:text-white text-2xl font-bold px-2 leading-none"
          >
            ×
          </button>
        </div>

        {/* Strokes Counter */}
        <div className="bg-slate-900 p-3 rounded-xl border border-slate-700 flex justify-between items-center">
          <span className="text-xs font-bold text-slate-400 uppercase">Strokes</span>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setStrokes(Math.max(1, strokes - 1))} 
              className="w-10 h-10 bg-slate-800 rounded-lg text-lg font-bold text-slate-300 hover:bg-slate-700 flex items-center justify-center"
            >
              -
            </button>
            <span className="text-2xl font-black w-8 text-center">{strokes}</span>
            <button 
              onClick={() => setStrokes(strokes + 1)} 
              className="w-10 h-10 bg-slate-800 rounded-lg text-lg font-bold text-slate-300 hover:bg-slate-700 flex items-center justify-center"
            >
              +
            </button>
          </div>
        </div>

        {/* Putts Counter */}
        <div className="bg-slate-900 p-3 rounded-xl border border-slate-700 flex justify-between items-center">
          <span className="text-xs font-bold text-slate-400 uppercase">Putts</span>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setPutts(Math.max(0, putts - 1))} 
              className="w-10 h-10 bg-slate-800 rounded-lg text-lg font-bold text-slate-300 hover:bg-slate-700 flex items-center justify-center"
            >
              -
            </button>
            <span className="text-2xl font-black w-8 text-center">{putts}</span>
            <button 
              onClick={() => setPutts(putts + 1)} 
              className="w-10 h-10 bg-slate-800 rounded-lg text-lg font-bold text-slate-300 hover:bg-slate-700 flex items-center justify-center"
            >
              +
            </button>
          </div>
        </div>

        {/* Accuracy Grid */}
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase mb-2">Shot Accuracy</p>
          <div className="grid grid-cols-2 gap-1.5">
            {accuracies.map(acc => (
              <button
                key={acc}
                type="button"
                onClick={() => setFairway(acc)}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                  fairway === acc 
                    ? 'bg-emerald-500 text-slate-900 shadow-md font-black' 
                    : 'bg-slate-900 text-slate-300 border border-slate-700 hover:bg-slate-700'
                }`}
              >
                {acc}
              </button>
            ))}
          </div>
        </div>

        <button 
          onClick={() => {
            setScore(activeHole, strokes, putts, fairway);
            setScoreModalOpen(false);
          }}
          className="w-full bg-emerald-500 text-slate-900 font-bold py-3.5 rounded-xl hover:bg-emerald-400 transition-colors shadow-lg mt-2 text-sm"
        >
          Save Score
        </button>
      </div>
    </div>
  );
}