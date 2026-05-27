#if UNITY_EDITOR
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.SceneManagement;

public static class ProbeSceneBuilder
{
    private const string ScenePath = "Assets/Scenes/FileQuestPrototype.unity";

    [MenuItem("Probe.exe/Create File Quest Prototype Scene")]
    public static void CreateFileQuestPrototypeScene()
    {
        Scene scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);

        GameObject cameraObject = new GameObject("Main Camera");
        Camera camera = cameraObject.AddComponent<Camera>();
        camera.tag = "MainCamera";
        camera.orthographic = true;
        camera.orthographicSize = 7.5f;
        camera.clearFlags = CameraClearFlags.SolidColor;
        camera.backgroundColor = new Color(0.02f, 0.025f, 0.04f);
        cameraObject.transform.position = new Vector3(8f, -2f, -10f);

        GameObject lightObject = new GameObject("Probe Scene Light");
        Light light = lightObject.AddComponent<Light>();
        light.type = LightType.Directional;
        light.intensity = 1.2f;
        lightObject.transform.rotation = Quaternion.Euler(50f, -30f, 0f);

        GameObject probeGame = new GameObject("ProbeGame");
        probeGame.AddComponent<FileQuestBootstrap>();

        GameObject originMarker = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
        originMarker.name = "Root Zone Origin Marker";
        originMarker.transform.position = new Vector3(-2.5f, 0f, 0.25f);
        originMarker.transform.localScale = new Vector3(0.35f, 0.08f, 0.35f);

        Renderer markerRenderer = originMarker.GetComponent<Renderer>();
        if (markerRenderer != null)
        {
            markerRenderer.material.color = Color.green;
        }

        EditorSceneManager.SaveScene(scene, ScenePath);
        AssetDatabase.Refresh();

        Debug.Log("[Probe.exe] File Quest prototype scene created at " + ScenePath);
        Debug.Log("[Probe.exe] Press Play to load the sample game-map and spawn rooms.");
    }

    [MenuItem("Probe.exe/Open StreamingAssets Folder")]
    public static void OpenStreamingAssetsFolder()
    {
        EditorUtility.RevealInFinder(Application.streamingAssetsPath);
    }
}
#endif
