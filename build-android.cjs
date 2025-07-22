#!/usr/bin/env node
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const readline = require("readline");

// --- PARSING OPZIONI CLI ---
const args = process.argv.slice(2);
let doMinor = args.includes("--minor") || args.includes("-minor");
let buildOnly = args.includes("--build-only") || args.includes("-build-only");
const interactive = args.length === 0;

// --- FUNZIONI UTILI ---
function run(cmd, opts = {}) {
  console.log(`[RUN] ${cmd}`);
  execSync(cmd, { stdio: "inherit", ...opts });
}

function ask(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((res) =>
    rl.question(question, (answer) => {
      rl.close();
      res(answer);
    }),
  );
}

async function getDeviceSerial() {
  let deviceSerial = process.env.DEVICE_SERIAL;
  if (!deviceSerial) {
    const devices = execSync("adb devices")
      .toString()
      .split("\n")
      .filter((line) => line.match(/device$/) && !line.startsWith("List"))
      .map((line) => line.split("\t")[0]);
    if (devices.length === 0) {
      throw new Error(
        "Nessun device trovato! Collega almeno un dispositivo via USB o imposta DEVICE_SERIAL.",
      );
    } else if (devices.length === 1) {
      deviceSerial = devices[0];
    } else {
      console.log("Dispositivi trovati:");
      devices.forEach((d, i) => console.log(`  [${i + 1}] ${d}`));
      let idx = -1;
      while (idx < 0 || idx >= devices.length) {
        const answer = await ask(
          `Scegli il dispositivo su cui installare l'app [1-${devices.length}]: `,
        );
        idx = parseInt(answer, 10) - 1;
        if (isNaN(idx) || idx < 0 || idx >= devices.length) {
          console.log("Scelta non valida. Riprova.");
        }
      }
      deviceSerial = devices[idx];
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

(async () => {
  // --- INTERATTIVITÀ ---
  if (interactive) {
    const minorAnswer = await ask(
      "Vuoi incrementare la versione minor? [y/N]: ",
    );
    doMinor = /^y(es)?$/i.test(minorAnswer.trim());
    const buildAnswer = await ask(
      "Vuoi solo buildare o anche installare su device? [1] Solo build  [2] Build + install [default 2]: ",
    );
    buildOnly = buildAnswer.trim() === "1";
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
  const gradleDir = path.join("src-capacitor", "android");
  const gradleCmd = isWin ? "gradlew.bat" : "./gradlew";
  const gradleBuildCmd = isWin
    ? `"${gradleCmd}" assembleDebug`
    : `chmod +x \"${gradleCmd}\" && \"${gradleCmd}\" assembleDebug`;
  run(gradleBuildCmd, { cwd: gradleDir });

  if (buildOnly) {
    console.log(
      "Build completata. Nessuna installazione su device eseguita (--build-only).\nAPK pronto in src-capacitor/android/app/build/outputs/apk/debug/app-debug.apk",
    );
    process.exit(0);
  }

  // --- 4. INSTALLAZIONE SU DEVICE ---
  try {
    const deviceSerial = await getDeviceSerial();
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
    run(`adb -s ${deviceSerial} install -r ${apkPath}`);
    console.log("APK installato sul dispositivo. Puoi testare l'app ora.");
  } catch (err) {
    console.error("Errore durante l'installazione su device:", err.message);
    process.exit(1);
  }
})();
