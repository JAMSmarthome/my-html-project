# 🚨 Emergency Operator Test Platform – V1

This web-based platform is designed to **randomly test emergency operators** during their shifts when no real emergencies are detected for a certain period. The system simulates emergency scenarios to ensure operators maintain readiness and strictly follow standard operating procedures (SOPs).

---

## ✅ Key Features

- 🔐 **Operator Login** – Each operator must log in before starting their shift.
- ⏱ **Inactivity Timer** – If no real emergencies are logged after a random interval, a **test alert** is triggered.
- 🚨 **Random Test Scenarios** – A wide variety of preloaded emergencies like gas leaks, network outages, chemical spills, and more.
- 📋 **Interactive Checklist** – Operators must complete a procedural checklist to resolve the alert.
  - Some steps are **predefined**.
  - Some steps are **blank fields** the operator must **fill in** with their actions.
- ⏳ **SLA Acknowledgement Timer** – Operators must acknowledge test alerts within **10 seconds**. If late, the SLA is marked as **missed**.
- 📝 **Reason Capture** – If the SLA is missed, the operator is required to provide a **reason**.
- 📦 **Local Log Storage** – All operator activity is stored in **local browser storage** (or can be extended to use a database).
- 📄 **CSV Export** – Operators or admins can download a full log of shift activity (real events, test alerts, SLA results).

---

## 🧰 Technologies Used

- HTML5
- CSS3
- JavaScript (Vanilla)
- LocalStorage for data persistence

---

## 📁 Project Structure
project-root/
│
├── index.html              # Main user interface
├── css/
│   └── style.css           # All styling and animation rules
├── js/
│   └── script.js           # Full interactive behavior and logic
├── README.md               # This file
---

## 🚀 How to Use

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/emergency-operator-test-platform.git
   2.	Open index.html in a browser
	•	You can use VS Code with Live Server, or open it directly in Chrome or Firefox.
	3.	Log in as an operator
	•	Enter your name to begin the shift session.
	4.	Test behavior
	•	Click “Log Real Emergency” to simulate actual events.
	•	Let the timer lapse and a random test alert will appear.
	•	Follow the checklist steps, fill in the blanks, and close the alert.
	5.	Export Logs
	•	Click the “Export CSV” button to download a full report.

   🚨 Test Scenario: Chemical Spill in Lab 2
🧪 SOP: Initiate Decontamination Procedure SOP-CHEM-12

☑️ Step 1: [input required]
☑️ Step 2: Use spill kit
☑️ Step 3: Notify hazardous material team
☑️ Step 4: [input required]
🔐 Future Enhancements
	•	🔄 Integration with a backend (e.g., Firebase, Supabase, MongoDB)
	•	📊 Dashboard for admin/supervisors
	•	⏳ Configurable SLA durations
	•	🔁 Shift scheduling + reminders
	•	📱 Mobile responsive interface
 🧑‍💻 Author

John van Zyl
This project is intended to improve emergency readiness and compliance in simulated operational environments.
📄 License

This project is open-source and available under the MIT License.
