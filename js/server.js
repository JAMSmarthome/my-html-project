const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const axios = require("axios");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

let testAlerts = []; // Store alerts for demo or logging

// Config
const THIRD_PARTY_URL = "http://localhost:4000/receive-alert";

// Endpoint to receive test alert requests
app.post("/api/test-alert", async (req, res) => {
  const alertData = req.body;
  alertData.receivedAt = new Date().toISOString();
  testAlerts.push(alertData);

  console.log("Received test alert:", alertData);

  // Push to third-party API using Axios
  try {
    const response = await axios.post(THIRD_PARTY_URL, alertData, {
      timeout: 5000, // 5 sec timeout
    });
    console.log("Third-party response:", response.data);

    // Log success and respond
    testAlerts[testAlerts.length - 1].thirdPartyResponse = response.data;
    res.json({
      status: "success",
      message: "Alert forwarded to third-party successfully",
      thirdPartyResponse: response.data,
    });
  } catch (error) {
    console.error("Failed to push alert to third-party:", error.message);

    // Log failure
    testAlerts[testAlerts.length - 1].thirdPartyError = error.message;

    // Just log failure for now, respond anyway
    res.status(500).json({
      status: "error",
      message: "Failed to forward alert to third-party",
      error: error.message,
    });
  }
});

// Simple route to get all test alerts and logs
app.get("/api/alerts", (req, res) => {
  res.json(testAlerts);
});

app.listen(PORT, () => {
  console.log(`🚀 Test Alert API server running at http://localhost:${PORT}`);
});