import React, { useState } from 'react';
import { useGolfStore } from '../store/useGolfStore';
import { courseData } from '../lib/courseData';
import { calculateDispersion } from '../lib/golfMath';

export default function RoundHistory() {
  const { rounds, shots, deleteRound } = useGolfStore();
  const [selectedRound, setSelectedRound] = useState(null);

  if (!rounds || rounds.length === 0) {
    return (
      <div className="bg-slate-800 p-8 rounded-2xl shadow-lg border border-slate-700 text-center my-4">
        <span className="text-4xl block mb-3">🏌️‍♂️</span>
        <h3 className="text-xl font-bold text-emerald-400 mb-2">No Rounds Yet</h3>
        <p className="text-slate-400 text-sm">Play a round and save your scores to see your history here.</p>
      </div>
    );
  }

  // Find specific shots for the opened modal
  const roundShots = selectedRound ? shots.filter(s => s.round_id === selectedRound.id) : [];

  return (
    <div className="space-y-4 pb-10">
      <h2 className="text-2xl font-black text-white px-2">Round History</h2>
      
      {rounds.map((round) => {
        const scorecard = round.scorecard || {};
        const holesPlayed = Object.keys(scorecard).length;
        
        let totalStrokes = 0;
        let totalPutts = 0;
        
        Object.values(scorecard).forEach(hole => {
          totalStrokes += (hole.strokes || 0);
          totalPutts += (hole.putts || 0);
        });

        const dateObj = new Date(round.created_at);
        const formattedDate = dateObj.toLocaleDateString('en-US', {
          weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
        });

        return (
          <div 
            key={round.id} 
            onClick={() => setSelectedRound(round)}
            className="bg-slate-800 rounded-2xl shadow-lg border border-slate-700 overflow-hidden cursor-pointer hover:border-emerald-500/50 transition-colors"
          >
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

            <div className="p-3 bg-slate-800 flex justify-between items-center">
              <span className="text-xs text-emerald-400 font-bold ml-2">Tap to view scorecard</span>
              <button 
                onClick={(e) => {
                  e.stopPropagation(); // Prevents the modal from opening when clicking delete
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

      {/* --- Round Detail / Scorecard Modal --- */}
      {selectedRound && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 p-3 backdrop-blur-sm overflow-hidden">
          <div className="w-full max-w-md h-[85vh] bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl flex flex-col">
            
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-900 shrink-0 rounded-t-2xl">
              <div>
                <h3 className="text-lg font-black text-emerald-400 truncate max-w-[200px]">{selectedRound.course_name}</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Round Details</p>
              </div>
              <button onClick={() => setSelectedRound(null)} className="w-8 h-8 bg-slate-800 rounded-full text-slate-300 hover:text-white hover:bg-slate-700 flex items-center justify-center font-bold text-lg leading-none">
                ×
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="overflow-y-auto p-4 space-y-6 flex-1">
              
              {/* Scorecard Table */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Hole-by-Hole Scorecard</h4>
                <div className="bg-slate-900 rounded-xl border border-slate-700 overflow-hidden text-sm">
                  {Object.keys(selectedRound.scorecard || {}).length === 0 ? (
                     <p className="p-4 text-center text-slate-500 text-xs">No holes scored in this round.</p>
                  ) : (
                    <div className="divide-y divide-slate-800">
                      {Object.entries(selectedRound.scorecard).map(([holeNum, data]) => {
                        const par = courseData[holeNum]?.par || 4;
                        const relative = data.strokes - par;
                        const scoreColor = relative < 0 ? 'text-sky-400' : relative > 0 ? 'text-rose-400' : 'text-emerald-400';
                        
                        return (
                          <div key={holeNum} className="p-3 flex items-center gap-3">
                            <div className="w-8 text-center shrink-0">
                              <p className="text-[9px] text-slate-500 font-bold uppercase">Hole</p>
                              <p className="font-black text-white">{holeNum}</p>
                            </div>
                            <div className="w-12 text-center shrink-0 border-l border-slate-700 pl-2">
                              <p className="text-[9px] text-slate-500 font-bold uppercase">Score</p>
                              <p className={`font-black ${scoreColor}`}>{data.strokes}</p>
                            </div>
                            <div className="flex-1 border-l border-slate-700 pl-3">
                              <p className="text-xs text-white font-semibold truncate">
                                {data.fairway ? data.fairway.replace(/, /g, ' • ') : 'Unknown'}
                              </p>
                              <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                                {data.putts} Putts
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* GPS Tracked Shots Log */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">GPS Tracked Shots</h4>
                {roundShots.length === 0 ? (
                  <div className="bg-slate-900 p-4 rounded-xl border border-slate-700 text-center">
                    <p className="text-slate-500 text-xs">No GPS shots tracked this round.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {roundShots.map((shot, idx) => {
                      let devStr = 'Straight';
                      let devColor = 'text-emerald-400';
                      
                      if (shot.target_lat && shot.target_lng) {
                         const devYards = calculateDispersion(shot.start_lat, shot.start_lng, shot.target_lat, shot.target_lng, shot.lat, shot.lng);
                         if (devYards < -7) { devStr = `${Math.abs(devYards)}y L`; devColor = 'text-sky-400'; }
                         else if (devYards > 7) { devStr = `${devYards}y R`; devColor = 'text-amber-400'; }
                         else { devStr = 'On Target'; }
                      }

                      return (
                        <div key={shot.id || idx} className="bg-slate-900 p-3 rounded-xl border border-slate-700 flex justify-between items-center">
                          <div>
                            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Hole {shot.hole_number}</p>
                            <p className="font-bold text-white text-sm">{shot.club}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-black text-emerald-400 leading-none">{shot.distance}y</p>
                            <p className={`text-[10px] font-bold uppercase tracking-wider mt-1 ${devColor}`}>
                              {devStr}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}