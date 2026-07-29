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
import DispersionAnalytics from './components/DispersionAnalytics';
import SwingThoughtsRules from './components/SwingThoughtsRules';
import { useGolfStore } from './store/useGolfStore';
import { calculateYardage } from './utils/distance';
import { fetchLiveWeather, calculatePlaysLike, getRecommendedClub } from './utils/physics';
import { castleDargan } from './data/castleDargan';
import { Menu, History, Briefcase, Target, Book, ClipboardList, X, PlayCircle } from 'lucide-react';
import { Geolocation } from '@capacitor/geolocation';

export default function App() {
  const [session, setSession] = useState(null);
  
  const [isScoreModalOpen, setIsScoreModalOpen] = useState(false);
  const [isFullScorecardOpen, setIsFullScorecardOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isBagOpen, setIsBagOpen] = useState(false);
  const [isDispersionOpen, setIsDispersionOpen] = useState(false);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [isFabOpen, setIsFabOpen] = useState(false);

  const [bagClubs, setBagClubs] = useState([]);

  const { 
    activeHole, setActiveHole, scores, 
    currentLat, currentLng, setLocation,
    windSpeed, windDir, temperature, setWeather, elevation,
    currentRoundId, setRoundId, clearRound
  } = useGolfStore();

  const currentHoleData = castleDargan[activeHole - 1];
  const pinLocation = [currentHoleData.lat, currentHoleData.lng]; 

  // 3. Native Hardware GPS Tracker (Capacitor)
  useEffect(() => {
    let watchId;

    const startNativeTracking = async () => {
      try {
        // Native apps require explicit permission checks
        const permissions = await Geolocation.checkPermissions();
        if (permissions.location !== 'granted') {
          await Geolocation.requestPermissions();
        }

        // Tap directly into the device's GPS chip
        watchId = await Geolocation.watchPosition(
          { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 },
          (position, err) => {
            if (err) {
              console.warn("Native GPS Error:", err);
              return;
            }
            if (position) {
              setLocation(
                position.coords.latitude, 
                position.coords.longitude, 
                position.coords.accuracy
              );
            }
          }
        );
      } catch (error) {
        console.error("Geolocation init error:", error);
      }
    };

    startNativeTracking();

    // Cleanup the watcher when the app closes
    return () => {
      if (watchId) {
        Geolocation.clearWatch({ id: watchId });
      }
    };
  }, [setLocation]);

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
  }, [session, isBagOpen]);

  useEffect(() => {
    if (!navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => setLocation(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy),
      (err) => console.warn("GPS Error:", err),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [setLocation]);

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

  const distanceToPin = currentLat && currentLng 
    ? calculateYardage(currentLat, currentLng, pinLocation[0], pinLocation[1])
    : "--";

  const truePlaysLike = calculatePlaysLike(
    distanceToPin, currentLat, currentLng, pinLocation[0], pinLocation[1], 
    windSpeed, windDir, temperature, elevation
  );

  const recommendedClub = getRecommendedClub(truePlaysLike, bagClubs);

  const handleStartRound = async () => {
    if (!session?.user) return;
    try {
      const { data, error } = await supabase.from('rounds').insert([{
        user_id: session.user.id,
        course_name: 'Castle Dargan'
      }]).select().single();
      
      if (error) throw error;
      setRoundId(data.id);
    } catch (err) {
      alert("Failed to start round: " + err.message);
    }
  };

  const handleSaveShot = async (shotData) => {
    if (!session?.user) return;
    try {
      const { error } = await supabase.from('shots').insert([{
        user_id: session.user.id,
        round_id: currentRoundId, // Will be null if practice shot, which is now allowed
        hole_number: activeHole,
        club: shotData.club,
        distance: shotData.distance,
        accuracy: shotData.accuracy,
      }]);
      if (error) throw error;
      alert(`Shot saved successfully! (${shotData.distance}yds with ${shotData.club})`);
      setIsTracking(false);
    } catch (error) {
      alert("Database Error: " + error.message);
      console.error("Full Error:", JSON.stringify(error, null, 2));
    }
  };

  if (!session) return <Auth />;

  const currentScore = scores[activeHole];

  return (
    <div className="min-h-screen bg-slate-950 p-4 font-sans max-w-md mx-auto pb-12 relative">
      
      {/* Header */}
      <header className="mb-4 bg-slate-900/60 p-3 rounded-2xl border border-slate-800 shadow-sm">
        {!currentRoundId ? (
          <div className="flex flex-col items-center justify-center py-2">
            <p className="text-slate-400 text-xs font-bold mb-2">Ready to play Castle Dargan?</p>
            <button onClick={handleStartRound} className="flex items-center gap-2 bg-emerald-500 text-slate-950 px-6 py-2 rounded-full font-black text-sm hover:bg-emerald-400 transition-colors">
              <PlayCircle className="w-4 h-4" /> Start Official Round
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <button 
              onClick={() => setActiveHole(Math.max(1, activeHole - 1))} 
              className="px-3 py-1.5 rounded-xl bg-slate-800 text-xs font-bold text-slate-300 active:scale-95 transition-all"
            >
              &larr; Prev
            </button>
            
            <div className="text-center flex flex-col items-center">
              <h1 className="text-xl font-black text-white">Hole {activeHole}</h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">
                Par {currentHoleData.par} <span className="text-slate-600 mx-1">•</span> Index {currentHoleData.index}
              </p>
              <button 
                onClick={() => setIsScoreModalOpen(true)}
                className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider transition-colors ${
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
          </div>
        )}
      </header>

      {/* Map */}
      <GolfMap userLocation={currentLat ? [currentLat, currentLng] : null} pinLocation={pinLocation} />

      {/* Dashboard */}
      <HeroDistanceCard 
        distance={distanceToPin} 
        playsLike={truePlaysLike} 
        windSpeed={windSpeed}
        windDir={windDir} 
        elevation={elevation} 
        recommendedClub={recommendedClub}
      />

      <div className="mt-4">
        <button 
          onClick={() => setIsTracking(true)}
          className="w-full py-4 bg-sky-500/10 border border-sky-500/30 text-sky-400 font-black rounded-2xl text-lg flex items-center justify-center gap-2 hover:bg-sky-500/20 transition-colors"
        >
          <Target className="w-5 h-5" />
          Track GPS Shot
        </button>
      </div>

      {/* Shot Tracker */}
      <ShotTrackerDrawer 
        isTracking={isTracking} 
        onStartShot={() => setIsTracking(true)} 
        onSaveShot={handleSaveShot} 
        onCancelShot={() => setIsTracking(false)}
      />

      {/* Floating Action Buttons (Collapsible Speed Dial) */}
      <div className="fixed bottom-6 right-6 flex flex-col items-end gap-3 z-40">
        <div className={`flex flex-col items-end gap-3 transition-all duration-300 origin-bottom ${isFabOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-50 opacity-0 translate-y-10 pointer-events-none'}`}>
          <button onClick={() => { setIsNotesOpen(true); setIsFabOpen(false); }} className="w-12 h-12 bg-slate-800 border border-slate-700 rounded-full shadow-xl flex items-center justify-center text-purple-400 hover:bg-slate-700 active:scale-95 transition-all">
            <Book className="w-5 h-5" />
          </button>
          <button onClick={() => { setIsDispersionOpen(true); setIsFabOpen(false); }} className="w-12 h-12 bg-slate-800 border border-slate-700 rounded-full shadow-xl flex items-center justify-center text-rose-400 hover:bg-slate-700 active:scale-95 transition-all">
            <Target className="w-5 h-5" />
          </button>
          <button onClick={() => { setIsBagOpen(true); setIsFabOpen(false); }} className="w-12 h-12 bg-slate-800 border border-slate-700 rounded-full shadow-xl flex items-center justify-center text-amber-400 hover:bg-slate-700 active:scale-95 transition-all">
            <Briefcase className="w-5 h-5" />
          </button>
          <button onClick={() => { setIsHistoryOpen(true); setIsFabOpen(false); }} className="w-12 h-12 bg-slate-800 border border-slate-700 rounded-full shadow-xl flex items-center justify-center text-sky-400 hover:bg-slate-700 active:scale-95 transition-all">
            <History className="w-5 h-5" />
          </button>
          <button onClick={() => { setIsFullScorecardOpen(true); setIsFabOpen(false); }} className="w-12 h-12 bg-emerald-500 border border-emerald-400 rounded-full shadow-xl flex items-center justify-center text-slate-950 hover:bg-emerald-400 active:scale-95 transition-all">
            <ClipboardList className="w-5 h-5" />
          </button>
        </div>
        <button onClick={() => setIsFabOpen(!isFabOpen)} className="w-14 h-14 bg-emerald-500 text-slate-950 rounded-full shadow-2xl flex items-center justify-center hover:bg-emerald-400 active:scale-95 transition-all z-50">
          {isFabOpen ? <X className="w-6 h-6 stroke-[2.5]" /> : <Menu className="w-6 h-6 stroke-[2.5]" />}
        </button>
      </div>

      {/* Modals & Views */}
      <ScoreEntryModal isOpen={isScoreModalOpen} onClose={() => setIsScoreModalOpen(false)} />
      <FullScorecard isOpen={isFullScorecardOpen} onClose={() => setIsFullScorecardOpen(false)} />
      <RoundHistory isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} />
      <ClubBagManager isOpen={isBagOpen} onClose={() => setIsBagOpen(false)} />
      <DispersionAnalytics isOpen={isDispersionOpen} onClose={() => setIsDispersionOpen(false)} />
      <SwingThoughtsRules isOpen={isNotesOpen} onClose={() => setIsNotesOpen(false)} />
    </div>
  );
}