const fs = require("fs");
const path = require("path");

// 1. Leggi la versione da package.json
const pkgPath = path.join(__dirname, "package.json");
const gradlePath = path.join(
  __dirname,
  "src-capacitor",
  "android",
  "app",
  "build.gradle",
);

const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
const version = pkg.version; // es: '4.3.0'

const [major, minor] = version.split(".");
const versionCode = parseInt(major) * 100 + parseInt(minor); // es: 4*100+3 = 403
const versionName = `${major}.${minor.padStart(2, "0")}`; // es: '4.03'

// 2. Leggi build.gradle
let gradle = fs.readFileSync(gradlePath, "utf8");

// 3. Sostituisci versionCode e versionName
const gradleNew = gradle
  .replace(/versionCode\s+\d+/g, `versionCode ${versionCode}`)
  .replace(/versionName\s+"[^"]+"/g, `versionName "${versionName}"`);

// 4. Scrivi il file
fs.writeFileSync(gradlePath, gradleNew, "utf8");

console.log(
  `Aggiornato build.gradle: versionCode=${versionCode}, versionName=${versionName}`,
);
