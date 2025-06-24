# Development TODOs

The following features and tasks from the project requirements are not yet implemented:

- ~~Procedural puzzle generation and piece layouts for replayability.~~ Implemented basic random layout generation on the server.
- ~~Physics simulation for puzzle pieces including collision, movement and win-state detection.~~ Added ball piece with gravity and block collisions. Ramps now deflect the ball and fans push it upward.
- ~~Database to persist player sessions, puzzle states and progress.~~ Added simp
le JSON file persistence on the server.
- ~~Variety of interactive puzzle elements like ramps, fans or levers.~~ Added ramp and fan pieces.
- ~~Real puzzle completion logic that unlocks the next puzzle upon success.~~ Server now generates a new puzzle when players place a piece on the goal.
- ~~True perspective switching between top-down and side view beyond a simple color change.~~ Client renders blocks and ramps differently in side view.
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
