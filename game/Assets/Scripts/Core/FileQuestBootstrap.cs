using UnityEngine;

public class FileQuestBootstrap : MonoBehaviour
{
    public ProbeGameMapLoader loader;
    public ProbeZoneSpawner zoneSpawner;

    private void Start()
    {
        if (loader == null)
        {
            loader = gameObject.AddComponent<ProbeGameMapLoader>();
        }

        ProbeGameMap map = loader.Load();

        if (map == null)
        {
            Debug.LogError("[Probe.exe] No map loaded. Cannot spawn file quest world.");
            return;
        }

        if (zoneSpawner == null)
        {
            zoneSpawner = gameObject.AddComponent<ProbeZoneSpawner>();
        }

        zoneSpawner.Spawn(map);
    }
}
