# Emoji Goldberg Puzzle

Emoji Goldberg Puzzle is a multiplayer collaborative puzzle game inspired by Rube Goldberg machines. Players work together in real time to build elaborate contraptions that guide a ball to its target. Every level is procedurally generated, ensuring a fresh challenge each time you play.

## Gameplay Overview
- **Collaborative solving** – everyone on the server shares the same puzzle. Players place or adjust pieces simultaneously to achieve a solution.
- **Emoji identification** – each player is represented by a unique emoji tied to their IP address. This creates a playful, intuitive way to see who is acting in the puzzle.
- **Physics parameters** – gravity defaults to **9.8 m/s²** (configurable). Each piece stores a mass, friction and restitution value. The ball must enter the goal at **≤ 1.2 m/s** to register a win, preventing ricochet finishes.
- **Side view only** – the game now displays puzzles exclusively from the side perspective.
- **Piece palette** – a docked palette lists available pieces. Players drag and drop from the palette, rotate with on-screen handles, and can enable a 5 px snap‑to‑grid mode to keep layouts tidy.

## Core Features
- **Procedurally generated puzzles** use a three‑phase generator. It first places a guaranteed golden path, then applies Poisson‑disk spacing for free areas, and finally adds decoys or barriers. The generator outputs JSON with a seed, `solutionPath` and a `difficultyScore`, and a headless solver confirms at least one valid solution.
- **Colorful 2D art** with smooth animations and whimsical effects.
- **Real-time multiplayer** with synchronized updates so everyone stays on the same page.
- **Limited toolbox & scoring** – each level provides a fixed set of pieces. Finishing with pieces left earns bonus points using the formula `score = base − moves − resets + (sparePieces × 10) − (elapsedMinutes × 2)`.
- **Obstacles and helpers** – puzzles may include static walls, one‑way gates, fans that apply constant force and magnets that pull the ball when nearby.
- **Optional turn-taking** – in lobby, players can enable a mode where each participant moves one piece then passes.
- **Run/Edit cycle** – gameplay loops between building and testing. During editing a ghost replay shows the last failed attempt.
- **Scaling difficulty** to keep new and experienced players engaged.
- **Sound effects and background music** with a volume slider and mute toggle. All audio is mastered under −14 LUFS.
- **Responsive layout** that fits phones and tablets with touch controls.
- **Optional analytics** – the client may send anonymous solve time, resets and move counts tagged by emoji ID.

## Visual and Animation Quality
- Assets should be crisp and modern, using a consistent palette with complementary colors.
- Animations should play at 60 fps with easing curves for a polished feel.
- Transitions between puzzle states must be smooth and clearly convey player actions.
- Polished dark theme with sidebar UI elements for chat and leaderboard.

Optional cosmetic upgrades allow players to customize puzzle pieces and expand their emoji collection.

For technical details and full requirements see [REQUIREMENTS.md](REQUIREMENTS.md).

## Project Structure
```
public/      # Client HTML and JavaScript
server/      # Node.js server code
package.json # Node package configuration
```

## Development Setup
1. Install **Node.js 18** or later.
2. From the project root run `npm install` to fetch dependencies.
3. Start the server with `npm start`.
4. Optionally set the `PORT` and `DB_FILE` environment variables to
   configure the listening port and database file location.
5. Open [http://localhost:3000](http://localhost:3000) in a browser.
6. The game canvas resizes automatically to fit your window or screen.

### Server Dependencies
- **express** – hosts the static client files and provides an HTTP server.
- **ws** – WebSocket library used for real-time multiplayer communication.

### Controls
- **r** – request a fresh puzzle from the server.
- **Reset Level** button – restart the current puzzle without changing difficulty.
- **R / F** – rotate the selected piece clockwise or counter‑clockwise.
- **Delete** – remove the highlighted piece.
- **Space** – start or stop a test run of the current layout.
