import React, { useState } from 'react';
import { Target, Flag, CircleCheck, AlertTriangle, X } from 'lucide-react';

export default function ShotTrackerDrawer({
  isTracking,
  pendingDistance,
  clubs = ["Driver", "3 Wood", "4 Hybrid", "5 Iron", "7 Iron", "8 Iron", "9 Iron", "PW", "SW", "Putter"],
  onStartShot,
  onSaveShot,
  onCancelShot
}) {
  const [selectedClub, setSelectedClub] = useState(clubs[0] || 'Driver');
  const [selectedAccuracy, setSelectedAccuracy] = useState('Fairway');

  const accuracyOptions = [
    { id: 'Fairway', label: 'Fairway / Target', icon: Target, color: 'border-emerald-500 text-emerald-400 bg-emerald-500/10' },
    { id: 'Left Rough', label: 'Left Miss', icon: AlertTriangle, color: 'border-amber-500 text-amber-400 bg-amber-500/10' },
    { id: 'Right Rough', label: 'Right Miss', icon: AlertTriangle, color: 'border-amber-500 text-amber-400 bg-amber-500/10' },
    { id: 'Green', label: 'On Green', icon: CircleCheck, color: 'border-sky-500 text-sky-400 bg-sky-500/10' },
  ];

  return (
    <div className="w-full mt-4">
      {!isTracking ? (
        // Start Shot Button
        <button
          onClick={onStartShot}
          className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-slate-950 font-black text-lg shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
        >
          <Flag className="w-5 h-5 stroke-[2.5]" />
          Start Tracking Shot
        </button>
      ) : (
        // Slide-Up Card overlay when shot is active
        <div className="w-full rounded-2xl bg-slate-900 border border-slate-700/80 p-5 shadow-2xl animate-in slide-in-from-bottom duration-300">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <h3 className="font-bold text-lg text-white">Shot Recorded</h3>
            <button 
              onClick={onCancelShot}
              className="text-slate-400 hover:text-rose-400 p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Measured Distance Header */}
          <div className="text-center my-3 bg-slate-950 py-3 rounded-xl border border-slate-800">
            <span className="text-xs uppercase font-bold text-slate-400">Tracked Distance</span>
            <p className="text-4xl font-black text-emerald-400">{pendingDistance} <span className="text-sm font-bold text-slate-400">YDS</span></p>
          </div>

          {/* Club Selection Grid */}
          <div className="mb-4">
            <label className="text-xs font-bold uppercase text-slate-400 mb-2 block">Club Used</label>
            <select
              value={selectedClub}
              onChange={(e) => setSelectedClub(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-3 font-semibold text-sm focus:outline-none focus:border-emerald-500"
            >
              {clubs.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Tactile Outcome Buttons */}
          <div className="mb-5">
            <label className="text-xs font-bold uppercase text-slate-400 mb-2 block">Shot Outcome</label>
            <div className="grid grid-cols-2 gap-2">
              {accuracyOptions.map((opt) => {
                const Icon = opt.icon;
                const isSelected = selectedAccuracy === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => setSelectedAccuracy(opt.id)}
                    className={`flex items-center gap-2 p-3 rounded-xl border font-bold text-xs transition-all ${
                      isSelected 
                        ? opt.color 
                        : 'border-slate-800 bg-slate-950/50 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => onSaveShot({ club: selectedClub, accuracy: selectedAccuracy, distance: pendingDistance })}
              className="flex-1 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-md transition-all"
            >
              Save Shot
            </button>
            <button
              onClick={onCancelShot}
              className="py-3.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm transition-all"
            >
              Discard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}