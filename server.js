// server.js
const express = require("express");
const session = require("express-session");
const bcrypt = require("bcrypt");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = 3000;

// --- Middleware ---
app.use(cors());
app.use(express.json());
app.use(express.static("public"));
app.use(
  session({
    secret: "super-secret-key",
    resave: false,
    saveUninitialized: false,
  })
);

// --- Lanes + Credentials ---
// username -> { passwordHash, lane }
const users = {
  admin: {
    passwordHash: bcrypt.hashSync("admin123", 10),
    lane: "operator",
  },
  test: {
    passwordHash: bcrypt.hashSync("test123", 10),
    lane: "test",
  },
  client1: {
    passwordHash: bcrypt.hashSync("client1pass", 10),
    lane: "Client1",
  },
  client2: {
    passwordHash: bcrypt.hashSync("client2pass", 10),
    lane: "Client2",
  },
  MockClient1: {
    passwordHash: bcrypt.hashSync("password", 10), // hashed version of "password"
    lane: "MockClient1",
  },
};

// --- Active SSE Connections per Lane ---
const clients = {}; // { laneName: [res, res, ...] }

// --- Alerts persistence ---
const ALERTS_FILE = path.join(__dirname, "alerts.json");

function loadAlerts() {
  if (fs.existsSync(ALERTS_FILE)) {
    return JSON.parse(fs.readFileSync(ALERTS_FILE));
  }
  return [];
}

function saveAlerts(alerts) {
  fs.writeFileSync(ALERTS_FILE, JSON.stringify(alerts, null, 2));
}

let alerts = loadAlerts();

// --- Auth Routes ---
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  const user = users[username];

  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) return res.status(401).json({ error: "Invalid credentials" });

  req.session.user = { username, lane: user.lane };
  return res.json({ success: true, lane: user.lane });
});

app.post("/api/logout", (req, res) => {
  req.session.destroy(() => res.json({ success: true }));
});

// --- SSE Endpoint per Lane ---
app.get("/api/sse", (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const lane = req.session.user.lane;

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  if (!clients[lane]) clients[lane] = [];
  clients[lane].push(res);

  // Send existing alerts for this lane
  alerts
    .filter((a) => a.lane === lane)
    .forEach((a) => res.write(`data: ${JSON.stringify(a)}\n\n`));

  req.on("close", () => {
    clients[lane] = clients[lane].filter((c) => c !== res);
  });
});

// --- Broadcast helper ---
function broadcastAlert(alert) {
  if (clients[alert.lane]) {
    clients[alert.lane].forEach((res) =>
      res.write(`data: ${JSON.stringify(alert)}\n\n`)
    );
  }
}

// --- Trigger Alert ---
app.post("/api/trigger", (req, res) => {
  const { type, message, lane } = req.body;

  if (!req.session.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const alert = {
    id: Date.now(),
    type: type || "test",
    message: message || "New alert triggered",
    lane: lane || req.session.user.lane,
    status: "active",
    timestamp: new Date().toISOString(),
  };

  alerts.push(alert);
  saveAlerts(alerts);

  broadcastAlert(alert);

  res.json({ success: true, alert });
});

// --- Acknowledge Alert ---
app.post("/api/acknowledge", (req, res) => {
  const { alertId } = req.body;
  const userLane = req.session.user?.lane;

  const alert = alerts.find((a) => a.id === alertId && a.lane === userLane);
  if (!alert) return res.status(404).json({ error: "Alert not found" });

  alert.status = "acknowledged";
  saveAlerts(alerts);
  broadcastAlert(alert);

  res.json({ success: true, alert });
});

// --- Complete Alert ---
app.post("/api/complete", (req, res) => {
  const { alertId } = req.body;
  const userLane = req.session.user?.lane;

  const alert = alerts.find((a) => a.id === alertId && a.lane === userLane);
  if (!alert) return res.status(404).json({ error: "Alert not found" });

  alert.status = "completed";
  saveAlerts(alerts);
  broadcastAlert(alert);

  res.json({ success: true, alert });
});

// --- Start Server ---
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
  console.log("   Lanes:", Object.values(users).map((u) => u.lane).join(", "));
});