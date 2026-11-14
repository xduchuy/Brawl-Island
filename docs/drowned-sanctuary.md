# The Drowned Sanctuary — playable arena and environment preview

Choose **ARENA → Drowned Sanctuary · Flooded ruins**, select 1v1 or 2v2 and start a match. The arena uses its own grounded spawns, connected courtyard boundary, solid obstacles and AI routes. The existing game's WebGL canvas, fighters, skills, controls, scoring and frame loop are reused. **Arena Preview · Drowned Sanctuary** remains available for inspection without a fight. Witch's Cauldron is separate and untouched.

The playable integration builds on merged PR #5, main `3aa053d0202ebafba1f3b76b0cca335fa10a4a70`. The original environment port was based on `2bbcd46195d05edf31cb9d4e3b22fa5ebd356855`. The supplied `The_Drowned_Sanctuary_Expanded.html` is preserved byte-for-byte in [the reference folder](../reference/drowned-sanctuary/source.html), SHA-256 `d693880526c8025a605393235936cf128f9506df9e7d33c2930022873021690e`. Only that isolated reference page uses r160/CDN modules. The generated production `index.html` contains the existing bundled r128 and no additional runtime downloads.

## Source audit and port

| Source builder/system | Implementation |
| --- | --- |
| `VoxelBatchBuilder`, seeded PRNG, hash/noise/fbm, per-vertex erosion and stone coloring | Preserved in `geometry.js`; static meshes merged by material |
| `buildClusteredPier`, `buildPointedArchSpan`, `buildStoneStaircase` | Preserved solid geometry and real openings; box and stair metadata recorded |
| `buildRuinedBellTower` | Three original towers at X/Z (-19.2,-17.2), (20.2,-19.3), (31.4,12.6); heights 39, 34.8, 27.8 |
| `evalStatueSDF`, `buildCentralStatueAndPedestal` | Original .165-unit voxel sampling, exposed faces and elaborate robes retained |
| `addRootBranch`, `buildAllRootSystems` | Original tapered spline roots and distribution retained |
| `buildSanctuaryArchitecture` | Original arcades, balcony, basin at (0,3.2), radius 13.8, causeway, rubble and submerged stairs |
| Water shader | Continuous layered displacement/highlights; transparent water, approximate tower-darkening reflections, local pillar ripples |
| Reeds/foliage | Original instancing; reeds now bend in the vertex shader with positional phase offsets |
| Motes | Original animated point shader, shared environment time |
| Fog | Drifting source layers with softened UV edges and subtle opacity variation |
| Birds | Source wings and paths, varied per-bird speed/flap frequency |
| Relics, rings and halo | Continuous float/rotation/pulses, three click targets and visual awakening |
| Pilgrim and bells | Bells remain static; source pilgrim builder retained but not instantiated; no new audio |
| Original 12-second cinematic | Production timer/reset removed; bounded host update plus continuous elapsed time |

r160 color-management defaults differ from r128: source palette, material and light colors are explicitly converted from sRGB to linear, and the preview temporarily enables physically correct lighting, ACES tone mapping and sRGB output. Early overexposure was corrected by comparing source/integrated images. These renderer settings are restored when leaving the preview.

Major mesh bounds and tower dimensions are recorded in `tests/drowned-results.json`. The original Arch camera sat inside foreground masonry: the integrated Arch camera is pulled back to inspect the actual arcade. Hero and Wide preserve the original compositions; Roots has a separate unobstructed inspection position.

## Files and lifecycle

- `src/maps/drowned-sanctuary/geometry.js`: source procedural builders.
- `ambience.js`: materials, lighting, shaders, instanced vegetation, particles and relic builders.
- `index.js`: `createDrownedSanctuary({THREE, scene, renderer, quality, seed})`, construction, update, moods, tiers and disposal. The map owns a scene/root rendered by the **host** renderer; it does not mutate the existing combat scene.
- `combat.js`: deterministic movement/attack adapter, AI route steering, grounded spawns, and rendering of the existing fighters/VFX in the map scene. Dynamic game objects are restored to their original parents after rendering; leaving the arena disposes only map resources.
- `navigation.js`: upward-triangle rasterization, spatially indexed capsule clearance, graph connectivity and spawn selection.
- `preview.js` / `preview.css`: registered environment, small toolbar entry, inspection controls and host renderer bridge.
- `tools/build.cjs`: inserts the procedural sources into the factory and bundles them into the offline HTML.
- `src/game/world.js`: routes the existing frame loop to preview while active; gates game keyboard/pointer handling; exposes preview to browser verification.

