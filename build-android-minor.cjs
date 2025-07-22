const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// 1. Bump minor version in package.json
console.log("Incremento versione minor...");
execSync("npm version minor --no-git-tag-version", { stdio: "inherit" });

// 2. Leggi la nuova versione
const pkgPath = path.join(__dirname, "package.json");
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
const version = pkg.version; // es: '4.4.0'
const [major, minor] = version.split(".");
const versionCode = parseInt(major) * 100 + parseInt(minor); // es: 4*100+4 = 404
const versionName = `${major}.${minor.padStart(2, "0")}`; // es: '4.04'

// 3. Aggiorna quasar.config.js
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

// 4. Aggiorna build.gradle
console.log("Aggiorno build.gradle con la nuova versione...");
execSync("node update-android-version.cjs", { stdio: "inherit" });

// 5. Build di produzione e sync
console.log("Eseguo build di produzione e sync...");
execSync("quasar build -m capacitor -T android", { stdio: "inherit" });
execSync("npx cap sync android", { stdio: "inherit" });
console.log(
  "Build di produzione e sync completati. Ora puoi aprire Android Studio e lanciare l'app.",
);

// 6. Compila APK debug con gradlew.bat
console.log("Compilazione APK debug con gradlew...");
execSync(".\\src-capacitor\\android\\gradlew.bat assembleDebug", {
  stdio: "inherit",
});

// 7. Installa APK sul dispositivo via adb (specifica seriale device)
console.log("Installazione APK su dispositivo via adb...");
execSync(
  "adb -s BV6600EEA0051073 install -r .\\src-capacitor\\android\\app\\build\\outputs\\apk\\debug\\app-debug.apk",
  { stdio: "inherit" },
);

console.log("APK installato sul dispositivo. Puoi testare l'app ora.");
