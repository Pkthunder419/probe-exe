# Probe.exe Unity Game Shell

This folder contains the first Unity script layer for Probe.exe: File Quest.

Current purpose:
- Load `.probe/game-map.json`
- Parse the scanner output into Unity C# data models
- Spawn zones and file rooms as primitive blocks
- Attach runtime room metadata
- Prepare the scene for the orb scanner UI

First Unity scene setup:
1. Create or open a Unity 2D project using this `game` folder.
2. Add an empty GameObject named `ProbeGame`.
3. Attach `FileQuestBootstrap` to `ProbeGame`.
4. Copy a generated `.probe/game-map.json` into `Assets/StreamingAssets/probe-game-map.sample.json`.
5. Press Play.
6. Unity should spawn zones and rooms from the scanner output.

The scanner remains the source of truth. Unity is the playable viewer.
