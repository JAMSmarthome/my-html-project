const express = require("express");
const fs = require("fs");
const path = require("path");
const session = require("express-session");
const bodyParser = require("body-parser");

const app = express();
const PORT = 3000;
const alertLogFile = path.join(__dirname, "alerts.json");

// --- Middleware ---
app.use(bodyParser.json());
app.use(express.static("public"));
app.use(session({
  secret: "secret-key",
  resave: false,
  saveUninitialized: true
}));

// --- In-memory Clients and API Keys ---
const clients = {
  test: [],
  operator: [],
  client1: [],
  client2: []
};

const API_KEYS = {
  test: "TEST_API_KEY_123456",
  client1: "CLIENT1_API_KEY_abcdef",
  client2: "CLIENT2_API_KEY_xyz789"
};

// --- Load alerts ---
let alerts = [];
if (fs.existsSync(alertLogFile)) {
  alerts = JSON.parse(fs.readFileSync(alertLogFile));
}

// --- Auth Users ---
const allowedUsers = [
  { username: "admin", password: "admin123", type: "test" },
  { username: "operator", password: "operator123", type: "operator" },
  { username: "client1", password: "client1pass", type: "client1" },
  { username: "client2", password: "client2pass", type: "client2" }
];

// --- Login Endpoint ---
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  const user = allowedUsers.find(u => u.username === username && u.password === password);
  if (user) {
    req.session.user = { username: user.username, type: user.type };
    res.json({ success: true });
  } else {
    res.status(401).json({ error: "Invalid credentials" });
  }
});

// --- SSE Stream ---
app.get("/api/sse", (req, res) => {
  const target = req.query.target;
  if (!clients[target]) return res.status(400).end();

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  clients[target].push(res);
  req.on("close", () => {
    clients[target] = clients[target].filter(c => c !== res);
  });
});

// --- Broadcast Function ---
function broadcastTo(target, message) {
  const json = `data: ${JSON.stringify(message)}\n\n`;
  if (clients[target]) {
    clients[target].forEach(res => res.write(json));
  }
}

// --- Send Alert (With API Key Protection) ---
app.post("/api/send-alert", (req, res) => {
  const { title, procedure, steps, target } = req.body;
  const apiKey = req.headers["x-api-key"];

  if (!target || !clients[target]) {
    return res.status(400).json({ error: "Invalid target specified" });
  }

  if (!apiKey || apiKey !== API_KEYS[target]) {
    return res.status(403).json({ error: "Forbidden – Invalid API Key" });
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

// --- Complete Alert ---
app.post("/api/complete", (req, res) => {
  const { alertId } = req.body;
  alerts = alerts.map(alert => alert.id === alertId ? { ...alert, completed: true } : alert);
  fs.writeFileSync(alertLogFile, JSON.stringify(alerts, null, 2));
  res.json({ success: true });
});

// --- Acknowledge From Client ---
app.post("/api/acknowledge-from-client", (req, res) => {
  const { client, originalTitle, receivedAt } = req.body;
  const alert = alerts.find(a => a.title === originalTitle);
  if (alert) {
    broadcastTo(alert.target, {
      type: "acknowledgment",
      acknowledgedBy: client,
      alertId: alert.id,
      receivedAt
    });
  }
  res.json({ success: true });
});

// --- Complete Alert (Detailed) ---
app.post("/api/complete-alert", (req, res) => {
  const { alertId, completedBy, steps } = req.body;
  const alert = alerts.find(a => a.id === alertId);
  if (alert) {
    alert.steps = steps;
    alert.completedBy = completedBy;
    alert.completedAt = new Date().toISOString();
    fs.writeFileSync(alertLogFile, JSON.stringify(alerts, null, 2));
    broadcastTo(alert.target, { type: "alert-completed", completedBy });
  }
  res.json({ success: true });
});

// --- Trigger Test Alert ---
app.post("/api/trigger-test", (req, res) => {
  const alert = {
    id: Date.now(),
    title: "🚨 Test Scenario Triggered",
    description: "This is a randomly triggered test scenario.",
    steps: ["Step A", "Step B", "Step C"],
    sla: 300,
    type: "new-alert",
    target: "test",
    createdAt: new Date().toISOString()
  };
  alerts.push(alert);
  fs.writeFileSync(alertLogFile, JSON.stringify(alerts, null, 2));
  broadcastTo("test", { type: "new-alert", alert });
  res.json({ success: true });
});

// --- Export Alerts as CSV ---
app.get("/api/export", (req, res) => {
  const headers = "ID,Title,Procedure,SLA,Created At,Completed,Completed By\n";
  const rows = alerts.map(a =>
    `${a.id},"${a.title}","${a.procedure || a.description}",${a.sla},"${a.createdAt}",${a.completed || false},"${a.completedBy || ""}"`
  );
  const csv = headers + rows.join("\n");
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=test-alerts-log.csv");
  res.send(csv);
});

// --- Start Server ---
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});