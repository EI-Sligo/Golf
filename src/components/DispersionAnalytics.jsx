import React, { useMemo } from 'react';
import { useGolfStore } from '../store/useGolfStore';

export default function DispersionAnalytics() {
  const { rounds, shots, clubs } = useGolfStore();

  const analytics = useMemo(() => {
    let totalHoles = 0;
    let totalPutts = 0;
    let fairwaysHit = 0;
    let greensHit = 0;
    
    let missesLeft = 0;
    let missesRight = 0;
    
    let bunkersHit = 0;
    let penalties = 0;

    // Crunch Round Scorecard Data
    rounds.forEach(round => {
      const scorecard = round.scorecard || {};
      
      Object.values(scorecard).forEach(hole => {
        totalHoles++;
        totalPutts += (hole.putts || 0);
        
        const outcome = hole.fairway || '';
        
        // FIR & GIR Logic
        if (outcome.includes('Fairway') && !outcome.includes('Bunker')) fairwaysHit++;
        if (outcome.includes('Green')) greensHit++;
        
        // Directional Tendencies
        if (outcome.includes('Left')) missesLeft++;
        if (outcome.includes('Right')) missesRight++;
        
        // Hazards
        if (outcome.includes('Bunker')) bunkersHit++;
        if (outcome.includes('Penalty') || outcome.includes('Hazard')) penalties++;
      });
    });

    // Crunch GPS Shot Tracker Data for Club Yardages
    const clubStats = {};
    shots.forEach(shot => {
      if (shot.distance && shot.club_id) {
        if (!clubStats[shot.club_id]) {
          clubStats[shot.club_id] = { totalDistance: 0, count: 0 };
        }
        clubStats[shot.club_id].totalDistance += shot.distance;
        clubStats[shot.club_id].count += 1;
      }
    });

    const clubAverages = clubs.map(club => {
      const stats = clubStats[club.id];
      const avgActual = stats ? Math.round(stats.totalDistance / stats.count) : 0;
      return {
        ...club,
        avgActual,
        shotsTracked: stats ? stats.count : 0
      };
    }).sort((a, b) => b.avg_distance - a.avg_distance);

    return {
      totalHoles,
      avgPutts: totalHoles > 0 ? (totalPutts / totalHoles).toFixed(1) : 0,
      firPercent: totalHoles > 0 ? Math.round((fairwaysHit / totalHoles) * 100) : 0,
      girPercent: totalHoles > 0 ? Math.round((greensHit / totalHoles) * 100) : 0,
      missesLeft,
      missesRight,
      bunkersHit,
      penalties,
      clubAverages
    };
  }, [rounds, shots, clubs]);

  if (analytics.totalHoles === 0) {
    return (
      <div className="bg-slate-800 p-8 rounded-2xl shadow-lg border border-slate-700 text-center my-4">
        <span className="text-4xl block mb-3">📊</span>
        <h3 className="text-xl font-bold text-emerald-400 mb-2">No Data Yet</h3>
        <p className="text-slate-400 text-sm">Analytics will generate automatically after you score your first hole.</p>
      </div>
    );
  }

  const totalMisses = analytics.missesLeft + analytics.missesRight || 1; 
  const leftPercent = Math.round((analytics.missesLeft / totalMisses) * 100);
  const rightPercent = Math.round((analytics.missesRight / totalMisses) * 100);

  return (
    <div className="space-y-4 pb-10">
      
      {/* Accuracy Dashboard */}
      <div className="bg-slate-800 rounded-2xl shadow-lg border border-slate-700 overflow-hidden">
        <div className="bg-slate-900 p-4 border-b border-slate-700">
          <h2 className="text-lg font-black text-white">Scoring Accuracy</h2>
          <p className="text-xs text-slate-400">Based on {analytics.totalHoles} holes played</p>
        </div>
        
        <div className="grid grid-cols-3 divide-x divide-slate-700 border-b border-slate-700">
          <div className="p-4 text-center">
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-2">FIR</p>
            <p className="text-2xl font-black text-emerald-400">{analytics.firPercent}%</p>
          </div>
          <div className="p-4 text-center bg-slate-800/50">
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-2">GIR</p>
            <p className="text-2xl font-black text-emerald-400">{analytics.girPercent}%</p>
          </div>
          <div className="p-4 text-center">
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-2">Avg Putts</p>
            <p className="text-2xl font-black text-sky-400">{analytics.avgPutts}</p>
          </div>
        </div>

        {/* Miss Tendency Bar */}
        <div className="p-5">
          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-3 text-center">Miss Tendency (Left vs Right)</p>
          <div className="w-full h-4 bg-slate-900 rounded-full overflow-hidden flex shadow-inner">
            <div style={{ width: `${leftPercent}%` }} className="h-full bg-rose-500 transition-all"></div>
            <div style={{ width: `${rightPercent}%` }} className="h-full bg-amber-500 transition-all"></div>
          </div>
          <div className="flex justify-between mt-2 text-xs font-bold">
            <span className="text-rose-400">Left: {leftPercent}%</span>
            <span className="text-amber-400">Right: {rightPercent}%</span>
          </div>
        </div>
      </div>

      {/* Hazards Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-800 p-4 rounded-xl shadow-lg border border-slate-700 flex items-center justify-between">
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Bunkers</p>
            <p className="text-xl font-black text-amber-400">{analytics.bunkersHit}</p>
          </div>
          <span className="text-2xl opacity-50">🏖️</span>
        </div>
        <div className="bg-slate-800 p-4 rounded-xl shadow-lg border border-slate-700 flex items-center justify-between">
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Penalties</p>
            <p className="text-xl font-black text-rose-500">{analytics.penalties}</p>
          </div>
          <span className="text-2xl opacity-50">💧</span>
        </div>
      </div>

      {/* Real-World GPS Yardages */}
      <div className="bg-slate-800 rounded-2xl shadow-lg border border-slate-700 overflow-hidden mt-6">
        <div className="bg-slate-900 p-4 border-b border-slate-700">
          <h2 className="text-lg font-black text-white">True Club Yardages</h2>
          <p className="text-xs text-slate-400">Calculated from GPS shot tracking</p>
        </div>
        
        <div className="divide-y divide-slate-700">
          {analytics.clubAverages.map(club => (
            <div key={club.id} className="p-4 flex items-center justify-between">
              <div>
                <p className="font-bold text-white">{club.name}</p>
                <p className="text-[10px] font-semibold text-slate-400">
                  {club.shotsTracked} shots tracked
                </p>
              </div>
              
              <div className="text-right">
                <div className="flex items-end gap-2">
                  <div className="text-right">
                    <p className="text-[9px] uppercase text-slate-500 font-bold mb-0.5">Est.</p>
                    <p className="text-sm font-semibold text-slate-400 line-through">{club.avg_distance}y</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] uppercase text-emerald-500 font-bold mb-0.5">Actual</p>
                    <p className="text-xl font-black text-emerald-400">
                      {club.avgActual > 0 ? `${club.avgActual}y` : '-'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}