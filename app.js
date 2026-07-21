// ==========================================
// 1. GLOBAL VARIABLES & COURSE DATA
// ==========================================
let currentLat = null, currentLng = null, currentHoleIndex = 0; 
let isTrackingShot = false, shotStartLat = null, shotStartLng = null, pendingDistance = 0;
let shotTargetLat = null, shotTargetLng = null; 

let map, userMarker, pinMarker, pathLine, layupMarker;
let liveWindSpeed = 0, liveWindDir = 0, currentPlaysLike = 0;
let historyChartInstance = null, missTendencyChartInstance = null;
let hasCenteredMapThisHole = false; 

let isPlannerMode = false;
let gpsWatchId = null;
let hasReachedGreen = false; 
let toastTimeout = null;

const courseData = [
    { hole: 1, lat: 54.19860260754416, lng: -8.430412853346407, par: 4, si: 9, redPar: 4, redSi: 13, yds: { blue: 406, white: 379, green: 370, red: 337 }, bearing: 80 },
    { hole: 2, lat: 54.200161814306895, lng: -8.424006844479758, par: 4, si: 3, redPar: 5, redSi: 11, yds: { blue: 507, white: 452, green: 444, red: 423 }, bearing: 250 },
    { hole: 3, lat: 54.19966549964856, lng: -8.421158440726037, par: 3, si: 17, redPar: 3, redSi: 15, yds: { blue: 121, white: 117, green: 117, red: 113 }, bearing: 10 },
    { hole: 4, lat: 54.198003141877244, lng: -8.426296058686598, par: 4, si: 7, redPar: 4, redSi: 9, yds: { blue: 383, white: 373, green: 363, red: 326 }, bearing: 80 },
    { hole: 5, lat: 54.195054143085194, lng: -8.424626387916812, par: 4, si: 1, redPar: 4, redSi: 5, yds: { blue: 419, white: 414, green: 406, red: 314 }, bearing: 170 },
    { hole: 6, lat: 54.197729016023416, lng: -8.428028264871996, par: 5, si: 13, redPar: 5, redSi: 1, yds: { blue: 493, white: 474, green: 465, red: 421 }, bearing: 320 },
    { hole: 7, lat: 54.19744322884829, lng: -8.430189504889343, par: 3, si: 11, redPar: 3, redSi: 7, yds: { blue: 176, white: 173, green: 168, red: 143 }, bearing: 10 },
    { hole: 8, lat: 54.19736299578223, lng: -8.435396580824467, par: 4, si: 5, redPar: 5, redSi: 17, yds: { blue: 454, white: 409, green: 400, red: 392 }, bearing: 260 },
    { hole: 9, lat: 54.19507439833819, lng: -8.429110879230992, par: 5, si: 15, redPar: 5, redSi: 3, yds: { blue: 538, white: 517, green: 511, red: 492 }, bearing: 210 },
    { hole: 10, lat: 54.19671199778983, lng: -8.435360933020018, par: 5, si: 18, redPar: 5, redSi: 16, yds: { blue: 478, white: 478, green: 422, red: 393 }, bearing: 110 },
    { hole: 11, lat: 54.19579018888728, lng: -8.43634336114162, par: 3, si: 12, redPar: 3, redSi: 8, yds: { blue: 147, white: 132, green: 132, red: 121 }, bearing: 260 },
    { hole: 12, lat: 54.19446026733953, lng: -8.431195981102197, par: 4, si: 10, redPar: 4, redSi: 10, yds: { blue: 390, white: 367, green: 360, red: 326 }, bearing: 140 },
    { hole: 13, lat: 54.19470554657755, lng: -8.428031811482342, par: 3, si: 14, redPar: 3, redSi: 14, yds: { blue: 192, white: 188, green: 182, red: 130 }, bearing: 190 },
    { hole: 14, lat: 54.196793028209356, lng: -8.431739134965177, par: 4, si: 6, redPar: 5, redSi: 2, yds: { blue: 471, white: 436, green: 430, red: 404 }, bearing: 310 },
    { hole: 15, lat: 54.19745026248579, lng: -8.430184002328804, par: 4, si: 16, redPar: 4, redSi: 12, yds: { blue: 262, white: 259, green: 256, red: 217 }, bearing: 100 },
    { hole: 16, lat: 54.200159600739354, lng: -8.423991679297862, par: 4, si: 8, redPar: 4, redSi: 18, yds: { blue: 422, white: 417, green: 408, red: 285 }, bearing: 70 },
    { hole: 17, lat: 54.199393705917096, lng: -8.431547274737586, par: 4, si: 4, redPar: 4, redSi: 6, yds: { blue: 439, white: 431, green: 395, red: 360 }, bearing: 260 },
    { hole: 18, lat: 54.198736264449, lng: -8.4366211658155, par: 4, si: 2, redPar: 4, redSi: 4, yds: { blue: 455, white: 435, green: 412, red: 344 }, bearing: 260 }
];

const toRadians = deg => deg * (Math.PI / 180);
const toDegrees = rad => rad * (180 / Math.PI);

// Generate Mock Tees based on Scorecard Distances
function generateTees() {
    courseData.forEach(h => {
        h.tees = {};
        for (const [color, yards] of Object.entries(h.yds)) {
            const distanceMeters = yards * 0.9144;
            const bearingRad = toRadians(h.bearing);
            const R = 6371000;
            const latRad = toRadians(h.lat);
            const lngRad = toRadians(h.lng);
            
            const newLatRad = Math.asin(Math.sin(latRad) * Math.cos(distanceMeters / R) + Math.cos(latRad) * Math.sin(distanceMeters / R) * Math.cos(bearingRad));
            const newLngRad = lngRad + Math.atan2(Math.sin(bearingRad) * Math.sin(distanceMeters / R) * Math.cos(latRad), Math.cos(distanceMeters / R) - Math.sin(latRad) * Math.sin(newLatRad));
            
            h.tees[color] = { lat: toDegrees(newLatRad), lng: toDegrees(newLngRad) };
        }
    });
}
generateTees();

