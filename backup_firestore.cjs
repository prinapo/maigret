const fs = require("fs");
const path = require("path");
const admin = require("firebase-admin");
const { getFirestore } = require("firebase-admin/firestore");

// Inizializza Firebase Admin SDK (usa le tue credenziali)
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
});

const db = getFirestore();

function getTimestamp() {
  const now = new Date();
  const pad = (n) => n.toString().padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
}

async function backupAllCollections() {
  const collections = await db.listCollections();
  const backupDir = path.join(__dirname, "firestore_backup");
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir);
  const timestamp = getTimestamp();

  for (const col of collections) {
    const colName = col.id;
    const snapshot = await db.collection(colName).get();
    const docs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    const filePath = path.join(backupDir, `${colName}_${timestamp}.json`);
    fs.writeFileSync(filePath, JSON.stringify(docs, null, 2), "utf-8");
    console.log(`Backup ${colName}: ${docs.length} documenti -> ${filePath}`);
  }
  console.log("Backup completato!");
}

backupAllCollections().then(() => process.exit(0));
