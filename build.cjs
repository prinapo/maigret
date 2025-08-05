require("dotenv").config();

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const readline = require("readline");

const WINSCP_PATH = `"C:\\Program Files (x86)\\WinSCP\\winscp.com"`;
const REMOTE_PATH = `/`; // root
const LOCAL_WEB_DIST = `dist/spa`;
const FTP_USER = process.env.FTP_USER;
const FTP_PASSWORD = process.env.FTP_PASS;
const FTP_HOST = process.env.FTP_HOST;

const isWin = process.platform === "win32";
const gradleCmd = isWin ? "gradlew.bat" : "./gradlew";

function run(cmd, options = {}) {
  console.log(`\n> ${cmd}`);
  execSync(cmd, { stdio: "inherit", ...options });
}

function prompt(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) =>
    rl.question(question, (ans) => {
      rl.close();
      resolve(ans);
    }),
  );
}

async function buildAPKorAAB() {
  const answer = (
    await prompt("Vuoi generare AAB o APK? (aab/apk): ")
  ).toLowerCase();
  const buildDir = "src-capacitor/android";

  if (answer === "apk") {
    console.log("Generazione APK...");
    run(`cd ${buildDir} && ${gradleCmd} assembleRelease`);
    console.log(
      "✅ APK generato in: src-capacitor/android/app/build/outputs/apk/release/",
    );
  } else if (answer === "aab") {
    console.log("Generazione AAB...");
    run(`cd ${buildDir} && ${gradleCmd} bundleRelease`);
    console.log(
      "✅ AAB generato in: src-capacitor/android/app/build/outputs/bundle/release/",
    );
  } else {
    console.log("❌ Scelta non valida, nessun file generato.");
  }
}

