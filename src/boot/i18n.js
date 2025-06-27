import { createI18n } from "vue-i18n";
import messages from "../i18n";

export const i18n = createI18n({
  locale: "it-IT",
  fallbackLocale: "en-US",
  globalInjection: true,
  legacy: false,
  messages,
});

export default ({ app }) => {
  // Rendi i18n disponibile globalmente nell'app Quasar
  app.use(i18n);
  app.config.globalProperties.$i18n = i18n;
  window.i18n = i18n;
};
