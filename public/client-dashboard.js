let config = null;

document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  const res = await fetch("/api/client-login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  const data = await res.json();
  if (data.success) {
    document.getElementById("login-section").style.display = "none";
    document.getElementById("dashboard").style.display = "block";
    fetchConfigAndStart();
  } else {
    document.getElementById("login-error").textContent = "Login failed";
  }
});

document.getElementById("logout-btn").addEventListener("click", async () => {
  await fetch("/api/client-logout", { method: "POST" });
  location.reload();
});

document.getElementById("save-config").addEventListener("click", async () => {
  const updatedScenarios = {};
  document.querySelectorAll("#scenariosContainer input[type=checkbox]").forEach(cb => {
    updatedScenarios[cb.dataset.scenario] = cb.checked;
  });

  const newConfig = {
    testFrequencyMinutes: parseInt(document.getElementById("testFrequency").value),
    enabledScenarios: updatedScenarios
  };

  const res = await fetch("/api/client-config", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ config: newConfig }),
  });

  if (res.ok) {
    document.getElementById("save-status").textContent = "✅ Saved!";
    config = newConfig;
    resetTestTimer();
  } else {
    document.getElementById("save-status").textContent = "❌ Save failed";
  }
});

document.getElementById("addScenarioBtn").addEventListener("click", () => {
  const name = document.getElementById("newScenarioName").value.trim();
  if (!name || config.enabledScenarios.hasOwnProperty(name)) {
    alert("Invalid or duplicate scenario name");
    return;
  }

  config.enabledScenarios[name] = true;
  renderScenarios();
  document.getElementById("newScenarioName").value = "";
});

async function fetchConfigAndStart() {
  const res = await fetch("/api/client-config");
  const data = await res.json();
  config = data.config;
  document.getElementById("testFrequency").value = config.testFrequencyMinutes;
  renderScenarios();
  resetTestTimer();
}

function renderScenarios() {
  const container = document.getElementById("scenariosContainer");
  container.innerHTML = "";

  Object.entries(config.enabledScenarios).forEach(([name, enabled]) => {
    const label = document.createElement("label");
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = enabled;
    cb.dataset.scenario = name;

    label.appendChild(cb);
    label.append(` ${name}`);
    container.appendChild(label);
    container.appendChild(document.createElement("br"));
  });
}

let testTimer = null;

function resetTestTimer() {
  if (testTimer) clearInterval(testTimer);

  const ms = config.testFrequencyMinutes * 60 * 1000;
  testTimer = setInterval(() => {
    triggerTestAlert();
  }, ms);
}

function triggerTestAlert() {
  const enabled = Object.entries(config.enabledScenarios)
    .filter(([_, val]) => val)
    .map(([key]) => key);

  if (enabled.length === 0) return;

  const scenario = enabled[Math.floor(Math.random() * enabled.length)];
  const alertBox = document.getElementById("alertBox");
  alertBox.innerText = `🚨 New Scenario Triggered: ${scenario.toUpperCase()}`;
  alertBox.style.display = "block";

  setTimeout(() => {
    alertBox.style.display = "none";
  }, 10000);
}