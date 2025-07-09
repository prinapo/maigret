import { ref, defineComponent } from "vue";
// Mock bookDetailsConfig con i campi necessari per i test
vi.mock("config/bookDetailsConfig", () => ({
  bookDetailsConfig: [
    {
      id: "titolo",
      label: "Titolo",
      type: "string",
      readOnly: false,
      sectionOrder: 1,
    },
    {
      id: "editore",
      label: "Editore",
      type: "select",
      options: [],
      readOnly: false,
      sectionOrder: 2,
    },
    {
      id: "collana",
      label: "Collana",
      type: "select",
      options: [],
      readOnly: false,
      sectionOrder: 3,
    },
    {
      id: "numeroCollana",
      label: "Numero Collana",
      type: "string",
      readOnly: false,
      sectionOrder: 4,
    },
    {
      id: "autore",
      label: "Autore",
      type: "string",
      readOnly: false,
      sectionOrder: 5,
    },
    {
      id: "traduttore",
      label: "Traduttore",
      type: "string",
      readOnly: false,
      sectionOrder: 6,
    },
    {
      id: "edizioni",
      label: "Edizioni",
      type: "array",
      readOnly: false,
      sectionOrder: 7,
    },
    {
      id: "tags",
      label: "Tags",
      type: "array",
      readOnly: false,
      sectionOrder: 8,
    },
    {
      id: "annoPubblicazione",
      label: "Anno Pubblicazione",
      type: "select",
      options: [],
      readOnly: false,
      sectionOrder: 9,
    },
    {
      id: "lingua",
      label: "Lingua",
      type: "select",
      options: [],
      readOnly: false,
      sectionOrder: 10,
    },
    {
      id: "annoScrittura",
      label: "Anno Scrittura",
      type: "string",
      readOnly: false,
      sectionOrder: 11,
    },
    {
      id: "ISBN",
      label: "ISBN",
      type: "string",
      readOnly: false,
      sectionOrder: 12,
    },
    {
      id: "raccolta",
      label: "Raccolta",
      type: "string",
      readOnly: false,
      sectionOrder: 13,
    },
    {
      id: "contiene",
      label: "Contiene",
      type: "string",
      readOnly: false,
      sectionOrder: 14,
    },
    {
      id: "confermato",
      label: "Confermato",
      type: "boolean",
      readOnly: false,
      sectionOrder: 15,
    },
  ],
}));
// Stub Quasar con classi reali per marker test
vi.mock("quasar", () => ({
  QTable: defineComponent({
    name: "QTable",
    template: '<div class="q-table"><slot /></div>',
  }),
  QChip: defineComponent({
    name: "QChip",
    template: '<div class="q-chip"><slot /></div>',
  }),
  QBadge: defineComponent({
    name: "QBadge",
    template: '<div class="q-badge"><slot /></div>',
  }),
  QToggle: defineComponent({
    name: "QToggle",
    template: '<div class="q-toggle"></div>',
  }),
  QSelect: defineComponent({
    name: "QSelect",
    template: '<div class="q-select"><slot /></div>',
  }),
  QInput: defineComponent({
    name: "QInput",
    template: '<div class="q-input"><slot /></div>',
  }),
  QIcon: defineComponent({ name: "QIcon", template: '<i class="q-icon"></i>' }),
  QSpinner: defineComponent({
    name: "QSpinner",
    template: '<div class="q-spinner"></div>',
  }),
  QBtn: defineComponent({
    name: "QBtn",
    template: '<button class="q-btn"><slot /></button>',
  }),
  QDialog: defineComponent({
    name: "QDialog",
    template: '<div class="q-dialog"><slot /></div>',
  }),
  QCard: defineComponent({
    name: "QCard",
    template: '<div class="q-card"><slot /></div>',
  }),
  QCardSection: defineComponent({
    name: "QCardSection",
    template: '<div class="q-card-section"><slot /></div>',
  }),
  QCardActions: defineComponent({
    name: "QCardActions",
    template: '<div class="q-card-actions"><slot /></div>',
  }),
  Notify: { create: vi.fn() },
}));

vi.mock("stores/userStore", () => ({
  useUserStore: () => ({
    hasPermission: () => false,
    settings: ref({}),
    $patch: vi.fn(),
    $reset: vi.fn(),
  }),
}));

import { mount, flushPromises } from "@vue/test-utils";
import { createTestingPinia } from "@pinia/testing";
import BookDetails from "components/BookDetails.vue";

const bookMock = {
  id: "book-1",
  titolo: "Il titolo",
  editore: "Einaudi",
  collana: "Narrativa",
  numeroCollana: "12",
  autore: "Simenon",
  traduttore: "Mario Rossi",
  edizioni: [
    { uuid: "ed1", anno: 1950, posseduto: true },
    { uuid: "ed2", anno: 1952, posseduto: false },
  ],
  tags: ["uno", "due"],
  annoPubblicazione: "1960",
  lingua: "it",
  annoScrittura: "1958",
  ISBN: "1234567890",
  raccolta: "Gialli",
  contiene: "Racconto breve",
  confermato: true,
  deleted: false,
  images: [{ name: "img1.jpg" }],
  defaultImageName: "img1.jpg",
  posseduto: true,
  deletedBy: "admin@test.com",
  deletedAt: "2022-01-01T00:00:00Z",
};

function mountWithStores(book = bookMock) {
  const pinia = createTestingPinia({
    initialState: {
      bibliografia: { bibliografia: [book] },
    },
    stubActions: false,
  });
  return mount(BookDetails, {
    global: {
      plugins: [pinia],
      mocks: { $t: (msg) => msg },
    },
    props: { bookId: book.id },
  });
}

describe("BookDetails.vue non-admin", () => {
  it("mostra solo i campi non-readOnly valorizzati se non admin", async () => {
    const wrapper = mountWithStores();
    await flushPromises();
    // Verifica che non ci sia la sezione extra
    expect(wrapper.html()).not.toContain("Campi extra non configurati");
  });

  it("mostra badge per boolean se non editabile", async () => {
    const book = { ...bookMock, confermato: true };
    const wrapper = mountWithStores(book);
    await flushPromises();
    expect(wrapper.find(".q-badge").exists()).toBe(true);
  });

  // Altri test non-admin qui...
});
