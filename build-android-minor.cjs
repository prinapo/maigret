const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const readline = require("readline");

// Funzione per prompt sincrono
function prompt(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) =>
    rl.question(question, (ans) => {
      rl.close();
      resolve(ans);
    })
  );
}

(async () => {
  const answer = (await prompt("Vuoi fare una release Play Store? (s/n): ")).trim().toLowerCase();
  const isPlayStore = answer === "s" || answer === "si" || answer === "y";

  if (isPlayStore) {
    // 1. Bump minor version in package.json
    console.log("Incremento versione minor...");
    execSync("npm version minor --no-git-tag-version", { stdio: "inherit" });
  } else {
    console.log("Build di test: la versione minor NON viene incrementata.");
  }

  // 2. Leggi la versione
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

  if (isPlayStore) {
    // 6. Genera app bundle firmato
    console.log("Genero app bundle firmato per Play Store...");
    execSync("cd src-capacitor/android && ./gradlew bundleRelease", { stdio: "inherit" });
    console.log(
      "App bundle generato: src-capacitor/android/app/build/outputs/bundle/release/app-release.aab"
    );
  } else {
    console.log("Build di test completata. Nessun app bundle generato.");
  }
})();
