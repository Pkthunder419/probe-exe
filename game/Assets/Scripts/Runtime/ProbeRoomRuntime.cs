using System;
using UnityEngine;

public class ProbeRoomRuntime : MonoBehaviour
{
    public static event Action<ProbeRoomRuntime> RoomClicked;

    public string roomId;
    public string roomName;
    public string path;
    public string role;
    public string roomType;
    public string riskLevel;
    public int xpValue;
    public int difficulty;

    private Vector3 baseScale;
    private bool hover;

    private void Start()
    {
        baseScale = transform.localScale;
    }

    private void OnMouseEnter()
    {
        hover = true;
        transform.localScale = baseScale * 1.08f;
    }

    private void OnMouseExit()
    {
        hover = false;
        transform.localScale = baseScale;
    }

    private void OnMouseDown()
    {
        RoomClicked?.Invoke(this);
        Debug.Log("[Probe.exe Room] " + roomName + " | " + role + " | " + path + " | risk: " + riskLevel + " | xp: " + xpValue);
    }

    private void Update()
    {
        if (!hover)
        {
            return;
        }

        transform.Rotate(0f, 0f, Mathf.Sin(Time.time * 6f) * 0.05f);
    }
}
