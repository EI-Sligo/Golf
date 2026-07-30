// Adds Par, Stroke Index, Front/Back Green coords, and Hazards
const offset = (coord, val) => Number((coord + val).toFixed(6));

export const courseData = {
1: {
    par: 4,
    strokeIndex: 7,
    tees: [{ lat: 54.197806, lng: -8.435885 }],
    pin: { lat: 54.198594, lng: -8.430418 },
    front: { lat: 54.198550, lng: -8.430500 },
    back: { lat: 54.198640, lng: -8.430350 },
    
    // --- ADD / CUSTOMIZE HAZARDS HERE ---
    hazards: [
      { type: 'bunker', lat: 54.19839316429468, lng: -8.432339429855348 }, // Fairway Bunker Left
      { type: 'bunker', lat: 54.19839316429468, lng: -8.432006835937502 }, // Greenside Bunker Right
      { type: 'water',  lat: 54.19810445997077, lng: -8.435418605804445}  // Pond / Stream Hazard
    ]
  },
  2: {
    par: 4,
    strokeIndex: 3,
    tees: [{ lat: 54.198421, lng: -8.429828 }, { lat: 54.198468, lng: -8.428927 }],
    pin: { lat: 54.199742, lng: -8.423123 },
    front: { lat: 54.199690, lng: -8.423200 },
    back: { lat: 54.199790, lng: -8.423000 },
    hazards: [{ type: 'water', lat: 54.199000, lng: -8.425000 }]
  },
  3: {
    par: 3,
    strokeIndex: 15,
    tees: [{ lat: 54.200508, lng: -8.421868 }],
    pin: { lat: 54.199654, lng: -8.421208 },
    front: { lat: 54.199700, lng: -8.421300 },
    back: { lat: 54.199600, lng: -8.421100 },
    hazards: [{ type: 'bunker', lat: 54.199800, lng: -8.421500 }]
  },
  4: {
    par: 5,
    strokeIndex: 1,
    tees: [{ lat: 54.199271, lng: -8.421551 }],
    pin: { lat: 54.197991, lng: -8.426374 },
    front: { lat: offset(54.197991, -0.0001), lng: offset(-8.426374, 0.0001) },
    back: { lat: offset(54.197991, 0.0001), lng: offset(-8.426374, -0.0001) },
    hazards: []
  },
  5: {
    par: 4,
    strokeIndex: 11,
    tees: [{ lat: 54.197925, lng: -8.426953 }],
    pin: { lat: 54.195025, lng: -8.424695 },
    front: { lat: offset(54.195025, -0.0001), lng: offset(-8.424695, 0.0001) },
    back: { lat: offset(54.195025, 0.0001), lng: offset(-8.424695, -0.0001) },
    hazards: []
  },
  6: {
    par: 4,
    strokeIndex: 5,
    tees: [{ lat: 54.194674, lng: -8.425092 }],
    pin: { lat: 54.197737, lng: -8.428021 },
    front: { lat: offset(54.197737, -0.0001), lng: offset(-8.428021, 0.0001) },
    back: { lat: offset(54.197737, 0.0001), lng: offset(-8.428021, -0.0001) },
    hazards: []
  },
  7: {
    par: 3,
    strokeIndex: 17,
    tees: [{ lat: 54.198355, lng: -8.427339 }],
    pin: { lat: 54.197627, lng: -8.429448 },
    front: { lat: offset(54.197627, -0.0001), lng: offset(-8.429448, 0.0001) },
    back: { lat: offset(54.197627, 0.0001), lng: offset(-8.429448, -0.0001) },
    hazards: []
  },
  8: {
    par: 4,
    strokeIndex: 9,
    tees: [{ lat: 54.198299, lng: -8.429378 }],
    pin: { lat: 54.197345, lng: -8.435434 },
    front: { lat: offset(54.197345, -0.0001), lng: offset(-8.435434, 0.0001) },
    back: { lat: offset(54.197345, 0.0001), lng: offset(-8.435434, -0.0001) },
    hazards: []
  },
  9: {
    par: 4,
    strokeIndex: 13,
    tees: [{ lat: 54.197147, lng: -8.435767 }],
    pin: { lat: 54.195063, lng: -8.429110 },
    front: { lat: offset(54.195063, -0.0001), lng: offset(-8.429110, 0.0001) },
    back: { lat: offset(54.195063, 0.0001), lng: offset(-8.429110, -0.0001) },
    hazards: []
  },
  10: {
    par: 4,
    strokeIndex: 10,
    tees: [{ lat: 54.194683, lng: -8.429726 }],
    pin: { lat: 54.196698, lng: -8.435370 },
    front: { lat: offset(54.196698, -0.0001), lng: offset(-8.435370, 0.0001) },
    back: { lat: offset(54.196698, 0.0001), lng: offset(-8.435370, -0.0001) },
    hazards: []
  },
  11: {
    par: 3,
    strokeIndex: 18,
    tees: [{ lat: 54.196968, lng: -8.436405 }],
    pin: { lat: 54.195785, lng: -8.436303 },
    front: { lat: offset(54.195785, -0.0001), lng: offset(-8.436303, 0.0001) },
    back: { lat: offset(54.195785, 0.0001), lng: offset(-8.436303, -0.0001) },
    hazards: []
  },
  12: {
    par: 4,
    strokeIndex: 4,
    tees: [{ lat: 54.196240, lng: -8.435820 }],
    pin: { lat: 54.194454, lng: -8.431223 },
    front: { lat: offset(54.194454, -0.0001), lng: offset(-8.431223, 0.0001) },
    back: { lat: offset(54.194454, 0.0001), lng: offset(-8.431223, -0.0001) },
    hazards: []
  },
  13: {
    par: 5,
    strokeIndex: 2,
    tees: [{ lat: 54.194247, lng: -8.430520 }],
    pin: { lat: 54.194680, lng: -8.428004 },
    front: { lat: offset(54.194680, -0.0001), lng: offset(-8.428004, 0.0001) },
    back: { lat: offset(54.194680, 0.0001), lng: offset(-8.428004, -0.0001) },
    hazards: []
  },
  14: {
    par: 4,
    strokeIndex: 8,
    tees: [{ lat: 54.194536, lng: -8.426620 }],
    pin: { lat: 54.196742, lng: -8.431743 },
    front: { lat: offset(54.196742, -0.0001), lng: offset(-8.431743, 0.0001) },
    back: { lat: offset(54.196742, 0.0001), lng: offset(-8.431743, -0.0001) },
    hazards: []
  },
  15: {
    par: 4,
    strokeIndex: 12,
    tees: [{ lat: 54.196893, lng: -8.433519 }],
    pin: { lat: 54.197445, lng: -8.430241 },
    front: { lat: offset(54.197445, -0.0001), lng: offset(-8.430241, 0.0001) },
    back: { lat: offset(54.197445, 0.0001), lng: offset(-8.430241, -0.0001) },
    hazards: []
  },
  16: {
    par: 4,
    strokeIndex: 6,
    tees: [{ lat: 54.198973, lng: -8.429507 }],
    pin: { lat: 54.200156, lng: -8.424046 },
    front: { lat: offset(54.200156, -0.0001), lng: offset(-8.424046, 0.0001) },
    back: { lat: offset(54.200156, 0.0001), lng: offset(-8.424046, -0.0001) },
    hazards: []
  },
  17: {
    par: 3,
    strokeIndex: 16,
    tees: [{ lat: 54.200473, lng: -8.425810 }],
    pin: { lat: 54.199394, lng: -8.431577 },
    front: { lat: offset(54.199394, -0.0001), lng: offset(-8.431577, 0.0001) },
    back: { lat: offset(54.199394, 0.0001), lng: offset(-8.431577, -0.0001) },
    hazards: []
  },
  18: {
    par: 4,
    strokeIndex: 14,
    tees: [{ lat: 54.199111, lng: -8.430815 }],
    pin: { lat: 54.198672, lng: -8.436625 },
    front: { lat: offset(54.198672, -0.0001), lng: offset(-8.436625, 0.0001) },
    back: { lat: offset(54.198672, 0.0001), lng: offset(-8.436625, -0.0001) },
    hazards: []
  }
};