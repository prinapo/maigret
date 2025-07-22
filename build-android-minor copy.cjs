const { execSync } = require("child_process");
const path = require("path");

// 1. Build di produzione e sync
console.log("Eseguo build di produzione e sync...");
execSync("quasar build -m capacitor -T android", { stdio: "inherit" });
execSync("npx cap sync android", { stdio: "inherit" });
console.log("Build di produzione e sync completati.");

// 2. Compila APK debug con gradlew.bat
console.log("Compilazione APK debug con gradlew...");
execSync(
  path.join("src-capacitor", "android", "gradlew.bat") + " assembleDebug",
  { stdio: "inherit" },
);

// 3. Installa APK sul dispositivo via adb (specifica seriale device)
const deviceSerial = "BV6600EEA0051073";
const apkPath = path.join(
  "src-capacitor",
  "android",
  "app",
  "build",
  "outputs",
  "apk",
  "debug",
  "app-debug.apk",
);

console.log("Installazione APK su dispositivo via adb...");
execSync(`adb -s ${deviceSerial} install -r ${apkPath}`, { stdio: "inherit" });

console.log("APK installato sul dispositivo. Puoi testare l'app ora.");
