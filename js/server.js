const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const axios = require("axios");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

let testAlerts = [];
let sseClients = []; // For browser connections

// SSE setup
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

// Config
const THIRD_PARTY_URL = "http://localhost:4000/receive-alert";

// Endpoint to receive test alert requests
app.post("/api/test-alert", async (req, res) => {
  const alertData = req.body;
  alertData.receivedAt = new Date().toISOString();
  alertData.acknowledged = false;
  alertData.via = "Manual Trigger";
  testAlerts.push(alertData);

  console.log("📥 Received test alert:", alertData);

  try {
    const response = await axios.post(THIRD_PARTY_URL, alertData, {
      timeout: 5000,
    });
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
});

// Manual acknowledgment by operator
app.post("/api/alerts/:index/acknowledge", (req, res) => {
  const index = parseInt(req.params.index, 10);
  const operator = req.body.operator;

  if (isNaN(index) || index < 0 || index >= testAlerts.length) {
    return res.status(404).json({ status: "error", message: "Invalid alert index" });
  }

  testAlerts[index].acknowledged = true;
  testAlerts[index].acknowledgedBy = operator || "Unknown";
  testAlerts[index].acknowledgedAt = new Date().toISOString();
  testAlerts[index].via = "Manual Acknowledge";

  console.log(`✅ Alert ${index} acknowledged by ${operator}`);
  res.json({ status: "success", message: "Alert acknowledged" });
});

// Get all alert logs
app.get("/api/alerts", (req, res) => {
  res.json(testAlerts);
});

// Handle callback/acknowledgment from 3rd party system
app.post("/api/acknowledge-from-client", (req, res) => {
  const { client, originalTitle, receivedAt } = req.body;

  const alert = testAlerts.find(a => a.title === originalTitle);
  if (alert) {
    alert.acknowledged = true;
    alert.acknowledgedBy = client;
    alert.acknowledgedAt = receivedAt;
    alert.via = "API Push";

    console.log(`🔁 Alert acknowledged via API Push from ${client}`);

    // 🔔 Broadcast acknowledgment to UI log
    broadcastToClients({
      type: "acknowledgment",
      source: client,
      title: originalTitle,
      time: receivedAt
    });

    res.json({ message: "Acknowledgment recorded." });
  } else {
    res.status(404).json({ message: "Alert not found" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Test Alert API server running at http://localhost:${PORT}`);
});