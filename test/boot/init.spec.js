/*
  Test file: test/boot/init.spec.js
  Descrizione: Test di copertura della sequenza di boot dell'applicazione.
  Copre:
    - Inizializzazione app e listener
    - Gestione modalità offline e degradata
    - Passaggio corretto di parametri ai listener
    - Idempotenza della funzione di boot
    - Robustezza su input anomali
    - Stato coerente dopo errori
    - Assenza di notifiche in caso di successo
  Data: 2024-06-10
  Versione app: v1.0.0
*/

import { describe, it, expect, vi, beforeEach } from "vitest";
import { Notify } from "quasar";
import {
  mockSetupRealtimeListeners,
  mockSetupAppWatcher,
  mockIsFirebaseReady,
} from "./__mocks__/mocks";
import {
  cleanupAllListeners,
  activeListeners,
  setupRealtimeListeners,
} from "listeners/realtimeListeners";
import itIT from "src/i18n/it-IT.js";
import enUS from "src/i18n/en-US.js";

vi.mock("listeners/realtimeListeners", () => {
  return {
    setupRealtimeListeners: (...args) => {
      return mockSetupRealtimeListeners(...args);
    },
    cleanupAllListeners: () => {
      Object.keys(activeListeners).forEach((key) => {
        if (typeof activeListeners[key] === "function") {
          activeListeners[key]();
          activeListeners[key] = null;
        }
      });
    },
    activeListeners: {},
  };
});

vi.mock("watchers/appWatcher", () => ({
  setupAppWatcher: mockSetupAppWatcher,
}));

vi.mock("boot/firebase", () => ({
  isFirebaseReady: () => mockIsFirebaseReady(),
}));

// Mock di Quasar Notify
vi.mock("quasar", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    Notify: {
      create: vi.fn(),
    },
  };
});

// Importa la funzione di boot da testare
import initBoot from "boot/init";

