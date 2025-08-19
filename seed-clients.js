const admin = require("firebase-admin");
const bcrypt = require("bcrypt");
const fs = require("fs");

const serviceAccount = require("./firebase-service-account.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const clients = [
  {
    username: "client1",
    password: "client1pass",
    lane: "client1"
  },
  {
    username: "client2",
    password: "client2pass",
    lane: "client2"
  },
  {
    username: "testuser",
    password: "test1234",
    lane: "test"
  }
];

async function seedClients() {
  for (const client of clients) {
    const hashedPassword = await bcrypt.hash(client.password, 10);
    await db.collection("clients").add({
      username: client.username,
      hashedPassword,
      lane: client.lane
    });
    console.log(`✅ Added ${client.username}`);
  }

  console.log("🎉 All clients seeded.");
  process.exit();
}

seedClients();