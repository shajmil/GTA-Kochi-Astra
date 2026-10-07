import * as T from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { M, mat, signMaterial } from "./materials.js";
let shadowMat;
function shadow(w, d) {
  if (!shadowMat) {
    let c = document.createElement("canvas");
    c.width = c.height = 64;
    let ctx = c.getContext("2d"),
      g = ctx.createRadialGradient(32, 32, 1, 32, 32, 32);
    g.addColorStop(0, "rgba(12,20,17,.42)");
    g.addColorStop(0.5, "rgba(12,20,17,.24)");
    g.addColorStop(1, "rgba(12,20,17,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
    shadowMat = new T.MeshBasicMaterial({
      map: new T.CanvasTexture(c),
      transparent: true,
      depthWrite: false,
    });
  }
  let m = new T.Mesh(new T.PlaneGeometry(w, d), shadowMat);
  m.rotation.x = -Math.PI / 2;
  m.position.y = 0.035;
  return m;
}
function mesh(g, m, p, x, y, z, rx = 0, ry = 0, rz = 0) {
  const v = new T.Mesh(g, m);
  v.position.set(x, y, z);
  v.rotation.set(rx, ry, rz);
  v.castShadow = true;
  v.receiveShadow = true;
  p.add(v);
  return v;
}
function box(p, x, y, z, w, h, d, m, round = 0.04) {
  return mesh(new RoundedBoxGeometry(w, h, d, 2, round), m, p, x, y, z);
}
function beam(p, a, c, r, m) {
  let v = new T.Vector3(...c).sub(new T.Vector3(...a));
  let ob = mesh(
    new T.CylinderGeometry(r, r, v.length(), 6),
    m,
    p,
    (a[0] + c[0]) / 2,
    (a[1] + c[1]) / 2,
    (a[2] + c[2]) / 2,
  );
  ob.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), v.normalize());
  return ob;
}
const characterMaterial = new T.MeshStandardMaterial({
  vertexColors: true,
  roughness: 0.8,
});
function combine(group, colors = false) {
  group.updateMatrixWorld(true);
  const sets = new Map();
  for (const m of [...group.children]) {
    if (!m.isMesh || m.material.transparent) continue;
    const colored = colors && !m.material.map;
    const key = colored ? "color" : m.material.uuid;
    if (!sets.has(key))
      sets.set(key, {
        material: colored ? characterMaterial : m.material,
        geos: [],
      });
    let geometry = m.geometry.index
      ? m.geometry.toNonIndexed()
      : m.geometry.clone();
    if (colored) {
      const count = geometry.attributes.position.count,
        c = m.material.color,
        arr = new Float32Array(count * 3);
      for (let i = 0; i < arr.length; i += 3) {
        arr[i] = c.r;
        arr[i + 1] = c.g;
        arr[i + 2] = c.b;
      }
      geometry.setAttribute("color", new T.BufferAttribute(arr, 3));
    }
    sets.get(key).geos.push(geometry.applyMatrix4(m.matrix));
    group.remove(m);
    m.geometry.dispose();
  }
  for (const { material, geos } of sets.values()) {
    let g = mergeGeometries(geos, false);
    if (g) {
      const mesh = new T.Mesh(g, material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);
    }
    geos.forEach((g) => g.dispose());
  }
}
export function createVehicle(type = "car", color = "#dde2d7") {
  const root = new T.Group(),
    body = new T.Group();
  root.add(body);
  const paint = mat(color, 0.28, 0.5),
    chrome = mat("#c4cccb", 0.2, 0.8),
    black = M.rubber,
    glass = mat("#324b50", 0.15, 0.65),
    light = mat("#fcf0be", 0.26, 0.2),
    red = mat("#a92d20", 0.25, 0.4);
  const wheels = [];
  let length = 4.55,
    width = 1.95;
  function wheel(x, z, r = 0.36) {
    const pivot = new T.Group();
    pivot.position.set(x, r + 0.02, z);
    root.add(pivot);
    mesh(
      new T.CylinderGeometry(r, r, 0.26, 18),
      black,
      pivot,
      0,
      0,
      0,
      0,
      0,
      Math.PI / 2,
    );
    mesh(
      new T.CylinderGeometry(r * 0.64, r * 0.64, 0.275, 12),
      chrome,
      pivot,
      0,
      0,
      0,
      0,
      0,
      Math.PI / 2,
    );
    mesh(
      new T.CylinderGeometry(r * 0.26, r * 0.26, 0.29, 10),
      M.dark,
      pivot,
      0,
      0,
      0,
      0,
      0,
      Math.PI / 2,
    );
    combine(pivot, true);
    wheels.push(pivot);
  }
  if (type === "bike") {
    length = 2.15;
    width = 0.65;
    for (let z of [-0.78, 0.82]) wheel(0, z, 0.34);
    beam(body, [0, 0.45, -0.7], [0, 1, 0.22], 0.06, chrome);
    beam(body, [0, 1, 0.22], [0, 0.38, 0.82], 0.055, chrome);
    beam(body, [0, 0.45, -0.7], [0, 0.7, 0.25], 0.06, black);
    box(body, 0, 0.92, -0.3, 0.6, 0.2, 0.85, black, 0.08);
    box(body, 0, 0.92, 0.3, 0.55, 0.48, 0.6, paint, 0.17);
    box(body, 0, 0.6, -0.1, 0.46, 0.48, 0.46, M.dark, 0.06);
    beam(body, [0, 0.9, 0.72], [0, 1.37, 0.48], 0.045, chrome);
    box(body, 0, 1.35, 0.48, 0.95, 0.07, 0.08, black);
    mesh(new T.SphereGeometry(0.16, 12, 8), light, body, 0, 1.22, 0.7);
    box(body, 0, 0.91, -0.84, 0.27, 0.1, 0.09, red);
    beam(body, [0.25, 0.38, -0.85], [0.25, 0.45, 0.1], 0.08, chrome);
  } else if (type === "bus" || type === "metro") {
    length = type === "metro" ? 14 : 9.6;
    width = 2.55;
    box(body, 0, 1.75, 0, width, 2.65, length, paint, 0.22);
    box(body, 0, 2.52, 0, width + 0.025, 0.88, length - 0.65, glass, 0.1);
    box(body, 0, 3.16, 0, width + 0.02, 0.21, length - 0.1, M.white, 0.07);
    box(body, 0, 1.72, 0, width + 0.04, 0.18, length, M.cream);
    for (let z = -length / 2 + 0.8; z < length / 2 - 0.2; z += 1.03) {
      box(body, 0, 2.52, z, width + 0.055, 0.96, 0.08, M.white, 0.01);
    }
    box(body, 0, 2.3, length / 2 + 0.02, 2.2, 1.1, 0.07, glass);
    box(body, 0, 1.5, length / 2 + 0.06, 1.5, 0.22, 0.06, M.dark);
    for (let s of [-1, 1])
      box(body, s * 0.9, 1.32, length / 2 + 0.08, 0.34, 0.18, 0.08, light);
    if (type === "bus") {
      let board = mesh(
        new T.PlaneGeometry(2.1, 0.4),
        signMaterial("KSRTC  •  KOCHI", {
          bg: "#172921",
          fg: "#ead58a",
          size: 74,
        }),
        body,
        0,
        2.96,
        length / 2 + 0.16,
      );
      for (let s of [-1, 1]) {
        wheel(s * 1.19, -length / 2 + 1.5, 0.47);
        wheel(s * 1.19, length / 2 - 1.6, 0.47);
      }
      box(body, 0, 0.61, 0, 2.5, 0.23, length - 0.3, black);
    }
  } else if (type === "auto") {
    length = 2.7;
    width = 1.45;
    box(body, 0, 0.7, -0.2, 1.43, 0.72, 2.2, paint, 0.13);
    box(body, 0, 1.36, -0.28, 1.38, 0.9, 2, black, 0.18);
    box(body, 0, 1.38, 0.79, 1.25, 0.75, 0.1, glass, 0.08);
    box(body, 0, 1.95, -0.15, 1.54, 0.19, 2.1, M.yellow, 0.09);
    box(body, 0, 0.85, 1.02, 1.15, 0.57, 0.45, M.yellow, 0.1);
    box(body, 0, 0.83, 1.28, 0.45, 0.26, 0.05, light);
    for (let s of [-1, 1]) wheel(s * 0.67, -0.77, 0.29);
    wheel(0, 0.99, 0.29);
  } else {
    if (type === "suv") {
      length = 4.8;
      width = 2.05;
    }
    box(body, 0, 0.73, 0, width, 0.66, length, paint, 0.17);
    box(body, 0, 0.46, 0, width + 0.02, 0.16, length - 0.1, black, 0.05);
    box(body, 0, 1.04, 1.43, width - 0.12, 0.15, 1.25, paint, 0.08);
    // Tapered cabin, sloping windscreen and rear glass.
    const v = [
      -0.86, 1.03, -1.43, 0.86, 1.03, -1.43, -0.86, 1.03, 1.23, 0.86, 1.03,
      1.23, -0.72, 1.7, -0.87, 0.72, 1.7, -0.87, -0.72, 1.7, 0.55, 0.72, 1.7,
      0.55,
    ];
    let geo = new T.BufferGeometry();
    geo.setAttribute("position", new T.Float32BufferAttribute(v, 3));
    geo.setAttribute(
      "uv",
      new T.Float32BufferAttribute(new Array(16).fill(0), 2),
    );
    geo.setIndex([
      0, 4, 1, 1, 4, 5, 2, 3, 6, 3, 7, 6, 0, 2, 4, 2, 6, 4, 1, 5, 3, 3, 5, 7, 4,
      6, 5, 5, 6, 7,
    ]);
    geo.computeVertexNormals();
    mesh(geo, glass, body, 0, 0, 0);
    box(body, 0, 1.72, -0.17, 1.49, 0.09, 1.53, paint, 0.055);
    for (let s of [-1, 1]) {
      beam(body, [s * 0.86, 1.03, 1.23], [s * 0.72, 1.72, 0.56], 0.042, paint);
      beam(
        body,
        [s * 0.86, 1.03, -1.43],
        [s * 0.72, 1.72, -0.89],
        0.055,
        paint,
      );
      beam(body, [s * 0.85, 1.05, -0.19], [s * 0.72, 1.7, -0.2], 0.038, black);
      box(body, s * 1.03, 1.13, 0.74, 0.27, 0.15, 0.3, paint, 0.05);
      for (let zz of [0.32, -0.72])
        box(
          body,
          s * (width / 2 + 0.007),
          0.99,
          zz,
          0.025,
          0.035,
          0.18,
          chrome,
          0.008,
        );
      box(
        body,
        s * 0.68,
        0.83,
        length / 2 - 0.02,
        0.46,
        0.19,
        0.08,
        light,
        0.045,
      );
      box(
        body,
        s * 0.69,
        0.84,
        -length / 2 - 0.02,
        0.43,
        0.21,
        0.06,
        red,
        0.03,
      );
      wheel(s * (width / 2 - 0.06), 1.37);
      wheel(s * (width / 2 - 0.06), -1.39);
    }
    box(body, 0, 0.62, length / 2 + 0.03, 0.97, 0.24, 0.08, black, 0.04);
    for (let i = 0; i < 4; i++)
      box(
        body,
        0,
        0.53 + i * 0.055,
        length / 2 + 0.08,
        0.91,
        0.014,
        0.025,
        chrome,
        0.004,
      );
    for (let s of [-1, 1]) {
      mesh(
        new T.PlaneGeometry(0.63, 0.15),
        signMaterial("KL 07 CA 2048", {
          bg: "#efeee7",
          fg: "#1e2524",
          size: 66,
        }),
        body,
        0,
        0.62,
        s * (length / 2 + 0.092),
        0,
        s < 0 ? Math.PI : 0,
      );
    }
  }
  combine(body);
  root.add(shadow(width * 2, length * 1.35));
  root.userData = { wheels, body, type, length, width };
  return root;
}
export function createHuman(
  shirt = "#ded4b7",
  pants = "#384547",
  skin = "#9f7053",
) {
  const root = new T.Group(),
    pelvis = new T.Group();
  root.add(pelvis);
  const cloth = mat(shirt, 0.95),
    denim = mat(pants, 0.96),
    skinMat = mat(skin, 0.85),
    hair = mat("#272825");
  const cap = (p, x, y, z, r, len, m, sx = 1, sz = 1) => {
    let ob = mesh(new T.CapsuleGeometry(r, len, 4, 8), m, p, x, y, z);
    ob.scale.set(sx, 1, sz);
    return ob;
  };
  cap(pelvis, 0, 1.15, 0, 0.25, 0.29, cloth, 1.13, 0.64);
  box(pelvis, 0, 0.87, 0, 0.46, 0.2, 0.29, denim, 0.07);
  cap(pelvis, 0, 1.54, 0, 0.09, 0.11, skinMat);
  let head = cap(pelvis, 0, 1.76, 0, 0.17, 0.12, skinMat, 0.88, 0.91);
  let hairMesh = mesh(
    new T.SphereGeometry(0.177, 12, 9, 0, Math.PI * 2, 0, Math.PI * 0.64),
    hair,
    pelvis,
    0,
    1.82,
    -0.018,
  );
  hairMesh.scale.set(0.94, 1, 0.98);
  cap(pelvis, 0, 1.76, 0.145, 0.046, 0.025, skinMat, 0.8, 1);
  for (let s of [-1, 1]) {
    mesh(
      new T.SphereGeometry(0.019, 6, 5),
      hair,
      pelvis,
      s * 0.068,
      1.8,
      0.147,
    );
    cap(pelvis, s * 0.153, 1.74, 0, 0.038, 0.065, skinMat);
  }
  const legs = [],
    arms = [];
  for (let s of [-1, 1]) {
    const leg = new T.Group();
    leg.position.set(s * 0.135, 0.83, 0);
    pelvis.add(leg);
    cap(leg, 0, -0.18, 0, 0.103, 0.26, denim, 1, 0.95);
    const knee = new T.Group();
    knee.position.y = -0.4;
    leg.add(knee);
    cap(knee, 0, -0.17, 0, 0.087, 0.25, denim);
    box(knee, 0, -0.36, 0.08, 0.2, 0.14, 0.37, mat("#ece5d2"), 0.06);
    box(knee, 0, -0.415, 0.08, 0.21, 0.04, 0.37, M.dark, 0.02);
    legs.push({ leg, knee });
    const arm = new T.Group();
    arm.position.set(s * 0.285, 1.35, 0);
    pelvis.add(arm);
    cap(arm, 0, -0.13, 0, 0.089, 0.16, cloth);
    const elbow = new T.Group();
    elbow.position.y = -0.28;
    arm.add(elbow);
    cap(elbow, 0, -0.14, 0, 0.064, 0.2, skinMat);
    cap(elbow, 0, -0.32, 0, 0.066, 0.055, skinMat);
    arms.push({ arm, elbow });
  }
  // Shirt placket and rolled-sleeve detail.
  box(pelvis, 0, 1.18, 0.166, 0.018, 0.43, 0.01, mat("#a49c86"), 0.002);
  for (let y = 1.02; y < 1.36; y += 0.11)
    mesh(new T.SphereGeometry(0.011, 5, 4), M.white, pelvis, 0.02, y, 0.177);
  for (const item of legs) {
    combine(item.knee, true);
    combine(item.leg, true);
  }
  for (const item of arms) {
    combine(item.elbow, true);
    combine(item.arm, true);
  }
  combine(pelvis, true);
  root.add(shadow(1.3, 1.1));
  root.userData = { legs, arms, pelvis };
  return root;
}
export function animateHuman(
  root,
  time,
  speed,
  jumping = false,
  riding = false,
) {
  const { legs, arms, pelvis } = root.userData;
  const moving = Math.min(speed / 3, 1),
    phase = time * (speed > 4 ? 11 : 7);
  pelvis.position.y =
    (root.userData.groundOffset || 0) +
    Math.abs(Math.sin(phase)) * moving * 0.045;
  for (let i = 0; i < 2; i++) {
    let s = i ? 1 : -1;
    legs[i].leg.rotation.x = riding
      ? -1.15
      : Math.sin(phase + (s * Math.PI) / 2) * 0.65 * moving;
    legs[i].knee.rotation.x = riding
      ? 1.1
      : Math.max(0, -Math.sin(phase + (s * Math.PI) / 2)) * 0.7 * moving;
    arms[i].arm.rotation.x = riding
      ? -1.15
      : -Math.sin(phase + (s * Math.PI) / 2) * 0.52 * moving;
    arms[i].arm.rotation.z = s * (0.07 + moving * 0.03);
    arms[i].elbow.rotation.x = -0.18 - moving * 0.4;
    if (jumping) {
      legs[i].leg.rotation.x = -0.35;
      legs[i].knee.rotation.x = 0.7;
      arms[i].arm.rotation.x = -0.5;
    }
  }
}
