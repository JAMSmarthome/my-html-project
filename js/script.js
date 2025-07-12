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
    title: "Gas Leak in Control Room",
    procedure: "Follow Emergency Evacuation SOP-GAS-17.",
    steps: [
      { text: "Evacuate the control room" },
      { text: "______", fill: true },
      { text: "Shut off gas valves" },
      { text: "______", fill: true }
    ]
  },
  {
    title: "Chemical Spill in Lab 2",
    procedure: "Initiate Decontamination Procedure SOP-CHEM-12.",
    steps: [
      { text: "______", fill: true },
      { text: "Use spill kit" },
      { text: "Notify hazardous material team" },
      { text: "______", fill: true }
    ]
  },
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

  // Clone steps to avoid modifying original scenario
  const randomizedSteps = scenario.steps.map(step => ({ ...step, fill: false }));

  // Randomly choose 1 to 3 steps to make into blanks
  const blanksToFill = Math.floor(Math.random() * 2) + 1;
  const indexes = Array.from(randomizedSteps.keys());
  const shuffled = indexes.sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, blanksToFill);

  selected.forEach(index => {
    randomizedSteps[index].fill = true;
    randomizedSteps[index].text = "______";
  });

  testScenarioText.innerHTML = `<strong>${scenario.title}</strong><br>${scenario.procedure}`;
  checklistContainer.innerHTML = "";
  checklistContainer.style.display = "none";
  closeButton.disabled = true;
  ackButton.style.display = "inline-block";
  checklistContainer.dataset.steps = JSON.stringify(randomizedSteps);
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
    const stepId = `chk${index}`;

    if (step.fill) {
      item.innerHTML = `
        <label for="${stepId}">Step ${index + 1}:</label><br>
        <input type="text" id="${stepId}_input" placeholder="Describe your action" oninput="checkChecklist()">
        <input type="checkbox" id="${stepId}" onchange="checkChecklist()"> Confirm
      `;
    } else {
      item.innerHTML = `
        <input type="checkbox" id="${stepId}" onchange="checkChecklist()">
        <label for="${stepId}"> ${step.text}</label>
      `;
    }

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

  const inputs = checklistContainer.querySelectorAll("input[type='text']");
  const allFilled = Array.from(inputs).every(input => input.value.trim() !== "");

  closeButton.disabled = !(allChecked && allFilled);
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