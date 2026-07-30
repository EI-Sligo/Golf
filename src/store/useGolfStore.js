import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';

export const useGolfStore = create(
  persist(
    (set, get) => ({
      activeHole: 1,
      scores: {}, 
      isScoreModalOpen: false,
      userHandicap: 18,
      
      currentLat: null,
      currentLng: null,
      gpsAccuracy: null,
      
      windSpeed: 0,
      windDir: 0,
      temperature: 15,
      elevation: 0,
      isFetchingWeather: false,
      
      currentRoundId: null,
      clubs: [],
      rounds: [],
      shots: [],
      mapTarget: null,
      activeShot: null,

      setActiveHole: (hole) => set({ activeHole: hole }),
      setScoreModalOpen: (isOpen) => set({ isScoreModalOpen: isOpen }),
      setUserHandicap: (hdcp) => set({ userHandicap: hdcp }),
      
      setScore: (hole, strokes, putts, fairway) => set((state) => ({ 
        scores: { 
          ...state.scores, 
          [hole]: { strokes, putts, fairway } 
        } 
      })),
      
      setLocation: (lat, lng, accuracy) => set({ 
        currentLat: lat, 
        currentLng: lng, 
        gpsAccuracy: accuracy 
      }),
      
      setWindSpeed: (speed) => set({ windSpeed: speed }),
      setWindDir: (dir) => set({ windDir: dir }),
      setElevation: (elev) => set({ elevation: elev }),
      setRoundId: (id) => set({ currentRoundId: id }),
      
      clearRound: () => set({ 
        currentRoundId: null, 
        scores: {}, 
        activeHole: 1 
      }),
      
      setMapTarget: (target) => set({ mapTarget: target }),
      startTrackingShot: (shotData) => set({ activeShot: shotData }),
      endTrackingShot: () => set({ activeShot: null, mapTarget: null }),

      // OPEN-METEO API INTEGRATION (No API Key Required)
      fetchLiveConditions: async () => {
        const state = get();
        if (!state.currentLat) {
          return alert("Waiting for GPS signal...");
        }
        
        set({ isFetchingWeather: true });
        
        try {
          const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${state.currentLat}&longitude=${state.currentLng}&current=temperature_2m,wind_speed_10m,wind_direction_10m&elevation=nan&wind_speed_unit=mph`);
          const data = await res.json();
          
          set({
            windSpeed: Math.round(data.current.wind_speed_10m),
            windDir: data.current.wind_direction_10m,
            temperature: Math.round(data.current.temperature_2m),
            elevation: Math.round(data.elevation * 3.28084), // Convert Meters to Feet
            isFetchingWeather: false
          });
        } catch (error) {
          console.error("Weather Fetch Error: ", error);
          set({ isFetchingWeather: false });
        }
      },

      fetchInitialData: async (userId) => {
        try {
          const { data: clubsData } = await supabase.from('clubs').select('*').eq('user_id', userId);
          const { data: roundsData } = await supabase.from('rounds').select('*').eq('user_id', userId).order('created_at', { ascending: false });
          const { data: shotsData } = await supabase.from('shots').select('*').eq('user_id', userId);
          
          set({ 
            clubs: clubsData || [], 
            rounds: roundsData || [], 
            shots: shotsData || [] 
          });
        } catch (error) { 
          console.error("Fetch error:", error); 
        }
      },

      deleteClub: async (id) => {
        const { error } = await supabase.from('clubs').delete().eq('id', id);
        if (!error) {
          set((state) => ({ 
            clubs: state.clubs.filter((c) => c.id !== id) 
          }));
        }
      },

      deleteRound: async (id) => {
        const { error } = await supabase.from('rounds').delete().eq('id', id);
        if (!error) {
          set((state) => ({ 
            rounds: state.rounds.filter((r) => r.id !== id),
            currentRoundId: state.currentRoundId === id ? null : state.currentRoundId
          }));
        }
      },

      finishRound: async () => {
        const state = get();
        if (!state.currentRoundId) return;

        let total = 0;
        Object.values(state.scores).forEach(s => { 
          if (s.strokes) total += s.strokes; 
        });

        const { error } = await supabase
          .from('rounds')
          .update({ total_score: total, scorecard: state.scores })
          .eq('id', state.currentRoundId);

        if (!error) {
          set((state) => ({
            rounds: state.rounds.map(r => 
              r.id === state.currentRoundId 
                ? { ...r, total_score: total, scorecard: state.scores } 
                : r
            ),
            currentRoundId: null, 
            scores: {}, 
            activeHole: 1, 
            activeShot: null, 
            mapTarget: null
          }));
        } else {
          alert("Offline Mode: Data saved locally. Will sync when connection is restored.");
        }
      }
    }),
    {
      name: 'golf-caddy-storage',
      partialize: (state) => ({ 
        clubs: state.clubs, 
        rounds: state.rounds, 
        shots: state.shots, 
        currentRoundId: state.currentRoundId, 
        activeHole: state.activeHole, 
        scores: state.scores, 
        userHandicap: state.userHandicap 
      })
    }
  )
);