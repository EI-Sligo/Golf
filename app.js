// ==========================================
// 1. GLOBAL VARIABLES & COURSE DATA
// ==========================================
let currentLat = null, currentLng = null, currentHoleIndex = 0; 
let isTrackingShot = false, shotStartLat = null, shotStartLng = null, pendingDistance = 0;

let map, userMarker, pinMarker, pathLine, layupMarker;
let liveWindSpeed = 0, liveWindDir = 0, currentPlaysLike = 0;
let historyChartInstance = null;
let hasCenteredMapThisHole = false; 

const courseData = [
    { hole: 1, lat: 54.19860260754416, lng: -8.430412853346407, par: 4, si: 8 },
    { hole: 2, lat: 54.200161814306895, lng: -8.424006844479758, par: 5, si: 14 },
    { hole: 3, lat: 54.19966549964856, lng: -8.421158440726037, par: 3, si: 18 },
    { hole: 4, lat: 54.198003141877244, lng: -8.426296058686598, par: 4, si: 6 },
    { hole: 5, lat: null, lng: null, par: 4, si: 2 },
    { hole: 6, lat: null, lng: null, par: 5, si: 12 },
    { hole: 7, lat: null, lng: null, par: 3, si: 4 },
    { hole: 8, lat: null, lng: null, par: 4, si: 10 },
    { hole: 9, lat: null, lng: null, par: 5, si: 16 },
    { hole: 10, lat: null, lng: null, par: 5, si: 15 },
    { hole: 11, lat: null, lng: null, par: 3, si: 17 },
    { hole: 12, lat: null, lng: null, par: 4, si: 9 },
    { hole: 13, lat: null, lng: null, par: 3, si: 11 },
    { hole: 14, lat: null, lng: null, par: 4, si: 5 },
    { hole: 15, lat: null, lng: null, par: 4, si: 7 },
    { hole: 16, lat: null, lng: null, par: 4, si: 3 },
    { hole: 17, lat: null, lng: null, par: 4, si: 1 },
    { hole: 18, lat: null, lng: null, par: 4, si: 13 }
];

const baselineYardages = {
    "High": { "Driver": 200, "3 Wood": 180, "4 Hybrid": 160, "5 Iron": 150, "7 Iron": 130, "PW": 100 },
    "Mid":  { "Driver": 230, "3 Wood": 210, "4 Hybrid": 185, "5 Iron": 175, "7 Iron": 155, "PW": 120 },
    "Low":  { "Driver": 260, "3 Wood": 235, "4 Hybrid": 205, "5 Iron": 195, "7 Iron": 165, "PW": 130 }
};
const defaultBag = ["Driver", "3 Wood", "4 Hybrid", "5 Iron", "7 Iron", "PW", "SW"];

// ==========================================
// 2. TABS & BAG SETTINGS
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
    if(t === 'settings') renderShotsList(); // Update shots list when opening settings
}

function getBag() { return JSON.parse(localStorage.getItem('castleDarganBag')) || defaultBag; }
function saveBag(bag) { localStorage.setItem('castleDarganBag', JSON.stringify(bag)); renderBagUI(); }
function renderBagUI() {
    const bag = getBag();
    document.getElementById('club-select').innerHTML = '<option value="">Select...</option>' + bag.map(c => `<option value="${c}">${c}</option>`).join('');
    document.getElementById('my-bag-list').innerHTML = bag.map(c => `<div class="club-tag">${c} <button class="remove-club" onclick="removeClub('${c}')">x</button></div>`).join('');
}

