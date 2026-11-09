# Combat Reforged implementation

Baseline: c93870e. The original fixed-step engine, eleven rigs, island, pixel shader, controls, instancing and regression suites are retained.

Audit: combat and character definitions are embedded in one HTML file; attacks have frame windows but no independent cooldown/ultimate resources. Character animation mixes keyed hands with analytic IK. Contacts are angular distance checks with batched trades. Rendering already has depth outlines, a palette LUT and dither. Legacy browser tests have obsolete roster assertions and machine-specific screenshot paths. The IK solver allocates vectors each frame; transparent effects need bounded pools. No hardware FPS benchmark exists.

1. Extract editable sources and keep a deterministic, dependency-free offline HTML builder.
2. Validate Yuji/Gojo with an explicit skill registry, cooldowns, parry, charge, cancel and ultimate rules. Extend registry to remaining fighters.
3. Generate seeded RGBA effect sheets, manifest, pooled event-driven rendering and gallery.
4. Improve staging, animation timing, silhouettes, feedback and quality settings without discarding the island.
5. Add compact HUD, roster selection, training, arcade, survival and local versus flows.
6. Execute simulation and browser tests, review screenshots, document measured limits and open a development PR.

Three.js r128 is retained for compatibility with the existing offline renderer. The renderer requests WebGL2 where available. A major library migration is deferred; it is not a prerequisite to the combat/VFX changes.
