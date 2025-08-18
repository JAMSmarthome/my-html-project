<<<<<<< HEAD
# Emergency Test System

This project is a multi-tenant emergency alert testing platform. It is designed to simulate real-time emergency scenarios and evaluate the response readiness of different control rooms/operators through randomized alert triggers and checklists.
=======
// This Node.js script appends README.md to your project directory
const fs = require('fs');
const path = require('path');

const readmeContent = `
# Emergency Test System

This project is a multi-tenant emergency alert testing platform. It simulates real-time emergency scenarios and evaluates the response readiness of different control rooms/operators through randomized alert triggers and checklists.
>>>>>>> 55f62d5 (📝 Updated README with API key instructions and full architecture overview)

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
<<<<<<< HEAD
- 🧪 API integration for third-party control rooms
=======
- 🧪 API integration for third-party control rooms with API keys
>>>>>>> 55f62d5 (📝 Updated README with API key instructions and full architecture overview)

---

## 📂 Project Structure
<<<<<<< HEAD
=======

\`\`\`
>>>>>>> 55f62d5 (📝 Updated README with API key instructions and full architecture overview)
emergency-test-system/
├── public/
│   ├── client1.html
│   ├── client2.html
<<<<<<< HEAD
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
=======
│   ├── index.html
│   ├── test-dashboard.html
│   ├── js/
│   │   ├── script.js
│   │   ├── test-dashboard.js
│   │   ├── client1-dashboard.js
│   │   └── client2-dashboard.js
├── alerts.json
├── server.js
├── package.json
└── README.md
\`\`\`

>>>>>>> 55f62d5 (📝 Updated README with API key instructions and full architecture overview)
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

<<<<<<< HEAD
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
=======
\`\`\`bash
npm install
\`\`\`

### 2. Start the server

\`\`\`bash
node server.js
\`\`\`

Server will be running at: [http://localhost:3000](http://localhost:3000)

---

## 🌐 URLs

| Dashboard         | URL                             |
|------------------|----------------------------------|
| Operator         | http://localhost:3000           |
| Test Lane        | http://localhost:3000/test-dashboard.html |
| Client 1         | http://localhost:3000/client1.html |
| Client 2         | http://localhost:3000/client2.html |

---

## 🧪 API Integration

### `POST /api/send-alert`

Send a real-time alert to a specific lane.

#### 🔐 API Key Required

Every client lane must send a valid API key in the request header:

\`\`\`http
POST /api/send-alert
Content-Type: application/json
x-api-key: YOUR_API_KEY_HERE
\`\`\`

#### Example Body

\`\`\`json
{
  "title": "🚨 Emergency Simulation",
  "procedure": "Fire Drill Protocol",
  "steps": [
    { "text": "Confirm Dispatch", "completed": false },
    { "text": "Notify Response Unit", "completed": false }
  ],
  "target": "client1"
}
\`\`\`

#### API Keys

| Lane      | API Key        |
|-----------|----------------|
| client1   | abc123client1  |
| client2   | abc123client2  |

---

## 📋 To-Do for Production

- [ ] Secure API key management (admin tool)
- [ ] Use bcrypt password hashing
- [ ] Migrate alerts.json to a database
- [ ] Add rate limiting and abuse protection
- [ ] Containerize with Docker
- [ ] CI/CD integration for deployments

---

## 🧪 License

MIT License
`;

fs.writeFileSync(path.join(__dirname, "README.md"), readmeContent);
console.log("✅ README.md created.");
>>>>>>> 55f62d5 (📝 Updated README with API key instructions and full architecture overview)
