import { boot } from "quasar/wrappers";
import { createPinia } from "pinia";
import { describe, it, expect, vi } from "vitest";

// Mock dell'applicazione Quasar per il test
const mockApp = {
  use: vi.fn(),
};

// Importa la funzione di boot da testare
import piniaBoot from "boot/pinia";

describe("Pinia Boot File", () => {
  it("should install Pinia on the app instance", async () => {
    // Esegui la funzione di boot
    await piniaBoot({ app: mockApp });

    // Verifica che `app.use` sia stato chiamato
    expect(mockApp.use).toHaveBeenCalled();

    // Verifica che `app.use` sia stato chiamato con un'istanza di Pinia
    // Poiché `createPinia()` restituisce un oggetto, possiamo controllare che sia stato chiamato con un oggetto.
    // Non possiamo controllare l'esatta istanza, ma possiamo verificare che sia un oggetto valido.
    const callArgument = mockApp.use.mock.calls[0][0];
    expect(typeof callArgument).toBe("object");
    expect(callArgument).toHaveProperty("install"); // Pinia instance has an install method
  });
});