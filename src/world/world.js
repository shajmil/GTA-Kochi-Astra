import * as T from "three";
import { Builder, palm, tree, streetlight, line, bench } from "./builder.js";
import { M, mat } from "./materials.js";
import {
  LANDMARKS,
  ROADS,
  FLYOVERS,
  METRO_POINTS,
  roadDistance,
  flyoverHeight,
  nearestOnSegment,
} from "./layout.js";
import { makeLandmarks } from "./landmarks.js";
import { seeded } from "../math.js";
const rng = seeded(2031),
  rand = (a, b) => a + (b - a) * rng();
function strip(b, a, c, width, y, m) {
  let dx = c[0] - a[0],
    dz = c[1] - a[1],
    len = Math.hypot(dx, dz),
    geo = new T.PlaneGeometry(width, len);
  geo.rotateX(-Math.PI / 2);
  let uv = geo.attributes.uv;
  for (let i = 0; i < uv.count; i++)
    uv.setXY(i, (uv.getX(i) * width) / 9, (uv.getY(i) * len) / 9);
  b.add(
    geo,
    m,
    (a[0] + c[0]) / 2,
    y,
    (a[1] + c[1]) / 2,
    1,
    1,
    1,
    0,
    Math.atan2(dx, dz),
  );
  geo.dispose();
}
function roads(b) {
  for (const r of ROADS) {
    for (let i = 1; i < r.points.length; i++) {
      let a = r.points[i - 1],
        c = r.points[i],
        dx = c[0] - a[0],
        dz = c[1] - a[1],
        len = Math.hypot(dx, dz),
        nx = dz / len,
        nz = -dx / len;
      strip(b, a, c, r.width + 5, 0.012, mat("#b0a992"));
      strip(b, a, c, r.width, 0.035, M.road);
      for (let s of [-1, 1]) {
        let off = r.width / 2 + 1.2;
        line(
          b,
          a[0] + nx * off * s,
          a[1] + nz * off * s,
          c[0] + nx * off * s,
          c[1] + nz * off * s,
          2.15,
          0.11,
          mat("#b9b5a6"),
        );
        line(
          b,
          a[0] + nx * (r.width / 2 - 0.45) * s,
          a[1] + nz * (r.width / 2 - 0.45) * s,
          c[0] + nx * (r.width / 2 - 0.45) * s,
          c[1] + nz * (r.width / 2 - 0.45) * s,
          0.11,
          0.068,
          M.white,
        );
      }
      for (let t = 6; t < len - 3; t += 9) {
        let k = t / len,
          kk = Math.min(1, (t + 3.2) / len);
        for (let off of r.main ? [-r.width / 4, r.width / 4] : [0])
          line(
            b,
            a[0] + dx * k + nx * off,
            a[1] + dz * k + nz * off,
            a[0] + dx * kk + nx * off,
            a[1] + dz * kk + nz * off,
            0.1,
            0.065,
            M.white,
          );
      }
      if (r.main) {
        line(
          b,
          a[0] + nx * 0.16,
          a[1] + nz * 0.16,
          c[0] + nx * 0.16,
          c[1] + nz * 0.16,
          0.1,
          0.066,
          M.yellow,
        );
        line(
          b,
          a[0] - nx * 0.16,
          a[1] - nz * 0.16,
          c[0] - nx * 0.16,
          c[1] - nz * 0.16,
          0.1,
          0.066,
          M.yellow,
        );
      }
      for (let t = 18; t < len - 8; t += 39) {
        let k = t / len;
        for (let s of [-1, 1]) {
          const x = a[0] + dx * k + nx * (r.width / 2 + 2.6) * s,
            z = a[1] + dz * k + nz * (r.width / 2 + 2.6) * s;
          streetlight(b, x, z, Math.atan2(-nx * s, -nz * s));
          if (r.main && rng() > 0.28)
            palm(
              b,
              x + nx * 2.4 * s,
              z + nz * 2.4 * s,
              rand(9, 14),
              rand(0, 6),
            );
        }
      }
    }
    // Round joined surfaces remove cracks at polyline bends.
    for (let p of r.points.slice(1, -1)) {
      b.cylinder(p[0], 0.018, p[1], r.width / 2, 0.055, M.road);
    }
  }
  // Junctions, painted crossing stripes and traffic lights.
  for (let j of [
    { x: 40, z: 460 },
    { x: 65, z: 200 },
    { x: 151, z: -490 },
    { x: -273, z: -128 },
  ]) {
    b.box(j.x, 0.044, j.z, 31, 0.025, 29, M.road);
    for (let s of [-1, 1]) {
      for (let i = -5; i <= 5; i++)
        b.box(j.x + i * 1.9, 0.077, j.z + s * 18, 1, 0.02, 4, M.white);
      let x = j.x + s * 17,
        z = j.z + s * 19;
      b.cylinder(x, 2.5, z, 0.1, 5, M.dark);
      b.box(x, 4.7, z, 0.48, 1.4, 0.32, M.dark);
      for (let k = 0; k < 3; k++)
        b.sphere(
          x,
          5.13 - k * 0.43,
          z + 0.2,
          0.13,
          0.13,
          0.08,
          mat(["#d25939", "#dfb558", "#79a860"][k]),
        );
    }
  }
  for (const f of FLYOVERS) {
    for (let z = f.z - f.length / 2; z < f.z + f.length / 2; z += 3) {
      const h1 = flyoverHeight(f, z),
        h2 = flyoverHeight(f, z + 3),
        h = (h1 + h2) / 2,
        tilt = Math.atan2(h2 - h1, 3);
      b.add(
        new T.BoxGeometry(1, 1, 1),
        M.concrete,
        f.x,
        h - 0.48,
        z + 1.5,
        f.width,
        0.85,
        3.12,
        -tilt,
      );
      b.add(
        new T.BoxGeometry(1, 1, 1),
        M.road,
        f.x,
        h + 0.01,
        z + 1.5,
        f.width - 0.5,
        0.1,
        3.12,
        -tilt,
      );
      for (let s of [-1, 1]) {
        b.add(
          new T.BoxGeometry(1, 1, 1),
          z % 6 === 0 ? M.dark : M.white,
          f.x + s * (f.width / 2 - 0.15),
          h + 0.5,
          z + 1.5,
          0.42,
          0.85,
          3.1,
          -tilt,
        );
        b.collider(
          f.x + s * (f.width / 2 - 0.15),
          z + 1.5,
          0.5,
          3.1,
          1.1,
          h - 0.1,
        );
      }
      if (z % 9 < 3) {
        b.box(f.x, h + 0.1, z + 1.5, 0.1, 0.03, 2.7, M.yellow);
        for (let s of [-1, 1])
          b.box(f.x + s * 4.2, h + 0.1, z + 1.5, 0.1, 0.03, 2.7, M.white);
      }
    }
    for (let z = f.z - 36; z <= f.z + 36; z += 24) {
      b.box(f.x, f.height / 2 - 1, z, 1.8, f.height - 1.2, 2.2, M.concrete);
      b.box(f.x, f.height - 1.25, z, 14, 0.85, 2.4, M.concrete);
      b.collider(f.x, z, 1.8, 2.2, f.height - 1);
    }
    b.sign(
      f.z > 400 ? "KUNDANNOOR" : f.z > 0 ? "VYTTILA" : "EDAPPALLY",
      f.x,
      f.height + 2.2,
      f.z + 7,
      13,
      2.1,
      { bg: "#235e4d", size: 78, sub: "NH 66  •  KEEP LEFT" },
    );
  }
  // Roadside destination gantries.
  for (const [x, z, t, sub] of [
    [40, 665, "VYTTILA  ↑    EDAPPALLY  ↑", "NH 66   •   KOCHI BYPASS"],
    [-200, 460, "KUNDANNOOR  →", "കുണ്ടന്നൂർ"],
    [-220, -120, "JLN STADIUM  →", "കലൂർ"],
    [137, -443, "LuLu MALL  ←", "ഇടപ്പള്ളി"],
  ]) {
    b.cylinder(x - 7, 3.7, z, 0.14, 7.4, M.steel);
    b.cylinder(x + 7, 3.7, z, 0.14, 7.4, M.steel);
    b.sign(t, x, 7, z, 17, 3, { sub, size: 59 });
  }
}
function reserve(x, z) {
  if (x > -142 && x < 10 && z > 640 && z < 687) return true;
  return LANDMARKS.some(
    (l) =>
      l.id !== "kundannoor" &&
      Math.abs(l.x - x) <
        (l.id === "stadium"
          ? 102
          : l.id === "forum"
            ? 77
            : l.id === "lulu"
              ? 86
              : l.id === "vyttila"
                ? 92
                : 41) &&
      Math.abs(l.z - z) <
        (l.id === "stadium"
          ? 108
          : l.id === "lulu"
            ? 96
            : l.id === "forum"
              ? 68
              : 57),
  );
}
function building(b, x, z, w, d, h, index) {
  const colors = [
    "#d5cbb5",
    "#b4c6bc",
    "#d1b59f",
    "#d5d1c4",
    "#96afa5",
    "#c6bd9f",
    "#d8c0b1",
  ];
  let wall = mat(colors[index % colors.length]);
  wall.map = M.concrete.map;
  wall.normalMap = M.concrete.normalMap;
  wall.normalScale = new T.Vector2(0.15, 0.15);
  b.box(x, h / 2, z, w, h, d, wall);
  b.collider(x, z, w, d, h);
  const floors = Math.max(1, Math.round(h / 3.4));
  for (let floor = 0; floor < floors; floor++) {
    let y = 2 + floor * 3.3;
    if (y > h - 1) break;
    b.box(x, y + 1.4, z, w + 0.5, 0.18, d + 0.5, M.white);
    for (let s of [-1, 1]) {
      for (let col = 0; col < Math.floor(w / 3); col++) {
        let xx = x - w / 2 + 2 + col * 3;
        b.box(
          xx,
          y,
          z + s * (d / 2 + 0.04),
          1.6,
          1.8,
          0.13,
          index % 3 ? M.glass : M.glassLight,
        );
        b.box(xx, y - 1, z + s * (d / 2 + 0.2), 2, 0.14, 0.65, M.white);
      }
      for (let col = 0; col < Math.floor(d / 3.5); col++) {
        let zz = z - d / 2 + 2 + col * 3.5;
        b.box(x + s * (w / 2 + 0.06), y, zz, 0.13, 1.7, 1.7, M.glass);
      }
    }
  }
  b.box(x, h + 0.3, z, w + 0.8, 0.6, d + 0.8, wall);
  b.box(x, h + 0.65, z, w - 0.65, 0.12, d - 0.65, mat("#8c8f80"));
  b.cylinder(x + w * 0.22, h + 1.7, z - d * 0.15, 1, 2, mat("#333d3b"));
  b.box(x - w * 0.25, h + 1.1, z - d * 0.23, 3, 1.8, 3, wall);
  if (h < 9 && index % 3 === 0) {
    const roof = new T.ConeGeometry(1, 1, 4);
    b.add(roof, M.tile, x, h + 1, z, w * 0.79, 3, d * 0.79, 0, Math.PI / 4);
  }
  if (index % 3 === 0) {
    for (let s of [-1, 1])
      b.box(
        x,
        4,
        z + s * (d / 2 + 1),
        w + 1,
        0.18,
        2.3,
        mat(["#4a7e75", "#a67c55", "#ac704f"][index % 3]),
      );
  }
  if (h < 19) {
    const shops = [
      "ഹോട്ടൽ",
      "കട",
      "MALABAR BAKERY",
      "CHAYA & CO.",
      "KERALA STORES",
      "കോച്ചി",
      "HOTEL ARYA",
      "MOBILE CORNER",
    ];
    b.sign(shops[index % shops.length], x, 3.4, z + d / 2 + 0.2, w - 0.8, 1.9, {
      bg: ["#a44b3b", "#315957", "#3e687e", "#b8863e"][index % 4],
      size: 74,
      sub: index % 3 === 0 ? "BAKERY  •  TEA  •  SNACKS" : "",
    });
    for (let i = 0; i < Math.floor(w / 3); i++) {
      b.box(
        x - w / 2 + 1.7 + i * 3,
        1.25,
        z + d / 2 + 0.04,
        2.5,
        2.4,
        0.2,
        mat("#707d76"),
      );
      for (let k = 0; k < 6; k++)
        b.box(
          x - w / 2 + 1.7 + i * 3,
          0.3 + k * 0.34,
          z + d / 2 + 0.17,
          2.5,
          0.025,
          0.05,
          M.steel,
        );
    }
  }
  // Balcony slabs, rails and deep overhangs break up the apartment elevations.
  if (h > 12 && index % 2 === 0) {
    for (let y = 6; y < h - 2; y += 6.6) {
      for (let side of [-1, 1]) {
        let xx = x + side * (w / 2 + 1.2);
        b.box(xx, y, z, 2.4, 0.24, d * 0.65, M.white);
        b.box(xx + side * 0.9, y + 0.65, z, 0.09, 0.09, d * 0.65, M.steel);
        for (let rz = -d * 0.3; rz < d * 0.3; rz += 1.5)
          b.box(xx + side * 0.9, y + 0.35, z + rz, 0.065, 0.7, 0.065, M.steel);
      }
    }
  }
  // Put shop signs on the frontage that actually faces a nearby road.
  let near = { d: Infinity };
  for (const road of ROADS)
    for (let j = 1; j < road.points.length; j++) {
      let p = nearestOnSegment(x, z, road.points[j - 1], road.points[j]);
      if (p.d < near.d) near = p;
    }
  if (near.d < 52) {
    const dx = near.x - x,
      dz = near.z - z,
      sideX = Math.abs(dx) > Math.abs(dz),
      sign = sideX ? Math.sign(dx) : Math.sign(dz),
      ry = sideX ? (sign * Math.PI) / 2 : sign < 0 ? Math.PI : 0,
      sx = x + (sideX ? sign * (w / 2 + 0.16) : 0),
      sz = z + (sideX ? 0 : sign * (d / 2 + 0.16)),
      span = sideX ? d : w;
    const names = [
      "MALABAR HOTEL",
      "ഹോട്ടൽ",
      "FRESH MART",
      "ചായക്കട",
      "KOCHI BAKERS",
      "MALABAR MOBILES",
    ];
    b.sign(
      names[index % 6],
      sx,
      3.8,
      sz,
      span - 0.8,
      1.8,
      {
        bg: ["#985c3e", "#326c60", "#997837"][index % 3],
        size: 68,
        sub: index % 2 ? "" : "TEA • SNACKS",
      },
      ry,
    );
    b.box(
      sx + (sideX ? sign * 0.8 : 0),
      2.75,
      sz + (sideX ? 0 : sign * 0.8),
      sideX ? 2.1 : span,
      0.16,
      sideX ? span : 2.1,
      mat(index % 2 ? "#507865" : "#aa6849"),
    );
  }
  if (index % 4 === 0) {
    b.box(x + w / 2 + 0.3, 2, z, 1.1, 0.8, 1.5, M.white);
    b.box(x + w / 2 + 0.9, 2, z, 0.04, 0.6, 1.2, M.dark);
  }
}
function city(b) {
  let n = 0;
  for (let z = -704; z < 724; z += 39)
    for (let x = -411; x < 330; x += 37) {
      let xx = x + rand(-5, 5),
        zz = z + rand(-5, 5);
      const dist = roadDistance(xx, zz);
      if (dist < 14 || dist > 120 || reserve(xx, zz) || xx > 280) continue;
      let w = rand(13, 23),
        d = rand(12, 23),
        h = rand(7, 18);
      if (rng() > 0.79) h = rand(22, 47);
      building(b, xx, zz, w, d, h, n++);
      if (n % 2 === 0) tree(b, xx + w / 2 + 4, zz, rand(5, 8), n);
      if (n % 4 === 0) palm(b, xx - w / 2 - 3, zz + 5, rand(11, 17), n);
    }
  // A compact row of local businesses opposite Forum, with shutters and awnings.
  for (let i = 0; i < 8; i++) {
    let x = -126 + i * 16,
      z = 665,
      h = 5.2 + (i % 3) * 2.5,
      wall = mat(["#bdb393", "#a6b7a6", "#cfb59a", "#b39d81"][i % 4]);
    b.box(x, h / 2, z, 15, h, 15, wall);
    b.collider(x, z, 15, 15, h);
    b.box(x, h + 0.2, z, 15.5, 0.35, 16, M.white);
    b.box(x, 1.55, z - 7.6, 12, 2.8, 0.15, M.glass);
    b.box(x, 2.9, z - 8.5, 15, 0.17, 3, mat(i % 2 ? "#6b8b6c" : "#a2644c"));
    for (let j = 0; j < 7; j++)
      b.box(x - 6 + j * 2, 2.85, z - 8.5, 0.12, 0.1, 3.1, M.white);
    b.sign(
      [
        "ചായക്കട",
        "MALABAR BAKERY",
        "കേരള സ്റ്റോർ",
        "HOTEL MARADU",
        "COCHIN CYCLES",
        "ഹോട്ടൽ",
        "FRESH MART",
        "MALABAR CAFE",
      ][i],
      x,
      4.1,
      z - 7.8,
      14,
      1.8,
      { bg: ["#2e6e62", "#a26539", "#4e6874"][i % 3], size: 66 },
      Math.PI,
    );
    if (h > 6) {
      for (let j = -1; j <= 1; j++)
        b.box(x + j * 4, 6.2, z - 7.6, 2.1, 2.2, 0.2, M.glass);
      b.box(x, 5, z - 8.1, 15, 0.25, 2.2, M.white);
    }
    if (i % 2 === 0) {
      b.box(x - 4, 0.5, z - 10, 1.3, 1, 1.5, mat("#8c6749"));
      b.sphere(x - 4, 1.1, z - 10, 0.5, 0.3, 0.5, mat("#9baf4c"));
      bench(b, x + 3, z - 10);
    }
  }
  // Dense distant apartment skyline, behind the playable street network.
  for (let i = 0; i < 40; i++) {
    let x = -435 + rand(-90, 35),
      z = -740 + i * 36;
    if (reserve(x, z)) continue;
    building(b, x, z, rand(18, 29), rand(15, 28), rand(24, 60), i + 500);
  }
  for (let i = 0; i < 200; i++) {
    let x = rand(-415, 310),
      z = rand(-710, 724);
    if (
      roadDistance(x, z) > 6 &&
      !reserve(x, z) &&
      !b.colliders.some(
        (c) =>
          x > c.minX - 3 && x < c.maxX + 3 && z > c.minZ - 3 && z < c.maxZ + 3,
      )
    ) {
      if (i % 3) palm(b, x, z, rand(8, 16), i);
      else tree(b, x, z, rand(5, 9), i);
    }
  }
  // Utility poles and bundled cables along the market street.
  for (let z = -660; z < 685; z += 46) {
    const x = -185;
    if (reserve(x, z) || roadDistance(x, z) < 3) continue;
    b.cylinder(x, 4.7, z, 0.13, 9.4, M.concrete);
    b.box(x, 9, z, 3, 0.15, 0.2, M.dark);
    for (let o of [-1, 0, 1])
      b.beam(
        new T.Vector3(x + o, 8.9, z),
        new T.Vector3(x + o, 8.9, z + 46),
        0.022,
        M.dark,
      );
  }
}
function metro(b) {
  const curve = new T.CatmullRomCurve3(
    METRO_POINTS.map((p) => new T.Vector3(p[0], 13.5, p[1])),
    false,
    "catmullrom",
    0.12,
  );
  const length = curve.getLength();
  for (let d = 0; d < length; d += 5) {
    let a = curve.getPointAt(d / length),
      c = curve.getPointAt(Math.min(1, (d + 5.1) / length)),
      mid = a.clone().add(c).multiplyScalar(0.5),
      ang = Math.atan2(c.x - a.x, c.z - a.z);
    b.box(mid.x, 12.4, mid.z, 8, 1.4, a.distanceTo(c) + 0.1, M.concrete, ang);
    for (let s of [-1, 1]) {
      let nx = Math.cos(ang) * s,
        nz = -Math.sin(ang) * s;
      b.box(
        mid.x + nx * 3.7,
        13.3,
        mid.z + nz * 3.7,
        0.28,
        1.1,
        5.3,
        M.concrete,
        ang,
      );
      for (let rail of [-0.7, 0.7])
        b.box(
          mid.x + Math.cos(ang) * (s * 1.9 + rail),
          13.18,
          mid.z - Math.sin(ang) * (s * 1.9 + rail),
          0.09,
          0.12,
          5.4,
          M.steel,
          ang,
        );
    }
  }
  for (let d = 15; d < length; d += 27) {
    let p = curve.getPointAt(d / length);
    b.cylinder(p.x, 5.9, p.z, 0.83, 11.8, M.concrete);
    b.box(p.x, 11.4, p.z, 8.1, 1.1, 2.2, M.concrete);
    b.collider(p.x, p.z, 1.8, 1.8, 12);
  }
  for (const station of [
    { x: 80, z: 174, rot: Math.PI / 2, name: "VYTTILA" },
    { x: -242, z: -272, rot: 0, name: "JLN STADIUM" },
    { x: -20, z: -555, rot: 0, name: "EDAPPALLY" },
  ]) {
    let { x, z, rot, name } = station;
    b.box(x, 13.1, z, 17, 1.2, 61, M.white, rot);
    b.box(x, 17.3, z, 18, 0.6, 64, M.teal, rot);
    for (let s of [-1, 1]) {
      let nx = Math.cos(rot) * s,
        nz = -Math.sin(rot) * s;
      b.box(x + nx * 7.4, 15.2, z + nz * 7.4, 0.22, 3.6, 58, M.glassLight, rot);
      for (let i = -25; i <= 25; i += 10) {
        b.box(
          x + nx * 7.5 + Math.sin(rot) * i,
          15.2,
          z + nz * 7.5 + Math.cos(rot) * i,
          0.3,
          4,
          0.3,
          M.white,
        );
      }
    }
    b.sign(name + "  METRO", x, 16, z + 31.1, 16, 2, {
      bg: "#198a90",
      size: 64,
    });
    b.box(x + 11, 7.3, z + 11, 4, 14.6, 6, M.glassLight);
    b.collider(x + 11, z + 11, 4, 6, 15);
  }
  return curve;
}
function water(scene, b) {
  const uniforms = { uTime: { value: 0 } };
  let material = new T.MeshStandardMaterial({
    color: "#548e85",
    metalness: 0.66,
    roughness: 0.24,
    transparent: true,
    opacity: 0.93,
  });
  material.onBeforeCompile = (s) => {
    s.uniforms.uTime = uniforms.uTime;
    s.vertexShader = "uniform float uTime;\n" + s.vertexShader;
    s.vertexShader = s.vertexShader.replace(
      "#include <begin_vertex>",
      "#include <begin_vertex>\n transformed.z += sin(position.x*.18+uTime*.7)*.13+sin(position.y*.31+uTime*.6)*.09;",
    );
  };
  let geo = new T.PlaneGeometry(150, 1600, 50, 150),
    mesh = new T.Mesh(geo, material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(360, -0.25, 25);
  mesh.receiveShadow = true;
  scene.add(mesh);
  b.box(283, -0.2, 25, 5, 2, 1600, M.concrete);
  b.collider(281, 25, 2, 1600, 2, -1);
  for (let z = -720; z < 750; z += 18) {
    tree(b, 279, z, rand(4, 7), z);
  }
  let canal = new T.Mesh(new T.PlaneGeometry(20, 175, 8, 32), material);
  canal.rotation.x = -Math.PI / 2;
  canal.position.set(-147, -0.2, 550);
  scene.add(canal);
  for (let s of [-1, 1]) {
    b.box(-147 + s * 11, 0.2, 550, 1, 1, 175, M.concrete);
    b.collider(-147 + s * 11, 550, 1, 175, 1);
  }
  // A pedestrian bridge and a small jetty on the hub's eastern edge.
  b.box(-147, 0.8, 617, 25, 0.6, 8, M.concrete);
  b.box(295, 0.7, 165, 25, 0.5, 13, mat("#897657"));
  b.sign("VYTTILA  WATER METRO", 287, 4, 159, 18, 3, {
    bg: "#1d7482",
    size: 65,
  });
  return uniforms;
}
export function createWorld(scene) {
  const b = new Builder(scene);
  const ground = new T.Mesh(new T.PlaneGeometry(2700, 2900), M.ground);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.12;
  ground.receiveShadow = true;
  scene.add(ground);
  roads(b);
  makeLandmarks(b);
  city(b);
  const metroCurve = metro(b);
  const waterUniforms = water(scene, b);
  b.finish();
  return {
    colliders: b.colliders,
    metroCurve,
    waterUniforms,
    staticParts: b.count,
  };
}
