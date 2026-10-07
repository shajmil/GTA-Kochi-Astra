import test from "node:test";
import assert from "node:assert/strict";
import { integrateSpeed, angleDelta, circleBoxOverlap } from "../src/math.js";
import {
  surfaceHeight,
  flyoverHeight,
  FLYOVERS,
  roadDistance,
  LANDMARKS,
  ROADS,
} from "../src/world/layout.js";
import { CollisionWorld } from "../src/systems/collision.js";
test("acceleration is progressive and remains bounded at top speed", () => {
  let s = 0,
    first;
  for (let i = 0; i < 2400; i++) {
    s = integrateSpeed(s, true, false, false, 1 / 60);
    if (i === 0) first = s;
    assert.ok(s <= 38);
  }
  assert.ok(first < 0.2);
  assert.ok(s > 25);
});
test("braking stops and subsequently reverses without an instant switch", () => {
  let s = 20;
  s = integrateSpeed(s, false, true, false, 1 / 60);
  assert.ok(s > 19 && s < 20);
  for (let i = 0; i < 300; i++)
    s = integrateSpeed(s, false, true, false, 1 / 60);
  assert.ok(s < 0 && s >= -8);
});
test("handbrake dissipates speed faster than coasting", () => {
  let a = 20,
    b = 20;
  for (let i = 0; i < 60; i++) {
    a = integrateSpeed(a, false, false, true, 1 / 60);
    b = integrateSpeed(b, false, false, false, 1 / 60);
  }
  assert.ok(a < b * 0.3);
});
test("all flyovers have continuous ramps and ground level endpoints", () => {
  for (let f of FLYOVERS) {
    assert.equal(flyoverHeight(f, f.z), f.height);
    assert.equal(flyoverHeight(f, f.z + f.length / 2), 0);
    let y = 0;
    for (
      let z = f.z + f.length / 2 + 1;
      z > f.z - f.length / 2 - 1;
      z -= 0.25
    ) {
      let next = surfaceHeight(f.x - 4, z, y);
      assert.ok(Math.abs(next - y) < 0.1);
      y = next;
    }
    assert.equal(y, 0);
  }
});
test("surface roads can pass underneath the elevated deck", () => {
  const f = FLYOVERS[0];
  assert.equal(surfaceHeight(f.x - 4, f.z, 0), 0);
  assert.equal(surfaceHeight(f.x - 4, f.z, f.height), f.height);
});
test("collision checks height and slides parallel to walls", () => {
  let c = new CollisionWorld([
    { minX: 0, maxX: 4, minZ: 0, maxZ: 4, minY: 0, maxY: 5 },
  ]);
  assert.ok(c.blocked(-0.2, 2, 0, 0.4));
  assert.ok(!c.blocked(-0.2, 2, 8, 0.4));
  let p = { x: -0.5, z: 2, y: 0 };
  c.move(p, 1, 1, 0.4);
  assert.equal(p.x, -0.5);
  assert.equal(p.z, 3);
});
test("dynamic collision uses the rotated vehicle footprint", () => {
  let c = new CollisionWorld([]),
    v = {
      position: { x: 0, y: 0, z: 0 },
      rotation: { y: Math.PI / 2 },
      userData: { width: 2, length: 5 },
    };
  c.dynamic = [v];
  assert.ok(c.blocked(2, 0, 0, 0.3));
  assert.ok(!c.blocked(0, 2, 0, 0.3));
  assert.ok(!c.blocked(2, 0, 0, 0.3, 1.8, v));
});
test("city has the requested six landmarks, connected corridors, and plausible compressed order", () => {
  assert.equal(LANDMARKS.length, 6);
  assert.ok(
    LANDMARKS.find((l) => l.id === "lulu").z <
      LANDMARKS.find((l) => l.id === "stadium").z,
  );
  assert.ok(
    LANDMARKS.find((l) => l.id === "stadium").z <
      LANDMARKS.find((l) => l.id === "vyttila").z,
  );
  assert.ok(ROADS.length >= 10);
  assert.ok(roadDistance(40, 460) < 0);
});
test("camera direction interpolation takes the shortest arc", () => {
  assert.ok(Math.abs(angleDelta(Math.PI - 0.1, -Math.PI + 0.1) - 0.2) < 1e-8);
});
