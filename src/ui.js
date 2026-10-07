import * as T from "three";
import { LANDMARKS, ROADS, METRO_POINTS } from "./world/layout.js";
const $ = (id) => document.getElementById(id);
export class UI {
  constructor(game) {
    this.game = game;
    this.mapOpen = false;
    this.helpOpen = false;
    this.photo = false;
    this.discovered = new Set();
    this.lastArea = "";
    this.last = 0;
    this.toastUntil = 0;
    this.started = false;
    this.mini = $("minimap").getContext("2d");
    this.big = $("big-map").getContext("2d");
    $("destinations").innerHTML = LANDMARKS.map(
      (l, i) =>
        `<button class="destination" data-destination="${l.id}" aria-label="Visit ${l.name}"><span class="number">0${i + 1}</span><span><strong>${l.name}</strong><small>${l.area}</small></span><span class="arrow">↗</span></button>`,
    ).join("");
    $("start").onclick = () => this.start();
    $("map-button").onclick = $("mini-expand").onclick = () => this.toggleMap();
    $("close-map").onclick = () => this.toggleMap(false);
    $("close-help").onclick = () => this.toggleHelp(false);
    $("credits-button").onclick = () => {
      this.toggleMap(false);
      this.toggleHelp(true);
    };
    document.querySelector(".wordmark").onclick = (e) => {
      e.preventDefault();
      this.toggleHelp();
    };
    for (let b of document.querySelectorAll(".destination"))
      b.onclick = () => this.travel(b.dataset.destination);
    $("audio").onclick = async () => {
      let on = await game.audio.toggle();
      $("audio").setAttribute(
        "aria-label",
        on ? "Mute ambient sound" : "Enable ambient sound",
      );
      $("audio").querySelector("i").style.display = on ? "none" : "block";
    };
    this.high = true;
    $("quality").onclick = () => {
      this.high = !this.high;
      game.renderer.setPixelRatio(
        Math.min(devicePixelRatio, this.high ? 1.25 : 1),
      );
      game.sun.shadow.mapSize.setScalar(this.high ? 2048 : 1024);
      game.sun.shadow.map?.dispose();
      game.sun.shadow.map = null;
      $("quality").textContent = this.high ? "HQ" : "LQ";
      $("quality").title = this.high ? "High quality" : "Performance mode";
    };
    $("recover").onclick = () => {
      game.vehicles.recover(game.player);
      game.cameraControl.snap();
      this.toggleHelp(false);
    };
    $("diagnostics").onclick = () => game.runDiagnostics();
    if (!import.meta.env.DEV) $("diagnostics-wrap").remove();
  }
  start() {
    this.started = true;
    this.game.started = true;
    $("intro").classList.add("hidden");
    $("hud").classList.remove("hidden");
    this.game.input.enabled = true;
    this.game.input.clear();
    this.game.cameraControl.snap(0);
    this.game.canvas.focus();
    document.body.dataset.started = "true";
  }
  syncInput() {
    this.game.input.enabled = this.started && !this.mapOpen && !this.helpOpen;
    this.game.input.clear();
    if (this.mapOpen || this.helpOpen) document.exitPointerLock?.();
  }
  toggleMap(force) {
    this.mapOpen = force ?? !this.mapOpen;
    if (this.mapOpen) {
      this.helpOpen = false;
      $("help-panel").classList.add("hidden");
      this.drawMap(this.big, true);
    }
    $("map-panel").classList.toggle("hidden", !this.mapOpen);
    this.syncInput();
  }
  toggleHelp(force) {
    this.helpOpen = force ?? !this.helpOpen;
    if (this.helpOpen) {
      this.mapOpen = false;
      $("map-panel").classList.add("hidden");
    }
    $("help-panel").classList.toggle("hidden", !this.helpOpen);
    this.syncInput();
  }
  travel(id) {
    const l = LANDMARKS.find((l) => l.id === id),
      g = this.game;
    if (!this.started) this.start();
    if (g.vehicles.current) {
      g.vehicles.speed = 0;
      g.vehicles.exit(g.player);
      if (g.vehicles.current) {
        if (g.vehicles.rider) {
          g.vehicles.current.remove(g.vehicles.rider);
          g.vehicles.rider = null;
        }
        g.vehicles.current = null;
        g.player.active = true;
        g.player.model.visible = true;
      }
    }
    g.player.teleport(...l.spawn);
    g.player.model.rotation.y = (l.yaw || 0) + Math.PI;
    g.cameraControl.snap(l.yaw || 0);
    this.toggleMap(false);
    g.canvas.focus();
    this.notify(l.name, l.description);
  }
  notify(title, sub) {
    $("toast-title").textContent = title;
    $("toast-sub").textContent = sub;
    $("toast").classList.remove("hidden");
    this.toastUntil = performance.now() + 4800;
  }
  update(time) {
    const g = this.game,
      input = g.input,
      v = g.vehicles.current;
    if (input.take("KeyM")) this.toggleMap();
    if (input.take("KeyH")) this.toggleHelp();
    if (input.take("Escape")) {
      if (this.mapOpen) this.toggleMap(false);
      if (this.helpOpen) this.toggleHelp(false);
    }
    if (input.take("KeyP") && this.started) {
      this.photo = !this.photo;
      document.body.classList.toggle("photo", this.photo);
      $("photo-hint").classList.toggle("hidden", !this.photo);
    }
    if (input.take("KeyR") && input.enabled) {
      g.vehicles.recover(g.player);
      g.cameraControl.snap();
    }
    if (input.take("KeyB") && input.enabled) g.audio.horn();
    if (input.take("KeyE") && input.enabled) {
      if (g.vehicles.current) {
        if (Math.abs(g.vehicles.speed) > 2.5)
          this.notify("Easy now.", "Come to a stop to step out.");
        else if (!g.vehicles.exit(g.player))
          this.notify(
            "A little more room.",
            "Move to an open area to step out.",
          );
      } else if (g.vehicles.enter(g.player)) {
        g.cameraControl.lastMouse = -100;
        g.cameraControl.snap(g.vehicles.current.rotation.y + Math.PI);
      }
    }
    if (!this.started) return;
    const focus = g.vehicles.current?.position || g.player.position,
      closest = [...LANDMARKS].sort(
        (a, b) =>
          Math.hypot(a.x - focus.x, a.z - focus.z) -
          Math.hypot(b.x - focus.x, b.z - focus.z),
      )[0];
    if (closest.area !== this.lastArea) {
      this.lastArea = closest.area;
      $("location-name").textContent = closest.area;
      $("location-ml").textContent = closest.mal;
    }
    $("street-name").textContent =
      closest.id === "forum"
        ? "Forum frontage road"
        : closest.id === "kundannoor"
          ? "NH 66 · Kundannoor Junction"
          : closest.name;
    for (let l of LANDMARKS) {
      if (
        Math.hypot(focus.x - l.x, focus.z - l.z) <
          (l.id === "stadium" ? 160 : l.id === "lulu" ? 200 : 83) &&
        !this.discovered.has(l.id)
      ) {
        this.discovered.add(l.id);
        this.notify(
          l.name,
          l.area +
            "  /  " +
            String(this.discovered.size).padStart(2, "0") +
            " OF 06 PLACES DISCOVERED",
        );
        $("discovered-count").textContent = this.discovered.size + " / 6";
        $("journey-progress").style.setProperty(
          "--progress",
          (this.discovered.size / 6) * 100 + "%",
        );
        $("journey-text").textContent =
          this.discovered.size === 6
            ? "You know your way around."
            : "Explore the familiar corners";
      }
    }
    if (performance.now() > this.toastUntil) $("toast").classList.add("hidden");
    const driving = !!g.vehicles.current,
      near = !driving && g.vehicles.nearest(g.player.position);
    $("interaction").classList.toggle("hidden", !near && !driving);
    $("interaction-text").textContent = driving
      ? Math.abs(g.vehicles.speed) < 2.5
        ? "Step out"
        : "Slow down to exit"
      : near?.userData.type === "bike"
        ? "Ride motorcycle"
        : "Drive hatchback";
    $("speedometer").classList.toggle("hidden", !driving);
    if (driving) {
      $("speed").textContent = String(
        Math.round(Math.abs(g.vehicles.speed) * 3.6),
      ).padStart(3, "0");
      $("gear").textContent =
        g.vehicles.speed < -0.3
          ? "R"
          : g.vehicles.speed < 0.3
            ? "N"
            : String(Math.min(5, 1 + Math.floor(g.vehicles.speed / 8)));
      $("speed-bar").style.width =
        Math.min(100, (Math.abs(g.vehicles.speed) / 38) * 100) + "%";
      $("vehicle-name").textContent =
        g.vehicles.current.userData.type === "bike"
          ? "Malabar roadster"
          : "KL 07 · City hatchback";
    }
    if (this.lastDriving !== driving) {
      this.lastDriving = driving;
      $("controls").innerHTML = driving
        ? "<span><kbd>W / S</kbd> Accelerate / brake</span><span><kbd>A D</kbd> Steer</span><span><kbd>SPACE</kbd> Handbrake</span>"
        : "<span><kbd>W A S D</kbd> Walk</span><span><kbd>SHIFT</kbd> Run</span><span><kbd>SPACE</kbd> Jump</span>";
    }
    $("cursor-hint").style.opacity =
      document.pointerLockElement || time > 35 ? "0" : "1";
    if (time - this.last > 0.12) {
      this.last = time;
      this.drawMap(this.mini, false);
      if (this.mapOpen) this.drawMap(this.big, true);
      document.body.dataset.telemetry = JSON.stringify({
        mode: driving ? "driving" : "walking",
        position: [focus.x, focus.y, focus.z].map((x) => +x.toFixed(2)),
        speed: +g.vehicles.speed.toFixed(2),
        fps: g.fps,
        calls: g.renderer.info.render.calls,
        triangles: g.renderer.info.render.triangles,
        traffic: g.traffic.vehicles.filter((v) => v.model.visible).length,
        pedestrians: g.traffic.pedestrians.filter((v) => v.model.visible)
          .length,
        places: this.discovered.size,
        cameraYaw: +g.cameraControl.yaw.toFixed(3),
        cameraPitch: +g.cameraControl.pitch.toFixed(3),
      });
    }
    const label = $("landmark-label"),
      d = Math.hypot(focus.x - closest.x, focus.z - closest.z);
    if (d < 155 && d > 45 && !this.photo) {
      let p = new T.Vector3(closest.x, 28, closest.z).project(g.camera);
      if (p.z < 1 && p.x > -0.7 && p.x < 0.7 && p.y > -0.6 && p.y < 0.6) {
        label.classList.remove("hidden");
        label.style.left = (p.x * 0.5 + 0.5) * innerWidth + "px";
        label.style.top = (-p.y * 0.5 + 0.5) * innerHeight + "px";
        label.innerHTML =
          closest.name.toUpperCase() + "<small>" + Math.round(d) + " m</small>";
      } else label.classList.add("hidden");
    } else label.classList.add("hidden");
  }
  drawMap(ctx, full) {
    const g = this.game,
      pos = g.vehicles.current?.position || g.player.position,
      w = ctx.canvas.width,
      h = ctx.canvas.height,
      cx = full ? -40 : pos.x,
      cz = full ? 0 : pos.z,
      scale = full ? 0.58 : 1.9;
    const xy = (x, z) => [(x - cx) * scale + w / 2, (z - cz) * scale + h / 2];
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = full ? "#192f29" : "#1c382e";
    ctx.fillRect(0, 0, w, h);
    let wx = xy(285, 0)[0];
    ctx.fillStyle = "#305d58";
    ctx.fillRect(wx, 0, w - wx, h);
    ctx.strokeStyle = "#54786a";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(wx, 0);
    ctx.lineTo(wx, h);
    ctx.stroke();
    ctx.fillStyle = "#3c5041";
    for (let b of g.world.colliders) {
      if (b.maxY < 4 || b.maxX - b.minX < 5 || b.maxZ - b.minZ < 5) continue;
      let a = xy(b.minX, b.minZ),
        bw = (b.maxX - b.minX) * scale,
        bh = (b.maxZ - b.minZ) * scale;
      if (a[0] + bw < 0 || a[0] > w || a[1] + bh < 0 || a[1] > h) continue;
      ctx.fillRect(a[0], a[1], bw, bh);
    }
    function path(points, color, width) {
      ctx.beginPath();
      points.forEach((p, i) => {
        let a = xy(p[0], p[1]);
        i ? ctx.lineTo(...a) : ctx.moveTo(...a);
      });
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.stroke();
    }
    for (let r of ROADS) {
      path(r.points, "#6d7d69", r.width * scale);
      path(r.points, "#4b6150", Math.max(1, r.width * scale - 2));
    }
    ctx.setLineDash(full ? [4, 5] : [6, 7]);
    path(METRO_POINTS, "#76ada5", full ? 2 : 3);
    ctx.setLineDash([]);
    // Stadium oval makes the district legible at a glance.
    let st = xy(-134, -236);
    ctx.beginPath();
    ctx.ellipse(st[0], st[1], 73 * scale, 60 * scale, 0, 0, Math.PI * 2);
    ctx.strokeStyle = "#8daca0";
    ctx.lineWidth = 9 * scale;
    ctx.stroke();
    for (let [i, l] of LANDMARKS.entries()) {
      let p = xy(l.x, l.z);
      if (p[0] < 0 || p[0] > w || p[1] < 0 || p[1] > h) continue;
      ctx.beginPath();
      ctx.arc(p[0], p[1], full ? 7 : 5, 0, Math.PI * 2);
      ctx.fillStyle = this.discovered.has(l.id) ? "#dcca8b" : "#b2c2a4";
      ctx.fill();
      if (full) {
        ctx.font = "500 14px sans-serif";
        ctx.fillStyle = "#dbe1c9";
        ctx.textAlign = l.id === "stadium" ? "right" : "left";
        ctx.fillText(
          l.id === "stadium"
            ? "KALOOR STADIUM"
            : l.id === "vyttila"
              ? "VYTTILA HUB"
              : l.name.toUpperCase(),
          p[0] + (l.id === "stadium" ? -15 : 15),
          p[1] - 4,
        );
        ctx.font = "10px sans-serif";
        ctx.fillStyle = "#8fa994";
        ctx.fillText(
          "0" + (i + 1),
          p[0] + (l.id === "stadium" ? -15 : 15),
          p[1] + 12,
        );
      }
    }
    const p = xy(pos.x, pos.z),
      yaw = g.vehicles.current?.rotation.y ?? g.player.model.rotation.y;
    ctx.save();
    ctx.translate(p[0], p[1]);
    ctx.rotate(-yaw);
    ctx.shadowColor = "#ead68b";
    ctx.shadowBlur = 13;
    ctx.fillStyle = "#f6e1a0";
    ctx.beginPath();
    ctx.moveTo(0, 9);
    ctx.lineTo(-6, -7);
    ctx.lineTo(0, -4);
    ctx.lineTo(6, -7);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}
