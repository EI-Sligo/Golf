import React, { useState } from 'react';
import { useGolfStore } from '../store/useGolfStore';
import { calculateDispersion } from '../lib/golfMath';

export default function ClubBagManager() {
  const { clubs, shots, rounds, deleteClub, addClub, seedBenHoganWithMockData, clearMockData } = useGolfStore();
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newClubName, setNewClubName] = useState('');
  const [newClubDist, setNewClubDist] = useState('');
  
  const [selectedClubForStats, setSelectedClubForStats] = useState(null);

  const sortedClubs = [...clubs].sort((a, b) => b.avg_distance - a.avg_distance);
  const hasDemoData = rounds.some(r => r.course_name === 'Demo Analytics Data');

  const handleAddClub = (e) => {
    e.preventDefault();
    if (!newClubName || !newClubDist) return;
    addClub(newClubName, newClubDist);
    setIsAddModalOpen(false);
    setNewClubName('');
    setNewClubDist('');
  };

  const getClubAnalytics = (clubId) => {
    const clubShots = shots.filter(s => s.club_id === clubId && s.distance > 0);
    const count = clubShots.length;
    
    if (count === 0) return { count: 0 };

    let totalDist = 0;
    let max = 0;
    let min = 9999;
    
    let left = 0;
    let right = 0;
    let straight = 0;

    clubShots.forEach(s => {
      totalDist += s.distance;
      if (s.distance > max) max = s.distance;
      if (s.distance < min) min = s.distance;

      if (s.target_lat && s.target_lng && s.start_lat && s.start_lng && s.lat && s.lng) {
         const dev = calculateDispersion(s.start_lat, s.start_lng, s.target_lat, s.target_lng, s.lat, s.lng);
         if (dev < -7) left++;
         else if (dev > 7) right++;
         else straight++;
      }
    });

    const totalTrackedTargetShots = left + right + straight || 1; 

    return {
      count,
      avg: Math.round(totalDist / count),
      max,
      min,
      leftPct: Math.round((left / totalTrackedTargetShots) * 100),
      straightPct: Math.round((straight / totalTrackedTargetShots) * 100),
      rightPct: Math.round((right / totalTrackedTargetShots) * 100)
    };
  };

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center px-2">
        <h2 className="text-2xl font-black text-white">My Bag</h2>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-sky-500/20 text-sky-400 px-3 py-1.5 rounded-lg text-xs font-bold border border-sky-500/30 hover:bg-sky-500/30 transition-colors"
        >
          + Add Club
        </button>
      </div>

      {/* Demo Data Management Controls */}
      <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-md">
        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-3">Bag Setup & Testing</p>
        
        <div className="flex flex-col gap-2">
          {!hasDemoData ? (
            <button 
              onClick={() => {
                if(window.confirm("This will erase your current bag and replace it with the Ben Hogan FW-817 set and populate your analytics with demo shots. Continue?")) {
                  seedBenHoganWithMockData();
                }
              }}
              className="w-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold py-2.5 rounded-lg hover:bg-emerald-500/30 transition-colors text-xs"
            >
              Inject FW-817 Set & Demo Analytics
            </button>
          ) : (
            <button 
              onClick={() => {
                if(window.confirm("Ready to track real shots? This will clear out the mock GPS shots but keep your clubs.")) {
                  clearMockData();
                }
              }}
              className="w-full bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold py-2.5 rounded-lg hover:bg-amber-500/30 transition-colors text-xs flex items-center justify-center gap-2"
            >
              🧹 Clear Demo Shot Data
            </button>
          )}
        </div>
      </div>

      {clubs.length === 0 ? (
        <div className="bg-slate-800 p-8 rounded-2xl shadow-lg border border-slate-700 text-center">
          <span className="text-4xl block mb-3">🏌️</span>
          <h3 className="text-xl font-bold text-emerald-400 mb-2">Your Bag is Empty</h3>
          <p className="text-slate-400 text-sm mb-6">Use the setup button above to inject your Ben Hogan set.</p>
        </div>
      ) : (
        <div className="bg-slate-800 rounded-2xl shadow-lg border border-slate-700 overflow-hidden divide-y divide-slate-700">
          {sortedClubs.map(club => {
            const stats = getClubAnalytics(club.id);
            return (
              <div 
                key={club.id} 
                onClick={() => setSelectedClubForStats(club)}
                className="p-4 flex items-center justify-between hover:bg-slate-700/50 transition-colors cursor-pointer"
              >
                <div>
                  <p className="font-bold text-white text-lg">{club.name}</p>
                  <p className="text-[10px] font-semibold text-slate-400 mt-0.5">
                    Tap for analytics ({stats.count} tracked)
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] uppercase text-emerald-500 font-bold tracking-wider mb-0.5">
                    {stats.count > 0 ? 'Actual Avg' : 'Est. Avg'}
                  </p>
                  <p className={`text-2xl font-black ${stats.count > 0 ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {stats.count > 0 ? stats.avg : club.avg_distance}y
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add New Club Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-slate-800 rounded-2xl p-5 border border-slate-700 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-700 pb-3">
              <h3 className="text-xl font-bold text-sky-400">Add New Club</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white text-2xl font-bold px-2 leading-none">×</button>
            </div>
            <form onSubmit={handleAddClub} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Club Name & Loft</label>
                <input 
                  type="text" required placeholder="e.g. 3 Hybrid (19°)"
                  value={newClubName} onChange={e => setNewClubName(e.target.value)}
                  className="w-full bg-slate-900 p-3.5 rounded-xl text-white border border-slate-700 focus:border-sky-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Estimated Distance (Yards)</label>
                <input 
                  type="number" required placeholder="e.g. 185"
                  value={newClubDist} onChange={e => setNewClubDist(e.target.value)}
                  className="w-full bg-slate-900 p-3.5 rounded-xl text-white border border-slate-700 focus:border-sky-500 focus:outline-none"
                />
              </div>
              <button type="submit" className="w-full bg-sky-500 text-slate-900 font-bold py-3.5 rounded-xl hover:bg-sky-400 transition-colors shadow-lg mt-2 text-sm">
                Save Club
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Specific Club Analytics Modal */}
      {selectedClubForStats && (() => {
        const stats = getClubAnalytics(selectedClubForStats.id);
        return (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
            <div className="w-full max-w-sm bg-slate-800 rounded-2xl p-5 border border-slate-700 shadow-2xl space-y-5">
              
              <div className="flex justify-between items-start border-b border-slate-700 pb-3">
                <div>
                  <h3 className="text-2xl font-black text-emerald-400">{selectedClubForStats.name}</h3>
                  <p className="text-xs text-slate-400 font-semibold mt-1">Base Est: {selectedClubForStats.avg_distance}y</p>
                </div>
                <button onClick={() => setSelectedClubForStats(null)} className="text-slate-400 hover:text-white text-2xl font-bold px-2 leading-none">×</button>
              </div>

              {stats.count === 0 ? (
                <div className="text-center py-6">
                  <p className="text-slate-400 text-sm">No GPS shots tracked with this club yet. Use the Shot Tracker on the course to generate analytics.</p>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-slate-900 p-3 rounded-xl shadow-sm border border-slate-700 text-center flex flex-col justify-center">
                      <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider mb-1">Max</p>
                      <p className="text-xl font-black text-white leading-none">{stats.max}<span className="text-xs text-slate-500 font-normal ml-0.5">y</span></p>
                    </div>
                    <div className="bg-emerald-500/10 p-3 rounded-xl shadow-sm border border-emerald-500/30 text-center flex flex-col justify-center">
                      <p className="text-[9px] text-emerald-500 uppercase font-bold tracking-wider mb-1">Avg</p>
                      <p className="text-2xl font-black text-emerald-400 leading-none">{stats.avg}<span className="text-xs text-emerald-600 font-normal ml-0.5">y</span></p>
                    </div>
                    <div className="bg-slate-900 p-3 rounded-xl shadow-sm border border-slate-700 text-center flex flex-col justify-center">
                      <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider mb-1">Min</p>
                      <p className="text-xl font-black text-slate-300 leading-none">{stats.min}<span className="text-xs text-slate-500 font-normal ml-0.5">y</span></p>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2 px-1">
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Dispersion</p>
                      <p className="text-[9px] text-slate-500 font-bold uppercase">{stats.count} Shots</p>
                    </div>
                    
                    <div className="w-full h-6 bg-slate-900 rounded-lg overflow-hidden flex shadow-inner border border-slate-700">
                      <div style={{ width: `${stats.leftPct}%` }} className="h-full bg-sky-500 transition-all flex items-center justify-center text-[10px] font-bold text-slate-900">
                        {stats.leftPct > 15 ? `${stats.leftPct}%` : ''}
                      </div>
                      <div style={{ width: `${stats.straightPct}%` }} className="h-full bg-emerald-500 transition-all flex items-center justify-center text-[10px] font-bold text-slate-900">
                        {stats.straightPct > 15 ? `${stats.straightPct}%` : ''}
                      </div>
                      <div style={{ width: `${stats.rightPct}%` }} className="h-full bg-amber-500 transition-all flex items-center justify-center text-[10px] font-bold text-slate-900">
                        {stats.rightPct > 15 ? `${stats.rightPct}%` : ''}
                      </div>
                    </div>
                    
                    <div className="flex justify-between mt-2 text-[10px] font-bold uppercase tracking-wider px-1">
                      <span className="text-sky-400">Left</span>
                      <span className="text-emerald-400">Straight</span>
                      <span className="text-amber-400">Right</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-2">
                <button 
                  onClick={() => {
                    if (window.confirm(`Are you sure you want to retire your ${selectedClubForStats.name}?`)) {
                      deleteClub(selectedClubForStats.id);
                      setSelectedClubForStats(null);
                    }
                  }}
                  className="w-full text-xs font-bold text-rose-400 bg-rose-500/10 py-3 rounded-xl border border-rose-500/20 hover:bg-rose-500/20 transition-colors"
                >
                  Remove Club from Bag
                </button>
              </div>
              
            </div>
          </div>
        );
      })()}

    </div>
  );
}