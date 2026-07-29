import React from 'react';
import { Wind, Mountain, Navigation, Volume2 } from 'lucide-react';

export default function HeroDistanceCard({
  distance = "--",
  playsLike = "--",
  windSpeed = 0,
  windDir = 0,
  elevation = 0,
  recommendedClub = "Calculating...",
}) {
  return (
    <div className="relative w-full rounded-2xl bg-slate-900/80 backdrop-blur-md border border-slate-700/50 p-5 text-white shadow-2xl z-10 mt-4">
      {/* Top Bar: Environmental Stats */}
      <div className="flex items-center justify-between border-b border-slate-700/60 pb-3 mb-4 text-xs font-semibold text-slate-300">
        <div className="flex items-center gap-1.5">
          <Wind className="w-4 h-4 text-sky-400" />
          <span>{windSpeed} mph</span>
          <Navigation 
            className="w-3.5 h-3.5 text-sky-400 inline transition-transform duration-500" 
            style={{ transform: `rotate(${windDir}deg)` }} 
          />
        </div>
        
        <div className="flex items-center gap-1.5">
          <Mountain className="w-4 h-4 text-purple-400" />
          <span>{elevation > 0 ? `+${elevation}` : elevation}y Elev</span>
        </div>
      </div>

      {/* Main Yardage Display */}
      <div className="flex items-center justify-between my-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">To Pin</p>
          <div className="flex items-baseline gap-1">
            <span className="text-6xl font-black tracking-tight text-white">{distance}</span>
            <span className="text-lg font-bold text-emerald-400">YDS</span>
          </div>
        </div>

        {/* Audio Caddy Button */}
        <button className="w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 flex items-center justify-center shadow-lg shadow-emerald-500/20 transition-all">
          <Volume2 className="w-6 h-6 stroke-[2.5]" />
        </button>
      </div>

      {/* Bottom Bar: Plays Like & Caddy Rec */}
      <div className="mt-4 pt-3 border-t border-slate-700/60 flex items-center justify-between">
        <div>
          <span className="text-xs text-slate-400 font-medium">Plays Like</span>
          <p className="text-xl font-bold text-amber-400">{playsLike} Yds</p>
        </div>
        <div className="text-right">
          <span className="text-xs text-slate-400 font-medium">Caddy Choice</span>
          <p className="text-xl font-extrabold text-emerald-400">{recommendedClub}</p>
        </div>
      </div>
    </div>
  );
}