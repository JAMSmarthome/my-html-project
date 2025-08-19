// ✅ FULL UPDATED server.js (Step 2)
const express = require("express");
const session = require("express-session");
const bcrypt = require("bcrypt");
const admin = require("firebase-admin");
const cors = require("cors");
const path = require("path");

const serviceAccount = require("./firebase-service-account.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const app = express();
const PORT = 3000;

app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(express.static("public"));

app.use(
  session({
    secret: "secure-key",
    resave: false,
    saveUninitialized: true,
  })
);

// 🔐 Client Login via Firestore (with password field used)
app.post("/api/client-login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: "Missing credentials" });

  try {
    const snapshot = await db
      .collection("clients")
      .where("username", "==", username)
      .limit(1)
      .get();

    if (snapshot.empty) return res.status(401).json({ error: "User not found" });

    const clientDoc = snapshot.docs[0];
    const client = clientDoc.data();

    if (!client.password) return res.status(401).json({ error: "Missing password in Firestore" });

    const valid = await bcrypt.compare(password, client.password);
    if (!valid) return res.status(401).json({ error: "Invalid password" });

    req.session.user = {
      username: client.username,
      lane: client.lane,
      isClient: true,
    };

    res.json({ success: true, lane: client.lane });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Client logout
app.post("/api/client-logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.json({ success: true });
  });
});

// 🔍 GET client config
app.get("/api/client-config", async (req, res) => {
  if (!req.session.user || !req.session.user.isClient) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const snapshot = await db
      .collection("clients")
      .where("username", "==", req.session.user.username)
      .limit(1)
      .get();

    if (snapshot.empty) return res.status(404).json({ error: "Client not found" });

    const client = snapshot.docs[0].data();
    res.json({ config: client.config || {} });
  } catch (err) {
    console.error("Config GET error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ✏️ PUT client config
app.put("/api/client-config", async (req, res) => {
  if (!req.session.user || !req.session.user.isClient) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const newConfig = req.body.config;
  if (!newConfig) return res.status(400).json({ error: "Missing config data" });

  try {
    const snapshot = await db
      .collection("clients")
      .where("username", "==", req.session.user.username)
      .limit(1)
      .get();

    if (snapshot.empty) return res.status(404).json({ error: "Client not found" });

    const clientDoc = snapshot.docs[0].ref;
    await clientDoc.update({ config: newConfig });

    res.json({ success: true });
  } catch (err) {
    console.error("Config PUT error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ PUT /api/client-config — Update current client's config
app.put("/api/client-config", async (req, res) => {
  if (!req.session.user || !req.session.user.isClient) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { config } = req.body;
  if (!config || typeof config !== "object") {
    return res.status(400).json({ error: "Invalid config payload" });
  }

  try {
    await db.collection("clients").doc(req.session.user.docId).update({
      config: config
    });

    res.json({ success: true, updatedConfig: config });
  } catch (err) {
    console.error("Update config error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// 🚀 Start Server
app.listen(PORT, () => {
  console.log(`\u{1F6A8} Server running on http://localhost:${PORT}`);
});