// Complete Iron & Wood Baselines
const baselineYardages = { 
    "High": { "Driver": 200, "3 Wood": 180, "5 Wood": 170, "4 Hybrid": 160, "5 Hybrid": 150, "4 Iron": 160, "5 Iron": 150, "6 Iron": 140, "7 Iron": 130, "8 Iron": 120, "9 Iron": 110, "PW": 100, "GW": 90, "SW": 80, "Putter": 15 }, 
    "Mid":  { "Driver": 230, "3 Wood": 210, "5 Wood": 195, "4 Hybrid": 185, "5 Hybrid": 175, "4 Iron": 185, "5 Iron": 175, "6 Iron": 165, "7 Iron": 155, "8 Iron": 145, "9 Iron": 135, "PW": 120, "GW": 105, "SW": 95, "Putter": 15 }, 
    "Low":  { "Driver": 260, "3 Wood": 235, "5 Wood": 220, "4 Hybrid": 205, "5 Hybrid": 195, "4 Iron": 205, "5 Iron": 195, "6 Iron": 180, "7 Iron": 165, "8 Iron": 155, "9 Iron": 145, "PW": 130, "GW": 115, "SW": 105, "Putter": 15 } 
};
const defaultBag = ["Driver", "3 Wood", "4 Hybrid", "5 Iron", "7 Iron", "8 Iron", "9 Iron", "PW", "SW", "Putter"];
const masterClubOrder = ["Driver", "3 Wood", "5 Wood", "4 Hybrid", "5 Hybrid", "4 Iron", "5 Iron", "6 Iron", "7 Iron", "8 Iron", "9 Iron", "PW", "GW", "SW", "Putter"];

function sortBag(bagArray) {
    return bagArray.sort((a, b) => {
        let idxA = masterClubOrder.indexOf(a); 
        let idxB = masterClubOrder.indexOf(b);
        if (idxA === -1) idxA = 99; 
        if (idxB === -1) idxB = 99;
        return idxA - idxB;
    });
}

// ==========================================
// 2. START SCREEN & PLANNER MODE
// ==========================================
if (localStorage.getItem('castleDarganScorecard')) {
    document.getElementById('resume-round-btn').style.display = 'block';
}

function startUI() {
    document.getElementById('start-round-screen').style.display = 'none';
    document.getElementById('active-round-ui').style.display = 'block';
    updateHoleDisplay();
}

document.getElementById('begin-round-btn').addEventListener('click', () => {
    localStorage.removeItem('castleDarganScorecard');
    isPlannerMode = false; 
    document.getElementById('planner-banner').style.display = 'none';
    startUI(); 
    initGPS();
});

document.getElementById('resume-round-btn').addEventListener('click', () => {
    isPlannerMode = false; 
    document.getElementById('planner-banner').style.display = 'none';
    startUI(); 
    initGPS();
});

document.getElementById('plan-round-btn').addEventListener('click', () => {
    isPlannerMode = true; 
    document.getElementById('planner-banner').style.display = 'block';
    if(gpsWatchId) navigator.geolocation.clearWatch(gpsWatchId);
    startUI(); 
});

document.getElementById('exit-planner-btn').addEventListener('click', () => {
    document.getElementById('active-round-ui').style.display = 'none';
    document.getElementById('start-round-screen').style.display = 'block';
});

document.getElementById('tee-box-select').addEventListener('change', () => {
    if(isPlannerMode) { 
        hasCenteredMapThisHole = false; 
        updateHoleDisplay(); 
    } else { 
        updateScoreInputs(); 
    }
});

function showToast(msg, onUndoCallback) {
    const toast = document.getElementById('toast-notification'); 
    document.getElementById('toast-msg').innerText = msg; 
    toast.style.display = 'flex';
    
    document.getElementById('toast-undo-btn').onclick = () => { 
        onUndoCallback(); 
        toast.style.display = 'none'; 
        clearTimeout(toastTimeout); 
    };
    
    clearTimeout(toastTimeout); 
    toastTimeout = setTimeout(() => { toast.style.display = 'none'; }, 5000);
}

// ==========================================
// 3. TABS, BAG SETTINGS & BACKUP
// ==========================================
document.getElementById('tab-play').addEventListener('click', () => switchTab('play'));
document.getElementById('tab-history').addEventListener('click', () => switchTab('history'));
document.getElementById('tab-settings').addEventListener('click', () => switchTab('settings'));

function switchTab(t) {
    document.querySelectorAll('.nav-btn, .view-section').forEach(el => el.classList.remove('active'));
    document.getElementById(`tab-${t}`).classList.add('active'); 
    document.getElementById(`view-${t}`).classList.add('active');
    
    if(t === 'play' && map) setTimeout(() => map.invalidateSize(), 100); 
    if(t === 'history') renderHistoryTab();
    if(t === 'settings') renderShotsList(); 
}

function getBag() { 
    return sortBag(JSON.parse(localStorage.getItem('castleDarganBag')) || defaultBag); 
}

function saveBag(bag) { 
    localStorage.setItem('castleDarganBag', JSON.stringify(sortBag(bag))); 
    renderBagUI(); 
}

function renderBagUI() {
    const bag = getBag();
    document.getElementById('club-select').innerHTML = '<option value="">Select...</option>' + bag.map(c => `<option value="${c}">${c}</option>`).join('');
    document.getElementById('my-bag-list').innerHTML = bag.map(c => `<div class="club-tag">${c} <button class="remove-club" onclick="removeClub('${c}')">x</button></div>`).join('');
}

