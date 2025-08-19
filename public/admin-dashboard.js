document.getElementById("admin-login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const username = document.getElementById("admin-username").value;
  const password = document.getElementById("admin-password").value;
  const errorEl = document.getElementById("admin-login-error");

  try {
    const res = await fetch("/api/admin-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();
    if (res.ok) {
      errorEl.textContent = "";
      document.getElementById("login-section").style.display = "none";
      document.getElementById("dashboard-section").style.display = "block";
      loadClientConfigs();
    } else {
      errorEl.textContent = data.error || "Login failed";
    }
  } catch (err) {
    errorEl.textContent = "Network error";
  }
});

document.getElementById("logout-button").addEventListener("click", async () => {
  await fetch("/api/admin-logout", { method: "POST" });
  location.reload();
});

async function loadClientConfigs() {
  const container = document.getElementById("clients-container");
  container.innerHTML = "Loading...";

  try {
    const res = await fetch("/api/admin/configs");
    const data = await res.json();

    if (!res.ok) throw new Error(data.error || "Failed to fetch");

    container.innerHTML = "";
    data.clients.forEach((client) => {
      const card = document.createElement("div");
      card.className = "client-card";
      card.innerHTML = `
        <strong>${client.username}</strong> (Lane: ${client.lane})<br/>
        <label>Test Frequency (minutes): 
          <input type="number" value="${client.config?.testFrequencyMinutes || 60}" data-id="${client.id}" data-key="testFrequencyMinutes"/>
        </label><br/>
        <label><input type="checkbox" ${client.config?.enabledScenarios?.fire ? "checked" : ""} data-id="${client.id}" data-key="fire"/> Fire</label><br/>
        <label><input type="checkbox" ${client.config?.enabledScenarios?.evacuation ? "checked" : ""} data-id="${client.id}" data-key="evacuation"/> Evacuation</label><br/>
        <label><input type="checkbox" ${client.config?.enabledScenarios?.systemDown ? "checked" : ""} data-id="${client.id}" data-key="systemDown"/> System Down</label><br/>
        <button onclick="saveConfig('${client.id}')">Save</button>
      `;
      container.appendChild(card);
    });
  } catch (err) {
    container.innerHTML = "Failed to load clients.";
  }
}

async function saveConfig(clientId) {
  const inputs = document.querySelectorAll(`[data-id="${clientId}"]`);
  const config = { testFrequencyMinutes: 60, enabledScenarios: {} };

  inputs.forEach((input) => {
    const key = input.dataset.key;
    if (key === "testFrequencyMinutes") {
      config.testFrequencyMinutes = parseInt(input.value, 10);
    } else {
      config.enabledScenarios[key] = input.checked;
    }
  });

  try {
    const res = await fetch(`/api/admin/configs/${clientId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ config }),
    });
    if (res.ok) alert("Config saved!");
    else alert("Failed to save config.");
  } catch (err) {
    alert("Network error.");
  }
}