import React from 'react';
import { useGolfStore } from '../store/useGolfStore';
import { 
  calculateDistance, 
  calculateBearing, 
  calculatePlaysLike, 
  getRecommendedClub 
} from '../lib/golfMath';
import { courseData } from '../lib/courseData';

export default function HeroDistanceCard() {
  const { 
    activeHole, 
    setActiveHole, 
    setScoreModalOpen, 
    finishRound, 
    currentLat, 
    currentLng, 
    windSpeed, 
    windDir, 
    elevation, 
    setWindSpeed, 
    setWindDir, 
    setElevation, 
    clubs,
    fetchLiveConditions, 
    isFetchingWeather
  } = useGolfStore();

  const hole = courseData[activeHole];
  
  const distCenter = (currentLat && hole?.pin) 
    ? calculateDistance(currentLat, currentLng, hole.pin.lat, hole.pin.lng) 
    : 0;
    
  const distFront = (currentLat && hole?.front) 
    ? calculateDistance(currentLat, currentLng, hole.front.lat, hole.front.lng) 
    : 0;
    
  const distBack = (currentLat && hole?.back) 
    ? calculateDistance(currentLat, currentLng, hole.back.lat, hole.back.lng) 
    : 0;
  
  const shotBearing = (currentLat && hole?.pin) 
    ? calculateBearing(currentLat, currentLng, hole.pin.lat, hole.pin.lng) 
    : 0;
    
  const playsLike = calculatePlaysLike(distCenter, shotBearing, windSpeed, windDir, elevation);
  const recommendedClub = getRecommendedClub(playsLike, clubs);

  return (
    <div className="space-y-4">
      <div className="bg-slate-800 p-4 sm:p-5 rounded-2xl shadow-lg border border-slate-700">
        
        {/* Header - Hole Navigation */}
        <div className="flex justify-between items-center mb-4">
          <button 
            onClick={() => setActiveHole(Math.max(1, activeHole - 1))} 
            className="w-10 h-10 bg-slate-700 rounded-full font-bold text-white hover:bg-slate-600 transition-colors flex items-center justify-center"
          >
            &#8592;
          </button>
          
          <div className="text-center">
            <h2 className="text-4xl sm:text-5xl font-black text-emerald-400 leading-none">{activeHole}</h2>
            <p className="text-slate-400 uppercase tracking-widest text-[10px] font-bold mt-1">
              Par {hole?.par || '-'} | SI {hole?.strokeIndex || '-'}
            </p>
          </div>

          <button 
            onClick={() => setActiveHole(Math.min(18, activeHole + 1))} 
            className="w-10 h-10 bg-slate-700 rounded-full font-bold text-white hover:bg-slate-600 transition-colors flex items-center justify-center"
          >
            &#8594;
          </button>
        </div>

        {/* Front / Center / Back Yardages */}
        <div className="flex justify-between items-end bg-slate-900 p-3 sm:p-4 rounded-xl border border-slate-700 mb-5">
          <div className="text-center opacity-70">
            <p className="text-slate-400 text-[9px] sm:text-[10px] uppercase font-bold tracking-widest mb-1">Front</p>
            <h3 className="text-xl sm:text-2xl font-bold text-white">{distFront}</h3>
          </div>
          <div className="text-center pb-1">
            <p className="text-emerald-400 text-[9px] sm:text-[10px] uppercase font-bold tracking-widest mb-1">Center</p>
            <h2 className="text-4xl sm:text-5xl font-black text-white">{distCenter}</h2>
          </div>
          <div className="text-center opacity-70">
            <p className="text-slate-400 text-[9px] sm:text-[10px] uppercase font-bold tracking-widest mb-1">Back</p>
            <h3 className="text-xl sm:text-2xl font-bold text-white">{distBack}</h3>
          </div>
        </div>

        {/* Weather / Conditions Grid (Fixes Overflow) */}
        <div className="mb-5">
          <div className="flex justify-between items-center mb-2">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Conditions</p>
            <button 
              onClick={fetchLiveConditions} 
              disabled={isFetchingWeather} 
              className="text-[10px] bg-sky-500/20 text-sky-400 px-2 py-1 rounded font-bold uppercase tracking-wider border border-sky-500/30 hover:bg-sky-500/30 transition-colors disabled:opacity-50"
            >
              {isFetchingWeather ? 'Fetching...' : 'Auto-Fetch API'}
            </button>
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-slate-900 rounded-xl p-2.5 border border-slate-700 text-center">
              <p className="text-[9px] text-slate-400 uppercase font-bold mb-1">Wind (mph)</p>
              <input 
                type="number" 
                className="w-full bg-transparent text-white font-bold text-center text-sm focus:outline-none" 
                value={windSpeed} 
                onChange={e => setWindSpeed(Number(e.target.value))} 
              />
            </div>
            <div className="bg-slate-900 rounded-xl p-2.5 border border-slate-700 text-center">
              <p className="text-[9px] text-slate-400 uppercase font-bold mb-1">Dir (°)</p>
              <input 
                type="number" 
                className="w-full bg-transparent text-white font-bold text-center text-sm focus:outline-none" 
                value={windDir} 
                onChange={e => setWindDir(Number(e.target.value))} 
              />
            </div>
            <div className="bg-slate-900 rounded-xl p-2.5 border border-slate-700 text-center">
              <p className="text-[9px] text-slate-400 uppercase font-bold mb-1">Elev (ft)</p>
              <input 
                type="number" 
                className="w-full bg-transparent text-white font-bold text-center text-sm focus:outline-none" 
                value={elevation} 
                onChange={e => setElevation(Number(e.target.value))} 
              />
            </div>
          </div>
        </div>

        {/* Smart Caddy AI Recommendation */}
        <div className="bg-emerald-500/10 border border-emerald-500/30 p-3.5 sm:p-4 rounded-xl flex justify-between items-center mb-5">
          <div>
            <p className="text-[10px] text-emerald-500 uppercase font-bold tracking-widest mb-1">
              Plays Like <span className="text-white text-base sm:text-lg ml-1">{playsLike}y</span>
            </p>
            <p className="text-base sm:text-lg font-bold text-emerald-400">{recommendedClub}</p>
          </div>
          <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center text-slate-900 font-black shrink-0">
            AI
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button 
            onClick={() => setScoreModalOpen(true)} 
            className="flex-1 py-3 bg-slate-700 text-white font-bold rounded-xl hover:bg-slate-600 transition-colors text-sm"
          >
            📝 Score
          </button>
          <button 
            onClick={() => { 
              if (window.confirm("Are you sure you want to end this round?")) {
                finishRound(); 
              }
            }} 
            className="flex-1 py-3 bg-red-500/20 text-red-400 font-bold rounded-xl border border-red-500/30 hover:bg-red-500/30 transition-colors text-sm"
          >
            🛑 End Round
          </button>
        </div>
        
      </div>
    </div>
  );
}