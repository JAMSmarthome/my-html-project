const logArea = document.getElementById("log");
const testModal = document.getElementById("testModal");
const testScenarioText = document.getElementById("testScenario");
const checklistContainer = document.getElementById("checklist");
const closeButton = document.getElementById("closeAlert");
const ackButton = document.getElementById("ackBtn");
const slaTimerDisplay = document.getElementById("slaTimer");

let operator = "";
let logs = JSON.parse(localStorage.getItem("logs") || "[]");

const testScenarios = [
  {
    title: "Armed Response Panic",
    procedure: "Follow the Armed Response SOP.",
    steps: [
      "Acknoladged Alarm",
      "Contacted User",
      "Quolified Alarm",
      "Acivate Response Unit",
      "Notify Managment",
      "Log Incident Report",
      "Complete / Terminate Incident"
    ]
  },
  {
    title: "Medical Response Panic",
    procedure: "Follow the Armed Response SOP.",
    steps: [
      "Contacted individual",
      "Qualify Alert",
      "Alert Transfered to Medical Responder",
      "Notify Managment",
      "Log Incident Report",
      "Complete / Terminate Incident"
    ]
  },
  {
    title: "Fire Alert",
    procedure: "Escalate to Fire Department.",
    steps: [
      "Alert Acknoladged",
      "Threat Confirmed",
      "Alert Tranfered / Assigned to Fire Responder",
      "Incident Report Logged"
    ]
  },
  {
    title: "MVA - Motor Vehile Accident",
    procedure: "Follow Emergancy SOP.",
    steps: [
      "Contacted User",
      "Confirm Status of Accident",
      "Transfer Alert to Medical Responder",
      "Confirm recieved alert with Medical Responder",
      "Make followup calls to User",
      "Log Incident Report"
    ]
  },
  {
    title: "Domestic Violance",
    procedure: "Follow Emergancy SOP",
    steps: [
      "Contact user",
      "Qualify Alert",
      "Response Assigned to SAPS",
      "Make Follwup Calls to User",
      "og Incident Report",
    ]
  }
];
let inactivityLimit = getRandomInactivityLimit();
function getRandomInactivityLimit() {
  const min = 10 * 1000; // 10 seconds
  const max = 30 * 1000; // 30 seconds
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

let lastRealEventTime = Date.now();
let testAlertActive = false;
let checklistStartTime = null;
let ackTimer = null;
let slaCountdown = null;
let slaViolated = false;
let testTriggeredTime = null;
const slaAcknowledgeLimit = 10 * 1000;

function loginOperator() {
  const nameInput = document.getElementById("operatorName").value.trim();
  if (!nameInput) {
    alert("Please enter your name.");
    return;
  }
  operator = nameInput;
  document.getElementById("currentOperator").textContent = operator;
  document.getElementById("loginContainer").style.display = "none";
  document.getElementById("mainUI").style.display = "block";
  log(`👤 Operator "${operator}" logged in.`, "INFO");
}

function log(message, type = "INFO") {
  const timestamp = new Date().toLocaleTimeString();
  const entry = { time: timestamp, operator, message, type };
  logs.push(entry);
  localStorage.setItem("logs", JSON.stringify(logs));
  logArea.innerHTML += `[${timestamp}] ${message}<br>`;
  logArea.scrollTop = logArea.scrollHeight;
}

function logRealEvent() {
  if (!testAlertActive) {
    lastRealEventTime = Date.now();
    inactivityLimit = getRandomInactivityLimit();
    log("✅ Real emergency logged.", "REAL");
  } else {
    log("⚠️ Real event ignored until test alert is closed.", "WARNING");
  }
}

function triggerTestScenario() {
  if (testAlertActive || !operator) return;

  const scenario = testScenarios[Math.floor(Math.random() * testScenarios.length)];
  testScenarioText.innerHTML = `<strong>${scenario.title}</strong><br>${scenario.procedure}`;
  checklistContainer.innerHTML = "";
  checklistContainer.style.display = "none";
  closeButton.disabled = true;
  ackButton.style.display = "inline-block";
  checklistContainer.dataset.steps = JSON.stringify(scenario.steps);
  slaTimerDisplay.textContent = "⏱ Acknowledge within 10 seconds...";
  testModal.style.display = "flex";
  testModal.classList.add("active");
  testAlertActive = true;
  slaViolated = false;
  testTriggeredTime = Date.now();

  ackTimer = setTimeout(() => {
    slaViolated = true;
    slaTimerDisplay.textContent = "❌ SLA missed: Acknowledge is late!";
    log("⏱️ SLA missed: Operator did not acknowledge alert within 10 seconds.", "SLA");
  }, slaAcknowledgeLimit);

  let remaining = 10;
  slaCountdown = setInterval(() => {
    remaining--;
    if (remaining >= 0 && !slaViolated) {
      slaTimerDisplay.textContent = `⏱ ${remaining}s to acknowledge alert...`;
    }
    if (remaining <= 0) clearInterval(slaCountdown);
  }, 1000);

  log("⚠️ No real activity. Triggering test scenario.", "TEST");
}

function acknowledgeTest() {
  clearTimeout(ackTimer);
  clearInterval(slaCountdown);
  checklistStartTime = Date.now();
  ackButton.style.display = "none";
  checklistContainer.style.display = "block";
  slaTimerDisplay.textContent = "";
  testModal.classList.remove("active");

  const steps = JSON.parse(checklistContainer.dataset.steps);
  checklistContainer.innerHTML = "";
  steps.forEach((step, index) => {
    const item = document.createElement("div");
    item.innerHTML = `<input type="checkbox" id="chk${index}" onchange="checkChecklist()">
                      <label for="chk${index}"> ${step}</label>`;
    checklistContainer.appendChild(item);
  });

  if (!slaViolated) {
    log("🟢 Operator acknowledged test scenario on time. Checklist displayed.", "TEST");
  } else {
    log("🔴 Operator acknowledged test scenario LATE. SLA was violated.", "SLA");
  }
}

function checkChecklist() {
  const checkboxes = checklistContainer.querySelectorAll("input[type='checkbox']");
  const allChecked = Array.from(checkboxes).every(chk => chk.checked);
  closeButton.disabled = !allChecked;
}

function closeTestAlert() {
  testModal.style.display = "none";
  testModal.classList.remove("active");

  if (checklistStartTime) {
    const durationMs = Date.now() - checklistStartTime;
    const durationSec = Math.floor(durationMs / 1000);
    const durationMin = (durationSec / 60).toFixed(2);
    log(`📋 Checklist completed in ${durationSec} seconds (${durationMin} minutes).`, "TEST");
    checklistStartTime = null;
  }

  if (slaViolated) {
    const reason = prompt("SLA was missed. Please provide a reason:");
    if (reason) {
      log(`📝 SLA Violation Reason: ${reason}`, "SLA");
    } else {
      log("📝 SLA Violation Reason: No reason provided.", "SLA");
    }
  }

  lastRealEventTime = Date.now();
  testAlertActive = false;
  inactivityLimit = getRandomInactivityLimit();
  log("✅ Test alert completed and closed.", "TEST");
}

function checkInactivity() {
  const now = Date.now();
  if (!operator) return;
  if (!testAlertActive && now - lastRealEventTime > inactivityLimit) {
    triggerTestScenario();
  }
}

setInterval(checkInactivity, 5000);

function exportCSV() {
  const header = ["Time", "Operator", "Message", "Type"];
  const rows = logs.map(log =>
    `"${log.time}","${log.operator}","${log.message.replace(/\"/g, '\"\"')}","${log.type}"`
  );
  const csvContent = "data:text/csv;charset=utf-8," + header.join(",") + "\n" + rows.join("\n");

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `operator_log_${new Date().toISOString()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}