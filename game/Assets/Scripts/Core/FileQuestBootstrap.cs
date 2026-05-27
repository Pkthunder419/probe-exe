using UnityEngine;

public class FileQuestBootstrap : MonoBehaviour
{
    public ProbeGameMapLoader loader;
    public ProbeZoneSpawner zoneSpawner;
    public FileQuestGameDirector gameDirector;
    public ProbeHudController hudController;
    public ProbeOrbController orbController;

    private void Start()
    {
        if (loader == null)
        {
            loader = gameObject.AddComponent<ProbeGameMapLoader>();
        }

        if (gameDirector == null)
        {
            gameDirector = gameObject.AddComponent<FileQuestGameDirector>();
        }

        ProbeGameMap map = loader.Load();

        if (map == null)
        {
            Debug.LogError("[Probe.exe] No map loaded. Cannot spawn file quest world.");
            return;
        }

        gameDirector.BeginMission(map);

        if (zoneSpawner == null)
        {
            zoneSpawner = gameObject.AddComponent<ProbeZoneSpawner>();
        }

        zoneSpawner.Spawn(map);

        if (hudController == null)
        {
            hudController = gameObject.AddComponent<ProbeHudController>();
        }

        EnsureOrb();
    }

    private void EnsureOrb()
    {
        if (orbController != null)
        {
            return;
        }

        GameObject orb = GameObject.CreatePrimitive(PrimitiveType.Sphere);
        orb.name = "VisionOrb";
        orb.transform.position = new Vector3(-2.5f, 0f, -0.5f);
        orb.transform.localScale = new Vector3(0.7f, 0.7f, 0.7f);

        Renderer renderer = orb.GetComponent<Renderer>();
        if (renderer != null)
        {
            renderer.material.color = Color.cyan;
        }

        orbController = orb.AddComponent<ProbeOrbController>();

        Camera mainCamera = Camera.main;
        if (mainCamera != null)
        {
            ProbeCameraFollow follow = mainCamera.gameObject.GetComponent<ProbeCameraFollow>();
            if (follow == null)
            {
                follow = mainCamera.gameObject.AddComponent<ProbeCameraFollow>();
            }

            follow.target = orb.transform;
        }
    }
}
