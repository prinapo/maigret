const fs = require("fs");

// Percorso del file di backup
const BIBLIOGRAFIA_PATH =
  "./firestore_backup/Bibliografia_2025-07-04_14-58-33.json";
const OUTPUT_PATH = "./editori_collane.json";

// Leggi il file di backup
const raw = fs.readFileSync(BIBLIOGRAFIA_PATH, "utf-8");
const data = JSON.parse(raw);

// Trova la chiave books (caso export da Firestore con id "default")
const books = Array.isArray(data)
  ? data.find((d) => d.id === "default")?.books || []
  : [];

// Set per evitare duplicati
const abbinamenti = new Set();

books.forEach((book) => {
  const editore = book.editore || null;
  const collana = book.collana || null;
  if (editore && collana) {
    abbinamenti.add(`${editore}|||${collana}`);
  }
});

// Trasforma in array di oggetti
const result = Array.from(abbinamenti).map((str) => {
  const [editore, collana] = str.split("|||");
  return { editore, collana };
});

// Salva su file
fs.writeFileSync(OUTPUT_PATH, JSON.stringify(result, null, 2), "utf-8");
console.log(
  `Salvati ${result.length} abbinamenti editore-collana in ${OUTPUT_PATH}`,
);
