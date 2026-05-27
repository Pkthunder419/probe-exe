using UnityEngine;

public class ProbeHudController : MonoBehaviour
{
    public int hudWidth = 420;
    public int hudHeight = 230;

    private GUIStyle titleStyle;
    private GUIStyle labelStyle;
    private GUIStyle warningStyle;
    private GUIStyle panelStyle;

    private void InitializeStyles()
    {
        if (titleStyle != null)
        {
            return;
        }

        titleStyle = new GUIStyle(GUI.skin.label);
        titleStyle.fontSize = 18;
        titleStyle.normal.textColor = Color.cyan;
        titleStyle.fontStyle = FontStyle.Bold;

        labelStyle = new GUIStyle(GUI.skin.label);
        labelStyle.fontSize = 12;
        labelStyle.normal.textColor = new Color(0.85f, 0.95f, 1.0f);

        warningStyle = new GUIStyle(GUI.skin.label);
        warningStyle.fontSize = 12;
        warningStyle.normal.textColor = new Color(1.0f, 0.45f, 0.35f);
        warningStyle.fontStyle = FontStyle.Bold;

        panelStyle = new GUIStyle(GUI.skin.box);
        panelStyle.normal.textColor = Color.white;
    }

    private void OnGUI()
    {
        InitializeStyles();

        FileQuestGameDirector director = FileQuestGameDirector.Instance;

        GUI.Box(new Rect(16, 16, hudWidth, hudHeight), "", panelStyle);

        GUILayout.BeginArea(new Rect(28, 24, hudWidth - 24, hudHeight - 24));

        GUILayout.Label("PROBE.EXE // FILE QUEST", titleStyle);

        if (director == null || director.CurrentMap == null)
        {
            GUILayout.Label("Mission state: waiting for map...", labelStyle);
            GUILayout.EndArea();
            return;
        }

        GUILayout.Label("Mission: " + director.CurrentMap.gameTitle, labelStyle);
        GUILayout.Label("Scanner level: " + director.CurrentMap.summary.level, labelStyle);
        GUILayout.Label("XP captured: " + director.CurrentXp, labelStyle);
        GUILayout.Label("Rooms scanned: " + director.RoomsScanned, labelStyle);
        GUILayout.Label("Risks found: " + director.RisksFound, warningStyle);

        GUILayout.Space(8);

        ProbeRoomRuntime room = director.SelectedRoom;
        if (room == null)
        {
            GUILayout.Label("Selected room: none", labelStyle);
        }
        else
        {
            GUILayout.Label("Selected room: " + room.roomName, labelStyle);
            GUILayout.Label("Role: " + room.role + " / " + room.roomType, labelStyle);
            GUILayout.Label("Risk: " + room.riskLevel, room.riskLevel == "none" ? labelStyle : warningStyle);
            GUILayout.Label("Path: " + room.path, labelStyle);
        }

        GUILayout.EndArea();
    }
}
