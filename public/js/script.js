// public/js/script.js

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
      initDashboard(); // Start dashboard after login
    } else {
      loginError.textContent = data.error || "Login failed.";
    }
  } catch (err) {
    loginError.textContent = "Network error. Try again.";
  }
});

let activeAlert = null;
let inactivityTimer;

function resetInactivityTimer() {
  clearTimeout(inactivityTimer);
  const timeout = Math.floor(Math.random() * 50 + 10) * 1000; // 10–60 sec
  inactivityTimer = setTimeout(triggerTestScenario, timeout);
}

document.addEventListener("mousemove", resetInactivityTimer);
document.addEventListener("keydown", resetInactivityTimer);
resetInactivityTimer();

function triggerTestScenario() {
  const steps = [
    { text: "Confirm dispatch", completed: false },
    { text: "Notify client", completed: false },
    { text: "Log case reference", completed: false }
  ];

  const payload = {
    title: "🚨 TEST Alert",
    procedure: "Simulated SOP Protocol",
    steps,
    target: "client1" // Target this lane only
  };

  fetch("/api/send-alert", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}

function renderAlert(alert) {
  activeAlert = alert;

  const container = document.getElementById("active-alert");
  container.innerHTML = `
    <h3>${alert.title}</h3>
    <p><strong>Procedure:</strong> ${alert.procedure}</p>
    <ul id="checklist">
      ${alert.steps.map((s, i) => `<li><label><input type="checkbox" data-step="${i}"> ${s.text}</label></li>`).join("")}
    </ul>
    <button onclick="acknowledgeAlert()">Acknowledge</button>
    <button onclick="completeAlert()">Complete</button>
    <div id="sla-timer"></div>
  `;

  startSlaCountdown();
}

function acknowledgeAlert() {
  if (!activeAlert) return;
  fetch("/api/acknowledge-from-client", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client: "Client 1 Dashboard",
      originalTitle: activeAlert.title,
      receivedAt: new Date().toISOString()
    })
  });
}

function completeAlert() {
  if (!activeAlert) return;
  const checklistItems = document.querySelectorAll("#checklist input[type='checkbox']");
  const steps = Array.from(checklistItems).map((input, i) => ({
    text: activeAlert.steps[i].text,
    completed: input.checked
  }));

  fetch("/api/complete-alert", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      alertId: activeAlert.id,
      completedBy: "Client 1 Dashboard",
      steps
    })
  });

  activeAlert = null;
  document.getElementById("active-alert").innerHTML = "";
  stopSlaCountdown();
}

let slaInterval, endTime;

function startSlaCountdown() {
  stopSlaCountdown();
  endTime = Date.now() + 5 * 60 * 1000;
  slaInterval = setInterval(() => {
    const remaining = endTime - Date.now();
    const mins = Math.floor(remaining / 60000);
    const secs = Math.floor((remaining % 60000) / 1000);
    document.getElementById("sla-timer").innerText = `⏳ SLA Countdown: ${mins}:${secs.toString().padStart(2, "0")}`;
    if (remaining <= 0) stopSlaCountdown();
  }, 1000);
}

function stopSlaCountdown() {
  clearInterval(slaInterval);
  document.getElementById("sla-timer").innerText = "";
}

// Connect to SSE feed for this lane
const eventSource = new EventSource("/api/sse?target=client1");
eventSource.onmessage = function (event) {
  const data = JSON.parse(event.data);
  if (data.type === "new-alert") renderAlert(data.alert);
  else if (data.type === "acknowledgment") {
    console.log(`✅ Acknowledged by ${data.acknowledgedBy}`);
  } else if (data.type === "alert-completed") {
    console.log(`✅ Completed by ${data.completedBy}`);
    document.getElementById("active-alert").innerHTML = "";
    stopSlaCountdown();
  }
};