#!/usr/bin/env node
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// --- PARSING OPZIONI CLI ---
const args = process.argv.slice(2);
const doMinor = args.includes("--minor") || args.includes("-minor");

// --- FUNZIONI UTILI ---
function run(cmd, opts = {}) {
  console.log(`[RUN] ${cmd}`);
  execSync(cmd, { stdio: "inherit", ...opts });
}

function getDeviceSerial() {
  let deviceSerial = process.env.DEVICE_SERIAL;
  if (!deviceSerial) {
    const devices = execSync("adb devices")
      .toString()
      .split("\n")
      .filter(line => line.match(/device$/) && !line.startsWith("List"))
      .map(line => line.split("\t")[0]);
    if (devices.length === 1) {
      deviceSerial = devices[0];
    } else {
      throw new Error("Specifica DEVICE_SERIAL o collega un solo device!");
    }
  }
  return deviceSerial;
}

function updateQuasarConfig(versionName, versionCode) {
  const quasarConfigPath = path.join(__dirname, "quasar.config.js");
  let quasarConfig = fs.readFileSync(quasarConfigPath, "utf8");
  quasarConfig = quasarConfig
    .replace(
      /APP_VERSION: JSON.stringify\("[^"]+"\)/,
      `APP_VERSION: JSON.stringify("${versionName}")`,
    )
    .replace(
      /VERSION_CODE: JSON.stringify\("[^"]+"\)/,
      `VERSION_CODE: JSON.stringify("${versionCode}")`,
    );
  fs.writeFileSync(quasarConfigPath, quasarConfig, "utf8");
  console.log(
    `Aggiornato quasar.config.js: APP_VERSION=${versionName}, VERSION_CODE=${versionCode}`,
  );
}

// --- 1. VERSIONAMENTO (solo se richiesto) ---
if (doMinor) {
  console.log("Incremento versione minor...");
  run("npm version minor --no-git-tag-version");

  // Leggi la nuova versione
  const pkgPath = path.join(__dirname, "package.json");
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  const version = pkg.version; // es: '4.4.0'
  const [major, minor] = version.split(".");
  const versionCode = parseInt(major) * 100 + parseInt(minor); // es: 4*100+4 = 404
  const versionName = `${major}.${minor.padStart(2, "0")}`; // es: '4.04'

  // Aggiorna quasar.config.js
  updateQuasarConfig(versionName, versionCode);

  // Aggiorna build.gradle
  console.log("Aggiorno build.gradle con la nuova versione...");
  run("node update-android-version.cjs");
}

// --- 2. BUILD E SYNC ---
console.log("Eseguo build di produzione e sync...");
run("quasar build -m capacitor -T android");
run("npx cap sync android");
console.log("Build di produzione e sync completati.");

// --- 3. COMPILAZIONE APK ---
console.log("Compilazione APK debug con gradle...");
const isWin = process.platform === "win32";
const gradleCmd = isWin
  ? path.join("src-capacitor", "android", "gradlew.bat")
  : path.join("src-capacitor", "android", "gradlew");
const gradleBuildCmd = isWin
  ? `"${gradleCmd}" assembleDebug`
  : `chmod +x \"${gradleCmd}\" && \"${gradleCmd}\" assembleDebug`;
run(gradleBuildCmd);

// --- 4. INSTALLAZIONE SU DEVICE ---
try {
  const deviceSerial = getDeviceSerial();
  const apkPath = path.join(
    "src-capacitor",
    "android",
    "app",
    "build",
    "outputs",
    "apk",
    "debug",
    "app-debug.apk"
  );
  console.log("Installazione APK su dispositivo via adb...");
  run(`adb -s ${deviceSerial} install -r ${apkPath}`);
  console.log("APK installato sul dispositivo. Puoi testare l'app ora.");
} catch (err) {
  console.error("Errore durante l'installazione su device:", err.message);
  process.exit(1);
}