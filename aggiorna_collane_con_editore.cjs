const fs = require("fs");

const COLLANA_PATH = "./firestore_backup/Collane_2025-07-04_14-58-33.json";
const ABBINAMENTI_PATH = "./editori_collane.json";
const EDITORI_PATH = "./firestore_backup/Editori_2025-07-04_14-58-33.json";
const OUTPUT_PATH = "./Collane_aggiornate.json";

const rawCollane = fs.readFileSync(COLLANA_PATH, "utf-8");
const rawAbbinamenti = fs.readFileSync(ABBINAMENTI_PATH, "utf-8");
const rawEditori = fs.readFileSync(EDITORI_PATH, "utf-8");
const collaneData = JSON.parse(rawCollane);
const abbinamenti = JSON.parse(rawAbbinamenti);
const editoriData = JSON.parse(rawEditori);

// Mappa nome editore (label) -> id (value)
const editoriArr =
  Array.isArray(editoriData) && editoriData[0]?.editore
    ? editoriData[0].editore
    : [];
const mappaNomeEditoreId = new Map();
editoriArr.forEach(({ label, value }) => {
  mappaNomeEditoreId.set(label.trim().toLowerCase(), value);
});

// Mappa collana -> nome editore
const mappaCollanaEditoreNome = new Map();
abbinamenti.forEach(({ editore, collana }) => {
  mappaCollanaEditoreNome.set(collana.trim().toLowerCase(), editore);
});

// Trova l'array delle collane
const collaneArr =
  Array.isArray(collaneData) && collaneData[0]?.collana
    ? collaneData[0].collana
    : [];

const collaneAggiornate = collaneArr.map((c) => {
  const editoreNome =
    mappaCollanaEditoreNome.get(c.label.trim().toLowerCase()) || null;
  const editoreId = editoreNome
    ? mappaNomeEditoreId.get(editoreNome.trim().toLowerCase())
    : null;
  return editoreId ? { ...c, editore: editoreId } : { ...c };
});

// Scrivi il nuovo file
const output = [{ id: "default", collana: collaneAggiornate }];
fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2), "utf-8");
console.log(`Salvate ${collaneAggiornate.length} collane in ${OUTPUT_PATH}`);
