const express = require("express");
const session = require("express-session");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static("public"));
app.use(session({
  secret: "secret-key",
  resave: false,
  saveUninitialized: true
}));

// --- Authentication ---
const allowedUsers = [
  { username: "admin", password: "admin123", type: "test" },
  { username: "operator", password: "operator123", type: "operator" },
  { username: "client1", password: "client1pass", type: "client1" },
  { username: "client2", password: "client2pass", type: "client2" }
];

app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  const user = allowedUsers.find(u => u.username === username && u.password === password);
  if (user) {
    req.session.user = { username: user.username, type: user.type };
    res.json({ success: true, type: user.type });
  } else {
    res.status(401).json({ error: "Invalid credentials" });
  }
});

// --- SSE Connections ---
const clients = {
  test: [],
  operator: [],
  client1: [],
  client2: []
};

app.get("/api/sse", (req, res) => {
  const type = req.query.target || req.query.type;
  if (!type || !clients[type]) {
    return res.status(400).send("Invalid target type");
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  clients[type].push(res);

  req.on("close", () => {
    clients[type] = clients[type].filter(c => c !== res);
  });
});

// --- Broadcast Utility ---
function broadcastTo(target, data) {
  if (!clients[target]) return;
  clients[target].forEach(res => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  });
}

// --- In-Memory API Key Store ---
const apiKeys = {
  "client1-api-key": "client1",
  "client2-api-key": "client2"
};

// --- Alert Log ---
let alerts = [];
const alertLogFile = path.join(__dirname, "alerts.json");

// Load persisted alerts if available
if (fs.existsSync(alertLogFile)) {
  alerts = JSON.parse(fs.readFileSync(alertLogFile));
}

// --- Trigger Test Alerts ---
app.post("/api/trigger-test", (req, res) => {
  const alert = {
    id: Date.now(),
    title: "🚨 TEST ALERT",
    description: "This is a simulated test alert",
    steps: ["Confirm dispatch", "Notify client", "Log reference"],
    sla: 300,
    type: "new-alert",
    target: req.body.target || "test",
    createdAt: new Date().toISOString(),
    test: true
  };

  alerts.push(alert);
  fs.writeFileSync(alertLogFile, JSON.stringify(alerts, null, 2));

  broadcastTo(alert.target, { type: "new-alert", alert });
  res.json({ success: true });
});

// --- Send Alert via API ---
app.post("/api/send-alert", (req, res) => {
  const { title, procedure, steps, target } = req.body;

  if (!target || !clients[target]) {
    return res.status(400).json({ error: "Invalid target specified" });
  }

  const alert = {
    id: Date.now(),
    title,
    procedure,
    steps,
    sla: 300,
    type: "new-alert",
    target,
    createdAt: new Date().toISOString()
  };

  alerts.push(alert);
  fs.writeFileSync(alertLogFile, JSON.stringify(alerts, null, 2));
  broadcastTo(target, { type: "new-alert", alert });
  res.json({ success: true });
});

// --- API: Receive from third party ---
app.post("/api/receive-from-third-party", (req, res) => {
  const apiKey = req.headers["x-api-key"];
  const clientType = apiKeys[apiKey];
  if (!clientType) {
    return res.status(403).json({ error: "Invalid API Key" });
  }

  const { title, procedure, steps } = req.body;
  const alert = {
    id: Date.now(),
    title,
    procedure,
    steps,
    sla: 300,
    type: "new-alert",
    target: clientType,
    createdAt: new Date().toISOString()
  };

  alerts.push(alert);
  fs.writeFileSync(alertLogFile, JSON.stringify(alerts, null, 2));
  broadcastTo(clientType, { type: "new-alert", alert });
  res.json({ success: true });
});

// --- Complete Alert ---
app.post("/api/complete", (req, res) => {
  const { alertId } = req.body;
  const alert = alerts.find(a => a.id === alertId);
  if (alert) {
    alert.completed = true;
    alert.completedAt = new Date().toISOString();
    broadcastTo(alert.target, { type: "alert-completed", alert });
    fs.writeFileSync(alertLogFile, JSON.stringify(alerts, null, 2));
  }
  res.json({ success: true });
});

// --- Export CSV ---
app.get("/api/export", (req, res) => {
  const headers = "ID,Title,Type,CreatedAt,Completed,CompletedAt\n";
  const rows = alerts.map(a =>
    `${a.id},"${a.title}",${a.target},${a.createdAt},${a.completed || false},${a.completedAt || ""}`
  ).join("\n");

  const csv = headers + rows;
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=alerts.csv");
  res.send(csv);
});

app.listen(PORT, () => {
  console.log(`🚨 Server running on http://localhost:${PORT}`);
});