import type { ProjectMap, Room } from "../types";

export function toHtmlReport(projectMap: ProjectMap): string {
  const rooms = projectMap.zones.flatMap((zone) => zone.rooms);
  const landmarkCount = rooms.filter((room) => room.landmark).length;
  const riskRooms = rooms.filter((room) => room.riskLevel !== "none");
  const safeDataJson = JSON.stringify({
    summary: projectMap.summary,
    rootPath: projectMap.rootPath,
    scannedAt: projectMap.scannedAt,
    zones: projectMap.zones.map((zone) => ({
      id: zone.id,
      name: zone.name,
      path: zone.path,
      level: zone.level,
      roomCount: zone.rooms.length
    })),
    rooms
  }).replaceAll("<", "\\u003c").replaceAll("</script", "<\\/script");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Probe.exe File Quest Report</title>
  <style>
    :root {
      --bg: #05070d;
      --panel: #111827;
      --panel-2: #0b1020;
      --grid: rgba(93, 230, 255, 0.14);
      --cyan: #5de6ff;
      --green: #7cff9b;
      --amber: #ffd166;
      --red: #ff5d73;
      --purple: #b692ff;
      --text: #e8f6ff;
      --muted: #8ca3b8;
      --line: rgba(93, 230, 255, 0.35);
    }

    * { box-sizing: border-box; }

    body {
      margin: 0;
      background:
        linear-gradient(90deg, var(--grid) 1px, transparent 1px),
        linear-gradient(var(--grid) 1px, transparent 1px),
        radial-gradient(circle at 50% 0%, rgba(93, 230, 255, 0.18), transparent 34%),
        var(--bg);
      background-size: 32px 32px, 32px 32px, auto;
      color: var(--text);
      font-family: "Consolas", "Lucida Console", monospace;
      min-height: 100vh;
    }

    button,
    input,
    select {
      font-family: inherit;
    }

    .crt {
      min-height: 100vh;
      padding: 18px;
      position: relative;
      overflow-x: hidden;
    }

    .crt::after {
      content: "";
      position: fixed;
      inset: 0;
      background: repeating-linear-gradient(
        to bottom,
        rgba(255,255,255,0.028),
        rgba(255,255,255,0.028) 1px,
        transparent 1px,
        transparent 4px
      );
      pointer-events: none;
      mix-blend-mode: screen;
    }

    .hud {
      border: 1px solid var(--line);
      background: linear-gradient(180deg, rgba(17,24,39,0.94), rgba(5,7,13,0.94));
      box-shadow: 0 0 24px rgba(93, 230, 255, 0.14);
      padding: 16px;
      border-radius: 4px;
      display: grid;
      grid-template-columns: 1.2fr 1fr;
      gap: 16px;
      margin-bottom: 18px;
    }

    .title {
      font-size: 28px;
      letter-spacing: 2px;
      color: var(--cyan);
      text-shadow: 0 0 14px rgba(93, 230, 255, 0.75);
      margin: 0 0 8px;
    }

    .subtitle {
      color: var(--muted);
      margin: 0;
      font-size: 13px;
      word-break: break-all;
    }

    .stats {
      display: grid;
      grid-template-columns: repeat(4, minmax(100px, 1fr));
      gap: 8px;
    }

    .stat {
      border: 1px solid rgba(93, 230, 255, 0.22);
      background: rgba(11,16,32,0.8);
      padding: 10px;
      min-height: 68px;
    }

    .stat .label {
      color: var(--muted);
      font-size: 11px;
      text-transform: uppercase;
    }

    .stat .value {
      font-size: 22px;
      margin-top: 6px;
      color: var(--green);
    }

    .controls {
      border: 1px solid rgba(93, 230, 255, 0.25);
      background: rgba(5,7,13,0.82);
      padding: 12px;
      margin-bottom: 18px;
      display: grid;
      grid-template-columns: 1.5fr 1fr 1fr auto auto;
      gap: 10px;
      align-items: center;
    }

    .control,
    .control-select {
      width: 100%;
      background: rgba(11,16,32,0.96);
      border: 1px solid rgba(93, 230, 255, 0.35);
      color: var(--text);
      padding: 9px;
      outline: none;
    }

    .toggle {
      background: rgba(11,16,32,0.96);
      border: 1px solid rgba(93, 230, 255, 0.35);
      color: var(--muted);
      padding: 9px 10px;
      cursor: pointer;
      white-space: nowrap;
    }

    .toggle.active {
      border-color: rgba(124, 255, 155, 0.75);
      color: var(--green);
      box-shadow: 0 0 12px rgba(124, 255, 155, 0.12);
    }

    .layout {
      display: grid;
      grid-template-columns: 1fr 380px;
      gap: 18px;
      align-items: start;
    }

    .viewport {
      border: 1px solid var(--line);
      background: linear-gradient(180deg, rgba(11,16,32,0.95), rgba(3,5,10,0.96));
      min-height: 520px;
      padding: 16px;
      border-radius: 4px;
      box-shadow: inset 0 0 40px rgba(93, 230, 255, 0.05);
      overflow: hidden;
    }

    .orb-row {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 8px 0 18px;
      color: var(--muted);
      font-size: 12px;
    }

    .orb {
      width: 34px;
      height: 34px;
      border-radius: 50%;
      background:
        radial-gradient(circle at 35% 30%, #ffffff, #5de6ff 26%, #244c80 56%, #05070d 82%);
      box-shadow: 0 0 24px rgba(93, 230, 255, 0.95);
      position: relative;
      animation: float 2.4s ease-in-out infinite;
      flex: 0 0 auto;
    }

    .orb::after {
      content: "";
      position: absolute;
      left: 30px;
      top: 9px;
      width: 84px;
      height: 16px;
      background: linear-gradient(90deg, rgba(93,230,255,0.45), transparent);
      clip-path: polygon(0 20%, 100% 50%, 0 80%);
    }

    @keyframes float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-4px); }
    }

    .render-status {
      color: var(--amber);
      font-size: 12px;
      margin-bottom: 12px;
    }

    .zone {
      margin-bottom: 24px;
      border: 1px solid rgba(93, 230, 255, 0.20);
      background: rgba(5,7,13,0.76);
      padding: 12px;
    }

    .zone-header {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      align-items: center;
      border-bottom: 1px solid rgba(93, 230, 255, 0.18);
      padding-bottom: 8px;
      margin-bottom: 12px;
    }

    .zone-title {
      color: var(--cyan);
      font-size: 16px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .zone-meta {
      color: var(--muted);
      font-size: 12px;
    }

    .corridor {
      display: flex;
      gap: 12px;
      overflow-x: auto;
      padding: 10px 4px 16px;
      min-height: 124px;
    }

    .room {
      flex: 0 0 196px;
      min-height: 124px;
      border: 1px solid rgba(93, 230, 255, 0.28);
      background:
        linear-gradient(135deg, rgba(93, 230, 255, 0.08), transparent 50%),
        rgba(17,24,39,0.86);
      padding: 10px;
      position: relative;
      box-shadow: 0 0 12px rgba(93, 230, 255, 0.08);
      cursor: pointer;
      transition: transform 120ms ease, border-color 120ms ease, box-shadow 120ms ease;
    }

    .room:hover {
      transform: translateY(-3px);
      border-color: rgba(93, 230, 255, 0.85);
      box-shadow: 0 0 20px rgba(93, 230, 255, 0.18);
    }

    .room.landmark {
      border-color: rgba(255, 209, 102, 0.72);
      box-shadow: 0 0 18px rgba(255, 209, 102, 0.12);
    }

    .room.risk-low,
    .room.risk-medium,
    .room.risk-high,
    .room.risk-critical {
      border-color: rgba(255, 93, 115, 0.85);
      box-shadow: 0 0 18px rgba(255, 93, 115, 0.13);
    }

    .room.selected {
      outline: 2px solid var(--green);
      outline-offset: 2px;
    }

    .room-name {
      color: var(--text);
      font-size: 13px;
      margin-bottom: 8px;
      word-break: break-word;
    }

    .room-role {
      color: var(--purple);
      font-size: 11px;
      text-transform: uppercase;
      margin-bottom: 8px;
    }

    .room-path {
      color: var(--muted);
      font-size: 10px;
      word-break: break-word;
      line-height: 1.35;
    }

    .badge {
      display: inline-block;
      margin-top: 8px;
      margin-right: 4px;
      padding: 3px 6px;
      border: 1px solid rgba(124, 255, 155, 0.5);
      color: var(--green);
      font-size: 10px;
      text-transform: uppercase;
    }

    .risk-badge {
      border-color: rgba(255, 93, 115, 0.65);
      color: var(--red);
    }

    .signal-badge {
      border-color: rgba(182, 146, 255, 0.6);
      color: var(--purple);
    }

    .side {
      border: 1px solid var(--line);
      background: linear-gradient(180deg, rgba(17,24,39,0.94), rgba(5,7,13,0.94));
      padding: 14px;
      border-radius: 4px;
      position: sticky;
      top: 18px;
      max-height: calc(100vh - 36px);
      overflow: auto;
    }

    .panel-title {
      color: var(--cyan);
      text-transform: uppercase;
      letter-spacing: 1px;
      font-size: 14px;
      border-bottom: 1px solid rgba(93, 230, 255, 0.18);
      padding-bottom: 8px;
      margin-bottom: 12px;
    }

    .inspector-label {
      color: var(--muted);
      font-size: 10px;
      text-transform: uppercase;
      margin-top: 10px;
    }

    .inspector-value {
      color: var(--text);
      font-size: 12px;
      line-height: 1.45;
      word-break: break-word;
      margin-top: 3px;
    }

    .finding {
      border: 1px solid rgba(93, 230, 255, 0.18);
      background: rgba(11,16,32,0.7);
      padding: 10px;
      margin-top: 10px;
    }

    .finding .sev {
      color: var(--amber);
      font-size: 11px;
      text-transform: uppercase;
      margin-bottom: 6px;
    }

    .finding .find-title {
      color: var(--text);
      font-size: 13px;
      margin-bottom: 6px;
    }

    .finding .msg {
      color: var(--muted);
      font-size: 11px;
      line-height: 1.45;
    }

    .mini-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 6px;
      margin-top: 10px;
    }

    .mini-stat {
      border: 1px solid rgba(93, 230, 255, 0.18);
      background: rgba(11,16,32,0.65);
      padding: 7px;
    }

    .mini-stat div:first-child {
      color: var(--muted);
      font-size: 9px;
      text-transform: uppercase;
    }

    .mini-stat div:last-child {
      color: var(--green);
      font-size: 14px;
      margin-top: 3px;
    }

    .footer {
      color: var(--muted);
      font-size: 11px;
      margin-top: 18px;
      text-align: center;
    }

    @media (max-width: 1100px) {
      .hud,
      .layout,
      .controls {
        grid-template-columns: 1fr;
      }

      .stats {
        grid-template-columns: repeat(2, minmax(100px, 1fr));
      }

      .side {
        position: static;
        max-height: none;
      }
    }
  </style>
