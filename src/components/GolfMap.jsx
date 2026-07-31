import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMap, Polyline, Polygon, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useGolfStore } from '../store/useGolfStore';
import { courseData } from '../lib/courseData';
import { calculateDispersion, calculateBearing, calculateDestination } from '../lib/golfMath';

const createSvgIcon = (svgString, size, anchor) => new L.divIcon({
  html: svgString,
  className: 'bg-transparent border-none',
  iconSize: size,
  iconAnchor: anchor,
});

const pinSvg = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 22V2M4 2L18 8L4 14" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="4" cy="22" r="2" fill="#10b981"/></svg>`;
const userSvg = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="8" fill="#38bdf8" stroke="#ffffff" stroke-width="3"/><circle cx="12" cy="12" r="3" fill="#ffffff"/></svg>`;
const targetSvg = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" stroke="#f43f5e" stroke-width="2" stroke-dasharray="4 4"/><circle cx="12" cy="12" r="2" fill="#f43f5e"/><path d="M12 2V6M12 18V22M2 12H6M18 12H22" stroke="#f43f5e" stroke-width="2" stroke-linecap="round"/></svg>`;

const pinIcon = createSvgIcon(pinSvg, [32, 32], [4, 32]);
const userIcon = createSvgIcon(userSvg, [24, 24], [12, 12]);
const targetIcon = createSvgIcon(targetSvg, [32, 32], [16, 16]);

function MapBoundsController({ activeHole, pinPos, userPos }) {
  const map = useMap();
  useEffect(() => {
    if (pinPos) {
      const bounds = L.latLngBounds([pinPos]);
      if (userPos) bounds.extend(userPos);
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 18 });
    }
  }, [map, activeHole]); 
  return null;
}

