using System.IO;
using UnityEngine;

public class ProbeGameMapLoader : MonoBehaviour
{
    [Header("Optional absolute path to game-map.json")]
    public string absoluteGameMapPath = "";

    [Header("StreamingAssets fallback filename")]
    public string streamingAssetsFileName = "probe-game-map.sample.json";

    public ProbeGameMap LoadedMap { get; private set; }

    public ProbeGameMap Load()
    {
        string path = ResolvePath();

        if (string.IsNullOrWhiteSpace(path) || !File.Exists(path))
        {
            Debug.LogError("[Probe.exe] game-map.json not found. Checked path: " + path);
            return null;
        }

        string json = File.ReadAllText(path);
        LoadedMap = JsonUtility.FromJson<ProbeGameMap>(json);

        if (LoadedMap == null)
        {
            Debug.LogError("[Probe.exe] Failed to parse game map JSON.");
            return null;
        }

        int zoneCount = LoadedMap.zones != null ? LoadedMap.zones.Count : 0;
        Debug.Log("[Probe.exe] Loaded " + LoadedMap.gameTitle + " with " + zoneCount + " zones.");

        return LoadedMap;
    }

    private string ResolvePath()
    {
        if (!string.IsNullOrWhiteSpace(absoluteGameMapPath))
        {
            return absoluteGameMapPath;
        }

        return Path.Combine(Application.streamingAssetsPath, streamingAssetsFileName);
    }
}
