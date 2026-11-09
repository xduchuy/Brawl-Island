# Isle Brawl

Open `index.html` directly in a modern browser. No server, build, key, installation, or network connection is needed. The playable deliverable is this one HTML file (approximately 749 KiB); everything else in this repository is development documentation or verification.

The user approved procedural fighters in place of the missing Tripo GLBs. Grinsk and Bonewarden are constructed from reference-inspired articulated geometry, with 18-bone hierarchies, analytic arm/leg IK, planted stance feet, rigid weapons, keyed attack arcs, trails, and team-coloured cloth. This version does not contain the original textured Tripo meshes or claim to have performed geodesic skinning/decimation on absent assets.

Three.js r128 and both fonts are embedded. This differs from the originally requested CDN loading, because cdnjs was blocked in the development environment; it also makes the delivered game usable offline. The additional library accounts for most of the file size.

## Eleven-fighter roster

The five bottom-row characters from the latest reference have been added: Ryomen Sukuna, Kenjaku, Suguru Geto, Mahito and Toji Fushiguro. All eleven fighters are available in each team slot. The opening duel is Sukuna versus Toji, with Kenjaku and Geto as the default second teammates; Mahito is available from every fighter selector.

- Sukuna: pink spiked hair, facial/body markings, Cleave and Dismantle.
- Kenjaku: forehead stitches, long black hair/topknot, gold stole, Gravity and Cursed Swarm.
- Geto: long black hair/topknot without the forehead stitches, gold stole, rigid staff, Staff Sweep and Uzumaki.
- Mahito: pale stitched skin, long blue-grey hair, patchwork clothing, Transfiguration and Soul Touch.
- Toji: short dark hair, mouth scar, black shirt, pale trousers, shoulder curse and rigid blade; Inverted Spear and Heavenly Rush.

Techniques use the same stamina, active windows, hit detection, blocking and ring-out rules as the existing cast. Visual cursed spirits and transfigured strikes belong to the attack animation, rather than independent AI-controlled characters. The new characters have inline SVG portraits, guide descriptions and the shared eighteen-bone IK rig. Their numbers are game balance choices, not claims about canonical power levels.

`tests/five-fighters.cjs` runs 500 seeded AI matches against the roster and checks each new special can land. `tests/five-fighter-browser.cjs` covers all eleven model factories, portraits, IK, new effects, a complete mixed 2v2 match and the 390 px layout. Earlier sections and results document earlier roster versions.

## Nobara and Megumi

The roster now contains six fighters. Nobara Kugisaki and Megumi Fushiguro are selectable in every team slot, alongside the original four. The opening match is Nobara versus Megumi; the second slots select Yuji and Gojo.

Nobara has a brown bob, navy skirt, stockings, brown shoes, a rigid hammer and held nails. Her three-hit hammer combo ends in a knockdown; heavy is an overhead strike and Resonance breaks a guard. Megumi wears a dark high-collar uniform with spiked black hair and brown boots. He combines close strikes with Shadow Sweep and Divine Dog, a visible shikigami lunge synchronized to the special attack's contact window. The dog is part of this attack, not a persistent autonomous ally.

The new pair uses the existing 18-bone rig, IK, keyboard/gamepad/touch controls, team assignment and 1v1/2v2 rules. `tests/new-pair.cjs` covers 500 seeded AI duels across the roster; `tests/new-pair-browser.cjs` checks the six roster choices, combat poses, summon visibility, completed matches and phone width. Historical balance results below describe their respective earlier roster versions.

## Expanded fighter roster

Yuji Itadori and Satoru Gojo are available in all four team slots alongside Grinsk and Bonewarden. Both characters remain available in every team slot.

- **Yuji:** 108 HP, pink spiked hair, red hood/cuffs/boots and navy uniform. Jab–cross–uppercut combo, heavy uppercut, and a guard-breaking Black Flash with red/black energy.
- **Gojo:** 110 HP, white spiked hair, black blindfold and purple-black high-collar uniform. Palm-strike combo, Blue that pulls the opponent toward him, and Red that knocks the opponent away. The visual energy guard consumes stamina normally.
- Both are procedural, eighteen-bone characters using the shared IK, locomotion, dodge, knockdown and victory systems. They are unarmed; no sword, mace or physical shield is inherited from the original models. Roster/HUD portraits and the field guide include both additions.

The expanded roster completed 2,000 seeded AI matches with no stuck rounds or timeouts. Browser checks passed with zero page errors or external requests, completed 1v1 and mixed 2v2 matches, finite IK transforms and visible energy effects, and no horizontal overflow at 390 px. These samples do not establish exact 50/50 balance for every new matchup.

