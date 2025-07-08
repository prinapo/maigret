import { boot } from "quasar/wrappers";
import { isFirebaseReady } from "boot/firebase";
import { showNotifyNegative } from "src/utils/notify";
import { i18n } from "boot/i18n";

export default boot(async (ctx = {}) => {
  const app = ctx.app;
  try {
    // Verifica che Firebase sia inizializzato
    if (!isFirebaseReady()) {
      if (app?.config?.globalProperties) {
        app.config.globalProperties.$authDisabled = true;
      }
      return;
    }
  } catch (error) {
    showNotifyNegative(i18n.global.t("auth.connectionError"));
    // Imposta modalità offline/degradata
    if (app?.config?.globalProperties) {
      app.config.globalProperties.$firebaseError = true;
    }
    // Re-throw per bloccare boot successivi se necessario
    throw new Error(`Firebase initialization failed: ${error.message}`);
  }
});
