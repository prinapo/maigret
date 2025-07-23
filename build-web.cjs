const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

// 🔹 Carica variabili da .env
require("dotenv").config();

// 🔹 Leggi credenziali FTP da .env
const { FTP_USER, FTP_PASS, FTP_HOST, FTP_PORT } = process.env;

// 1. Build Quasar
console.log("▶️ Build Quasar...");
execSync("npx quasar build", { stdio: "inherit" });

// 2. Cartella di output
const distPath = path.join(__dirname, "dist", "spa");

// 3. Genera script per WinSCP
const winscpScript = `
option batch abort
option confirm off
open ftp://${encodeURIComponent(FTP_USER)}:${encodeURIComponent(FTP_PASS)}@${FTP_HOST}:${FTP_PORT}
lcd "${distPath}"
cd /
put *.*
exit
`;

const scriptPath = path.join(__dirname, "winscp_upload.txt");
fs.writeFileSync(scriptPath, winscpScript);
console.log("📄 Script WinSCP generato.");

// 4. Esegui upload
console.log("⬆️ Upload in corso...");
execSync(
  `"C:\\Program Files (x86)\\WinSCP\\winscp.com" /script="${scriptPath}"`,
  { stdio: "inherit" },
);

console.log("✅ Upload completato!");
