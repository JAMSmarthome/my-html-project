// public/js/mock-client.js

let currentAlert = null;
let checklistSteps = [];
const logContainer = document.getElementById("log");
const clientIdInput = document.getElementById("clientId");

function log(message) {
  const p = document.createElement("p");
  p.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
  logContainer.appendChild(p);
  logContainer.scrollTop = logContainer.scrollHeight;
}

// Listen for real-time alerts via SSE
const eventSource = new EventSource("/api/sse");

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === "new-alert") {
    handleAlert(data.alert);
  } else if (data.type === "acknowledgment") {
    log(`✅ Alert ${data.alertId} acknowledged by ${data.acknowledgedBy}`);
  } else if (data.type === "alert-completed") {
    log(`✅ Alert ${data.alertId} completed by ${data.completedBy}`);
  }
};

function handleAlert(alert) {
  currentAlert = alert;
  checklistSteps = alert.steps.map(step => ({ text: step, completed: false }));

  log(`🚨 New Alert: ${alert.title} | Procedure: ${alert.procedure}`);

  checklistSteps.forEach((step, i) => {
    log(`⬜ Step ${i + 1}: ${step.text || step}`);
  });

  acknowledgeAlert();
}

async function acknowledgeAlert() {
  if (!currentAlert) return;
  const client = clientIdInput.value || "MockClient";
  try {
    await fetch("/api/acknowledge-from-client", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client,
        originalTitle: currentAlert.title,
        receivedAt: new Date().toISOString()
      })
    });
    log(`📬 Acknowledged alert "${currentAlert.title}" as ${client}`);
    completeAlert(); // Automatically proceed to simulate completion
  } catch (err) {
    log(`❌ Failed to acknowledge alert: ${err.message}`);
  }
}

async function completeAlert() {
  if (!currentAlert) return;
  const client = clientIdInput.value || "MockClient";

  // Simulate completing all steps
  checklistSteps.forEach(s => (s.completed = true));

  try {
    await fetch("/api/complete-alert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        alertId: currentAlert.id,
        completedBy: client,
        steps: checklistSteps
      })
    });
    log(`✅ Completed alert "${currentAlert.title}" as ${client}`);
    currentAlert = null;
  } catch (err) {
    log(`❌ Failed to complete alert: ${err.message}`);
  }
}