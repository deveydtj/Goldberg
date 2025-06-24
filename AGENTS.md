# AGENTS.MD — Emoji Goldberg Puzzle

## Purpose
This file defines agent roles, responsibilities, and best practices for collaborative and AI-assisted development of the Emoji Goldberg Puzzle game.

## Project Overview
- **Name:** Emoji Goldberg Puzzle
- **Type:** Multiplayer, collaborative, Rube Goldberg-inspired puzzle game
- **Stack:** JavaScript, HTML5 Canvas/WebGL, Node.js (WebSocket backend)
- **Core Features:** Real-time collaboration, 2D physics, emoji-linked identity, top-down/side view switching

---

## Agent Roles & Responsibilities

### 1. Game Logic Agent
- **Description:** Designs and implements core puzzle mechanics and collaborative logic.
- **Key Tasks:**
  - Procedural generation of puzzles and piece layouts.
  - Physics simulation (collision, movement, win state).
  - Real-time synchronization (multiplayer actions).

### 2. Graphics/UI Agent
- **Description:** Builds beautiful, interactive 2D graphics and smooth UI.
- **Key Tasks:**
  - Canvas/WebGL rendering for both top-down and side views.
  - Animations for pieces, emoji cursors, and feedback.
  - Responsive UI/UX (piece selection, view switching, chat, etc).

### 3. Multiplayer/Network Agent
- **Description:** Handles server-client connections and game state sync.
- **Key Tasks:**
  - Real-time multiplayer using WebSockets.
  - Emoji-linked identity assignment per IP/session.
  - Low-latency state updates and conflict resolution.

### 4. Puzzle Content Agent
- **Description:** Expands puzzle piece variety and challenge.
- **Key Tasks:**
  - Designs new interactive elements (ramps, fans, etc).
  - Balances puzzles for fun and cooperation.
  - Creates puzzle templates for procedural generation.

### 5. QA/Testing Agent
- **Description:** Ensures robust, fun, and bug-free gameplay.
- **Key Tasks:**
  - Unit and integration testing of physics, multiplayer sync, and UI.
  - Automated tests for piece interactions and win conditions.
  - Playtesting for collaborative puzzle dynamics.

---

## General Best Practices

- **Consistency:** Follow established naming conventions and modular code structure.
- **Documentation:** Comment new features, tricky logic, and important design decisions.
- **Collaboration:** Communicate changes and synchronize large updates via pull requests.
- **Accessibility:** Ensure visuals and controls are accessible (color contrast, keyboard nav).
- **Performance:** Optimize physics and rendering for smooth, low-latency play.

---

## Copilot/Codex Prompts

Use these prompts to get the most from Copilot or Codex:

- "Generate a procedural Rube Goldberg puzzle layout using random but solvable configurations."
- "Implement emoji-based player identity tied to IP address using WebSockets."
- "Create a 2D physics engine for simulating balls, ramps, levers, and fans in JavaScript Canvas."
- "Design a UI to toggle between top-down and side-view perspectives on Canvas."

---

## Contact & Contribution

For questions, improvements, or onboarding, ping the project lead or submit a GitHub Issue/PR with clear descriptions and example scenarios.

---

Happy building!
