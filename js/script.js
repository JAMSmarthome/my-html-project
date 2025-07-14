let operator = "";
let testAlertActive = false;
let slaViolated = false;
let testTriggeredTime = null;
let checklistStartTime = null;
let ackTimer, slaCountdown;

const inactivityMin = 10 * 1000;
const inactivityMax = 60 * 1000;
let inactivityLimit = getRandomInactivityTime();

const logBox = document.getElementById("log");
const loginSection = document.getElementById("loginSection");
const mainConsole = document.getElementById("mainConsole");
const testModal = document.getElementById("testModal");
const testScenarioTitle = document.getElementById("testScenarioTitle");
const testProcedure = document.getElementById("testProcedure");
const slaTimerDisplay = document.getElementById("slaTimerDisplay");
const ackButton = document.getElementById("ackButton");
const checklistSection = document.getElementById("checklistSection");
const checklistContainer = document.getElementById("checklist");
const slaReason = document.getElementById("slaReason");
const closeButton = document.getElementById("closeAlert");

let lastRealEventTime = Date.now();
let logs = [];

const testScenarios = [
  {
    title: "Armed Response",
    procedure: "SOP-AR1",
    steps: [
      "Acknowladge Alert",
      "Contact User",
      "Qualify Alert",
      "Assign Response Team",
      "Make followup calls",
      "Inform Managment",
      "Record Incedent Details",
      "Submit IR Report",
      "Complete Incident"
    ]
  },
  {
    title: "Medical Response",
    procedure: "SOP-MR1",
    steps: [
      "Acknowladge Alert",
      "Contact User",
      "Qualify Alert",
      "Assign to Medical Response",
      "Make followup calls",
      "Inform Managment",
      "Record Incedent Details",
      "Submit IR Report",
      "Complete Incident"
    ]
  }
];

function loginOperator() {
  const name = document.getElementById("operatorName").value.trim();
  if (!name) return alert("Please enter your name");
  operator = name;
  loginSection.classList.add("hidden");
  mainConsole.classList.remove("hidden");
  document.getElementById("loggedInOperator").textContent = operator;
  log(`👤 Operator ${operator} signed in.`);
}

function logRealEvent() {
  lastRealEventTime = Date.now();
  log("✅ Real emergency logged.");
  inactivityLimit = getRandomInactivityTime();
}

function log(message) {
  const time = new Date().toLocaleTimeString();
  logBox.innerHTML += `[${time}] ${message}<br>`;
  logBox.scrollTop = logBox.scrollHeight;
  logs.push({ time, message });
  localStorage.setItem("emergencyLogs", JSON.stringify(logs));
}

function triggerTestScenario() {
  if (testAlertActive || !operator) return;
  const scenario = testScenarios[Math.floor(Math.random() * testScenarios.length)];
  const randomizedSteps = scenario.steps.map(step => ({ text: step, fill: false }));

  const blankCount = Math.floor(Math.random() * 3) + 1;
  const indices = [...randomizedSteps.keys()].sort(() => 0.5 - Math.random()).slice(0, blankCount);
  indices.forEach(i => {
    randomizedSteps[i].fill = true;
    randomizedSteps[i].text = "______";
  });

  checklistContainer.innerHTML = "";
  checklistContainer.dataset.steps = JSON.stringify(randomizedSteps);
  checklistSection.classList.add("hidden");
  closeButton.disabled = true;
  slaReason.classList.add("hidden");
  slaReason.value = "";

  testScenarioTitle.textContent = scenario.title;
  testProcedure.textContent = scenario.procedure;
  slaTimerDisplay.textContent = "⏱ Acknowledge within 10 seconds...";
  ackButton.style.display = "block";

  testModal.classList.remove("hidden");
  testModal.querySelector(".modal-box").classList.add("flashing");

  testAlertActive = true;
  slaViolated = false;
  testTriggeredTime = Date.now();

  ackTimer = setTimeout(() => {
    slaViolated = true;
    slaTimerDisplay.textContent = "❌ SLA missed!";
    log("⏱️ SLA missed: No acknowledgment within 10s.");
  }, 10000);

  let countdown = 10;
  slaCountdown = setInterval(() => {
    countdown--;
    if (!slaViolated && countdown >= 0)
      slaTimerDisplay.textContent = `⏱ ${countdown}s to acknowledge...`;
    if (countdown <= 0) clearInterval(slaCountdown);
  }, 1000);

  log("⚠️ Triggering random test scenario.");
}

