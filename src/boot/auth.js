import { boot } from "quasar/wrappers";
import { Notify } from "quasar";
import { isFirebaseReady } from "boot/firebase";

export default boot(async (ctx = {}) => {
  const app = ctx.app;
  try {
    // Verifica che Firebase sia inizializzato
    if (!isFirebaseReady()) {
      console.warn("Auth boot skipped: Firebase not initialized");
      if (app?.config?.globalProperties) {
        app.config.globalProperties.$authDisabled = true;
      }
      return;
    }
  } catch (error) {
    console.error("Errore inizializzazione auth:", error);

    Notify.create({
      type: "negative",
      message:
        "Errore di connessione. Alcune funzionalità potrebbero non essere disponibili.",
      position: "top",
      timeout: 8000,
      actions: [
        {
          label: "Ricarica",
          color: "white",
          handler: () => window.location.reload(),
        },
      ],
    });

    // Imposta modalità offline/degradata
    if (app?.config?.globalProperties) {
      app.config.globalProperties.$firebaseError = true;
    }

    // Re-throw per bloccare boot successivi se necessario
    throw new Error(`Firebase initialization failed: ${error.message}`);
  }
});
