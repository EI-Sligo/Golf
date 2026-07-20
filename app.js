// Global Variables for GPS
let currentLat = null;
let currentLng = null;
let currentHoleIndex = 0; // Starts at Hole 1 (array index 0)

// 1. The Course Data (Castle Dargan Greens)
const courseData = [
    { hole: 1, lat: 54.19860260754416, lng: -8.430412853346407 },
    { hole: 2, lat: 54.200161814306895, lng: -8.424006844479758 },
    { hole: 3, lat: 54.19966549964856, lng: -8.421158440726037 },
    { hole: 4, lat: 54.198003141877244, lng: -8.426296058686598 }
];

// 2. DOM Elements (Connecting JS to your HTML)
const distanceDisplay = document.getElementById('distance-number');
const currentHoleDisplay = document.getElementById('current-hole');

// 3. Start GPS Tracking (FIXED)
function initGPS() {
    if ("geolocation" in navigator) {
        navigator.geolocation.watchPosition(
            (position) => {
                // Save to global variables for the shot tracker to use
                currentLat = position.coords.latitude;
                currentLng = position.coords.longitude;
                
                // Grab the coordinates for the hole you are currently playing
                const currentHole = courseData[currentHoleIndex];
                
                // Calculate distance
                const yardage = calculateDistance(currentLat, currentLng, currentHole.lat, currentHole.lng);
                
                // Update screen
                distanceDisplay.innerText = yardage;
                
                // Ask the caddy for a recommendation
                recommendClub(yardage); 
            },
            (error) => {
                console.error("GPS Error:", error.message);
                distanceDisplay.innerText = "Err";
            },
            { enableHighAccuracy: true, maximumAge: 0 } 
        );
    } else {
        alert("GPS is not supported by your device or browser.");
    }
}

// 4. The Haversine Formula
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Earth's radius in meters
    const toRadians = (degree) => degree * (Math.PI / 180);

    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);

    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * 
        Math.sin(dLon / 2) * Math.sin(dLon / 2); 

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
    const distanceInMeters = R * c;
    
    const distanceInYards = distanceInMeters * 1.09361; 
    return Math.round(distanceInYards); 
}

// 5. Shot Tracker State and Logic
let isTrackingShot = false;
let shotStartLat = null;
let shotStartLng = null;

const trackBtn = document.getElementById('track-btn');
const clubSelect = document.getElementById('club-select');
const shotResultDisplay = document.getElementById('shot-result');
const lastShotDistance = document.getElementById('last-shot-distance');

trackBtn.addEventListener('click', () => {
    if (!currentLat || !currentLng) {
        alert("Waiting for GPS signal...");
        return;
    }

    if (!isTrackingShot) {
        // Start Shot
        isTrackingShot = true;
        shotStartLat = currentLat;
        shotStartLng = currentLng;

        trackBtn.innerText = "End Shot (Walk to ball)";
        trackBtn.style.backgroundColor = "#e74c3c"; 
        shotResultDisplay.style.display = 'none'; 
    } else {
        // End Shot
        const selectedClub = clubSelect.value;

        if (selectedClub === "") {
            alert("Please select the club you used first!");
            return;
        }

        const shotDistance = calculateDistance(shotStartLat, shotStartLng, currentLat, currentLng);
        saveShotData(selectedClub, shotDistance);

        lastShotDistance.innerText = shotDistance;
        shotResultDisplay.style.display = 'block';

        isTrackingShot = false;
        shotStartLat = null;
        shotStartLng = null;
        trackBtn.innerText = "Start Shot";
        trackBtn.style.backgroundColor = "#27ae60"; 
        clubSelect.value = ""; 
    }
});

// 6. LocalStorage Saving
function saveShotData(club, distance) {
    let savedShots = JSON.parse(localStorage.getItem('castleDarganShots')) || [];

    savedShots.push({
        club: club,
        distance: distance,
        date: new Date().toISOString()
    });

    localStorage.setItem('castleDarganShots', JSON.stringify(savedShots));
    console.log("All Saved Shots:", savedShots);
}

// 7. Caddy Algorithm - Calculate Averages
function getClubAverages() {
    const savedShots = JSON.parse(localStorage.getItem('castleDarganShots')) || [];
    if (savedShots.length === 0) return null;

    const clubTotals = {};
    const clubCounts = {};

    savedShots.forEach(shot => {
        if (!clubTotals[shot.club]) {
            clubTotals[shot.club] = 0;
            clubCounts[shot.club] = 0;
        }
        clubTotals[shot.club] += shot.distance;
        clubCounts[shot.club] += 1;
    });

    const averages = {};
    for (const club in clubTotals) {
        averages[club] = Math.round(clubTotals[club] / clubCounts[club]);
    }
    return averages; 
}

// 8. Caddy Algorithm - Make Recommendation
function recommendClub(targetYardage) {
    const averages = getClubAverages();
    const recommendationDisplay = document.getElementById('recommended-club');

    if (!averages) {
        recommendationDisplay.innerText = "Track some shots first!";
        return;
    }

    let bestClub = "None";
    let smallestDifference = Infinity; 

    for (const club in averages) {
        const difference = Math.abs(averages[club] - targetYardage);
        
        if (difference < smallestDifference) {
            smallestDifference = difference;
            bestClub = club;
        }
    }

    recommendationDisplay.innerText = `${bestClub} (Avg: ${averages[bestClub]} Yds)`;
}

// Start the app!
initGPS();