using UnityEngine;

public class ProbeRoomRuntime : MonoBehaviour
{
    public string roomId;
    public string roomName;
    public string path;
    public string role;
    public string roomType;
    public string riskLevel;
    public int xpValue;
    public int difficulty;

    private void OnMouseDown()
    {
        Debug.Log("[Probe.exe Room] " + roomName + " | " + role + " | " + path + " | risk: " + riskLevel + " | xp: " + xpValue);
    }
}
