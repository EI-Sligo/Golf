let currentLat = null;
let currentLng = null;
// 1. The Course Data (Castle Dargan Greens)
// You will need to replace these coordinates with the exact center of each green from Google Maps
const courseData = [
    { hole: 1, lat: 54.28196696104805, lng: -8.455640152917992 },
    { hole: 2, lat: 54.216234, lng: -8.413567 },
    { hole: 3, lat: 54.217345, lng: -8.414678 }
    // Add the rest up to hole 18 later
];

let currentHoleIndex = 0; // Starts at Hole 1 (array index 0)

// 2. DOM Elements (Connecting JS to your HTML)
const distanceDisplay = document.getElementById('distance-number');
const currentHoleDisplay = document.getElementById('current-hole');

// 3. Start GPS Tracking
function initGPS() {
    // Check if the browser supports GPS
    if ("geolocation" in navigator) {
        
        // Updated watchPosition block inside your initGPS function
navigator.geolocation.watchPosition(
    (position) => {
        // Save to global variables for the shot tracker to use
        currentLat = position.coords.latitude;
        currentLng = position.coords.longitude;
        
        const currentHole = courseData[currentHoleIndex];
        const yardage = calculateDistance(currentLat, currentLng, currentHole.lat, currentHole.lng);
        distanceDisplay.innerText = yardage;
    },
    (error) => {
        console.error("GPS Error:", error.message);
        distanceDisplay.innerText = "Err";
    },
    { enableHighAccuracy: true, maximumAge: 0 } 
);
            // Force the phone to use the actual GPS chip, not just cell towers
            { enableHighAccuracy: true, maximumAge: 0 } 
        );
    } else {
        alert("GPS is not supported by your device or browser.");
    }
}

// Start the app
initGPS();
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
    
    // Convert meters to yards
    const distanceInYards = distanceInMeters * 1.09361; 
    
    // Round to the nearest whole number (golfers don't need decimals)
    return Math.round(distanceInYards); 
}
// Variables to hold the state of the shot
let isTrackingShot = false;
let shotStartLat = null;
let shotStartLng = null;

// Grab the HTML elements
const trackBtn = document.getElementById('track-btn');
const clubSelect = document.getElementById('club-select');
const shotResultDisplay = document.getElementById('shot-result');
const lastShotDistance = document.getElementById('last-shot-distance');

trackBtn.addEventListener('click', () => {
    // Safety check: ensure the GPS has locked on before tracking
    if (!currentLat || !currentLng) {
        alert("Waiting for GPS signal...");
        return;
    }

    if (!isTrackingShot) {
        // STEP 1: START THE SHOT (You are at the tee/fairway)
        isTrackingShot = true;
        shotStartLat = currentLat;
        shotStartLng = currentLng;

        // Change button appearance so you know it's recording
        trackBtn.innerText = "End Shot (Walk to ball)";
        trackBtn.style.backgroundColor = "#e74c3c"; // Red
        shotResultDisplay.style.display = 'none'; 

    } else {
        // STEP 2: END THE SHOT (You are at your golf ball)
        const selectedClub = clubSelect.value;

        if (selectedClub === "") {
            alert("Please select the club you used first!");
            return;
        }

        // Run our Haversine math on the start and end coordinates
        const shotDistance = calculateDistance(shotStartLat, shotStartLng, currentLat, currentLng);

        // Save it to memory
        saveShotData(selectedClub, shotDistance);

        // Show the result on the screen
        lastShotDistance.innerText = shotDistance;
        shotResultDisplay.style.display = 'block';

        // Reset the tracker for the next shot
        isTrackingShot = false;
        shotStartLat = null;
        shotStartLng = null;
        trackBtn.innerText = "Start Shot";
        trackBtn.style.backgroundColor = "#27ae60"; // Back to Green
        clubSelect.value = ""; 
    }
});

// 3. Save to localStorage
function saveShotData(club, distance) {
    // Look for existing saved shots in the browser, or start an empty array if none exist
    let savedShots = JSON.parse(localStorage.getItem('castleDarganShots')) || [];

    // Add the new shot to the list
    savedShots.push({
        club: club,
        distance: distance,
        date: new Date().toISOString()
    });

    // Overwrite the old memory with the updated list
    localStorage.setItem('castleDarganShots', JSON.stringify(savedShots));
    
    // Print to console so you can verify it's working in Codespaces
    console.log("All Saved Shots:", savedShots);
}