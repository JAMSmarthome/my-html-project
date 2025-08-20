# 🚨 Emergency Test System

A web-based emergency scenario testing platform for training and monitoring operators and clients in real-time. Built with **Node.js**, **Express**, **Firebase Firestore**, and **HTML/CSS/JS**.

---

## 🌐 Features

### ✅ Client Dashboard (`client-dashboard.html`)
- Secure login with Firebase credentials
- Test alert timer (interval-based)
- Scenario management:
  - View current scenario config
  - Enable/disable existing scenarios
  - Add new scenarios dynamically
- Save configurations to Firestore
- Logout functionality

### 🛠️ Admin Dashboard (`admin-dashboard.html`)
- Admin login (`admin` / `admin123`)
- View all registered clients
- Edit individual client configurations
- Update Firestore config for each client
- Logout functionality

### 🔐 Authentication
- Client login is validated using credentials stored in Firebase
- Passwords are **hashed using bcrypt**
- Session-based auth using `express-session`

### ☁️ Firebase Integration
- All client data is stored in the `clients` collection in Firestore
- Configurations are persisted per client, including:
  - `testFrequencyMinutes`
  - `enabledScenarios` (key-value pairs for all scenarios)

---

## 📁 Project Structure
emergency-test-system/
│
├── public/
│   ├── client-dashboard.html
│   ├── client-dashboard.js
│   ├── admin-dashboard.html
│   ├── admin-dashboard.js
│   ├── styles.css
│
├── server.js
├── firebase-service-account.json
├── README.md
├── package.json

---

## 🔧 Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/JAMSmarthome/my-html-project.git
cd emergency-test-system

2. Install Dependencies - npm install

3. Firebase Configuration

Place your Firebase Admin SDK JSON as firebase-service-account.json in the root directory.

4. Run the Server - node server.js
   Server runs on: http://localhost:3000

🔐 Logins

Admin
	•	Username: admin
	•	Password: admin123

Clients

Add client users manually to Firestore: 

{
  "username": "testuser",
  "password": "$2b$10$HASHED_PASSWORD",
  "lane": "test",
  "config": {
    "testFrequencyMinutes": 20,
    "enabledScenarios": {
      "Fire Alert": true,
      "Medical Alert": true
    }
  }
}

You can hash a password using:

const bcrypt = require('bcrypt');
bcrypt.hashSync('yourPassword', 10);

✅ Recent Updates
	•	Added client login/logout
	•	Dynamically add new scenarios from the dashboard
	•	Fully working admin config editor
	•	UI styling refinements
	•	Full Firebase Firestore integration
	•	GitHub repo push with latest features

⸻

🧪 Test Scenarios

Once logged in, the system will trigger alerts at the interval specified in testFrequencyMinutes using one of the enabled scenarios at random.

⸻

🛡️ Security
	•	Passwords stored securely using bcrypt
	•	Session-based auth for clients and dashboard
	•	Firestore structured per-client for config isolation

⸻

🧑‍💻 Author

Built by John van Zyl
GitHub: @johnvanzyl12.

📄 Licensed
