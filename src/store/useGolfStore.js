import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';

export const useGolfStore = create(
  persist(
    (set, get) => ({
      activeHole: 1,
      scores: {}, 
      isScoreModalOpen: false,
      
      currentLat: null,
      currentLng: null,
      gpsAccuracy: null,
      
      // Weather / Conditions
      windSpeed: 0,
      windDir: 0,
      temperature: 15,
      elevation: 0,
      
      currentRoundId: null,

      clubs: [],
      rounds: [],
      shots: [],
      mapTarget: null,
      activeShot: null,

      setActiveHole: (hole) => set({ activeHole: hole }),
      setScoreModalOpen: (isOpen) => set({ isScoreModalOpen: isOpen }),
      setScore: (hole, strokes, putts, fairway) => set((state) => ({ 
        scores: { ...state.scores, [hole]: { strokes, putts, fairway } } 
      })),
      
      setLocation: (lat, lng, accuracy) => set({ currentLat: lat, currentLng: lng, gpsAccuracy: accuracy }),
      
      // Toggle to manual weather inputs
      setWindSpeed: (speed) => set({ windSpeed: speed }),
      setWindDir: (dir) => set({ windDir: dir }),
      setElevation: (elev) => set({ elevation: elev }),
      
      setRoundId: (id) => set({ currentRoundId: id }),
      clearRound: () => set({ currentRoundId: null, scores: {}, activeHole: 1 }),

      setMapTarget: (target) => set({ mapTarget: target }),
      startTrackingShot: (shotData) => set({ activeShot: shotData }),
      endTrackingShot: () => set({ activeShot: null, mapTarget: null }),

      fetchInitialData: async (userId) => {
        try {
          const { data: clubsData } = await supabase.from('clubs').select('*').eq('user_id', userId);
          const { data: roundsData } = await supabase.from('rounds').select('*').eq('user_id', userId).order('created_at', { ascending: false });
          const { data: shotsData } = await supabase.from('shots').select('*').eq('user_id', userId);

          set({ clubs: clubsData || [], rounds: roundsData || [], shots: shotsData || [] });
        } catch (error) {
          console.error("Fetch error:", error);
        }
      },

      deleteClub: async (id) => {
        const { error } = await supabase.from('clubs').delete().eq('id', id);
        if (!error) set((state) => ({ clubs: state.clubs.filter((c) => c.id !== id) }));
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

        // Try pushing to DB (Will fail gracefully if offline, but persist keeps local copy)
        const { error } = await supabase
          .from('rounds')
          .update({ total_score: total, scorecard: state.scores })
          .eq('id', state.currentRoundId);

        if (!error) {
          set((state) => ({
            rounds: state.rounds.map(r => r.id === state.currentRoundId ? { ...r, total_score: total, scorecard: state.scores } : r),
            currentRoundId: null,
            scores: {},
            activeHole: 1,
            activeShot: null,
            mapTarget: null
          }));
        } else {
          console.error("Failed to finish round:", error.message);
          alert("Failed to sync to database (Are you offline?). Your data is saved locally.");
        }
      }
    }),
    {
      name: 'golf-caddy-storage', // Name of local storage key
      partialize: (state) => ({ 
        // Only save these specific state items to local storage
        clubs: state.clubs, 
        rounds: state.rounds, 
        shots: state.shots,
        currentRoundId: state.currentRoundId,
        activeHole: state.activeHole,
        scores: state.scores,
        activeShot: state.activeShot,
        mapTarget: state.mapTarget
      })
    }
  )
);