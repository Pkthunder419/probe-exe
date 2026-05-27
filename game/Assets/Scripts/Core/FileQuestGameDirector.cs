using System.Collections.Generic;
using UnityEngine;

public class FileQuestGameDirector : MonoBehaviour
{
    public static FileQuestGameDirector Instance { get; private set; }

    public ProbeGameMap CurrentMap { get; private set; }
    public ProbeRoomRuntime SelectedRoom { get; private set; }

    public int CurrentXp { get; private set; }
    public int RoomsScanned { get; private set; }
    public int RisksFound { get; private set; }

    private readonly HashSet<string> scannedRoomIds = new HashSet<string>();

    private void Awake()
    {
        Instance = this;
        ProbeRoomRuntime.RoomClicked += HandleRoomClicked;
    }

    private void OnDestroy()
    {
        ProbeRoomRuntime.RoomClicked -= HandleRoomClicked;
        if (Instance == this)
        {
            Instance = null;
        }
    }

    public void BeginMission(ProbeGameMap map)
    {
        CurrentMap = map;
        CurrentXp = 0;
        RoomsScanned = 0;
        RisksFound = 0;
        scannedRoomIds.Clear();

        if (map != null)
        {
            Debug.Log("[Probe.exe] Mission initialized: " + map.gameTitle);
        }
    }

    private void HandleRoomClicked(ProbeRoomRuntime room)
    {
        if (room == null)
        {
            return;
        }

        SelectedRoom = room;

        if (!scannedRoomIds.Contains(room.roomId))
        {
            scannedRoomIds.Add(room.roomId);
            RoomsScanned++;
            CurrentXp += room.xpValue;

            if (room.riskLevel != "none")
            {
                RisksFound++;
            }
        }

        Debug.Log("[Probe.exe] Room scanned: " + room.roomName + " | XP +" + room.xpValue);
    }
}
