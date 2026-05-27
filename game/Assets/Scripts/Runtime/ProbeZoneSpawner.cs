using UnityEngine;

public class ProbeZoneSpawner : MonoBehaviour
{
    [Header("Scene Layout")]
    public float roomSpacing = 2.4f;
    public float zoneSpacing = 4.0f;
    public int maxRoomsPerZone = 24;

    public void Spawn(ProbeGameMap map)
    {
        if (map == null || map.zones == null)
        {
            Debug.LogWarning("[Probe.exe] Spawn called with no zones.");
            return;
        }

        ClearExistingProbeObjects();

        for (int zoneIndex = 0; zoneIndex < map.zones.Count; zoneIndex++)
        {
            ProbeZone zone = map.zones[zoneIndex];
            SpawnZone(zone, zoneIndex);
        }

        Debug.Log("[Probe.exe] Spawned playable project map shell.");
    }

    private void SpawnZone(ProbeZone zone, int zoneIndex)
    {
        GameObject zoneRoot = new GameObject("ZONE_" + SafeName(zone.name));
        zoneRoot.transform.parent = transform;
        zoneRoot.transform.position = new Vector3(0, -zoneIndex * zoneSpacing, 0);

        CreateLabel(zoneRoot.transform, zone.name + " // " + zone.roomCount + " rooms", new Vector3(0, 0.8f, 0), 0.28f);

        if (zone.rooms == null)
        {
            return;
        }

        int count = Mathf.Min(zone.rooms.Count, maxRoomsPerZone);

        for (int i = 0; i < count; i++)
        {
            SpawnRoom(zoneRoot.transform, zone.rooms[i], i);
        }

        if (zone.rooms.Count > maxRoomsPerZone)
        {
            CreateLabel(zoneRoot.transform, "+" + (zone.rooms.Count - maxRoomsPerZone) + " rooms hidden in this zone", new Vector3(count * roomSpacing + 1.5f, 0, 0), 0.18f);
        }
    }

    private void SpawnRoom(Transform parent, ProbeRoom room, int roomIndex)
    {
        GameObject roomObject = GameObject.CreatePrimitive(PrimitiveType.Cube);
        roomObject.name = "ROOM_" + SafeName(room.name);
        roomObject.transform.parent = parent;
        roomObject.transform.localPosition = new Vector3(roomIndex * roomSpacing, 0, 0);
        roomObject.transform.localScale = new Vector3(1.6f, 0.9f, 0.25f);

        Renderer renderer = roomObject.GetComponent<Renderer>();
        if (renderer != null)
        {
            renderer.material.color = GetRoomColor(room);
        }

        ProbeRoomRuntime runtime = roomObject.AddComponent<ProbeRoomRuntime>();
        runtime.roomId = room.id;
        runtime.roomName = room.name;
        runtime.path = room.path;
        runtime.role = room.role;
        runtime.roomType = room.roomType;
        runtime.riskLevel = room.riskLevel;
        runtime.xpValue = room.xpValue;
        runtime.difficulty = room.difficulty;

        CreateLabel(roomObject.transform, room.name, new Vector3(0, -0.75f, 0), 0.16f);
    }

    private Color GetRoomColor(ProbeRoom room)
    {
        if (room.riskLevel != "none")
        {
            return new Color(1.0f, 0.25f, 0.35f);
        }

        if (room.landmark)
        {
            return new Color(1.0f, 0.78f, 0.25f);
        }

        if (room.role == "route" || room.role == "api-route")
        {
            return new Color(0.35f, 0.85f, 1.0f);
        }

        if (room.role == "component")
        {
            return new Color(0.65f, 0.45f, 1.0f);
        }

        return new Color(0.25f, 0.55f, 0.75f);
    }

    private void CreateLabel(Transform parent, string text, Vector3 localPosition, float size)
    {
        GameObject labelObject = new GameObject("LABEL");
        labelObject.transform.parent = parent;
        labelObject.transform.localPosition = localPosition;

        TextMesh textMesh = labelObject.AddComponent<TextMesh>();
        textMesh.text = text;
        textMesh.characterSize = size;
        textMesh.anchor = TextAnchor.MiddleCenter;
        textMesh.alignment = TextAlignment.Center;
        textMesh.color = Color.cyan;
    }

    private void ClearExistingProbeObjects()
    {
        for (int i = transform.childCount - 1; i >= 0; i--)
        {
            Destroy(transform.GetChild(i).gameObject);
        }
    }

    private string SafeName(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return "root";
        }

        foreach (char invalid in System.IO.Path.GetInvalidFileNameChars())
        {
            value = value.Replace(invalid, '_');
        }

        return value.Replace("/", "_").Replace("\\", "_");
    }
}