Map API: `id`, `root`, `scene`, `metadata`, `walkableSurfaces`, `blockers`, `waterRegions`, `spawnPoints`, `sampleGround(x,z)`, `isClear(x,y,z)`, `navigation`, `cameraPresets`, `update(dt,elapsed)`, `setMood`, `setQuality`, `setReducedMotion`, `activateRelic`, `dispose`.

Resources are instance-owned. Disposal frees geometries, materials, instance buffers and shadow targets once, then clears the scene. Quality replacement disposes the previous water geometry/shadow target. A cancelled opening clears its queued initialization. UI listeners are installed once and gated by active preview state; there are no per-map listeners, animation loops, external textures or iframe.

## Inspection controls

Hero, Arch, Wide, Top, Gameplay, Statue, Roots, Courtyard, Orbit and optional Cinematic views; drag to orbit, wheel to zoom. Camera changes interpolate smoothly. Dusk/Moonlight/Dawn interpolate palettes and lighting. Pause/Resume freezes ambient motion; reduced-motion preference also disables cinematic movement. H hides/shows UI; Escape or **Back to game** exits. **Photo** downloads the rendered canvas where browser support permits. Click each of the three gems to awaken the halo. These interactions never enter the combat event/scoring system.

Quality affects resolution, water subdivisions, shadow map, instance counts, particles and fog, while retaining all architecture/statue/root geometry:

| Tier | Render scale | Water grid | Reeds / motes | Fog layers | Sun shadow |
| --- | --- | --- | --- | --- | --- |
| Low | .65 | 48² | 300 / 250 | 3 | Off |
| Medium | 1 | 90² | 650 / 600 | 6 | 1024² |
| High | 1.25 | 160² | 1100 / 1050 | 12 | 2048² |

Auto starts at Medium and drops to Low after five seconds of sustained frame times worse than 25 FPS. It does not repeatedly oscillate or automatically upgrade.

## Navigation preparation and explicit limits

Navigation comes from the **actual generated triangles**, not a circular boundary. Upward faces are rasterized at .75-unit resolution; headroom, rotated source boxes and a triangle/capsule test filter candidates. Adjacency is restricted to .4-unit steps and quarter-edge clearance samples. The .42 clearance radius conservatively covers the .3-radius combat agent between samples; height is approximately 1.8 units. Triangle blockers include roots, architecture, terrain, pedestal and statue. Water/foliage/relic effects are not blockers.

A low, submerged paving layer fills source terrain seams within the courtyard (X -15…15, Z -13.5…16.5, surface Y -.73), excluding the central pedestal footprint. Major architecture remains in place. This is the only added structural surface. The largest clear connected ground region provides four deterministic anchors, two on each opposing side, with both ground sampling and capsule clearance verified. These are the active combat spawns, ordered by alternating team and teammate, and reused on round reset and Training revival.

The green overlay shows that connected region. Red points show other disconnected ground samples, **excluded from navigation**. Ruin debris, broken stairs, the outer causeway and outlying terrain are not assumed traversable just because visible. Unmapped water is non-traversable in the metadata. The left balcony at Y≈8.45 has no continuous stair connection in the source and is explicitly inspection-only. Stair parameters and platform bounds are exposed; only portions joining the validated ground graph may be treated as accessible.

The combat controller uses this conservative graph and continuous movement inside its cells. Each movement is swept in at most .12-unit increments, with .3-radius triangle clearance and axis sliding. Walking, dodge/dash, lunge, knockback and fighter separation all pass through it. Unmapped water and disconnected ruins act as solid movement limits; this arena uses health/time victories rather than Skyreach ring-outs. BrawlMatch accepts an optional arena adapter; Skyreach/Sanctum retain their prior behavior.

AI follows graph routes around the monument and pillars. A conservative body-height clearance trace blocks attacks and projectiles through stone. These traces are not a per-limb 3D hitbox simulation. The accessible connected courtyard is the combat space; elevated balconies and excluded ruins remain scenery. Arbitrary new fighter sizes require clearance revalidation.

