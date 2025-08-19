# 🚨 Emergency Test System

A full-stack Node.js + Firebase platform for simulating emergency alerts, measuring SLA compliance, and providing isolated dashboards for clients to manage test scenarios and configurations.

---

## ✨ Features

### 🔐 Client Dashboard
- Secure login using hashed credentials (bcrypt)
- View & edit per-client test configurations:
  - `testFrequencyMinutes`: frequency of test alerts
  - `enabledScenarios`: fire, evacuation, system down, etc.
- Logout support
- Scenario toggle UI with per-scenario descriptions
- Session-based access

### 🧪 Emergency Alert Simulation
- Trigger alerts randomly or manually
- SLA tracking: acknowledgment and completion timers
- Animated UI for test-dashboard and mock clients
- CSV export for logs (test + mock)
- `target`-based alert routing for multi-lane support

### ⚙️ Admin Tools
- Seed clients and default configuration into Firestore
- Session-based `/api/client-config` GET/PUT endpoints
- Separate dashboards for control room (admin) and clients
- Client config stored securely in Firestore with hashed passwords

---

## 🚀 Getting Started

### 1. Clone the Repo

```bash
git clone https://github.com/YOUR_USERNAME/emergency-test-system.git
cd emergency-test-system

2. Install Dependencies
npm install

3. Add Firebase Credentials

Place your Firebase Admin SDK key in the project root: touch firebase-service-account.json

🧪 Running the Server
node server.js

Server runs at:
http://localhost:3000

🌐 Dashboards
	•	Operator/Admin Dashboard: http://localhost:3000/index.html
	•	Test Dashboard: http://localhost:3000/test-dashboard.html
	•	Client Config Dashboard: http://localhost:3000/client-dashboard.html

⸻

🔄 Seeding Clients (Optional)

Run the following scripts to populate Firestore with example clients and default config:

node seed-clients.js
node seed-client-config.js

📁 Folder Structure

emergency-test-system/
├── public/
│   ├── index.html
│   ├── test-dashboard.html
│   ├── client-dashboard.html
│   ├── script.js
│   ├── test-dashboard.js
│   ├── client-dashboard.js
│   ├── login.js
│   └── styles.css
├── server.js
├── firebase-service-account.json
├── seed-clients.js
├── seed-client-config.js
└── alerts.json

📌 Next Steps
	•	🔒 Improve session storage (Redis, production-grade store)
	•	📊 Add dashboard analytics (SLA compliance tracking)
	•	🧰 Build admin dashboard to manage clients
	•	🧼 Containerize with Docker
	•	🔁 Setup GitHub Actions for CI/CD

⸻

🛡️ Security
	•	Passwords stored securely using bcrypt
	•	Session-based auth for clients and dashboard
	•	Firestore structured per-client for config isolation

⸻

🧑‍💻 Author

Built by John van Zyl
GitHub: @johnvanzyl12