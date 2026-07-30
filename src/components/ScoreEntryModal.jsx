import React, { useState, useEffect } from 'react';
import { useGolfStore } from '../store/useGolfStore';

export default function ScoreEntryModal() {
  const { isScoreModalOpen, setScoreModalOpen, activeHole, scores, setScore } = useGolfStore();
  
  const currentHoleData = scores[activeHole] || { strokes: 4, putts: 2, fairway: 'Fairway' };
  
  const [strokes, setStrokes] = useState(currentHoleData.strokes || 4);
  const [putts, setPutts] = useState(currentHoleData.putts || 2);

  // Define directional labels to separate them from hazards
  const directionalLabels = ['Very Left', 'Left', 'Fairway', 'Green', 'Right', 'Very Right'];

  // Parse existing saved data so if you reopen the modal, it remembers your hazards
  const savedOutcomes = (currentHoleData.fairway || 'Fairway').split(', ');
  const savedDirection = savedOutcomes.find(opt => directionalLabels.includes(opt)) || 'Fairway';
  const savedHazards = savedOutcomes.filter(opt => !directionalLabels.includes(opt));

  const [missDirection, setMissDirection] = useState(savedDirection);
  const [selectedHazards, setSelectedHazards] = useState(savedHazards);

  // Sync state if the active hole changes
  useEffect(() => {
    if (isScoreModalOpen) {
      const data = scores[activeHole] || { strokes: 4, putts: 2, fairway: 'Fairway' };
      setStrokes(data.strokes || 4);
      setPutts(data.putts || 2);
      
      const outcomes = (data.fairway || 'Fairway').split(', ');
      setMissDirection(outcomes.find(opt => directionalLabels.includes(opt)) || 'Fairway');
      setSelectedHazards(outcomes.filter(opt => !directionalLabels.includes(opt)));
    }
  }, [isScoreModalOpen, activeHole, scores]);

  if (!isScoreModalOpen) return null;

  const toggleHazard = (hazardLabel) => {
    if (selectedHazards.includes(hazardLabel)) {
      setSelectedHazards(selectedHazards.filter(h => h !== hazardLabel));
    } else {
      setSelectedHazards([...selectedHazards, hazardLabel]);
    }
  };

  // Row 1: Directional Misses (Left to Right)
  const directionalMisses = [
    { label: 'Very Left', symbol: '⏪' },
    { label: 'Left', symbol: '◀' },
    { label: 'Right', symbol: '▶' },
    { label: 'Very Right', symbol: '⏩' }
  ];

  // Row 2: Successful Hits
  const successfulHits = [
    { label: 'Fairway', symbol: '🎯' },
    { label: 'Green', symbol: '⛳' }
  ];

  // Detailed text options for hazards
  const hazardOptions = [
    { label: 'Fairway Bunker', icon: '🏜️' },
    { label: 'Greenside Bunker', icon: '🏖️' },
    { label: 'Hazard / Penalty', icon: '💧' }
  ];

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

        {/* Shot Result / Accuracy */}
        <div className="space-y-3">
          
          {/* Top Row: Misses */}
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1.5 tracking-wider">Main Direction</p>
            <div className="grid grid-cols-4 gap-1.5">
              {directionalMisses.map(opt => (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => setMissDirection(opt.label)}
                  className={`py-2 px-1 rounded-xl text-[10px] font-semibold transition-all flex flex-col items-center justify-center gap-1 ${
                    missDirection === opt.label 
                      ? 'bg-emerald-500 text-slate-900 shadow-md font-bold ring-2 ring-emerald-400' 
                      : 'bg-slate-900 text-slate-300 border border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  <span className="text-base leading-none">{opt.symbol}</span>
                  <span className="leading-tight text-center">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Middle Row: Success */}
          <div className="grid grid-cols-2 gap-2">
            {successfulHits.map(opt => (
              <button
                key={opt.label}
                type="button"
                onClick={() => setMissDirection(opt.label)}
                className={`py-2.5 px-2 rounded-xl text-xs font-semibold transition-all flex flex-col items-center justify-center gap-1 ${
                  missDirection === opt.label 
                    ? 'bg-emerald-500 text-slate-900 shadow-md font-bold ring-2 ring-emerald-400' 
                    : 'bg-slate-900 text-slate-300 border border-slate-700 hover:bg-slate-700'
                }`}
              >
                <span className="text-xl leading-none">{opt.symbol}</span>
                <span className="tracking-tight text-center">{opt.label}</span>
              </button>
            ))}
          </div>

          {/* Bottom Row: Hazards (Multi-Select) */}
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1.5 tracking-wider mt-2">Hazards & Penalties (Select Any)</p>
            <div className="grid grid-cols-1 gap-1.5">
              {hazardOptions.map(opt => (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => toggleHazard(opt.label)}
                  className={`py-2.5 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-between ${
                    selectedHazards.includes(opt.label) 
                      ? 'bg-rose-500 text-white shadow-md font-bold ring-2 ring-rose-400' 
                      : 'bg-slate-900 text-slate-300 border border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="text-base leading-none">{opt.icon}</span>
                    <span>{opt.label}</span>
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded transition-colors ${
                    selectedHazards.includes(opt.label) ? 'bg-black/20 text-white' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {selectedHazards.includes(opt.label) ? 'Selected' : 'Select'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <button 
          onClick={() => {
            // Combine the single direction choice and the array of hazards into one string
            const combinedResult = [missDirection, ...selectedHazards].filter(Boolean).join(', ');
            setScore(activeHole, strokes, putts, combinedResult);
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