// src/boot/firebase.js
import { boot } from "quasar/wrappers";
import { initializeApp } from "firebase/app";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { firebaseConfig } from "firebaseConfig/config";
import { Notify } from "quasar";
import { i18n } from "./i18n";

// Variabili globali da esportare
let app, db, auth, storage;
let isFirebaseInitialized = false;
let firebaseError = false;

// Helper to add timeout to a promise
function withTimeout(promise, ms, errorMsg) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(errorMsg)), ms),
    ),
  ]);
}

export default boot(async (ctx = {}) => {
  const quasarApp = ctx.app;
  const t = i18n.global.t;
  try {
    if (!firebaseConfig.apiKey) {
      throw new Error(t("firebase.config_missing"));
    }
    app = initializeApp(firebaseConfig);

    // Add timeout to each service initialization (5 seconds)
    db = await withTimeout(
      Promise.resolve(
        initializeFirestore(app, {
          localCache: persistentLocalCache({
            tabManager: persistentMultipleTabManager(),
          }),
        }),
      ),
      5000,
      "Firebase initialization failed: Firestore service timeout",
    );
    auth = await withTimeout(
      Promise.resolve(getAuth(app)),
      5000,
      "Firebase initialization failed: Auth service timeout",
    );
    storage = await withTimeout(
      Promise.resolve(getStorage(app)),
      5000,
      "Firebase initialization failed: Storage service timeout",
    );

    isFirebaseInitialized = true;
    firebaseError = false;
    if (quasarApp?.config?.globalProperties) {
      delete quasarApp.config.globalProperties.$firebaseError;
    }
    console.log(t("firebase.init_success"));
  } catch (error) {
    console.error(t("firebase.init_failed", { message: error.message }), error);

    // Notifica utente dell'errore critico
    Notify.create({
      type: "negative",
      message: t("auth.connection_error"),
      position: "top",
      timeout: 8000,
      actions: [
        {
          label: t("auth.reload"),
          color: "white",
          handler: () => window.location.reload(),
        },
      ],
    });

    // Imposta modalità offline/degradata
    firebaseError = true;
    if (quasarApp?.config?.globalProperties) {
      quasarApp.config.globalProperties.$firebaseError = true;
    }

    // Re-throw per bloccare boot successivi se necessario
    throw new Error(`Firebase initialization failed: ${error.message}`);
  }
});

export { app, db, auth, storage, isFirebaseInitialized, firebaseError };

export function isFirebaseReady() {
  return isFirebaseInitialized;
}
export const getFirebaseError = () => firebaseError;
// Esportazioni da usare nel resto dell'app
export const fireStoreUrl = `https://firebasestorage.googleapis.com/v0/b/${firebaseConfig.storageBucket}/o/images%2F`;
export const fireStoreTmblUrl = `https://firebasestorage.googleapis.com/v0/b/${firebaseConfig.storageBucket}/o/thumbnails%2F`;
export const fireStoreTrashUrl = `https://firebasestorage.googleapis.com/v0/b/${firebaseConfig.storageBucket}/o/trash%2F`;
export const fireStoreTrashTmblUrl = `https://firebasestorage.googleapis.com/v0/b/${firebaseConfig.storageBucket}/o/trash-thumbnails%2F`;
