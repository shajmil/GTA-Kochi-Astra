import * as T from "three";
import { clamp, damp, lerpAngle } from "../math.js";
export class CameraController {
  constructor(camera, collision) {
    this.camera = camera;
    this.collision = collision;
    this.yaw = 0;
    this.pitch = 0.06;
    this.target = new T.Vector3();
    this.ready = false;
    this.lastMouse = 0;
  }
  update(dt, player, vehicles, input, time) {
    const v = vehicles.current;
    let [mx, my] = input.mouse();
    if (mx || my) {
      this.yaw -= mx * 0.0026;
      this.pitch = clamp(this.pitch + my * 0.002, -0.12, 0.9);
      this.lastMouse = time;
    }
    if (v && time - this.lastMouse > 2) {
      this.yaw = lerpAngle(
        this.yaw,
        v.rotation.y + Math.PI,
        1 - Math.exp(-2.3 * dt),
      );
      this.pitch = damp(this.pitch, 0.12, 1.4, dt);
    }
    const pos = v ? v.position : player.position,
      target = pos.clone().add(new T.Vector3(0, v ? 1.4 : 1.35, 0));
    this.target.lerp(target, this.ready ? 1 - Math.exp(-10 * dt) : 1);
    let dist = v ? 8.4 + Math.min(Math.abs(vehicles.speed) * 0.12, 3.4) : 7.2;
    let offset = new T.Vector3(
      Math.sin(this.yaw) * dist * Math.cos(this.pitch),
      Math.sin(this.pitch) * dist + 1,
      Math.cos(this.yaw) * dist * Math.cos(this.pitch),
    );
    let desired = this.target.clone().add(offset),
      allowed = this.collision.cameraDistance(this.target, desired);
    if (allowed < offset.length())
      desired = this.target
        .clone()
        .add(offset.normalize().multiplyScalar(allowed));
    desired.y = Math.max(desired.y, pos.y + 0.55);
    this.camera.position.lerp(
      desired,
      this.ready ? 1 - Math.exp(-(v ? 6 : 12) * dt) : 1,
    );
    this.camera.lookAt(this.target);
    this.camera.fov = damp(
      this.camera.fov,
      v ? 60 + Math.abs(vehicles.speed) * 0.18 : 64,
      3,
      dt,
    );
    this.camera.updateProjectionMatrix();
    this.ready = true;
  }
  snap(yaw = 0) {
    this.yaw = yaw;
    this.pitch = 0.06;
    this.ready = false;
  }
}
