# Mobile Landscape Edition

This change extends Combat Reforged from main (83d4253). It preserves the eleven fighters, 77 attack definitions, 49 texture assets, fixed-tick simulation, desktop controls, team modes and dependency-free Vercel/offline build.

## Presentation and lifecycle

`src/game/mobile.js` owns device detection, viewport state, pause reasons, camera framing, graphics quality and local settings. Coarse-pointer devices and smaller touch devices use the mobile presentation. Menus, roster and settings remain ordinary responsive pages in portrait.

Starting a match enters a fixed combat viewport. The canvas fills visualViewport dimensions with 100dvw/100dvh and older viewport fallbacks. Safe-area variables come from env(); neither the page nor the canvas is rotated with transforms. ResizeObserver, window resize/orientation, Screen Orientation and visualViewport events update layout, render dimensions and projection without recreating BrawlMatch.

The initial user gesture attempts fullscreen and orientation lock where available. Synchronous failures and rejected promises are handled. Unsupported iOS-style APIs fall back to the actual viewport orientation. Portrait, visibility loss, settings and user pause have independent blockers. Rotation removes only its own blocker, preserving a manual pause. Returning from another tab requires Resume. Exiting releases pointers, cancels charge, unlocks orientation and leaves fullscreen. An asynchronous fullscreen request finishing after Exit is immediately unwound.

## Two-thumb input

`src/input/touch.js` replaces the split listeners previously installed in world.js and reforged.js. One map owns each pointer and one pointer owns each action. Capture, release, cancel and lost-capture are handled centrally; an unrelated finger cannot release heavy or guard. Guard/heavy are held states; light, skills, dash and dodge enter the existing bounded action queue. Heavy release clears the hold once; cancellation cancels the charge rather than firing it. Rapid taps remain separate queued actions. The fixed simulation samples these values independently of rendering.

The joystick has a radial dead zone, normalized analog movement, recentering and an optional floating origin. A charged fighter can reposition at 22% movement speed; charge timing and damage rules are unchanged. Keyboard/gamepad heavy and movement use the same simulation rule.

Touch gestures and selection are suppressed inside active combat only. Camera orbit/pan/pinch are ignored there; manual world exploration remains available in menus and on desktop.

## Layout and camera

The landscape HUD places health/stamina/energy at the top, with the timer and 44px pause target in the center. Two staggered circular action arcs use at least 44px targets. Light has the strongest contrast; ultimate has a separate color, ready state and energy readout. Cooldown rings, pressed states and resource feedback use the actual fighter state. The joystick and action cluster can swap sides.

Camera bounds include the heads and feet of every active fighter, with margins, and fit an unobstructed region above the thumb controls and below the HUD. Framing adapts to aspect ratio and simulated safe-area insets. Tracking eases back after separation; ultimate anticipation adds a restrained pull-back. Zero-size resize transients are skipped, with finite-state recovery as a safeguard.

## Preferences and graphics

Mobile Controls is accessible from Settings and the pause overlay. It stores validated preferences in localStorage under `isle-brawl.mobile.v1`; failed/unavailable storage does not block play. Controls include joystick/button sizes, physical left/right margins, opacity, arc preset, handedness, floating joystick, shake, VFX intensity, FPS, haptics (when supported), graphics and a live layout preview. Training tools remain available in the settings dialog's Training lab section.

Low/Medium/High cap pixel ratio, vary internal resolution, use 0/512/1024px shadows, reduce decorative effect counts and update world ambience at 10/20/30 Hz. Fighter animation and combat remain independent of those background budgets. Auto starts at Medium, degrades after sustained slow frames and restores only after a longer healthy period, with a cooldown between changes. Render targets are resized only when dimensions change. Replaced shadow targets and rematched instanced actors release their resources.

VFX retains all existing assets. Decorative particles have a bounded budget and cannot occupy the final 24 slots in the 96-effect pool. Critical anticipation, projectile, contact, guard/parry and ultimate effects retain priority. Original shader programs are warmed on mobile once textures load.

## Executed verification

- `npm test`: original mechanics, all 77 attack entries and resource/defense rules, 32 seeded arena/team matches and 500 roster matches.
- `tests/mobile-layout.cjs`: touch emulation at 844×390, 932×430, 740×360, 667×375 and 1024×768; portrait at 390×844 and 430×932. Checks actual stage/HUD/button geometry, 44px targets, button separation, safe insets and fighter projections outside control occlusion.
- Chrome DevTools multi-touch checks moving with each action, guard while another finger taps/releases, charged movement/release, cancellation, rapid taps and automatic camera gesture suppression. Rotation, manual pause, focus loss, rematch, both team sizes, preference persistence, critical VFX and graphics changes are also covered.
- Seven consecutive rematches stabilized at 26 rendered geometries and 30 resident textures in the measured scenario; this is a bounded regression check, not a complete browser/GPU memory profiler.
- Existing input/gamepad and desktop Reforged suites remain in use. Deployment smoke verifies the exact Vercel output, eleven roster entries, 49 loaded assets and no additional runtime asset requests.

Screenshots 01–08 are under `docs/screenshots/mobile/`. Results are in `tests/mobile-layout-results.json`.

## Real-device review still needed

Desktop Chromium touch emulation does not verify physical rotation, iOS Safari fullscreen restrictions, Dynamic Island hardware, vibration strength, browser-toolbar behavior on a real phone, battery use or GPU FPS. Verify those on iOS Safari and Android Chrome before claiming device performance targets. The quality presets aim for 60 FPS on capable phones; no hardware FPS benchmark is claimed here. Safe areas and orientation-lock rejection are emulated in tests.
