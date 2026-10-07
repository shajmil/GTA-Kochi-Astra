import * as T from "three";
import { createVehicle, createHuman, animateHuman } from "../world/models.js";
import { surfaceHeight } from "../world/layout.js";
import { clamp, damp, integrateSpeed } from "../math.js";
export class VehicleController {
  constructor(scene, collision) {
    this.scene = scene;
    this.collision = collision;
    this.vehicles = [];
    this.current = null;
    this.speed = 0;
    this.steer = 0;
    this.add("car", "#d1d7c6", -43, 629, Math.PI / 2);
    this.add("bike", "#a65d38", -60, 626, Math.PI / 2);
    this.add("suv", "#768d81", -159, -123, Math.PI / 2);
    this.add("car", "#e7dcc4", 76, -512, Math.PI / 2);
    this.add("car", "#31585d", 123, 220, Math.PI / 2);
  }
  add(type, color, x, z, yaw) {
    let m = createVehicle(type, color);
    m.position.set(x, 0, z);
    m.rotation.y = yaw;
    this.scene.add(m);
    this.vehicles.push(m);
    return m;
  }
  nearest(pos) {
    let result = null,
      d = 4.2;
    for (let v of this.vehicles) {
      let dd = pos.distanceTo(v.position);
      if (dd < d) {
        d = dd;
        result = v;
      }
    }
    return result;
  }
  enter(player) {
    const v = this.nearest(player.position);
    if (!v) return false;
    this.current = v;
    this.speed = 0;
    this.steer = 0;
    player.active = false;
    player.model.visible = false;
    if (v.userData.type === "bike") {
      this.rider = createHuman();
      this.rider.position.y = 0.54;
      this.rider.scale.setScalar(0.91);
      animateHuman(this.rider, 0, 0, false, true);
      v.add(this.rider);
    }
    return true;
  }
  exit(player) {
    if (!this.current || Math.abs(this.speed) > 2.5) return false;
    const v = this.current;
    for (let side of [-1, 1])
      for (let offset of [0, -3, 3]) {
        const x =
            v.position.x +
            Math.cos(v.rotation.y) * side * (v.userData.width / 2 + 1.1) +
            Math.sin(v.rotation.y) * offset,
          z =
            v.position.z -
            Math.sin(v.rotation.y) * side * (v.userData.width / 2 + 1.1) +
            Math.cos(v.rotation.y) * offset;
        if (this.collision.blocked(x, z, v.position.y, 0.38, 1.8, v)) continue;
        player.position.set(x, v.position.y, z);
        player.active = true;
        player.model.visible = true;
        player.vertical = 0;
        player.model.rotation.y = v.rotation.y;
        this.speed = 0;
        if (this.rider) {
          v.remove(this.rider);
          this.rider = null;
        }
        this.current = null;
        return true;
      }
    return false;
  }
  update(dt, input) {
    if (!this.current) return;
    const v = this.current,
      bike = v.userData.type === "bike",
      throttle = input.down("KeyW") || input.down("ArrowUp"),
      brake = input.down("KeyS") || input.down("ArrowDown"),
      handbrake = input.down("Space");
    this.speed = integrateSpeed(
      this.speed,
      throttle,
      brake,
      handbrake,
      dt,
      bike ? 29 : 38,
    );
    let steering =
      (input.down("KeyA") || input.down("ArrowLeft") ? 1 : 0) -
      (input.down("KeyD") || input.down("ArrowRight") ? 1 : 0);
    this.steer = damp(this.steer, steering, 6, dt);
    const turn =
      ((this.steer * this.speed) / (bike ? 2.7 : 3.2)) *
      (0.55 / (1 + Math.abs(this.speed) * 0.06));
    let oldYaw = v.rotation.y;
    v.rotation.y += turn * dt;
    const steps = Math.ceil((Math.abs(this.speed) * dt) / 0.35);
    let hit = false;
    for (let j = 0; j < Math.max(1, steps); j++) {
      let d = dt / Math.max(1, steps),
        nx = v.position.x + Math.sin(v.rotation.y) * this.speed * d,
        nz = v.position.z + Math.cos(v.rotation.y) * this.speed * d;
      const front = bike ? 0.55 : 1.35;
      let blocked = false;
      for (let off of [-front, 0, front]) {
        if (
          this.collision.blocked(
            nx + Math.sin(v.rotation.y) * off,
            nz + Math.cos(v.rotation.y) * off,
            v.position.y + 0.15,
            bike ? 0.32 : 0.78,
            1.3,
            v,
          )
        ) {
          blocked = true;
          break;
        }
      }
      if (blocked) {
        hit = true;
        break;
      }
      v.position.x = nx;
      v.position.z = nz;
      v.position.y = surfaceHeight(nx, nz, v.position.y);
    }
    if (hit) {
      this.speed *= -0.17;
      v.rotation.y = oldYaw;
    }
    const groundF = surfaceHeight(
        v.position.x + Math.sin(v.rotation.y) * 1.3,
        v.position.z + Math.cos(v.rotation.y) * 1.3,
        v.position.y,
      ),
      groundR = surfaceHeight(
        v.position.x - Math.sin(v.rotation.y) * 1.3,
        v.position.z - Math.cos(v.rotation.y) * 1.3,
        v.position.y,
      );
    v.userData.body.rotation.x = damp(
      v.userData.body.rotation.x,
      -Math.atan2(groundF - groundR, 2.6),
      8,
      dt,
    );
    v.userData.body.rotation.z = damp(
      v.userData.body.rotation.z,
      bike
        ? -this.steer * Math.min(Math.abs(this.speed) * 0.024, 0.32)
        : -this.steer * Math.min(Math.abs(this.speed) * 0.0018, 0.035),
      7,
      dt,
    );
    for (let w of v.userData.wheels) {
      w.children.forEach((m) => (m.rotation.x += this.speed * dt * 2.6));
      if (w.position.z > 0) w.rotation.y = this.steer * 0.32;
    }
  }
  recover(player) {
    if (this.current) {
      let v = this.current;
      this.speed = 0;
      this.steer = 0;
      v.position.set(-43, 0, 629);
      v.rotation.set(0, Math.PI / 2, 0);
      v.userData.body.rotation.set(0, 0, 0);
    } else player.teleport(-46, 630);
  }
}
