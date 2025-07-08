//init.js
import { boot } from "quasar/wrappers";
import { setupAppWatcher } from "watchers/appWatcher";
import { setupRealtimeListeners } from "listeners/realtimeListeners"; // Add this import

import { isFirebaseReady } from "boot/firebase";

import { showNotifyNegative } from "src/utils/notify";

export default boot((ctx = {}) => {
  const app = ctx.app;
  // Always define i18n from app global properties
  const i18n = app?.config?.globalProperties?.$i18n;

  // Funzione di utilità per traduzioni con fallback
  const getTranslation = (key, fallback) =>
    i18n && i18n.global && typeof i18n.global.t === "function"
      ? i18n.global.t(key)
      : fallback;

  try {
    // Verifica che Firebase sia inizializzato
    if (!isFirebaseReady()) {
      showNotifyNegative(
        getTranslation(
          "init.offlineWarning",
          "Modalità offline: alcune funzionalità non disponibili.",
        ),
      );
      if (app?.config?.globalProperties) {
        app.config.globalProperties.$offlineMode = true;
      }
      return;
    }

    // Inizializza i listener di Firebase
    setupRealtimeListeners(i18n);
    // Eseguire l'inizializzazione effettiva
    setupAppWatcher(app);
    if (app?.config?.globalProperties) {
      app.config.globalProperties.$appReady = true;
    }
  } catch (error) {
    showNotifyNegative(
      getTranslation(
        "init.degradedError",
        "Modalità offline: alcune funzionalità non disponibili.",
      ),
    );
    if (app?.config?.globalProperties) {
      app.config.globalProperties.$degradedMode = true;
    }
    return; // Exit if an error occurred
  }
});