window.removeClub = function(c) { saveBag(getBag().filter(b => b !== c)); }
document.getElementById('add-club-btn').addEventListener('click', () => { 
    let bag = getBag(); 
    let nc = document.getElementById('new-club-select').value; 
    if(!bag.includes(nc)) { bag.push(nc); saveBag(bag); }
});
document.getElementById('reset-bag-btn').addEventListener('click', () => saveBag(defaultBag));

const handicapInput = document.getElementById('playing-handicap'); 
handicapInput.value = localStorage.getItem('castleDarganPlayingHandicap') || 18;
handicapInput.addEventListener('change', (e) => { 
    localStorage.setItem('castleDarganPlayingHandicap', e.target.value); 
    updateScoreInputs(); 
});

const handicapSelect = document.getElementById('handicap-select'); 
handicapSelect.value = localStorage.getItem('castleDarganHandicap') || "High";
handicapSelect.addEventListener('change', (e) => { 
    localStorage.setItem('castleDarganHandicap', e.target.value); 
    recommendClub(currentPlaysLike || parseInt(document.getElementById('distance-number').innerText)); 
});

function renderShotsList() {
    const shots = JSON.parse(localStorage.getItem('castleDarganShots')) || []; 
    const listEl = document.getElementById('tracked-shots-list');
    
    if (shots.length === 0) { 
        listEl.innerHTML = "<p style='text-align: center; color: #7f8c8d;'>No shots tracked yet.</p>"; 
        return; 
    }
    
    listEl.innerHTML = '';
    [...shots].reverse().forEach((s, reversedIdx) => {
        const originalIdx = shots.length - 1 - reversedIdx; 
        const dateStr = s.date ? new Date(s.date).toLocaleDateString() : 'Unknown Date';
        
        listEl.innerHTML += `
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #eee; padding: 10px 0;">
                <div>
                    <strong style="color: #2c3e50;">${s.club}</strong> - <span style="color: #27ae60; font-weight: bold;">${s.distance} Yds</span><br>
                    <span style="font-size: 0.8rem; color: #7f8c8d;">${s.accuracy || 'Fairway'} | Hole ${s.hole || '?'}</span>
                </div>
                <button onclick="deleteShot(${originalIdx})" style="background: none; border: none; color: #e74c3c; cursor: pointer; font-size: 1.2rem;">🗑️</button>
            </div>
        `;
    });
}

window.deleteShot = function(originalIdx) {
    if (confirm("Delete this shot?")) {
        let shots = JSON.parse(localStorage.getItem('castleDarganShots')) || []; 
        shots.splice(originalIdx, 1); 
        localStorage.setItem('castleDarganShots', JSON.stringify(shots));
        renderShotsList(); 
        updateAnalytics(); 
        if(currentPlaysLike) recommendClub(currentPlaysLike);
    }
}

document.getElementById('export-btn').addEventListener('click', () => {
    const backupData = { 
        shots: localStorage.getItem('castleDarganShots'), 
        scorecard: localStorage.getItem('castleDarganScorecard'), 
        bag: localStorage.getItem('castleDarganBag'), 
        history: localStorage.getItem('castleDarganHistory'), 
        pins: localStorage.getItem('castleDarganPins'), 
        tees: localStorage.getItem('castleDarganTees'), 
        phcap: localStorage.getItem('castleDarganPlayingHandicap') 
    };
    const a = document.createElement('a'); 
    a.href = URL.createObjectURL(new Blob([JSON.stringify(backupData)], {type: "application/json"})); 
    a.download = `CDCaddy_Backup.json`; 
    a.click();
});

document.getElementById('import-trigger-btn').addEventListener('click', () => document.getElementById('import-file').click());
document.getElementById('import-file').addEventListener('change', (e) => {
    const file = e.target.files[0]; 
    if (!file) return; 
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            if (data.shots) localStorage.setItem('castleDarganShots', data.shots); 
            if (data.scorecard) localStorage.setItem('castleDarganScorecard', data.scorecard);
            if (data.bag) localStorage.setItem('castleDarganBag', data.bag); 
            if (data.history) localStorage.setItem('castleDarganHistory', data.history);
            if (data.pins) localStorage.setItem('castleDarganPins', data.pins); 
            if (data.tees) localStorage.setItem('castleDarganTees', data.tees);
            if (data.phcap) localStorage.setItem('castleDarganPlayingHandicap', data.phcap);
            alert("Data imported! App will reload."); 
            location.reload();
        } catch (err) { 
            alert("Error parsing file."); 
        }
    }; 
    reader.readAsText(file);
});

// ==========================================
// 4. MATH, WEATHER & MAP
// ==========================================
function calculateDistance(lat1, lon1, lat2, lon2) {
    if (!lat1 || !lat2) return 0;
    const R = 6371000; 
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    const a = Math.sin(dLat/2)**2 + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon/2)**2; 
    return Math.round((R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)))) * 1.09361); 
}

