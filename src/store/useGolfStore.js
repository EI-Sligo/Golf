import { create } from 'zustand';

export const useGolfStore = create((set) => ({
  // 1. Active Round State
  activeHole: 1,
  players: [{ id: 'A', name: 'Me', hcp: 18 }],
  isPlannerMode: false,
  
  // 2. GPS & Environmental Data
  currentLat: null,
  currentLng: null,
  currentAltitude: null,
  windSpeed: 0,
  windDir: 0,

  // 3. Global Actions (Functions to update the state)
  setActiveHole: (hole) => set({ activeHole: hole }),
  setPlannerMode: (isActive) => set({ isPlannerMode: isActive }),
  setLocation: (lat, lng, alt) => set({ currentLat: lat, currentLng: lng, currentAltitude: alt }),
  setWeather: (speed, dir) => set({ windSpeed: speed, windDir: dir }),
}));