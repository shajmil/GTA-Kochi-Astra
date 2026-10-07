# Verification record

Verified locally in Chrome on 30 September 2026 (Asia/Kolkata), with a 1728 × 913 browser viewport. The game is served at `http://127.0.0.1:5173/`.

## Build and automated checks

- Production build: passed (`npm run build`).
- Node tests: 9 passed, 0 failed (`npm test`).
- Browser/controller suite: 15 passed, 0 failed. Actual results are saved in [browser-checks.json](browser-checks.json).
- Final browser load: no new console errors or warnings.

The browser suite covers grounded walking, faster running, jump and landing, building collision, entering/exiting cars, gradual acceleration, braking, speed-dependent steering, obstacle collision, motorcycle control, moving traffic/pedestrians, clear landmark arrivals and traversal of all three flyovers against the actual world collision data.

## Direct browser interaction

In addition to the controller suite:

- Started the experience through the visible Explore Kochi button.
- Used the keyboard to walk, jump, enter the nearby car, and accelerate it; observed changed player/vehicle position and a nonzero speed reading.
- Dragged the view and verified that the camera yaw/pitch changed.
- Opened the city map and visited all six destinations; the discovery counter reached 6 / 6.
- Inspected Forum, Kundannoor, Brototype, Vyttila Mobility Hub, Kaloor Stadium and Lulu Mall in the rendered world.
- Observed buses, cars, pedestrians and a moving metro train.
- Enabled and muted the optional Web Audio ambience through its visible button.

## Visual fixes from testing

- Corrected inconsistent geometry indexing that initially removed parts of the cars.
- Corrected cabin face winding so exterior car glazing is visible and reflective.
- Removed a Forum plaza overlap with its frontage road.
- Moved Lulu's footprint and metro connection away from the Edappally ramp; all flyover collision checks then passed.
- Replaced indistinct tree canopies and repaired palm silhouettes at a distance.
- Added Vyttila's arched canopies after inspecting its terminal photograph.
- Improved fast-travel arrival positions so landmark facades are visible.
- Raised animated character geometry appropriately on sidewalks.
- Replaced the deprecated RGBE loader with HDRLoader.

## Performance

Observed frame rates varied with viewpoint, browser warm-up and screenshot capture. Street-view samples after warm-up ranged from approximately 54–110 FPS on the local test browser. The final Forum walking view reported 110 FPS. These are runtime samples, not a sustained cross-hardware benchmark. The initial world and shader build took roughly 8–12 seconds during testing.

The default pixel ratio is capped at 1.25. The LQ button reduces it to 1 and reduces the shadow map. Static material/spatial batching, per-part character batching, foliage tile culling, bounded shadows and distance-based visibility are enabled.

## Saved views

- [Opening panorama](screenshots/overview.png)
- [Drivable car](screenshots/driving.png)
- [Kundannoor](screenshots/kundannoor.png)
- [Brototype approximation](screenshots/brototype.png)
- [Vyttila Mobility Hub](screenshots/vyttila.png)
- [Kaloor Stadium](screenshots/stadium.png)
- [Lulu Mall](screenshots/lulu.png)

These are actual browser screenshots, not concept art. Some were captured immediately before the last foliage-culling and resolution adjustments; geometry and controls are the same.
