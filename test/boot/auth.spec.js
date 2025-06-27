import { describe, it, expect, vi, beforeEach } from "vitest";
import { Notify } from "quasar";

// Mock della funzione isFirebaseReady
let mockIsFirebaseReady = vi.fn();
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
import authBoot from "boot/auth";

describe("Auth Boot File", () => {
  let quasarAppMock;
  let consoleWarnSpy;

  beforeEach(() => {
    consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    // Resetta i mock prima di ogni test
    mockIsFirebaseReady.mockClear();
    Notify.create.mockClear();

    quasarAppMock = {
      config: {
        globalProperties: {
          $i18n: {
            t: vi.fn((key) => key), // Mock the translation function
          },
        },
      },
    };
  });

  it("should initialize auth listener if Firebase is ready", async () => {
    mockIsFirebaseReady.mockReturnValue(true);

    await authBoot({ app: quasarAppMock });

    expect(Notify.create).not.toHaveBeenCalled();
    expect(quasarAppMock.config.globalProperties.$authDisabled).toBeUndefined();
    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });

  it("should skip auth boot if Firebase is not ready", async () => {
    mockIsFirebaseReady.mockReturnValue(false);

    await authBoot({ app: quasarAppMock });

    expect(Notify.create).not.toHaveBeenCalled(); // Non dovrebbe notificare errore, solo warning in console
    expect(quasarAppMock.config.globalProperties.$authDisabled).toBe(true);
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      "Auth boot skipped: Firebase not initialized",
    );
  });

  it("should not proceed if firebase boot fails", async () => {
    mockIsFirebaseReady.mockImplementation(() => {
      throw new Error("Firebase init failed");
    });

    await expect(authBoot({ app: quasarAppMock })).rejects.toThrow(
      "Firebase init failed",
    );
    expect(quasarAppMock.config.globalProperties.$authDisabled).toBeUndefined();
  });

  // Test: App senza oggetto app
  it("should not throw if called without app", async () => {
    mockIsFirebaseReady.mockClear();
    mockIsFirebaseReady.mockReturnValue(false);
    await expect(authBoot()).resolves.not.toThrow();
  });

  // Test: App senza globalProperties
  it("should not throw if app has no globalProperties", async () => {
    const app = { config: {} };
    mockIsFirebaseReady.mockReturnValue(true);
    await expect(authBoot({ app })).resolves.not.toThrow();
  });

  // Test: Logging warning se Firebase non pronto
  it("should log a warning if Firebase is not ready", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    mockIsFirebaseReady.mockReturnValue(false);
    await authBoot({ app: quasarAppMock });
    expect(warnSpy).toHaveBeenCalledWith(
      "Auth boot skipped: Firebase not initialized",
    );
    warnSpy.mockRestore();
  });

  // Test: Logging error se c'è un errore in fase di boot
  it("should log an error if an error occurs during boot", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockIsFirebaseReady.mockImplementation(() => {
      throw new Error("fail");
    });
    await expect(authBoot({ app: quasarAppMock })).rejects.toThrow(
      "Firebase initialization failed: fail",
    );
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
  });
});
