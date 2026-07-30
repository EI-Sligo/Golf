import React from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useGolfStore } from '../store/useGolfStore';
import { courseData } from '../lib/courseData';

// Custom hook to listen for map taps
function MapTapHandler() {
  const setMapTarget = useGolfStore((state) => state.setMapTarget);
  useMapEvents({
    click(e) {
      setMapTarget({ lat: e.latlng.lat, lng: e.latlng.lng });
    }
  });
  return null;
}

export default function GolfMap() {
  const { currentLat, currentLng, activeHole, mapTarget, activeShot } = useGolfStore();
  const holeData = courseData[activeHole];

  // Default center if GPS is still warming up (Castle Dargan Hole 1)
  const centerLat = currentLat || 54.197806;
  const centerLng = currentLng || -8.435885;

  return (
    <div className="h-64 w-full rounded-2xl overflow-hidden border border-slate-700 shadow-lg relative">
      <div className="absolute top-2 left-2 z-[400] bg-slate-900/80 px-3 py-1 rounded text-xs font-bold text-white border border-slate-700">
        Hole {activeHole}
      </div>
      
      <MapContainer center={[centerLat, centerLng]} zoom={16} className="h-full w-full" zoomControl={false}>
        <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
        
        {/* Enables tapping the map to set a target */}
        <MapTapHandler />

        {/* User Location */}
        {currentLat && currentLng && (
          <Marker position={[currentLat, currentLng]} />
        )}

        {/* Target Line (Blue Dashed) - Drawn from current location to tapped target */}
        {currentLat && mapTarget && !activeShot && (
          <Polyline positions={[[currentLat, currentLng], [mapTarget.lat, mapTarget.lng]]} color="#38bdf8" dashArray="5, 5" weight={3} />
        )}

        {/* Pin Location & Line (Red) */}
        {holeData && (
          <>
             <Marker position={[holeData.pin.lat, holeData.pin.lng]} />
             {currentLat && !activeShot && (
               <Polyline positions={[[currentLat, currentLng], [holeData.pin.lat, holeData.pin.lng]]} color="#ef4444" weight={2} opacity={0.6} />
             )}
          </>
        )}
        
        {/* If tracking a shot, show the origin point and target line locked in place */}
        {activeShot && (
          <>
            <Marker position={[activeShot.startLat, activeShot.startLng]} opacity={0.5} />
            <Polyline positions={[[activeShot.startLat, activeShot.startLng], [activeShot.targetLat, activeShot.targetLng]]} color="#38bdf8" dashArray="5, 5" weight={3} opacity={0.5} />
            <Polyline positions={[[activeShot.startLat, activeShot.startLng], [currentLat, currentLng]]} color="#10b981" weight={3} />
          </>
        )}
      </MapContainer>
      
      {/* Help text */}
      {!activeShot && (
        <p className="text-[10px] text-slate-400 text-center mt-1 absolute bottom-1 w-full z-[400] bg-slate-900/70 py-1">
          Tap map to set target line
        </p>
      )}
    </div>
  );
}