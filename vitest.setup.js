import { config } from "@vue/test-utils";
import { createI18n } from "vue-i18n";
import { createPinia } from "pinia";
import { Quasar } from "quasar";
import itIT from "./src/i18n/it-IT.js";
import enUS from "./src/i18n/en-US.js";

const i18n = createI18n({
  legacy: false,
  locale: "it-IT",
  messages: { "it-IT": itIT, "en-US": enUS },
});
config.global.plugins = [createPinia(), i18n, Quasar];
