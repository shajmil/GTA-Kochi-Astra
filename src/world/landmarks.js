import * as T from "three";
import { M, mat } from "./materials.js";
import { palm, tree, line, bench, streetlight } from "./builder.js";
function windows(b, x, y, z, w, h, cols, rows) {
  b.box(x, y, z, w, h, 0.2, M.glass);
  for (let i = 0; i <= cols; i++)
    b.box(x - w / 2 + (i * w) / cols, y, z + 0.17, 0.12, h, 0.15, M.steel);
  for (let j = 0; j <= rows; j++)
    b.box(x, y - h / 2 + (j * h) / rows, z + 0.17, w, 0.12, 0.15, M.steel);
}
function plaza(b, x, z, w, d) {
  b.box(x, 0.05, z, w, 0.1, d, mat("#bcb4a1"));
  for (let i = -w / 2; i < w / 2; i += 3)
    line(b, x + i, z - d / 2, x + i, z + d / 2, 0.025, 0.115, mat("#9e998d"));
}
export function makeLandmarks(b) {
  forum(b);
  brototype(b);
  hub(b);
  stadium(b);
  lulu(b);
}
function forum(b) {
  const x = -61,
    z = 568;
  plaza(b, x, z + 47, 122, 20);
  b.box(x, 12, z, 108, 24, 76, M.concrete);
  b.collider(x, z, 108, 76, 28);
  b.box(x, 4, z + 38.4, 107, 8, 0.4, M.glass);
  b.box(x, 8.6, z + 40, 113, 0.7, 6, M.steel);
  b.box(x - 48, 15, z + 38.8, 13, 17, 1.2, mat("#48534f"));
  b.box(x + 48, 15, z + 38.8, 13, 17, 1.2, mat("#48534f"));
  const colors = ["#a9b84d", "#c4bc47", "#d1a942", "#91b866", "#b6c767"];
  for (let i = 0; i < 20; i++) {
    let xx = x - 40 + i * 4.2;
    let yy = 17 + Math.sin(i * 0.7) * 0.5;
    b.box(xx, 19, z + 39, 0.44, 23, 2, M.steel);
    b.box(
      xx + 2,
      yy,
      z + 39.1,
      3.55,
      17,
      0.25,
      mat(colors[i % 5]),
      (i % 2 ? 1 : -1) * 0.21,
    );
    b.beam(
      new T.Vector3(xx, 9, z + 40),
      new T.Vector3(xx + 3.8, 25, z + 40),
      0.1,
      M.steel,
    );
    b.box(xx + 1.85, yy, z + 39.9, 0.16, 18, 0.2, mat("#d0bb75"));
  }
  b.sign("forum", x, 30, z + 39.9, 40, 8, {
    bg: "#697365",
    fg: "#ffffff",
    size: 105,
    sub: "KOCHI  •  PRESTIGE",
  });
  b.sign("forum", x - 47, 19, z + 39.8, 12, 7, {
    bg: "#aaa34c",
    fg: "#fff9e2",
    size: 104,
  });
  b.sign("CELEBRATE EVERY DAY", x + 47, 19, z + 39.8, 12, 7, {
    bg: "#dfbf75",
    fg: "#274943",
    size: 45,
    sub: "MARADU · KOCHI",
  });
  b.sign("ഫോറം  •  KOCHI", x, 7.3, z + 43.1, 24, 2.4, {
    bg: "#23322f",
    size: 65,
  });
  for (let i = 0; i < 10; i++)
    windows(b, x - 45 + i * 10, 3.8, z + 38.8, 8.5, 5.8, 2, 1);
  for (let i = 0; i < 4; i++) {
    b.box(x - 32 + i * 22, 0.45, z + 52, 9, 0.9, 2.1, M.concrete);
    tree(b, x - 32 + i * 22, z + 52, 4.4, i);
  }
  for (let i = 0; i < 4; i++) {
    palm(b, x - 57 + i * 37, z + 57, 11, i);
    bench(b, x - 40 + i * 26, z + 57);
  }
  b.box(x + 43, 28, z - 12, 23, 9, 40, mat("#c8c3b2"));
  for (let i = 0; i < 4; i++)
    b.box(x + 43, 25 + i * 2.2, z + 8.1, 23, 0.45, 0.5, M.dark);
  b.sign("KOCHI", x + 43, 29, z + 8.4, 19, 4, {
    bg: "#dbd1b1",
    fg: "#8c6234",
    size: 70,
  });
  for (let i = 0; i < 8; i++) {
    let zz = z - 29 + i * 8;
    windows(b, x + 54.1, 12, zz, 6, 16, 2, 4);
  }
}
function brototype(b) {
  let x = 137,
    z = 523;
  plaza(b, x, z + 22, 52, 17);
  b.box(x, 10, z, 48, 20, 36, mat("#bcbdb4"));
  b.collider(x, z, 48, 36, 23);
  for (let f = 0; f < 4; f++) {
    windows(b, x, 3.5 + f * 4.2, z + 18.2, 44, 3.1, 12, 1);
    b.box(x, 1.5 + f * 4.2, z + 18.8, 51, 0.4, 2.7, M.white);
  }
  b.box(x - 18, 12, z + 18.4, 3, 23, 1.2, M.dark);
  b.box(x + 18, 12, z + 18.4, 3, 23, 1.2, M.dark);
  b.sign("BROTOTYPE", x, 22.1, z + 18.8, 44, 6, {
    bg: "#171c1b",
    fg: "#fbfbef",
    size: 84,
    sub: "KOCHI HUB   •   BROCAMP",
  });
  b.sign("BUILD YOUR FUTURE.", x, 5.5, z + 20.3, 32, 3.2, {
    bg: "#d4dc3d",
    fg: "#1b2625",
    size: 75,
  });
  b.box(x, 1.5, z + 22, 8, 3, 6, M.glass);
  for (let i = 0; i < 4; i++)
    b.box(x, 0.12 + i * 0.12, z + 27 - i * 0.5, 10, 0.24, 0.7, M.concrete);
  palm(b, x - 25, z + 22, 10, 2);
  palm(b, x + 26, z + 19, 12, 4);
}
function hub(b) {
  const x = 164,
    z = 151;
  plaza(b, x, z, 146, 89);
  b.box(x + 15, 3, z - 28, 111, 6, 14, M.cream);
  b.collider(x + 15, z - 28, 111, 14, 7);
  for (let i = 0; i < 10; i++) {
    const xx = x - 44 + i * 10.8;
    b.cylinder(xx, 3.5, z + 8, 0.24, 7, M.teal);
    b.cylinder(xx, 3.5, z - 17, 0.24, 7, M.teal);
    b.sign(String(i + 1).padStart(2, "0"), xx, 5.8, z + 12.1, 2.3, 1.3, {
      bg: "#236f65",
      size: 95,
    });
    line(b, xx - 4, z + 14, xx - 4, z + 35, 0.16, 0.18, M.yellow);
  }
  for (let i = 0; i < 3; i++) {
    const zz = z - 15 + i * 10;
    b.box(x - 61, 3, zz, 12, 6, 6.5, M.white);
    b.box(x - 61, 6.2, zz, 15, 0.4, 8, M.teal);
    windows(b, x - 61, 3, zz + 3.4, 10, 3, 4, 1);
  }
  // Repeated barrel canopies and exposed arched lattice from the terminal reference.
  for (let bay = 0; bay < 6; bay++) {
    let cx = x - 44 + bay * 18.1;
    const verts = [],
      uv = [],
      idx = [];
    for (let k = 0; k <= 16; k++) {
      let t = k / 16,
        xx = cx - 8.8 + t * 17.6,
        yy = 6.8 + Math.sin(t * Math.PI) * 1.2;
      for (let zz of [z - 22, z + 13]) {
        verts.push(xx, yy, zz);
        uv.push(t, zz);
      }
    }
    for (let k = 0; k < 16; k++) {
      let n = k * 2;
      idx.push(n, n + 1, n + 2, n + 1, n + 3, n + 2);
    }
    let roof = new T.BufferGeometry();
    roof.setAttribute("position", new T.Float32BufferAttribute(verts, 3));
    roof.setAttribute("uv", new T.Float32BufferAttribute(uv, 2));
    roof.setIndex(idx);
    roof.computeVertexNormals();
    let roofMat = mat("#d8d9c9", 0.6, 0.25);
    roofMat.side = T.DoubleSide;
    b.add(roof, roofMat);
    roof.dispose();
    for (let zz of [z - 21, z + 10]) {
      for (let k = 0; k < 14; k++) {
        let t = k / 14,
          t2 = (k + 1) / 14,
          a = new T.Vector3(
            cx - 8.8 + t * 17.6,
            7 + Math.sin(t * Math.PI) * 5.5,
            zz,
          ),
          c = new T.Vector3(
            cx - 8.8 + t2 * 17.6,
            7 + Math.sin(t2 * Math.PI) * 5.5,
            zz,
          );
        b.beam(a, c, 0.095, M.white);
        if (k % 2 === 0) {
          b.beam(
            a,
            new T.Vector3(cx - 8.8 + t2 * 17.6, 7.1, zz),
            0.055,
            M.steel,
          );
        }
      }
    }
    for (let k = 1; k < 7; k++) {
      let t = k / 7;
      b.beam(
        new T.Vector3(
          cx - 8.8 + t * 17.6,
          7 + Math.sin(t * Math.PI) * 5.5,
          z - 21,
        ),
        new T.Vector3(
          cx - 8.8 + t * 17.6,
          7 + Math.sin(t * Math.PI) * 5.5,
          z + 10,
        ),
        0.055,
        M.white,
      );
    }
  }
  b.sign("VYTTILA MOBILITY HUB", x - 51, 8.8, z + 13.3, 28, 4, {
    bg: "#267164",
    size: 65,
    sub: "വൈറ്റില മൊബിലിറ്റി ഹബ്",
  });
  b.sign("KSRTC  •  KERALA STATE ROAD TRANSPORT", x + 15, 4, z - 20.7, 73, 3, {
    bg: "#bb4a35",
    size: 49,
  });
  for (let i = 0; i < 7; i++) {
    tree(b, x - 62 + i * 21, z + 42, 5.4, i);
    bench(b, x - 47 + i * 17, z + 39);
  }
  for (let i = 0; i < 3; i++) palm(b, x - 70, z - 30 + i * 30, 13, i);
  b.sign("WATER METRO  →", x + 68, 4, z + 43, 19, 3, {
    bg: "#007b9c",
    size: 67,
  });
}
function ellipticalRing(b, x, z, inner, outer, y, sy, m, segments = 80) {
  const geo = new T.RingGeometry(inner, outer, segments, 1);
  geo.rotateX(-Math.PI / 2);
  b.add(geo, m, x, y, z, 1, 1, sy);
  geo.dispose();
}
function stadium(b) {
  const x = -134,
    z = -236,
    rx = 76,
    rz = 62;
  plaza(b, x, z, 176, 160);
  b.box(x, 0.15, z, 91, 0.14, 57, mat("#43764a"));
  for (let i = 0; i < 12; i++)
    b.box(
      x - 44 + i * 7.5,
      0.24,
      z,
      7.5,
      0.02,
      54,
      mat(i % 2 ? "#4e8150" : "#47784a"),
    );
  for (let xx of [-44, 44]) line(b, x + xx, z - 27, x + xx, z + 27, 0.2, 0.27);
  for (let zz of [-27, 27]) line(b, x - 44, z + zz, x + 44, z + zz, 0.2, 0.27);
  line(b, x, z - 27, x, z + 27, 0.16, 0.28);
  const circle = new T.RingGeometry(8.8, 9, 48);
  circle.rotateX(-Math.PI / 2);
  b.add(circle, M.white, x, 0.28, z);
  for (let sx of [-1, 1]) {
    for (let zz of [-9, 9])
      b.cylinder(x + sx * 44, 1.4, z + zz, 0.07, 2.8, M.white);
    b.box(x + sx * 44, 2.8, z, 0.12, 0.12, 18, M.white);
  }
  for (let level = 0; level < 11; level++) {
    const rr = 51 + level * 1.95,
      y = 1 + level * 1.43;
    ellipticalRing(b, x, z, rr, rr + 2, y, rz / rx, M.concrete);
    ellipticalRing(
      b,
      x,
      z,
      rr + 0.25,
      rr + 1.3,
      y + 0.13,
      rz / rx,
      mat(
        level % 3 === 0 ? "#c8bb55" : level % 3 === 1 ? "#719c99" : "#d1c99d",
      ),
    );
    const riser = new T.CylinderGeometry(
      rr + 1.95,
      rr + 1.95,
      1.5,
      80,
      1,
      true,
    );
    b.add(riser, M.concrete, x, y - 0.7, z, 1, 1, rz / rx);
    riser.dispose();
  }
  for (let i = 0; i < 48; i++) {
    const a = (i * Math.PI * 2) / 48,
      s = Math.sin(a),
      c = Math.cos(a),
      xx = x + s * rx,
      zz = z + c * rz;
    b.beam(
      new T.Vector3(xx, 0, zz),
      new T.Vector3(xx + s * 2, 20.5, zz + c * 2),
      0.62,
      M.teal,
    );
    b.collider(xx, zz, 1.3, 1.3, 22);
    for (let lv = 1; lv < 4; lv++) {
      const an = ((i + 1) * Math.PI * 2) / 48;
      b.beam(
        new T.Vector3(xx, lv * 5.1, zz),
        new T.Vector3(x + Math.sin(an) * rx, lv * 5.1, z + Math.cos(an) * rz),
        0.34,
        M.teal,
      );
    }
    b.beam(
      new T.Vector3(xx, 19, zz),
      new T.Vector3(x + s * 51, 23.8, z + c * 42),
      0.15,
      M.teal,
    );
    b.beam(
      new T.Vector3(xx + s * 6, 22.2, zz + c * 5),
      new T.Vector3(x + s * 51, 23.8, z + c * 42),
      0.12,
      M.steel,
    );
    b.beam(
      new T.Vector3(xx, 19, zz),
      new T.Vector3(xx + s * 6, 22.2, zz + c * 5),
      0.13,
      M.steel,
    );
    for (let k = 0; k < 4; k++) {
      let r1 = 53 + k * 7,
        r2 = r1 + 7;
      b.beam(
        new T.Vector3(x + s * r1, 23.3, z + c * r1 * 0.815),
        new T.Vector3(x + s * r2, 20.8, z + c * r2 * 0.815),
        0.065,
        M.steel,
      );
      b.beam(
        new T.Vector3(x + s * r1, 20.8, z + c * r1 * 0.815),
        new T.Vector3(x + s * r2, 23.3, z + c * r2 * 0.815),
        0.065,
        M.steel,
      );
    }
  }
  // Sweeping annular canopy: open centre, curved upper profile.
  const verts = [],
    uv = [],
    indices = [],
    n = 96;
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2;
    for (let r = 0; r < 3; r++) {
      let rr = [50, 69, 83][r],
        y = [23.6, 25, 22.4][r];
      verts.push(x + Math.sin(a) * rr, y, z + Math.cos(a) * rr * 0.815);
      uv.push(i / 8, r);
    }
  }
  for (let i = 0; i < n; i++)
    for (let r = 0; r < 2; r++) {
      let k = i * 3 + r;
      indices.push(k, k + 3, k + 1, k + 1, k + 3, k + 4);
    }
  const geo = new T.BufferGeometry();
  geo.setAttribute("position", new T.Float32BufferAttribute(verts, 3));
  geo.setAttribute("uv", new T.Float32BufferAttribute(uv, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  let roof = mat("#b6c7c2", 0.55, 0.4);
  roof.side = T.DoubleSide;
  b.add(geo, roof);
  for (let i = 0; i < 4; i++) {
    let a = Math.PI / 4 + (i * Math.PI) / 2,
      xx = x + Math.sin(a) * 75,
      zz = z + Math.cos(a) * 61;
    b.cylinder(xx, 21, zz, 0.65, 42, M.white);
    b.box(xx, 42, zz, 13, 4, 1.1, M.steel, a);
    for (let j = 0; j < 6; j++)
      b.box(xx - 5 + j * 2, 42, zz + 0.7, 1.3, 2.4, 0.25, mat("#fbf5d3"), a);
  }
  for (let side of [-1, 1]) {
    b.cylinder(x + side * 14, 10, z + 65, 4.2, 20, M.concrete);
    b.cylinder(x + side * 14, 20.3, z + 65, 4.5, 0.6, M.teal);
  }
  b.box(x, 8, z + 66, 21, 1.2, 12, M.teal);
  b.sign("JAWAHARLAL NEHRU", x, 15, z + 67.6, 25, 4, {
    bg: "#237e80",
    size: 63,
    sub: "INTERNATIONAL STADIUM",
  });
  b.sign("HOME OF KERALA FOOTBALL", x, 8, z + 74, 38, 3.5, {
    bg: "#d5b846",
    fg: "#254b57",
    size: 64,
  });
  for (let i = 0; i < 7; i++) {
    palm(b, x - 78 + i * 25, z + 78, 11 + (i % 3), i);
  }
  // Entrance arch off Stadium Link Road.
  for (let s of [-1, 1]) b.cylinder(x + s * 21, 6, z + 98, 0.45, 12, M.teal);
  b.box(x, 12, z + 98, 44, 2.6, 0.7, M.teal);
  b.sign("GCDA  •  JAWAHARLAL NEHRU STADIUM", x, 12, z + 98.4, 43, 2.4, {
    bg: "#217e84",
    size: 47,
  });
}
function lulu(b) {
  let x = 60,
    z = -582;
  plaza(b, x, z + 58, 143, 23);
  b.box(x, 13, z, 120, 26, 99, mat("#ccbd96"));
  b.collider(x, z, 120, 99, 29);
  b.box(x, 27, z, 122, 2, 101, M.cream);
  b.box(x, 7, z + 50, 117, 14, 0.5, mat("#e1cfac"));
  windows(b, x, 7, z + 50.4, 110, 9, 20, 2);
  for (let i = 0; i < 11; i++) {
    let xx = x - 54 + i * 10.8;
    b.box(xx, 17, z + 50.7, 0.8, 22, 1.3, mat("#eee2c4"));
    b.box(xx, 25, z + 51, 8.5, 0.35, 1.6, M.white);
  }
  b.box(x, 17, z + 51, 120, 0.5, 1.5, M.white);
  b.box(x, 3, z + 54, 117, 0.5, 7, M.cream);
  b.sign("LuLu", x, 29.5, z + 50.6, 35, 8, {
    bg: "#e1d5b1",
    fg: "#2b8541",
    size: 133,
  });
  b.sign("INTERNATIONAL SHOPPING MALL", x, 23, z + 51.4, 78, 3.3, {
    bg: "#c6b58b",
    fg: "#365342",
    size: 60,
  });
  b.sign("LuLu HYPERMARKET", x - 35, 17, z + 51.5, 35, 4, {
    bg: "#e3d9bc",
    fg: "#438143",
    size: 70,
  });
  b.sign("PVR CINEMAS", x + 36, 17, z + 51.5, 31, 4, {
    bg: "#d1be92",
    fg: "#574b38",
    size: 70,
  });
  for (let i = 0; i < 4; i++)
    b.sign(
      [
        "THE EVERYDAY EDIT",
        "FASHION / KOCHI",
        "A TASTE OF KERALA",
        "EXPLORE MORE",
      ][i],
      x - 44 + i * 29,
      11,
      z + 51.6,
      15,
      9,
      {
        bg: ["#50665e", "#996b55", "#6b8180", "#bca779"][i],
        fg: "#fff5e0",
        size: 42,
        sub: "LuLu · EDAPPALLY",
      },
    );
  // Sandstone entrance drums and sweeping canopies.
  for (let s of [-1, 1]) {
    b.cylinder(x + s * 52, 8, z + 49, 8.5, 16, M.cream);
    b.cylinder(x + s * 52, 17, z + 49, 9, 0.8, mat("#e8ddc3"));
  }
  b.box(x, 5, z + 56, 26, 0.6, 12, M.white);
  for (let s of [-1, 1]) b.cylinder(x + s * 11, 2.5, z + 59, 0.25, 5, M.steel);
  for (let i = 0; i < 6; i++) {
    palm(b, x - 65 + i * 26, z + 67, 13, i);
  }
  // Hotel tower on the mall campus, stepped curtain wall.
  b.box(x - 34, 31, z - 44, 35, 62, 33, M.cream);
  b.collider(x - 34, z - 44, 35, 33, 63);
  windows(b, x - 34, 34, z - 27.3, 29, 48, 8, 14);
  b.box(x - 34, 64, z - 44, 38, 2, 36, M.white);
  b.sign("MARRIOTT", x - 34, 60, z - 27, 29, 4, {
    bg: "#ccc1a7",
    fg: "#534536",
    size: 70,
  });
  // Enclosed pedestrian bridge to the metro station.
  b.box(-1, 12.8, -544, 26, 0.8, 5.3, M.white);
  b.box(-1, 15, -544, 26, 3.6, 4.7, M.glassLight);
  b.box(-1, 17, -544, 27, 0.5, 5.5, M.teal);
}
