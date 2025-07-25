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
      // Build Play Store
      console.log("Incremento versione minor...");
      run("npm version minor --no-git-tag-version");
      const version = JSON.parse(fs.readFileSync("package.json")).version;
      console.log(`Nuova versione: ${version}`);
      run("quasar clean");
      run("quasar build -m capacitor -T android");
      console.log("Firma AAB...");
      run(
        `jarsigner -verbose -sigalg SHA256withRSA -digestalg SHA-256 -keystore keystore.jks dist/capacitor/android/apk/release/app-release-unsigned.aab alias_name`,
      );
      console.log("Build completata per Play Store.");
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
      break;
    case "7":
      run("npm version minor --no-git-tag-version");
      run("quasar build -m capacitor -T android");
      break;
    default:
      console.error("Scelta non valida.");
  }
}

main();
