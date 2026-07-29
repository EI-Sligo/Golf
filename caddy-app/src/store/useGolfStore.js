import { create } from 'zustand';

export const useGolfStore = create((set) => ({
  activeHole: 1,
  scores: {}, 
  currentLat: null,
  currentLng: null,
  gpsAccuracy: null, 
  windSpeed: 0,
  windDir: 0,
  temperature: 21, 
  elevation: 6,

  setActiveHole: (hole) => set({ activeHole: hole }),
  
  setScore: (hole, strokes, putts) => set((state) => ({
    scores: { ...state.scores, [hole]: { strokes, putts } }
  })),

  setLocation: (lat, lng, accuracy) => set({ currentLat: lat, currentLng: lng, gpsAccuracy: accuracy }),
  setWeather: (speed, dir, temp) => set({ windSpeed: speed, windDir: dir, temperature: temp }),

  // NEW: Clear the round data after saving to Supabase
  resetRound: () => set({ scores: {}, activeHole: 1 })
}));