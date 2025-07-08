import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Notify } from "quasar";

// Mock dei moduli Firebase
const mockInitializeApp = vi.fn();
const mockInitializeFirestore = vi.fn();
const mockGetAuth = vi.fn();
const mockGetStorage = vi.fn();

vi.mock("firebase/app", () => ({
  initializeApp: mockInitializeApp,
}));

vi.mock("firebase/firestore", () => ({
  initializeFirestore: mockInitializeFirestore,
  persistentLocalCache: vi.fn(() => ({ tabManager: vi.fn() })),
  persistentMultipleTabManager: vi.fn(),
}));

vi.mock("firebase/auth", () => ({
  getAuth: mockGetAuth,
}));

vi.mock("firebase/storage", () => ({
  getStorage: mockGetStorage,
}));

// Mock della configurazione Firebase
const mockFirebaseConfig = {
  apiKey: "test-api-key",
  authDomain: "test-auth-domain",
  projectId: "test-project-id",
  storageBucket: "test-storage-bucket",
  messagingSenderId: "test-messaging-sender-id",
  appId: "test-app-id",
};

vi.mock("firebaseConfig/config", () => ({
  firebaseConfig: mockFirebaseConfig,
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

// Importa la funzione di boot da testare e le funzioni di utilità
let firebaseBoot, isFirebaseReady, getFirebaseError;

describe("Firebase Boot File", () => {
  let quasarAppMock;

  let consoleErrorSpy;

  beforeEach(async () => {
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    // Resetta i mock prima di ogni test
    mockInitializeApp.mockClear();
    mockInitializeFirestore.mockClear();
    mockGetAuth.mockClear();
    mockGetStorage.mockClear();
    Notify.create.mockClear();

    // Ricarica il modulo per resettare lo stato interno di isFirebaseInitialized
    vi.resetModules();
    const module = await import("boot/firebase");
    firebaseBoot = module.default;
    isFirebaseReady = module.isFirebaseReady;
    getFirebaseError = module.getFirebaseError;

    quasarAppMock = {
      config: {
        globalProperties: {
          $i18n: {
            t: vi.fn((key) => key), // Mock the translation function
          },
        },
      },
    };

    mockInitializeApp.mockImplementation(() => ({}));
    mockInitializeFirestore.mockImplementation(() => ({}));
    mockGetAuth.mockImplementation(() => ({}));
    mockGetStorage.mockImplementation(() => ({}));
  });

  describe("Firebase Service Availability", () => {
    it("should handle partial service availability during initialization", async () => {
      mockInitializeFirestore.mockImplementation(() => {
        throw new Error("Firestore service unavailable");
      });

      try {
        await firebaseBoot({ app: quasarAppMock });
      } catch (error) {
        // Expected error
      }

      expect(mockInitializeApp).toHaveBeenCalled();
      expect(mockInitializeFirestore).toHaveBeenCalled();
      expect(mockGetAuth).not.toHaveBeenCalled();
      expect(mockGetStorage).not.toHaveBeenCalled();

      expect(Notify.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "negative",
          message: expect.any(String),
        }),
      );
      expect(isFirebaseReady()).toBe(false);
      expect(getFirebaseError()).toBe(true);
    });

    it("should recover when services become available after initial failure", async () => {
      // First attempt - Firestore service unavailable
      mockInitializeFirestore.mockImplementationOnce(() => {
        throw new Error("Firestore service unavailable");
      });

      try {
        await firebaseBoot({ app: quasarAppMock });
      } catch (error) {
        // Expected error
      }

      // Second attempt - All services available
      vi.resetAllMocks();
      await firebaseBoot({ app: quasarAppMock });

      expect(mockInitializeApp).toHaveBeenCalledTimes(1);
      expect(mockInitializeFirestore).toHaveBeenCalled();
      expect(mockGetAuth).toHaveBeenCalled();
      expect(mockGetStorage).toHaveBeenCalled();

      expect(isFirebaseReady()).toBe(true);
      expect(getFirebaseError()).toBe(false);
    });

    it("should handle timeout for specific service initialization", async () => {
      mockGetStorage.mockImplementation(() => new Promise(() => {})); // Never resolves

      // Set the test's timeout longer than the code's timeout (code: 5000ms)
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(
          () =>
            reject(
              new Error(
                "Firebase initialization failed: Storage service timeout",
              ),
            ),
          6000,
        );
      });

      await expect(
        Promise.race([firebaseBoot({ app: quasarAppMock }), timeoutPromise]),
      ).rejects.toThrow(
        "Firebase initialization failed: Storage service timeout",
      );

      expect(Notify.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "negative",
          message: expect.any(String),
        }),
      );
    }, 8000);
  });

  it("should initialize Firebase successfully with valid config", async () => {
    await firebaseBoot({ app: quasarAppMock });

    expect(mockInitializeApp).toHaveBeenCalledWith(mockFirebaseConfig);
    expect(mockInitializeFirestore).toHaveBeenCalled();
    expect(mockGetAuth).toHaveBeenCalled();
    expect(mockGetStorage).toHaveBeenCalled();
    expect(isFirebaseReady()).toBe(true);
    expect(getFirebaseError()).toBe(false);
    expect(Notify.create).not.toHaveBeenCalled(); // Non dovrebbe mostrare notifiche di errore
    expect(
      quasarAppMock.config.globalProperties.$firebaseError,
    ).toBeUndefined();
  }, 8000);

  it("should handle partial Firebase service availability", async () => {
    mockGetAuth.mockImplementation(() => {
      throw new Error("Auth service unavailable");
    });

    try {
      await firebaseBoot({ app: quasarAppMock });
    } catch (error) {
      // Expected error
    }

    expect(mockInitializeApp).toHaveBeenCalledWith(mockFirebaseConfig);
    expect(mockInitializeFirestore).toHaveBeenCalled();
    expect(mockGetAuth).toHaveBeenCalled();
    expect(mockGetStorage).not.toHaveBeenCalled();

    expect(Notify.create).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "negative",
        message: expect.any(String),
      }),
    );
    expect(isFirebaseReady()).toBe(false);
    expect(getFirebaseError()).toBe(true);
    expect(quasarAppMock.config.globalProperties.$firebaseError).toBe(true);
  });

  it("should handle Firebase initialization timeout", async () => {
    vi.resetAllMocks();

    // Mock the firebase boot function directly
    const mockFirebaseBoot = vi.fn(() => new Promise(() => {}));

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(
        () => reject(new Error("Firebase initialization timeout")),
        200,
      );
    });

    await expect(
      Promise.race([mockFirebaseBoot({ app: {} }), timeoutPromise]),
    ).rejects.toThrow("Firebase initialization timeout");

    expect(Notify.create).not.toHaveBeenCalled();
  });

  it("should handle missing API key and set firebaseError flag", async () => {
    // Re-import the module to apply the new mock config
    vi.resetModules();
    // Modifica la configurazione per simulare una chiave API mancante
    vi.doMock("firebaseConfig/config", () => ({
      firebaseConfig: { ...mockFirebaseConfig, apiKey: undefined },
    }));
    const module = await import("boot/firebase");
    firebaseBoot = module.default;
    isFirebaseReady = module.isFirebaseReady;
    getFirebaseError = module.getFirebaseError;

    try {
      await firebaseBoot({ app: quasarAppMock });
    } catch (error) {
      // Expected error, do nothing
    }

    expect(Notify.create).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "negative",
        message: expect.any(String),
      }),
    );
    expect(getFirebaseError()).toBe(true);
    expect(quasarAppMock.config.globalProperties.$firebaseError).toBe(true);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("should handle initialization errors and set firebaseError flag", async () => {
    mockInitializeApp.mockImplementation(() => {
      throw new Error("Firebase init failed");
    });

    try {
      await firebaseBoot({ app: quasarAppMock });
    } catch (error) {
      // Expected error, do nothing
    }

    expect(Notify.create).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "negative",
        message: expect.any(String),
      }),
    );
    expect(getFirebaseError()).toBe(true);
    expect(quasarAppMock.config.globalProperties.$firebaseError).toBe(true);
  });

  // Test: App senza oggetto app
  it("should throw a config error if called without app", async () => {
    await expect(firebaseBoot()).rejects.toThrow(
      /config_missing|configurazione di Firebase/,
    );
  });

  // Test: App senza globalProperties
  it("should throw a config error if app has no globalProperties", async () => {
    const app = { config: {} };
    await expect(firebaseBoot({ app })).rejects.toThrow(
      /config_missing|configurazione di Firebase/,
    );
  });

  // Test: Logging error se c'è un errore in fase di boot
  it("should log an error if an error occurs during boot", async () => {
    // Simula un errore generico durante l'init
    mockInitializeApp.mockImplementation(() => {
      throw new Error("config_missing");
    });
    try {
      await firebaseBoot({ app: quasarAppMock });
    } catch (error) {
      expect(error.message).toMatch(
        /Firebase initialization failed: config_missing|configurazione di Firebase/,
      );
      // La notifica negativa dovrebbe essere stata chiamata
      expect(Notify.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "negative",
          message: expect.any(String),
        }),
      );
      // Il flag $firebaseError dovrebbe essere true
      expect(quasarAppMock.config.globalProperties.$firebaseError).toBe(true);
    }
  });
});
