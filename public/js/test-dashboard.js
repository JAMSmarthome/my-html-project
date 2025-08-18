// public/js/test-dashboard.js

let inactivityTimer;
let currentAlert = null;
let slaInterval = null;

// Login flow
const loginContainer = document.getElementById("login-container");
const dashboardContainer = document.getElementById("main-dashboard");
const loginBtn = document.getElementById("loginBtn");
const loginError = document.getElementById("login-error");

loginBtn?.addEventListener("click", async () => {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  try {
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();
    if (res.ok) {
      loginContainer.style.display = "none";
      dashboardContainer.style.display = "block";
      initDashboard();
    } else {
      loginError.textContent = data.error || "Login failed.";
    }
  } catch (err) {
    loginError.textContent = "Network error. Try again.";
  }
});

function initDashboard() {
  const eventSource = new EventSource("/api/sse?target=test");

  eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === "new-alert") {
      showAlert(data.alert);
    }
  };

  resetInactivityTimer();
  document.addEventListener("mousemove", resetInactivityTimer);
  document.addEventListener("keydown", resetInactivityTimer);

  document.getElementById("exportLog")?.addEventListener("click", exportCSV);
}

function showAlert(alert) {
  currentAlert = alert;
  const alertBox = document.getElementById("active-alert");
  alertBox.innerHTML = `
    <div class="alert-box ${alert.type || ''}">
      <h3>${alert.title}</h3>
      <p>${alert.description || ''}</p>
      <ul id="checklist">
        ${alert.steps.map((step, i) => `
          <li>
            <input type="checkbox" id="step-${i}" />
            <label for="step-${i}">${typeof step === "string" ? step : step.text}</label>
          </li>`).join("")}
      </ul>
      <div class="sla-timer" id="sla-timer">SLA: ${alert.sla || 300} sec</div>
      <button onclick="acknowledgeAlert()">Acknowledge</button>
    </div>
  `;
  startSLATimer(alert.sla || 300);
}

function startSLATimer(seconds) {
  const timerEl = document.getElementById("sla-timer");
  let timeLeft = seconds;

  clearInterval(slaInterval);
  slaInterval = setInterval(() => {
    timeLeft--;
    timerEl.textContent = `SLA: ${timeLeft} sec`;
    if (timeLeft <= 0) {
      clearInterval(slaInterval);
      timerEl.textContent = "⏰ SLA Breached!";
      timerEl.style.color = "red";
    }
  }, 1000);
}

function acknowledgeAlert() {
  const checkboxes = document.querySelectorAll("#checklist input[type='checkbox']");
  const allChecked = [...checkboxes].every(cb => cb.checked);
  if (!allChecked) {
    alert("Please complete all checklist steps.");
    return;
  }

  const log = document.getElementById("log");
  log.innerHTML += `<p>✅ Alert acknowledged: ${currentAlert.title}</p>`;

  fetch("/api/complete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ alertId: currentAlert.id })
  });

  clearInterval(slaInterval);
  currentAlert = null;
  document.getElementById("active-alert").innerHTML = "";
}

function resetInactivityTimer() {
  clearTimeout(inactivityTimer);
  const timeout = Math.floor(Math.random() * 50 + 10) * 1000; // 10–60 sec
  inactivityTimer = setTimeout(triggerTestScenario, timeout);
}

function triggerTestScenario() {
  const steps = [
    "Check connection to control room",
    "Simulate response from operator",
    "Record acknowledgement log"
  ];

  const payload = {
    title: "🚨 TEST ALERT",
    description: "Test lane scenario",
    steps,
    sla: 300,
    target: "test"
  };

  fetch("/api/send-alert", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  }).then(() => {
    const log = document.getElementById("log");
    log.innerHTML += `<p>🧪 Test alert triggered for Test lane</p>`;
  });
}

function exportCSV() {
  fetch("/api/export")
    .then(res => res.blob())
    .then(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "test-alerts-log.csv";
      a.click();
      URL.revokeObjectURL(url);
    });
}