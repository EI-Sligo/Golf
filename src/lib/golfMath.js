const R_YARDS = 6967420; // Earth radius in yards

export const toRad = (degrees) => (degrees * Math.PI) / 180;
export const toDeg = (radians) => (radians * 180) / Math.PI;

export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2 || (lat1 === 0 && lon1 === 0)) return 0;
  
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R_YARDS * c);
};

export const calculateBearing = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2 || (lat1 === 0 && lon1 === 0)) return 0;
  
  const phi1 = toRad(lat1);
  const phi2 = toRad(lat2);
  const deltaLambda = toRad(lon2 - lon1);

  const y = Math.sin(deltaLambda) * Math.cos(phi2);
  const x = Math.cos(phi1) * Math.sin(phi2) -
            Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);

  return (toDeg(Math.atan2(y, x)) + 360) % 360;
};

export const calculateDispersion = (startLat, startLng, targetLat, targetLng, endLat, endLng) => {
  if (!startLat || !startLng || !targetLat || !targetLng || !endLat || !endLng) return 0;
  
  const d13 = calculateDistance(startLat, startLng, endLat, endLng) / R_YARDS; 
  const theta13 = toRad(calculateBearing(startLat, startLng, endLat, endLng));
  const theta12 = toRad(calculateBearing(startLat, startLng, targetLat, targetLng));

  const dxt = Math.asin(Math.sin(d13) * Math.sin(theta13 - theta12));
  return Math.round(dxt * R_YARDS);
};

// --- SMART CADDY AI ---
export const calculatePlaysLike = (directYards, shotBearing, windSpeed, windDirDeg, elevationFeet) => {
  if (!directYards) return 0;
  
  // Elevation adjustment (1 yard per 3 feet of relative height change)
  const validElevation = Number(elevationFeet) || 0;
  const elevationAdjustment = validElevation / 3;
  
  // Wind adjustment scaled proportionally to shot distance 
  // (A 10mph wind heavily affects a 150y shot, but has minimal impact on a 24y chip)
  const distanceScaleFactor = Math.max(0.1, directYards / 150);
  const windAngleRad = toRad(windDirDeg - shotBearing);
  const rawWindEffect = (Number(windSpeed) || 0) * Math.cos(windAngleRad) * 1.2;
  const windAdjustment = rawWindEffect * distanceScaleFactor; 
  
  return Math.max(1, Math.round(directYards + elevationAdjustment + windAdjustment));
};

export const getRecommendedClub = (playsLikeYards, clubs) => {
  if (!clubs || clubs.length === 0 || playsLikeYards === 0) return "No Clubs";
  
  const closest = clubs.reduce((prev, curr) => {
    return (Math.abs(curr.avg_distance - playsLikeYards) < Math.abs(prev.avg_distance - playsLikeYards) ? curr : prev);
  });
  
  return closest.name;
};