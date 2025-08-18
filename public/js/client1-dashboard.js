// public/js/client1.js

const loginContainer = document.getElementById("login-container");
const dashboardContainer = document.getElementById("main-dashboard");
const loginBtn = document.getElementById("loginBtn");
const loginError = document.getElementById("login-error");

let currentAlert = null;
let slaInterval = null;

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
  const eventSource = new EventSource("/api/sse?target=client1");

  eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === "new-alert") {
      showAlert(data.alert);
    }
  };
}

function showAlert(alert) {
  currentAlert = alert;

  const alertBox = document.getElementById("active-alert");
  alertBox.innerHTML = `
    <div class="alert-box">
      <h3>${alert.title}</h3>
      <p><strong>Procedure:</strong> ${alert.procedure}</p>
      <ul id="checklist">
        ${alert.steps.map((step, i) => `
          <li>
            <input type="checkbox" id="step-${i}" />
            <label for="step-${i}">${step}</label>
          </li>`).join("")}
      </ul>
      <div id="sla-timer">SLA: 300 sec</div>
      <button onclick="acknowledgeAlert()">Acknowledge</button>
    </div>
  `;
  startSLATimer(300); // 5 min
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