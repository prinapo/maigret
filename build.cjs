const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const readline = require("readline");

const WINSCP_PATH = `"C:\\Program Files (x86)\\WinSCP\\winscp.com"`;
const REMOTE_PATH = `/`; // root
const LOCAL_WEB_DIST = `dist/spa`;
const FTP_USER = process.env.FTP_USER;
const FTP_PASSWORD = process.env.FTP_PASSWORD;
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
  console.log("1. Build Play Store");
  console.log("2. Build Web (con upload FTP)");
  console.log("3. Build di Test (debug, installa su dispositivo ADB)");

  const choice = await prompt("Inserisci 1, 2 o 3: ");

  switch (choice) {
    case "1":
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
      run("quasar clean");
      run("quasar build -m spa");

      console.log("Upload via WinSCP...");
      const script = `
open ftp://${FTP_USER}:${FTP_PASSWORD}@${FTP_HOST}
option transfer binary
lcd ${LOCAL_WEB_DIST}
cd ${REMOTE_PATH}
put *.*
exit
      `.trim();

      fs.writeFileSync("winscp_script.txt", script);
      run(`${WINSCP_PATH} /script=winscp_script.txt`);
      fs.unlinkSync("winscp_script.txt");

      console.log("Upload completato.");
      break;

    case "3":
      run("quasar clean");
      run("quasar build -m capacitor -T android");

      console.log("Controllo dispositivo ADB...");
      const adbOutput = execSync("adb devices").toString();
      const deviceLines = adbOutput
        .split("\n")
        .slice(1)
        .map((line) => line.trim())
        .filter((line) => line !== "" && /\tdevice$/.test(line));

      if (deviceLines.length === 0) {
        console.error("❌ Nessun dispositivo ADB connesso.");
        process.exit(1);
      }

      const deviceId = deviceLines[0].split("\t")[0];
      console.log(`✅ Dispositivo trovato: ${deviceId}`);

      console.log("Disinstallazione eventuale versione precedente...");
      try {
        execSync(`adb uninstall com.prinapo.maigret`, { stdio: "inherit" });
      } catch (e) {
        // Se non c’è l’app già installata ignora l’errore
        console.log("Nessuna versione precedente da disinstallare.");
      }

      console.log("Installazione APK su dispositivo...");
      const apkPath =
        "src-capacitor/android/app/build/outputs/apk/release/app-release.apk";
      execSync(`adb install -r "${apkPath}"`, { stdio: "inherit" });

      console.log("✅ Build di test completata.");
      break;

    default:
      console.error("Scelta non valida.");
  }
}

main();
