// public/js/login.js
async function loginUser(event) {
  event.preventDefault();
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  const res = await fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  const data = await res.json();
  if (data.ok) {
    localStorage.setItem("user", JSON.stringify(data.user));
    window.location.href = "/dashboard.html";
  } else {
    alert(data.error || "Login failed");
  }
}

document.getElementById("login-form").addEventListener("submit", loginUser);