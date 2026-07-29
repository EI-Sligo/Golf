import { create } from 'zustand';

export const useGolfStore = create((set) => ({
  activeHole: 1,
  scores: {},
  currentLat: null,
  currentLng: null,
  gpsAccuracy: null,
  windSpeed: 0,
  windDir: 0,
  temperature: 15,
  elevation: 0,
  currentRoundId: null, // NEW: Tracks active round

  setActiveHole: (hole) => set({ activeHole: hole }),
  setScore: (hole, strokes, putts) => set((state) => ({
    scores: { ...state.scores, [hole]: { strokes, putts } }
  })),
  setLocation: (lat, lng, accuracy) => set({ currentLat: lat, currentLng: lng, gpsAccuracy: accuracy }),
  setWeather: (speed, dir, temp) => set({ windSpeed: speed, windDir: dir, temperature: temp }),
  setElevation: (elev) => set({ elevation: elev }),
  
  // NEW: Round Management
  setRoundId: (id) => set({ currentRoundId: id }),
  clearRound: () => set({ currentRoundId: null, scores: {}, activeHole: 1 }),
}));