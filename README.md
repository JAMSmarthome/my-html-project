# 🚨 Emergency Test System

A real-time simulation and training tool for emergency operators. This system automatically triggers randomized test alerts and tracks responses, acknowledgments, and completion checklists — ensuring operators stay sharp and procedures are followed.

---

## 💻 Features

- ✅ Real-time alert pushing via SSE (Server-Sent Events)
- ⏳ SLA countdown timers for operator responses
- 📝 Dynamic randomized test scenarios
- 📋 Checklist completion and tracking
- 👤 Operator acknowledgment + completion
- ⏱️ Randomized automatic test alerts during inactivity
- 📡 Third-party mock API integration
- 📦 Alerts can be logged and extended to databases

---

## 🗂️ Project Structure
public
├── test-dashboard.html         # Operator dashboard UI
├── js/test-dashboard.js        # Dashboard logic and SSE client
└── css/style.css               # Styling

/js
├── server.js                   # Express API + SSE + alert engine
├── mock-client.js              # (Optional) for testing third-party callbacks

README.md                         # This file
index.html                        # Landing page or admin UI (WIP)
---

## 🚀 How to Run

1. Clone the repo:
```bash
git clone https://github.com/yourusername/emergency-test-system.git
cd emergency-test-system

	2.	Install dependencies: npm install
	3.	Start the server: node server.js
        4.	Open the dashboard: http://localhost:3000/test-dashboard.html
⸻

 🔁 API Endpoints
	•	POST /api/test-alert — Trigger test alert
	•	POST /api/acknowledge-from-client — Acknowledge alert
	•	POST /api/complete-alert — Complete alert
	•	GET /api/sse — Live alert stream
	•	GET /api/alerts — All alert logs

⸻

🧠 Future Plans
	•	Operator login/authentication
	•	Persistent alert log storage (DB)
	•	Admin control panel
	•	Real-time reporting and analytics
	•	Rich scenario types (audio, maps, etc)

⸻

👨‍💻 Author

John van Zyl
Built with ❤️ for operator readiness and reliability

⸻

📄 License

MIT License
