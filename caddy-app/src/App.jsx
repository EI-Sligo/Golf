import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import Auth from './components/Auth';
import HeroDistanceCard from './components/HeroDistanceCard';
import GolfMap from './components/GolfMap';
import ShotTrackerDrawer from './components/ShotTrackerDrawer';
import ScoreEntryModal from './components/ScoreEntryModal';
import FullScorecard from './components/FullScorecard';
import RoundHistory from './components/RoundHistory';
import ClubBagManager from './components/ClubBagManager';
import { useGolfStore } from './store/useGolfStore';
import { calculateYardage } from './utils/distance';
import { fetchLiveWeather, calculatePlaysLike, getRecommendedClub } from './utils/physics';
import { Menu, History, Briefcase } from 'lucide-react';

export default function App() {
  const [session, setSession] = useState(null);
  
  // UI State for Modals & Drawers
  const [isScoreModalOpen, setIsScoreModalOpen] = useState(false);
  const [isFullScorecardOpen, setIsFullScorecardOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isBagOpen, setIsBagOpen] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [pendingDistance, setPendingDistance] = useState(0);

  // User's custom bag storage
  const [bagClubs, setBagClubs] = useState([]);

  // Zustand Global State
  const { 
    activeHole, setActiveHole, scores, 
    currentLat, currentLng, setLocation,
    windSpeed, windDir, temperature, setWeather, elevation 
  } = useGolfStore();

  const pinLocation = [54.198594, -8.430418]; 

  // 1. Auth Listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  // 2. Fetch User's Club Bag from Supabase
  useEffect(() => {
    if (!session?.user) return;
    const fetchBag = async () => {
      const { data, error } = await supabase
        .from('bag_clubs')
        .select('*')
        .eq('user_id', session.user.id)
        .order('yardage', { ascending: false });
      
      if (!error && data) setBagClubs(data);
    };
    fetchBag();
  }, [session, isBagOpen]); // Re-fetch when bag modal closes

  // 3. Hardware GPS Tracker
  useEffect(() => {
    if (!navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => setLocation(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy),
      (err) => console.warn("GPS Error:", err),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [setLocation]);

  // 4. Auto-Fetch Local Weather when GPS is found
  useEffect(() => {
    if (currentLat && currentLng) {
      fetchLiveWeather(currentLat, currentLng).then(weather => {
        if (weather) {
          const speedMph = Math.round(weather.windspeed / 1.609);
          setWeather(speedMph, weather.winddirection, weather.temperature);
        }
      });
    }
  }, [currentLat, currentLng, setWeather]);

  // 5. Mathematics & Club Recommendation Engine
  const distanceToPin = currentLat && currentLng 
    ? calculateYardage(currentLat, currentLng, pinLocation[0], pinLocation[1])
    : "--";

  const truePlaysLike = calculatePlaysLike(
    distanceToPin, currentLat, currentLng, pinLocation[0], pinLocation[1], 
    windSpeed, windDir, temperature, elevation
  );

  const recommendedClub = getRecommendedClub(truePlaysLike, bagClubs);

  const handleStartShot = () => { 
    setIsTracking(true); 
    setPendingDistance(distanceToPin !== "--" ? distanceToPin : 215); 
  };

  const handleSaveShot = async (shotData) => {
    if (!session?.user) return;
    try {
      const { error } = await supabase.from('shots').insert([{
        user_id: session.user.id,
        hole_number: activeHole,
        club: shotData.club,
        distance: shotData.distance,
        accuracy: shotData.accuracy,
      }]);
      if (error) throw error;
      alert(`Shot saved successfully! (${shotData.club})`);
      setIsTracking(false);
    } catch (error) {
      alert("Failed to save shot.");
      console.error(error);
    }
  };

  if (!session) return <Auth />;

  const currentScore = scores[activeHole];

  return (
    <div className="min-h-screen bg-slate-950 p-4 font-sans max-w-md mx-auto pb-12 relative">
      
      {/* Header */}
      <header className="mb-4 flex items-center justify-between bg-slate-900/60 p-3 rounded-2xl border border-slate-800 shadow-sm">
        <button 
          onClick={() => setActiveHole(Math.max(1, activeHole - 1))} 
          className="px-3 py-1.5 rounded-xl bg-slate-800 text-xs font-bold text-slate-300 active:scale-95 transition-all"
        >
          &larr; Prev
        </button>
        
        <div className="text-center flex flex-col items-center">
          <h1 className="text-xl font-black text-white">Hole {activeHole}</h1>
          <button 
            onClick={() => setIsScoreModalOpen(true)}
            className={`mt-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider transition-colors ${
              currentScore ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            }`}
          >
            {currentScore ? `Score: ${currentScore.strokes}` : 'Enter Score'}
          </button>
        </div>

        <button 
          onClick={() => setActiveHole(Math.min(18, activeHole + 1))} 
          className="px-3 py-1.5 rounded-xl bg-slate-800 text-xs font-bold text-slate-300 active:scale-95 transition-all"
        >
          Next &rarr;
        </button>
      </header>

      {/* Map */}
      <GolfMap 
        userLocation={currentLat ? [currentLat, currentLng] : null} 
        pinLocation={pinLocation} 
      />

      {/* Dashboard with Dynamic Club Recommendation */}
      <HeroDistanceCard 
        distance={distanceToPin} 
        playsLike={truePlaysLike} 
        windSpeed={windSpeed}
        windDir={windDir} 
        elevation={elevation} 
        recommendedClub={recommendedClub}
      />

      {/* Shot Tracker */}
      <ShotTrackerDrawer 
        isTracking={isTracking} 
        pendingDistance={pendingDistance}
        onStartShot={handleStartShot} 
        onSaveShot={handleSaveShot} 
        onCancelShot={() => setIsTracking(false)}
      />

      {/* Floating Action Buttons */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-40">
        {/* Bag Manager Button */}
        <button
          onClick={() => setIsBagOpen(true)}
          className="w-12 h-12 bg-slate-800 border border-slate-700 rounded-full shadow-xl flex items-center justify-center text-amber-400 hover:bg-slate-700 active:scale-95 transition-all"
        >
          <Briefcase className="w-5 h-5" />
        </button>

        {/* History Button */}
        <button
          onClick={() => setIsHistoryOpen(true)}
          className="w-12 h-12 bg-slate-800 border border-slate-700 rounded-full shadow-xl flex items-center justify-center text-sky-400 hover:bg-slate-700 active:scale-95 transition-all"
        >
          <History className="w-5 h-5" />
        </button>

        {/* Scorecard Button */}
        <button
          onClick={() => setIsFullScorecardOpen(true)}
          className="w-14 h-14 bg-emerald-500 text-slate-950 rounded-full shadow-2xl flex items-center justify-center hover:bg-emerald-400 active:scale-95 transition-all"
        >
          <Menu className="w-6 h-6 stroke-[2.5]" />
        </button>
      </div>

      {/* Modals & Views */}
      <ScoreEntryModal 
        isOpen={isScoreModalOpen} 
        onClose={() => setIsScoreModalOpen(false)} 
      />
      
      <FullScorecard 
        isOpen={isFullScorecardOpen}
        onClose={() => setIsFullScorecardOpen(false)}
      />

      <RoundHistory 
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
      />

      <ClubBagManager 
        isOpen={isBagOpen}
        onClose={() => setIsBagOpen(false)}
      />
    </div>
  );
}