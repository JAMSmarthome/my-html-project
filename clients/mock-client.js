// public/js/mock-client.js

let currentAlert = null;
let checklistSteps = [];

const mockName = "Mock Third-Party Client";

const alertBox = document.getElementById("alertBox");
const alertTitleEl = document.getElementById("alertTitle");
const alertDetailsEl = document.getElementById("alertDetails");
const checklistContainer = document.getElementById("checklistContainer");
const acknowledgeBtn = document.getElementById("acknowledgeBtn");
const completeBtn = document.getElementById("completeBtn");

function receiveAlert(alert) {
  currentAlert = alert;
  checklistSteps = alert.steps.map(step => ({ text: step, completed: false }));

  alertBox.style.display = "block";
  alertTitleEl.textContent = alert.title;
  alertDetailsEl.textContent = `ID: ${alert.id} | Procedure: ${alert.procedure}`;

  checklistContainer.innerHTML = "";
  checklistSteps.forEach((step, i) => {
    const item = document.createElement("div");
    item.className = "checklist-item";
    item.innerHTML = `
      <input type="checkbox" id="step${i}" />
      <label for="step${i}">${step}</label>
    `;
    checklistContainer.appendChild(item);

    document.getElementById(`step${i}`).addEventListener("change", e => {
      checklistSteps[i].completed = e.target.checked;
      checkIfAllCompleted();
    });
  });

  completeBtn.disabled = true;
}

function checkIfAllCompleted() {
  const allDone = checklistSteps.every(s => s.completed);
  completeBtn.disabled = !allDone;
}

acknowledgeBtn.addEventListener("click", async () => {
  if (!currentAlert) return;
  try {
    await fetch("/api/acknowledge-from-client", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client: mockName,
        originalTitle: currentAlert.title,
        receivedAt: new Date().toISOString(),
      })
    });
    alert("✅ Acknowledged!");
  } catch (err) {
    console.error("Acknowledge failed:", err);
  }
});

completeBtn.addEventListener("click", async () => {
  if (!currentAlert) return;
  try {
    await fetch("/api/complete-alert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        alertId: currentAlert.id,
        completedBy: mockName,
        steps: checklistSteps
      })
    });
    alert("✅ Completed!");
    resetUI();
  } catch (err) {
    console.error("Completion failed:", err);
  }
});

function resetUI() {
  currentAlert = null;
  checklistSteps = [];
  alertBox.style.display = "none";
}

// ✅ Enable SSE to listen for alerts from the server
const eventSource = new EventSource("/api/sse");

eventSource.onmessage = function (event) {
  const data = JSON.parse(event.data);
  if (data.type === "new-alert") {
    receiveAlert(data.alert);
  }
};