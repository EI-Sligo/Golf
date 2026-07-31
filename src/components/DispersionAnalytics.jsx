import React, { useState, useMemo } from 'react';
import { useGolfStore } from '../store/useGolfStore';
import { courseData } from '../lib/courseData';

// Helper component for displaying the improvement delta
const TrendBadge = ({ current, baseline, lowerIsBetter = true, show }) => {
  if (!show || baseline === undefined || current === undefined || baseline === 0) return null;
  
  const diff = Number((current - baseline).toFixed(1));
  if (diff === 0) return <p className="text-[9px] text-slate-500 font-bold mt-1 uppercase tracking-wider">No Change</p>;
  
  const isGood = lowerIsBetter ? diff < 0 : diff > 0;
  const color = isGood ? 'text-emerald-400' : 'text-rose-400';
  const arrow = diff < 0 ? '↓' : '↑';
  const absDiff = Math.abs(diff);

  return (
    <p className={`text-[9px] ${color} font-bold mt-1 uppercase tracking-wider`}>
      {arrow} {absDiff} vs Avg
    </p>
  );
};

export default function DispersionAnalytics() {
  const { rounds, shots, clubs } = useGolfStore();
  const [viewMode, setViewMode] = useState('overall'); // 'overall' | 'latest'

  // Centralized stat calculation engine
  const buildStats = (roundsToProcess) => {
    let totalHoles = 0;
    let totalPutts = 0;
    let missesLeft = 0;
    let missesRight = 0;
    let fairwaysHit = 0;
    let bunkersHit = 0;
    let penalties = 0;
    let parsOrBetter = 0;
    let bogeys = 0;
    let doubleBogeys = 0;
    let blowupHoles = 0;

    roundsToProcess.forEach(round => {
      const scorecard = round.scorecard || {};
      
      Object.entries(scorecard).forEach(([holeNum, hole]) => {
        if (!hole.strokes) return; 
        
        totalHoles++;
        totalPutts += (hole.putts || 0);
        
        const outcome = hole.fairway || '';
        const parForHole = courseData[holeNum]?.par || 4;
        const scoreRelative = hole.strokes - parForHole;

        if (scoreRelative <= 0) parsOrBetter++;
        else if (scoreRelative === 1) bogeys++;
        else if (scoreRelative === 2) doubleBogeys++;
        else blowupHoles++;
        
        if (outcome.includes('Fairway') && !outcome.includes('Bunker')) fairwaysHit++;
        if (outcome.includes('Left')) missesLeft++;
        if (outcome.includes('Right')) missesRight++;
        if (outcome.includes('Bunker')) bunkersHit++;
        if (outcome.includes('Penalty') || outcome.includes('Hazard')) penalties++;
      });
    });

    const totalMisses = missesLeft + missesRight || 1; 

    return {
      totalHoles,
      avgPutts: totalHoles > 0 ? Number((totalPutts / totalHoles).toFixed(1)) : 0,
      missesLeft,
      missesRight,
      fairwaysHit,
      bunkersHit,
      penalties,
      parsOrBetter,
      bogeys,
      doubleBogeys,
      blowupHoles,
      leftPercent: Math.round((missesLeft / totalMisses) * 100),
      rightPercent: Math.round((missesRight / totalMisses) * 100),
      
      // Normalized metrics (Per 18) for fair comparison between partial and full rounds
      blowupsPer18: totalHoles > 0 ? Number(((blowupHoles / totalHoles) * 18).toFixed(1)) : 0,
      penaltiesPer18: totalHoles > 0 ? Number(((penalties / totalHoles) * 18).toFixed(1)) : 0,
      bunkersPer18: totalHoles > 0 ? Number(((bunkersHit / totalHoles) * 18).toFixed(1)) : 0,
    };
  };

  // Crunch all necessary data sets
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
        <p className="text-slate-400 text-sm">Analytics will generate automatically after you score your first hole.</p>
      </div>
    );
  }

  // --- Dynamic AI Caddy Insights ---
  const getInsights = () => {
    const insights = [];
    const scope = viewMode === 'latest' ? "In your last round, you" : "You";
    const scopeVerb = viewMode === 'latest' ? "averaged" : "are averaging";

    // Putting Insight
    if (activeStats.avgPutts > 2.2) {
      insights.push(`${scope} ${scopeVerb} ${activeStats.avgPutts} putts per hole. Practicing lag putting to guarantee a 2-putt will instantly drop your score.`);
    } else if (activeStats.avgPutts <= 1.8 && activeStats.avgPutts > 0) {
      insights.push(`Your putting is dialled in! ${scope} ${scopeVerb} ${activeStats.avgPutts} putts per hole, saving crucial strokes on the green.`);
    }

    // Directional Miss Insight
    if (activeStats.rightPercent > 65) {
      insights.push(`Your dominant miss is Right (${activeStats.rightPercent}% of misses). Try aiming left-center off the tee to keep the ball in play.`);
    } else if (activeStats.leftPercent > 65) {
      insights.push(`Your dominant miss is Left (${activeStats.leftPercent}% of misses). Aim down the right side of the fairway to give yourself a wider margin of error.`);
    }

    // Hazard / Blowup Insight
    if (activeStats.blowupsPer18 > 4) {
      insights.push(`Blow-up holes (3+ over par) are severely inflating your score. Prioritize taking an extra club, swinging smooth, and chipping out of trouble safely.`);
    } else if (activeStats.blowupHoles === 0 && activeStats.totalHoles >= 9) {
      insights.push(`Zero blow-up holes! Fantastic course management. Staying out of major trouble is the fastest way to lower your handicap.`);
    }

    if (insights.length === 0) insights.push("Keep logging rounds to generate personalized game-improvement insights.");
    return insights;
  };

  return (
    <div className="space-y-5 pb-10">
      
      {/* View Toggle */}
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

      {/* Scoring Distribution */}
      <div className="bg-slate-800 rounded-2xl shadow-lg border border-slate-700 overflow-hidden">
        <div className="bg-slate-900 p-4 border-b border-slate-700 flex justify-between items-center">
          <h2 className="text-lg font-black text-white">Scoring Distribution</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase">{activeStats.totalHoles} holes</p>
        </div>
        <div className="grid grid-cols-4 divide-x divide-slate-700">
          <div className="p-3 text-center bg-emerald-500/10">
            <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider mb-1">Par/Btr</p>
            <p className="text-xl font-black text-emerald-400">{activeStats.parsOrBetter}</p>
          </div>
          <div className="p-3 text-center">
            <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider mb-1">Bogey</p>
            <p className="text-xl font-black text-white">{activeStats.bogeys}</p>
          </div>
          <div className="p-3 text-center">
            <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider mb-1">Dbl Bogey</p>
            <p className="text-xl font-black text-amber-400">{activeStats.doubleBogeys}</p>
          </div>
          <div className="p-3 text-center bg-rose-500/10">
            <p className="text-[9px] text-rose-400 uppercase font-bold tracking-wider mb-1">Blow-up</p>
            <p className="text-xl font-black text-rose-500">{activeStats.blowupHoles}</p>
            <TrendBadge show={isComparing} current={activeStats.blowupsPer18} baseline={analyticsData.history?.blowupsPer18} />
          </div>
        </div>
      </div>

      {/* AI Caddy Insights */}
      <div className="bg-emerald-900/30 border border-emerald-500/30 rounded-2xl p-5 shadow-lg">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-slate-900 font-black shrink-0">AI</div>
          <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider">Caddy Insights</h3>
        </div>
        <ul className="space-y-3">
          {getInsights().map((insight, idx) => (
             <li key={idx} className="text-sm text-slate-300 flex items-start gap-2">
              <span className="text-emerald-500 mt-0.5">•</span> 
              <span className="leading-snug">{insight}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* The Stroke Bleed */}
      <div>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">Where Strokes Are Bleeding</h3>
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-slate-800 p-3 rounded-xl shadow-sm border border-slate-700 text-center flex flex-col justify-center">
            <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider mb-1">Avg Putts</p>
            <p className="text-2xl font-black text-sky-400 leading-none">{activeStats.avgPutts}</p>
            <TrendBadge show={isComparing} current={activeStats.avgPutts} baseline={analyticsData.history?.avgPutts} />
          </div>
          <div className="bg-slate-800 p-3 rounded-xl shadow-sm border border-slate-700 text-center flex flex-col justify-center">
            <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider mb-1">Penalties /18</p>
            <p className="text-2xl font-black text-rose-400 leading-none">{activeStats.penaltiesPer18}</p>
            <TrendBadge show={isComparing} current={activeStats.penaltiesPer18} baseline={analyticsData.history?.penaltiesPer18} />
          </div>
          <div className="bg-slate-800 p-3 rounded-xl shadow-sm border border-slate-700 text-center flex flex-col justify-center">
            <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider mb-1">Bunkers /18</p>
            <p className="text-2xl font-black text-amber-400 leading-none">{activeStats.bunkersPer18}</p>
            <TrendBadge show={isComparing} current={activeStats.bunkersPer18} baseline={analyticsData.history?.bunkersPer18} />
          </div>
        </div>
      </div>

      {/* Miss Tendency Bar */}
      <div className="bg-slate-800 rounded-2xl shadow-lg border border-slate-700 p-5">
        <div className="flex justify-between items-center mb-3">
          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Miss Tendency</p>
          <p className="text-[10px] text-emerald-400 font-bold uppercase">{activeStats.fairwaysHit} Fairways Hit</p>
        </div>
        <div className="w-full h-5 bg-slate-900 rounded-full overflow-hidden flex shadow-inner">
          <div style={{ width: `${activeStats.leftPercent}%` }} className="h-full bg-sky-500 transition-all flex items-center pl-2 text-[10px] font-bold text-slate-900">
            {activeStats.leftPercent > 15 ? 'LEFT' : ''}
          </div>
          <div style={{ width: `${activeStats.rightPercent}%` }} className="h-full bg-amber-500 transition-all flex items-center justify-end pr-2 text-[10px] font-bold text-slate-900">
            {activeStats.rightPercent > 15 ? 'RIGHT' : ''}
          </div>
        </div>
        <div className="flex justify-between mt-2 text-xs font-bold">
          <span className="text-sky-400">{activeStats.leftPercent}%</span>
          <span className="text-amber-400">{activeStats.rightPercent}%</span>
        </div>
      </div>

      {/* Real-World GPS Yardages (Always shows All-Time for sample size) */}
      <div className="bg-slate-800 rounded-2xl shadow-lg border border-slate-700 overflow-hidden">
        <div className="bg-slate-900 p-4 border-b border-slate-700">
          <h2 className="text-lg font-black text-white">All-Time Club Yardages</h2>
          <p className="text-xs text-slate-400">Tracked via GPS to eliminate guesswork</p>
        </div>
        
        <div className="divide-y divide-slate-700">
          {analyticsData.clubAverages.map(club => (
            <div key={club.id} className="p-4 flex items-center justify-between">
              <div>
                <p className="font-bold text-white">{club.name}</p>
                <p className="text-[10px] font-semibold text-slate-400">
                  {club.shotsTracked} shots tracked
                </p>
              </div>
              
              <div className="text-right">
                <div className="flex items-end gap-3">
                  <div className="text-right opacity-50">
                    <p className="text-[9px] uppercase text-slate-400 font-bold mb-0.5">Est.</p>
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