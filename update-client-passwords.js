const admin = require("firebase-admin");
const bcrypt = require("bcrypt");

const serviceAccount = require("./firebase-service-account.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function updateClients() {
  const snapshot = await db.collection("clients").get();
  const passwordHash = await bcrypt.hash("password", 10);
  const batch = db.batch();

  snapshot.forEach((doc) => {
    const ref = db.collection("clients").doc(doc.id);
    batch.update(ref, {
      passwordHash: passwordHash,
      password: admin.firestore.FieldValue.delete(),
    });
    console.log(`✔ Updating ${doc.id}`);
  });

  await batch.commit();
  console.log("✅ All clients updated with hashed password.");
}

updateClients().catch(console.error);