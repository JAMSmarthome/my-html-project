// public/js/mock-client.js

const clientIdInput = document.getElementById("clientId");
const log = document.getElementById("log");

function logMessage(msg) {
  const p = document.createElement("p");
  p.textContent = msg;
  log.appendChild(p);
  log.scrollTop = log.scrollHeight;
}

// Connect to SSE
const eventSource = new EventSource("/api/sse");

eventSource.onmessage = function (event) {
  const data = JSON.parse(event.data);

  if (data.type === "new-alert") {
    const alert = data.alert;
    logMessage(`🚨 New Alert: ${alert.title} (ID: ${alert.id})`);

    // Automatically acknowledge after delay
    setTimeout(() => {
      fetch("/api/acknowledge-from-client", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client: clientIdInput.value || "MockClient",
          originalTitle: alert.title,
          receivedAt: new Date().toISOString(),
        }),
      })
      .then(() => logMessage(`✅ Acknowledged: ${alert.title}`))
      .catch(err => logMessage("❌ Acknowledge failed: " + err));
    }, 1000);

    // Automatically complete after another delay
    setTimeout(() => {
      fetch("/api/complete-alert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          alertId: alert.id,
          completedBy: clientIdInput.value || "MockClient",
          steps: alert.steps.map(s => ({ text: s, completed: true })),
        }),
      })
      .then(() => logMessage(`✅ Completed: ${alert.title}`))
      .catch(err => logMessage("❌ Completion failed: " + err));
    }, 3000);
  }

  if (data.type === "acknowledgment") {
    logMessage(`📬 Acknowledgment received for ${data.alertId} by ${data.acknowledgedBy}`);
  }

  if (data.type === "alert-completed") {
    logMessage(`🏁 Alert ${data.alertId} completed by ${data.completedBy}`);
  }
};