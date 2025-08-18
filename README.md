# Emergency Test System

This project is a multi-tenant emergency alert testing platform. It is designed to simulate real-time emergency scenarios and evaluate the response readiness of different control rooms/operators through randomized alert triggers and checklists.

---

## 🚀 Features

- 🔐 Secure login system for each client lane
- 🎯 Supports multiple control rooms (multi-lane architecture)
  - Test Lane
  - Operator Dashboard
  - Client 1
  - Client 2
- 🔁 Random inactivity triggers simulate real-time alerts
- ✅ Checklist & Acknowledgement system per alert
- 📈 SLA Countdown timers
- 📤 CSV export for reporting
- 📡 Server-Sent Events (SSE) for real-time alert delivery
- 🧪 API integration for third-party control rooms

---

## 📂 Project Structure
emergency-test-system/
├── public/
│   ├── client1.html
│   ├── client2.html
│   ├── index.html          # Operator dashboard
│   ├── test-dashboard.html
│   ├── js/
│   │   ├── script.js               # Operator logic
│   │   ├── test-dashboard.js      # Test lane logic
│   │   ├── client1-dashboard.js   # Client 1 logic
│   │   └── client2-dashboard.js   # Client 2 logic
├── alerts.json             # Stores alert logs
├── server.js               # Express backend with SSE
├── package.json
└── README.md
---

## 🔑 Login Credentials

| Dashboard      | Username  | Password      |
|----------------|-----------|---------------|
| Operator       | admin     | admin123      |
| Test Lane      | test      | test123       |
| Client 1       | client1   | client1pass   |
| Client 2       | client2   | client2pass   |

---

## 📦 Setup Instructions

### 1. Install dependencies

```bash
npm install

2. Start the server = node server.js
Server will be running at: http://localhost:3000

Dashboard URLs:

Operator
http://localhost:3000

Test Lane
http://localhost:3000/test-dashboard.html

Client 1
http://localhost:3000/client1.html

Client 2
http://localhost:3000/client2.html

API Endpoints:
POST /api/send-alert
Sends an alert to a specific target lane.
{
  "title": "🚨 Test Alert",
  "procedure": "Test SOP Flow",
  "steps": [
    { "text": "Step 1", "completed": false },
    { "text": "Step 2", "completed": false }
  ],
  "target": "client1"
}
To-Do for Production
	•	Secure API keys per lane
	•	Use bcrypt password hashing
	•	Migrate alerts.json to a proper database (MongoDB / SQLite)
	•	Add rate limiting
	•	Implement admin dashboard for control and analytics
	•	Containerize (Docker)
	•	Enable CI/CD and deployment

⸻

🧪 License

MIT License
