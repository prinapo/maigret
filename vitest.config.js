import { defineConfig } from 'vitest/config';
import { createHtmlPlugin } from "vite-plugin-html";
import vueDevTools from "vite-plugin-vue-devtools";

import { quasar, transformAssetUrls } from "@quasar/vite-plugin";
import vue from "@vitejs/plugin-vue";
import path from "path";

export default defineConfig({
  plugins: [
    vueDevTools(),
    createHtmlPlugin({}),
    vue({
      template: {
        transformAssetUrls,
      },
    }),
    quasar({
      sassVariables: "src/css/quasar.variables.scss",
    }),
  ],
  resolve: {
    alias: {
      // Qui devi replicare gli alias definiti in quasar.config.js
      // Puoi anche provare a importare direttamente la configurazione degli alias da quasar.config.js
      // se la struttura lo permette, ma replicarli è il metodo più diretto.
      components: path.resolve(__dirname, "./src/components"),
      layouts: path.resolve(__dirname, "./src/layouts"),
      pages: path.resolve(__dirname, "./src/pages"),
      assets: path.resolve(__dirname, "./src/assets"),
      boot: path.resolve(__dirname, "./src/boot"),
      stores: path.resolve(__dirname, "./src/stores"),
      watchers: path.resolve(__dirname, "./src/watchers"),
      listeners: path.resolve(__dirname, "./src/listeners"),
      utils: path.resolve(__dirname, "./src/utils"),
      config: path.resolve(__dirname, "./src/config"),
      firebaseConfig: path.resolve(__dirname, "./src/firebaseConfig"),
      src: path.resolve(__dirname, "./src"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./test/setup.js"],
    deps: {
      server: {
        deps: {
          inline: ["quasar"]
        }
      }
    },
  },
});