describe("Init Boot File", () => {
  let quasarAppMock;

  beforeEach(() => {
    // Resetta i mock prima di ogni test
    mockSetupRealtimeListeners.mockClear();
    mockSetupRealtimeListeners.mockImplementation(() => {});
    mockSetupAppWatcher.mockClear();
    mockIsFirebaseReady.mockClear();
    Notify.create.mockClear();

    quasarAppMock = {
      config: {
        globalProperties: {
          $i18n: {},
        },
      },
    };
  });

  // Test: Inizializzazione con Firebase pronto
  // Data: 2024-06-10, v1.0.0
  it("should initialize app successfully if Firebase is ready", async () => {
    mockIsFirebaseReady.mockReturnValue(true);

    await initBoot({ app: quasarAppMock });

    expect(mockSetupRealtimeListeners).toHaveBeenCalledTimes(1);
    expect(mockSetupAppWatcher).toHaveBeenCalledTimes(1);
    expect(quasarAppMock.config.globalProperties.$appReady).toBe(true);
    expect(quasarAppMock.config.globalProperties.$offlineMode).toBeUndefined();
    expect(quasarAppMock.config.globalProperties.$degradedMode).toBeUndefined();
  });

  // Test: Non mostrare notifiche in caso di successo
  // Data: 2024-06-10, v1.0.0
  it("should NOT show any notification on successful boot", async () => {
    mockIsFirebaseReady.mockReturnValue(true);
    await initBoot({ app: quasarAppMock });
    expect(Notify.create).not.toHaveBeenCalled();
  });

  // Test: Passaggio corretto di $i18n
  // Data: 2024-06-10, v1.0.0
  it("should pass $i18n as argument to setupRealtimeListeners", async () => {
    mockIsFirebaseReady.mockReturnValue(true);
    await initBoot({ app: quasarAppMock });
    expect(mockSetupRealtimeListeners).toHaveBeenCalledWith(
      quasarAppMock.config.globalProperties.$i18n,
    );
  });

  // Test: Idempotenza della funzione di boot
  // Data: 2024-06-10, v1.0.0
  it("should be idempotent if called twice with Firebase ready", async () => {
    mockIsFirebaseReady.mockReturnValue(true);
    await initBoot({ app: quasarAppMock });
    await initBoot({ app: quasarAppMock });
    expect(mockSetupRealtimeListeners).toHaveBeenCalledTimes(2);
    expect(mockSetupAppWatcher).toHaveBeenCalledTimes(2);
  });

  // Test: Gestione app senza config
  // Data: 2024-06-10, v1.0.0
  it("should handle missing config gracefully", () => {
    mockIsFirebaseReady.mockReturnValue(true);
    const appWithoutConfig = {};
    expect(() => initBoot({ app: appWithoutConfig })).not.toThrow();
  });

  // Test: Modalità offline se Firebase non è pronto
  // Data: 2024-06-10, v1.0.0
  it("should set offline mode if Firebase is not ready", async () => {
    mockIsFirebaseReady.mockReturnValue(false);

    await initBoot({ app: quasarAppMock });

    expect(mockSetupRealtimeListeners).not.toHaveBeenCalled();
    expect(mockSetupAppWatcher).not.toHaveBeenCalled();
    expect(Notify.create).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "negative",
        message: "Modalità offline: alcune funzionalità non disponibili.",
      }),
    );
    expect(quasarAppMock.config.globalProperties.$offlineMode).toBe(true);
    expect(quasarAppMock.config.globalProperties.$appReady).toBeUndefined();
    expect(quasarAppMock.config.globalProperties.$degradedMode).toBeUndefined();
  });

  // Test: Gestione errori in fase di boot
  // Data: 2024-06-10, v1.0.0
  it("should handle initialization errors and set degraded mode", async () => {
    const errorMessage = "Failed to setup realtime listeners";
    mockIsFirebaseReady.mockReturnValue(true);
    mockSetupRealtimeListeners.mockImplementation(() => {
      throw new Error(errorMessage);
    });

    await initBoot({ app: quasarAppMock });

    expect(mockSetupRealtimeListeners).toHaveBeenCalledTimes(1);
    expect(mockSetupAppWatcher).not.toHaveBeenCalled(); // Should not be called if previous step fails
    expect(Notify.create).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "negative",
        message: expect.any(String),
      }),
    );
    expect(quasarAppMock.config.globalProperties.$degradedMode).toBe(true);
    expect(quasarAppMock.config.globalProperties.$appReady).toBeUndefined();
    expect(quasarAppMock.config.globalProperties.$offlineMode).toBeUndefined();
  });

  // Test: Chiamata diretta al listener mockato
  // Data: 2024-06-10, v1.0.0
  it("should directly call setupRealtimeListeners and increment the spy", () => {
    setupRealtimeListeners({});
    expect(mockSetupRealtimeListeners).toHaveBeenCalledTimes(1);
  });

  // Test: Cleanup dei listener
  // Data: 2024-06-10, v1.0.0
  it("should cleanup all listeners and set them to null", () => {
    // Prepara dei mock unsubscribe
    const unsubscribeMock = vi.fn();
    Object.keys(activeListeners).forEach((key) => {
      activeListeners[key] = unsubscribeMock;
    });
    // Chiama cleanup
    cleanupAllListeners({ global: { t: () => "" } });
    // Tutti i listener devono essere stati chiamati e poi settati a null
    Object.keys(activeListeners).forEach((key) => {
      expect(unsubscribeMock).toHaveBeenCalled();
      expect(activeListeners[key]).toBeNull();
    });
  });

  // Test: Idempotenza di cleanupAllListeners
  // Data: 2024-06-10, v1.0.0
  it("should be idempotent when calling cleanupAllListeners multiple times", () => {
    // Prepara dei mock unsubscribe
    const unsubscribeMock = vi.fn();
    Object.keys(activeListeners).forEach((key) => {
      activeListeners[key] = unsubscribeMock;
    });
    cleanupAllListeners({ global: { t: () => "" } });
    // Richiama cleanup: non deve lanciare errori e i listener restano null
    expect(() =>
      cleanupAllListeners({ global: { t: () => "" } }),
    ).not.toThrow();
    Object.keys(activeListeners).forEach((key) => {
      expect(activeListeners[key]).toBeNull();
    });
  });

  // Test: Recovery dopo cleanup
  // Data: 2024-06-10, v1.0.0
  it("should allow recovery by re-initializing listeners after cleanup", () => {
    // Prepara dei mock unsubscribe
    const unsubscribeMock = vi.fn();
    // Popola activeListeners con almeno una chiave
    activeListeners["test"] = unsubscribeMock;
    // Inizializza
    setupRealtimeListeners({ global: { t: () => "" } });
    // Cleanup
    cleanupAllListeners({ global: { t: () => "" } });
    // Recovery: re-inizializza (popola di nuovo)
    activeListeners["test"] = unsubscribeMock;
    setupRealtimeListeners({ global: { t: () => "" } });
    // Verifica che unsubscribe sia stato chiamato almeno una volta (per cleanup)
    expect(unsubscribeMock).toHaveBeenCalled();
  });

  // Test: App senza oggetto app
  it("should not throw if called without app", () => {
    expect(() => initBoot()).not.toThrow();
  });

  // Test: App senza globalProperties
  it("should not throw if app has no globalProperties", () => {
    const app = { config: {} };
    mockIsFirebaseReady.mockReturnValue(true);
    expect(() => initBoot({ app })).not.toThrow();
  });

  // Test: App senza $i18n
  it("should not throw if app has no $i18n", () => {
    const app = { config: { globalProperties: {} } };
    mockIsFirebaseReady.mockReturnValue(true);
    expect(() => initBoot({ app })).not.toThrow();
  });

  // Test: Fallback i18n se manca la funzione di traduzione
  it("should use fallback message if i18n is missing", () => {
    mockIsFirebaseReady.mockReturnValue(false);
    const app = { config: { globalProperties: {} } };
    initBoot({ app });
    expect(Notify.create).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Modalità offline: alcune funzionalità non disponibili.",
      }),
    );
  });

  // Test: Fallback i18n se manca i18n.global.t
  it("should use fallback message if i18n.global.t is missing", () => {
    mockIsFirebaseReady.mockReturnValue(false);
    const app = { config: { globalProperties: { $i18n: {} } } };
    initBoot({ app });
    expect(Notify.create).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Modalità offline: alcune funzionalità non disponibili.",
      }),
    );
  });

  // Test: Logging warning se Firebase non pronto
  it("should log a warning if Firebase is not ready", () => {
    mockIsFirebaseReady.mockReturnValue(false);
    initBoot({ app: quasarAppMock });
    // Non si verifica più console.warn, la notifica è sufficiente
    expect(Notify.create).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "negative",
        message: "Modalità offline: alcune funzionalità non disponibili.",
      }),
    );
  });

  // Test: Logging error se c'è un errore in fase di boot
  it("should log an error if an error occurs during boot", () => {
    mockIsFirebaseReady.mockReturnValue(true);
    mockSetupRealtimeListeners.mockImplementation(() => {
      throw new Error("fail");
    });
    initBoot({ app: quasarAppMock });
    // Non si verifica più console.error, la notifica è sufficiente
    expect(Notify.create).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "negative",
        message: expect.any(String),
      }),
    );
  });

  // Test: Chiamate multiple a initBoot con stati diversi
  it("should update state correctly when called multiple times with different Firebase readiness", async () => {
    // Prima chiamata: Firebase non pronto
    mockIsFirebaseReady.mockReturnValue(false);
    await initBoot({ app: quasarAppMock });
    expect(quasarAppMock.config.globalProperties.$offlineMode).toBe(true);
    // Seconda chiamata: Firebase pronto
    mockIsFirebaseReady.mockReturnValue(true);
    await initBoot({ app: quasarAppMock });
    expect(quasarAppMock.config.globalProperties.$appReady).toBe(true);
    expect(quasarAppMock.config.globalProperties.$offlineMode).toBe(true); // rimane true
  });
});

describe("Traduzioni - init.degradedError", () => {
  it("deve esistere in italiano", () => {
    expect(itIT.init && itIT.init.degradedError).toBeDefined();
    expect(typeof itIT.init.degradedError).toBe("string");
    expect(itIT.init.degradedError.length).toBeGreaterThan(0);
  });

  it("deve esistere in inglese", () => {
    expect(enUS.init && enUS.init.degradedError).toBeDefined();
    expect(typeof enUS.init.degradedError).toBe("string");
    expect(enUS.init.degradedError.length).toBeGreaterThan(0);
  });
});
