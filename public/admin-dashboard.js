document.addEventListener("DOMContentLoaded", () => {
  const loginSection = document.getElementById("login-section");
  const dashboard = document.getElementById("dashboard");
  const loginBtn = document.getElementById("login-btn");
  const logoutBtn = document.getElementById("logout-btn");

  const usernameInput = document.getElementById("admin-username");
  const passwordInput = document.getElementById("admin-password");

  const alertTitleInput = document.getElementById("alert-title");
  const alertProcedureInput = document.getElementById("alert-procedure");
  const alertStepsInput = document.getElementById("alert-steps");
  const alertTargetSelect = document.getElementById("alert-target");
  const sendAlertBtn = document.getElementById("send-alert-btn");

  const clientConfigsContainer = document.getElementById("client-configs");

  // LOGIN
  loginBtn.addEventListener("click", async () => {
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    try {
      const res = await fetch("/api/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok) {
        loginSection.style.display = "none";
        dashboard.style.display = "block";
        loadClientConfigs();
      } else {
        alert(data.error || "Login failed.");
      }
    } catch (err) {
      alert("Network error during login.");
    }
  });

  // LOGOUT
  logoutBtn.addEventListener("click", async () => {
    await fetch("/api/admin-logout", { method: "POST" });
    loginSection.style.display = "block";
    dashboard.style.display = "none";
  });

  // LOAD CLIENT CONFIGS
  async function loadClientConfigs() {
    try {
      const res = await fetch("/api/admin/configs");
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to load client configs.");

      clientConfigsContainer.innerHTML = "";

      data.clients.forEach((client) => {
        const block = document.createElement("div");
        block.className = "client-block";

        const title = document.createElement("h4");
        title.textContent = `${client.username} (${client.lane})`;

        const textarea = document.createElement("textarea");
        textarea.rows = 6;
        textarea.cols = 50;
        textarea.value = JSON.stringify(client.config, null, 2);

        const saveBtn = document.createElement("button");
        saveBtn.textContent = "Save Config";
        saveBtn.addEventListener("click", async () => {
          try {
            const updatedConfig = JSON.parse(textarea.value);
            const updateRes = await fetch(`/api/admin/configs/${client.id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ config: updatedConfig }),
            });

            if (updateRes.ok) {
              alert("Config saved.");
            } else {
              alert("Failed to save config.");
            }
          } catch (err) {
            alert("Invalid JSON format.");
          }
        });

        block.appendChild(title);
        block.appendChild(textarea);
        block.appendChild(saveBtn);
        clientConfigsContainer.appendChild(block);
      });
    } catch (err) {
      console.error("Error loading client configs:", err);
    }
  }

  // SEND ALERT
  sendAlertBtn.addEventListener("click", async () => {
    const title = alertTitleInput.value.trim();
    const procedure = alertProcedureInput.value.trim();
    const steps = alertStepsInput.value
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const target = alertTargetSelect.value;

    if (!title || !procedure || steps.length === 0 || !target) {
      alert("Please fill in all fields to send an alert.");
      return;
    }

    try {
      const res = await fetch("/api/admin/trigger-alert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          procedure,
          steps,
          target,
        }),
      });

      if (res.ok) {
        alert("✅ Alert sent successfully.");
        alertTitleInput.value = "";
        alertProcedureInput.value = "";
        alertStepsInput.value = "";
      } else {
        alert("❌ Failed to send alert.");
      }
    } catch (err) {
      alert("❌ Network error while sending alert.");
    }
  });
});