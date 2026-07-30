import React, { useState } from 'react';
import { useGolfStore } from '../store/useGolfStore';
import { supabase } from '../lib/supabase';
import { calculateDistance } from '../lib/golfMath';
import { courseData } from '../lib/courseData';

export default function ShotTrackerDrawer() {
  const { 
    currentLat, 
    currentLng, 
    activeShot, 
    startTrackingShot, 
    endTrackingShot, 
    saveTrackedShot,
    clubs, 
    currentRoundId, 
    activeHole, 
    mapTarget 
  } = useGolfStore();
  
  const [selectedClub, setSelectedClub] = useState('');

  // Live walking distance calculation
  const liveDistance = (activeShot && currentLat)
    ? calculateDistance(activeShot.startLat, activeShot.startLng, currentLat, currentLng)
    : 0;

  const handleStart = () => {
    if (!selectedClub) return alert('Please select a club to track.');
    if (!currentLat) return alert('Waiting for GPS lock...');

    const hole = courseData[activeHole];
    const targetLat = mapTarget ? mapTarget.lat : hole?.pin?.lat;
    const targetLng = mapTarget ? mapTarget.lng : hole?.pin?.lng;

    startTrackingShot({
      startLat: currentLat,
      startLng: currentLng,
      targetLat: targetLat,
      targetLng: targetLng,
      club_id: selectedClub
    });
  };

  const handleEnd = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const selectedClubObj = clubs.find(c => c.id === activeShot.club_id);
    const clubName = selectedClubObj ? selectedClubObj.name : 'Unknown Club';

    // Construct the payload exactly as the database expects it
    const shotPayload = {
      user_id: user.id,
      round_id: currentRoundId,
      hole_number: activeHole,
      club_id: activeShot.club_id,
      club: clubName,
      start_lat: activeShot.startLat,
      start_lng: activeShot.startLng,
      target_lat: activeShot.targetLat,
      target_lng: activeShot.targetLng,
      lat: currentLat,
      lng: currentLng,
      distance: liveDistance
    };

    // Pass to the store for optimistic UI & background sync
    saveTrackedShot(shotPayload);
    
    endTrackingShot();
    setSelectedClub('');
  };

  if (!currentRoundId) return null;

  return (
    <div className="bg-slate-800 p-5 rounded-2xl shadow-lg border border-slate-700">
      <h3 className="text-lg font-bold text-emerald-400 mb-4">Shot Tracker</h3>
      
      {!activeShot ? (
        <div className="space-y-4">
          <select 
            value={selectedClub} 
            onChange={(e) => setSelectedClub(e.target.value)}
            className="w-full bg-slate-900 p-3 rounded-xl text-white border border-slate-700 focus:border-emerald-500 focus:outline-none"
          >
            <option value="">Select Club</option>
            {clubs.map(club => (
              <option key={club.id} value={club.id}>{club.name}</option>
            ))}
          </select>
          
          <button 
            onClick={handleStart}
            className="w-full bg-emerald-500 text-slate-900 font-bold py-3 rounded-xl hover:bg-emerald-400 transition-colors"
          >
            Mark Shot Start
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-slate-900 p-6 rounded-xl border border-slate-700 text-center">
            <p className="text-emerald-400 font-bold mb-2">Tracking Shot...</p>
            <p className="text-slate-400 text-sm mb-4">Walk to your ball to record distance.</p>
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-5xl font-black text-white">{liveDistance}</span>
              <span className="text-slate-400 font-bold">yds</span>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button 
              onClick={endTrackingShot}
              className="flex-1 bg-slate-700 text-white font-bold py-3 rounded-xl hover:bg-slate-600 transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleEnd}
              className="flex-[2] bg-emerald-500 text-slate-900 font-bold py-3 rounded-xl hover:bg-emerald-400 transition-colors"
            >
              Record Shot End
            </button>
          </div>
        </div>
      )}
    </div>
  );
}