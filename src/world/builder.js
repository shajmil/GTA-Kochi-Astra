import * as T from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { M, mat, signMaterial } from "./materials.js";
const batchMat = new T.MeshStandardMaterial({
  vertexColors: true,
  roughness: 0.83,
});
const cube = new T.BoxGeometry(1, 1, 1),
  cyl = new T.CylinderGeometry(1, 1, 1, 10),
  ball = new T.SphereGeometry(1, 10, 7),
  dummy = new T.Object3D();
export class Builder {
  constructor(scene) {
    this.scene = scene;
    this.parts = new Map();
    this.colliders = [];
    this.count = 0;
  }
  add(
    geo,
    m,
    x = 0,
    y = 0,
    z = 0,
    sx = 1,
    sy = 1,
    sz = 1,
    rx = 0,
    ry = 0,
    rz = 0,
  ) {
    dummy.position.set(x, y, z);
    dummy.rotation.set(rx, ry, rz);
    dummy.scale.set(sx, sy, sz);
    dummy.updateMatrix();
    let g = geo.clone().applyMatrix4(dummy.matrix);
    if (
      !m.map &&
      !m.transparent &&
      m.side === T.FrontSide &&
      m.roughness >= 0.45 &&
      m.metalness < 0.6
    ) {
      const c = m.color,
        col = new Float32Array(g.attributes.position.count * 3);
      for (let i = 0; i < col.length; i += 3) {
        col[i] = c.r;
        col[i + 1] = c.g;
        col[i + 2] = c.b;
      }
      g.setAttribute("color", new T.BufferAttribute(col, 3));
      m = batchMat;
    }
    const tile = `${Math.floor(x / 110)},${Math.floor(z / 110)}`;
    let key = tile + ":" + m.uuid;
    if (!this.parts.has(key)) this.parts.set(key, { m, g: [], tile });
    this.parts.get(key).g.push(g);
    this.count++;
  }
  box(x, y, z, w, h, d, m = M.concrete, ry = 0) {
    this.add(cube, m, x, y, z, w, h, d, 0, ry);
  }
  cylinder(x, y, z, r, h, m = M.concrete) {
    this.add(cyl, m, x, y, z, r, h, r);
  }
  sphere(x, y, z, sx, sy, sz, m) {
    this.add(ball, m, x, y, z, sx, sy, sz);
  }
  beam(a, b, r, m = M.steel) {
    const d = new T.Vector3().subVectors(b, a),
      q = new T.Quaternion().setFromUnitVectors(
        new T.Vector3(0, 1, 0),
        d.clone().normalize(),
      );
    let g = new T.CylinderGeometry(r, r, d.length(), 6);
    g.applyQuaternion(q);
    let mid = a.clone().add(b).multiplyScalar(0.5);
    this.add(g, m, mid.x, mid.y, mid.z);
    g.dispose();
  }
  sign(text, x, y, z, w, h, opts = {}, ry = 0) {
    this.add(
      new T.PlaneGeometry(w, h),
      signMaterial(text, opts),
      x,
      y,
      z,
      1,
      1,
      1,
      0,
      ry,
    );
  }
  collider(x, z, w, d, h = 20, minY = 0) {
    this.colliders.push({
      minX: x - w / 2,
      maxX: x + w / 2,
      minZ: z - d / 2,
      maxZ: z + d / 2,
      minY,
      maxY: minY + h,
    });
  }
  finish() {
    for (const { m, g } of this.parts.values()) {
      const merged = mergeGeometries(g, false);
      if (!merged) continue;
      const mesh = new T.Mesh(merged, m);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.scene.add(mesh);
      for (const p of g) p.dispose();
    }
    this.parts.clear();
  }
}
export function line(b, x1, z1, x2, z2, width = 0.12, y = 0.045, m = M.white) {
  const dx = x2 - x1,
    dz = z2 - z1;
  b.box(
    (x1 + x2) / 2,
    y,
    (z1 + z2) / 2,
    width,
    0.024,
    Math.hypot(dx, dz),
    m,
    Math.atan2(dx, dz),
  );
}
export function palm(b, x, z, height = 12, phase = 0) {
  const bend = 1.1 + Math.sin(phase) * 0.7;
  for (let j = 0; j < 7; j++) {
    let t = j / 7,
      t2 = (j + 1) / 7;
    b.beam(
      new T.Vector3(x + bend * t * t, height * t, z),
      new T.Vector3(x + bend * t2 * t2, height * t2, z),
      0.23 - t * 0.085,
      M.bark,
    );
  }
  const cx = x + bend,
    cy = height;
  for (let j = 0; j < 8; j++) {
    const ang = (j * Math.PI) / 4 + phase,
      L = 4.6 + Math.sin(j * 5 + phase),
      verts = [],
      uvs = [],
      idx = [];
    for (let k = 0; k <= 10; k++) {
      const t = k / 10,
        r = t * L,
        y = cy + Math.sin(t * Math.PI) * 1.05 - t * t * 2.3,
        w = 0.035 * (1 - t) + 0.008;
      for (let side of [-1, 1]) {
        verts.push(
          cx + Math.sin(ang) * r + Math.cos(ang) * w * side,
          y - Math.abs(side) * 0.1,
          z + Math.cos(ang) * r - Math.sin(ang) * w * side,
        );
        uvs.push(t, side > 0 ? 1 : 0);
      }
      if (k < 10) {
        let n = k * 2;
        idx.push(n, n + 1, n + 2, n + 1, n + 3, n + 2);
      }
    }
    const g = new T.BufferGeometry();
    g.setAttribute("position", new T.Float32BufferAttribute(verts, 3));
    g.setAttribute("uv", new T.Float32BufferAttribute(uvs, 2));
    g.setIndex(idx);
    g.computeVertexNormals();
    const m = M.leafLight;
    m.side = T.DoubleSide;
    g.translate(-x, 0, -z);
    b.add(g, m, x, 0, z);
    g.dispose();
    const leaves = [],
      leafUV = [],
      leafIdx = [];
    for (let k = 1; k < 18; k++) {
      let t = k / 18,
        r = t * L,
        y = cy + Math.sin(t * Math.PI) * 1.05 - t * t * 2.3,
        spread = Math.sin(t * Math.PI) * 0.91;
      let bx = cx + Math.sin(ang) * r,
        bz = z + Math.cos(ang) * r;
      for (let s of [-1, 1]) {
        const base = leaves.length / 3;
        for (const [lateral, forward, drop] of [
          [0, 0, 0],
          [spread * 0.52, -0.07, 0.06],
          [spread, 0.68, 0.37],
          [spread * 0.52, 0.25, 0.12],
        ]) {
          leaves.push(
            bx + Math.cos(ang) * lateral * s + Math.sin(ang) * forward,
            y - drop,
            bz - Math.sin(ang) * lateral * s + Math.cos(ang) * forward,
          );
          leafUV.push(lateral, forward);
        }
        leafIdx.push(base, base + 1, base + 2, base, base + 2, base + 3);
      }
    }
    const lg = new T.BufferGeometry();
    lg.setAttribute("position", new T.Float32BufferAttribute(leaves, 3));
    lg.setAttribute("uv", new T.Float32BufferAttribute(leafUV, 2));
    lg.setIndex(leafIdx);
    lg.computeVertexNormals();
    let leafMat = j % 2 ? M.leaf : M.leafLight;
    leafMat.side = T.DoubleSide;
    lg.translate(-x, 0, -z);
    b.add(lg, leafMat, x, 0, z);
    lg.dispose();
  }
  for (let j = 0; j < 3; j++)
    b.sphere(
      cx + Math.cos(j * 2) * 0.22,
      cy - 0.25,
      z + Math.sin(j * 2) * 0.22,
      0.21,
      0.29,
      0.21,
      M.bark,
    );
}
export function tree(b, x, z, h = 7, seed = 0) {
  b.cylinder(x, h * 0.35, z, 0.22, h * 0.7, M.bark);
  const plane = new T.PlaneGeometry(1, 1);
  for (let i = 0; i < 34; i++) {
    let a = i * 2.399 + seed,
      t = (i + 0.5) / 34,
      yy = h * 0.57 + t * h * 0.47,
      rad = Math.sin(t * Math.PI) * 2.35;
    let xx = x + Math.sin(a) * rad,
      zz = z + Math.cos(a) * rad;
    b.add(plane, M.foliage, xx, yy, zz, 3.5, 3.2, 1, Math.sin(i) * 0.55, a);
  }
  for (let i = 0; i < 4; i++) {
    let a = i * 1.57 + seed;
    b.beam(
      new T.Vector3(x, h * 0.35, z),
      new T.Vector3(x + Math.sin(a) * 1.8, h * 0.72, z + Math.cos(a) * 1.8),
      0.09,
      M.bark,
    );
  }
  plane.dispose();
}
export function streetlight(b, x, z, rot = 0, height = 8) {
  b.cylinder(x, height / 2, z, 0.075, height, M.steel);
  const end = new T.Vector3(
    x + Math.sin(rot) * 2.4,
    height + 0.15,
    z + Math.cos(rot) * 2.4,
  );
  b.beam(new T.Vector3(x, height - 0.45, z), end, 0.065, M.steel);
  b.box(end.x, end.y, end.z, 0.42, 0.15, 1.1, M.dark, rot);
  b.box(
    end.x,
    end.y - 0.09,
    end.z,
    0.32,
    0.025,
    0.86,
    mat("#fff1bc", 0.4),
    rot,
  );
}
export function bench(b, x, z, rot = 0) {
  b.box(x, 0.58, z, 2, 0.13, 0.62, mat("#78614b"), rot);
  for (let dx of [-0.7, 0.7]) b.box(x + dx, 0.27, z, 0.08, 0.54, 0.5, M.dark);
  b.box(x, 0.94, z - 0.27, 2, 0.48, 0.1, mat("#78614b"), rot);
}
