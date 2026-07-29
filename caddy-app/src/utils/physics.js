// 1. Fetch live weather based on current GPS
export async function fetchLiveWeather(lat, lng) {
  try {
    // Open-Meteo is a free, blazing-fast API for local weather models
    const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true`);
    const data = await res.json();
    return data.current_weather; // Returns { temperature, windspeed, winddirection }
  } catch (error) {
    console.error("Weather API Error:", error);
    return null;
  }
}

// 2. Calculate the True Compass Bearing from User to Pin
function calculateBearing(lat1, lng1, lat2, lng2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const toDeg = (rad) => (rad * 180) / Math.PI;

  const dLng = toRad(lng2 - lng1);
  const rLat1 = toRad(lat1);
  const rLat2 = toRad(lat2);

  const y = Math.sin(dLng) * Math.cos(rLat2);
  const x = Math.cos(rLat1) * Math.sin(rLat2) - Math.sin(rLat1) * Math.cos(rLat2) * Math.cos(dLng);
  
  const bearing = (toDeg(Math.atan2(y, x)) + 360) % 360;
  return bearing;
}

// 3. The Tour-Level "Plays Like" Algorithm
export function calculatePlaysLike(baseDistance, userLat, userLng, pinLat, pinLng, windSpeed, windDir, tempC, elevationYards = 0) {
  if (baseDistance === "--") return "--";

  // A. Elevation Adjustment (Rule of thumb: 1 yard per yard of rise/drop)
  let playsLike = baseDistance + elevationYards;

  // B. Wind Vector Math
  if (windSpeed && windDir && userLat && userLng) {
    const shotBearing = calculateBearing(userLat, userLng, pinLat, pinLng);
    
    // Calculate the angle difference between the wind and your shot
    const angleDiff = (windDir - shotBearing) * (Math.PI / 180);
    
    // Cosine determines the headwind/tailwind vector (+ is headwind, - is tailwind)
    const headwindComponent = Math.cos(angleDiff) * windSpeed;
    
    // Rule of thumb: ~1% distance effect per mph of headwind
    // We multiply by 1.1 to approximate standard ball flight drag
    const windAdjustment = headwindComponent * 1.1; 
    playsLike += windAdjustment;
  }

  // C. Air Density / Temperature Math
  // Optimal temp is ~21°C (70°F). Colder air is denser (ball flies shorter).
  // Rule of thumb: +/- 2 yards for every 5°C difference from 21°C.
  if (tempC) {
    const tempDiff = 21 - tempC; // Positive if colder, negative if warmer
    const tempAdjustment = (tempDiff / 5) * 2; 
    playsLike += tempAdjustment;
  }

  return Math.round(playsLike);
}

// Automatically recommend the best club based on Plays Like distance and user's bag
export function getRecommendedClub(playsLikeDistance, bagClubs) {
  if (!playsLikeDistance || playsLikeDistance === "--" || !bagClubs || bagClubs.length === 0) {
    return "Driver";
  }

  // Sort bag clubs by distance descending
  const sortedBag = [...bagClubs].sort((a, b) => b.yardage - a.yardage);

  let bestClub = sortedBag[0].club_name;

  for (let i = 0; i < sortedBag.length; i++) {
    if (sortedBag[i].yardage >= playsLikeDistance) {
      bestClub = sortedBag[i].club_name;
    } else {
      break;
    }
  }

  return bestClub;
}