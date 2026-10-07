import { circleBoxOverlap, clamp } from "../math.js";
import { BOUNDS } from "../world/layout.js";
export class CollisionWorld {
  constructor(boxes) {
    this.cells = new Map();
    this.boxes = boxes;
    this.dynamic = [];
    for (let b of boxes)
      for (let x = Math.floor(b.minX / 32); x <= Math.floor(b.maxX / 32); x++)
        for (
          let z = Math.floor(b.minZ / 32);
          z <= Math.floor(b.maxZ / 32);
          z++
        ) {
          let k = x + "," + z;
          if (!this.cells.has(k)) this.cells.set(k, []);
          this.cells.get(k).push(b);
        }
  }
  candidates(x, z, r) {
    const a = new Set();
    for (
      let xx = Math.floor((x - r) / 32);
      xx <= Math.floor((x + r) / 32);
      xx++
    )
      for (
        let zz = Math.floor((z - r) / 32);
        zz <= Math.floor((z + r) / 32);
        zz++
      )
        for (let b of this.cells.get(xx + "," + zz) || []) a.add(b);
    return a;
  }
  blocked(x, z, y, r = 0.4, h = 1.75, ignore = null) {
    if (
      x < BOUNDS.minX + r ||
      x > BOUNDS.maxX - r ||
      z < BOUNDS.minZ + r ||
      z > BOUNDS.maxZ - r
    )
      return true;
    for (let b of this.candidates(x, z, r)) {
      if (
        y + h > b.minY + 0.15 &&
        y < b.maxY - 0.1 &&
        circleBoxOverlap(x, z, r, b)
      )
        return true;
    }
    for (let v of this.dynamic) {
      if (v === ignore) continue;
      if (Math.abs(v.position.y - y) > 2.3) continue;
      let dx = x - v.position.x,
        dz = z - v.position.z,
        c = Math.cos(-v.rotation.y),
        s = Math.sin(-v.rotation.y),
        lx = dx * c + dz * s,
        lz = -dx * s + dz * c;
      let w = v.userData.width / 2,
        d = v.userData.length / 2;
      if (circleBoxOverlap(lx, lz, r, { minX: -w, maxX: w, minZ: -d, maxZ: d }))
        return true;
    }
    return false;
  }
  move(pos, dx, dz, r = 0.4, h = 1.75, ignore = null) {
    let hit = false;
    if (!this.blocked(pos.x + dx, pos.z, pos.y, r, h, ignore)) pos.x += dx;
    else hit = true;
    if (!this.blocked(pos.x, pos.z + dz, pos.y, r, h, ignore)) pos.z += dz;
    else hit = true;
    return hit;
  }
  cameraDistance(target, desired) {
    const dx = desired.x - target.x,
      dy = desired.y - target.y,
      dz = desired.z - target.z;
    let length = Math.hypot(dx, dy, dz);
    const n = Math.ceil(length / 0.25);
    for (let i = 1; i < n; i++) {
      const t = i / n,
        x = target.x + dx * t,
        y = target.y + dy * t,
        z = target.z + dz * t;
      for (let b of this.candidates(x, z, 0.2)) {
        if (
          y > b.minY &&
          y < b.maxY &&
          x > b.minX - 0.2 &&
          x < b.maxX + 0.2 &&
          z > b.minZ - 0.2 &&
          z < b.maxZ + 0.2
        )
          return Math.max(0.6, (length * (i - 1)) / n);
      }
    }
    return length;
  }
}
