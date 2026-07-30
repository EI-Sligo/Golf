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
      deviceHeading: 0,
      
      windSpeed: 0,
      windDir: 0,
      temperature: 15,
      elevation: 0, 
      isFetchingWeather: false,
      
      greenElevations: {}, 
      
      currentRoundId: null,
      clubs: [],
      rounds: [],
      shots: [],
      mapTarget: null,
      activeShot: null,

      // --- Offline Sync State ---
      isOnline: navigator.onLine,
      syncQueue: [], 
      
      setOnlineStatus: (status) => {
        set({ isOnline: status });
        if (status) get().processSyncQueue();
      },

      addToSyncQueue: (task) => set((state) => ({ 
        syncQueue: [...state.syncQueue, { ...task, queueId: crypto.randomUUID(), timestamp: Date.now() }] 
      })),

      processSyncQueue: async () => {
        const state = get();
        if (!state.isOnline || state.syncQueue.length === 0) return;

        // Create a copy of the queue to process
        const queueToProcess = [...state.syncQueue];
        const failedTasks = [];

        for (const task of queueToProcess) {
          try {
            if (task.type === 'INSERT_SHOT') {
              const { error } = await supabase.from('shots').insert([task.payload]);
              if (error) throw error;
            } 
            else if (task.type === 'UPDATE_ROUND') {
              const { error } = await supabase.from('rounds')
                .update(task.payload.data)
                .eq('id', task.payload.id);
              if (error) throw error;
            }
          } catch (err) {
            console.error("Background sync failed for task:", task, err);
            failedTasks.push(task); // Keep failed tasks to retry later
          }
        }
        
        // Update queue with only the tasks that failed
        set({ syncQueue: failedTasks });
      },
      // --------------------------

      setActiveHole: (hole) => {
        const state = get();
        const savedElev = state.greenElevations[hole] || 0;
        set({ activeHole: hole, elevation: savedElev });
      },

      setScoreModalOpen: (isOpen) => set({ isScoreModalOpen: isOpen }),
      setUserHandicap: (hdcp) => set({ userHandicap: hdcp }),
      setDeviceHeading: (heading) => set({ deviceHeading: heading }),
      
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

      saveTrackedShot: async (shotPayload) => {
        // Optimistic Local Update (shows up in analytics immediately)
        const localShot = { ...shotPayload, id: crypto.randomUUID() };
        set(state => ({ shots: [...state.shots, localShot] }));

        // Add to Sync Queue (Handles DB insert in background)
        get().addToSyncQueue({ type: 'INSERT_SHOT', payload: shotPayload });
        
        // Try processing immediately if online
        get().processSyncQueue();
      },

      recordGreenElevation: async () => {
        const state = get();
        if (!state.currentLat) {
          return alert("Waiting for GPS signal...");
        }
        
        try {
          const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${state.currentLat}&longitude=${state.currentLng}&current=temperature_2m&elevation=nan`);
          if (!res.ok) throw new Error(`Weather API returned status: ${res.status}`);
          const data = await res.json();
          if (!data || data.elevation === undefined) throw new Error("Invalid elevation data received");

          const altitudeFeet = Math.round(data.elevation * 3.28084);
          
          set((prev) => ({
            greenElevations: { ...prev.greenElevations, [state.activeHole]: altitudeFeet }
          }));
          alert(`Green ${state.activeHole} elevation recorded successfully (${altitudeFeet} ft)`);
        } catch (error) {
          console.error("Green Elevation Error: ", error);
          alert("Failed to record green elevation. The weather service might be temporarily unavailable.");
        }
      },

      fetchLiveConditions: async () => {
        const state = get();
        if (!state.currentLat) {
          return alert("Waiting for GPS signal...");
        }
        
        set({ isFetchingWeather: true });
        
        try {
          const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${state.currentLat}&longitude=${state.currentLng}&current=temperature_2m,wind_speed_10m,wind_direction_10m&wind_speed_unit=mph`);
          if (!res.ok) throw new Error(`Weather API returned status: ${res.status}`);
          const data = await res.json();
          if (!data || !data.current) throw new Error("Invalid weather data received");
          
          set({
            windSpeed: Math.round(data.current.wind_speed_10m),
            windDir: data.current.wind_direction_10m,
            temperature: Math.round(data.current.temperature_2m),
            isFetchingWeather: false
          });
        } catch (error) {
          console.error("Weather Fetch Error: ", error);
          alert("Could not fetch live weather. The service might be temporarily unavailable.");
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

        const roundUpdateData = { total_score: total, scorecard: state.scores };

        // Optimistic Local Update
        set((state) => ({
          rounds: state.rounds.map(r => 
            r.id === state.currentRoundId 
              ? { ...r, ...roundUpdateData } 
              : r
          ),
          currentRoundId: null, 
          scores: {}, 
          activeHole: 1, 
          activeShot: null, 
          mapTarget: null
        }));

        // Add to Sync Queue
        get().addToSyncQueue({ 
          type: 'UPDATE_ROUND', 
          payload: { id: state.currentRoundId, data: roundUpdateData } 
        });

        get().processSyncQueue();
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
        userHandicap: state.userHandicap,
        greenElevations: state.greenElevations,
        syncQueue: state.syncQueue // Ensure pending uploads survive app restarts
      })
    }
  )
);