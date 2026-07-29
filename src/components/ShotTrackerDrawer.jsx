import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Save, X } from 'lucide-react';
import { useGolfStore } from '../store/useGolfStore';
import { calculateYardage } from '../utils/distance';

export default function ShotTrackerDrawer({ isTracking, onSaveShot, onCancelShot }) {
  const { currentLat, currentLng, gpsAccuracy } = useGolfStore();
  const [startPos, setStartPos] = useState(null);
  const [walkedDistance, setWalkedDistance] = useState(0);
  const [club, setClub] = useState('Driver');
  const [accuracy, setAccuracy] = useState('Center');

  const clubs = ['Driver', '3 Wood', '4 Hybrid', '4 Iron', '5 Iron', '6 Iron', '7 Iron', '8 Iron', '9 Iron', 'PW', 'GW', 'SW', 'LW'];
  const accuracies = ['Left', 'Center', 'Right', 'Short', 'Long'];

  // Calculate distance with a noise filter to eliminate GPS drift/jitter
  useEffect(() => {
    if (startPos && currentLat && currentLng) {
      const rawDist = calculateYardage(startPos.lat, startPos.lng, currentLat, currentLng);
      // Noise filter: Ignore micro-movements under 5 yards caused by phone GPS drifting
      const filteredDist = rawDist < 5 ? 0 : rawDist;
      setWalkedDistance(filteredDist);
    }
  }, [currentLat, currentLng, startPos]);

  useEffect(() => {
    if (!isTracking) {
      setStartPos(null);
      setWalkedDistance(0);
    }
  }, [isTracking]);

  if (!isTracking) return null;

  const handleMarkStart = () => {
    if (currentLat && currentLng) {
      setStartPos({ lat: currentLat, lng: currentLng });
    } else {
      alert("Acquiring GPS signal... Please ensure location services are enabled.");
    }
  };

  const handleSave = () => {
    onSaveShot({ club, distance: walkedDistance, accuracy });
    setStartPos(null);
    setWalkedDistance(0);
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800 rounded-t-3xl p-6 animate-in slide-in-from-bottom-full duration-300 shadow-[0_-15px_50px_rgba(0,0,0,0.8)]">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-xl font-black text-white">Shot Tracker</h3>
          <p className="text-sky-400 font-bold text-xs uppercase tracking-wider">Walk to your ball</p>
        </div>
        <button onClick={onCancelShot} className="p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      {!startPos ? (
        <div className="space-y-3">
          <button 
            onClick={handleMarkStart}
            className="w-full py-4 bg-sky-500 hover:bg-sky-400 text-slate-950 font-black rounded-2xl text-lg flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-lg shadow-sky-500/20"
          >
            <MapPin className="w-5 h-5" />
            Mark Start Location (At Ball)
          </button>
          {gpsAccuracy && (
            <p className="text-center text-[10px] text-slate-500 font-medium">
              GPS Signal Accuracy: ~{Math.round(gpsAccuracy)}m
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-5">
          <div className="bg-slate-950 rounded-2xl p-5 text-center border border-slate-800 relative overflow-hidden shadow-inner">
            <div className="absolute inset-0 bg-sky-500/5 animate-pulse"></div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Distance to Ball</p>
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-5xl font-black text-white">{walkedDistance}</span>
              <span className="text-sky-400 font-bold text-sm">yds</span>
            </div>
            <p className="text-[10px] text-emerald-400 mt-2 flex items-center justify-center gap-1 font-semibold">
              <Navigation className="w-3 h-3 animate-spin" /> Live tracking active... walk to ball
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Club Used</label>
              <select 
                value={club} 
                onChange={(e) => setClub(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white text-sm focus:border-sky-500 focus:outline-none"
              >
                {clubs.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Result</label>
              <select 
                value={accuracy} 
                onChange={(e) => setAccuracy(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white text-sm focus:border-sky-500 focus:outline-none"
              >
                {accuracies.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          </div>

          <button 
            onClick={handleSave}
            className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-2xl text-lg flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-lg shadow-emerald-500/20"
          >
            <Save className="w-5 h-5" />
            Save Shot to Analytics
          </button>
        </div>
      )}
    </div>
  );
}