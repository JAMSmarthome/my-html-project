const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const axios = require("axios");
const { v4: uuidv4 } = require("uuid");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));

let testAlerts = [];
let sseClients = [];

// 🔐 Mock login users
const mockUsers = [
  { username: "operator1", password: "1234" },
  { username: "operator2", password: "5678" }
];

// 🔐 Login API
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;

  const user = mockUsers.find(u => u.username === username && u.password === password);
  if (!user) {
    return res.status(401).json({ status: "error", message: "Invalid credentials" });
  }

  console.log(`🔓 Operator logged in: ${username}`);
  res.json({ status: "success", operator: username });
});

// 🔐 Logout API (stateless for now)
app.post("/api/logout", (req, res) => {
  res.json({ status: "success", message: "Logged out" });
});

// ✅ SSE setup
app.get("/api/sse", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  sseClients.push(res);

  req.on("close", () => {
    sseClients = sseClients.filter(client => client !== res);
  });
});

function broadcastToClients(data) {
  const payload = `data: ${JSON.stringify(data)}\n\n`;
  sseClients.forEach(client => client.write(payload));
}

const THIRD_PARTY_URL = "http://localhost:4000/receive-alert";

// ✅ Trigger test alert
app.post("/api/test-alert", async (req, res) => {
  const alertData = req.body;
  alertData.id = uuidv4();
  alertData.receivedAt = new Date().toISOString();
  alertData.acknowledged = false;
  alertData.completed = false;
  alertData.via = "Manual Trigger";

  alertData.steps = alertData.steps || [
    "Verify incident details",
    "Notify supervisor",
    "Log event in system",
    "Check safety procedures",
    "Close the alert after validation"
  ];

  testAlerts.push(alertData);
  console.log("📥 Received test alert:", alertData);

  broadcastToClients({
    type: "new-alert",
    alert: alertData
  });

  // Skip third-party push for now unless mock is running
  res.json({
    status: "success",
    message: "Alert triggered and broadcasted successfully."
  });

  /*
  try {
    const response = await axios.post(THIRD_PARTY_URL, alertData, { timeout: 5000 });
    console.log("➡️ Third-party response:", response.data);

    testAlerts[testAlerts.length - 1].thirdPartyResponse = response.data;

    res.json({
      status: "success",
      message: "Alert forwarded to third-party successfully",
      thirdPartyResponse: response.data,
    });
  } catch (error) {
    console.error("❌ Failed to push alert to third-party:", error.message);

    testAlerts[testAlerts.length - 1].thirdPartyError = error.message;

    res.status(500).json({
      status: "error",
      message: "Failed to forward alert to third-party",
      error: error.message,
    });
  }
  */
});

// ✅ Acknowledge
app.post("/api/alerts/:id/acknowledge", (req, res) => {
  const id = req.params.id;
  const operator = req.body.operator;

  const alert = testAlerts.find(a => a.id === id);
  if (!alert) {
    return res.status(404).json({ status: "error", message: "Alert not found" });
  }

  alert.acknowledged = true;
  alert.acknowledgedBy = operator || "Unknown";
  alert.acknowledgedAt = new Date().toISOString();
  alert.via = "Manual Acknowledge";

  console.log(`✅ Alert ${id} acknowledged by ${operator}`);

  broadcastToClients({
    type: "acknowledgment",
    alertId: id,
    acknowledgedBy: operator,
    time: alert.acknowledgedAt
  });

  res.json({ status: "success", message: "Alert acknowledged" });
});

// ✅ All alert logs
app.get("/api/alerts", (req, res) => {
  res.json(testAlerts);
});

// ✅ API acknowledgment
app.post("/api/acknowledge-from-client", (req, res) => {
  const { client, originalTitle, receivedAt } = req.body;

  const alert = testAlerts.find(a => a.title === originalTitle);
  if (alert) {
    alert.acknowledged = true;
    alert.acknowledgedBy = client;
    alert.acknowledgedAt = receivedAt;
    alert.via = "API Push";

    console.log(`🔁 Alert acknowledged via API Push from ${client}`);

    broadcastToClients({
      type: "acknowledgment",
      alertId: alert.id,
      acknowledgedBy: client,
      time: receivedAt
    });

    res.json({ message: "Acknowledgment recorded." });
  } else {
    res.status(404).json({ message: "Alert not found" });
  }
});

// ✅ Complete alert
app.post("/api/complete-alert", (req, res) => {
  const { alertId, completedBy, steps } = req.body;

  const alert = testAlerts.find(a => a.id === alertId);
  if (!alert) {
    return res.status(404).json({ status: "error", message: "Alert not found" });
  }

  alert.completed = true;
  alert.completedBy = completedBy;
  alert.completedAt = new Date().toISOString();
  alert.steps = steps;

  console.log(`✅ Alert ${alertId} completed by ${completedBy}`);

  broadcastToClients({
    type: "alert-completed",
    alertId,
    completedBy
  });

  res.json({ status: "success", message: "Alert completed successfully" });
});

// ✅ Start server
app.listen(PORT, () => {
  console.log(`🚀 Test Alert API server running at http://localhost:${PORT}`);
});