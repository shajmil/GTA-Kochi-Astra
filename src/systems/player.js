import * as T from "three";
import { createHuman, animateHuman } from "../world/models.js";
import { surfaceHeight, roadDistance } from "../world/layout.js";
import { damp, lerpAngle } from "../math.js";
export class PlayerController {
  constructor(scene, collision) {
    this.model = createHuman();
    this.position = this.model.position;
    this.position.set(-46, 0, 630);
    this.model.rotation.y = Math.PI;
    this.velocity = new T.Vector3();
    this.vertical = 0;
    this.grounded = true;
    this.active = true;
    this.collision = collision;
    this.time = 0;
    scene.add(this.model);
  }
  update(dt, input, cameraYaw) {
    if (!this.active) return;
    this.time += dt;
    const f =
        (input.down("KeyW") || input.down("ArrowUp") ? 1 : 0) -
        (input.down("KeyS") || input.down("ArrowDown") ? 1 : 0),
      r =
        (input.down("KeyD") || input.down("ArrowRight") ? 1 : 0) -
        (input.down("KeyA") || input.down("ArrowLeft") ? 1 : 0);
    let dx = -Math.sin(cameraYaw) * f + Math.cos(cameraYaw) * r,
      dz = -Math.cos(cameraYaw) * f - Math.sin(cameraYaw) * r,
      len = Math.hypot(dx, dz);
    const speed = input.down("ShiftLeft") || input.down("ShiftRight") ? 7 : 3.1;
    if (len) {
      dx /= len;
      dz /= len;
      this.model.rotation.y = lerpAngle(
        this.model.rotation.y,
        Math.atan2(dx, dz),
        1 - Math.exp(-12 * dt),
      );
    }
    this.velocity.x = damp(this.velocity.x, dx * speed, 12, dt);
    this.velocity.z = damp(this.velocity.z, dz * speed, 12, dt);
    if (input.take("Space") && this.grounded) {
      this.vertical = 7.2;
      this.grounded = false;
    }
    const steps = Math.ceil(dt / 0.016);
    for (let i = 0; i < steps; i++) {
      let d = dt / steps;
      this.collision.move(
        this.position,
        this.velocity.x * d,
        this.velocity.z * d,
        0.35,
        1.85,
      );
      const ground = surfaceHeight(
        this.position.x,
        this.position.z,
        this.position.y,
      );
      this.vertical -= 20 * d;
      this.position.y += this.vertical * d;
      if (this.position.y <= ground) {
        this.position.y = ground;
        this.vertical = 0;
        this.grounded = true;
      } else this.grounded = false;
    }
    const curbDistance = roadDistance(this.position.x, this.position.z);
    this.model.userData.groundOffset =
      this.grounded && curbDistance > 0 && curbDistance < 2.4 ? 0.13 : 0;
    animateHuman(
      this.model,
      this.time,
      Math.hypot(this.velocity.x, this.velocity.z),
      !this.grounded,
    );
  }
  teleport(x, z) {
    this.position.set(x, 0, z);
    this.velocity.set(0, 0, 0);
    this.vertical = 0;
    this.grounded = true;
  }
}
