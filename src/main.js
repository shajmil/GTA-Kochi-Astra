import "./style.css";
import * as T from "three";
import { createRenderer } from "./render.js";
import { createWorld } from "./world/world.js";
import { CollisionWorld } from "./systems/collision.js";
import { InputManager } from "./systems/input.js";
import { PlayerController } from "./systems/player.js";
import { VehicleController } from "./systems/vehicle.js";
import { CameraController } from "./systems/camera.js";
import { TrafficSystem } from "./systems/traffic.js";
import { CityAudio } from "./systems/audio.js";
import { UI } from "./ui.js";
import { runDiagnostics } from "./systems/diagnostics.js";
const canvas = document.getElementById("world");
async function boot() {
  const graphics = await createRenderer(canvas);
  document.getElementById("load-status").textContent =
    "Opening the streets of Kochi…";
  await new Promise((r) => requestAnimationFrame(r));
  const game = { ...graphics, canvas, started: false, fps: 0 };
  game.world = createWorld(game.scene);
  game.collision = new CollisionWorld(game.world.colliders);
  game.input = new InputManager(canvas);
  game.player = new PlayerController(game.scene, game.collision);
  game.vehicles = new VehicleController(game.scene, game.collision);
  game.cameraControl = new CameraController(game.camera, game.collision);
  game.traffic = new TrafficSystem(game.scene, game.world.metroCurve);
  game.audio = new CityAudio();
  game.ui = new UI(game);
  game.runDiagnostics = () => runDiagnostics(game);
  // Present a wide architectural view before handing control to the player.
  game.camera.position.set(36, 27, 662);
  game.camera.lookAt(-57, 13, 578);
  document.getElementById("loading").style.opacity = 0;
  setTimeout(
    () => document.getElementById("loading").classList.add("hidden"),
    850,
  );
  document.getElementById("intro").classList.remove("hidden");
  let last = performance.now(),
    time = 0,
    frames = 0,
    fpsTime = last;
  const shadowOffset = new T.Vector3(-105, 85, 80);
  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    if (document.hidden) return;
    time += dt;
    frames++;
    if (now - fpsTime > 1000) {
      game.fps = Math.round((frames * 1000) / (now - fpsTime));
      frames = 0;
      fpsTime = now;
    }
    game.ui.update(time);
    const focus = game.vehicles.current?.position || game.player.position;
    game.collision.dynamic = [
      ...game.vehicles.vehicles,
      ...game.traffic.vehicles
        .filter((v) => v.model.position.distanceTo(focus) < 45)
        .map((v) => v.model),
    ];
    if (game.started && !game.ui.mapOpen && !game.ui.helpOpen) {
      game.player.update(dt, game.input, game.cameraControl.yaw);
      game.vehicles.update(dt, game.input);
      game.cameraControl.update(
        dt,
        game.player,
        game.vehicles,
        game.input,
        time,
      );
    } else if (!game.started) {
      game.camera.position.set(
        36 + Math.sin(time * 0.065) * 5,
        27 + Math.sin(time * 0.1) * 1.3,
        662,
      );
      game.camera.lookAt(-57, 13, 578);
    }
    game.traffic.update(dt, focus, game.vehicles.current);
    game.world.waterUniforms.uTime.value = time;
    game.audio.update(game.vehicles.speed, !!game.vehicles.current);
    game.sun.position.copy(focus).add(shadowOffset);
    game.sun.target.position.copy(focus);
    game.sun.target.updateMatrixWorld();
    game.renderer.render(game.scene, game.camera);
  }
  requestAnimationFrame(frame);
  console.info(
    "Kochi ready:",
    game.world.staticParts,
    "authored elements;",
    game.world.colliders.length,
    "colliders.",
  );
  if (new URLSearchParams(location.search).has("checks")) {
    game.ui.start();
    game.ui.toggleHelp(true);
    setTimeout(() => game.runDiagnostics(), 1200);
  }
}
boot().catch((e) => {
  console.error(e);
  document.getElementById("loading").classList.add("hidden");
  const box = document.getElementById("fatal-error");
  box.classList.remove("hidden");
  box.textContent =
    "Kochi could not start. " +
    e.message +
    " — Try reloading in a browser with WebGL 2 enabled.";
});
