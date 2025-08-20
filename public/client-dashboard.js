document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("login-form");
  const loginSection = document.getElementById("login-section");
  const dashboard = document.getElementById("dashboard");
  const logoutBtn = document.getElementById("logout-btn");

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    const res = await fetch("/api/client-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();
    if (data.success) {
      loginSection.style.display = "none";
      dashboard.style.display = "block";
      fetchConfig();
    } else {
      document.getElementById("login-error").textContent = data.error || "Login failed";
    }
  });

  logoutBtn.addEventListener("click", async () => {
    await fetch("/api/logout", { method: "POST", credentials: "include" });
    location.reload();
  });

  async function fetchConfig() {
    const res = await fetch("/api/client-config", {
      credentials: "include",
    });

    if (!res.ok) return alert("Failed to fetch config");
    const { config } = await res.json();

    document.getElementById("testFrequency").value = config.testFrequencyMinutes || 60;
    document.getElementById("fire").checked = config.enabledScenarios?.fire || false;
    document.getElementById("evacuation").checked = config.enabledScenarios?.evacuation || false;
    document.getElementById("systemDown").checked = config.enabledScenarios?.systemDown || false;
  }

  document.getElementById("save-config").addEventListener("click", async () => {
    const testFrequency = parseInt(document.getElementById("testFrequency").value);
    const enabledScenarios = {
      fire: document.getElementById("fire").checked,
      evacuation: document.getElementById("evacuation").checked,
      systemDown: document.getElementById("systemDown").checked,
    };

    const res = await fetch("/api/client-config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ config: { testFrequencyMinutes: testFrequency, enabledScenarios } }),
    });

    const data = await res.json();
    document.getElementById("save-status").textContent = data.success
      ? "✔ Config saved successfully"
      : "❌ Failed to save config";
  });
});