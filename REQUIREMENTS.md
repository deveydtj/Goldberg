# Technical Requirements

## Frontend
- **HTML5 Canvas/WebGL** for rendering graphics and animations.
- **JavaScript** to handle gameplay logic and real-time collaboration.
- Piece-palette dock for dragging pieces with rotate handles and optional 5 px snap-to-grid.

### Visual Guidelines
- Maintain a modern color scheme with high-contrast gradients and minimal clutter.
- Use vector assets or high-resolution sprites to avoid pixelation on large displays.
- Target a steady 60 fps for all animations using requestAnimationFrame and hardware acceleration.

## Backend
- **Node.js** server using **WebSockets** to synchronize player actions.

## Data Storage
- Minimal database to store player sessions, progress, and puzzle states.

## Example Gameplay Loop
1. **Join & Emoji Selection** – player connects to the server and is assigned an emoji linked to their IP address.
2. **Collaborative Building** – all players place and adjust puzzle pieces to guide the ball.
3. **Side Perspective Only** – puzzles are always shown from the side.
4. **Puzzle Completion** – when the ball reaches its goal, animations play and the next puzzle is unlocked.
5. **Physics parameters** – gravity is 9.8 m/s² by default and pieces define mass, friction and restitution. The ball must enter the goal at ≤ 1.2 m/s to count as a win.

Cosmetic upgrades can optionally be sold for additional player customization.

The level generator runs in three phases: golden-path placement, Poisson-disk spacing, then decoy/barrier injection. It outputs JSON with the seed, `solutionPath` and a 0–100 `difficultyScore`. A headless solver verifies that at least one solution exists before the level is served.

## Additional Requirements
- **Sound design** – include short sound effects for piece interactions and a playful background music loop with a volume slider and mute toggle. Keep audio under −14 LUFS.
- **Responsive layout** – ensure the interface adapts gracefully to phones and tablets with touch controls.
- **Account support** – optional login so players can track their progress across devices.
- **Interactive tutorial** – guide new players through the basics with a short step-by-step level.
- **Keyboard shortcuts** – provide R/F to rotate, Delete to remove and Space to test run, with visible focus indicators.
- **Puzzle editor** – allow the community to craft and share custom puzzles via the server.
- **Settings modal** – expose an audio volume slider and a color-blind palette toggle.
- **Optional telemetry** – anonymously track solve time, resets and piece moves per emoji identifier.
- **Scalable hosting** – environment variables configure server port and database location for cloud deployment.
- **Deterministic levels** – only the puzzle seed is broadcast; clients regenerate the level and scores per emoji are saved server-side.
- **Polish features** – include ghost replay overlays, victory confetti tied to score and optional mobile haptic feedback when the ball reaches the goal.
- **Dev‑ops** – continuous integration must lint, run tests and execute the solver in under 500 ms, plus a smoke test that verifies multiplayer sync.
