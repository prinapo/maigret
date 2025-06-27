//init.js
import { boot } from "quasar/wrappers";
import { Notify } from "quasar";
import { setupAppWatcher } from "watchers/appWatcher";
import { setupRealtimeListeners } from "listeners/realtimeListeners"; // Add this import

import { isFirebaseReady } from "boot/firebase";

export default boot((ctx = {}) => {
  const app = ctx.app;
  try {
    const i18n = app?.config?.globalProperties?.$i18n;
    // Verifica che Firebase sia inizializzato
    if (!isFirebaseReady()) {
      Notify.create({
        type: "warning",
        message: i18n?.global?.t
          ? i18n.global.t("init.offlineWarning")
          : "Modalità offline: alcune funzionalità non disponibili.",
        position: "top",
        timeout: 8000,
      });
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
    Notify.create({
      type: "negative",
      message: i18n?.global?.t
        ? i18n.global.t("init.degradedError")
        : "Impossibile caricare alcuni dati. Alcune funzionalità potrebbero non essere disponibili.",
      position: "top",
      timeout: 8000,
      actions: [
        {
          label: "Ricarica",
          color: "white",
          handler: () => {
            window.location.reload();
          },
        },
      ],
    });

    if (app?.config?.globalProperties) {
      app.config.globalProperties.$degradedMode = true;
    }
    return; // Exit if an error occurred
  }
});
