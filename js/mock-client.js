const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");

const app = express();
const PORT = 4000;

app.use(bodyParser.json());

// Endpoint to receive alert from main system
app.post("/receive-alert", async (req, res) => {
  const alert = req.body;
  console.log("🚨 Received alert from main system:");
  console.log(alert);

  // Simulate processing delay
  setTimeout(async () => {
    try {
      // Send acknowledgment back to main server
      await axios.post("http://localhost:3000/api/acknowledge-from-client", {
        client: "MockThirdPartySystem",
        originalTitle: alert.title,
        receivedAt: new Date().toISOString(),
      });

      console.log("✅ Acknowledgment sent back to main server");
    } catch (err) {
      console.error("❌ Failed to send acknowledgment back:", err.message);
    }
  }, 2000); // 2 second delay to simulate processing

  res.json({
    status: "received",
    receivedAt: new Date().toISOString(),
  });
});

app.listen(PORT, () => {
  console.log(`📡 Mock third-party server listening on http://localhost:${PORT}`);
});