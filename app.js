// ==========================================
// 1. GLOBAL VARIABLES & SELF-HEALING MEMORY
// ==========================================
let currentLat = null, currentLng = null, currentHoleIndex = 0; 
let isTrackingShot = false, shotStartLat = null, shotStartLng = null, pendingDistance = 0;
let shotTargetLat = null, shotTargetLng = null; 

let map, userMarker, pinMarker, pathLine, layupMarker;
let yellowLayupIcon = null; 
let clubOverlayGroup = null; 
let tracerMap = null; 

let liveWindSpeed = 0, liveWindDir = 0, currentPlaysLike = 0;
let historyChartInstance = null, missTendencyChartInstance = null;
let hasCenteredMapThisHole = false; 

let isPlannerMode = false;
let gpsWatchId = null;
let hasReachedGreen = false; 
let toastTimeout = null;
let activePlayers = []; 

function safeParse(key, fallback) {
    try {
        const item = localStorage.getItem(key);
        if (!item) return fallback;
        return JSON.parse(item);
    } catch (e) {
        console.warn(`Corrupted data detected for ${key}. Resetting to default.`);
        localStorage.removeItem(key);
        return fallback;
    }
}

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

const baselineYardages = { 
    "High": { "Driver": 200, "3 Wood": 180, "5 Wood": 170, "4 Hybrid": 160, "5 Hybrid": 150, "4 Iron": 160, "5 Iron": 150, "6 Iron": 140, "7 Iron": 130, "8 Iron": 120, "9 Iron": 110, "PW": 100, "GW": 90, "SW": 80, "Putter": 15 }, 
    "Mid":  { "Driver": 230, "3 Wood": 210, "5 Wood": 195, "4 Hybrid": 185, "5 Hybrid": 175, "4 Iron": 185, "5 Iron": 175, "6 Iron": 165, "7 Iron": 155, "8 Iron": 145, "9 Iron": 135, "PW": 120, "GW": 105, "SW": 95, "Putter": 15 }, 
    "Low":  { "Driver": 260, "3 Wood": 235, "5 Wood": 220, "4 Hybrid": 205, "5 Hybrid": 195, "4 Iron": 205, "5 Iron": 195, "6 Iron": 180, "7 Iron": 165, "8 Iron": 155, "9 Iron": 145, "PW": 130, "GW": 115, "SW": 105, "Putter": 15 } 
};
const defaultBag = ["Driver", "3 Wood", "4 Hybrid", "5 Iron", "7 Iron", "8 Iron", "9 Iron", "PW", "SW", "Putter"];
const masterClubOrder = ["Driver", "3 Wood", "5 Wood", "4 Hybrid", "5 Hybrid", "4 Iron", "5 Iron", "6 Iron", "7 Iron", "8 Iron", "9 Iron", "PW", "GW", "SW", "Putter"];

function sortBag(bagArray) {
    if(!Array.isArray(bagArray)) return defaultBag; 
    return bagArray.sort((a, b) => {
        let idxA = masterClubOrder.indexOf(a); 
        let idxB = masterClubOrder.indexOf(b);
        if (idxA === -1) idxA = 99; 
        if (idxB === -1) idxB = 99;
        return idxA - idxB;
    });
}

// ==========================================
// 2. MULTIPLAYER START SCREEN
// ==========================================
if (localStorage.getItem('castleDarganScorecard')) { 
    document.getElementById('resume-round-btn').style.display = 'block'; 
}

function initPlayers() {
    activePlayers = [ { id: 'A', name: 'Me', hcp: parseInt(document.getElementById('player-a-hcp').value) || 18 } ];
    ['B', 'C', 'D'].forEach(letter => {
        const name = document.getElementById(`player-${letter.toLowerCase()}-name`).value;
        const hcp = document.getElementById(`player-${letter.toLowerCase()}-hcp`).value;
        if(name) activePlayers.push({ id: letter, name, hcp: parseInt(hcp) || 18 });
    });
    localStorage.setItem('castleDarganPlayers', JSON.stringify(activePlayers));
}

function startUI() {
    document.getElementById('start-round-screen').style.display = 'none';
    document.getElementById('active-round-ui').style.display = 'block';
    updateHoleDisplay();
}

document.getElementById('begin-round-btn').addEventListener('click', () => {
    localStorage.removeItem('castleDarganScorecard');
    localStorage.removeItem('castleDarganActiveRoundShots'); 
    initPlayers();
    isPlannerMode = false; 
    document.getElementById('planner-banner').style.display = 'none';
    startUI(); 
    initGPS();
});

