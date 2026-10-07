import * as T from "three";
import { PlayerController } from "./player.js";
import { VehicleController } from "./vehicle.js";
import { CollisionWorld } from "./collision.js";
import { FLYOVERS, LANDMARKS } from "../world/layout.js";
export function runDiagnostics(game) {
  let lines = [],
    passed = 0,
    failed = 0;
  const check = (name, test) => {
    try {
      let result = test();
      if (!result) throw Error("assertion failed");
      lines.push("PASS  " + name);
      passed++;
    } catch (e) {
      lines.push("FAIL  " + name + ": " + e.message);
      failed++;
    }
  };
  const scene = new T.Scene(),
    world = new CollisionWorld([]),
    player = new PlayerController(scene, world),
    vehicles = new VehicleController(scene, world);
  const keys = new Set(),
    press = new Set(),
    input = {
      down: (k) => keys.has(k),
      take: (k) => {
        let v = press.has(k);
        press.delete(k);
        return v;
      },
    };
  check("Walking uses grounded movement", () => {
    player.teleport(0, 0);
    keys.add("KeyW");
    for (let i = 0; i < 60; i++) player.update(1 / 60, input, 0);
    return player.position.z < -2 && player.position.y === 0;
  });
  check("Running is faster than walking", () => {
    player.teleport(0, 0);
    keys.add("ShiftLeft");
    for (let i = 0; i < 60; i++) player.update(1 / 60, input, 0);
    return player.position.z < -5;
  });
  check("Jump rises and lands under gravity", () => {
    keys.clear();
    player.teleport(0, 0);
    press.add("Space");
    let high = 0;
    for (let i = 0; i < 100; i++) {
      player.update(1 / 60, input, 0);
      high = Math.max(high, player.position.y);
    }
    return high > 1 && player.position.y === 0 && player.grounded;
  });
  check("Solid building collision", () => {
    let c = new CollisionWorld([
      { minX: -2, maxX: 2, minZ: -2, maxZ: 0, minY: 0, maxY: 10 },
    ]);
    player.collision = c;
    player.teleport(0, 1);
    keys.add("KeyW");
    for (let i = 0; i < 120; i++) player.update(1 / 60, input, 0);
    player.collision = world;
    keys.clear();
    return player.position.z > 0.3;
  });
  check("Enter nearby car and switch control", () => {
    player.teleport(-46, 630);
    return vehicles.enter(player) && !player.active && !player.model.visible;
  });
  check("Progressive acceleration and brakes", () => {
    keys.add("KeyW");
    vehicles.update(1 / 60, input);
    let first = vehicles.speed;
    for (let i = 0; i < 120; i++) vehicles.update(1 / 60, input);
    let later = vehicles.speed;
    keys.clear();
    keys.add("KeyS");
    for (let i = 0; i < 30; i++) vehicles.update(1 / 60, input);
    keys.clear();
    return first > 0.01 && first < 1 && later > 8 && vehicles.speed < later;
  });
  check("Speed-dependent steering changes heading", () => {
    let yaw = vehicles.current.rotation.y;
    vehicles.speed = 8;
    keys.add("KeyA");
    for (let i = 0; i < 30; i++) vehicles.update(1 / 60, input);
    keys.clear();
    return Math.abs(vehicles.current.rotation.y - yaw) > 0.2;
  });
  check("Vehicle stops at solid obstacles", () => {
    vehicles.current.position.set(0, 0, 10);
    vehicles.current.rotation.y = Math.PI;
    vehicles.speed = 16;
    vehicles.collision = new CollisionWorld([
      { minX: -5, maxX: 5, minZ: -2, maxZ: 0, minY: 0, maxY: 12 },
    ]);
    for (let i = 0; i < 120; i++) vehicles.update(1 / 60, input);
    vehicles.collision = world;
    return vehicles.current.position.z > 1.5 && Math.abs(vehicles.speed) < 4;
  });
  check("Flyover ramp can be driven end to end", () => {
    let f = FLYOVERS[0];
    vehicles.current.position.set(f.x - 4, 0, f.z + f.length / 2 + 5);
    vehicles.current.rotation.y = Math.PI;
    vehicles.speed = 13;
    vehicles.steer = 0;
    keys.add("KeyW");
    let high = 0;
    for (let i = 0; i < 750; i++) {
      vehicles.update(1 / 60, input);
      high = Math.max(high, vehicles.current.position.y);
    }
    keys.clear();
    return (
      high > 6 &&
      vehicles.current.position.z < f.z - f.length / 2 &&
      vehicles.current.position.y < 0.1
    );
  });
  check("Exit stopped car to a clear position", () => {
    vehicles.speed = 0;
    return (
      vehicles.exit(player) &&
      player.active &&
      player.model.visible &&
      !vehicles.current
    );
  });
  check("Motorcycle can be entered and driven", () => {
    player.teleport(-60, 628);
    let ok = vehicles.enter(player);
    keys.add("KeyW");
    for (let i = 0; i < 60; i++) vehicles.update(1 / 60, input);
    keys.clear();
    return (
      ok && vehicles.current.userData.type === "bike" && vehicles.speed > 3
    );
  });
  check("Traffic and pedestrians advance", () => {
    const v = game.traffic.vehicles.find((v) => !v.parked),
      p = game.traffic.pedestrians.find((p) => !p.idle),
      old = v.d,
      pt = p.t;
    game.traffic.update(0.25, game.player.position);
    return v.d !== old && p.t !== pt;
  });
  check("Every landmark arrival is outside buildings", () => {
    const c = new CollisionWorld(game.world.colliders);
    const blocked = LANDMARKS.filter((l) =>
      c.blocked(l.spawn[0], l.spawn[1], 0, 0.35, 1.8),
    );
    if (blocked.length) throw Error(blocked.map((l) => l.name).join(", "));
    return true;
  });
  check("All three flyovers work with real world collisions", () => {
    const saved = vehicles.current;
    vehicles.current = vehicles.vehicles[0];
    vehicles.collision = new CollisionWorld(game.world.colliders);
    for (const f of FLYOVERS) {
      vehicles.current.position.set(f.x - 4, 0, f.z + f.length / 2 + 3);
      vehicles.current.rotation.y = Math.PI;
      vehicles.speed = 13;
      vehicles.steer = 0;
      keys.add("KeyW");
      let high = 0;
      for (let i = 0; i < 800; i++) {
        vehicles.update(1 / 60, input);
        high = Math.max(high, vehicles.current.position.y);
      }
      if (
        high < f.height - 0.2 ||
        vehicles.current.position.z > f.z - f.length / 2
      )
        throw Error(
          "Blocked flyover at " +
            f.z +
            "; position " +
            vehicles.current.position
              .toArray()
              .map((x) => x.toFixed(1))
              .join(",") +
            "; high " +
            high.toFixed(1),
        );
    }
    keys.clear();
    vehicles.current = saved;
    vehicles.collision = world;
    return true;
  });
  check(
    "Six landmarks and moving metro are present",
    () =>
      game.traffic.trains.length === 2 &&
      game.world.staticParts > 5000 &&
      game.world.metroCurve.getLength() > 1000,
  );
  const summary = `${passed} passed · ${failed} failed\n\n` + lines.join("\n");
  document.getElementById("diagnostics-result").textContent = summary;
  document.body.dataset.tests = JSON.stringify({ passed, failed, lines });
  console.info(summary);
  // Dispose geometries created only by the test fixture.
  scene.traverse((o) => {
    if (o.isMesh) o.geometry.dispose();
  });
  return { passed, failed, lines };
}
