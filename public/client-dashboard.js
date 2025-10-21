document.addEventListener("DOMContentLoaded", () => {
  const loginSection = document.getElementById("login-section");
  const dashboard = document.getElementById("dashboard");
  const loginForm = document.getElementById("login-form");
  const loginError = document.getElementById("login-error");
  const logoutBtn = document.getElementById("logout-btn");
  const saveBtn = document.getElementById("save-config");
  const saveStatus = document.getElementById("save-status");
  const scenariosContainer = document.getElementById("scenariosContainer");
  const testFrequencyInput = document.getElementById("testFrequency");
  const newScenarioInput = document.getElementById("newScenarioName");
  const addScenarioBtn = document.getElementById("addScenarioBtn");
  const alertsContainer = document.getElementById("alertsContainer"); // Add to HTML

  let currentConfig = {
    enabledScenarios: {},
    testFrequency: 0,
  };
  let lastActivity = Date.now();
  const inactivityThreshold = 10 * 60 * 1000; // 10 minutes
  let alertInterval;

  // Track user activity
  document.addEventListener('mousemove', () => (lastActivity = Date.now()));
  document.addEventListener('keydown', () => (lastActivity = Date.now()));

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        credentials: "include"
      });
      const data = await res.json();
      if (res.ok) {
        loginSection.style.display = "none";
        dashboard.style.display = "block";
        loadConfig();
      } else {
        console.error('Login response:', data);
        loginError.textContent = data.error || `Login failed: ${res.status}`;
      }
    } catch (err) {
      console.error('Login fetch error:', err);
      loginError.textContent = "Network error during login";
    }
  });

  logoutBtn.addEventListener("click", async () => {
    await fetch("/api/logout", {
      method: "POST",
      credentials: "include"
    });
    location.reload();
  });

  saveBtn.addEventListener("click", async () => {
    currentConfig.testFrequency = parseInt(testFrequencyInput.value || "0");
    const checkboxes = document.querySelectorAll(".scenario-checkbox");
    checkboxes.forEach((checkbox) => {
      currentConfig.enabledScenarios[checkbox.dataset.name] = checkbox.checked;
    });

    const res = await fetch("/api/client-config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ config: currentConfig }),
      credentials: "include"
    });

    if (res.ok) {
      saveStatus.textContent = "Config saved!";
      setTimeout(() => (saveStatus.textContent = ""), 2000);
      startAlerts(); // Restart alerts with new config
    } else {
      saveStatus.textContent = "Failed to save config.";
    }
  });

  addScenarioBtn.addEventListener("click", () => {
    const name = newScenarioInput.value.trim();
    if (!name) return;

    if (!currentConfig.enabledScenarios) currentConfig.enabledScenarios = {};
    currentConfig.enabledScenarios[name] = true;
    newScenarioInput.value = "";
    renderScenarios();
  });

  async function loadConfig() {
    try {
      const res = await fetch("/api/client-config", {
        credentials: "include"
      });
      if (!res.ok) {
        console.error('Load config failed:', res.status);
        return;
      }
      const data = await res.json();
      currentConfig = data.config || { enabledScenarios: {}, testFrequency: 0 };
      console.log('Loaded config:', currentConfig); // Debug
      testFrequencyInput.value = currentConfig.testFrequency || "";
      renderScenarios();
      startAlerts();
    } catch (err) {
      console.error('Load config error:', err);
    }
  }

  function renderScenarios() {
    scenariosContainer.innerHTML = "";
    const scenarios = Object.keys(currentConfig.enabledScenarios || {});
    scenarios.forEach((name) => {
      const label = document.createElement("label");
      label.innerHTML = `
        <input type="checkbox" class="scenario-checkbox" data-name="${name}" ${
        currentConfig.enabledScenarios[name] ? "checked" : ""
      }>
        ${name}
      `;
      scenariosContainer.appendChild(label);
      scenariosContainer.appendChild(document.createElement("br"));
    });
  }

  function startAlerts() {
    clearInterval(alertInterval); // Clear existing interval
    if (currentConfig.testFrequency <= 0 || !Object.keys(currentConfig.enabledScenarios).some(name => currentConfig.enabledScenarios[name])) {
      console.log('Alerts not started: invalid frequency or no enabled scenarios');
      return;
    }

    alertInterval = setInterval(() => {
      const inactiveTime = Date.now() - lastActivity;
      if (inactiveTime < inactivityThreshold) {
        console.log('User active, skipping alert');
        return;
      }

      const enabled = Object.keys(currentConfig.enabledScenarios).filter(name => currentConfig.enabledScenarios[name]);
      if (enabled.length === 0) {
        console.log('No enabled scenarios');
        return;
      }

      const randomScenario = enabled[Math.floor(Math.random() * enabled.length)];
      console.log('Triggering alert:', randomScenario); // Debug
      displayAlert(randomScenario);
      lastActivity = Date.now(); // Reset on alert
    }, currentConfig.testFrequency * 60 * 1000); // Convert minutes to ms
  }

  function displayAlert(scenarioName) {
    const alertDiv = document.createElement("div");
    alertDiv.className = "alert";
    alertDiv.innerHTML = `
      <h3>Emergency Alert: ${scenarioName}</h3>
      <p>Respond immediately to this test scenario.</p>
      <button onclick="acknowledgeAlert('${scenarioName}')">Acknowledge</button>
    `;
    alertsContainer.appendChild(alertDiv);

    // Optional: Save alert to Firestore for tracking
    fetch("/api/log-alert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scenario: scenarioName, timestamp: new Date().toISOString() }),
      credentials: "include"
    });
  }

  window.acknowledgeAlert = (scenarioName) => {
    const alertDiv = alertsContainer.querySelector(`.alert`);
    if (alertDiv) alertDiv.remove();
    console.log(`Acknowledged: ${scenarioName}`); // Debug
    // Optional: Log acknowledgment to Firestore
    fetch("/api/log-ack", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scenario: scenarioName, timestamp: new Date().toISOString() }),
      credentials: "include"
    });
  };
});