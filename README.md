# 🆘 Emergency Test System

A Node.js backend system for sending simulated emergency test alerts and forwarding them to a third-party system (such as a logging, training, or monitoring tool).

---

## ✅ Features

- RESTful API for sending test alerts
- Forwards alerts to a mock or real third-party system
- Logs all alerts and third-party responses
- Basic fault handling and error logging
- Includes a built-in mock third-party receiver

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/JAMSmarthome/my-html-project.git
cd emergency-test-system

2. Install Dependencies
npm install
3. Run the Servers

Open two terminals:
Terminal 1: Start API Server - node js/server.js

Terminal 2: Start Mock Third-Party Receiver - node js/mock-receiver.js

🧪 API Documentation

POST /api/test-alert

Send a test alert into the system.
	•	Endpoint: http://localhost:3000/api/test-alert
	•	Method: POST
	•	Headers: Content-Type: application/json
	•	Body Example:
{
  "title": "Test Scenario",
  "procedure": "SOP-TEST-01",
  "details": "Simulated test alert from system"
}

Success Response (200 OK):
{
  "status": "success",
  "message": "Alert forwarded to third-party successfully",
  "thirdPartyResponse": {
    "status": "received",
    "receivedAt": "2025-07-25T21:10:03.673Z"
  }
}

Error Response (500):
{
  "status": "error",
  "message": "Failed to forward alert to third-party",
  "error": "connect ECONNREFUSED ::1:4000"
}

GET /api/alerts
View the full log of test alerts.
	•	Endpoint: http://localhost:3000/api/alerts
	•	Method: GET
	•	Returns: Array of alert logs

Response Example:
[
  {
    "title": "Test Scenario",
    "procedure": "SOP-TEST-01",
    "details": "Simulated test alert",
    "receivedAt": "2025-07-25T21:10:03.654Z",
    "thirdPartyResponse": {
      "status": "received",
      "receivedAt": "2025-07-25T21:10:03.673Z"
    }
  }
]

🗂️ Project Structure
emergency-test-system/
├── js/
│   ├── server.js           # Main API backend
│   └── mock-receiver.js    # Mock third-party endpoint
├── package.json
├── README.md

🔧 Future Improvements
	•	Retry logic for failed third-party calls
	•	SLA/timeout monitoring and alerting
	•	Store alerts in a database (MongoDB, SQLite, etc.)
	•	Operator authentication
	•	Frontend dashboard (React or simple HTML)

⸻

📫 Contact

Maintained by @JAMSmarthome

