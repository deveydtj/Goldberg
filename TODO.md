# Development TODOs

The following features and tasks from the project requirements are not yet implemented:

- ~~Procedural puzzle generation and piece layouts for replayability.~~ Implemented basic random layout generation on the server.
- ~~Physics simulation for puzzle pieces including collision, movement and win-state detection.~~ Added ball piece with gravity and block collisions. Ramps now deflect the ball and fans push it upward.
- ~~Database to persist player sessions, puzzle states and progress.~~ Added simp
le JSON file persistence on the server.
- ~~Variety of interactive puzzle elements like ramps, fans or levers.~~ Added ramp and fan pieces.
- ~~Real puzzle completion logic that unlocks the next puzzle upon success.~~ Server now generates a new puzzle when players place a piece on the goal.
- ~~True perspective switching between top-down and side view beyond a simple color change.~~ Client now uses the side view exclusively.
- ~~Visual assets and animations that meet the 60 fps and modern style guideline
s.~~ Pieces fade in smoothly when placed.
- ~~Scaling difficulty and puzzle balancing.~~ Puzzle generation adds more block
s each time a puzzle is solved.
- ~~Automated tests covering physics, multiplayer synchronization and UI behavio
r.~~ Added tests for WebSocket welcome and UI toggling.

# New feature ideas
- ~~Implement an in-game chat system so players can coordinate solutions via WebSockets.~~ Added chatLog and server relay.
- ~~Show each player's emoji cursor on the canvas to visualize everyone's actions.~~ Mouse movements broadcast and rendered.
- ~~Allow players to move or delete pieces they've placed for better collaboration.~~ Added drag and double-click controls with server enforcement.
- ~~Track puzzle completion counts in a persistent leaderboard displayed on the client.~~ Leaderboard now sent on welcome and puzzle completion.
- ~~Add a spring piece that launches the ball upward when triggered.~~ Added Spring piece with physics and drawing.
- ~~Sound effects and background music.~~ Added oscillator-based audio in the client.
- ~~Responsive layout and touch controls.~~ Canvas now resizes and supports taps.

## Next work items
- Rewrite generator using a three-phase algorithm starting from `levelGenerator.js`.
 - ~~Add Poisson-disk spacing utility (`minDistancePx`).~~ Implemented in `server/levelGenerator.js`.
- ~~Create a headless solver worker returning `solutionPath` and `difficultyScore`; cache by seed.~~ Implemented in `server/solver.js`.
- Unit tests:
  - ~~generator never overlaps pieces closer than `minDistancePx`.~~ Added `generator.test.js`.
  - ~~solver always confirms a generated level is solvable.~~ Added `solver.test.js`.
 - ~~Piece-palette UI dock with rotate handles for mouse and touch.~~ Implemented rotate handles and hover detection for ramp pieces.
- Show piece counters and a scoring HUD.
- Implement Run/Edit phase state machine with ghost replays of failed runs.
 - ~~Static wall obstacle piece.~~ Implemented in codebase.
 - One-way gate and Magnet with new force calculations.
- Keyboard shortcuts with focus ring and a skip-able tutorial.
- Settings modal for audio slider and color-blind palette toggle.
- Broadcast only the seed so clients regenerate levels and persist per-emoji scores and fastest solves.
- Add victory confetti tweens, mobile haptics on goal collision and overall ghost replay polish.
- CI must lint, run tests and solve a level in under 500 ms, plus a smoke test verifying multiplayer sync.
