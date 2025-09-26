#!/usr/bin/env node
const { execSync, spawn } = require('child_process');
const readline = require('readline');

const EMULATOR_PATH = 'C:/Users/giova/AppData/Local/Android/Sdk/emulator/emulator.exe';

function listAvds() {
  try {
    const output = execSync(`"${EMULATOR_PATH}" -list-avds`, { encoding: 'utf8' });
    return output.split(/\r?\n/).filter(Boolean);
  } catch (err) {
    console.error('Errore nel recupero della lista AVD. Assicurati che l\'SDK Android sia installato e che il percorso sia corretto.');
    process.exit(1);
  }
}

function askUser(avds) {
  console.log('Seleziona quale emulatore vuoi avviare:');
  avds.forEach((avd, idx) => {
    console.log(`  ${idx + 1}. ${avd}`);
  });
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  rl.question('Inserisci il numero dell\'emulatore da avviare: ', (answer) => {
    const idx = parseInt(answer, 10) - 1;
    if (isNaN(idx) || idx < 0 || idx >= avds.length) {
      console.error('Scelta non valida.');
      rl.close();
      process.exit(1);
    }
    rl.close();
    startEmulator(avds[idx]);
  });
}

function startEmulator(avd) {
  console.log(`Avvio emulatore: ${avd}`);
  const child = spawn(EMULATOR_PATH, ['-avd', avd], { stdio: 'inherit', shell: false });
  child.on('close', (code) => {
    process.exit(code);
  });
}

const avds = listAvds();
if (avds.length === 0) {
  console.error('Nessun emulatore trovato.');
  process.exit(1);
}
askUser(avds);
