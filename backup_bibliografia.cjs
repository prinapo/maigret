const fs = require("fs");
const path = require("path");
const admin = require("firebase-admin");
const { getFirestore } = require("firebase-admin/firestore");

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
});

const db = getFirestore();

function getTimestamp() {
  const now = new Date();
  const pad = (n) => n.toString().padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
}

async function backupBibliografia() {
  const backupDir = path.join(__dirname, "firestore_backup");
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir);
  const timestamp = getTimestamp();

  const snapshot = await db.collection("Bibliografia").get();
  const docs = snapshot.docs.map((doc) => {
    const data = doc.data();
    data.id = doc.id; // Assicura che l'id sia sempre presente
    return data;
  });
  const filePath = path.join(backupDir, `Bibliografia_${timestamp}.json`);
  fs.writeFileSync(filePath, JSON.stringify(docs, null, 2), "utf-8");
  console.log(`Backup Bibliografia: ${docs.length} documenti -> ${filePath}`);

  // Stampa i campi trovati per debug
  const allFields = new Set();
  docs.forEach((doc) => Object.keys(doc).forEach((k) => allFields.add(k)));
  console.log("Campi trovati:", Array.from(allFields));
}

backupBibliografia().then(() => process.exit(0));