function acknowledgeTest() {
  clearTimeout(ackTimer);
  clearInterval(slaCountdown);
  checklistStartTime = Date.now();

  ackButton.style.display = "none";
  checklistSection.classList.remove("hidden");
  testModal.querySelector(".modal-box").classList.remove("flashing");

  const steps = JSON.parse(checklistContainer.dataset.steps);
  checklistContainer.innerHTML = "";

  steps.forEach((step, index) => {
    const div = document.createElement("div");
    div.className = "checklist-item";

    if (step.fill) {
      div.innerHTML = `
        <input type="text" placeholder="Describe your action" id="stepInput${index}" oninput="checkChecklist()">`;
    } else {
      div.innerHTML = `
        <input type="checkbox" id="chk${index}" onchange="checkChecklist()">
        <label>${step.text}</label>`;
    }

    checklistContainer.appendChild(div);
  });

  if (!slaViolated) {
    log("🟢 Alert acknowledged on time. Starting checklist.");
  } else {
    log("🔴 Alert acknowledged late. SLA missed.");
  }
}

function checkChecklist() {
  const textInputs = checklistContainer.querySelectorAll("input[type='text']");
  const checkboxes = checklistContainer.querySelectorAll("input[type='checkbox']");

  let allTextFilled = true;
  let allChecked = true;

  checklistContainer.querySelectorAll(".checklist-item").forEach((item, index) => {
    const input = item.querySelector("input[type='text']");
    const checkbox = item.querySelector("input[type='checkbox']");
    const isComplete =
      (input && input.value.trim() !== "") || (checkbox && checkbox.checked);

    item.classList.toggle("completed", isComplete);

    if (input && input.value.trim() === "") allTextFilled = false;
    if (checkbox && !checkbox.checked) allChecked = false;
  });

  closeButton.disabled = !(allTextFilled && allChecked);
}

function closeTestAlert() {
  const duration = ((Date.now() - checklistStartTime) / 1000).toFixed(1);

  const steps = [];
  checklistContainer.querySelectorAll(".checklist-item").forEach((item, i) => {
    const input = item.querySelector("input[type='text']");
    const checkbox = item.querySelector("input[type='checkbox']");
    if (input) {
      steps.push({
        text: input.placeholder || "",
        input: input.value.trim(),
        manual: true
      });
    } else if (checkbox) {
      const label = item.querySelector("label");
      steps.push({
        text: label?.innerText || "",
        manual: false
      });
    }
  });

  let entry = `✅ Alert closed. Checklist duration: ${duration}s.`;
  let reason = slaViolated && slaReason.value.trim() ? slaReason.value.trim() : "";

  if (slaViolated && !reason) {
    slaReason.classList.remove("hidden");
    slaReason.focus();
    return;
  }

  logs.push({
    time: new Date().toLocaleTimeString(),
    message: entry,
    slaViolated,
    slaReason: reason,
    checklistSteps: steps
  });

  log(entry);
  testModal.classList.add("hidden");
  testAlertActive = false;
  lastRealEventTime = Date.now();
  inactivityLimit = getRandomInactivityTime();
}

function exportCSV() {
  let csv = [
    "Timestamp",
    "Event Type",
    "SLA Status",
    "SLA Reason",
    "Scenario Title",
    "Checklist Summary",
    "Operator Name"
  ].join(",") + "\n";

  logs.forEach(log => {
    const timestamp = log.time || "";
    const type = log.type || (log.isTest ? "Test" : "Real");
    const slaStatus = log.slaViolated ? "Missed" : "Met";
    const slaReason = log.slaViolated && log.slaReason ? log.slaReason : "";
    const title = log.scenarioTitle || "";
    const checklistSummary = Array.isArray(log.checklistSteps)
      ? log.checklistSteps.map(step =>
          step.manual
            ? `[MANUAL] ${step.input || step.text}`
            : step.text
        ).join(" | ")
      : "";
    const operator = log.operator || "";

    csv += [
      `"${timestamp}"`,
      `"${type}"`,
      `"${slaStatus}"`,
      `"${slaReason}"`,
      `"${title}"`,
      `"${checklistSummary}"`,
      `"${operator}"`
    ].join(",") + "\n";
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `emergency-log-${new Date().toISOString().slice(0,19).replace(/:/g, "-")}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function getRandomInactivityTime() {
  return Math.floor(Math.random() * (inactivityMax - inactivityMin + 1)) + inactivityMin;
}

setInterval(() => {
  const now = Date.now();
  if (!testAlertActive && operator && now - lastRealEventTime > inactivityLimit) {
    triggerTestScenario();
  }
}, 5000);