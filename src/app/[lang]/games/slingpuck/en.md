## Sling Puck: a two-player physics duel

Sling Puck (also called Puck Sling, Slingshot Hockey or 弹射冰球) is a fast table-top game for two sides. Each player starts with five pucks on their own half of a wooden board. The halves are separated by a raised divider with a single gap in the middle. On your turn you hook an elastic band behind one of your pucks, pull it back, and let go. The puck shoots forward, bounces off the frame and the other pucks, and hopefully crosses into the opponent's half.

The first side to clear every puck from its own half wins. Pucks that are knocked back into your half are yours again on a later turn, so a big shot can undo your own progress if you are careless.

This page is a complete, playable 2.5D version: Three.js renders a fixed oblique view of the board, while a real 2D physics engine (Rapier) simulates every bounce. No account, download or plugin is required.

## Controls

- **Mouse:** press on one of your pucks, drag backward toward your own band, and release.
- **Touch:** the same gesture with one finger. The canvas suppresses page scrolling while you drag.
- Pull farther for more power. The aiming arrow and the power bar show the direction and strength of the shot.
- A very short pull is treated as a cancelled turn, so you can adjust your grip without wasting a shot.
- Each turn lasts **30 seconds**. If the timer runs out, the turn is skipped automatically.

## Rules

1. Each side starts with five pucks. Colour is decorative: black and ivory pucks behave identically.
2. You may only shoot a puck that is in your own half, and only on your turn.
3. You must pull the puck toward your own side; shots always launch toward the opponent.
4. After a shot, the board is simulated until the pucks settle, then the turn passes.
5. A puck that ends in the opponent's half is out of your way. A puck knocked back into your half must be cleared again.
6. The first side whose half becomes empty wins immediately. If both halves empty on the same shot, the shooter wins.
7. Pucks pass through the centre gap and bounce off the divider rails, the outer frame and each other.

## Difficulty

- **Easy:** searches only a handful of shots and adds a generous aim and power error. Good for learning the controls.
- **Normal:** searches more candidates, picks one of the best three, and applies a small error. A fair match.
- **Hard:** evaluates a wide set of angles and powers, picks the best, and barely deviates. Expect bank shots through the gap.

The AI uses the same rules engine and physics as you; it cannot cheat. It simply searches candidate shots by simulating them.

## Physics tips

- The centre gap is the shortest path, but a direct line is also the most predictable.
- Bank shots off the side rails can reach pucks that are hidden behind the pack.
- Hitting a cluster at an angle scatters several pucks at once, which is often better than a single clean hit.
- Full power is not always best: a softer shot keeps your pucks near the gap instead of rebounding back into your half.
- Watch the opponent's pucks as well: a shot that clears your half but leaves the AI one puck from winning is a bad trade.

## FAQ

### Does it work on phones?

Yes. The layout is responsive and uses pointer events, so the same drag gesture works with a finger. The board is scaled to fit the width of the screen.

### Do colours matter?

No. Black and ivory pucks have identical mass, friction and bounce. They are only there so you can tell the sides apart.

### What happens after a timeout?

The turn is skipped with a short notice. The board does not change. This keeps online-style turn timing consistent and prevents a stalled game.

### Is the board mirrored for the second player?

In human-vs-AI the camera is fixed from your side of the table, which is the natural single-screen view. A future online mode can flip the view for the remote player without changing the simulation.

### Where is the source code?

The game is part of this open-source gallery. The rules, physics adapter, AI policy, rendering and React UI are separate modules under `src/app/[lang]/games/slingpuck/`, with unit tests for the rules, physics, turn engine, AI and UI formatting.
