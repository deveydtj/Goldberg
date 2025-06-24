# Technical Requirements

## Frontend
- **HTML5 Canvas/WebGL** for rendering graphics and animations.
- **JavaScript** to handle gameplay logic and real-time collaboration.

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
3. **Perspective Toggle** – players swap between top-down and side views to refine the contraption.
4. **Puzzle Completion** – when the ball reaches its goal, animations play and the next puzzle is unlocked.

Cosmetic upgrades can optionally be sold for additional player customization.
