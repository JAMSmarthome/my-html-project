// test-dashboard.js

let operator = null;
let currentAlert = null;
let slaTimer = null;
let slaInterval = null;
let testAlertActive = false;
let lastActivityTime = Date.now();
let currentScenarioTitle = "";

const loginForm = document.getElementById("loginForm");
const loginScreen = document.getElementById("loginScreen");
const dashboard = document.getElementById("dashboard");

const noAlert = document.getElementById("noAlert");
const activeAlert = document.getElementById("activeAlert");
const alertBox = document.getElementById("alertBox");
const alertTitle = document.getElementById("alertTitle");
const alertDetails = document.getElementById("alertDetails");
const acknowledgeBtn = document.getElementById("acknowledgeBtn");
const checklistSection = document.getElementById("checklistSection");
const checklistContainer = document.getElementById("checklistContainer");
const completeBtn = document.getElementById("completeBtn");

// 🔐 Login handler
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  try{
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();
    if (data.status === "success") {
      operator = data.operator;
      loginScreen.style.display = "none";
      dashboard.style.display = "block";
    } else {
      alert("Login failed: " + data.message);
    }
  } catch (err) {
    alert("Login error: " + err.message);
  }
});

// ⏱ Random inactivity alert trigger
setInterval(() => {
  const now = Date.now();
  const idleSeconds = (now - lastActivityTime) / 1000;
  if (idleSeconds > Math.random() * 50 + 10) {
    triggerTestScenario();
    lastActivityTime = Date.now(); // reset
  }
}, 10000);

// 🖱 Activity tracking
["mousemove", "keydown", "click"].forEach(evt =>
  window.addEventListener(evt, () => lastActivityTime = Date.now())
);

// 🔔 Receive real-time alerts
const evtSource = new EventSource("/api/sse");
evtSource.onmessage = (e) => {
  const data = JSON.parse(e.data);
  if (data.type === "new-alert") {
    showAlert(data.alert);
  } else if (data.type === "acknowledgment") {
    if (currentAlert && currentAlert.id === data.alertId) {
      console.log(`Alert acknowledged by ${data.acknowledgedBy}`);
    }
  } else if (data.type === "alert-completed") {
    if (currentAlert && currentAlert.id === data.alertId) {
      alert("✅ Alert completed by: " + data.completedBy);
      resetUI();
    }
  }
};

// 🚨 Show incoming alert
function showAlert(alert) {
  currentAlert = alert;
  testAlertActive = true;
  noAlert.style.display = "none";
  activeAlert.style.display = "block";
  alertBox.classList.add("flashing");

  alertTitle.textContent = alert.title;
  alertDetails.textContent = `Procedure: ${alert.procedure || "N/A"}`;
  checklistContainer.innerHTML = "";
  checklistSection.style.display = "none";
  completeBtn.disabled = true;
}

// ✅ Acknowledge button
acknowledgeBtn.addEventListener("click", async () => {
  if (!currentAlert || !operator) return;

  try {
    await fetch(`/api/alerts/${currentAlert.id}/acknowledge`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ operator })
    });

    checklistSection.style.display = "block";
    startChecklist(currentAlert.steps || []);
    startSLATimer(30);
    alertBox.classList.remove("flashing");
  } catch (err) {
    alert("Acknowledge failed: " + err.message);
  }
});

// ✅ Complete alert
completeBtn.addEventListener("click", async () => {
  if (!currentAlert || !operator) return;

  const steps = [];
  checklistContainer.querySelectorAll(".checklist-item").forEach((item, i) => {
    const input = item.querySelector("input");
    const text = item.dataset.text;
    const filled = input.type === "text" ? input.value.trim() : text;
    steps.push({ text: filled || text, completed: true });
  });

  try {
    await fetch("/api/complete-alert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        alertId: currentAlert.id,
        completedBy: operator,
        steps
      })
    });

    resetUI();
  } catch (err) {
    alert("Completion failed: " + err.message);
  }
});

// 📋 Start checklist
function startChecklist(steps) {
  checklistContainer.innerHTML = "";
  let completedCount = 0;

  steps.forEach((step, i) => {
    const item = document.createElement("div");
    item.className = "checklist-item";
    item.dataset.text = step.text;

    if (step.fill) {
      item.innerHTML = `<input type="text" placeholder="Fill in..." />`;
    } else {
      item.innerHTML = `<input type="checkbox" /> <label>${step.text}</label>`;
    }

    checklistContainer.appendChild(item);

    const input = item.querySelector("input");
    input.addEventListener("input", checkCompletion);
    input.addEventListener("change", checkCompletion);
  });

  function checkCompletion() {
    const allDone = Array.from(checklistContainer.children).every(item => {
      const input = item.querySelector("input");
      return input.type === "text" ? input.value.trim() !== "" : input.checked;
    });
    completeBtn.disabled = !allDone;
  }
}

// ⏳ SLA Timer
function startSLATimer(seconds) {
  let remaining = seconds;
  if (slaInterval) clearInterval(slaInterval);

  slaInterval = setInterval(() => {
    alertDetails.textContent = `⏳ SLA: ${remaining--}s remaining...`;
    if (remaining < 0) {
      clearInterval(slaInterval);
      alert("⚠️ SLA time exceeded!");
    }
  }, 1000);
}

// 🔁 Reset UI
function resetUI() {
  currentAlert = null;
  testAlertActive = false;
  checklistSection.style.display = "none";
  checklistContainer.innerHTML = "";
  noAlert.style.display = "block";
  activeAlert.style.display = "none";
  completeBtn.disabled = true;
  alertBox.classList.remove("flashing");
  alertDetails.textContent = "";
  if (slaInterval) clearInterval(slaInterval);
}

// 🎲 Auto test scenario generator
const testScenarios = [
  {
    title: "🔥 Fire Alarm at Sector A",
    steps: [
      "Sound alarm",
      "Notify fire services",
      "Evacuate zone A",
      "Log incident",
      "Report to supervisor"
    ]
  },
  {
    title: "⚡ Power Failure in Zone B",
    steps: [
      "Switch to backup power",
      "Check main circuit",
      "Inform maintenance",
      "Log downtime",
      "Update report"
    ]
  }
];

function triggerTestScenario() {
  if (testAlertActive || !operator) return;

  const scenario = testScenarios[Math.floor(Math.random() * testScenarios.length)];
  currentScenarioTitle = scenario.title;

  const randomizedSteps = scenario.steps.map(step => ({ text: step, fill: false }));
  const blankCount = Math.floor(Math.random() * 3) + 1;
  const indices = [...randomizedSteps.keys()].sort(() => 0.5 - Math.random()).slice(0, blankCount);
  indices.forEach(i => {
    randomizedSteps[i].fill = true;
    randomizedSteps[i].text = "______";
  });

  const testAlert = {
    title: scenario.title,
    procedure: "Follow standard SOP",
    steps: randomizedSteps
  };

  fetch("/api/test-alert", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(testAlert)
  }).then(res => {
    if (!res.ok) console.warn("Test alert failed to send");
  });
}