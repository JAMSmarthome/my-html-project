// public/js/mock-client.js

let currentUser = null;
let currentLane = null;
let eventSource = null;
let activeAlert = null;

// Elements
const loginContainer = document.getElementById("login-container");
const dashboard = document.getElementById("main-dashboard");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const loginBtn = document.getElementById("loginBtn");
const loginError = document.getElementById("login-error");
const activeAlertDiv = document.getElementById("active-alert");
const logDiv = document.getElementById("log");

// --- Login ---
loginBtn.addEventListener("click", async () => {
  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();

  const res = await fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  const data = await res.json();
  if (!data.success) {
    loginError.textContent = data.error || "Login failed";
    return;
  }

  currentUser = username;
  currentLane = data.lane;

  loginContainer.style.display = "none";
  dashboard.style.display = "block";

  connectSSE();
});

// --- SSE Connection ---
function connectSSE() {
  eventSource = new EventSource("/api/sse");

  eventSource.onmessage = (event) => {
    const alert = JSON.parse(event.data);
    handleAlert(alert);
  };

  eventSource.onerror = () => {
    console.error("SSE connection lost. Reconnecting...");
    eventSource.close();
    setTimeout(connectSSE, 3000);
  };
}

// --- Handle Alerts ---
function handleAlert(alert) {
  if (alert.status === "active") {
    activeAlert = alert;
    activeAlertDiv.innerHTML = `
      <h2>🚨 Alert</h2>
      <p>${alert.message}</p>
      <button onclick="acknowledgeAlert(${alert.id})">Acknowledge</button>
    `;
  } else if (alert.status === "acknowledged") {
    activeAlertDiv.innerHTML = `
      <h2>✅ Acknowledged</h2>
      <p>${alert.message}</p>
      <button onclick="completeAlert(${alert.id})">Complete</button>
    `;
  } else if (alert.status === "completed") {
    activeAlertDiv.innerHTML = "";
    logDiv.innerHTML += `<p>✔️ [${alert.timestamp}] ${alert.message} (completed)</p>`;
    activeAlert = null;
  }
}

// --- Acknowledge ---
async function acknowledgeAlert(alertId) {
  const res = await fetch("/api/acknowledge", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ alertId }),
  });
  const data = await res.json();
  if (data.success) handleAlert(data.alert);
}

// --- Complete ---
async function completeAlert(alertId) {
  const res = await fetch("/api/complete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ alertId }),
  });
  const data = await res.json();
  if (data.success) handleAlert(data.alert);
}