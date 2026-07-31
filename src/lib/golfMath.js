// Earth's radius in yards for coordinate conversions
const R_YARDS = 6967420; 

export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R_YARDS * c);
};

export const calculateBearing = (lat1, lon1, lat2, lon2) => {
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const y = Math.sin(dLon) * Math.cos(lat2 * (Math.PI / 180));
  const x = Math.cos(lat1 * (Math.PI / 180)) * Math.sin(lat2 * (Math.PI / 180)) -
            Math.sin(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.cos(dLon);
  let brng = Math.atan2(y, x) * (180 / Math.PI);
  return (brng + 360) % 360;
};

// NEW: Calculates a new GPS coordinate given a start point, distance, and direction
export const calculateDestination = (lat, lng, distanceYards, bearing) => {
  const d = distanceYards / R_YARDS;
  const lat1 = lat * (Math.PI / 180);
  const lon1 = lng * (Math.PI / 180);
  const brng = bearing * (Math.PI / 180);

  const lat2 = Math.asin(Math.sin(lat1) * Math.cos(d) + Math.cos(lat1) * Math.sin(d) * Math.cos(brng));
  const lon2 = lon1 + Math.atan2(Math.sin(brng) * Math.sin(d) * Math.cos(lat1), Math.cos(d) - Math.sin(lat1) * Math.sin(lat2));

  return {
    lat: lat2 * (180 / Math.PI),
    lng: lon2 * (180 / Math.PI)
  };
};

export const calculatePlaysLike = (distance, bearing, windSpeed, windDir, elevationDiff) => {
  if (!distance) return 0;
  let windEffect = 0;
  if (windSpeed > 0) {
    const angleDiff = (windDir - bearing) * (Math.PI / 180);
    windEffect = Math.cos(angleDiff) * windSpeed * 1.5; 
  }
  const elevEffect = elevationDiff / 3;
  return Math.round(distance + windEffect + elevEffect);
};

export const getRecommendedClub = (playsLike, clubs) => {
  if (!playsLike || !clubs || clubs.length === 0) return "No Club Data";
  let closest = clubs[0];
  let minDiff = Math.abs(playsLike - (clubs[0].avgActual || clubs[0].avg_distance));

  clubs.forEach(club => {
    const dist = club.avgActual || club.avg_distance;
    const diff = Math.abs(playsLike - dist);
    if (diff < minDiff && dist > 15) { 
      minDiff = diff;
      closest = club;
    }
  });

  return closest.name;
};

export const calculateDispersion = (startLat, startLng, targetLat, targetLng, endLat, endLng) => {
  const targetBearing = calculateBearing(startLat, startLng, targetLat, targetLng);
  const actualBearing = calculateBearing(startLat, startLng, endLat, endLng);
  const distance = calculateDistance(startLat, startLng, endLat, endLng);
  const angleDiff = (actualBearing - targetBearing) * (Math.PI / 180);
  const deviationYards = Math.sin(angleDiff) * distance;
  return Math.round(deviationYards);
};

export const getNetScore = (grossStrokes, strokeIndex, userHandicap) => {
  if (!grossStrokes) return 0;
  let handicapStrokes = Math.floor(userHandicap / 18);
  if (strokeIndex <= (userHandicap % 18)) handicapStrokes += 1;
  return grossStrokes - handicapStrokes;
};

export const getStablefordPoints = (netScore, par) => {
  if (!netScore) return 0;
  const diff = netScore - par;
  if (diff >= 2) return 0;       
  if (diff === 1) return 1;      
  if (diff === 0) return 2;      
  if (diff === -1) return 3;     
  if (diff === -2) return 4;     
  if (diff <= -3) return 5;      
  return 0;
};

export const checkGIR = (strokes, putts, par) => {
  if (!strokes || !putts) return false;
  return (strokes - putts) <= (par - 2);
};

export const checkScrambling = (strokes, putts, par) => {
  if (!strokes || !putts) return false;
  const gir = checkGIR(strokes, putts, par);
  return !gir && strokes <= par; 
};