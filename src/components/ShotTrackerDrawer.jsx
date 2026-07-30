import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useGolfStore } from '../store/useGolfStore';
import { calculateDistance, calculateDispersion } from '../lib/golfMath';

export default function ShotTrackerDrawer() {
  const { currentLat, currentLng, mapTarget, activeShot, startTrackingShot, endTrackingShot, clubs, currentRoundId } = useGolfStore();
  const [selectedClub, setSelectedClub] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleStartShot = () => {
    if (!currentLat) {
      alert("GPS is still locating you. Please wait a moment.");
      return;
    }
    if (!mapTarget) {
      alert("Please tap the map to select a target line first.");
      return;
    }
    if (!selectedClub) {
      alert("Please select a club.");
      return;
    }

    startTrackingShot({
      startLat: currentLat,
      startLng: currentLng,
      targetLat: mapTarget.lat,
      targetLng: mapTarget.lng,
      clubId: selectedClub
    });
  };

  const handleEndShot = async () => {
    if (!currentLat) return;
    setIsProcessing(true);

    const distance = calculateDistance(activeShot.startLat, activeShot.startLng, currentLat, currentLng);
    const offline = calculateDispersion(activeShot.startLat, activeShot.startLng, activeShot.targetLat, activeShot.targetLng, currentLat, currentLng);

    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase.from('shots').insert([{
      user_id: user.id,
      round_id: currentRoundId,
      club_id: activeShot.clubId,
      distance: distance,
      offline_yards: offline,
      lat: activeShot.startLat,
      lng: activeShot.startLng
    }]).select();

    if (error) {
      alert("Error saving shot: " + error.message);
    } else {
      useGolfStore.setState((state) => ({ shots: [...state.shots, data[0]] }));
      
      const dirText = offline > 0 ? 'Right' : offline < 0 ? 'Left' : 'Dead Center';
      alert(`Shot recorded!\nDistance: ${distance} yards\nDispersion: ${Math.abs(offline)} yards ${dirText}`);
      
      endTrackingShot();
      setSelectedClub('');
    }
    setIsProcessing(false);
  };

  if (!currentRoundId) return null;

  return (
    <div className="bg-slate-800 p-5 rounded-2xl shadow-lg border border-slate-700">
      <h2 className="text-xl font-bold text-emerald-400 mb-4">Shot Tracker</h2>
      
      {!activeShot ? (
        <div className="space-y-4">
          <select 
            className="w-full bg-slate-900 p-3 rounded-lg text-white border border-slate-600 focus:border-emerald-500 focus:outline-none"
            value={selectedClub} onChange={(e) => setSelectedClub(e.target.value)}
          >
            <option value="" disabled>Select Club</option>
            {clubs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button 
            onClick={handleStartShot}
            className="w-full bg-emerald-500 text-slate-900 font-bold py-3 rounded-lg hover:bg-emerald-400 transition-colors"
          >
            Mark Shot Start
          </button>
        </div>
      ) : (
        <div className="space-y-4 text-center">
          <div className="p-4 bg-slate-900 rounded-xl border border-emerald-500/30">
            <p className="text-emerald-400 font-bold animate-pulse">Tracking Shot...</p>
            <p className="text-sm text-slate-400 mt-1">Walk to your ball to record distance.</p>
            {currentLat && (
                <p className="text-2xl font-black text-white mt-3">
                    {calculateDistance(activeShot.startLat, activeShot.startLng, currentLat, currentLng)} <span className="text-sm text-slate-400 font-normal">yds</span>
                </p>
            )}
          </div>
          <div className="flex gap-3">
            <button 
              onClick={endTrackingShot}
              className="w-1/3 bg-slate-700 text-white font-bold py-3 rounded-lg hover:bg-slate-600 transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleEndShot} disabled={isProcessing}
              className="w-2/3 bg-emerald-500 text-slate-900 font-bold py-3 rounded-lg hover:bg-emerald-400 transition-colors disabled:opacity-50"
            >
              {isProcessing ? 'Saving...' : 'Record Shot End'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}