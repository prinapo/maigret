import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import { createTestingPinia } from "@pinia/testing";
import { nextTick } from "vue";
import BookEditions from "src/components/BookEditions.vue";

// Mock edizioniUtils per evitare errori Pinia fuori contesto
vi.mock("src/utils/edizioniUtils", () => ({
  addEdizione: vi.fn().mockResolvedValue(true),
  fetchEditions: vi.fn().mockResolvedValue([]),
}));
import * as edizioniUtils from "src/utils/edizioniUtils";

const bookId = "test-book-id";

const i18nPlugin = {
  install(app) {
    app.config.globalProperties.$t = (key) => key;
  },
};

describe("BookEditions.vue", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("crea una edizione se non ce ne sono e utente manager", async () => {
    const addEdizioneSpy = vi.spyOn(edizioniUtils, "addEdizione");
    vi.spyOn(edizioniUtils, "fetchEditions").mockResolvedValue([]);
    const wrapper = mount(BookEditions, {
      props: { bookId },
      global: {
        plugins: [
          createTestingPinia({
            initialState: {
              bibliografiaStore: {
                bibliografia: [
                  {
                    id: bookId,
                    edizioni: [],
                    deleted: false,
                    deletedBy: "",
                    deletedAt: "",
                  },
                ],
              },
              userStore: { hasPermission: () => true },
              authStore: { user: { uid: "user" } },
            },
          }),
          i18nPlugin,
        ],
        mocks: { $t: (msg) => msg },
      },
    });
    await nextTick();
    expect(addEdizioneSpy).toHaveBeenCalledWith(bookId);
  });

  it("mostra banner se non ci sono edizioni e utente non manager", async () => {
    vi.spyOn(edizioniUtils, "fetchEditions").mockResolvedValue([]);
    const wrapper = mount(BookEditions, {
      props: { bookId },
      global: {
        plugins: [
          createTestingPinia({
            initialState: {
              bibliografiaStore: {
                bibliografia: [
                  {
                    id: bookId,
                    edizioni: [],
                    deleted: false,
                    deletedBy: "",
                    deletedAt: "",
                  },
                ],
              },
              userStore: { hasPermission: () => false },
              authStore: { user: { uid: "user" } },
            },
          }),
          i18nPlugin,
        ],
        mocks: { $t: (msg) => msg },
      },
    });
    expect(wrapper.html()).toContain("Nessuna edizione disponibile");
  });

  it("gestisce dati parziali senza errori", async () => {
    vi.spyOn(edizioniUtils, "fetchEditions").mockResolvedValue([
      { numero: undefined, anno: undefined, uuid: "uuid1", images: [] },
    ]);
    const wrapper = mount(BookEditions, {
      props: { bookId },
      global: {
        plugins: [
          createTestingPinia({
            initialState: {
              bibliografiaStore: {
                bibliografia: [
                  {
                    id: bookId,
                    edizioni: [
                      {
                        numero: undefined,
                        anno: undefined,
                        uuid: "uuid1",
                        images: [],
                      },
                    ],
                    deleted: false,
                    deletedBy: "",
                    deletedAt: "",
                  },
                ],
              },
              userStore: { hasPermission: () => true },
              authStore: { user: { uid: "user" } },
            },
          }),
          i18nPlugin,
        ],
        mocks: { $t: (msg) => msg },
      },
    });
    await nextTick();
    // Deve mostrare comunque la card dell'edizione
    expect(wrapper.findAll(".q-card").length).toBeGreaterThan(0);
  });
});
