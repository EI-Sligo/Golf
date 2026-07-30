// Earth radius in yards
const R_YARDS = 6967420;

const toRad = (degrees) => (degrees * Math.PI) / 180;
const toDeg = (radians) => (radians * 180) / Math.PI;

// Calculates direct distance between two coordinates in yards
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R_YARDS * c);
};

// Calculates the compass bearing from point 1 to point 2
const calculateBearing = (lat1, lon1, lat2, lon2) => {
  const phi1 = toRad(lat1);
  const phi2 = toRad(lat2);
  const deltaLambda = toRad(lon2 - lon1);

  const y = Math.sin(deltaLambda) * Math.cos(phi2);
  const x = Math.cos(phi1) * Math.sin(phi2) -
            Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);

  return (toDeg(Math.atan2(y, x)) + 360) % 360;
};

// Calculates how far left (negative) or right (positive) a shot was from the target line
export const calculateDispersion = (startLat, startLng, targetLat, targetLng, endLat, endLng) => {
  // Angular distance from start to end
  const d13 = calculateDistance(startLat, startLng, endLat, endLng) / R_YARDS; 
  const theta13 = toRad(calculateBearing(startLat, startLng, endLat, endLng));
  const theta12 = toRad(calculateBearing(startLat, startLng, targetLat, targetLng));

  // Cross-track distance formula
  const dxt = Math.asin(Math.sin(d13) * Math.sin(theta13 - theta12));
  
  return Math.round(dxt * R_YARDS);
};