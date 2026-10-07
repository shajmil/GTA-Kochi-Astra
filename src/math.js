export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const damp = (a, b, k, dt) => a + (b - a) * (1 - Math.exp(-k * dt));
export const angleDelta = (a, b) =>
  Math.atan2(Math.sin(b - a), Math.cos(b - a));
export const lerpAngle = (a, b, t) => a + angleDelta(a, b) * t;
export function seeded(seed = 42) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function integrateSpeed(
  speed,
  throttle,
  brake,
  handbrake,
  dt,
  max = 36,
) {
  if (throttle)
    speed +=
      (speed < -0.5 ? 15 : 8 * (1 - (Math.max(0, speed) / max) * 0.65)) * dt;
  if (brake) speed -= (speed > 0.5 ? 19 : 4.8) * dt;
  if (!throttle && !brake) speed = damp(speed, 0, handbrake ? 3.5 : 0.36, dt);
  if (handbrake) speed = damp(speed, 0, 2.5, dt);
  speed -= speed * Math.abs(speed) * 0.0016 * dt;
  return clamp(speed, -8, max);
}
export function circleBoxOverlap(x, z, r, b) {
  const nx = clamp(x, b.minX, b.maxX),
    nz = clamp(z, b.minZ, b.maxZ);
  return (x - nx) ** 2 + (z - nz) ** 2 < r * r;
}