export default function GolfMap() {
  const { 
    currentLat, currentLng, activeHole, mapTarget, setMapTarget, 
    clubs, shots, planningClubId, setPlanningClubId,
    rounds, currentRoundId, customPins, setCustomPin
  } = useGolfStore();
  
  const hole = courseData[activeHole];
  const activeRound = rounds.find(r => r.id === currentRoundId);
  
  // Determine if we are on a mapped course or a custom course
  const isDefaultCourse = activeRound?.course_name === 'Castle Dargan Golf Club' || activeRound?.course_name === 'Demo Analytics Data';
  const customPinKey = `${currentRoundId}_${activeHole}`;
  
  let activePin = null;
  let isPinNeedsSetup = false;

  // 1. Check if user already dragged a pin for this hole
  if (customPins && customPins[customPinKey]) {
    activePin = customPins[customPinKey];
  } 
  // 2. Check if it's Castle Dargan
  else if (isDefaultCourse && hole?.pin) {
    activePin = hole.pin;
  } 
  // 3. Custom Course: Spawn a pin 150 yards North of user to initiate setup
  else if (currentLat && currentLng) {
    activePin = { lat: currentLat + 0.0013, lng: currentLng };
    isPinNeedsSetup = true;
  }

  const currentTarget = mapTarget ? [mapTarget.lat, mapTarget.lng] : (activePin ? [activePin.lat, activePin.lng] : null);
  const userPos = currentLat ? [currentLat, currentLng] : null;

  const dispersionKite = useMemo(() => {
    if (!planningClubId || !currentLat || !currentLng || !currentTarget) return null;
    
    const club = clubs.find(c => c.id === planningClubId);
    if (!club) return null;

    const shotBearing = calculateBearing(currentLat, currentLng, currentTarget[0], currentTarget[1]);
    const baseDistance = club.avg_distance;
    const landingZone = calculateDestination(currentLat, currentLng, baseDistance, shotBearing);
    const clubShots = shots.filter(s => s.club_id === club.id && s.distance > 0);
    const minFloor = baseDistance * 0.05; 

    let p80Left = minFloor, p80Right = minFloor, p80Short = minFloor, p80Long = minFloor;

    if (clubShots.length > 0) {
      const leftDevs = [], rightDevs = [], shortDevs = [], longDevs = [];
      clubShots.forEach(s => {
        if (s.target_lat && s.target_lng && s.start_lat && s.start_lng && s.lat && s.lng) {
           const devLtoR = calculateDispersion(s.start_lat, s.start_lng, s.target_lat, s.target_lng, s.lat, s.lng);
           if (devLtoR < 0) leftDevs.push(Math.abs(devLtoR));
           else rightDevs.push(devLtoR);
           
           const distDelta = s.distance - baseDistance;
           if (distDelta < 0) shortDevs.push(Math.abs(distDelta));
           else longDevs.push(distDelta);
        }
      });
      const getP80 = (arr) => {
        if (arr.length === 0) return minFloor;
        arr.sort((a,b) => a - b);
        let idx = Math.floor(arr.length * 0.80);
        if (idx >= arr.length) idx = arr.length - 1;
        return arr[idx] < minFloor ? minFloor : arr[idx];
      };
      p80Left = getP80(leftDevs);
      p80Right = getP80(rightDevs);
      p80Short = getP80(shortDevs);
      p80Long = getP80(longDevs);
    }

    const pFront = calculateDestination(landingZone.lat, landingZone.lng, p80Short, shotBearing - 180);
    const pBack = calculateDestination(landingZone.lat, landingZone.lng, p80Long, shotBearing);
    const pLeft = calculateDestination(landingZone.lat, landingZone.lng, p80Left, shotBearing - 90);
    const pRight = calculateDestination(landingZone.lat, landingZone.lng, p80Right, shotBearing + 90);

    return {
      landingZone: [landingZone.lat, landingZone.lng],
      polygon: [ [pFront.lat, pFront.lng], [pRight.lat, pRight.lng], [pBack.lat, pBack.lng], [pLeft.lat, pLeft.lng] ],
      distance: baseDistance
    };
  }, [planningClubId, currentLat, currentLng, currentTarget, clubs, shots]);

  if (!activePin && !userPos) return <div className="h-64 bg-slate-800 rounded-xl flex items-center justify-center text-slate-500">Waiting for GPS to map custom course...</div>;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2 items-center bg-slate-800 p-2 rounded-xl border border-slate-700">
        <select 
          value={planningClubId || ''} 
          onChange={(e) => setPlanningClubId(e.target.value)}
          className="flex-1 bg-slate-900 p-2.5 rounded-lg text-white text-xs font-bold border border-slate-700 focus:border-emerald-500 focus:outline-none"
        >
          <option value="">Map Target Only (No Club)</option>
          {clubs.map(club => (
            <option key={club.id} value={club.id}>{club.name} ({club.avg_distance}y)</option>
          ))}
        </select>
      </div>

      <div className="h-64 sm:h-80 w-full rounded-2xl overflow-hidden border border-slate-700 shadow-lg relative z-0">
        <MapContainer center={activePin ? [activePin.lat, activePin.lng] : userPos} zoom={16} style={{ height: '100%', width: '100%' }} zoomControl={false}>
          <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" attribution="&copy; Esri" maxZoom={19} />
          
          <MapBoundsController activeHole={activeHole} pinPos={activePin ? [activePin.lat, activePin.lng] : null} userPos={userPos} />

          {/* Draggable Green Flag */}
          {activePin && (
            <Marker 
              position={[activePin.lat, activePin.lng]} 
              icon={pinIcon} 
              draggable={true}
              eventHandlers={{
                dragend: (e) => {
                  const pos = e.target.getLatLng();
                  setCustomPin(currentRoundId, activeHole, pos.lat, pos.lng);
                }
              }}
            />
          )}

          {userPos && <Marker position={userPos} icon={userIcon} />}
          
          {userPos && currentTarget && (
            <Polyline positions={[userPos, currentTarget]} pathOptions={{ color: '#f43f5e', weight: 2, dashArray: '4 6' }} />
          )}

          {currentTarget && (
            <Marker 
              position={currentTarget} 
              icon={targetIcon} 
              draggable={true}
              eventHandlers={{
                dragend: (e) => {
                  const pos = e.target.getLatLng();
                  setMapTarget({ lat: pos.lat, lng: pos.lng });
                }
              }}
            />
          )}

          {dispersionKite && (
            <>
              <Circle center={dispersionKite.landingZone} radius={2} pathOptions={{ color: '#38bdf8', fillColor: '#38bdf8', fillOpacity: 1 }} />
              <Polygon positions={dispersionKite.polygon} pathOptions={{ color: 'rgba(56, 189, 248, 0.8)', fillColor: 'rgba(56, 189, 248, 0.2)', weight: 2, dashArray: '4' }} />
            </>
          )}
        </MapContainer>
        
        <div className="absolute top-3 left-3 right-3 pointer-events-none flex flex-col gap-2">
          <div className="flex justify-between">
            <div className="bg-slate-900/80 backdrop-blur text-white text-[10px] font-bold px-3 py-1.5 rounded-full border border-slate-700 shadow-sm pointer-events-auto">
              🎯 Drag Red Target to Aim
            </div>
            {dispersionKite && userPos && (
               <div className="bg-sky-900/80 backdrop-blur text-sky-400 text-[10px] font-bold px-3 py-1.5 rounded-full border border-sky-500/30 shadow-sm">
                 Expected: {dispersionKite.distance}y
               </div>
            )}
          </div>
          {/* Banner to teach the user they can move the hole */}
          {isPinNeedsSetup && (
            <div className="bg-amber-500/90 backdrop-blur text-slate-900 text-[10px] font-black px-3 py-1.5 rounded-full border border-amber-400 shadow-sm self-start pointer-events-auto animate-pulse">
              ⛳ Custom Course: Drag Green Pin to Hole
            </div>
          )}
        </div>
      </div>
    </div>
  );
}