window.removeClub = function(c) { saveBag(getBag().filter(b => b !== c)); }
document.getElementById('add-club-btn').addEventListener('click', () => {
    let bag = getBag(); let nc = document.getElementById('new-club-select').value;
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

// ==========================================
// 2B. NEW: MANAGE SHOT HISTORY
// ==========================================
function renderShotsList() {
    const shots = JSON.parse(localStorage.getItem('castleDarganShots')) || [];
    const listEl = document.getElementById('tracked-shots-list');
    
    if (shots.length === 0) {
        listEl.innerHTML = "<p style='text-align: center; color: #7f8c8d;'>No shots tracked yet.</p>";
        return;
    }

    listEl.innerHTML = '';
    // Reverse so newest is at the top, but track the original array index for deletion
    [...shots].reverse().forEach((s, reversedIdx) => {
        const originalIdx = shots.length - 1 - reversedIdx;
        const dateStr = s.date ? new Date(s.date).toLocaleDateString() : 'Unknown Date';
        
        listEl.innerHTML += `
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #eee; padding: 10px 0;">
                <div>
                    <strong style="color: #2c3e50;">${s.club}</strong> - <span style="color: #27ae60; font-weight: bold;">${s.distance} Yds</span><br>
                    <span style="font-size: 0.8rem; color: #7f8c8d;">${s.accuracy || 'Fairway'} | Hole ${s.hole || '?'} | ${dateStr}</span>
                </div>
                <button onclick="deleteShot(${originalIdx})" style="background: none; border: none; color: #e74c3c; cursor: pointer; font-size: 1.2rem;">🗑️</button>
            </div>
        `;
    });
}

window.deleteShot = function(originalIdx) {
    if (confirm("Delete this shot from your club averages?")) {
        let shots = JSON.parse(localStorage.getItem('castleDarganShots')) || [];
        shots.splice(originalIdx, 1);
        localStorage.setItem('castleDarganShots', JSON.stringify(shots));
        
        renderShotsList(); // Refresh list UI
        updateAnalytics(); // Refresh Fairway Hit %
        
        // Recalculate Caddy logic instantly if we are playing
        if(currentPlaysLike) recommendClub(currentPlaysLike);
    }
}

// ==========================================
// 3. BACKUP (EXPORT / IMPORT)
// ==========================================
document.getElementById('export-btn').addEventListener('click', () => {
    const backupData = {
        shots: localStorage.getItem('castleDarganShots'), scorecard: localStorage.getItem('castleDarganScorecard'),
        bag: localStorage.getItem('castleDarganBag'), history: localStorage.getItem('castleDarganHistory'),
        pins: localStorage.getItem('castleDarganPins'), phcap: localStorage.getItem('castleDarganPlayingHandicap')
    };
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(backupData)], {type: "application/json"})); 
    a.download = `CDCaddy_Backup.json`; a.click();
});

document.getElementById('import-trigger-btn').addEventListener('click', () => document.getElementById('import-file').click());
document.getElementById('import-file').addEventListener('change', (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            if (data.shots) localStorage.setItem('castleDarganShots', data.shots);
            if (data.scorecard) localStorage.setItem('castleDarganScorecard', data.scorecard);
            if (data.bag) localStorage.setItem('castleDarganBag', data.bag);
            if (data.history) localStorage.setItem('castleDarganHistory', data.history);
            if (data.pins) localStorage.setItem('castleDarganPins', data.pins);
            if (data.phcap) localStorage.setItem('castleDarganPlayingHandicap', data.phcap);
            alert("Data imported! App will reload."); location.reload();
        } catch (err) { alert("Error parsing file."); }
    };
    reader.readAsText(file);
});

// ==========================================
// 4. MATH, WEATHER & MAP
// ==========================================
const toRadians = deg => deg * (Math.PI / 180);
const toDegrees = rad => rad * (180 / Math.PI);

function calculateDistance(lat1, lon1, lat2, lon2) {
    if (!lat1 || !lat2) return 0;
    const R = 6371000; const dLat = toRadians(lat2 - lat1), dLon = toRadians(lon2 - lon1);
    const a = Math.sin(dLat/2)**2 + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon/2)**2; 
    return Math.round((R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)))) * 1.09361); 
}

