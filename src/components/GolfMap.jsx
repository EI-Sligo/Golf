import React, { useRef, useMemo } from 'react';
import { 
  MapContainer, 
  TileLayer, 
  Marker, 
  Polyline, 
  Circle, 
  useMapEvents 
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useGolfStore } from '../store/useGolfStore';
import { courseData } from '../lib/courseData';
import { calculateDistance } from '../lib/golfMath';

// Click on the map to set an initial target
function MapTapHandler() {
  const setMapTarget = useGolfStore((state) => state.setMapTarget);
  
  useMapEvents({ 
    click(e) { 
      setMapTarget({ lat: e.latlng.lat, lng: e.latlng.lng }); 
    } 
  });
  
  return null;
}

// Draggable Target Marker component for precise layup planning
function DraggableTargetMarker() {
  const { mapTarget, setMapTarget } = useGolfStore();
  const markerRef = useRef(null);
  
  const eventHandlers = useMemo(() => ({
    dragend() { 
      const marker = markerRef.current; 
      if (marker) {
        setMapTarget({ 
          lat: marker.getLatLng().lat, 
          lng: marker.getLatLng().lng 
        }); 
      }
    },
  }), [setMapTarget]);

  if (!mapTarget) return null;
  
  return (
    <Marker 
      draggable={true} 
      eventHandlers={eventHandlers} 
      position={[mapTarget.lat, mapTarget.lng]} 
      ref={markerRef} 
    />
  );
}

export default function GolfMap() {
  const { currentLat, currentLng, activeHole, mapTarget, activeShot } = useGolfStore();
  const holeData = courseData[activeHole];

  // Default to Castle Dargan coordinates if GPS hasn't locked yet
  const centerLat = currentLat || 54.197806;
  const centerLng = currentLng || -8.435885;

  const distToTarget = (currentLat && mapTarget) 
    ? calculateDistance(currentLat, currentLng, mapTarget.lat, mapTarget.lng) 
    : 0;
    
  const targetToPin = (mapTarget && holeData?.pin) 
    ? calculateDistance(mapTarget.lat, mapTarget.lng, holeData.pin.lat, holeData.pin.lng) 
    : 0;

  return (
    <div className="w-full flex flex-col gap-2">
      
      {/* Map Header - Shows Split Distances if Target is active */}
      {mapTarget && !activeShot && (
        <div className="flex justify-between bg-slate-800 p-3 rounded-xl border border-slate-700 shadow-md">
          <div className="text-center">
            <p className="text-[10px] text-slate-400 font-bold uppercase">To Target</p>
            <p className="text-xl font-black text-sky-400">{distToTarget}y</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-slate-400 font-bold uppercase">Target to Pin</p>
            <p className="text-xl font-black text-rose-400">{targetToPin}y</p>
          </div>
        </div>
      )}

      {/* Main Map Container */}
      <div className="h-72 w-full rounded-2xl overflow-hidden border border-slate-700 shadow-lg relative">
        <MapContainer 
          center={[centerLat, centerLng]} 
          zoom={16} 
          className="h-full w-full" 
          zoomControl={false}
        >
          <TileLayer 
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" 
          />
          
          <MapTapHandler />

          {/* User Location */}
          {currentLat && currentLng && (
            <Marker position={[currentLat, currentLng]} />
          )}
          
          {/* Draggable Layup Target */}
          {!activeShot && <DraggableTargetMarker />}

          {/* Hole Specific Data (Pin, Greens, Hazards) */}
          {holeData && (
            <>
              {/* Main Pin */}
              <Marker position={[holeData.pin.lat, holeData.pin.lng]} />
              
              {/* Front of Green (Green Circle) */}
              {holeData.front && (
                <Circle 
                  center={[holeData.front.lat, holeData.front.lng]} 
                  radius={3} 
                  color="#10b981" 
                />
              )}
              
              {/* Back of Green (Red Circle) */}
              {holeData.back && (
                <Circle 
                  center={[holeData.back.lat, holeData.back.lng]} 
                  radius={3} 
                  color="#ef4444" 
                />
              )}
              
              {/* Render Hazards */}
              {holeData.hazards && holeData.hazards.map((h, i) => (
                <Circle 
                  key={i} 
                  center={[h.lat, h.lng]} 
                  radius={8} 
                  color={h.type === 'water' ? '#3b82f6' : '#eab308'} 
                  fillOpacity={0.4} 
                />
              ))}

              {/* Line from User to Pin (No Target Active) */}
              {currentLat && !mapTarget && !activeShot && (
                <Polyline 
                  positions={[[currentLat, currentLng], [holeData.pin.lat, holeData.pin.lng]]} 
                  color="#ef4444" 
                  weight={2} 
                  opacity={0.6} 
                />
              )}
              
              {/* Line from Target to Pin */}
              {mapTarget && !activeShot && (
                <Polyline 
                  positions={[[mapTarget.lat, mapTarget.lng], [holeData.pin.lat, holeData.pin.lng]]} 
                  color="#ef4444" 
                  weight={2} 
                  dashArray="3, 3" 
                  opacity={0.6} 
                />
              )}
            </>
          )}
          
          {/* Line from User to Target */}
          {currentLat && mapTarget && !activeShot && (
            <Polyline 
              positions={[[currentLat, currentLng], [mapTarget.lat, mapTarget.lng]]} 
              color="#38bdf8" 
              dashArray="5, 5" 
              weight={3} 
            />
          )}
          
          {/* Active Shot Tracking Lines */}
          {activeShot && (
            <>
              <Marker position={[activeShot.startLat, activeShot.startLng]} opacity={0.5} />
              
              <Polyline 
                positions={[[activeShot.startLat, activeShot.startLng], [activeShot.targetLat, activeShot.targetLng]]} 
                color="#38bdf8" 
                dashArray="5, 5" 
                weight={3} 
                opacity={0.5} 
              />
              
              <Polyline 
                positions={[[activeShot.startLat, activeShot.startLng], [currentLat, currentLng]]} 
                color="#10b981" 
                weight={3} 
              />
            </>
          )}
        </MapContainer>
        
        {/* Helper Text */}
        {!activeShot && (
          <p className="text-[10px] text-slate-400 text-center absolute bottom-1 w-full z-[400] bg-slate-900/70 py-1">
            Tap & drag map target for layups
          </p>
        )}
      </div>
    </div>
  );
}