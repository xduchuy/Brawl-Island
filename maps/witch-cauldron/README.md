# Witch's Cauldron | Environment-Only Map Lab

This is the **Witch Cauldron environment-only vertical slice** for Brawl-Island. It preserves the exact user-supplied procedural diorama as its reference and provides an independent scene preview, a collision/spawn contract, and a top-down inspection tool.

> **Status:** source-faithful visual/map preview, not a combat-engine integration. No fighters, attacks, health bars, new arena selection, or gameplay hazards are installed. Existing Skyreach and Moonlit Sanctum are unchanged.

## Preview

1. Serve the repository root over HTTP (e.g. `python3 -m http.server 8000`).
2. Open `http://localhost:8000/maps/witch-cauldron/preview.html`.
3. The preview loads Three.js r169 from jsDelivr, matching the provided source. **A network connection is required** for the 3D canvas. Its original 2D renderer can act as a basic fallback only if the import itself succeeds.
4. Allow the source's short scene-awakening intro to finish before accessing its camera preset controls.
5. Drag to orbit, scroll to zoom. Press `1`/`2`/`3`/`4` for the overview/cauldron/hut/moon, `G` for the potion geyser, `Space` to pause/resume, and `M` for map inspection.
6. Click **MAP LAB · INSPECT** to inspect the voxel walkable footprint, structural collision obstacles, proposed future spawn anchors, or test route connectivity.

The map is **not** flattened, rewritten into a circular platform or stripped of any original environmental animations. The original file is kept in `source-reference.html`, and `preview.html` makes only presentation and inspection enhancements on top of that source.

## Scene fidelity

Preserved from the original procedural source:
- A ~90×90 rounded-square floating island, hanging soil, moss lips and varied surface height.
- The central massive cast-iron cauldron at `(0, 2)` with emerald potion, fire, geyser and steam.
- A crooked cottage at `(-21, -17)`, twisted purple roof, broom, green windows and chimney smoke.
- Five crooked dead trees, boulders, ferns, five candles and magenta/cyan/purple glowing mushrooms.
- A black cat at `(8,8)`, looping ghosts, bat swarms, fog and a moon at `(36,38,-48)`.
- Original keyframe and ambient animation functions and procedural lighting.

The preview deliberately has **no proxy fighters** and does not alter current BrawlMatch behavior.

## Spatial contract

`map-contract.js` has no dependencies and works in Node or browsers:
- `islandSDF(x,z)`: the authored rounded-square edge SDF.
- `surfaceHeight(x,z)`: source-compatible simplified height sample, intended for map review.
- `collides(x,z,radius)`, `canWalk(x,z,radius)`: 2D navigation approximation for prospective actors.
- `spawnAnchors()`: four future anchors in source and proposed game-space coordinates.
- `toGame(point)`, `toSource(point)`: explicit proposed scale, `0.23` game units per source voxel.
- `findReachable(start,end,step)`: deterministic flood-fill path for inspecting future routes.

**Important:** map blockers are intentionally **conservative 2D approximations**, not exact voxel collider meshes. Some rocks/trees are deliberately over-approximated. `surfaceHeight` is not a verified physical raycast or combat ground solver. Do not directly reuse these approximations as final character physics without runtime validation and refinements.

The terrain SDF is organically asymmetric. There is no symmetrical circular ring-out; combat edge logic stays untouched.

## QA

Run:

```bash
node tests/witch-map.cjs
```

Expected assertions cover:
- locked source locations and original procedural components;
- solid cauldron and witch-hut footprints;
- four safe proposed spawn anchors;
- four connected lane paths;
- no player/combat code in the environment lab.

The source renderer relies on a CDN and was **not GPU/browser runtime verified** in this delivery. Follow-up runtime verification should test the original cauldron/hut silhouettes, the geyser, distinct motion loops, mouse/touch orbit, high DPI and mobile-landscape framing. If image tools are available, capture runtime images from overview, cauldron, hut, top-down and isometric fight camera.

## Future Brawl-Island integration

The **existing game bundles Three.js r128**, whereas the provided reference is an **r169 module**. Do not load both Three.js copies into the same production scene. Future integration should port geometry and animation to the existing scene/renderer, via a new disposable map module, and move radial ring bounds into separate arena rules only when combat integration is authorized.

The maps here are new and isolated. No production `src/combat`, `src/game`, `src/ui`, `index.html`, `package.json` or existing arenas are modified.

## Approval and costs

No Meshy generation or paid GLB pipeline is used: the source scene is fully procedural. The source/layout should undergo Function design approval and then proper Form/Runtime approval before its later combat integration or publication. The GitHub PR is an isolated review contribution, **not a claim that the new map is live in matches**.
