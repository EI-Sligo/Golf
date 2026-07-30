import React from 'react';
import { useGolfStore } from '../store/useGolfStore';
import { calculateDistance, calculateBearing, calculatePlaysLike, getRecommendedClub } from '../lib/golfMath';
import { courseData } from '../lib/courseData';

export default function HeroDistanceCard() {
  const { 
    activeHole, setActiveHole, setScoreModalOpen, finishRound, 
    currentLat, currentLng, windSpeed, windDir, elevation, setWindSpeed, setWindDir, setElevation, clubs 
  } = useGolfStore();

  const pin = courseData[activeHole]?.pin;
  
  const directDistance = (currentLat && pin) ? calculateDistance(currentLat, currentLng, pin.lat, pin.lng) : 0;
  const shotBearing = (currentLat && pin) ? calculateBearing(currentLat, currentLng, pin.lat, pin.lng) : 0;
  
  const playsLike = calculatePlaysLike(directDistance, shotBearing, windSpeed, windDir, elevation);
  const recommendedClub = getRecommendedClub(playsLike, clubs);

  return (
    <div className="space-y-4">
      <div className="bg-slate-800 p-5 rounded-2xl shadow-lg border border-slate-700">
        <div className="flex justify-between items-center mb-6">
          <button onClick={() => setActiveHole(Math.max(1, activeHole - 1))} className="w-10 h-10 bg-slate-700 rounded-full font-bold text-white hover:bg-slate-600 transition-colors">&#8592;</button>
          
          <div className="flex gap-8 items-end">
            <div className="text-center">
              <p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest mb-1">Direct</p>
              <h2 className="text-4xl font-black text-white">{directDistance}<span className="text-sm font-normal text-slate-500 ml-1">yds</span></h2>
            </div>
            <div className="text-center">
              <p className="text-sky-400 text-[10px] uppercase font-bold tracking-widest mb-1">Plays Like</p>
              <h2 className="text-5xl font-black text-sky-400">{playsLike}<span className="text-sm font-normal text-sky-500/50 ml-1">yds</span></h2>
            </div>
          </div>

          <button onClick={() => setActiveHole(Math.min(18, activeHole + 1))} className="w-10 h-10 bg-slate-700 rounded-full font-bold text-white hover:bg-slate-600 transition-colors">&#8594;</button>
        </div>

        {/* Manual Weather/Elevation Inputs */}
        <div className="flex gap-2 mb-6">
          <div className="flex-1 bg-slate-900 rounded-xl p-2 border border-slate-700 text-center">
            <p className="text-[9px] text-slate-400 uppercase font-bold mb-1">Wind (mph)</p>
            <input type="number" className="w-full bg-transparent text-white font-bold text-center focus:outline-none" value={windSpeed} onChange={e => setWindSpeed(Number(e.target.value))} />
          </div>
          <div className="flex-1 bg-slate-900 rounded-xl p-2 border border-slate-700 text-center">
            <p className="text-[9px] text-slate-400 uppercase font-bold mb-1">Wind Dir (°)</p>
            <input type="number" className="w-full bg-transparent text-white font-bold text-center focus:outline-none" value={windDir} onChange={e => setWindDir(Number(e.target.value))} />
          </div>
          <div className="flex-1 bg-slate-900 rounded-xl p-2 border border-slate-700 text-center">
            <p className="text-[9px] text-slate-400 uppercase font-bold mb-1">Elev (ft)</p>
            <input type="number" className="w-full bg-transparent text-white font-bold text-center focus:outline-none" value={elevation} onChange={e => setElevation(Number(e.target.value))} />
          </div>
        </div>

        {/* Smart Caddy Recommendation */}
        <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-xl flex justify-between items-center mb-6">
          <div>
            <p className="text-[10px] text-emerald-500 uppercase font-bold tracking-widest mb-1">Smart Caddy AI</p>
            <p className="text-lg font-bold text-emerald-400">{recommendedClub}</p>
          </div>
          <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center text-slate-900 font-black">AI</div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button onClick={() => setScoreModalOpen(true)} className="flex-1 py-3 bg-slate-700 text-white font-bold rounded-xl hover:bg-slate-600 transition-colors">
            📝 Score
          </button>
          <button onClick={() => { if (window.confirm("End this round?")) finishRound(); }} className="flex-1 py-3 bg-red-500/20 text-red-400 font-bold rounded-xl border border-red-500/30 hover:bg-red-500/30 transition-colors">
            🛑 End Round
          </button>
        </div>
      </div>
    </div>
  );
}