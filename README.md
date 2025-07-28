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
public/
├── test-dashboard.html        # Operator dashboard UI
├── mock-client.html           # Mock client for testing 3rd-party flow
├── js/
│   ├── test-dashboard.js      # Dashboard logic and SSE client
│   └── mock-client.js         # Mock client alert handler
├── css/
│   └── style.css              # Styling

server.js                     # Express API + SSE + alert engine
index.html                    # Landing page or admin UI (WIP)
README.md                     # This file

---

## 🚀 How to Run

1. Clone the repo:
   ```bash
   git clone https://github.com/yourusername/emergency-test-system.git
   cd emergency-test-system

   	2.	Install dependencies: npm install
   	3.	Start the server: node server.js
   	4.	Open the dashboards in your browser:
	•	Operator UI: http://localhost:3000/test-dashboard.html
	•	Mock client: http://localhost:3000/mock-client.html

⸻

🔁 API Endpoints
	•	POST /api/test-alert — Trigger test alert
	•	POST /api/acknowledge-from-client — Acknowledge alert from 3rd party
	•	POST /api/complete-alert — Mark alert as completed
	•	GET /api/sse — Live alert stream for dashboards
	•	GET /api/alerts — Retrieve all alert logs

⸻

🧠 Future Plans
	•	🔐 Operator login/authentication
	•	💾 Persistent alert log storage (e.g. PostgreSQL/MongoDB)
	•	🧑‍💼 Admin control panel
	•	📊 Real-time reporting and analytics
	•	🎧 Rich scenario types (audio, maps, timed drills, etc.)

⸻

👨‍💻 Author

John van Zyl
Built with ❤️ for operator readiness and reliability.

⸻

📄 License

MIT License
