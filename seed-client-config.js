// seed-client-config.js
const admin = require("firebase-admin");
const serviceAccount = require("./firebase-service-account.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const defaultConfig = {
  testFrequencyMinutes: 60,
  enabledScenarios: {
    evacuation: true,
    fire: true,
    systemDown: true,
  },
};

async function seedConfigs() {
  const snapshot = await db.collection("clients").get();

  if (snapshot.empty) {
    console.log("No client documents found.");
    return;
  }

  for (const doc of snapshot.docs) {
    await doc.ref.update({ config: defaultConfig });
    console.log(`✅ Updated config for client: ${doc.id}`);
  }

  console.log("🎉 Seeding complete.");
}

seedConfigs().catch((err) => {
  console.error("Seeding error:", err);
});