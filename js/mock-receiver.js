const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");

const app = express();
const PORT = 4000;

app.use(bodyParser.json());

// Receive alert from main system
app.post("/receive-alert", async (req, res) => {
  const alert = req.body;
  console.log("📥 Mock Receiver: Alert received:", alert);

  // Respond immediately to main system
  res.json({ status: "received", receivedAt: new Date().toISOString() });

  // Simulate acknowledgment back to main system after 3 seconds
  setTimeout(async () => {
    try {
      await axios.post("http://localhost:3000/api/acknowledge-from-client", {
        client: "MockReceiver",
        id: alert.id,
        receivedAt: new Date().toISOString()
      });
      console.log(`✅ Mock Receiver: Sent acknowledgment for alert ID ${alert.id}`);
    } catch (error) {
      console.error("❌ Failed to send acknowledgment:", error.message);
    }
  }, 3000);
});

app.listen(PORT, () => {
  console.log(`📡 Mock Receiver running at http://localhost:${PORT}/receive-alert`);
});