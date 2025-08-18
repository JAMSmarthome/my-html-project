const express = require("express");
const fs = require("fs");
const path = require("path");
const session = require("express-session");
const bcrypt = require("bcrypt");
const cors = require("cors");

const app = express();
const PORT = 3000;
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

app.use(session({
  secret: "secure-key",
  resave: false,
  saveUninitialized: true,
}));

const alertLogFile = path.join(__dirname, "alerts.json");
let alerts = fs.existsSync(alertLogFile) ? JSON.parse(fs.readFileSync(alertLogFile)) : [];

const clients = {
  test: [],
  operator: [],
  client1: [],
  client2: []
};

// 🔐 Hashed user credentials
const allowedUsers = [
  { username: "admin", password: "$2b$10$Yas6N1PO.dGIgjNWXV5uI.YUAJ9fETfZviX7H.wjeCeOSZT20mpfu", type: "test" },
  { username: "operator", password: "$2b$10$Ft583hTCCvcZxnntSmRraezcCUCJT9mUPbSIaOMFYWCfwe2Z9HuJm", type: "operator" },
  { username: "client1", password: "$2b$10$QMWkZc73WqRahpIG1KI75eycOphS6QttnDE4P5HDDFTQ0GMhOyjMi", type: "client1" },
  { username: "client2", password: "$2b$10$fIfcuVuq1.EDucTWva0WLOAtdvvrI3WBKHwZ5eKpDJ3oJcmAAbJmm", type: "client2" }
];

// 🔐 Login endpoint
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  const user = allowedUsers.find(u => u.username === username);
  if (user && await bcrypt.compare(password, user.password)) {
    req.session.user = { username: user.username, type: user.type };
    res.json({ success: true });
  } else {
    res.status(401).json({ error: "Invalid credentials" });
  }
});

// 🛰️ SSE endpoint
app.get("/api/sse", (req, res) => {
  const target = req.query.target;
  if (!clients[target]) return res.status(400).end();

  res.set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive"
  });
  res.flushHeaders();

  clients[target].push(res);

  req.on("close", () => {
    clients[target] = clients[target].filter(client => client !== res);
  });
});

// 🚨 Send Alert via API
app.post("/api/send-alert", (req, res) => {
  const { title, procedure, steps, target } = req.body;

  if (!target || !clients[target]) {
    return res.status(400).json({ error: "Invalid target specified" });
  }

  const alert = {
    id: Date.now(),
    title,
    description: procedure,
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

// 🧪 Trigger test alert from inactivity
app.post("/api/trigger-test", (req, res) => {
  const { target } = req.body;
  if (!target || !clients[target]) return res.status(400).json({ error: "Invalid target" });

  const alert = {
    id: Date.now(),
    title: `Test Alert - ${new Date().toLocaleTimeString()}`,
    description: "This is a random test scenario",
    steps: ["Step 1: Verify alert", "Step 2: Follow SOP", "Step 3: Log outcome"],
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

// ✅ Acknowledge and complete alert
app.post("/api/complete", (req, res) => {
  const { alertId } = req.body;
  alerts = alerts.map(alert => alert.id === alertId ? { ...alert, completedAt: new Date().toISOString() } : alert);
  fs.writeFileSync(alertLogFile, JSON.stringify(alerts, null, 2));
  res.json({ success: true });
});

// 📦 Export alerts as CSV
app.get("/api/export", (req, res) => {
  const csv = [
    "ID,Title,Description,Steps,SLA,Target,Created At,Completed At",
    ...alerts.map(a => `${a.id},"${a.title}","${a.description}","${(a.steps || []).join(" | ")}",${a.sla},${a.target},${a.createdAt || ""},${a.completedAt || ""}`)
  ].join("\n");

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", 'attachment; filename="test-alerts-log.csv"');
  res.send(csv);
});

// 🔊 Broadcast function
function broadcastTo(target, data) {
  if (!clients[target]) return;
  const json = `data: ${JSON.stringify(data)}\n\n`;
  clients[target].forEach(client => client.write(json));
}

app.listen(PORT, () => {
  console.log(`🚨 Server running on http://localhost:${PORT}`);
});