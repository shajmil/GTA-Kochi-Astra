// Authored miniature: north = -Z. See docs/RESEARCH.md for source geography.
export const LANDMARKS = [
  {
    id: "forum",
    name: "Forum Kochi",
    area: "MARADU",
    mal: "മരട്",
    x: -61,
    z: 568,
    spawn: [-48, 627],
    color: "#dacf74",
    description: "Folded lime and gold facade, beside the Maradu canal.",
  },
  {
    id: "kundannoor",
    name: "Kundannoor Junction",
    area: "KUNDANNOOR",
    mal: "കുണ്ടന്നൂർ",
    x: 40,
    z: 460,
    spawn: [15, 485],
    color: "#e0be76",
    description:
      "Three highway connections, a six-lane flyover, and the southern gateway.",
  },
  {
    id: "brototype",
    name: "Brototype Kochi",
    area: "KUNDANNOOR",
    mal: "കുണ്ടന്നൂർ",
    x: 137,
    z: 523,
    spawn: [82, 566],
    yaw: -0.92,
    color: "#f4f0dd",
    description:
      "The Kundannoor hub at Edathuruthikaran Holdings. Exterior interpreted from limited references.",
  },
  {
    id: "vyttila",
    name: "Vyttila Mobility Hub",
    area: "VYTTILA",
    mal: "വൈറ്റില",
    x: 164,
    z: 158,
    spawn: [120, 213],
    color: "#a2ccbc",
    description:
      "Bus bays, a transport concourse and a metro connection beside the water.",
  },
  {
    id: "stadium",
    name: "Jawaharlal Nehru Stadium",
    area: "KALOOR",
    mal: "കലൂർ",
    x: -134,
    z: -236,
    spawn: [-223, -119],
    yaw: -0.65,
    color: "#80c9c0",
    description:
      "The oval stadium, teal supports, sweeping roof and Kerala football spirit.",
  },
  {
    id: "lulu",
    name: "LuLu Mall",
    area: "EDAPPALLY",
    mal: "ഇടപ്പള്ളി",
    x: 60,
    z: -580,
    spawn: [4, -475],
    yaw: -0.48,
    color: "#e3cb9a",
    description:
      "Cream-and-gold retail frontage, Edappally flyover and a metro skywalk.",
  },
];
export const ROADS = [
  {
    id: "bypass",
    points: [
      [40, 735],
      [40, 460],
      [65, 200],
      [80, -100],
      [130, -405],
      [180, -705],
    ],
    width: 27,
    main: true,
  },
  {
    id: "city",
    points: [
      [65, 200],
      [-100, 200],
      [-250, 90],
      [-280, -110],
      [-263, -350],
      [-120, -440],
      [130, -405],
    ],
    width: 20,
    main: true,
  },
  {
    id: "kundannoor",
    points: [
      [-320, 460],
      [40, 460],
      [280, 460],
    ],
    width: 21,
    main: true,
  },
  {
    id: "forum",
    points: [
      [-178, 632],
      [-38, 632],
      [40, 632],
    ],
    width: 13,
  },
  {
    id: "bro",
    points: [
      [40, 558],
      [185, 558],
      [205, 460],
    ],
    width: 12,
  },
  {
    id: "hub",
    points: [
      [65, 220],
      [242, 220],
      [260, 100],
      [78, 100],
    ],
    width: 15,
  },
  {
    id: "stadium",
    points: [
      [-275, -128],
      [-135, -128],
      [-23, -160],
      [-20, -310],
      [-135, -348],
      [-263, -350],
    ],
    width: 15,
  },
  {
    id: "edappally",
    points: [
      [-230, -490],
      [20, -490],
      [151, -490],
      [330, -490],
    ],
    width: 23,
    main: true,
  },
  {
    id: "lulu",
    points: [
      [-45, -490],
      [-45, -658],
      [245, -658],
      [245, -490],
    ],
    width: 13,
  },
  {
    id: "southwest",
    points: [
      [-180, 632],
      [-180, 460],
      [-180, 295],
      [-100, 200],
    ],
    width: 12,
  },
  {
    id: "market",
    points: [
      [-250, 80],
      [-105, 60],
      [74, 60],
    ],
    width: 12,
  },
  {
    id: "kaloor",
    points: [
      [-395, -210],
      [-278, -210],
    ],
    width: 13,
  },
];
export const FLYOVERS = [
  { x: 40, z: 460, length: 194, width: 18, height: 6.7 },
  { x: 65, z: 200, length: 182, width: 18, height: 7.1 },
  { x: 151, z: -490, length: 178, width: 18, height: 7.6 },
];
export const METRO_POINTS = [
  [255, 160],
  [174, 170],
  [70, 174],
  [-100, 174],
  [-224, 79],
  [-253, -112],
  [-239, -323],
  [-112, -414],
  [5, -416],
  [-20, -490],
  [-20, -697],
];
export const BOUNDS = { minX: -445, maxX: 350, minZ: -738, maxZ: 760 };
export function nearestOnSegment(x, z, a, b) {
  let dx = b[0] - a[0],
    dz = b[1] - a[1],
    t = Math.max(
      0,
      Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz)),
    );
  let px = a[0] + dx * t,
    pz = a[1] + dz * t;
  return { x: px, z: pz, t, d: Math.hypot(x - px, z - pz) };
}
export function roadDistance(x, z) {
  let best = Infinity;
  for (const r of ROADS)
    for (let i = 1; i < r.points.length; i++)
      best = Math.min(
        best,
        nearestOnSegment(x, z, r.points[i - 1], r.points[i]).d - r.width / 2,
      );
  return best;
}
export function flyoverHeight(f, z) {
  const d = Math.abs(z - f.z),
    half = f.length / 2;
  if (d > half) return 0;
  return f.height * Math.min(1, (half - d) / 48);
}
export function surfaceHeight(x, z, previousY = 0) {
  for (const f of FLYOVERS) {
    if (Math.abs(x - f.x) < f.width / 2 - 0.6) {
      let h = flyoverHeight(f, z);
      if (h > 0 && (h < 1 || previousY > h - 1.6)) return h;
    }
  }
  return 0;
}