document.getElementById('resume-round-btn').addEventListener('click', () => {
    activePlayers = safeParse('castleDarganPlayers', [{ id: 'A', name: 'Me', hcp: 18 }]);
    isPlannerMode = false; 
    document.getElementById('planner-banner').style.display = 'none';
    startUI(); 
    initGPS();
});

document.getElementById('plan-round-btn').addEventListener('click', () => {
    initPlayers();
    isPlannerMode = true; 
    document.getElementById('planner-banner').style.display = 'block';
    if(gpsWatchId) navigator.geolocation.clearWatch(gpsWatchId);
    startUI(); 
});

document.getElementById('exit-planner-btn').addEventListener('click', () => {
    document.getElementById('active-round-ui').style.display = 'none';
    document.getElementById('start-round-screen').style.display = 'block';
});

document.getElementById('quit-round-btn').addEventListener('click', () => {
    if(confirm("Are you sure you want to quit? This round and its tracked shots will NOT be saved.")) {
        localStorage.removeItem('castleDarganScorecard');
        localStorage.removeItem('castleDarganActiveRoundShots');
        document.getElementById('active-round-ui').style.display = 'none';
        document.getElementById('start-round-screen').style.display = 'block';
        document.getElementById('resume-round-btn').style.display = 'none';
        if(gpsWatchId) navigator.geolocation.clearWatch(gpsWatchId);
    }
});

