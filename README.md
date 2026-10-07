# Kochi — Afterglow

A playable miniature of the Kundannoor / Maradu → Vyttila → Kaloor → Edappally corridor, made with Three.js and Vite.

## Run

```sh
npm install
npm run dev
```

Open the local address printed by Vite (normally `http://127.0.0.1:5173`). Vite selects the next free port if necessary. Use a desktop browser with WebGL 2 and a keyboard/mouse.

```sh
npm run build
npm run preview
npm test
```

The world, sky and textures are served locally. Google Fonts is optional; the interface falls back to system fonts when offline. Audio begins only after clicking its button.

## Play

| Control | Action |
| --- | --- |
| W A S D / arrow keys | Walk, or accelerate / brake / steer |
| Shift | Run |
| Space | Jump on foot; handbrake in a vehicle |
| E | Enter a nearby supported vehicle / exit when stopped |
| Mouse | Look around after clicking the world; dragging also works |
| Escape | Release the mouse / close a panel |
| M | City map and fast travel |
| H | Controls and field notes |
| P | Hide the interface for a photo |
| B | Horn when audio is enabled |
| R | Recover at the Forum forecourt |

A drivable hatchback and motorcycle are beside the starting character. Additional cars are parked at the stadium, mall and mobility hub. Vehicles accelerate gradually, brake, reverse, steer with speed, and collide with buildings, traffic and bridge barriers. Stay left. Enter a flyover at its end ramps; the surface streets remain open underneath.

## Included

- Six landmark destinations: Forum, Kundannoor Junction, Brototype, Vyttila Mobility Hub, Kaloor Stadium and Lulu Mall.
- Three driveable flyovers, a compressed road loop, Kochi Metro viaducts and three stations, moving three-car metro trains.
- Hatchbacks, SUVs, motorcycles, auto rickshaws, KSRTC-inspired and private buses; waypoint traffic and walking pedestrians.
- Custom tropical trees, coconut palms, shops, apartments, Malayalam/English signs, water, textured roads/concrete, environment reflections, atmospheric haze and afternoon shadows.
- Smooth third-person/chase cameras, grounded movement, jumping, a minimap, destination map, discovery progress, photo mode and optional synthesized audio.

## Architecture

- `src/world/layout.js`: authored map and elevation functions.
- `src/world/landmarks.js`: custom landmark geometry.
- `src/world/world.js`: roads, metro, vegetation, secondary buildings and water.
- `src/world/builder.js`: spatial/material batching of static geometry.
- `src/world/models.js`: vehicle and animated character construction.
- `src/systems/`: input, player, vehicle, camera, collision, traffic and audio systems.
- `src/ui.js`: map, navigation, discovery and contextual HUD.
- `src/render.js`: renderer, environment lighting and shadows.

Static geometry is combined by material and spatial tile; simple solid colors use vertex-color batches. Characters and wheels are batched per animated part. Pedestrians, traffic and trains are culled by distance. A spatial hash limits collision candidates, and camera obstructions shorten the camera boom. The shadow map follows the player; rendering pixel ratio is capped, with an LQ option for slower hardware.

## Verification

`npm test` runs nine checks on acceleration, braking, reverse, handbrake, collision height, sliding, rotated vehicle footprints, flyover ramps, map structure and angle interpolation.

In a development build, open Help → **Run gameplay checks**, or load `/?checks`. The browser suite exercises the real controllers and world colliders, including all three flyovers and every fast-travel arrival. It runs in a separate scene so it does not move the playable character.

See [research and geographic choices](docs/RESEARCH.md), [asset licenses](public/assets/LICENSES.md), and [verification record](docs/VERIFICATION.md).

## Limits

This is a stylized exploration prototype, not a photorealistic city scan or a full GTA game. Exteriors and geography are deliberately compressed. Brototype's building is an approximation based on a verified address. NPCs use simple routes; they do not implement a complete traffic rule system. Characters, collision shapes and suspension are simplified. Building interiors, combat, damage and swimming are outside this prototype.
