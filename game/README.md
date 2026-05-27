# Probe.exe Unity Project Scaffold

This folder is prepared to become the Unity game shell for Probe.exe: File Quest.

Current status:
- Scanner brain lives in `/scanner`
- Unity game shell lives in `/game`
- Unity scripts are in `/game/Assets/Scripts`
- Sample scanner bridge file is in `/game/Assets/StreamingAssets/probe-game-map.sample.json`

Unity install status:
- Unity Hub was not found on this machine during the latest probe.
- Once Unity Hub is installed, open this `/game` folder as the Unity project.

Recommended Unity setup:
1. Open Unity Hub.
2. Choose Add project from disk.
3. Select:
   C:\Users\smief654\Desktop\ProbeExe\game
4. Open with a Unity 2022.3 LTS editor or newer compatible editor.
5. Create a new 2D scene named:
   FileQuestPrototype
6. Add an empty GameObject named:
   ProbeGame
7. Attach:
   FileQuestBootstrap
8. Press Play.

Expected result:
- Unity loads `Assets/StreamingAssets/probe-game-map.sample.json`
- Zones spawn vertically
- File rooms spawn horizontally
- Clicking a room logs room metadata in the Unity console

The scanner remains the source of truth. Unity is the playable viewer.