document.getElementById('tee-box-select').addEventListener('change', () => {
    if(isPlannerMode) { 
        hasCenteredMapThisHole = false; 
        updateHoleDisplay(); 
    } else { 
        renderMultiplayerScorecard(); 
        updateHoleDisplay(); 
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
// 3. TABS, BAG ARCHIVING & BACKUP
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
    return sortBag(safeParse('castleDarganBag', defaultBag)); 
}

function saveBag(bag) { 
    localStorage.setItem('castleDarganBag', JSON.stringify(sortBag(bag))); 
    renderBagUI(); 
}

function renderBagUI() {
    const bag = getBag();
    
    const overlaySelect = document.getElementById('club-overlay-select'); 
    const currentOverlay = overlaySelect.value;
    overlaySelect.innerHTML = '<option value="">🎯 Range Overlay: Off</option>' + bag.map(c => `<option value="${c}">${c}</option>`).join('');
    overlaySelect.value = currentOverlay;

    document.getElementById('club-select').innerHTML = '<option value="">Select...</option>' + bag.map(c => `<option value="${c}">${c}</option>`).join('');
    
    document.getElementById('my-bag-list').innerHTML = bag.map(c => `
        <div class="club-tag">
            <span>${c}</span>
            <div class="club-tag-actions">
                <button class="archive-btn" onclick="archiveClub('${c}')" title="Archive Stats">🗄️</button>
                <button class="delete-btn" onclick="removeClub('${c}')" title="Delete Club">&times;</button>
            </div>
        </div>`).join('');
}

window.removeClub = function(c) { 
    saveBag(getBag().filter(b => b !== c)); 
}

window.archiveClub = function(clubName) {
    if(confirm(`Archive all past data for ${clubName}?\nThis preserves history but starts a clean slate for your Caddy averages.`)) {
        let shots = safeParse('castleDarganShots', []);
        const archiveDate = new Date().toLocaleDateString();
        
        shots.forEach(s => {
            if (s.club === clubName) s.club = `${clubName} (Archived ${archiveDate})`;
        });
        
        localStorage.setItem('castleDarganShots', JSON.stringify(shots));
        updateAnalytics(); 
        renderShotsList(); 
        alert(`${clubName} stats archived successfully.`);
    }
}

document.getElementById('add-club-btn').addEventListener('click', () => { 
    let bag = getBag(); 
    let nc = document.getElementById('new-club-select').value; 
    if(!bag.includes(nc)) { bag.push(nc); saveBag(bag); }
});

document.getElementById('reset-bag-btn').addEventListener('click', () => saveBag(defaultBag));

const handicapSelect = document.getElementById('handicap-select'); 
handicapSelect.value = localStorage.getItem('castleDarganHandicap') || "High";
handicapSelect.addEventListener('change', (e) => { 
    localStorage.setItem('castleDarganHandicap', e.target.value); 
    recommendClub(currentPlaysLike || parseInt(document.getElementById('distance-number').innerText)); 
    drawClubOverlay(); 
});

function renderShotsList() {
    const shots = safeParse('castleDarganShots', []); 
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
            </div>`;
    });
}

window.deleteShot = function(originalIdx) {
    if (confirm("Delete this shot permanently?")) {
        let shots = safeParse('castleDarganShots', []); 
        shots.splice(originalIdx, 1); 
        localStorage.setItem('castleDarganShots', JSON.stringify(shots));
        renderShotsList(); 
        updateAnalytics(); 
        if(currentPlaysLike) recommendClub(currentPlaysLike); 
        drawClubOverlay();
    }
}

document.getElementById('export-btn').addEventListener('click', () => {
    const backupData = { 
        shots: safeParse('castleDarganShots', []), 
        scorecard: safeParse('castleDarganScorecard', {}), 
        bag: safeParse('castleDarganBag', defaultBag), 
        history: safeParse('castleDarganHistory', []), 
        pins: safeParse('castleDarganPins', {}), 
        tees: safeParse('castleDarganTees', {}), 
        layups: safeParse('castleDarganLayups', {}),
        phcap: localStorage.getItem('castleDarganPlayingHandicap') || 18
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
            
            if (data.shots) localStorage.setItem('castleDarganShots', JSON.stringify(data.shots)); 
            if (data.scorecard) localStorage.setItem('castleDarganScorecard', JSON.stringify(data.scorecard));
            if (data.bag) localStorage.setItem('castleDarganBag', JSON.stringify(data.bag)); 
            if (data.history) localStorage.setItem('castleDarganHistory', JSON.stringify(data.history));
            if (data.pins) localStorage.setItem('castleDarganPins', JSON.stringify(data.pins)); 
            if (data.tees) localStorage.setItem('castleDarganTees', JSON.stringify(data.tees));
            if (data.layups) localStorage.setItem('castleDarganLayups', JSON.stringify(data.layups));
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

// NEW MATH: Calculates a destination coordinate given a starting point, distance, and angle.
function getDestination(lat, lng, distMeters, bearingDeg) {
    const R = 6371000;
    const brng = toRadians(bearingDeg);
    const lat1 = toRadians(lat);
    const lon1 = toRadians(lng);
    const lat2 = Math.asin(Math.sin(lat1) * Math.cos(distMeters/R) + Math.cos(lat1) * Math.sin(distMeters/R) * Math.cos(brng));
    const lon2 = lon1 + Math.atan2(Math.sin(brng) * Math.sin(distMeters/R) * Math.cos(lat1), Math.cos(distMeters/R) - Math.sin(lat1) * Math.sin(lat2));
    return [toDegrees(lat2), toDegrees(lon2)];
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
    yellowLayupIcon = L.divIcon({ className: 'custom-div-icon', html: "<div style='background-color:#f1c40f; width:12px; height:12px; border-radius:50%; border:2px solid white;'></div>", iconSize: [12,12] });

    userMarker = L.marker([0,0], {icon: blueDot, draggable: true}).addTo(map); 
    userMarker.dragging.disable(); 
    
    pinMarker = L.marker([0,0], {icon: redPin}).addTo(map);
    pathLine = L.polyline([], {color: '#f39c12', dashArray: '5, 5', weight: 3}).addTo(map);

    userMarker.on('dragend', function(e) { saveNewTeeLocation(e.target.getLatLng()); });
    map.on('contextmenu', function(e) { saveNewTeeLocation(e.latlng); });

    map.on('click', function(e) {
        if(!currentLat) return;
        if(layupMarker) map.removeLayer(layupMarker);
        
        layupMarker = L.marker(e.latlng, {icon: yellowLayupIcon}).addTo(map);
        
        let savedLayups = safeParse('castleDarganLayups', {});
        savedLayups[currentHoleIndex] = { lat: e.latlng.lat, lng: e.latlng.lng };
        localStorage.setItem('castleDarganLayups', JSON.stringify(savedLayups));
        
        updateLayupData(e.latlng.lat, e.latlng.lng);
    });
}

function saveNewTeeLocation(latlng) {
    const selectedTee = document.getElementById('tee-box-select').value;
    let savedTees = safeParse('castleDarganTees', {});
    
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
    
    if (isPlannerMode) processLocation(latlng.lat, latlng.lng);
}

function updateLayupData(layupLat, layupLng) {
    document.getElementById('layup-info-box').style.display = 'block';
    
    let tLat = courseData[currentHoleIndex].lat;
    let tLng = courseData[currentHoleIndex].lng;
    
    const customPins = safeParse('castleDarganPins', {});
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
    
    let savedLayups = safeParse('castleDarganLayups', {});
    if(savedLayups[currentHoleIndex]) { 
        delete savedLayups[currentHoleIndex]; 
        localStorage.setItem('castleDarganLayups', JSON.stringify(savedLayups)); 
    }
});

document.getElementById('recenter-map-btn').addEventListener('click', () => {
    hasCenteredMapThisHole = false; 
    let tLat = courseData[currentHoleIndex].lat;
    let tLng = courseData[currentHoleIndex].lng;
    
    const customPins = safeParse('castleDarganPins', {}); 
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

// ==========================================
// NEW: TARGET DISPERSION VISUAL CONE
// ==========================================
document.getElementById('club-overlay-select').addEventListener('change', drawClubOverlay);

function drawClubOverlay() {
    if(clubOverlayGroup && map) map.removeLayer(clubOverlayGroup); 
    
    const club = document.getElementById('club-overlay-select').value;
    if(!club || !currentLat || !map) return;
    
    const analytics = calculateDispersion(); 
    const data = analytics[club];
    if(!data || !data.avg) return;
    
    clubOverlayGroup = L.layerGroup().addTo(map); 
    const center = [currentLat, currentLng];

    // Determine target to point the cone at (Layup or Pin)
    let tLat = courseData[currentHoleIndex].lat;
    let tLng = courseData[currentHoleIndex].lng;
    const customPins = safeParse('castleDarganPins', {});
    if (customPins[currentHoleIndex]) { 
        tLat = customPins[currentHoleIndex].lat; 
        tLng = customPins[currentHoleIndex].lng; 
    }
    if (layupMarker) {
        tLat = layupMarker.getLatLng().lat;
        tLng = layupMarker.getLatLng().lng;
    }

    // Direction calculation
    const aimBearing = calculateBearing(currentLat, currentLng, tLat, tLng);
    
    // Cone Width: Represents a typical amateur 10-degree left/right spread
    const dispersionAngle = 10; 
    
    const avgMeters = data.avg * 0.9144;
    const maxMeters = (data.max || data.avg + 20) * 0.9144;
    const minMeters = (data.min || data.avg - 20) * 0.9144;

    // Project points forward
    const leftMax = getDestination(currentLat, currentLng, maxMeters, aimBearing - dispersionAngle);
    const rightMax = getDestination(currentLat, currentLng, maxMeters, aimBearing + dispersionAngle);
    const leftMin = getDestination(currentLat, currentLng, minMeters, aimBearing - dispersionAngle);
    const rightMin = getDestination(currentLat, currentLng, minMeters, aimBearing + dispersionAngle);

    // 1. Draw The Left/Right Dispersion Cone
    L.polygon([ center, leftMax, rightMax ], { 
        color: '#3498db', weight: 1, fillOpacity: 0.15 
    }).bindTooltip(`${club} Dispersion Zone`, {direction: 'top'}).addTo(clubOverlayGroup);

    // 2. Draw Distance Arcs inside the cone
    if(data.max && data.min) {
        L.polyline([leftMin, rightMin], { color: '#e74c3c', weight: 3, dashArray: '5, 5' }).bindTooltip(`Min Distance`, {direction: 'top'}).addTo(clubOverlayGroup);
        L.polyline([leftMax, rightMax], { color: '#27ae60', weight: 3, dashArray: '5, 5' }).bindTooltip(`Max Distance`, {direction: 'top'}).addTo(clubOverlayGroup);
    }
    
    // 3. Draw the Average Target Point
    const avgPoint = getDestination(currentLat, currentLng, avgMeters, aimBearing);
    L.polyline([center, avgPoint], { color: '#f1c40f', weight: 2, dashArray: '4, 4' }).addTo(clubOverlayGroup);
    L.circleMarker(avgPoint, {radius: 5, color: '#f1c40f', fillOpacity: 1}).bindTooltip(`Avg: ${data.avg}y`, {direction: 'top'}).addTo(clubOverlayGroup);
}

function processLocation(lat, lng) {
    currentLat = lat; 
    currentLng = lng;
    if(liveWindSpeed === 0) fetchWeather(currentLat, currentLng);
    
    let tLat = courseData[currentHoleIndex].lat;
    let tLng = courseData[currentHoleIndex].lng;
    const customPins = safeParse('castleDarganPins', {});
    
    if (customPins[currentHoleIndex]) { 
        tLat = customPins[currentHoleIndex].lat; 
        tLng = customPins[currentHoleIndex].lng; 
    }

    let rawYardage = calculateDistance(currentLat, currentLng, tLat, tLng);
    const selectedTee = document.getElementById('tee-box-select').value;
    
    if (isPlannerMode) { 
        rawYardage = courseData[currentHoleIndex].yds[selectedTee]; 
    } 
    
    document.getElementById('distance-number').innerText = rawYardage > 0 ? rawYardage : "--"; 

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
    
    const savedLayups = safeParse('castleDarganLayups', {});
    if (savedLayups[currentHoleIndex] && map && yellowLayupIcon) {
        const lLat = savedLayups[currentHoleIndex].lat; 
        const lLng = savedLayups[currentHoleIndex].lng;
        
        if (!layupMarker) { 
            layupMarker = L.marker([lLat, lLng], {icon: yellowLayupIcon}).addTo(map); 
        } else { 
            layupMarker.setLatLng([lLat, lLng]); 
        }
        updateLayupData(lLat, lLng);
    } else {
        if(layupMarker) { 
            map.removeLayer(layupMarker); 
            layupMarker = null; 
        }
        document.getElementById('layup-info-box').style.display = 'none';
    }
    
    drawClubOverlay();
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
// 5. CADDY & SHOT TRACKING
// ==========================================
document.getElementById('audio-caddy-btn').addEventListener('click', () => {
    const dist = document.getElementById('distance-number').innerText; 
    if(dist === "--") return;
    
    const playsLike = document.getElementById('plays-like-number').innerText; 
    const rec = getClubRecommendationData(currentPlaysLike);
    let msg = `You have ${dist} yards to the pin. `;
    
    if (playsLike !== dist && playsLike !== "--") { 
        msg += `It is playing like ${playsLike} yards. `; 
    }
    msg += `The Caddy recommends ${rec ? rec.club : "a club of your choice"}.`;
    
    const speech = new SpeechSynthesisUtterance(msg); 
    speech.lang = 'en-GB'; 
    speech.rate = 0.9; 
    window.speechSynthesis.speak(speech);
});

function calculateDispersion() {
    const bag = getBag(); 
    const baselines = baselineYardages[document.getElementById('handicap-select').value || "High"];
    const savedShots = safeParse('castleDarganShots', []);
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

document.getElementById('track-btn').addEventListener('click', () => {
    if (!isTrackingShot) {
        isTrackingShot = true; 
        shotStartLat = currentLat; 
        shotStartLng = currentLng;
        
        if (layupMarker) { 
            shotTargetLat = layupMarker.getLatLng().lat; 
            shotTargetLng = layupMarker.getLatLng().lng; 
        } else {
            let tLat = courseData[currentHoleIndex].lat;
            let tLng = courseData[currentHoleIndex].lng;
            const customPins = safeParse('castleDarganPins', {});
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
            
            if (angleDiff > 5 && angleDiff < 175) { 
                autoAccuracy = "Right Rough"; 
                missText = `Missed ${missDistance} yds Right`; 
            } else if (angleDiff > 185 && angleDiff < 355) { 
                autoAccuracy = "Left Rough"; 
                missText = `Missed ${missDistance} yds Left`; 
            } else { 
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
    
    const oldShotsStr = localStorage.getItem('castleDarganShots'); 
    let bag = safeParse('castleDarganShots', []);
    
    bag.push({ 
        hole: courseData[currentHoleIndex].hole, 
        club: club, 
        distance: pendingDistance, 
        accuracy: document.getElementById('accuracy-select').value, 
        date: new Date().toISOString() 
    });
    localStorage.setItem('castleDarganShots', JSON.stringify(bag));
    
    let activeShots = safeParse('castleDarganActiveRoundShots', []);
    activeShots.push({ 
        hole: courseData[currentHoleIndex].hole, 
        club: club, 
        distance: pendingDistance, 
        accuracy: document.getElementById('accuracy-select').value, 
        startLat: shotStartLat, 
        startLng: shotStartLng, 
        endLat: currentLat, 
        endLng: currentLng 
    });
    localStorage.setItem('castleDarganActiveRoundShots', JSON.stringify(activeShots));

    updateAnalytics(); 
    resetTrackerUI();
    
    showToast("Shot Saved", () => {
        if(oldShotsStr) {
            localStorage.setItem('castleDarganShots', oldShotsStr); 
        } else {
            localStorage.removeItem('castleDarganShots');
        }
        activeShots.pop(); 
        localStorage.setItem('castleDarganActiveRoundShots', JSON.stringify(activeShots));
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
// 7. PINS & MULTIPLAYER SCORECARD
// ==========================================
document.getElementById('update-tee-btn').addEventListener('click', () => {
    if (!currentLat) return alert("Waiting for GPS...");
    
    const selectedTee = document.getElementById('tee-box-select').value;
    let savedTees = safeParse('castleDarganTees', {});
    
    if(!savedTees[currentHoleIndex]) savedTees[currentHoleIndex] = {};
    const oldTee = savedTees[currentHoleIndex][selectedTee];
    
    savedTees[currentHoleIndex][selectedTee] = { lat: currentLat, lng: currentLng };
    localStorage.setItem('castleDarganTees', JSON.stringify(savedTees));
    
    hasCenteredMapThisHole = false; 
    
    showToast("Tee Box Saved to Current Location!", () => {
        if (oldTee) {
            savedTees[currentHoleIndex][selectedTee] = oldTee;
        } else {
            delete savedTees[currentHoleIndex][selectedTee];
        }
        localStorage.setItem('castleDarganTees', JSON.stringify(savedTees)); 
        updateHoleDisplay(); 
    });
    
    updateHoleDisplay(); 
});

document.getElementById('update-pin-btn').addEventListener('click', () => {
    if (!currentLat) return alert("Waiting for GPS...");
    let customPins = safeParse('castleDarganPins', {});
    customPins[currentHoleIndex] = { lat: currentLat, lng: currentLng };
    localStorage.setItem('castleDarganPins', JSON.stringify(customPins));
    
    hasCenteredMapThisHole = false; 
    if(currentLat) updateMapState(currentLat, currentLng); 
});

document.getElementById('reset-pin-btn').addEventListener('click', () => {
    let customPins = safeParse('castleDarganPins', {});
    if (customPins[currentHoleIndex]) { 
        delete customPins[currentHoleIndex]; 
        localStorage.setItem('castleDarganPins', JSON.stringify(customPins)); 
    }
    
    const selectedTee = document.getElementById('tee-box-select').value;
    let customTees = safeParse('castleDarganTees', {});
    if (customTees[currentHoleIndex] && customTees[currentHoleIndex][selectedTee]) {
        delete customTees[currentHoleIndex][selectedTee];
        localStorage.setItem('castleDarganTees', JSON.stringify(customTees));
    }
    
    let savedLayups = safeParse('castleDarganLayups', {});
    if(savedLayups[currentHoleIndex]) {
        delete savedLayups[currentHoleIndex];
        localStorage.setItem('castleDarganLayups', JSON.stringify(savedLayups));
    }

    hasCenteredMapThisHole = false; 
    updateHoleDisplay();
});

function updateHoleDisplay() {
    hasCenteredMapThisHole = false; 
    hasReachedGreen = false;
    
    const hd = courseData[currentHoleIndex]; 
    const selectedTee = document.getElementById('tee-box-select').value;
    const activePar = selectedTee === 'red' ? hd.redPar : hd.par; 
    const activeSi = selectedTee === 'red' ? hd.redSi : hd.si;
    const officialYardage = hd.yds[selectedTee]; 

    document.getElementById('current-hole').innerText = `Hole ${hd.hole}`;
    document.getElementById('hole-par-display').innerText = `Par ${activePar} | SI ${activeSi} | ${officialYardage}y`;
    document.getElementById('scorecard-hole-num').innerText = hd.hole;
    
    if(layupMarker) { map.removeLayer(layupMarker); layupMarker = null; }
    document.getElementById('layup-info-box').style.display = 'none';
    
    renderMultiplayerScorecard();

    if (isPlannerMode) {
        if(userMarker) { userMarker.dragging.enable(); }
        const savedTees = safeParse('castleDarganTees', {});
        let teeCoords = hd.tees[selectedTee];
        if (savedTees[currentHoleIndex] && savedTees[currentHoleIndex][selectedTee]) { 
            teeCoords = savedTees[currentHoleIndex][selectedTee]; 
        }
        processLocation(teeCoords.lat, teeCoords.lng);
    } else {
        if(userMarker) { userMarker.dragging.disable(); }
        
        let tLat = courseData[currentHoleIndex].lat;
        let tLng = courseData[currentHoleIndex].lng;
        const customPins = safeParse('castleDarganPins', {});
        if (customPins[currentHoleIndex]) { 
            tLat = customPins[currentHoleIndex].lat; 
            tLng = customPins[currentHoleIndex].lng; 
        }
        if(currentLat && tLat) updateMapState(tLat, tLng);
    }
}

document.getElementById('next-hole').addEventListener('click', () => { 
    if (currentHoleIndex < courseData.length - 1) { currentHoleIndex++; updateHoleDisplay(); }
});
document.getElementById('prev-hole').addEventListener('click', () => { 
    if (currentHoleIndex > 0) { currentHoleIndex--; updateHoleDisplay(); }
});

function calculateStableford(gross, par, si, playerHcp) {
    if (!gross || gross <= 0) return 0;
    let strokesRec = Math.floor(playerHcp / 18); 
    if ((playerHcp % 18) >= si) strokesRec += 1;
    return Math.max(0, 2 - ((gross - strokesRec) - par));
}

function renderMultiplayerScorecard() {
    const wrap = document.getElementById('multiplayer-scorecard-wrapper');
    const sc = safeParse('castleDarganScorecard', {});
    const holeData = sc[currentHoleIndex] || {};
    const hd = courseData[currentHoleIndex]; 
    const selectedTee = document.getElementById('tee-box-select').value;
    const activePar = selectedTee === 'red' ? hd.redPar : hd.par; 
    const activeSi = selectedTee === 'red' ? hd.redSi : hd.si;

    let html = '';
    activePlayers.forEach(p => {
        let strokes = holeData[p.id]?.strokes || '';
        let pts = holeData[p.id]?.points || 0;
        let color = p.id === 'A' ? '#27ae60' : p.id === 'B' ? '#3498db' : p.id === 'C' ? '#9b59b6' : '#e67e22';

        html += `
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #eee; padding:10px 0; gap:8px;">
            <div style="flex:2; font-weight:bold; color:#2c3e50; min-width:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                <span style="color:${color}; margin-right:5px;">${p.id}</span>${p.name} <span style="font-size:0.7rem; color:#7f8c8d;">(Hcp ${p.hcp})</span>
            </div>
            <div style="flex:1; min-width:0;">
                <input type="number" id="strokes-${p.id}" value="${strokes}" placeholder="Strokes" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:5px; text-align:center; box-sizing:border-box;" oninput="updatePlayerScore('${p.id}', ${p.hcp}, ${activePar}, ${activeSi})">
            </div>
            <div style="flex:1; min-width:0; text-align:right; font-weight:bold; color:#3498db; white-space:nowrap;" id="pts-${p.id}">${pts} Pts</div>
        </div>`;

        if (p.id === 'A') {
             let putts = holeData[p.id]?.putts || '';
             let gir = holeData[p.id]?.gir ? 'checked' : '';
             html += `
             <div style="display:flex; justify-content:space-between; align-items:center; padding-bottom:10px; border-bottom:2px solid #ccc; margin-bottom:10px; background:#f9f9f9; gap:8px;">
                <div style="flex:2; font-size:0.85rem; color:#7f8c8d; text-align:right; min-width:0;">My Putts/GIR:</div>
                <div style="flex:1; min-width:0;">
                    <input type="number" id="putts-A" value="${putts}" placeholder="Putts" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:5px; text-align:center; box-sizing:border-box;" oninput="updatePlayerScore('A', ${p.hcp}, ${activePar}, ${activeSi})">
                </div>
                <div style="flex:1; text-align:center; min-width:0;">
                    <input type="checkbox" id="gir-A" ${gir} style="width:25px; height:25px;">
                </div>
             </div>`;
        }
    });
    wrap.innerHTML = html;
}

window.updatePlayerScore = function(playerId, hcp, par, si) {
    const strokes = parseInt(document.getElementById(`strokes-${playerId}`).value);
    const ptsEl = document.getElementById(`pts-${playerId}`);
    
    if (strokes) { 
        ptsEl.innerText = calculateStableford(strokes, par, si, hcp) + " Pts"; 
    } else { 
        ptsEl.innerText = "0 Pts"; 
    }

    if (playerId === 'A') {
        const putts = parseInt(document.getElementById('putts-A').value);
        if (strokes && putts >= 0) document.getElementById('gir-A').checked = ((strokes - putts) <= (par - 2));
    }
}

document.getElementById('save-score-btn').addEventListener('click', () => {
    const oldScorecardStr = localStorage.getItem('castleDarganScorecard'); 
    let scorecard = safeParse('castleDarganScorecard', {});
    
    const hd = courseData[currentHoleIndex]; 
    const selectedTee = document.getElementById('tee-box-select').value;
    const activePar = selectedTee === 'red' ? hd.redPar : hd.par; 
    const activeSi = selectedTee === 'red' ? hd.redSi : hd.si;

    let holeScores = {};
    activePlayers.forEach(p => {
        let strokes = parseInt(document.getElementById(`strokes-${p.id}`).value);
        if (strokes) {
            holeScores[p.id] = { strokes: strokes, points: calculateStableford(strokes, activePar, activeSi, p.hcp) };
            if (p.id === 'A') {
                holeScores[p.id].putts = parseInt(document.getElementById('putts-A').value) || 0;
                holeScores[p.id].gir = document.getElementById('gir-A').checked;
            }
        }
    });

    if(Object.keys(holeScores).length === 0) return alert("Enter strokes for at least one player!");

    scorecard[currentHoleIndex] = holeScores;
    localStorage.setItem('castleDarganScorecard', JSON.stringify(scorecard));
    updateAnalytics(); 
    
    showToast("Hole Score Saved", () => {
        if(oldScorecardStr) {
            localStorage.setItem('castleDarganScorecard', oldScorecardStr); 
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
    const scorecard = safeParse('castleDarganScorecard', {});
    let totStrokes = 0, totPts = 0, holesPlayed = 0, girCount = 0;
    
    let totPar = 0; 
    const selectedTee = document.getElementById('tee-box-select').value;

    for (let k in scorecard) {
        if (scorecard[k]['A']) { 
            const activePar = selectedTee === 'red' ? courseData[k].redPar : courseData[k].par;
            totStrokes += scorecard[k]['A'].strokes; 
            totPar += activePar; 
            totPts += scorecard[k]['A'].points; 
            holesPlayed++; 
            if (scorecard[k]['A'].gir) girCount++;
        }
    }

    const statScoreEl = document.getElementById('stat-score');
    if (holesPlayed > 0 && statScoreEl) {
        let stp = totStrokes - totPar; 
        statScoreEl.innerText = stp > 0 ? `+${stp}` : (stp === 0 ? "E" : stp);
        document.getElementById('stat-gir').innerText = Math.round((girCount / holesPlayed) * 100) + "%";
        document.getElementById('stat-points').innerText = totPts;
    } else if (statScoreEl) {
        statScoreEl.innerText = "E"; 
        document.getElementById('stat-gir').innerText = "0%"; 
        document.getElementById('stat-points').innerText = "0";
    }
}

document.getElementById('end-round-btn').addEventListener('click', () => {
    const scorecard = safeParse('castleDarganScorecard', {});
    if (!scorecard || Object.keys(scorecard).length === 0) return alert("No scores saved!");
    
    if (confirm("End this round and save to History?")) {
        let totPts = 0, totStrokes = 0; 
        for (let k in scorecard) { 
            if(scorecard[k]['A']) { 
                totPts += scorecard[k]['A'].points; 
                totStrokes += scorecard[k]['A'].strokes; 
            }
        }
        
        let history = safeParse('castleDarganHistory', []);
        history.push({ 
            date: new Date().toLocaleDateString(), 
            holesPlayed: Object.keys(scorecard).length, 
            points: totPts, 
            strokes: totStrokes,
            shots: safeParse('castleDarganActiveRoundShots', [])
        });
        localStorage.setItem('castleDarganHistory', JSON.stringify(history));
        
        localStorage.removeItem('castleDarganScorecard'); 
        localStorage.removeItem('castleDarganActiveRoundShots'); 
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
        let history = safeParse('castleDarganHistory', []);
        history.splice(originalIndex, 1); 
        localStorage.setItem('castleDarganHistory', JSON.stringify(history)); 
        renderHistoryTab();
    }
}

window.viewShotTracers = function(idx) {
    document.getElementById('tracer-modal').style.display = 'flex';
    const history = safeParse('castleDarganHistory', []);
    const round = history[idx];

    if(!tracerMap) {
        tracerMap = L.map('history-map', {zoomControl: false}).setView([54.198, -8.430], 15);
        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { attribution: 'Tiles &copy; Esri' }).addTo(tracerMap);
    }
    
    setTimeout(() => { tracerMap.invalidateSize(); }, 200);

    tracerMap.eachLayer(layer => {
        if (layer instanceof L.Polyline || layer instanceof L.Marker || layer instanceof L.CircleMarker) { 
            tracerMap.removeLayer(layer); 
        }
    });

    if(!round.shots || round.shots.length === 0) return alert("No shot path data for this round.");

    let bounds = [];
    round.shots.forEach(s => {
        if(s.startLat && s.endLat) {
            let lineColor = s.accuracy.includes('Rough') || s.accuracy.includes('Hazard') ? '#e74c3c' : '#27ae60';
            
            L.polyline([[s.startLat, s.startLng], [s.endLat, s.endLng]], { 
                color: lineColor, weight: 3, opacity: 0.8, dashArray: '5, 5' 
            }).bindTooltip(`Hole ${s.hole}: ${s.club} (${s.distance}y)`).addTo(tracerMap);
            
            L.circleMarker([s.endLat, s.endLng], {radius: 4, color: '#f1c40f', fillOpacity: 1}).addTo(tracerMap);
            bounds.push([s.startLat, s.startLng], [s.endLat, s.endLng]);
        }
    });
    
    if(bounds.length > 0) tracerMap.fitBounds(bounds, {padding: [30, 30]});
};

function renderHistoryTab() {
    const history = safeParse('castleDarganHistory', []); 
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
        const hasTracers = (r.shots && r.shots.length > 0);
        
        listEl.innerHTML += `
            <div class="history-round-card">
                <div><div class="history-date">${r.date}</div><div class="history-details">${r.holesPlayed} Holes | ${r.strokes} Strokes</div></div>
                <div style="display: flex; align-items: center; gap: 15px;">
                    <div class="history-points">${r.points} Pts</div>
                    ${hasTracers ? `<button onclick="viewShotTracers(${originalIdx})" style="background: none; border: none; color: #3498db; cursor: pointer; font-size: 1.5rem;" title="View Tracers">📍</button>` : ''}
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