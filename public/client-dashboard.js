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

  let currentConfig = {
    enabledScenarios: {},
    testFrequency: 0,
  };

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    const res = await fetch("/api/client-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (res.ok) {
      loginSection.style.display = "none";
      dashboard.style.display = "block";
      loadConfig();
    } else {
      loginError.textContent = "Login failed.";
    }
  });

  logoutBtn.addEventListener("click", async () => {
    await fetch("/api/client-logout", { method: "POST" });
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
    });

    if (res.ok) {
      saveStatus.textContent = "Config saved!";
      setTimeout(() => (saveStatus.textContent = ""), 2000);
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
    const res = await fetch("/api/client-config");
    if (!res.ok) return;
    const data = await res.json();
    currentConfig = data.config || { enabledScenarios: {}, testFrequency: 0 };
    testFrequencyInput.value = currentConfig.testFrequency || "";
    renderScenarios();
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
});