</head>
<body>
  <main class="crt">
    <section class="hud">
      <div>
        <h1 class="title">PROBE.EXE: FILE QUEST</h1>
        <p class="subtitle">DISCOVERY RUN // ${escapeHtml(projectMap.rootPath)}</p>
        <p class="subtitle">SCAN TIME // ${escapeHtml(projectMap.scannedAt)}</p>
      </div>
      <div class="stats">
        ${stat("FILES", projectMap.summary.filesScanned)}
        ${stat("ZONES", projectMap.summary.foldersScanned)}
        ${stat("RISKS", projectMap.summary.risksFound)}
        ${stat("LEVEL", projectMap.summary.level)}
      </div>
    </section>

    <section class="controls">
      <input id="searchInput" class="control" placeholder="Search rooms, paths, signals..." />
      <select id="zoneSelect" class="control-select"></select>
      <select id="roleSelect" class="control-select">
        <option value="all">All roles</option>
      </select>
      <button id="riskOnly" class="toggle" type="button">Risk only</button>
      <button id="landmarksOnly" class="toggle" type="button">Landmarks only</button>
    </section>

    <section class="layout">
      <div class="viewport">
        <div class="orb-row">
          <div class="orb"></div>
          <div>VISION ORB ONLINE // ${projectMap.summary.xpEarned} XP // ${landmarkCount} LANDMARKS // ${riskRooms.length} RISK ROOMS</div>
        </div>

        <div id="renderStatus" class="render-status"></div>
        <div id="zoneContainer"></div>
      </div>

      <aside class="side">
        <div class="panel-title">Room Inspector</div>
        <div id="roomInspector">
          <div class="inspector-value">Select a room to inspect file data.</div>
        </div>
      </aside>
    </section>

    <div class="footer">
      Probe.exe generated this local report from read-only scan data. No project files were modified.
    </div>
  </main>

  <script>
    const PROBE_DATA = ${safeDataJson};
    const RENDER_LIMIT = 450;
    const state = {
      search: "",
      zone: "all",
      role: "all",
      riskOnly: false,
      landmarksOnly: false,
      selectedPath: ""
    };

    function escapeHtmlClient(value) {
      return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
    }

    function roomMatches(room) {
      const query = state.search.trim().toLowerCase();
      const haystack = [
        room.name,
        room.path,
        room.folder,
        room.role,
        room.roomType,
        ...(room.signals || [])
      ].join(" ").toLowerCase();

      if (query && !haystack.includes(query)) return false;
      if (state.zone !== "all" && room.folder !== state.zone) return false;
      if (state.role !== "all" && room.role !== state.role) return false;
      if (state.riskOnly && room.riskLevel === "none") return false;
      if (state.landmarksOnly && !room.landmark) return false;

      return true;
    }

    function getFilteredRooms() {
      return PROBE_DATA.rooms.filter(roomMatches);
    }

    function groupByZone(rooms) {
      const groups = new Map();

      for (const room of rooms) {
        const key = room.folder || "root";
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(room);
      }

      return Array.from(groups.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    }

    function render() {
      const allFiltered = getFilteredRooms();
      const visibleRooms = allFiltered.slice(0, RENDER_LIMIT);
      const groups = groupByZone(visibleRooms);
      const container = document.getElementById("zoneContainer");
      const status = document.getElementById("renderStatus");

      status.textContent = "DISPLAYING " + visibleRooms.length + " OF " + allFiltered.length + " MATCHING ROOMS // TOTAL ROOMS " + PROBE_DATA.rooms.length;

      if (allFiltered.length > RENDER_LIMIT) {
        status.textContent += " // NARROW SEARCH TO REVEAL DEEPER ROOMS";
      }

      if (visibleRooms.length === 0) {
        container.innerHTML = '<section class="zone"><div class="zone-title">NO ROOMS MATCH CURRENT FILTERS</div></section>';
        return;
      }

      container.innerHTML = groups.map(([zoneName, rooms]) => {
        return (
          '<section class="zone">' +
            '<div class="zone-header">' +
              '<div class="zone-title">' + escapeHtmlClient(zoneName) + '</div>' +
              '<div class="zone-meta">' + rooms.length + ' VISIBLE ROOMS</div>' +
            '</div>' +
            '<div class="corridor">' +
              rooms.map(roomCard).join("") +
            '</div>' +
          '</section>'
        );
      }).join("");

      if (!state.selectedPath && visibleRooms.length > 0) {
        state.selectedPath = visibleRooms[0].path;
      }

      markSelected();
    }

    function roomCard(room) {
      const riskClass = room.riskLevel !== "none" ? " risk-" + room.riskLevel : "";
      const landmarkClass = room.landmark ? " landmark" : "";
      const selectedClass = room.path === state.selectedPath ? " selected" : "";
      const signalBadges = (room.signals || []).slice(0, 2).map((signal) => {
        return '<span class="badge signal-badge">' + escapeHtmlClient(signal) + '</span>';
      }).join("");

      return (
        '<article class="room' + landmarkClass + riskClass + selectedClass + '" data-room-path="' + escapeHtmlClient(room.path) + '" onclick="inspectRoom(this.dataset.roomPath)" role="button" tabindex="0">' +
          '<div class="room-name">' + escapeHtmlClient(room.name) + '</div>' +
          '<div class="room-role">' + escapeHtmlClient(room.roomType) + ' // ' + escapeHtmlClient(room.role) + '</div>' +
          '<div class="room-path">' + escapeHtmlClient(room.path) + '</div>' +
          (room.landmark ? '<span class="badge">Landmark</span>' : '') +
          (room.riskLevel !== "none" ? '<span class="badge risk-badge">Risk: ' + escapeHtmlClient(room.riskLevel) + '</span>' : '') +
          signalBadges +
        '</article>'
      );
    }

    function inspectRoom(path) {
      const room = PROBE_DATA.rooms.find((item) => item.path === path);
      const panel = document.getElementById("roomInspector");
      if (!room || !panel) return;

      state.selectedPath = path;
      markSelected();

      const signals = room.signals && room.signals.length
        ? room.signals.map((signal) => '<span class="badge signal-badge">' + escapeHtmlClient(signal) + '</span>').join("")
        : '<div class="inspector-value">No special source signals detected.</div>';

      const findingsHtml = room.findings && room.findings.length
        ? room.findings.map((finding) => (
            '<div class="finding">' +
              '<div class="sev">' + escapeHtmlClient(finding.severity) + ' // ' + escapeHtmlClient(finding.category) + '</div>' +
              '<div class="find-title">' + escapeHtmlClient(finding.title) + '</div>' +
              '<div class="msg">' + escapeHtmlClient(finding.message) + '</div>' +
              (finding.suggestedAction ? '<div class="msg">ACTION: ' + escapeHtmlClient(finding.suggestedAction) + '</div>' : '') +
            '</div>'
          )).join("")
        : '<div class="finding"><div class="msg">No findings detected inside this room.</div></div>';

      panel.innerHTML =
        '<div class="inspector-label">File</div>' +
        '<div class="inspector-value">' + escapeHtmlClient(room.name) + '</div>' +
        '<div class="inspector-label">Path</div>' +
        '<div class="inspector-value">' + escapeHtmlClient(room.path) + '</div>' +
        '<div class="inspector-label">Role</div>' +
        '<div class="inspector-value">' + escapeHtmlClient(room.role) + ' / ' + escapeHtmlClient(room.roomType) + '</div>' +
        '<div class="mini-grid">' +
          '<div class="mini-stat"><div>Lines</div><div>' + escapeHtmlClient(room.lineCount || 0) + '</div></div>' +
          '<div class="mini-stat"><div>Imports</div><div>' + escapeHtmlClient(room.importCount || 0) + '</div></div>' +
          '<div class="mini-stat"><div>Exports</div><div>' + escapeHtmlClient(room.exportCount || 0) + '</div></div>' +
        '</div>' +
        '<div class="inspector-label">Risk Level</div>' +
        '<div class="inspector-value">' + escapeHtmlClient(room.riskLevel) + '</div>' +
        '<div class="inspector-label">XP Value</div>' +
        '<div class="inspector-value">' + escapeHtmlClient(room.xpValue) + '</div>' +
        '<div class="inspector-label">Size</div>' +
        '<div class="inspector-value">' + Math.round(Number(room.sizeBytes) / 1024 * 10) / 10 + ' KB</div>' +
        '<div class="inspector-label">Signals</div>' +
        '<div>' + signals + '</div>' +
        '<div class="inspector-label">Findings</div>' +
        findingsHtml;
    }

    function markSelected() {
      document.querySelectorAll(".room").forEach((el) => {
        if (el.dataset.roomPath === state.selectedPath) {
          el.classList.add("selected");
        } else {
          el.classList.remove("selected");
        }
      });
    }

    function setupControls() {
      const zoneSelect = document.getElementById("zoneSelect");
      const roleSelect = document.getElementById("roleSelect");
      const searchInput = document.getElementById("searchInput");
      const riskOnly = document.getElementById("riskOnly");
      const landmarksOnly = document.getElementById("landmarksOnly");

      zoneSelect.innerHTML = '<option value="all">All zones</option>' + PROBE_DATA.zones
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((zone) => '<option value="' + escapeHtmlClient(zone.name === "root" ? "" : zone.name) + '">' + escapeHtmlClient(zone.name) + ' (' + zone.roomCount + ')</option>')
        .join("");

      const roles = Array.from(new Set(PROBE_DATA.rooms.map((room) => room.role))).sort();
      roleSelect.innerHTML = '<option value="all">All roles</option>' + roles
        .map((role) => '<option value="' + escapeHtmlClient(role) + '">' + escapeHtmlClient(role) + '</option>')
        .join("");

      searchInput.addEventListener("input", function (event) {
        state.search = event.target.value;
        state.selectedPath = "";
        render();
      });

      zoneSelect.addEventListener("change", function (event) {
        state.zone = event.target.value;
        state.selectedPath = "";
        render();
      });

      roleSelect.addEventListener("change", function (event) {
        state.role = event.target.value;
        state.selectedPath = "";
        render();
      });

      riskOnly.addEventListener("click", function () {
        state.riskOnly = !state.riskOnly;
        riskOnly.classList.toggle("active", state.riskOnly);
        state.selectedPath = "";
        render();
      });

      landmarksOnly.addEventListener("click", function () {
        state.landmarksOnly = !state.landmarksOnly;
        landmarksOnly.classList.toggle("active", state.landmarksOnly);
        state.selectedPath = "";
        render();
      });
    }

    document.addEventListener("DOMContentLoaded", function () {
      setupControls();
      render();

      const firstRoom = getFilteredRooms()[0];
      if (firstRoom) inspectRoom(firstRoom.path);
    });
  </script>
</body>
</html>`;
}

function stat(label: string, value: number): string {
  return `
    <div class="stat">
      <div class="label">${escapeHtml(label)}</div>
      <div class="value">${value}</div>
    </div>
  `;
}

function escapeHtml(value: string | number): string {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