async function main() {
  console.log("Scegli build:");
  console.log("1. Build Android (Play Store, release, aumenta versione minor)");
  console.log("2. Avvia Web Dev (quasar dev -m spa)");
  console.log("3. Build Web (SPA, upload FTP)");
  console.log("4. Build Android (Debug, installa su dispositivo ADB)");
  console.log(
    "5. Build Android (Debug, installa su dispositivo ADB, aumenta versione minor)",
  );
  console.log("6. Build Android (Release)");
  console.log("7. Build Android (Release, aumenta versione minor)");

  const choice = await prompt("Inserisci 1, 2, 3, 4, 5, 6 o 7: ");

  switch (choice) {
    case "1":
      // Chiedi quale versione incrementare
      const incrementType = (
        await prompt(
          "Quale versione vuoi incrementare? (major/minor/patch, default minor): ",
        )
      ).toLowerCase();

      // Valori accettati per il prompt
      const validIncrements = ["major", "minor", "patch"];
      const inc = validIncrements.includes(incrementType)
        ? incrementType
        : "minor";

      console.log(`Incremento versione ${inc}...`);
      run(`npm version ${inc} --no-git-tag-version`);

      const version = JSON.parse(fs.readFileSync("package.json")).version;
      console.log(`Versione aggiornata: ${version}`);

      // Funzione per aggiornare versionCode e versionName in build.gradle
      function updateVersionInBuildGradle() {
        const buildGradlePath = path.resolve(
          "src-capacitor/android/app/build.gradle",
        );

        if (!fs.existsSync(buildGradlePath)) {
          console.error("❌ build.gradle non trovato: " + buildGradlePath);
          process.exit(1);
        }

        // Esempio di conversione: 4.24.0 -> 42400
        const parts = version.split(".").map((n) => parseInt(n, 10));
        const versionCode = parts[0] * 10000 + parts[1] * 100 + (parts[2] || 0);

        let buildGradleContent = fs.readFileSync(buildGradlePath, "utf8");

        buildGradleContent = buildGradleContent.replace(
          /versionCode\s+\d+/g,
          `versionCode ${versionCode}`,
        );
        buildGradleContent = buildGradleContent.replace(
          /versionName\s+"[^"]+"/g,
          `versionName "${version}"`,
        );

        fs.writeFileSync(buildGradlePath, buildGradleContent, "utf8");

        console.log(
          `Aggiornato build.gradle: versionCode=${versionCode}, versionName=${version}`,
        );
      }

      updateVersionInBuildGradle();

      run("quasar clean");
      run("quasar build -m capacitor -T android");

      const keystorePath = path.resolve("maigret_collector.jks");
      if (!fs.existsSync(keystorePath)) {
        console.error(`❌ File keystore non trovato: ${keystorePath}`);
        process.exit(1);
      }

      const keyAlias = process.env.APP_KEY_ALIAS;
      if (!keyAlias) {
        console.error("❌ Variabile APP_KEY_ALIAS non definita in .env");
        process.exit(1);
      }

      const keyPassword = process.env.APP_KEY_PASSWORD;
      if (!keyPassword) {
        console.error("❌ Variabile APP_KEY_PASSWORD non definita in .env");
        process.exit(1);
      }

      console.log("Generazione AAB con gradle bundleRelease...");
      const isWin = process.platform === "win32";
      const gradleCmd = isWin ? "gradlew.bat" : "./gradlew";

      run(`cd src-capacitor/android && ${gradleCmd} bundleRelease`);

      const aabPath = path.resolve(
        "src-capacitor/android/app/build/outputs/bundle/release/app-release.aab",
      );

      if (!fs.existsSync(aabPath)) {
        console.error(`❌ File AAB non trovato: ${aabPath}`);
        process.exit(1);
      }

      console.log("Firma AAB...");
      run(
        `jarsigner -verbose -sigalg SHA256withRSA -digestalg SHA-256 -keystore ${keystorePath} -storepass ${keyPassword} -keypass ${keyPassword} ${aabPath} ${keyAlias}`,
      );

      console.log(
        `✅ Build e firma AAB completate. File pronto in:\n${aabPath}`,
      );
      break;

    case "2":
      run("quasar dev -m spa");
      break;
    case "3":
      run("quasar clean");
      run("quasar build -m spa");
      console.log("== DATI FTP CONFIGURATI ==");
      console.log("FTP_USER:     ", FTP_USER);
      console.log("FTP_PASSWORD: ", FTP_PASSWORD ? "[REDACTED]" : "(vuota)");
      console.log("FTP_HOST:     ", FTP_HOST);
      console.log("REMOTE_PATH:  ", REMOTE_PATH);
      console.log("LOCAL_WEB_DIST:", LOCAL_WEB_DIST);
      console.log("WINSCP_PATH:  ", WINSCP_PATH);
      console.log("================================");

      console.log("Upload via WinSCP...");
      const script =
        `\nopen ftp://${FTP_USER}:${FTP_PASSWORD}@${FTP_HOST}\noption transfer binary\nlcd ${LOCAL_WEB_DIST}\ncd ${REMOTE_PATH}\nput *.*\nexit\n      `.trim();
      fs.writeFileSync("winscp_script.txt", script);
      run(`${WINSCP_PATH} /script=winscp_script.txt`);
      fs.unlinkSync("winscp_script.txt");
      console.log("Upload completato.");
      break;
    case "4":
      run("quasar clean");
      run("quasar build -m capacitor -T android --debug");
      console.log("Controllo dispositivo ADB...");
      const adbOutput4 = execSync("adb devices").toString();
      const deviceLines4 = adbOutput4
        .split("\n")
        .slice(1)
        .map((line) => line.trim())
        .filter((line) => line !== "" && /\tdevice$/.test(line));
      if (deviceLines4.length === 0) {
        console.error("❌ Nessun dispositivo ADB connesso.");
        process.exit(1);
      }
      const deviceId4 = deviceLines4[0].split("\t")[0];
      console.log(`✅ Dispositivo trovato: ${deviceId4}`);
      console.log("Disinstallazione eventuale versione precedente...");
      try {
        execSync(`adb uninstall com.prinapo.maigret`, { stdio: "inherit" });
      } catch (e) {
        console.log("Nessuna versione precedente da disinstallare.");
      }
      console.log("Installazione APK su dispositivo...");
      const apkPath4 =
        "src-capacitor/android/app/build/outputs/apk/debug/app-debug.apk";
      execSync(`adb install -r "${apkPath4}"`, { stdio: "inherit" });
      console.log("✅ Build debug installata su dispositivo.");
      break;
    case "5":
      run("npm version minor --no-git-tag-version");
      run("quasar clean");
      run("quasar build -m capacitor -T android");
      console.log("Controllo dispositivo ADB...");
      const adbOutput5 = execSync("adb devices").toString();
      const deviceLines5 = adbOutput5
        .split("\n")
        .slice(1)
        .map((line) => line.trim())
        .filter((line) => line !== "" && /\tdevice$/.test(line));
      if (deviceLines5.length === 0) {
        console.error("❌ Nessun dispositivo ADB connesso.");
        process.exit(1);
      }
      const deviceId5 = deviceLines5[0].split("\t")[0];
      console.log(`✅ Dispositivo trovato: ${deviceId5}`);
      console.log("Disinstallazione eventuale versione precedente...");
      try {
        execSync(`adb uninstall com.prinapo.maigret`, { stdio: "inherit" });
      } catch (e) {
        console.log("Nessuna versione precedente da disinstallare.");
      }
      console.log("Installazione APK su dispositivo...");
      const apkPath5 =
        "src-capacitor/android/app/build/outputs/apk/release/app-release.apk";
      execSync(`adb install -r "${apkPath5}"`, { stdio: "inherit" });
      console.log("✅ Build di test completata.");
      break;
    case "6":
      run("quasar clean");
      run("quasar build -m capacitor -T android");
      await buildAPKorAAB();
      break;
    case "7":
      run("npm version minor --no-git-tag-version");
      run("quasar build -m capacitor -T android");
      await buildAPKorAAB();
      break;
    default:
      console.error("Scelta non valida.");
  }
}

main();