The updated roster is covered by `tests/sorcerers.cjs` and `tests/sorcerer-browser.cjs`; results are saved beside those scripts. Earlier 5,400-match results below apply to the original two-character roster.

## Play

- P1: WASD; J light; K heavy; I special; L guard; Space roll; U taunt.
- P2: arrows; numpad 1 / 2 / 5 / 3 / 0, or comma / period / semicolon / slash / right Shift.
- Gamepads: left stick, X light, Y heavy, B special, shoulder buttons guard, A roll. First two connected pads map to P1/P2.
- Touch: stick plus action buttons; enabled automatically for coarse-pointer devices, or from World settings.
- Enter starts/rematches; P pauses; M sound; T day/dusk/night.
- 1 / 2 / 3 select Fight / Arena / Island; V cycles; Q/E rotate; R resets.
- Drag orbits, right/Shift-drag pans, wheel zooms; two fingers pan/pinch.

Select fighters/controllers per slot, 1v1 or 2v2, AI difficulty, and rounds to win. Changes during a match take effect when starting the next match. Audio starts after an interaction. Fullscreen availability depends on the browser/container.

## Implementation

The deterministic combat engine is separated from Three.js in the `combat-engine` inline script. It uses fixed 60 Hz ticks, seeded randomness, shuffled fighter order, batched contacts for trades, active/chain windows, input buffering, stamina, directional guard, invulnerable dodge frames, knockdowns/get-up, knockback and ring-outs. AI adjusts decision delays, defense and aggression by difficulty. Rounds last at most 99 simulation seconds, with remaining normalized health deciding timeouts.

The world uses instanced voxel terrain/buildings, 150 instanced people, animated windmills/clouds/birds/smoke/flags, a river and waterfall, castle, market, tavern, forge, shrine, lighthouse, watchtower, gardens, livestock and airship. Fighters use instanced geometry per primitive type. The render pipeline uses a low-resolution colour/depth target, depth outlines, chroma control, Bayer dither, and nearest-OKLab selection into a fixed 90-colour palette via an RGB lookup texture. Villagers react to combat; sound is synthesized with WebAudio.

The art is a procedural interpretation of the reference characters and town brief. It is not a literal reconstruction of every accessory or architectural detail. The pose system combines keyed and procedural states rather than imported motion-capture clips.

## Verification

Run development checks with Node.js; Playwright and Chromium are needed only for browser checks, not to play:

```sh
node tests/mechanics.cjs
node tests/sorcerers.cjs
node tests/balance.cjs
node tests/matchups.cjs
python3 -m http.server 3000
node tests/verify.cjs
node tests/sorcerer-browser.cjs
```

The browser harness uses installed Chromium at `/usr/bin/chromium`; change that path for another development environment. Test screenshots are written to the temporary development output directory configured in the harness.

- Eleven mechanics checks pass: active-window hits, guard/chip/stamina, guard break, dodge immunity, knockdown/get-up, ring-out, timeout, buffered combo, pause, and continued final-round falls/knockouts.
- 5,400 seeded AI matches across all unique 1v1 and 2v2 team compositions and all three difficulties: **0 stuck rounds, 0 timeouts**. Per-cell samples contain 200 matches with swapped team assignments. Observed win rates: **45–56.5%**; this is finite-sample evidence, not a guarantee of exact 50/50 balance. Full counts: `tests/matchup-results.json`.
- A separate 1,200-match cross-character sample: 48–53.5% goblin wins; 0 stuck rounds.
- Headless Chromium completed multi-round 1v1/2v2 matches and automatic rematches with **0 page errors and 0 external requests**. Keyboard, pause, settings and camera/time states were exercised.
- Reviewed desktop and 390 px phone layouts: **no horizontal overflow**; reviewed day/dusk/night, all camera views and representative combat poses.
- Touch default activation, stick movement and attacks, plus simulated Gamepad API movement/attacks passed. Physical controller and device feel still warrant hands-on testing. Software-rendered headless Chromium is not a hardware performance benchmark.

## Automation hooks

`?bot=1&turbo=30&mode=2&seed=42` starts AI-only matches and automatically rematches. `mode` is 1 or 2; turbo is bounded to 1–100. `window.__ib` exposes the current match/state, results, camera, renderer and render function, plus stepping helpers. Turbo advances the same fixed-tick engine used by normal play.

Embedded dependencies retain their licenses in the HTML source.
