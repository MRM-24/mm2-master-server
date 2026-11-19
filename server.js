const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// In-memory room and server store
let activeRooms = [
  {
    id: "room-default",
    name: "Community Room 1",
    isPrivate: false,
    secondsRemaining: 600,
    currentPlayers: 1,
    maxPlayers: 6,
    hostIp: "127.0.0.1",
    hostPort: 4267,
    lastHeartbeat: Date.now()
  }
];

// Clean up stale rooms older than 2 minutes
setInterval(() => {
  const now = Date.now();
  activeRooms = activeRooms.filter(r => (now - r.lastHeartbeat) < 120000 || r.id === "room-default");
}, 30000);

// --- 1. Web Status Dashboard ---
app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Mini Militia 4.3.5 Custom Master Server</title>
        <style>
          body { font-family: -apple-system, sans-serif; background: #1a1a2e; color: #e0e0e0; padding: 2rem; }
          h1 { color: #4ecca3; }
          .card { background: #162447; border-radius: 8px; padding: 1.5rem; margin-top: 1rem; }
          table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
          th, td { padding: 0.75rem; text-align: left; border-bottom: 1px solid #1f4068; }
          th { color: #4ecca3; }
          .badge { background: #e94560; color: #fff; padding: 0.2rem 0.6rem; border-radius: 4px; font-size: 0.8rem; }
        </style>
      </head>
      <body>
        <h1>🎮 Mini Militia 4.3.5 Custom Master Server</h1>
        <p>Status: <span style="color:#4ecca3;font-weight:bold;">ONLINE</span></p>
        <div class="card">
          <h2>Active Game Rooms (${activeRooms.length})</h2>
          <table>
            <tr><th>Room ID</th><th>Name</th><th>Host IP:Port</th><th>Players</th><th>Private</th></tr>
            ${activeRooms.map(r => `
              <tr>
                <td><code>${r.id}</code></td>
                <td><strong>${r.name}</strong></td>
                <td>${r.hostIp}:${r.hostPort}</td>
                <td>${r.currentPlayers}/${r.maxPlayers}</td>
                <td>${r.isPrivate ? '<span class="badge">Yes</span>' : 'No'}</td>
              </tr>
            `).join("")}
          </table>
        </div>
      </body>
    </html>
  `);
});

// --- 2. Mini Militia Client API Endpoints ---

// General Config check
app.all("/games/doodlearmy2/api/app/general/config", (req, res) => {
  res.json({
    status: "SUCCESS",
    data: {
      maintenance: false,
      upgrade: false,
      minVersion: "4.3.5",
      latestVersion: "4.3.5",
      config: {
        serverTimestamp: Date.now()
      }
    }
  });
});

// Player Login
app.all("/games/doodlearmy2/api/login", (req, res) => {
  res.json({
    status: "SUCCESS",
    data: {
      accountId: "10001",
      token: "custom_session_token_" + Date.now(),
      nickname: "Commander",
      rank: 50,
      skills: 100,
      exp: 999999
    }
  });
});

// Session Create
app.all("/games/doodlearmy2/api/session/create", (req, res) => {
  res.json({
    status: "SUCCESS",
    st: "valid_session",
    ttl: 86400,
    pct: 1,
    sct: 1
  });
});

// Custom Server List (Requested by CustomServerLayer)
app.get("/v1/custom-servers", (req, res) => {
  res.json([
    {
      id: "srv-render-1",
      name: "Global Community Server",
      currentPlayers: activeRooms.reduce((acc, r) => acc + r.currentPlayers, 0),
      maxPlayers: 100,
      endpoints: [`${req.hostname}:4267`],
      ip4: req.hostname,
      port: 4267,
      SSL: false,
      token: "srv_token"
    }
  ]);
});

// Custom Rooms List for a server (Requested by CustomGameLayer)
app.get("/v1/custom-servers/:serverId/rooms", (req, res) => {
  res.json(activeRooms.map(r => ({
    id: r.id,
    name: r.name,
    isPrivate: r.isPrivate,
    secondsRemaining: r.secondsRemaining,
    currentPlayers: r.currentPlayers,
    maxPlayers: r.maxPlayers,
    endpoints: [`${r.hostIp}:${r.hostPort}`],
    ip4: r.hostIp,
    port: r.hostPort
  })));
});

// --- 3. Room Management REST API (For Players Hosting Games) ---

// Register or update a room from a phone or PC host
app.post("/api/rooms", (req, res) => {
  const { id, name, hostIp, hostPort, isPrivate, maxPlayers } = req.body;
  const clientIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "127.0.0.1";
  const finalIp = hostIp || clientIp.split(",")[0].trim();

  const existingIndex = activeRooms.findIndex(r => r.id === id);
  const roomData = {
    id: id || "room-" + Date.now(),
    name: name || "Custom Match",
    isPrivate: !!isPrivate,
    secondsRemaining: 600,
    currentPlayers: 1,
    maxPlayers: maxPlayers || 6,
    hostIp: finalIp,
    hostPort: hostPort || 4267,
    lastHeartbeat: Date.now()
  };

  if (existingIndex >= 0) {
    activeRooms[existingIndex] = { ...activeRooms[existingIndex], ...roomData };
  } else {
    activeRooms.push(roomData);
  }

  res.json({ success: true, room: roomData });
});

// Heartbeat endpoint to keep room active
app.post("/api/rooms/:id/heartbeat", (req, res) => {
  const room = activeRooms.find(r => r.id === req.params.id);
  if (room) {
    room.lastHeartbeat = Date.now();
    if (req.body.currentPlayers) room.currentPlayers = req.body.currentPlayers;
    res.json({ success: true });
  } else {
    res.status(404).json({ error: "Room not found" });
  }
});

// Remove room
app.delete("/api/rooms/:id", (req, res) => {
  activeRooms = activeRooms.filter(r => r.id !== req.params.id);
  res.json({ success: true });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Mini Militia Custom Master Server running on port ${PORT}`);
});
