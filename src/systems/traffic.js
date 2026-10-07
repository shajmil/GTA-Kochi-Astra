import * as T from "three";
import { createVehicle, createHuman, animateHuman } from "../world/models.js";
import { ROADS, FLYOVERS, flyoverHeight } from "../world/layout.js";
import { seeded, damp, lerpAngle } from "../math.js";
const rng = seeded(73);
class RoadRoute {
  constructor(points) {
    this.points = points;
    this.segments = [];
    this.length = 0;
    for (let i = 1; i < points.length; i++) {
      let a = points[i - 1],
        b = points[i],
        len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      this.segments.push({ a, b, len, start: this.length });
      this.length += len;
    }
  }
  sample(d, dir, lane) {
    d = Math.max(0, Math.min(this.length - 0.001, d));
    let s =
        this.segments.find((s) => d < s.start + s.len) || this.segments.at(-1),
      t = (d - s.start) / s.len,
      dx = (s.b[0] - s.a[0]) / s.len,
      dz = (s.b[1] - s.a[1]) / s.len;
    return {
      x: s.a[0] + dx * s.len * t + dz * lane * dir,
      z: s.a[1] + dz * s.len * t - dx * lane * dir,
      yaw: Math.atan2(dx * dir, dz * dir),
    };
  }
}
export class TrafficSystem {
  constructor(scene, metroCurve) {
    this.vehicles = [];
    this.pedestrians = [];
    this.trains = [];
    this.metroCurve = metroCurve;
    this.metroLength = metroCurve.getLength();
    this.time = 0;
    for (let [ri, id] of [
      "bypass",
      "city",
      "kundannoor",
      "edappally",
    ].entries()) {
      let r = ROADS.find((r) => r.id === id),
        route = new RoadRoute(r.points),
        count = ri === 0 ? 19 : ri === 1 ? 15 : 5;
      for (let i = 0; i < count; i++) {
        let type =
          i % 7 === 0
            ? "bus"
            : i % 5 === 0
              ? "auto"
              : i % 8 === 0
                ? "bike"
                : i % 3 === 0
                  ? "suv"
                  : "car";
        let color =
          type === "bus"
            ? "#b94938"
            : type === "auto"
              ? "#292e28"
              : ["#e0dccd", "#939c93", "#497878", "#93634d", "#c6cbc3"][i % 5];
        let model = createVehicle(type, color);
        scene.add(model);
        let v = {
          model,
          route,
          ri,
          d: (route.length * (i + 0.5)) / count,
          dir: i % 2 ? 1 : -1,
          speed: 0,
          cruise: ri === 0 ? 10 + rng() * 5 : 6 + rng() * 3,
        };
        this.vehicles.push(v);
        this.place(v);
      }
    }
    for (let i = 0; i < 7; i++) {
      let m = createVehicle("bus", i % 2 ? "#508886" : "#b94837");
      m.position.set(120 + i * 13, 0, 171);
      m.rotation.y = i % 2 ? 0.15 : -0.12;
      scene.add(m);
      this.vehicles.push({ model: m, parked: true });
    }
    for (let i = 0; i < 20; i++) {
      const r = ROADS[[1, 3, 4, 5, 6, 7, 8, 9, 10][i % 9]],
        si = i % (r.points.length - 1),
        a = r.points[si],
        c = r.points[si + 1],
        len = Math.hypot(c[0] - a[0], c[1] - a[1]),
        dx = (c[0] - a[0]) / len,
        dz = (c[1] - a[1]) / len,
        off = r.width / 2 + 1.3,
        side = i % 2 ? 1 : -1;
      const start = new T.Vector3(
          a[0] + dz * off * side,
          0,
          a[1] - dx * off * side,
        ),
        end = new T.Vector3(c[0] + dz * off * side, 0, c[1] - dx * off * side),
        p = createHuman(
          ["#c9b5a1", "#aac3bd", "#dedcd0", "#955b45", "#4d7e84"][i % 5],
          i % 4 === 0 ? "#dcd3b9" : "#444b49",
          ["#956b52", "#b48769", "#7e543e"][i % 3],
        );
      p.userData.groundOffset = 0.13;
      p.scale.setScalar(0.92 + rng() * 0.1);
      scene.add(p);
      this.pedestrians.push({
        model: p,
        start,
        end,
        t: 0.15 + rng() * 0.7,
        dir: i % 2 ? 1 : -1,
        speed: 0.8 + rng() * 0.5,
        idle: 0,
      });
    }
    for (let i = 0; i < 2; i++) {
      let coaches = [];
      for (let k = 0; k < 3; k++) {
        let m = createVehicle("metro", i ? "#c2d0c9" : "#57aaa6");
        scene.add(m);
        coaches.push(m);
      }
      this.trains.push({ d: i * this.metroLength * 0.52, coaches });
    }
  }
  place(v) {
    let p = v.route.sample(v.d, v.dir, v.ri === 0 ? 6.1 : 4.8);
    v.model.position.set(p.x, 0, p.z);
    v.model.rotation.y = p.yaw;
    if (v.ri === 0)
      for (let f of FLYOVERS) {
        if (Math.abs(p.z - f.z) < f.length / 2) {
          v.model.position.x = f.x - v.dir * 5.4;
          v.model.position.y = flyoverHeight(f, p.z);
          v.model.rotation.y = v.dir > 0 ? Math.PI : 0;
        }
      }
  }
  update(dt, focus, controlled = null) {
    this.time += dt;
    for (let v of this.vehicles) {
      const m = v.model,
        dist = m.position.distanceTo(focus);
      m.visible = dist < 390;
      if (v.parked) continue;
      let target = v.cruise;
      for (let o of this.vehicles) {
        if (o === v || o.parked || o.route !== v.route || o.dir !== v.dir)
          continue;
        let gap = (o.d - v.d) * v.dir;
        if (gap > 0 && gap < 14)
          target = Math.min(target, Math.max(0, (gap - 6) * 1.3));
      }
      const ahead = new T.Vector3(
          Math.sin(m.rotation.y),
          0,
          Math.cos(m.rotation.y),
        ),
        to = focus.clone().sub(m.position),
        forward = to.dot(ahead),
        side = Math.abs(to.x * ahead.z - to.z * ahead.x);
      if (forward > 0 && forward < 18 && side < 2.4 && Math.abs(to.y) < 3)
        target = Math.min(target, Math.max(0, (forward - 5) * 1.2));
      if (
        v.ri === 1 &&
        Math.sin(this.time * 0.26) > 0.55 &&
        v.d % 170 > 147 &&
        v.d % 170 < 166
      )
        target = Math.min(target, 2);
      v.speed = damp(v.speed, target, 2, dt);
      v.d += v.speed * v.dir * dt;
      if (v.d > v.route.length) {
        v.d = v.route.length - 0.01;
        v.dir = -1;
      }
      if (v.d < 0) {
        v.d = 0.01;
        v.dir = 1;
      }
      const old = m.rotation.y;
      this.place(v);
      m.rotation.y = lerpAngle(old, m.rotation.y, 1 - Math.exp(-9 * dt));
      if (dist < 100)
        for (let w of m.userData.wheels)
          w.children.forEach((k) => (k.rotation.x += v.speed * dt * 2.5));
    }
    for (let p of this.pedestrians) {
      p.model.visible = p.model.position.distanceTo(focus) < 160;
      if (p.idle > 0) p.idle -= dt;
      else {
        p.t += (p.dir * p.speed * dt) / p.start.distanceTo(p.end);
        if (p.t > 0.93 || p.t < 0.07) {
          p.dir *= -1;
          p.t = Math.max(0.07, Math.min(0.93, p.t));
          p.idle = 1 + rng() * 3;
        }
      }
      p.model.position.lerpVectors(p.start, p.end, p.t);
      let direction = p.end.clone().sub(p.start).multiplyScalar(p.dir);
      p.model.rotation.y = lerpAngle(
        p.model.rotation.y,
        Math.atan2(direction.x, direction.z),
        1 - Math.exp(-5 * dt),
      );
      if (p.model.visible)
        animateHuman(p.model, this.time, p.idle > 0 ? 0 : 1.4);
    }
    for (let tr of this.trains) {
      tr.d = (tr.d + dt * 14) % this.metroLength;
      for (let [i, m] of tr.coaches.entries()) {
        let t =
            ((tr.d - i * 14.4 + this.metroLength) % this.metroLength) /
            this.metroLength,
          p = this.metroCurve.getPointAt(t),
          d = this.metroCurve.getTangentAt(t);
        m.position.copy(p);
        m.position.y += 0.1;
        m.position.x += d.z * 1.8;
        m.position.z -= d.x * 1.8;
        m.rotation.y = Math.atan2(d.x, d.z);
        m.visible = m.position.distanceTo(focus) < 520;
      }
    }
  }
}
