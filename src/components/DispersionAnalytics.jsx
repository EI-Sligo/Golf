import React, { useState, useMemo } from 'react';
import { useGolfStore } from '../store/useGolfStore';
import { courseData } from '../lib/courseData';
import { getNetScore, getStablefordPoints, checkGIR, checkScrambling } from '../lib/golfMath';

const TrendBadge = ({ current, baseline, lowerIsBetter = true, show }) => {
  if (!show || baseline === undefined || current === undefined || baseline === 0) return null;
  const diff = Number((current - baseline).toFixed(1));
  if (diff === 0) return <p className="text-[9px] text-slate-500 font-bold mt-1 uppercase tracking-wider">No Change</p>;
  const isGood = lowerIsBetter ? diff < 0 : diff > 0;
  const color = isGood ? 'text-emerald-400' : 'text-rose-400';
  const arrow = diff < 0 ? '↓' : '↑';
  return (
    <p className={`text-[9px] ${color} font-bold mt-1 uppercase tracking-wider`}>
      {arrow} {Math.abs(diff)} vs Avg
    </p>
  );
};

export default function DispersionAnalytics() {
  const { rounds, shots, clubs, userHandicap } = useGolfStore();
  const [viewMode, setViewMode] = useState('overall');

  const buildStats = (roundsToProcess) => {
    let totalHoles = 0;
    let totalStrokes = 0;
    let totalPutts = 0;
    let totalParPlayed = 0;
    let totalStableford = 0;
    
    let girHit = 0;
    let scrambleOpps = 0;
    let scramblesHit = 0;
    
    let sgPutting = 0;
    let sgTeeToGreen = 0;

    let missesLeft = 0;
    let missesRight = 0;
    let fairwaysHit = 0;
    let blowupHoles = 0;

    roundsToProcess.forEach(round => {
      const scorecard = round.scorecard || {};
      
      Object.entries(scorecard).forEach(([holeNum, hole]) => {
        if (!hole.strokes) return; 
        
        totalHoles++;
        totalStrokes += hole.strokes;
        totalPutts += (hole.putts || 0);
        
        const outcome = hole.fairway || '';
        const parForHole = courseData[holeNum]?.par || 4;
        const siForHole = courseData[holeNum]?.strokeIndex || 9;
        totalParPlayed += parForHole;

        // Scoring & Stableford
        const scoreRelative = hole.strokes - parForHole;
        const netScore = getNetScore(hole.strokes, siForHole, userHandicap);
        totalStableford += getStablefordPoints(netScore, parForHole);

        if (scoreRelative >= 3) blowupHoles++;
        
        // GIR & Scrambling
        const hitGIR = checkGIR(hole.strokes, hole.putts, parForHole);
        if (hitGIR) girHit++;
        else {
          scrambleOpps++;
          if (checkScrambling(hole.strokes, hole.putts, parForHole)) scramblesHit++;
        }

        // Strokes Gained (Simplified)
        // Baseline: 2 putts per hole. 
        sgPutting += (2 - (hole.putts || 0));
        // Baseline: Par - 2 strokes to reach the green.
        sgTeeToGreen += ((parForHole - 2) - (hole.strokes - (hole.putts || 0)));

        if (outcome.includes('Fairway') && !outcome.includes('Bunker')) fairwaysHit++;
        if (outcome.includes('Left')) missesLeft++;
        if (outcome.includes('Right')) missesRight++;
      });
    });

    const totalMisses = missesLeft + missesRight || 1; 

    // Projected 18-Hole Handicap Differential for partial rounds
    let projectedHandicap = 0;
    if (totalHoles > 0) {
      const overPar = totalStrokes - totalParPlayed;
      projectedHandicap = (overPar / totalHoles) * 18;
    }

    return {
      totalHoles,
      avgPutts: totalHoles > 0 ? Number((totalPutts / totalHoles).toFixed(1)) : 0,
      totalStableford,
      projectedHandicap: Number(projectedHandicap.toFixed(1)),
      girPercent: totalHoles > 0 ? Math.round((girHit / totalHoles) * 100) : 0,
      scramblePercent: scrambleOpps > 0 ? Math.round((scramblesHit / scrambleOpps) * 100) : 0,
      sgPutting: Number(sgPutting.toFixed(1)),
      sgTeeToGreen: Number(sgTeeToGreen.toFixed(1)),
      fairwaysHit,
      blowupsPer18: totalHoles > 0 ? Number(((blowupHoles / totalHoles) * 18).toFixed(1)) : 0,
      leftPercent: Math.round((missesLeft / totalMisses) * 100),
      rightPercent: Math.round((missesRight / totalMisses) * 100),
    };
  };

  const analyticsData = useMemo(() => {
    const overall = buildStats(rounds);
    const latest = rounds.length > 0 ? buildStats([rounds[0]]) : null;
    const history = rounds.length > 1 ? buildStats(rounds.slice(1)) : null;

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
      return { ...club, avgActual, shotsTracked: stats ? stats.count : 0 };
    }).sort((a, b) => b.avg_distance - a.avg_distance);

    return { overall, latest, history, clubAverages };
  }, [rounds, shots, clubs]);

  const activeStats = viewMode === 'latest' && analyticsData.latest ? analyticsData.latest : analyticsData.overall;
  const isComparing = viewMode === 'latest' && analyticsData.history !== null;

  if (analyticsData.overall.totalHoles === 0) {
    return (
      <div className="bg-slate-800 p-8 rounded-2xl shadow-lg border border-slate-700 text-center my-4">
        <span className="text-4xl block mb-3">📊</span>
        <h3 className="text-xl font-bold text-emerald-400 mb-2">No Data Yet</h3>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-10">
      
      {rounds.length > 0 && (
        <div className="flex bg-slate-900 rounded-xl p-1.5 border border-slate-700 shadow-inner">
          <button 
            onClick={() => setViewMode('overall')} 
            className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all ${viewMode === 'overall' ? 'bg-emerald-500 text-slate-900 shadow-md' : 'text-slate-400 hover:text-white'}`}
          >
            Overall Stats
          </button>
          <button 
            onClick={() => setViewMode('latest')} 
            disabled={rounds.length === 0}
            className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all disabled:opacity-50 ${viewMode === 'latest' ? 'bg-emerald-500 text-slate-900 shadow-md' : 'text-slate-400 hover:text-white'}`}
          >
            Latest Round
          </button>
        </div>
      )}

      {/* Advanced Scoring & Handicap */}
      <div className="bg-slate-800 rounded-2xl shadow-lg border border-slate-700 overflow-hidden">
        <div className="bg-slate-900 p-4 border-b border-slate-700 flex justify-between items-center">
          <h2 className="text-lg font-black text-white">Scoring Engine</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase">{activeStats.totalHoles} holes</p>
        </div>
        <div className="grid grid-cols-2 divide-x divide-slate-700">
          <div className="p-4 text-center">
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Stableford Pts</p>
            <p className="text-3xl font-black text-amber-400">{activeStats.totalStableford}</p>
          </div>
          <div className="p-4 text-center">
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Proj. 18-Hole HDCP</p>
            <p className="text-3xl font-black text-sky-400">+{activeStats.projectedHandicap}</p>
            <TrendBadge show={isComparing} current={activeStats.projectedHandicap} baseline={analyticsData.history?.projectedHandicap} lowerIsBetter={true} />
          </div>
        </div>
      </div>

      {/* Strokes Gained & GIR */}
      <div>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">Advanced Performance</h3>
        <div className="grid grid-cols-2 gap-2 mb-2">
          <div className="bg-slate-800 p-3 rounded-xl shadow-sm border border-slate-700 text-center">
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">SG: Putting</p>
            <p className={`text-2xl font-black ${activeStats.sgPutting >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {activeStats.sgPutting > 0 ? '+' : ''}{activeStats.sgPutting}
            </p>
            <TrendBadge show={isComparing} current={activeStats.sgPutting} baseline={analyticsData.history?.sgPutting} lowerIsBetter={false} />
          </div>
          <div className="bg-slate-800 p-3 rounded-xl shadow-sm border border-slate-700 text-center">
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">SG: Tee-To-Green</p>
            <p className={`text-2xl font-black ${activeStats.sgTeeToGreen >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {activeStats.sgTeeToGreen > 0 ? '+' : ''}{activeStats.sgTeeToGreen}
            </p>
            <TrendBadge show={isComparing} current={activeStats.sgTeeToGreen} baseline={analyticsData.history?.sgTeeToGreen} lowerIsBetter={false} />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-slate-800 p-3 rounded-xl shadow-sm border border-slate-700 text-center">
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">GIR %</p>
            <p className="text-2xl font-black text-sky-400">{activeStats.girPercent}%</p>
            <TrendBadge show={isComparing} current={activeStats.girPercent} baseline={analyticsData.history?.girPercent} lowerIsBetter={false} />
          </div>
          <div className="bg-slate-800 p-3 rounded-xl shadow-sm border border-slate-700 text-center">
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Scrambling %</p>
            <p className="text-2xl font-black text-amber-400">{activeStats.scramblePercent}%</p>
            <TrendBadge show={isComparing} current={activeStats.scramblePercent} baseline={analyticsData.history?.scramblePercent} lowerIsBetter={false} />
          </div>
        </div>
      </div>

    </div>
  );
}