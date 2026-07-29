import React from 'react';
import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Define the custom visual icons for the map
const userIcon = new L.DivIcon({
  className: 'custom-div-icon',
  html: "<div style='background-color:#3498db; width:22px; height:22px; border-radius:50%; border:3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.5);'></div>",
  iconSize: [28, 28]
});

const pinIcon = new L.DivIcon({
  className: 'custom-div-icon',
  html: "<div style='background-color:#e74c3c; width:15px; height:15px; border-radius:50%; border:2px solid white;'></div>",
  iconSize: [15, 15]
});

export default function GolfMap({ userLocation, pinLocation }) {
  const center = userLocation || [54.198594, -8.430418];

  return (
    <div className="w-full h-[350px] rounded-2xl overflow-hidden shadow-2xl border border-slate-700/50 z-0 relative">
      <MapContainer 
        center={center} 
        zoom={17} 
        zoomControl={false} 
        style={{ height: '100%', width: '100%', background: '#0f172a' }}
      >
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          attribution="&copy; Esri"
          maxZoom={19}
          keepBuffer={8}             // Pre-loads surrounding tiles in memory
          updateWhenZooming={false}  // Prevents choppy loading during pinch-to-zoom
          updateWhenIdle={true}      // Only fetches new data when panning stops
        />
        
        {userLocation && <Marker position={userLocation} icon={userIcon} />}
        {pinLocation && <Marker position={pinLocation} icon={pinIcon} />}
        
        {userLocation && pinLocation && (
          <Polyline 
            positions={[userLocation, pinLocation]} 
            pathOptions={{ color: '#f1c40f', weight: 3, dashArray: '5, 5' }} 
          />
        )}
      </MapContainer>
    </div>
  );
}