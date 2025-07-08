# Maigret Collector (com.prinapo.maigret)

An app to save the maigret collection status

## Install the dependencies

```bash
yarn
# or
npm install
```

### Start the app in development mode (hot-code reloading, error reporting, etc.)

```bash
quasar dev
```

### Lint the files

```bash
yarn lint
# or
npm run lint
```

### Format the files

```bash
yarn format
# or
npm run format
```

### Build the app for production

```bash
quasar build
```

### Customize the configuration

See [Configuring quasar.config.js](https://v2.quasar.dev/quasar-cli-vite/quasar-config-js).

## Pulizia campi id e uniqueId in Firestore

Per rimuovere i campi `id` e `uniqueId` da tutti i documenti della collection `Bibliografia` in Firestore:

1. Assicurati di avere Node.js e le credenziali Firebase Admin SDK configurate.
2. Salva lo script `clean_bibliografia.js` (vedi file `upload_script.txt`).
3. Installa le dipendenze necessarie:
   ```bash
   npm install firebase-admin
   ```
4. Esegui lo script:
   ```bash
   node clean_bibliografia.js
   ```

Questo rimuoverà i campi `id` e `uniqueId` da tutti i libri in Firestore.
