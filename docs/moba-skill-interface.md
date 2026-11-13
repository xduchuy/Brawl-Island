# MOBA skill interface & asset reforge

Based on main `0ae8835`; branch `feature/moba-skill-ui-assets`.

Phone combat now uses a curved, mirrored thumb cluster with a 1.25× primary attack, five common illustrations, and three fighter-specific ability illustrations. All touch targets remain at least 44 CSS px. Fighter bodies are framed above the control envelope; the HUD respects the existing safe-area insets. Portrait menus, rotate-to-play, fullscreen fallback, 1v1/2v2, all modes, quality settings and keyboard/gamepad controls remain intact.

## Controls

- Tap and release a signature ability to cast. With **Tap aim assist** enabled, its initial direction faces the nearest opponent. With it disabled, the current facing is used.
- Hold to preview; drag to aim; release to commit once. Move the same finger into **× CANCEL** to cancel, or let the browser cancel the pointer. Preview/cancel costs no stamina, meter or cooldown.
- The joystick remains independently owned while aiming. Guard and heavy remain held actions; normal heavy release commits its charge. Dodge, dash and light remain immediate presses.
- Settings → Mobile controls & graphics offers MOBA Arc / Compact, left-handed layout, size, spacing, opacity, sensitivity, aim assist, targeting opacity and cancel-region padding. Existing graphics and accessibility options are preserved. Values are clamped and saved under the existing versioned localStorage key.
- Fighter Selection → **Explore abilities**, or Training → **Fighter abilities**, opens the ability codex. Three cards show the actual registered name, geometry description, damage, cooldown and costs. Selecting a card replays the real rig animation and VFX in an isolated 60 Hz training simulation; closing restores the prior pause state.

## Aim semantics and determinism

`TouchInput` retains sole pointer ownership. `SkillAim` is a delegated gesture state machine, not a second event listener system. Commands gain an optional `aim: {x,z}` world direction; existing string actions, AI and keyboard/gamepad input are unchanged. Buffered commands retain a copy of the aim, and the engine validates finite direction components before applying them at successful attack startup. Rejected casts do not change facing or resources. The existing registry remains authoritative: 11 fighters / 77 entries; `special` is still Skill 1.

Screen drag is projected onto the combat ground plane with the actual Three.js camera. The indicator is presentation only and reads hitbox radius, angular half-width, line half-width, projectile range and fixed field offset directly from the registry. Radial abilities remain self-cast. Megumi's field supports direction at its existing fixed forward offset, **not arbitrary target-point placement**. No extra attack range or damage is granted by targeting geometry. Previews show the current cast footprint; advancing lunges still move that footprint during the attack.

Cooldown seconds are simulation frames / 60. Radial masks read remaining / total cooldown. Ultimate progress reads actual meter; resource warnings and disabled/aiming/pressed states are separate classes.

## Original asset pipeline

`python3 tools/generate-skill-icons.py` uses deterministic supersampled vector illustration layers, palette lighting, brush grain and glow. No downloaded artwork, official icon tracing or paid generation API is used. The 38 master PNGs are 128×128 RGBA with transparent corners. Names and metadata are derived from the existing JS registry. The 33 signature images have distinct content hashes and motif compositions (fists, shadows, spectral creatures, nails, weapons, hands, shrines, vortices and crests).

The runtime packs masters into a 1088×680 indexed PNG atlas, with four transparent texels around every 128px cell. `IconAtlasLoader` uses the manifest's source rectangles for CSS background sampling; artwork is embedded once. The palette is optimized while retaining alpha. Master files stay full RGBA. A full contact sheet is in `docs/screenshots/moba/skill-contact-sheet.png`.

`docs/vfx-reuse-audit.json` records the baseline duplicate groups. Seven fighter-specific duplicate pairs were accidental visual reuse; those have been replaced with distinct animated silhouettes/compositions. All 33 signature sheets are now unique. Generic legacy sparks, dust/smoke, ambient particles and rings intentionally retain shared artwork where their contexts, scale, blending or timing differ. All 49 asset IDs and all 77 bindings are preserved. Each signature binding now defines startup, active, impact and recovery assets/timing. The simulation emits a recovery presentation event at active-end + 1; effects cannot modify contacts. Sprite recovery fades and decorative quality limits preserve the critical VFX reserve.

`tools/build.cjs` embeds atlas, registry metadata, VFX and new modules into one offline `index.html`. The final file is approximately 2.8 MB uncompressed; the added artwork accounts for most of the increase. Vercel still runs the dependency-free static build to `public/index.html`.

## Verification and limits

- Existing mechanics, all 77 attacks, deterministic seeded AI matches, roster coverage, touch/gamepad input and game-mode browser tests.
- `tests/moba.cjs`: 38 PNG headers / unique content, registry metadata, 33 unique signature sheets, all signature aim commands, buffered directions, malformed inputs and deterministic replay.
- `tests/skill-assets.py`: visible RGBA masters, transparent corners, atlas gutters, exact UV rectangles and quantization error.
- `tests/moba-browser.cjs`: real CDP multi-touch drag / release / cancel, movement while aiming, alternate camera yaw, all 33 signature button mappings and casts, actual resource/cooldown UI, isolated live preview, repeated preview opening, offline requests and page errors.
- `tests/mobile-layout.cjs`: 844×390, 932×430, 740×360, 667×375, 1024×768; portrait 390×844 / 430×932; target sizes, no rectangle overlap or scrolling, safe insets, pause/rotation, preference persistence, heavy/guard and renderer memory plateau.
- `tests/deployment.cjs`: isolated dependency-free Vercel build, served HTTP 200, eleven roster entries and 49 loaded VFX textures with no runtime asset requests.

Screenshots are in `docs/screenshots/moba/`; automated result files are in `tests/`. Browser tests use Chromium touch emulation and software WebGL. Physical phone performance, native orientation behavior and thermal behavior have **not** been measured.