function calculateBearing(lat1, lon1, lat2, lon2) {
    const dLon = toRadians(lon2 - lon1);
    const y = Math.sin(dLon) * Math.cos(toRadians(lat2));
    const x = Math.cos(toRadians(lat1)) * Math.sin(toRadians(lat2)) - Math.sin(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.cos(dLon);
    return (toDegrees(Math.atan2(y, x)) + 360) % 360;
}

async function fetchWeather(lat, lng) {
    try {
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=wind_speed_10m,wind_direction_10m&wind_speed_unit=mph`);
        const data = await res.json();
        liveWindSpeed = Math.round(data.current.wind_speed_10m); 
        liveWindDir = data.current.wind_direction_10m;
        document.getElementById('wind-speed-display').innerText = `${liveWindSpeed} mph`;
        document.getElementById('wind-dir-icon').innerHTML = `<span style="display:inline-block; transform: rotate(${liveWindDir}deg);">↓</span>`;
    } catch (err) { 
        console.log("Weather failed"); 
    }
}
document.getElementById('refresh-weather-btn').addEventListener('click', () => { if(currentLat) fetchWeather(currentLat, currentLng); });

function initMap() {
    map = L.map('map', { zoomControl: false }).setView([54.198, -8.430], 16);
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { attribution: 'Tiles &copy; Esri' }).addTo(map);

    const blueDot = L.divIcon({ className: 'custom-div-icon', html: "<div style='background-color:#3498db; width:22px; height:22px; border-radius:50%; border:3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.5); cursor: grab; pointer-events: auto;'></div>", iconSize: [28,28] });
    const redPin = L.divIcon({ className: 'custom-div-icon', html: "<div style='background-color:#e74c3c; width:15px; height:15px; border-radius:50%; border:2px solid white;'></div>", iconSize: [15,15] });
    const yellowLayup = L.divIcon({ className: 'custom-div-icon', html: "<div style='background-color:#f1c40f; width:12px; height:12px; border-radius:50%; border:2px solid white;'></div>", iconSize: [12,12] });

    userMarker = L.marker([0,0], {icon: blueDot, draggable: true}).addTo(map); 
    userMarker.dragging.disable(); 
    
    pinMarker = L.marker([0,0], {icon: redPin}).addTo(map);
    pathLine = L.polyline([], {color: '#f39c12', dashArray: '5, 5', weight: 3}).addTo(map);

    // Draggable blue dot logic
    userMarker.on('dragend', function(e) { 
        saveNewTeeLocation(e.target.getLatLng()); 
    });

    // Right click tee setter
    map.on('contextmenu', function(e) { 
        saveNewTeeLocation(e.latlng); 
    });

    // Layup setting
    map.on('click', function(e) {
        if(!currentLat) return;
        if(layupMarker) map.removeLayer(layupMarker);
        layupMarker = L.marker(e.latlng, {icon: yellowLayup}).addTo(map);
        updateLayupData(e.latlng.lat, e.latlng.lng);
    });
}

function saveNewTeeLocation(latlng) {
    const selectedTee = document.getElementById('tee-box-select').value;
    let savedTees = JSON.parse(localStorage.getItem('castleDarganTees')) || {};
    
    if(!savedTees[currentHoleIndex]) savedTees[currentHoleIndex] = {};
    const oldTee = savedTees[currentHoleIndex][selectedTee];
    
    savedTees[currentHoleIndex][selectedTee] = { lat: latlng.lat, lng: latlng.lng };
    localStorage.setItem('castleDarganTees', JSON.stringify(savedTees));
    
    showToast("Tee Box Position Updated!", () => {
        if (oldTee) {
            savedTees[currentHoleIndex][selectedTee] = oldTee;
        } else {
            delete savedTees[currentHoleIndex][selectedTee];
        }
        localStorage.setItem('castleDarganTees', JSON.stringify(savedTees)); 
        updateHoleDisplay(); 
    });
    
    if (isPlannerMode) {
        processLocation(latlng.lat, latlng.lng);
    }
}

function updateLayupData(layupLat, layupLng) {
    document.getElementById('layup-info-box').style.display = 'block';
    
    let tLat = courseData[currentHoleIndex].lat;
    let tLng = courseData[currentHoleIndex].lng;
    
    const customPins = JSON.parse(localStorage.getItem('castleDarganPins')) || {};
    if (customPins[currentHoleIndex]) { 
        tLat = customPins[currentHoleIndex].lat; 
        tLng = customPins[currentHoleIndex].lng; 
    }

    const distToLayup = calculateDistance(currentLat, currentLng, layupLat, layupLng);
    const distToPin = calculateDistance(layupLat, layupLng, tLat, tLng);
    
    const layupBearing = calculateBearing(currentLat, currentLng, layupLat, layupLng);
    const layupPlaysLike = Math.max(0, Math.round(distToLayup + (Math.cos(toRadians(liveWindDir - layupBearing)) * liveWindSpeed)));
    
    const pinBearing = calculateBearing(layupLat, layupLng, tLat, tLng);
    const pinPlaysLike = Math.max(0, Math.round(distToPin + (Math.cos(toRadians(liveWindDir - pinBearing)) * liveWindSpeed)));

    const layupRec = getClubRecommendationData(layupPlaysLike); 
    const pinRec = getClubRecommendationData(pinPlaysLike);

    document.getElementById('layup-dist').innerText = distToLayup; 
    document.getElementById('layup-plays').innerText = layupPlaysLike;
    document.getElementById('layup-club').innerText = layupRec ? layupRec.club : 'None';
    
    document.getElementById('layup-rem').innerText = distToPin; 
    document.getElementById('layup-rem-plays').innerText = pinPlaysLike;
    document.getElementById('layup-rem-club').innerText = pinRec ? pinRec.club : 'None';
}

document.getElementById('clear-layup-btn').addEventListener('click', () => { 
    document.getElementById('layup-info-box').style.display = 'none'; 
    if(layupMarker) { map.removeLayer(layupMarker); layupMarker = null; }
});

document.getElementById('recenter-map-btn').addEventListener('click', () => {
    hasCenteredMapThisHole = false; 
    let tLat = courseData[currentHoleIndex].lat;
    let tLng = courseData[currentHoleIndex].lng;
    
    const customPins = JSON.parse(localStorage.getItem('castleDarganPins')) || {}; 
    if (customPins[currentHoleIndex]) { 
        tLat = customPins[currentHoleIndex].lat; 
        tLng = customPins[currentHoleIndex].lng; 
    }
    
    if(currentLat && tLat) updateMapState(tLat, tLng);
});

function updateMapState(tLat, tLng) {
    if(!map) initMap();
    if(currentLat) userMarker.setLatLng([currentLat, currentLng]); 
    if(tLat) pinMarker.setLatLng([tLat, tLng]);
    if(currentLat && tLat) pathLine.setLatLngs([[currentLat, currentLng], [tLat, tLng]]);
    
    if (!hasCenteredMapThisHole && currentLat && tLat) { 
        map.fitBounds(L.latLngBounds([[currentLat, currentLng], [tLat, tLng]]), { padding: [20, 20], maxZoom: 18 }); 
        hasCenteredMapThisHole = true; 
    }
}

// THE LOCATION ENGINE (Live & Planner Mode Logic)
function processLocation(lat, lng) {
    currentLat = lat; 
    currentLng = lng;
    
    if(liveWindSpeed === 0) fetchWeather(currentLat, currentLng);
    
    let tLat = courseData[currentHoleIndex].lat;
    let tLng = courseData[currentHoleIndex].lng;
    const customPins = JSON.parse(localStorage.getItem('castleDarganPins')) || {};
    
    if (customPins[currentHoleIndex]) { 
        tLat = customPins[currentHoleIndex].lat; 
        tLng = customPins[currentHoleIndex].lng; 
    }

    let rawYardage;
    const selectedTee = document.getElementById('tee-box-select').value;
    
    if (isPlannerMode) { 
        rawYardage = courseData[currentHoleIndex].yds[selectedTee]; 
    } else { 
        rawYardage = calculateDistance(currentLat, currentLng, tLat, tLng); 
    }
    
    document.getElementById('distance-number').innerText = rawYardage > 0 ? rawYardage : "--"; 

    // Geofencing Auto-Advance
    if (!isPlannerMode) {
        if (rawYardage < 30) { hasReachedGreen = true; }
        if (hasReachedGreen && rawYardage > 60) {
            hasReachedGreen = false;
            if (currentHoleIndex < courseData.length - 1) { 
                currentHoleIndex++; 
                updateHoleDisplay(); 
                return; 
            }
        }
    }

    const holeBearing = calculateBearing(currentLat, currentLng, tLat, tLng);
    const effectiveWind = Math.cos(toRadians(liveWindDir - holeBearing)) * liveWindSpeed; 
    currentPlaysLike = Math.max(0, Math.round(rawYardage + effectiveWind)); 
    document.getElementById('plays-like-number').innerText = currentPlaysLike > 0 ? currentPlaysLike : "--";

    if(tLat) updateMapState(tLat, tLng); 
    recommendClub(currentPlaysLike);
    
    if(layupMarker) updateLayupData(layupMarker.getLatLng().lat, layupMarker.getLatLng().lng);
}

function initGPS() {
    if ("geolocation" in navigator) {
        gpsWatchId = navigator.geolocation.watchPosition(
            (pos) => { if(!isPlannerMode) processLocation(pos.coords.latitude, pos.coords.longitude); },
            (err) => console.log("GPS Err"), { enableHighAccuracy: true, maximumAge: 0 } 
        );
    }
}

// ==========================================
// 5. CADDY & AUDIO
// ==========================================
document.getElementById('audio-caddy-btn').addEventListener('click', () => {
    const dist = document.getElementById('distance-number').innerText; 
    if(dist === "--") return;
    
    const playsLike = document.getElementById('plays-like-number').innerText; 
    const rec = getClubRecommendationData(currentPlaysLike);
    
    let msg = `You have ${dist} yards to the pin. `;
    if (playsLike !== dist && playsLike !== "--") { msg += `It is playing like ${playsLike} yards. `; }
    msg += `The Caddy recommends ${rec ? rec.club : "a club of your choice"}.`;
    
    const speech = new SpeechSynthesisUtterance(msg); 
    speech.lang = 'en-GB'; 
    speech.rate = 0.9; 
    window.speechSynthesis.speak(speech);
});

function calculateDispersion() {
    const bag = getBag(); 
    const baselines = baselineYardages[document.getElementById('handicap-select').value || "High"];
    const savedShots = JSON.parse(localStorage.getItem('castleDarganShots')) || [];
    const clubData = {}; 
    
    bag.forEach(c => clubData[c] = []);
    savedShots.forEach(s => { if(clubData[s.club]) clubData[s.club].push(s.distance); });

    const analytics = {};
    bag.forEach(club => {
        const shots = clubData[club];
        if(shots.length === 0) { 
            analytics[club] = { type: 'baseline', avg: baselines[club] }; 
        } else if (shots.length < 4) { 
            analytics[club] = { type: 'raw', avg: Math.round(shots.reduce((a,b)=>a+b)/shots.length) }; 
        } else {
            shots.sort((a,b) => a-b); 
            const coreShots = shots.slice(Math.floor(shots.length * 0.20), Math.floor(shots.length * 0.90));
            analytics[club] = { 
                type: 'filtered', 
                avg: Math.round(coreShots.reduce((a,b)=>a+b)/coreShots.length), 
                min: coreShots[0], 
                max: coreShots[coreShots.length-1] 
            };
        }
    }); 
    return analytics;
}

function getClubRecommendationData(targetYardage) {
    if (!targetYardage || targetYardage <= 0) return null;
    const analytics = calculateDispersion(); 
    let bestClub = "None", minDiff = Infinity;
    
    for(const club in analytics) {
        if (club === "Putter") continue; 
        if(analytics[club].avg) {
            let diff = Math.abs(analytics[club].avg - targetYardage);
            if (diff < minDiff) { minDiff = diff; bestClub = club; }
        }
    }
    if (bestClub === "None") return null; 
    return { club: bestClub, data: analytics[bestClub] };
}

function recommendClub(targetYardage) {
    const rec = getClubRecommendationData(targetYardage); 
    const recEl = document.getElementById('recommended-club');
    
    if (!rec) { recEl.innerText = "Calculating..."; return; }
    
    if(rec.data.type === 'filtered') { 
        recEl.innerHTML = `${rec.club} <br><span style="font-size:0.8rem; color:#555;">Range: ${rec.data.min} - ${rec.data.max} Yds</span>`; 
    } else { 
        recEl.innerText = `${rec.club} (Avg: ${rec.data.avg || '--'} Yds)`; 
    }
}

// ==========================================
// 6. TARGET DISPERSION SHOT TRACKING
// ==========================================
document.getElementById('track-btn').addEventListener('click', () => {
    if (!isTrackingShot) {
        isTrackingShot = true; 
        shotStartLat = currentLat; 
        shotStartLng = currentLng;
        
        // 1. Lock in the Target! (Use Layup Marker if it exists, otherwise use the Pin)
        if (layupMarker) {
            shotTargetLat = layupMarker.getLatLng().lat; 
            shotTargetLng = layupMarker.getLatLng().lng;
        } else {
            let tLat = courseData[currentHoleIndex].lat;
            let tLng = courseData[currentHoleIndex].lng;
            const customPins = JSON.parse(localStorage.getItem('castleDarganPins')) || {};
            if (customPins[currentHoleIndex]) { 
                tLat = customPins[currentHoleIndex].lat; 
                tLng = customPins[currentHoleIndex].lng; 
            }
            shotTargetLat = tLat; 
            shotTargetLng = tLng;
        }

        document.getElementById('track-btn').innerText = "End Shot"; 
        document.getElementById('track-btn').style.backgroundColor = "#f39c12"; 
    } else {
        pendingDistance = calculateDistance(shotStartLat, shotStartLng, currentLat, currentLng);
        document.getElementById('pending-distance').innerText = pendingDistance;

        // 2. DISPERSION MATH
        let missDistance = calculateDistance(currentLat, currentLng, shotTargetLat, shotTargetLng);
        let targetBearing = calculateBearing(shotStartLat, shotStartLng, shotTargetLat, shotTargetLng);
        let actualBearing = calculateBearing(shotStartLat, shotStartLng, currentLat, currentLng);
        
        let angleDiff = (actualBearing - targetBearing + 360) % 360;
        
        let autoAccuracy = "Fairway";
        let missText = "";

        if (missDistance <= 15) {
            autoAccuracy = "Fairway";
            missText = "🎯 Bullseye! (Within 15 yds of target)";
            document.getElementById('dispersion-text').style.color = "#27ae60";
        } else {
            document.getElementById('dispersion-text').style.color = "#e74c3c";
            
            // If ball is right of target vector
            if (angleDiff > 5 && angleDiff < 175) {
                autoAccuracy = "Right Rough"; 
                missText = `Missed ${missDistance} yds Right`;
            } 
            // If ball is left of target vector
            else if (angleDiff > 185 && angleDiff < 355) {
                autoAccuracy = "Left Rough"; 
                missText = `Missed ${missDistance} yds Left`;
            } 
            // Straight but severely short or long
            else {
                autoAccuracy = "Short/Long";
                let intendedDist = calculateDistance(shotStartLat, shotStartLng, shotTargetLat, shotTargetLng);
                let shortLong = pendingDistance < intendedDist ? "Short" : "Long";
                missText = `Missed ${missDistance} yds ${shortLong}`;
            }
        }

        document.getElementById('dispersion-text').innerText = missText;
        document.getElementById('accuracy-select').value = autoAccuracy;

        document.getElementById('track-btn').style.display = 'none'; 
        document.getElementById('shot-review-area').style.display = 'block'; 
    }
});

document.getElementById('save-shot-btn').addEventListener('click', () => {
    const club = document.getElementById('club-select').value; 
    if (!club) return alert("Select a club!");
    
    const oldShots = localStorage.getItem('castleDarganShots'); 
    let bag = JSON.parse(oldShots) || [];
    bag.push({ 
        hole: courseData[currentHoleIndex].hole, 
        club: club, 
        distance: pendingDistance, 
        accuracy: document.getElementById('accuracy-select').value, 
        date: new Date().toISOString() 
    });
    
    localStorage.setItem('castleDarganShots', JSON.stringify(bag));
    updateAnalytics(); 
    resetTrackerUI();
    
    showToast("Shot Saved", () => {
        if(oldShots) {
            localStorage.setItem('castleDarganShots', oldShots); 
        } else {
            localStorage.removeItem('castleDarganShots');
        }
        updateAnalytics(); 
        renderShotsList();
    });
});
document.getElementById('ignore-shot-btn').addEventListener('click', resetTrackerUI);

function resetTrackerUI() {
    isTrackingShot = false; 
    document.getElementById('shot-review-area').style.display = 'none'; 
    document.getElementById('track-btn').style.display = 'block'; 
    document.getElementById('track-btn').innerText = "Start Shot"; 
    document.getElementById('track-btn').style.backgroundColor = "#27ae60"; 
}

// ==========================================
// 7. PINS & SCORECARD
// ==========================================
document.getElementById('update-pin-btn').addEventListener('click', () => {
    if (!currentLat) return alert("Waiting for GPS...");
    let customPins = JSON.parse(localStorage.getItem('castleDarganPins')) || {};
    customPins[currentHoleIndex] = { lat: currentLat, lng: currentLng };
    localStorage.setItem('castleDarganPins', JSON.stringify(customPins));
    
    hasCenteredMapThisHole = false; 
    if(currentLat) updateMapState(currentLat, currentLng); 
});

document.getElementById('reset-pin-btn').addEventListener('click', () => {
    let customPins = JSON.parse(localStorage.getItem('castleDarganPins')) || {};
    if (customPins[currentHoleIndex]) { 
        delete customPins[currentHoleIndex]; 
        localStorage.setItem('castleDarganPins', JSON.stringify(customPins)); 
    }
    const hd = courseData[currentHoleIndex]; 
    hasCenteredMapThisHole = false; 
    if(hd.lat) updateMapState(hd.lat, hd.lng);
});

function updateHoleDisplay() {
    hasCenteredMapThisHole = false; 
    hasReachedGreen = false;
    
    const hd = courseData[currentHoleIndex]; 
    const selectedTee = document.getElementById('tee-box-select').value;
    const activePar = selectedTee === 'red' ? hd.redPar : hd.par; 
    const activeSi = selectedTee === 'red' ? hd.redSi : hd.si;

    document.getElementById('current-hole').innerText = `Hole ${hd.hole}`;
    document.getElementById('hole-par-display').innerText = `Par ${activePar} | SI ${activeSi}`;
    document.getElementById('scorecard-hole-num').innerText = hd.hole;
    
    if(layupMarker) { map.removeLayer(layupMarker); layupMarker = null; }
    document.getElementById('layup-info-box').style.display = 'none';
    
    const scorecard = JSON.parse(localStorage.getItem('castleDarganScorecard')) || {};
    if (scorecard[currentHoleIndex]) {
        document.getElementById('hole-strokes').value = scorecard[currentHoleIndex].strokes;
        document.getElementById('hole-putts').value = scorecard[currentHoleIndex].putts;
        document.getElementById('hole-gir').checked = scorecard[currentHoleIndex].gir;
        document.getElementById('hole-points-display').innerText = scorecard[currentHoleIndex].points;
    } else {
        document.getElementById('hole-strokes').value = ""; 
        document.getElementById('hole-putts').value = ""; 
        document.getElementById('hole-gir').checked = false; 
        document.getElementById('hole-points-display').innerText = "0";
    }

    if (isPlannerMode) {
        if(userMarker) { userMarker.dragging.enable(); }
        const savedTees = JSON.parse(localStorage.getItem('castleDarganTees')) || {};
        let teeCoords = hd.tees[selectedTee];
        if (savedTees[currentHoleIndex] && savedTees[currentHoleIndex][selectedTee]) { 
            teeCoords = savedTees[currentHoleIndex][selectedTee]; 
        }
        processLocation(teeCoords.lat, teeCoords.lng);
    } else {
        if(userMarker) { userMarker.dragging.disable(); }
    }
}

document.getElementById('next-hole').addEventListener('click', () => { 
    if (currentHoleIndex < courseData.length - 1) { currentHoleIndex++; updateHoleDisplay(); }
});
document.getElementById('prev-hole').addEventListener('click', () => { 
    if (currentHoleIndex > 0) { currentHoleIndex--; updateHoleDisplay(); }
});

function calculateStableford(gross, par, si) {
    if (!gross || gross <= 0) return 0;
    const ph = parseInt(localStorage.getItem('castleDarganPlayingHandicap')) || 18;
    let strokesRec = Math.floor(ph / 18); 
    if ((ph % 18) >= si) strokesRec += 1;
    return Math.max(0, 2 - ((gross - strokesRec) - par));
}

document.getElementById('hole-strokes').addEventListener('input', updateScoreInputs); 
document.getElementById('hole-putts').addEventListener('input', updateScoreInputs);

function updateScoreInputs() {
    const strokes = parseInt(document.getElementById('hole-strokes').value); 
    const putts = parseInt(document.getElementById('hole-putts').value);
    
    const hd = courseData[currentHoleIndex]; 
    const selectedTee = document.getElementById('tee-box-select').value;
    const activePar = selectedTee === 'red' ? hd.redPar : hd.par; 
    const activeSi = selectedTee === 'red' ? hd.redSi : hd.si;

    if (strokes && putts >= 0) document.getElementById('hole-gir').checked = ((strokes - putts) <= (activePar - 2));
    if (strokes) document.getElementById('hole-points-display').innerText = calculateStableford(strokes, activePar, activeSi);
}

document.getElementById('save-score-btn').addEventListener('click', () => {
    const strokes = parseInt(document.getElementById('hole-strokes').value); 
    if (!strokes) return alert("Enter strokes!");
    
    const oldScorecard = localStorage.getItem('castleDarganScorecard'); 
    const hd = courseData[currentHoleIndex]; 
    const selectedTee = document.getElementById('tee-box-select').value;
    const activePar = selectedTee === 'red' ? hd.redPar : hd.par; 
    const activeSi = selectedTee === 'red' ? hd.redSi : hd.si;

    let scorecard = JSON.parse(oldScorecard) || {};
    scorecard[currentHoleIndex] = { 
        hole: hd.hole, 
        par: activePar, 
        si: activeSi, 
        strokes: strokes, 
        putts: parseInt(document.getElementById('hole-putts').value) || 0, 
        gir: document.getElementById('hole-gir').checked, 
        points: calculateStableford(strokes, activePar, activeSi) 
    };
    
    localStorage.setItem('castleDarganScorecard', JSON.stringify(scorecard));
    updateAnalytics(); 
    
    showToast("Hole Score Saved", () => {
        if(oldScorecard) {
            localStorage.setItem('castleDarganScorecard', oldScorecard); 
        } else {
            localStorage.removeItem('castleDarganScorecard');
        }
        updateHoleDisplay(); 
        updateAnalytics();
    });
});

// ==========================================
// 8. ANALYTICS & HISTORY
// ==========================================
function updateAnalytics() {
    const scorecard = JSON.parse(localStorage.getItem('castleDarganScorecard')) || {};
    const shots = JSON.parse(localStorage.getItem('castleDarganShots')) || [];
    let totStrokes = 0, totPar = 0, totPutts = 0, holesPlayed = 0, girCount = 0, totPts = 0;

    for (let k in scorecard) {
        totStrokes += scorecard[k].strokes; 
        totPutts += scorecard[k].putts;
        totPar += scorecard[k].par; 
        totPts += scorecard[k].points; 
        holesPlayed++; 
        if (scorecard[k].gir) girCount++;
    }

    let driveCount = 0, fairwayCount = 0; 
    let missStats = { fairway: 0, left: 0, right: 0, other: 0 };
    
    shots.forEach(s => {
        if (s.club === "Driver" || s.club.includes("Wood")) { 
            driveCount++; 
            if (s.accuracy === "Fairway") { fairwayCount++; missStats.fairway++; }
            else if (s.accuracy === "Left Rough") missStats.left++;
            else if (s.accuracy === "Right Rough") missStats.right++;
            else missStats.other++; 
        }
    });

    const statScoreEl = document.getElementById('stat-score');
    if (holesPlayed > 0 && statScoreEl) {
        let stp = totStrokes - totPar; 
        statScoreEl.innerText = stp > 0 ? `+${stp}` : (stp === 0 ? "E" : stp);
        document.getElementById('stat-putts').innerText = (totPutts / holesPlayed).toFixed(1);
        document.getElementById('stat-gir').innerText = Math.round((girCount / holesPlayed) * 100) + "%";
        document.getElementById('stat-points').innerText = totPts;
    } else if (statScoreEl) {
        statScoreEl.innerText = "E"; 
        document.getElementById('stat-putts').innerText = "0.0";
        document.getElementById('stat-gir').innerText = "0%"; 
        document.getElementById('stat-points').innerText = "0";
    }
    
    if (driveCount > 0) {
        document.getElementById('stat-fir').innerText = Math.round((fairwayCount / driveCount) * 100) + "%";
    }

    if (driveCount > 0 && document.getElementById('missTendencyChart')) {
        const ctxMiss = document.getElementById('missTendencyChart').getContext('2d');
        if (missTendencyChartInstance) missTendencyChartInstance.destroy();
        
        missTendencyChartInstance = new Chart(ctxMiss, {
            type: 'doughnut',
            data: { 
                labels: ['Fairway', 'Left', 'Right', 'Short/OB'], 
                datasets: [{ 
                    data: [missStats.fairway, missStats.left, missStats.right, missStats.other], 
                    backgroundColor: ['#27ae60', '#e74c3c', '#f39c12', '#95a5a6'], 
                    borderWidth: 1 
                }] 
            },
            options: { plugins: { legend: { position: 'bottom' } }, cutout: '70%', responsive: true }
        });
    }
}

document.getElementById('end-round-btn').addEventListener('click', () => {
    const scorecard = JSON.parse(localStorage.getItem('castleDarganScorecard'));
    if (!scorecard || Object.keys(scorecard).length === 0) return alert("No scores saved!");
    if (confirm("End this round and save to History?")) {
        let totPts = 0, totStrokes = 0; 
        
        for (let k in scorecard) { 
            totPts += scorecard[k].points; 
            totStrokes += scorecard[k].strokes; 
        }
        
        let history = JSON.parse(localStorage.getItem('castleDarganHistory')) || [];
        history.push({ 
            date: new Date().toLocaleDateString(), 
            holesPlayed: Object.keys(scorecard).length, 
            points: totPts, 
            strokes: totStrokes 
        });
        localStorage.setItem('castleDarganHistory', JSON.stringify(history));
        
        localStorage.removeItem('castleDarganScorecard'); 
        updateHoleDisplay(); 
        updateAnalytics();
        
        document.getElementById('active-round-ui').style.display = 'none';
        document.getElementById('start-round-screen').style.display = 'block';
        document.getElementById('resume-round-btn').style.display = 'none';
        
        switchTab('history');
    }
});

window.deleteRound = function(originalIndex) {
    if (confirm("Permanently delete this round?")) {
        let history = JSON.parse(localStorage.getItem('castleDarganHistory')) || [];
        history.splice(originalIndex, 1); 
        localStorage.setItem('castleDarganHistory', JSON.stringify(history)); 
        renderHistoryTab();
    }
}

function renderHistoryTab() {
    const history = JSON.parse(localStorage.getItem('castleDarganHistory')) || []; 
    const listEl = document.getElementById('past-rounds-list');
    
    updateAnalytics(); 

    if (history.length === 0) { 
        listEl.innerHTML = "<p style='text-align:center;'>No rounds saved yet.</p>"; 
        return; 
    }
    
    listEl.innerHTML = ''; 
    const labels = [], dataPoints = [];
    
    [...history].reverse().forEach((r, reversedIdx) => {
        const originalIdx = history.length - 1 - reversedIdx;
        listEl.innerHTML += `
            <div class="history-round-card">
                <div><div class="history-date">${r.date}</div><div class="history-details">${r.holesPlayed} Holes | ${r.strokes} Strokes</div></div>
                <div style="display: flex; align-items: center; gap: 15px;">
                    <div class="history-points">${r.points} Pts</div>
                    <button onclick="deleteRound(${originalIdx})" style="background: none; border: none; color: #e74c3c; cursor: pointer; font-size: 1.2rem;">🗑️</button>
                </div>
            </div>`;
    });

    history.forEach((r, i) => { 
        labels.push(`Rnd ${i+1}`); 
        dataPoints.push(r.points); 
    });

    const ctx = document.getElementById('historyChart').getContext('2d');
    if (historyChartInstance) historyChartInstance.destroy();
    
    historyChartInstance = new Chart(ctx, {
        type: 'line',
        data: { 
            labels: labels, 
            datasets: [{ 
                label: 'Stableford Points', 
                data: dataPoints, 
                borderColor: '#3498db', 
                backgroundColor: 'rgba(52, 152, 219, 0.2)', 
                borderWidth: 3, 
                fill: true, 
                tension: 0.3 
            }] 
        },
        options: { responsive: true, scales: { y: { beginAtZero: true } } }
    });
}

// ==========================================
// 10. PWA REGISTRATION
// ==========================================
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').then(reg => {
        reg.onupdatefound = () => {
            const installingWorker = reg.installing;
            installingWorker.onstatechange = () => {
                if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) { 
                    window.location.reload(); 
                }
            };
        };
    }).catch(err => console.log("SW Failed", err));
}

renderBagUI();