## Reproducing validation

```sh
npm run build
npm test
node tests/drowned-navigation.cjs
node tests/sanctuary-combat.cjs
node tests/sanctuary-playable-browser.cjs
node tests/drowned-browser.cjs
node tests/drowned-lifecycle.cjs
node tests/deployment.cjs
```

Playwright uses `/usr/bin/chromium` (override `CHROMIUM_PATH`) and SwiftShader. The reference screenshot test caches the three r160 modules in the OS temporary directory using `curl` on first run. `SKIP_REFERENCE=1` runs only the integrated page without that download. This is a test dependency, not a production network dependency. Run browser suites sequentially for useful software-renderer timing.

Baseline combat tests passed before edits. The new navigation fixtures exercise solid wall rejection, a real opening, a wall separating components, low ceilings, deep-water exclusion and valid spawns. Browser validation covers the actual toolbar entry, eight camera views, all moods, top-down debug image and return to game. Lifecycle validation covers cancelled initialization, two complete builds/disposals, deterministic anchors, same GPU-resource count after each exit, relic awakening, time beyond 12 and 125 seconds, reduced motion, pause, quality changes, mobile layout, and unchanged serialized match state.

See [screenshots](screenshots/drowned-sanctuary) and machine-readable `tests/drowned-*-results.json`. The screenshots were visually reviewed for massing, statue silhouette, arches, roots, courtyard visibility and lighting. Source scattered/floating ruin fragments and blocky moss remain intentional fidelity details. The water reflection is a shader approximation, not a planar reflection pass. No physical-phone, laptop-GPU or desktop-GPU performance is asserted; the 60/30 FPS hardware targets remain unverified.

## Measured software-renderer results (13 November 2026)

These are short, 15-frame samples after five warm-up frames on the managed Linux Chromium/SwiftShader environment. They establish reproducible render workload and a software-renderer baseline; they do **not** meet or certify the requested desktop/mobile hardware frame-rate targets.

| Page / preset | Viewport | Mean frame time | FPS | Draw calls | Triangles |
| --- | --- | ---: | ---: | ---: | ---: |
| Original r160 reference / Hero | 1000×700 | 1748.82 ms | 0.57 | 59 | 218,548 |
| Integrated r128 / Medium / Hero | 1000×700 | 1121.07 ms | 0.89 | 40 | 176,398 |
| Integrated r128 / Low / touch emulation, first open | 667×375 | 233.32 ms | 4.29 | 37 | 154,462 |
| Integrated r128 / Low / touch emulation, second open | 667×375 | 226.65 ms | 4.41 | 39 | 154,486 |

Procedural construction including navigation took 2.95 seconds for the Medium run and 2.29/1.99 seconds for the two Low opens. This excludes first shader compilation. Medium reported 47 geometries / 19 textures; Low 47 / 18. These renderer resource counts include the retained game resources, unlike the isolated reference. After each close and game render the counts returned to **21 geometries / 20 textures**. Byte-level GPU/heap memory was not measured.

The final offline deployment check produced `public/index.html` matching the offline build, HTTP 200, all 11 existing fighters, 49 existing textures, zero runtime asset requests and zero page errors. Photo download and the transparent debug overlay were additionally checked after the final overlay adjustment. No hardware 60 FPS / 30 FPS claim is made; physical-device profiling remains a review gate before production promotion.

## Playable combat validation

The real sanctuary geometry is used in headless 1v1 and 2v2 simulations. With fixed seeds, both matches reach a winner before the time limit (13/27 landed hits, 1240/1410 simulation ticks). Every sampled living fighter remains on connected ground with capsule clearance. Additional checks cover monument occlusion, large knockback and grounded Training revival.

The playable browser test selects the arena through the UI, starts matches with existing fighters, renders combat on desktop and mobile landscape, and switches back to Skyreach while checking map disposal and browser errors. Combat images are `combat-desktop.png`, `combat-mobile.png` and `combat-teams.png`. Combat camera framing uses the courtyard coordinates and a higher angle; contact shadows, skill indicators and VFX follow ground elevation. Desktop uses up to Medium environment density; mobile uses Low with .7 render scale. Earlier performance measurements above describe inspection mode, not measured combat FPS. Hardware profiling remains outstanding.
