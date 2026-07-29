import React from 'react';
import { Wind, TrendingUp, Compass } from 'lucide-react';

export default function HeroDistanceCard({ distance, playsLike, windSpeed, windDir, elevation, recommendedClub }) {
  return (
    <div className="mt-4 bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-3xl p-5 shadow-xl text-white relative overflow-hidden">
      
      {/* Top Row: Distance & Plays Like */}
      <div className="flex justify-between items-start">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Direct Distance</p>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-5xl font-black tracking-tight">{distance}</span>
            <span className="text-xs font-bold text-slate-400">yds</span>
          </div>
        </div>

        <div className="text-right">
          <p className="text-[10px] font-bold uppercase tracking-wider text-sky-400">Plays Like</p>
          <div className="flex items-baseline justify-end gap-1 mt-0.5">
            <span className="text-3xl font-black text-sky-300">{playsLike}</span>
            <span className="text-xs font-bold text-sky-400">yds</span>
          </div>
        </div>
      </div>

      {/* Middle Row: Environment Specs */}
      <div className="mt-5 grid grid-cols-3 gap-2 pt-4 border-t border-slate-800/80 text-center">
        <div className="bg-slate-950/40 rounded-2xl p-2.5 border border-slate-800/50 flex flex-col items-center">
          <Wind className="w-4 h-4 text-sky-400 mb-1" />
          <span className="text-[10px] font-bold uppercase text-slate-400">Wind</span>
          <span className="text-xs font-bold text-white mt-0.5">{windSpeed} mph</span>
        </div>

        <div className="bg-slate-950/40 rounded-2xl p-2.5 border border-slate-800/50 flex flex-col items-center">
          <TrendingUp className={`w-4 h-4 mb-1 ${elevation >= 0 ? 'text-amber-400' : 'text-emerald-400'}`} />
          <span className="text-[10px] font-bold uppercase text-slate-400">Elevation</span>
          <span className="text-xs font-bold text-white mt-0.5">{elevation > 0 ? `+${elevation}` : elevation} ft</span>
        </div>

        <div className="bg-slate-950/40 rounded-2xl p-2.5 border border-slate-800/50 flex flex-col items-center">
          <Compass className="w-4 h-4 text-purple-400 mb-1" />
          <span className="text-[10px] font-bold uppercase text-slate-400">Wind Dir</span>
          <span className="text-xs font-bold text-white mt-0.5">{windDir}°</span>
        </div>
      </div>

      {/* Bottom Banner: Recommended Club */}
      <div className="mt-3 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 rounded-2xl p-3 flex items-center justify-between">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-400">Smart Caddy Recommendation</p>
          <p className="text-lg font-black text-white mt-0.5">{recommendedClub}</p>
        </div>
        <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-black text-xs">
          AI
        </div>
      </div>

    </div>
  );
}