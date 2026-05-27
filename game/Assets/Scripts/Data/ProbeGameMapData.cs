using System;
using System.Collections.Generic;

[Serializable]
public class ProbeGameMap
{
    public string gameTitle;
    public string schemaVersion;
    public string generatedAt;
    public string rootPath;
    public ProbeSummary summary;
    public ProbePlayerStart playerStart;
    public ProbeLegend legend;
    public List<ProbeZone> zones;
}

[Serializable]
public class ProbeSummary
{
    public int foldersScanned;
    public int filesScanned;
    public int routesFound;
    public int componentsFound;
    public int risksFound;
    public int xpEarned;
    public int level;
}

[Serializable]
public class ProbePlayerStart
{
    public string zoneId;
    public string roomId;
}

[Serializable]
public class ProbeLegend
{
    public string folder;
    public string file;
    public string route;
    public string component;
    public string environment;
    public string config;
    public string documentation;
    public string asset;
    public string finding;
    public string risk;
}

[Serializable]
public class ProbeZone
{
    public string id;
    public string name;
    public string path;
    public int level;
    public int roomCount;
    public int riskCount;
    public int landmarkCount;
    public ProbePosition position;
    public List<ProbeRoom> rooms;
}

[Serializable]
public class ProbeRoom
{
    public string id;
    public string name;
    public string path;
    public string folder;
    public string role;
    public string roomType;
    public bool landmark;
    public string riskLevel;
    public int difficulty;
    public int xpValue;
    public string rewardType;
    public string routePath;
    public int lineCount;
    public int importCount;
    public int exportCount;
    public List<string> signals;
    public int findingsCount;
    public ProbePosition position;
}

[Serializable]
public class ProbePosition
{
    public float x;
    public float y;
}
