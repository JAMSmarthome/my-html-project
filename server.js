// server.js
import express from "express";
import session from "express-session";
import bcrypt from "bcrypt";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const __dirname = path.resolve();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: process.env.SESSION_SECRET || "supersecret123",
    resave: false,
    saveUninitialized: false,
  })
);

// Serve static files
app.use(express.static(path.join(__dirname, "public")));

// Load users
const usersPath = path.join(__dirname, "data", "users.json");
let users = {};
if (fs.existsSync(usersPath)) {
  users = JSON.parse(fs.readFileSync(usersPath, "utf8"));
  console.log(`[INFO] Loaded ${Object.keys(users).length} users`);
} else {
  console.log("[WARN] No users.json found — run scripts/generate-users.js first.");
}

// --- API routes ---

// Health check
app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

// Login
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  const user = users[username];
  if (!user) return res.status(401).json({ ok: false, error: "User not found" });

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) return res.status(401).json({ ok: false, error: "Invalid password" });

  req.session.user = { username, lane: user.lane };
  res.json({ ok: true, user: req.session.user });
});

// Logout
app.post("/api/logout", (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

// Current user
app.get("/api/me", (req, res) => {
  res.json({ user: req.session.user || null });
});

// Example: lanes data
app.get("/api/lanes", (req, res) => {
  const lanesPath = path.join(__dirname, "lanes.json");
  if (fs.existsSync(lanesPath)) {
    const lanes = JSON.parse(fs.readFileSync(lanesPath, "utf8"));
    res.json({ ok: true, lanes });
  } else {
    res.json({ ok: true, lanes: [] });
  }
});

// Catch-all for frontend routes
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});