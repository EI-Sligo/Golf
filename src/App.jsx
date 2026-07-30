import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
import { useGolfStore } from './store/useGolfStore';
import { courseData } from './lib/courseData';
import { calculateDistance } from './lib/golfMath';

// Components
import Auth from './components/Auth';
import HeroDistanceCard from './components/HeroDistanceCard';
import GolfMap from './components/GolfMap';
import ClubBagManager from './components/ClubBagManager';
import FullScorecard from './components/FullScorecard';
import DispersionAnalytics from './components/DispersionAnalytics';
import RoundHistory from './components/RoundHistory';
import SwingThoughtsRules from './components/SwingThoughtsRules';
import ScoreEntryModal from './components/ScoreEntryModal';
import ShotTrackerDrawer from './components/ShotTrackerDrawer';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('play');
  
  const [newRoundCourse, setNewRoundCourse] = useState('Castle Dargan Golf Club');
  const [customCourseName, setCustomCourseName] = useState('');
  
  const { currentRoundId, currentLat, currentLng, activeHole, setLocation, setActiveHole, setMapTarget } = useGolfStore();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) useGolfStore.getState().fetchInitialData(currentUser.id);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        useGolfStore.getState().fetchInitialData(currentUser.id);
      } else {
        useGolfStore.setState({ clubs: [], rounds: [], activeRound: null }); 
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Native GPS Tracker
  useEffect(() => {
    let watchId;
    const startNativeTracking = async () => {
      try {
        if (Capacitor.isNativePlatform()) {
          const permissions = await Geolocation.checkPermissions();
          if (permissions.location !== 'granted') await Geolocation.requestPermissions();
        }

        watchId = await Geolocation.watchPosition(
          { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 },
          (position, err) => {
            if (!err && position) {
              setLocation(position.coords.latitude, position.coords.longitude, position.coords.accuracy);
            }
          }
        );
      } catch (error) {
        console.error("Geolocation init error:", error);
      }
    };
    if (user) startNativeTracking();
    return () => { if (watchId) Geolocation.clearWatch({ id: watchId }); };
  }, [user, setLocation]);

  // NEW: Geofencing Auto-Hole Advancement
  useEffect(() => {
    if (currentLat && currentLng && activeHole < 18) {
      const nextHole = courseData[activeHole + 1];
      if (nextHole && nextHole.tees && nextHole.tees[0]) {
        const distToNextTee = calculateDistance(currentLat, currentLng, nextHole.tees[0].lat, nextHole.tees[0].lng);
        // If user walks within 25 yards of the NEXT tee box, auto-advance the hole
        if (distToNextTee < 25) {
          setActiveHole(activeHole + 1);
          setMapTarget(null); 
        }
      }
    }
  }, [currentLat, currentLng, activeHole, setActiveHole, setMapTarget]);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'play':
        if (!currentRoundId) {
          return (
            <div className="bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-700">
              <h2 className="text-2xl font-bold text-emerald-400 mb-2 text-center">Ready to Golf?</h2>
              <p className="text-slate-400 text-center mb-6 text-sm">Start a round to enable GPS tracking and shot logging.</p>
              
              <form onSubmit={async (e) => {
                e.preventDefault();
                const finalCourseName = newRoundCourse === 'Other' ? customCourseName : newRoundCourse;
                if (!finalCourseName) return;

                const { data: { user } } = await supabase.auth.getUser();
                // We create the row in the DB immediately. 
                const { data } = await supabase.from('rounds').insert([{ user_id: user.id, course_name: finalCourseName }]).select();
                
                if (data) {
                  useGolfStore.getState().setRoundId(data[0].id);
                  useGolfStore.setState(state => ({ rounds: [data[0], ...state.rounds] }));
                }
              }} className="space-y-4">
                
                <select 
                  value={newRoundCourse} 
                  onChange={(e) => setNewRoundCourse(e.target.value)}
                  className="w-full bg-slate-900 p-4 rounded-xl text-white border border-slate-700 focus:border-emerald-500 focus:outline-none appearance-none"
                >
                  <option value="Castle Dargan Golf Club">Castle Dargan Golf Club</option>
                  <option value="Other">Other Course...</option>
                </select>

                {newRoundCourse === 'Other' && (
                  <input 
                    type="text" placeholder="Enter Course Name" required 
                    value={customCourseName} onChange={(e) => setCustomCourseName(e.target.value)}
                    className="w-full bg-slate-900 p-4 rounded-xl text-white border border-slate-700 focus:border-emerald-500 focus:outline-none" 
                  />
                )}

                <button type="submit" className="w-full bg-emerald-500 text-slate-900 font-bold py-4 rounded-xl hover:bg-emerald-400 transition-colors">
                  Tee Off
                </button>
              </form>
            </div>
          );
        }
        
        return (
          <div className="space-y-6">
            <HeroDistanceCard />
            <GolfMap />
            <ShotTrackerDrawer />
            <FullScorecard />
          </div>
        );
      case 'bag': return <div className="space-y-6"><ClubBagManager /><DispersionAnalytics /></div>;
      case 'history': return <div className="space-y-6"><RoundHistory /></div>;
      case 'guides': return <div className="space-y-6"><SwingThoughtsRules /></div>;
      default: return null;
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen bg-slate-900 text-white"><div className="animate-pulse">Loading Golf Caddy...</div></div>;
  if (!user) return <Auth />;

  return (
    <div className="min-h-screen bg-slate-900 text-white pb-20">
      <header className="p-4 bg-slate-800 shadow-md flex justify-between items-center sticky top-0 z-40">
        <h1 className="text-xl font-bold text-emerald-400">Golf Caddy</h1>
        <button onClick={() => supabase.auth.signOut()} className="text-sm font-semibold text-slate-300 hover:text-white bg-slate-700 px-3 py-1 rounded transition-colors">Sign Out</button>
      </header>

      <main className="max-w-md mx-auto p-4">
        {renderTabContent()}
      </main>

      <ScoreEntryModal />

      <nav className="fixed bottom-0 w-full bg-slate-800 border-t border-slate-700 flex justify-around z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
        {['play', 'bag', 'history', 'guides'].map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)} 
            className={`flex-1 py-4 text-center transition-colors ${activeTab === tab ? 'text-emerald-400 border-t-2 border-emerald-400 bg-slate-800/50' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <span className="text-sm font-bold capitalize">
              {tab === 'play' ? '⛳ Play' : tab === 'bag' ? '🎒 Bag' : tab === 'history' ? '📊 Stats' : '🏌️ Rules'}
            </span>
          </button>
        ))}
      </nav>
    </div>
  );
}

export default App;