const express = require("express");
const session = require("express-session");
const bcrypt = require("bcrypt");
const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const serviceAccount = require("./firebase-service-account.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

app.use(
  session({
    secret: "secure-key",
    resave: false,
    saveUninitialized: true,
  })
);

// ========== ✅ CLIENT LOGIN ==========
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

    const valid = await bcrypt.compare(password, client.password);
    if (!valid) return res.status(401).json({ error: "Invalid password" });

    req.session.user = {
      username: client.username,
      lane: client.lane,
      isClient: true,
      clientId: clientDoc.id,
    };

    res.json({ success: true, lane: client.lane });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ========== ✅ CLIENT CONFIG - GET ==========
app.get("/api/client-config", async (req, res) => {
  if (!req.session.user?.isClient)
    return res.status(401).json({ error: "Unauthorized" });

  try {
    const doc = await db.collection("clients").doc(req.session.user.clientId).get();
    const client = doc.data();

    res.json({ config: client.config || {} });
  } catch (err) {
    console.error("Fetch error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ========== ✅ CLIENT CONFIG - PUT ==========
app.put("/api/client-config", async (req, res) => {
  if (!req.session.user?.isClient)
    return res.status(401).json({ error: "Unauthorized" });

  const { config } = req.body;
  try {
    await db.collection("clients").doc(req.session.user.clientId).update({ config });
    res.json({ success: true });
  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({ error: "Update failed" });
  }
});

// ========== ✅ ADMIN LOGIN ==========
app.post("/api/admin-login", (req, res) => {
  const { username, password } = req.body;
  if (username === "admin" && password === "admin123") {
    req.session.user = { isAdmin: true };
    return res.json({ success: true });
  }
  return res.status(401).json({ error: "Invalid admin credentials" });
});

// ========== ✅ ADMIN LOGOUT ==========
app.post("/api/admin-logout", (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

// ========== ✅ ADMIN CONFIG GET ALL ==========
app.get("/api/admin/configs", async (req, res) => {
  if (!req.session.user?.isAdmin)
    return res.status(401).json({ error: "Unauthorized" });

  try {
    const snapshot = await db.collection("clients").get();
    const configs = snapshot.docs.map((doc) => ({
      id: doc.id,
      username: doc.data().username,
      lane: doc.data().lane,
      config: doc.data().config || {},
    }));
    res.json({ clients: configs });
  } catch (err) {
    console.error("Error fetching configs:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ========== ✅ ADMIN CONFIG UPDATE ==========
app.put("/api/admin/configs/:clientId", async (req, res) => {
  if (!req.session.user?.isAdmin)
    return res.status(401).json({ error: "Unauthorized" });

  const { clientId } = req.params;
  const { config } = req.body;

  try {
    await db.collection("clients").doc(clientId).update({ config });
    res.json({ success: true });
  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({ error: "Update failed" });
  }
});

// ========== ✅ SERVER START ==========
app.listen(PORT, () => {
  console.log(`🚨 Server running on http://localhost:${PORT}`);
});