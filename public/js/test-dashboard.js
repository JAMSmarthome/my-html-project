// public/js/test-dashboard.js

let currentAlert = null;
let checklistSteps = [];
let slaTimer = null;
let slaCountdown = 10;
let testAlertActive = false;
let inactivityTimer = null;
let operator = "Test Dashboard";

const testScenarios = [
  {
    title: "Fire in Data Center",
    procedure: "Follow fire emergency protocol",
    steps: [
      "Activate fire alarm",
      "Evacuate building",
      "Call fire department",
      "Shut down servers",
      "Log the incident"
    ]
  },
  {
    title: "Network Outage",
    procedure: "Follow network troubleshooting SOP",
    steps: [
      "Verify network cable",
      "Restart router",
      "Notify IT team",
      "Switch to backup line",
      "Document issue in log"
    ]
  },
];

// DOM Elements
const noAlertEl = document.getElementById("noAlert");
const activeAlertEl = document.getElementById("activeAlert");
const alertTitleEl = document.getElementById("alertTitle");
const alertDetailsEl = document.getElementById("alertDetails");
const acknowledgeBtn = document.getElementById("acknowledgeBtn");
const checklistSection = document.getElementById("checklistSection");
const checklistContainer = document.getElementById("checklistContainer");
const completeBtn = document.getElementById("completeBtn");

const slaDisplay = document.createElement("div");
slaDisplay.id = "slaTimer";
slaDisplay.style.margin = "10px 0";
slaDisplay.style.fontWeight = "bold";
slaDisplay.style.color = "#dc3545";
acknowledgeBtn.before(slaDisplay);

// Reset Inactivity Timer
function resetInactivityTimer() {
  clearTimeout(inactivityTimer);
  const randomDelay = Math.floor(Math.random() * 51 + 10) * 1000; // 10–60 sec
  inactivityTimer = setTimeout(() => {
    if (!testAlertActive) triggerTestScenario();
  }, randomDelay);
}

["click", "mousemove", "keydown"].forEach(evt =>
  document.addEventListener(evt, resetInactivityTimer)
);

resetInactivityTimer();

// SSE Connection
const eventSource = new EventSource("/api/sse");

eventSource.onmessage = function (event) {
  const data = JSON.parse(event.data);
  if (data.type === "new-alert") {
    currentAlert = data.alert;
    testAlertActive = true;
    checklistSteps = currentAlert.steps.map(step => ({ text: step, completed: false }));

    noAlertEl.style.display = "none";
    activeAlertEl.style.display = "block";
    alertTitleEl.textContent = currentAlert.title;
    alertDetailsEl.textContent = `ID: ${currentAlert.id} | Procedure: ${currentAlert.procedure}`;
    checklistSection.style.display = "none";
    completeBtn.disabled = true;

    animateAlert();
    startSlaTimer();
  }

  if (data.type === "acknowledgment" && currentAlert && data.alertId === currentAlert.id) {
    stopSlaTimer();
  }

  if (data.type === "alert-completed" && currentAlert && data.alertId === currentAlert.id) {
    alert(`Alert \"${currentAlert.title}\" has been completed by ${data.completedBy}.`);
    resetDashboard();
  }
};

acknowledgeBtn.addEventListener("click", async () => {
  if (!currentAlert) return;
  try {
    await fetch("/api/acknowledge-from-client", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client: operator,
        originalTitle: currentAlert.title,
        receivedAt: new Date().toISOString()
      })
    });
    renderChecklist();
    stopSlaTimer();
  } catch (error) {
    console.error("Error acknowledging alert:", error);
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
        completedBy: operator,
        steps: checklistSteps
      })
    });
    resetDashboard();
  } catch (error) {
    console.error("Error completing alert:", error);
  }
});

function renderChecklist() {
  checklistSection.style.display = "block";
  checklistContainer.innerHTML = "";
  checklistSteps.forEach((step, index) => {
    const div = document.createElement("div");
    div.className = "checklist-item";

    if (step.text === "______") {
      div.innerHTML = `
        <input type="text" id="input${index}" placeholder="Enter step...">
      `;
      checklistContainer.appendChild(div);
      const inputEl = document.getElementById(`input${index}`);
      inputEl.addEventListener("input", (e) => {
        const val = e.target.value.trim();
        checklistSteps[index].text = val || "______";
        checklistSteps[index].completed = !!val;
        checkIfAllCompleted();
      });
    } else {
      div.innerHTML = `
        <input type="checkbox" id="chk${index}">
        <label for="chk${index}">${step.text}</label>
      `;
      checklistContainer.appendChild(div);
      document.getElementById(`chk${index}`).addEventListener("change", (e) => {
        checklistSteps[index].completed = e.target.checked;
        div.classList.toggle("completed", e.target.checked);
        checkIfAllCompleted();
      });
    }
  });
}

function checkIfAllCompleted() {
  const allDone = checklistSteps.every(step => step.completed);
  completeBtn.disabled = !allDone;
}

function resetDashboard() {
  currentAlert = null;
  checklistSteps = [];
  activeAlertEl.style.display = "none";
  noAlertEl.style.display = "block";
  noAlertEl.textContent = "Waiting for new alerts...";
  slaDisplay.textContent = "";
  stopSlaTimer();
  testAlertActive = false;
  resetInactivityTimer();
}

function startSlaTimer() {
  slaCountdown = 10;
  slaDisplay.textContent = `⏳ SLA: ${slaCountdown}s to acknowledge...`;
  slaTimer = setInterval(() => {
    slaCountdown--;
    if (slaCountdown > 0) {
      slaDisplay.textContent = `⏳ SLA: ${slaCountdown}s to acknowledge...`;
    } else {
      slaDisplay.textContent = "❌ SLA missed!";
      clearInterval(slaTimer);
    }
  }, 1000);
}

function stopSlaTimer() {
  clearInterval(slaTimer);
  slaDisplay.textContent = "";
}

function animateAlert() {
  const alertBox = document.getElementById("alertBox");
  alertBox.classList.add("flashing");
  setTimeout(() => alertBox.classList.remove("flashing"), 5000);
}

function triggerTestScenario() {
  if (testAlertActive) return;
  const scenario = testScenarios[Math.floor(Math.random() * testScenarios.length)];
  const randomizedSteps = scenario.steps.map(step => ({ text: step, fill: false }));
  const blankCount = Math.floor(Math.random() * 3) + 1;
  const indices = [...randomizedSteps.keys()].sort(() => 0.5 - Math.random()).slice(0, blankCount);
  indices.forEach(i => {
    randomizedSteps[i].fill = true;
    randomizedSteps[i].text = "______";
  });

  const generatedAlert = {
    title: scenario.title,
    procedure: scenario.procedure,
    steps: randomizedSteps.map(s => s.text),
    id: "test-" + Date.now(),
    receivedAt: new Date().toISOString(),
    via: "Random Test Trigger"
  };

  eventSource.onmessage({
    data: JSON.stringify({
      type: "new-alert",
      alert: generatedAlert
    })
  });
}