function calculateBearing(lat1, lon1, lat2, lon2) {
    const dLon = toRadians(lon2 - lon1);
    const y = Math.sin(dLon) * Math.cos(toRadians(lat2)), x = Math.cos(toRadians(lat1)) * Math.sin(toRadians(lat2)) - Math.sin(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.cos(dLon);
    return (toDegrees(Math.atan2(y, x)) + 360) % 360;
}

async function fetchWeather(lat, lng) {
    try {
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=wind_speed_10m,wind_direction_10m&wind_speed_unit=mph`);
        const data = await res.json();
        liveWindSpeed = Math.round(data.current.wind_speed_10m); liveWindDir = data.current.wind_direction_10m;
        document.getElementById('wind-speed-display').innerText = `${liveWindSpeed} mph`;
        document.getElementById('wind-dir-icon').innerHTML = `<span style="display:inline-block; transform: rotate(${liveWindDir}deg);">↓</span>`;
    } catch (err) { console.log("Weather failed"); }
}
document.getElementById('refresh-weather-btn').addEventListener('click', () => { if(currentLat) fetchWeather(currentLat, currentLng); });

function initMap() {
    map = L.map('map', { zoomControl: false }).setView([54.198, -8.430], 16);
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { attribution: 'Tiles &copy; Esri' }).addTo(map);

    const blueDot = L.divIcon({ className: 'custom-div-icon', html: "<div style='background-color:#3498db; width:15px; height:15px; border-radius:50%; border:2px solid white;'></div>", iconSize: [15,15] });
    const redPin = L.divIcon({ className: 'custom-div-icon', html: "<div style='background-color:#e74c3c; width:15px; height:15px; border-radius:50%; border:2px solid white;'></div>", iconSize: [15,15] });
    const yellowLayup = L.divIcon({ className: 'custom-div-icon', html: "<div style='background-color:#f1c40f; width:12px; height:12px; border-radius:50%; border:2px solid white;'></div>", iconSize: [12,12] });

    userMarker = L.marker([0,0], {icon: blueDot}).addTo(map); pinMarker = L.marker([0,0], {icon: redPin}).addTo(map);
    pathLine = L.polyline([], {color: '#f39c12', dashArray: '5, 5', weight: 3}).addTo(map);

    map.on('click', function(e) {
        if(!currentLat) return;
        if(layupMarker) map.removeLayer(layupMarker);
        
        layupMarker = L.marker(e.latlng, {icon: yellowLayup}).addTo(map);
        updateLayupData(e.latlng.lat, e.latlng.lng);
    });
}

function updateLayupData(layupLat, layupLng) {
    document.getElementById('layup-info-box').style.display = 'block';

    let tLat = courseData[currentHoleIndex].lat, tLng = courseData[currentHoleIndex].lng;
    const customPins = JSON.parse(localStorage.getItem('castleDarganPins')) || {};
    if (customPins[currentHoleIndex]) { tLat = customPins[currentHoleIndex].lat; tLng = customPins[currentHoleIndex].lng; }

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
    let tLat = courseData[currentHoleIndex].lat, tLng = courseData[currentHoleIndex].lng;
    const customPins = JSON.parse(localStorage.getItem('castleDarganPins')) || {};
    if (customPins[currentHoleIndex]) { tLat = customPins[currentHoleIndex].lat; tLng = customPins[currentHoleIndex].lng; }
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

function initGPS() {
    if ("geolocation" in navigator) {
        navigator.geolocation.watchPosition(
            (pos) => {
                currentLat = pos.coords.latitude; currentLng = pos.coords.longitude;
                if(liveWindSpeed === 0) fetchWeather(currentLat, currentLng);
                
                let tLat = courseData[currentHoleIndex].lat, tLng = courseData[currentHoleIndex].lng;
                const customPins = JSON.parse(localStorage.getItem('castleDarganPins')) || {};
                if (customPins[currentHoleIndex]) { tLat = customPins[currentHoleIndex].lat; tLng = customPins[currentHoleIndex].lng; }

                const rawYardage = calculateDistance(currentLat, currentLng, tLat, tLng);
                document.getElementById('distance-number').innerText = rawYardage > 0 ? rawYardage : "--"; 

                const holeBearing = calculateBearing(currentLat, currentLng, tLat, tLng);
                const effectiveWind = Math.cos(toRadians(liveWindDir - holeBearing)) * liveWindSpeed; 
                currentPlaysLike = Math.max(0, Math.round(rawYardage + effectiveWind)); 
                document.getElementById('plays-like-number').innerText = currentPlaysLike > 0 ? currentPlaysLike : "--";

                if(tLat) updateMapState(tLat, tLng);
                recommendClub(currentPlaysLike);

                if(layupMarker) updateLayupData(layupMarker.getLatLng().lat, layupMarker.getLatLng().lng);
            },
            (err) => console.log("GPS Err"), { enableHighAccuracy: true, maximumAge: 0 } 
        );
    }
}

// ==========================================
// 5. CADDY & DISPERSION ENGINE
// ==========================================
function calculateDispersion() {
    const bag = getBag(); const baselines = baselineYardages[document.getElementById('handicap-select').value || "High"];
    const savedShots = JSON.parse(localStorage.getItem('castleDarganShots')) || [];
    const clubData = {}; bag.forEach(c => clubData[c] = []);
    savedShots.forEach(s => { if(clubData[s.club]) clubData[s.club].push(s.distance); });

    const analytics = {};
    bag.forEach(club => {
        const shots = clubData[club];
        if(shots.length === 0) { analytics[club] = { type: 'baseline', avg: baselines[club] }; } 
        else if (shots.length < 4) {
            analytics[club] = { type: 'raw', avg: Math.round(shots.reduce((a,b)=>a+b)/shots.length) };
        } else {
            shots.sort((a,b) => a-b);
            const coreShots = shots.slice(Math.floor(shots.length * 0.20), Math.floor(shots.length * 0.90));
            analytics[club] = { type: 'filtered', avg: Math.round(coreShots.reduce((a,b)=>a+b)/coreShots.length), min: coreShots[0], max: coreShots[coreShots.length-1] };
        }
    });
    return analytics;
}

function getClubRecommendationData(targetYardage) {
    if (!targetYardage || targetYardage <= 0) return null;
    const analytics = calculateDispersion();
    let bestClub = "None", minDiff = Infinity;
    for(const club in analytics) {
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
// 6. SHOT TRACKING
// ==========================================
document.getElementById('track-btn').addEventListener('click', () => {
    if (!isTrackingShot) {
        isTrackingShot = true; shotStartLat = currentLat; shotStartLng = currentLng;
        document.getElementById('track-btn').innerText = "End Shot"; document.getElementById('track-btn').style.backgroundColor = "#f39c12"; 
    } else {
        pendingDistance = calculateDistance(shotStartLat, shotStartLng, currentLat, currentLng);
        document.getElementById('pending-distance').innerText = pendingDistance;
        document.getElementById('track-btn').style.display = 'none'; document.getElementById('shot-review-area').style.display = 'block'; 
    }
});

document.getElementById('save-shot-btn').addEventListener('click', () => {
    const club = document.getElementById('club-select').value;
    if (!club) return alert("Select a club!");
    let bag = JSON.parse(localStorage.getItem('castleDarganShots')) || [];
    bag.push({ hole: courseData[currentHoleIndex].hole, club: club, distance: pendingDistance, accuracy: document.getElementById('accuracy-select').value, date: new Date().toISOString() });
    localStorage.setItem('castleDarganShots', JSON.stringify(bag));
    
    updateAnalytics(); 
    resetTrackerUI();
});
document.getElementById('ignore-shot-btn').addEventListener('click', resetTrackerUI);

function resetTrackerUI() {
    isTrackingShot = false; document.getElementById('shot-review-area').style.display = 'none'; 
    document.getElementById('track-btn').style.display = 'block'; document.getElementById('track-btn').innerText = "Start Shot"; document.getElementById('track-btn').style.backgroundColor = "#27ae60"; 
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
    if (customPins[currentHoleIndex]) { delete customPins[currentHoleIndex]; localStorage.setItem('castleDarganPins', JSON.stringify(customPins)); }
    const hd = courseData[currentHoleIndex];
    
    hasCenteredMapThisHole = false; 
    if(hd.lat) updateMapState(hd.lat, hd.lng);
});

function updateHoleDisplay() {
    hasCenteredMapThisHole = false; 
    const hd = courseData[currentHoleIndex];
    document.getElementById('current-hole').innerText = `Hole ${hd.hole}`;
    document.getElementById('hole-par-display').innerText = `Par ${hd.par} | SI ${hd.si}`;
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
        document.getElementById('hole-strokes').value = ""; document.getElementById('hole-putts').value = ""; 
        document.getElementById('hole-gir').checked = false; document.getElementById('hole-points-display').innerText = "0";
    }
}
document.getElementById('next-hole').addEventListener('click', () => { if (currentHoleIndex < courseData.length - 1) { currentHoleIndex++; updateHoleDisplay(); }});
document.getElementById('prev-hole').addEventListener('click', () => { if (currentHoleIndex > 0) { currentHoleIndex--; updateHoleDisplay(); }});

function calculateStableford(gross, par, si) {
    if (!gross || gross <= 0) return 0;
    const ph = parseInt(localStorage.getItem('castleDarganPlayingHandicap')) || 18;
    let strokesRec = Math.floor(ph / 18); if ((ph % 18) >= si) strokesRec += 1;
    return Math.max(0, 2 - ((gross - strokesRec) - par));
}

document.getElementById('hole-strokes').addEventListener('input', updateScoreInputs);
document.getElementById('hole-putts').addEventListener('input', updateScoreInputs);

function updateScoreInputs() {
    const strokes = parseInt(document.getElementById('hole-strokes').value);
    const putts = parseInt(document.getElementById('hole-putts').value);
    const hd = courseData[currentHoleIndex];
    if (strokes && putts >= 0) document.getElementById('hole-gir').checked = ((strokes - putts) <= (hd.par - 2));
    if (strokes) document.getElementById('hole-points-display').innerText = calculateStableford(strokes, hd.par, hd.si);
}

document.getElementById('save-score-btn').addEventListener('click', () => {
    const strokes = parseInt(document.getElementById('hole-strokes').value);
    if (!strokes) return alert("Enter strokes!");
    const hd = courseData[currentHoleIndex];
    let scorecard = JSON.parse(localStorage.getItem('castleDarganScorecard')) || {};
    scorecard[currentHoleIndex] = { hole: hd.hole, par: hd.par, si: hd.si, strokes: strokes, putts: parseInt(document.getElementById('hole-putts').value) || 0, gir: document.getElementById('hole-gir').checked, points: calculateStableford(strokes, hd.par, hd.si) };
    localStorage.setItem('castleDarganScorecard', JSON.stringify(scorecard));
    
    updateAnalytics(); 
    
    const btn = document.getElementById('save-score-btn');
    btn.innerText = "Saved!"; btn.style.backgroundColor = "#27ae60";
    setTimeout(() => { btn.innerText = "Save Score"; btn.style.backgroundColor = "#2c3e50"; }, 2000);
});

// ==========================================
// 8. ANALYTICS & HISTORY
// ==========================================
function updateAnalytics() {
    const scorecard = JSON.parse(localStorage.getItem('castleDarganScorecard')) || {};
    const shots = JSON.parse(localStorage.getItem('castleDarganShots')) || [];
    let totStrokes = 0, totPar = 0, totPutts = 0, holesPlayed = 0, girCount = 0, totPts = 0;

    for (let k in scorecard) {
        totStrokes += scorecard[k].strokes; totPutts += scorecard[k].putts;
        totPar += scorecard[k].par; totPts += scorecard[k].points;
        holesPlayed++; if (scorecard[k].gir) girCount++;
    }

    let driveCount = 0, fairwayCount = 0;
    shots.forEach(s => {
        if (s.club === "Driver" || s.club.includes("Wood")) { driveCount++; if (s.accuracy === "Fairway") fairwayCount++; }
    });

    const statScoreEl = document.getElementById('stat-score');
    if (holesPlayed > 0 && statScoreEl) {
        let stp = totStrokes - totPar;
        statScoreEl.innerText = stp > 0 ? `+${stp}` : (stp === 0 ? "E" : stp);
        document.getElementById('stat-putts').innerText = (totPutts / holesPlayed).toFixed(1);
        document.getElementById('stat-gir').innerText = Math.round((girCount / holesPlayed) * 100) + "%";
        document.getElementById('stat-points').innerText = totPts;
    }
    if (driveCount > 0) document.getElementById('stat-fir').innerText = Math.round((fairwayCount / driveCount) * 100) + "%";
}

document.getElementById('end-round-btn').addEventListener('click', () => {
    const scorecard = JSON.parse(localStorage.getItem('castleDarganScorecard'));
    if (!scorecard || Object.keys(scorecard).length === 0) return alert("No scores saved!");
    if (confirm("End this round and save to History?")) {
        let totPts = 0, totStrokes = 0; for (let k in scorecard) { totPts += scorecard[k].points; totStrokes += scorecard[k].strokes; }
        let history = JSON.parse(localStorage.getItem('castleDarganHistory')) || [];
        history.push({ date: new Date().toLocaleDateString(), holesPlayed: Object.keys(scorecard).length, points: totPts, strokes: totStrokes });
        localStorage.setItem('castleDarganHistory', JSON.stringify(history));
        
        localStorage.removeItem('castleDarganScorecard'); 
        updateHoleDisplay(); 
        
        document.getElementById('stat-score').innerText = "E";
        document.getElementById('stat-putts').innerText = "0.0";
        document.getElementById('stat-gir').innerText = "0%";
        document.getElementById('stat-points').innerText = "0";
        
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
    
    if (history.length === 0) { listEl.innerHTML = "<p>No rounds saved yet.</p>"; return; }

    listEl.innerHTML = ''; const labels = [], dataPoints = [];
    
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

    history.forEach((r, i) => { labels.push(`Rnd ${i+1}`); dataPoints.push(r.points); });

    const ctx = document.getElementById('historyChart').getContext('2d');
    if (historyChartInstance) historyChartInstance.destroy();
    historyChartInstance = new Chart(ctx, {
        type: 'line',
        data: { labels: labels, datasets: [{ label: 'Stableford Points', data: dataPoints, borderColor: '#3498db', backgroundColor: 'rgba(52, 152, 219, 0.2)', borderWidth: 3, fill: true, tension: 0.3 }] },
        options: { responsive: true, scales: { y: { beginAtZero: true } } }
    });
}

// ==========================================
// 10. PWA REGISTRATION & BOOT
// ==========================================
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(err => console.log("SW Failed", err));
}

renderBagUI();
renderShotsList(); 
updateHoleDisplay();
updateAnalytics();
initGPS();