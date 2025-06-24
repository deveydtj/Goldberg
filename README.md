# Emoji Goldberg Puzzle

Emoji Goldberg Puzzle is a multiplayer collaborative puzzle game inspired by Rube Goldberg machines. Players work together in real time to build elaborate contraptions that guide a ball to its target. Every level is procedurally generated, ensuring a fresh challenge each time you play.

## Gameplay Overview
- **Collaborative solving** – everyone on the server shares the same puzzle. Players place or adjust pieces simultaneously to achieve a solution.
- **Emoji identification** – each player is represented by a unique emoji tied to their IP address. This creates a playful, intuitive way to see who is acting in the puzzle.
- **Physics-based pieces** – blocks and ramps respond to gravity and collisions, with ramps bouncing the ball along their slopes. Basic fans push the ball upward, and future pieces like springs will expand the variety.
- **Perspective switching** – seamlessly toggle between top‑down and side views to place components precisely.

## Core Features
- **Procedurally generated puzzles** that encourage experimentation and replayability.
- **Colorful 2D art** with smooth animations and whimsical effects.
- **Real-time multiplayer** with synchronized updates so everyone stays on the same page.
- **Scaling difficulty** to keep new and experienced players engaged.

## Visual and Animation Quality
- Assets should be crisp and modern, using a consistent palette with complementary colors.
- Animations should play at 60 fps with easing curves for a polished feel.
- Transitions between puzzle states must be smooth and clearly convey player actions.

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
4. Open [http://localhost:3000](http://localhost:3000) in a browser.

### Server Dependencies
- **express** – hosts the static client files and provides an HTTP server.
- **ws** – WebSocket library used for real-time multiplayer communication.

### Controls
- **v** – toggle between top-down and side views.
- **r** – request a fresh puzzle from the server.
