/* eslint-env node */

// Configuration for your app
// https://v2.quasar.dev/quasar-cli-vite/quasar-config-js

import { configure } from "quasar/wrappers";
import path from "path";

export default configure((/* ctx */) => {
  return {
    eslint: {
      // fix: true,
      // include: [],
      // exclude: [],
      // cache: false,
      // rawOptions: {},
      warnings: true,
      errors: true,
    },

    // https://v2.quasar.dev/quasar-cli-vite/quasar-config-js#css
    css: ["app.scss"],

    // https://github.com/quasarframework/quasar/tree/dev/extras
    extras: [
      // 'ionicons-v4',
      // 'mdi-v7',
      // 'fontawesome-v6',
      // 'eva-icons',
      // 'themify',
      // 'line-awesome',
      // 'roboto-font-latin-ext', // this or either 'roboto-font', NEVER both!

      "roboto-font", // optional, you are not bound to it
      "material-icons", // optional, you are not bound to it
    ],

    // app boot file (/src/boot)
    // --> boot files are part of "main.js"
    // https://v2.quasar.dev/quasar-cli-vite/boot-files
    boot: [
      "i18n", // inizializza i18n
      "pinia", // inizializza PINIA
      "firebase", // inizializza Firebase App
      "auth", // attiva il listener di autenticazione
      "init",
      "back-button-handler",
    ],

    // Full list of options: https://v2.quasar.dev/quasar-cli-vite/quasar-config-js#build
    build: {
      target: {
        browser: ["es2019", "edge88", "firefox78", "chrome87", "safari13.1"],
        node: "node20",
      },
      env: {
        APP_VERSION: JSON.stringify("4.17"),
        VERSION_CODE: JSON.stringify("417"),
      },
      sourcemap: true,
      vueRouterMode: "hash", // available values: 'hash', 'history'

      // Definizione degli alias tramite build.alias
      alias: {
        components: path.resolve(__dirname, "src/components"),
        layouts: path.resolve(__dirname, "src/layouts"),
        pages: path.resolve(__dirname, "src/pages"),
        assets: path.resolve(__dirname, "src/assets"),
        boot: path.resolve(__dirname, "src/boot"),
        stores: path.resolve(__dirname, "src/stores"),
        watchers: path.resolve(__dirname, "src/watchers"),
        listeners: path.resolve(__dirname, "src/listeners"),
        utils: path.resolve(__dirname, "src/utils"),
        config: path.resolve(__dirname, "src/config"),
        firebaseConfig: path.resolve(__dirname, "src/firebaseConfig"),
        src: path.resolve(__dirname, "src"),
      },

      // se avevi altri plugin Vite o opzioni speciali, puoi ancora usare extendViteConf
      // solo se serve altro; altrimenti non è necessario.
      // extendViteConf(viteConf) {
      //   // Qui eventuali personalizzazioni extra, ma non per gli alias già definiti sopra.
      // },

      // sourceremaining options commented out o personalizzate come prima:
      // rebuildCache: true,
      // publicPath: '/',
      // analyze: true,
      // ignorePublicFolder: true,
      // minify: false,
      // polyfillModulePreload: true,
      // distDir
      // vitePlugins: [...]
    },

    // Full list of options: https://v2.quasar.dev/quasar-cli-vite/quasar-config-js#devServer
    devServer: {
      // https: true
      open: true, // opens browser window automatically
    },

    // https://v2.quasar.dev/quasar-cli-vite/quasar-config-js#framework
    framework: {
      config: {
        loading: {},
        capacitor: {
          // Quasar handles app exit on mobile phone back button.
          backButton: false,
        },
      },
      cssAddon: true,
      // iconSet: 'material-icons',
      // lang: 'en-US',

      // Per casi speciali, puoi specificare componenti/directive Quasar globali:
      // components: [],
      // directives: [],

      plugins: ["Dark", "Notify", "Loading", "Dialog"],
    },

    // animations: 'all',
    animations: [],

    // sourceFiles: { ... } // come prima, se hai bisogno di personalizzazioni

    // SSR
    ssr: {
      prodPort: 3000,
      pwa: true,
      middlewares: [
        "render", // keep this as last one
      ],
      // Altre opzioni SSR personalizzate...
    },

    // PWA
    pwa: {
      workboxMode: "GenerateSW",
      extendGenerateSWOptions(cfg) {
        // Estendi la configurazione Workbox se serve
        cfg.runtimeCaching = [
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif)$/,
            handler: "CacheFirst",
            options: {
              cacheName: "image-cache",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 30 * 24 * 60 * 60,
              },
            },
          },
        ];
      },
      // swFilename, manifestFilename, ecc...
    },

    // Cordova, Capacitor, Electron, BEX come prima:
    cordova: {
      // noIosLegacyBuildFlag: true,
    },

    capacitor: {
      appName: "Maigret Collector",
      version: process.env.APP_VERSION || "4.02",
      description:
        "Catalogo completo dei libri di Simenon con il commissario Maigret",
      author: "prinapo <giovanni.prinetti@gmail.com>",
      appId: "com.prinapo.maigret",
      versionCode: parseInt(process.env.VERSION_CODE) || 402,
      versionName: process.env.APP_VERSION || "4.02",
      plugins: {
        SplashScreen: {
          launchShowDuration: 3000,
          launchAutoHide: true,
          launchFadeOutDuration: 3000,
          backgroundColor: "#000000",
          androidScaleType: "CENTER_CROP",
          iosScaleType: "CENTER_CROP",
          showSpinner: false,
          splashFullScreen: true,
          splashImmersive: true,
        },
      },
    },

    electron: {
      preloadScripts: ["electron-preload"],
      inspectPort: 5858,
      bundler: "packager",
      packager: {
        // opzioni packager...
      },
      builder: {
        appId: "com.prinapo.maigret",
      },
    },

    bex: {
      contentScripts: ["my-content-script"],
    },
  };
});
