import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';

// Helper for generating realistic GPS mock data
const R_YARDS = 6967420; 
const yardsToLatDeg = (yards) => (yards / R_YARDS) * (180 / Math.PI);
const yardsToLngDeg = (yards, lat) => (yards / (R_YARDS * Math.cos(lat * Math.PI / 180))) * (180 / Math.PI);

export const useGolfStore = create(
  persist(
    (set, get) => ({
      activeHole: 1,
      scores: {}, 
      isScoreModalOpen: false,
      userHandicap: 36,
      
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

      // --- New UI States ---
      pinnedTip: null,
      planningClubId: '', 
      setPlanningClubId: (id) => set({ planningClubId: id }),
      setPinnedTip: (tip) => set({ pinnedTip: tip }), 

      // --- Custom Course Pin Storage ---
      customPins: {}, 
      setCustomPin: (roundId, hole, lat, lng) => set((state) => ({
        customPins: {
          ...state.customPins,
          [`${roundId}_${hole}`]: { lat, lng }
        }
      })),

      // --- Offline Sync State ---
      isOnline: navigator.onLine,
      syncQueue: [], 
      
      setOnlineStatus: (status) => {
        set({ isOnline: status });
        if (status) get().processSyncQueue();
      },

      addToSyncQueue: (task) => set((state) => ({ 
        syncQueue: [...state.syncQueue, { ...task, queueId: crypto.randomUUID(), timestamp: Date.now(), retries: 0 }] 
      })),

      processSyncQueue: async () => {
        const state = get();
        if (!state.isOnline || state.syncQueue.length === 0) return;

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
            const retries = (task.retries || 0) + 1;
            if (retries < 3) {
              failedTasks.push({ ...task, retries });
            } else {
              console.warn("Task dropped permanently after 3 failed attempts.");
            }
          }
        }
        
        set({ syncQueue: failedTasks });
      },

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
        const localShot = { ...shotPayload, id: crypto.randomUUID() };
        set(state => ({ shots: [...state.shots, localShot] }));

        get().addToSyncQueue({ type: 'INSERT_SHOT', payload: shotPayload });
        get().processSyncQueue();
      },

      // RESTORED: Green Elevation API
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
          alert("Failed to record green elevation.");
        }
      },

      // RESTORED: Weather API
      fetchLiveConditions: async () => {
        const state = get();
        if (!state.currentLat) return;
        
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

      addClub: async (clubName, estimatedDistance) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const newClub = { user_id: user.id, name: clubName, avg_distance: Number(estimatedDistance) };
        
        const { data, error } = await supabase.from('clubs').insert([newClub]).select();
        if (!error && data) {
          set(state => ({ clubs: [...state.clubs, data[0]] }));
        }
      },

      deleteClub: async (id) => {
        const { error } = await supabase.from('clubs').delete().eq('id', id);
        if (!error) {
          set((state) => ({ clubs: state.clubs.filter((c) => c.id !== id) }));
        }
      },

      // RESTORED: Ben Hogan Demo Data Engine
      seedBenHoganWithMockData: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        if (!navigator.onLine) return alert("You must be online to inject demo data.");

        const state = get();
        const existingDemoRounds = state.rounds.filter(r => r.course_name === 'Demo Analytics Data');
        for (const r of existingDemoRounds) {
          await supabase.from('shots').delete().eq('round_id', r.id);
          await supabase.from('rounds').delete().eq('id', r.id);
        }

        for (const club of state.clubs) {
          await supabase.from('clubs').delete().eq('id', club.id);
        }

        const benHoganSet = [
          { user_id: user.id, name: 'Driver (10.5°) - FW-817', avg_distance: 210 },
          { user_id: user.id, name: '3 Wood (15°) - FW-817', avg_distance: 185 },
          { user_id: user.id, name: '4 Hybrid (21°) - FW-817', avg_distance: 170 },
          { user_id: user.id, name: '5 Hybrid (24°) - FW-817', avg_distance: 160 },
          { user_id: user.id, name: '5 Iron (25°) - FW-817', avg_distance: 150 },
          { user_id: user.id, name: '6 Iron (28°) - FW-817', avg_distance: 140 },
          { user_id: user.id, name: '7 Iron (32°) - FW-817', avg_distance: 130 },
          { user_id: user.id, name: '8 Iron (36°) - FW-817', avg_distance: 120 },
          { user_id: user.id, name: '9 Iron (40°) - FW-817', avg_distance: 110 },
          { user_id: user.id, name: 'PW (45°) - FW-817', avg_distance: 95 },
          { user_id: user.id, name: 'SW (56°) - FW-817', avg_distance: 70 },
          { user_id: user.id, name: 'Putter - FW-817', avg_distance: 15 }
        ];

        const { data: insertedClubs, error: clubErr } = await supabase.from('clubs').insert(benHoganSet).select();
        if (clubErr) return alert("Failed to insert clubs.");

        const mockScorecard = {
          1: { strokes: 5, putts: 2, fairway: "Fairway" },
          2: { strokes: 6, putts: 3, fairway: "Right" },
          3: { strokes: 4, putts: 1, fairway: "Green" },
          4: { strokes: 8, putts: 3, fairway: "Right, Hazard / Penalty" }, 
          5: { strokes: 5, putts: 2, fairway: "Left" },
          6: { strokes: 6, putts: 2, fairway: "Fairway, Fairway Bunker" },
          7: { strokes: 4, putts: 2, fairway: "Fairway" }, 
          8: { strokes: 7, putts: 3, fairway: "Very Right" }, 
          9: { strokes: 5, putts: 2, fairway: "Left, Greenside Bunker" },
          10: { strokes: 6, putts: 2, fairway: "Right" },
          11: { strokes: 5, putts: 2, fairway: "Fairway" },
          12: { strokes: 8, putts: 4, fairway: "Very Left, Hazard / Penalty" }, 
          13: { strokes: 4, putts: 1, fairway: "Green" }, 
          14: { strokes: 6, putts: 2, fairway: "Right" },
          15: { strokes: 7, putts: 3, fairway: "Left, Fairway Bunker" },
          16: { strokes: 5, putts: 2, fairway: "Fairway" },
          17: { strokes: 5, putts: 2, fairway: "Right" },
          18: { strokes: 6, putts: 2, fairway: "Left" }
        };
        
        let totalScore = 0;
        Object.values(mockScorecard).forEach(s => totalScore += s.strokes);

        const { data: demoRound, error: roundErr } = await supabase.from('rounds').insert([{ 
          user_id: user.id, 
          course_name: 'Demo Analytics Data',
          scorecard: mockScorecard,
          total_score: totalScore
        }]).select();

        if (roundErr || !demoRound) return alert("Failed to insert demo round.");

        const roundId = demoRound[0].id;
        const mockShotsPayload = [];
        const baseLat = 54.2573;
        const baseLng = -8.4748;

        const dispersionPatterns = [
          { distMod: 1.0, disp: 5 },    
          { distMod: 0.85, disp: 28 },  
          { distMod: 0.75, disp: 35 },  
          { distMod: 0.60, disp: -5 },  
          { distMod: 0.95, disp: -15 }, 
          { distMod: 0.98, disp: 2 }    
        ];

        if (insertedClubs) {
          insertedClubs.forEach(club => {
            if (club.name.includes('Putter')) return; 
            
            dispersionPatterns.forEach((pattern, index) => {
              const intendedDist = club.avg_distance;
              const actualDist = Math.round(intendedDist * pattern.distMod);
              const targetLat = baseLat + yardsToLatDeg(intendedDist);
              const targetLng = baseLng;
              const finalLat = baseLat + yardsToLatDeg(actualDist);
              const finalLng = baseLng + yardsToLngDeg(pattern.disp, baseLat);
              
              const accuracyTag = pattern.disp < -7 ? 'Left' : (pattern.disp > 7 ? 'Right' : 'Straight');

              mockShotsPayload.push({
                user_id: user.id,
                round_id: roundId,
                hole_number: index + 1,
                club_id: club.id,
                club: club.name,
                start_lat: baseLat,
                start_lng: baseLng,
                target_lat: targetLat,
                target_lng: targetLng,
                lat: finalLat,
                lng: finalLng,
                distance: actualDist,
                accuracy: accuracyTag 
              });
            });
          });

          const { error: shotErr } = await supabase.from('shots').insert(mockShotsPayload);
          if (shotErr) console.error("Shot insert error:", shotErr);
        }
        
        await get().fetchInitialData(user.id);
        alert("Ben Hogan FW-817 Set & Beginner Demo Data Loaded!");
      },

      clearMockData: async () => {
        const state = get();
        const demoRounds = state.rounds.filter(r => r.course_name === 'Demo Analytics Data');
        for (const demoRound of demoRounds) {
          await supabase.from('shots').delete().eq('round_id', demoRound.id);
          await supabase.from('rounds').delete().eq('id', demoRound.id);
        }
        set(state => ({
          rounds: state.rounds.filter(r => r.course_name !== 'Demo Analytics Data'),
          shots: state.shots.filter(s => {
             const parentRound = state.rounds.find(r => r.id === s.round_id);
             return parentRound && parentRound.course_name !== 'Demo Analytics Data';
          })
        }));
        alert("Demo Analytics Data successfully cleared.");
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

        set((state) => ({
          rounds: state.rounds.map(r => r.id === state.currentRoundId ? { ...r, ...roundUpdateData } : r),
          currentRoundId: null, 
          scores: {}, 
          activeHole: 1, 
          activeShot: null, 
          mapTarget: null
        }));

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
        syncQueue: state.syncQueue,
        pinnedTip: state.pinnedTip,
        customPins: state.customPins 
      })
    }
  )
);