# Probe.exe Unity Opening Steps

Use this once Unity Hub and a Unity 2022.3 LTS editor are installed.

## Open the project

1. Open Unity Hub.
2. Click Add.
3. Select this folder:

   C:\Users\smief654\Desktop\ProbeExe\game

4. Open the project.

## Create the first playable scene

After Unity finishes importing:

1. In Unity top menu, click:

   Probe.exe > Create File Quest Prototype Scene

2. Open:

   Assets/Scenes/FileQuestPrototype.unity

3. Press Play.

## Expected behavior

- The sample `game-map.json` loads from `Assets/StreamingAssets/probe-game-map.sample.json`.
- File zones spawn vertically.
- File rooms spawn horizontally.
- A cyan VisionOrb appears.
- Arrow keys move the orb.
- The camera follows the orb.
- Clicking rooms updates the HUD and logs room data.
- XP increases only the first time each room is scanned.

## Current limitation

This is a prototype shell. The visual style is still primitive blocks, labels, HUD, and orb behavior. The next visual pass will replace primitive objects with real retro game art, pixel-style room panels, scan cone effects, and animated room states.
